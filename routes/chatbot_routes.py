from flask import Blueprint, request, jsonify
import requests
import json
import re
from datetime import datetime
from models.maintenance import MaintenanceRequest
from models.property import Property
from models.tenant import Tenant
from models.vendor import Vendor
from config import db
from routes.auth_routes import token_required
from utils.tenant_utils import get_comprehensive_tenant_info

chatbot_bp = Blueprint('chatbot_bp', __name__)

class OllamaService:
    def __init__(self, base_url="http://localhost:11434"):
        self.base_url = base_url
        self.model = "llama3.2"
    
    def chat(self, message, context=None):
        """Send a message to Ollama and get response"""
        try:
            payload = {
                "model": self.model,
                "prompt": message,
                "stream": False,
                "context": context
            }
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            return {
                "response": result.get("response", ""),
                "context": result.get("context", [])
            }
        except requests.exceptions.RequestException as e:
            print(f"Ollama API error: {e}")
            return {
                "response": "I'm having trouble connecting to the AI service. Please try again later.",
                "context": context or []
            }

class MaintenanceRequestExtractor:
    def __init__(self):
        self.ollama = OllamaService()
    
    def extract_maintenance_details(self, conversation_history):
        """Extract maintenance request details from conversation"""
        
        # Create a prompt for the AI to extract structured data
        extraction_prompt = f"""
Based on the following conversation between a tenant and a chatbot, extract the maintenance request details in JSON format.

Conversation:
{conversation_history}

Please extract the following information and return ONLY a valid JSON object:
{{
    "request_title": "Brief title of the issue",
    "request_description": "Detailed description of the problem",
    "priority": "low|medium|high|urgent",
    "tenant_notes": "Any additional notes from tenant",
    "location_details": "Specific location within property (room, area, etc.)",
    "vendor_type": "carpenter|electrician|plumber|pest_control|hvac|general"
}}

Rules for vendor_type classification:
- electrician: electrical issues, wiring, outlets, switches, lights, electrical appliances, power problems
- plumber: plumbing, water leaks, pipes, drains, faucets, toilets, water heaters, sewage
- carpenter: doors, windows, flooring, cabinets, shelving, wooden fixtures, drywall
- hvac: heating, cooling, air conditioning, furnace, HVAC system, temperature control, ventilation
- pest_control: insects, rodents, bugs, pests, extermination, infestation
- general: painting, general repairs, cleaning, landscaping, or unclear issues

General rules:
- If priority is not mentioned, default to "medium"
- Make the description detailed and clear
- If location is mentioned, include it in the description
- Analyze the issue description carefully to determine the most appropriate vendor type
- Only return valid JSON, no other text

JSON:
"""

        result = self.ollama.chat(extraction_prompt)
        
        try:
            # Extract JSON from the response
            response_text = result["response"].strip()
            
            # Try to find JSON in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                return json.loads(json_str)
            else:
                # Fallback if no JSON found
                return self._fallback_extraction(conversation_history)
                
        except (json.JSONDecodeError, Exception) as e:
            print(f"JSON extraction error: {e}")
            return self._fallback_extraction(conversation_history)
    
    def _fallback_extraction(self, conversation_history):
        """Fallback method for basic extraction"""
        # Simple keyword-based vendor type detection as fallback
        vendor_type = self._simple_vendor_classification(conversation_history)
        
        return {
            "request_title": "Maintenance Request from Chat",
            "request_description": f"Issue reported via chatbot: {conversation_history}",
            "priority": "medium",
            "tenant_notes": "Submitted via AI chatbot",
            "location_details": "",
            "vendor_type": vendor_type
        }
    
    def _simple_vendor_classification(self, text):
        """Simple keyword-based vendor classification as fallback"""
        text_lower = text.lower()
        
        # Electrical keywords
        if any(keyword in text_lower for keyword in ['wiring', 'electrical', 'outlet', 'switch', 'light', 'power', 'electric', 'sparks', 'circuit']):
            return 'electrician'
        
        # Plumbing keywords
        if any(keyword in text_lower for keyword in ['water', 'leak', 'pipe', 'drain', 'faucet', 'toilet', 'plumbing', 'sewage', 'shower', 'bath']):
            return 'plumber'
        
        # HVAC keywords
        if any(keyword in text_lower for keyword in ['heating', 'cooling', 'hvac', 'air conditioning', 'furnace', 'temperature', 'ac', 'heat']):
            return 'hvac'
        
        # Carpenter keywords  
        if any(keyword in text_lower for keyword in ['door', 'window', 'floor', 'cabinet', 'wood', 'drywall', 'wall', 'ceiling']):
            return 'carpenter'
        
        # Pest control keywords
        if any(keyword in text_lower for keyword in ['pest', 'bug', 'insect', 'rodent', 'mice', 'rat', 'ant', 'cockroach', 'exterminate']):
            return 'pest_control'
        
        # Default to general
        return 'general'

class IntelligentVendorAssigner:
    """Handles automatic vendor assignment based on issue type"""
    
    def __init__(self):
        pass
    
    def find_suitable_vendors(self, vendor_type, property_location=None):
        """Find vendors of the specified type"""
        try:
            # Query vendors by type and active status
            vendors = Vendor.query.filter_by(
                vendor_type=vendor_type,
                is_active=True
            ).all()
            
            # For now, return all matching vendors
            # In the future, could add location-based filtering, ratings, availability, etc.
            return vendors
            
        except Exception as e:
            print(f"Error finding vendors: {e}")
            return []
    
    def auto_assign_vendor(self, maintenance_request, vendor_type):
        """Automatically assign a vendor to a maintenance request"""
        try:
            # Find suitable vendors
            suitable_vendors = self.find_suitable_vendors(vendor_type)
            
            if not suitable_vendors:
                print(f"No {vendor_type} vendors found")
                return None
            
            # For now, assign to the first available vendor
            # In the future, could implement smart assignment based on:
            # - Workload balancing
            # - Location proximity
            # - Vendor ratings
            # - Availability schedule
            selected_vendor = suitable_vendors[0]
            
            # Assign vendor to the maintenance request
            maintenance_request.assigned_vendor_id = selected_vendor.id
            maintenance_request.status = MaintenanceRequest.STATUS_ASSIGNED
            
            db.session.commit()
            
            print(f"Auto-assigned {vendor_type} vendor: {selected_vendor.business_name}")
            
            return {
                'vendor_id': selected_vendor.id,
                'vendor_name': selected_vendor.business_name,
                'vendor_type': selected_vendor.vendor_type,
                'phone': selected_vendor.phone_number,
                'email': selected_vendor.email
            }
            
        except Exception as e:
            print(f"Error auto-assigning vendor: {e}")
            return None

@chatbot_bp.route('/chat', methods=['POST'])
@token_required
def chat_with_bot(current_user):
    """Handle chatbot conversation"""
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        context = data.get('context', [])
        conversation_history = data.get('conversation_history', [])
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Add current message to conversation
        conversation_history.append({
            'role': 'user',
            'message': user_message,
            'timestamp': datetime.now().isoformat()
        })
        
        # Create a context-aware prompt for the maintenance assistant
        system_prompt = """You are a helpful maintenance assistant for a property management system. 
Your job is to help tenants report maintenance issues in a friendly and efficient way.

Guidelines:
1. Ask clarifying questions to understand the maintenance issue
2. Be empathetic and helpful
3. Gather key information: what's broken, where it's located, urgency level, any safety concerns
4. Keep responses concise but thorough
5. If the tenant seems to have provided enough details, offer to submit the maintenance request

Key information to gather:
- What is the specific problem?
- Where is it located in the property?
- How urgent is it? (Is it an emergency, very important, or can it wait?)
- Are there any safety concerns?
- Any additional details that might help the repair person?

Always be professional, friendly, and solution-oriented."""

        # Combine system prompt with conversation context
        conversation_context = f"{system_prompt}\n\nConversation so far:\n"
        for msg in conversation_history[-5:]:  # Keep last 5 messages for context
            role = msg['role']
            message = msg['message']
            conversation_context += f"{role.capitalize()}: {message}\n"
        
        conversation_context += f"\nUser: {user_message}\nAssistant:"
        
        # Get AI response
        ollama = OllamaService()
        ai_result = ollama.chat(conversation_context, context)
        ai_response = ai_result["response"]
        
        # Add AI response to conversation
        conversation_history.append({
            'role': 'assistant',
            'message': ai_response,
            'timestamp': datetime.now().isoformat()
        })
        
        return jsonify({
            'response': ai_response,
            'context': ai_result["context"],
            'conversation_history': conversation_history
        })
        
    except Exception as e:
        print(f"Chatbot error: {e}")
        return jsonify({'error': 'An error occurred while processing your request'}), 500

@chatbot_bp.route('/submit-from-chat', methods=['POST'])
@token_required
def submit_maintenance_from_chat(current_user):
    """Extract maintenance request details from chat conversation and submit"""
    try:
        data = request.get_json()
        conversation_history = data.get('conversation_history', [])
        property_id = data.get('property_id')
        
        if not conversation_history:
            return jsonify({'error': 'No conversation history provided'}), 400
        
        if not property_id:
            return jsonify({'error': 'Property ID is required'}), 400
        
        # Convert conversation to text
        conversation_text = ""
        for msg in conversation_history:
            role = msg.get('role', 'unknown')
            message = msg.get('message', '')
            conversation_text += f"{role.capitalize()}: {message}\n"
        
        # Extract maintenance details using AI
        extractor = MaintenanceRequestExtractor()
        extracted_details = extractor.extract_maintenance_details(conversation_text)
        
        # Ensure vendor_type is always present - use fallback if missing
        if 'vendor_type' not in extracted_details or not extracted_details['vendor_type']:
            extracted_details['vendor_type'] = extractor._simple_vendor_classification(conversation_text)
        
        # Find tenant for this user and property
        tenant = Tenant.query.filter_by(
            property_id=property_id
        ).filter(
            Tenant.email == current_user.email
        ).first()
        
        if not tenant:
            return jsonify({'error': 'Tenant not found for this property'}), 404
        
        # Create maintenance request with extracted details
        maintenance_request = MaintenanceRequest(
            tenant_id=tenant.id,
            property_id=property_id,
            request_title=extracted_details.get('request_title', 'Maintenance Request from Chat'),
            request_description=extracted_details.get('request_description', conversation_text),
            priority=extracted_details.get('priority', 'medium'),
            status=MaintenanceRequest.STATUS_PENDING,
            tenant_notes=f"Submitted via AI chatbot. {extracted_details.get('tenant_notes', '')}",
            request_date=datetime.now().date(),
            vendor_type_needed=extracted_details.get('vendor_type', 'general')
        )
        
        db.session.add(maintenance_request)
        db.session.commit()
        
        # Get the vendor type from extracted details
        vendor_type = extracted_details.get('vendor_type', 'general')
        assigned_vendor_info = None
        
        # Attempt automatic vendor assignment if vendor type is identified
        if vendor_type and vendor_type != 'general':
            print(f"Attempting to auto-assign {vendor_type} vendor...")
            assigner = IntelligentVendorAssigner()
            assigned_vendor_info = assigner.auto_assign_vendor(maintenance_request, vendor_type)
        
        # Prepare response with comprehensive tenant information
        tenant_info = get_comprehensive_tenant_info(tenant)
        
        response_data = {
            'message': 'Maintenance request submitted successfully!',
            'request_id': maintenance_request.id,
            'extracted_details': extracted_details,
            'vendor_type_detected': vendor_type,
            'tenant_info': tenant_info
        }
        
        # Add vendor assignment info if successful
        if assigned_vendor_info:
            response_data['auto_assigned_vendor'] = assigned_vendor_info
            response_data['message'] = f'Maintenance request submitted and automatically assigned to {assigned_vendor_info["vendor_name"]} ({vendor_type})!'
        elif vendor_type != 'general':
            response_data['assignment_note'] = f'No available {vendor_type} vendors found. Request will be manually assigned.'
        
        return jsonify(response_data), 201
        
    except Exception as e:
        print(f"Submit maintenance error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to submit maintenance request'}), 500

@chatbot_bp.route('/ollama-status', methods=['GET'])
def check_ollama_status():
    """Check if Ollama service is running"""
    try:
        ollama = OllamaService()
        response = requests.get(f"{ollama.base_url}/api/tags", timeout=5)
        
        if response.status_code == 200:
            models = response.json().get('models', [])
            llama_available = any('llama3.2' in model.get('name', '') for model in models)
            
            return jsonify({
                'status': 'running',
                'models_available': len(models),
                'llama3_2_available': llama_available,
                'url': ollama.base_url
            })
        else:
            return jsonify({'status': 'error', 'message': 'Ollama API not responding'}), 503
            
    except requests.exceptions.RequestException:
        return jsonify({
            'status': 'offline', 
            'message': 'Ollama service is not running. Please start Ollama first.'
        }), 503 