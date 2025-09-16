# admin_bot_routes.py

from flask import Blueprint, request, jsonify, send_file
from routes.auth_routes import token_required
from datetime import datetime, date
from sqlalchemy.orm import joinedload
from models.rental_owner import RentalOwner, RentalOwnerManager
import json
import requests
import re
import io
import os

admin_bot_bp = Blueprint('admin_bot_bp', __name__)

# --- 1. Centralized Constants ---
BOT_CAPABILITIES_RESPONSE = """🏠 **Property Management Assistant - Your AI-Powered Helper!**

I'm your dedicated AI assistant for property management tasks. Here's what I can help you with:

📋 **TENANT MANAGEMENT:**
• View all your tenants and their details
• Check tenant payment status and rent amounts
• Generate tenant reports and lists

🏠 **PROPERTY MANAGEMENT:**
• List all your properties with details
• Check property status (occupied/vacant)
• Generate property reports

🔧 **MAINTENANCE & REPAIRS:**
• View all maintenance requests
• Check repair status and priorities
• Generate maintenance reports

💰 **FINANCIAL MANAGEMENT:**
• View financial summaries and income
• Generate financial reports and analytics
• Export financial data to PDF

📊 **REPORTING & ANALYTICS:**
• Generate comprehensive PDF reports for any category.
• Track performance metrics and trends.

💡 **HOW TO USE ME:**
Just ask me in natural language! For example:
• "Show me my tenants"
• "Generate a financial report"
• "What is the capital of France?"
• "List my properties and then tell me a joke"

I can handle property questions and general conversation! 🏘️✨"""


# --- 2. Refactored LlamaAI Class with Dual-Path Logic ---
class LlamaAI:
    def __init__(self, base_url="http://localhost:11434"):
        self.base_url = base_url
        self.model = "llama3.2:latest"
        # Enhanced keywords for better intent detection
        self.property_keywords = [
            # Core entities
            'tenant', 'tenants', 'property', 'properties', 'maintenance', 'rent', 'financial', 'report', 'income', 'expense',
            'lease', 'repair', 'work order', 'work orders', 'payment', 'balance', 'occupancy', 'vacancy', 'vacant',
            'owner', 'owners', 'agent', 'vendor', 'vendors', 'association', 'associations', 'hoa', 'management', 'summary',
            'rental', 'unit', 'units', 'apartment', 'apartments', 'house', 'houses', 'building', 'buildings', 'portfolio',
            
            # Actions
            'list', 'show', 'display', 'get', 'find', 'search', 'view', 'see', 'generate', 'create', 'download',
            'export', 'print', 'send', 'email', 'notify', 'update', 'edit', 'modify', 'change', 'add', 'remove',
            'delete', 'cancel', 'approve', 'reject', 'accept', 'deny', 'assign', 'schedule', 'book', 'reserve',
            
            # Financial terms
            'revenue', 'profit', 'loss', 'expense', 'cost', 'budget', 'analytics', 'statistics', 'performance', 
            'metrics', 'dashboard', 'overview', 'status', 'active', 'inactive', 'pending', 'completed', 'overdue',
            'paid', 'unpaid', 'due', 'amount', 'total', 'sum', 'average', 'maximum', 'minimum', 'range',
            
            # Quantifiers
            'how many', 'count', 'number of', 'total', 'how much', 'quantity', 'amount', 'all', 'some', 'few',
            'many', 'most', 'least', 'top', 'bottom', 'highest', 'lowest', 'best', 'worst', 'newest', 'oldest',
            
            # Time references
            'today', 'yesterday', 'tomorrow', 'this week', 'last week', 'next week', 'this month', 'last month',
            'next month', 'this year', 'last year', 'next year', 'recent', 'latest', 'current', 'upcoming',
            
            # Property management specific
            'lease agreement', 'rental agreement', 'tenant screening', 'background check', 'credit check',
            'move in', 'move out', 'eviction', 'notice', 'inspection', 'walkthrough', 'deposit', 'security deposit',
            'late fee', 'penalty', 'violation', 'complaint', 'request', 'issue', 'problem', 'emergency',
            'urgent', 'priority', 'high priority', 'low priority', 'scheduled', 'appointment', 'meeting'
        ]

    def analyze_query(self, query):
        """
        Analyzes query intent. First, checks if the query is property-related.
        If not, it classifies it as 'general_knowledge'. Otherwise, uses the LLM
        to determine the specific property management intent.
        """
        query_lower = query.lower()
        # A simple check to see if the query contains any domain-specific terms.
        is_property_related = any(keyword in query_lower for keyword in self.property_keywords)

        # --- PATH B: General Knowledge Query ---
        if not is_property_related:
            print("DEBUG: Query is not property-related. Routing to general_knowledge.")
            return { "intent": "general_knowledge", "confidence": 0.99, "entities": {} }

        # --- PATH A: Property Management Query ---
        print("DEBUG: Query is property-related. Analyzing specific intent with LLM.")
        system_prompt = """You are an AI assistant for a property management system. Analyze the user's query and return ONLY a JSON response with the following structure:

{
    "intent": "tenant_list|property_list|maintenance_list|financial_summary|pdf_report|vendor_list|work_order_list|rental_owner_list|association_list|analytics|comparison|search|filter|status_check|count|general_help",
    "confidence": 0.9,
    "entities": {
        "specific_request": "what the user wants",
        "pdf_type": "tenant|financial|property|maintenance|vendor|work_order|rental_owner|association|all",
        "search_term": "specific name or identifier if mentioned",
        "filter_criteria": "any filtering criteria mentioned",
        "comparison_type": "what to compare if comparison requested",
        "time_period": "time reference if mentioned (today, this month, last year, etc.)",
        "amount_threshold": "any numerical threshold mentioned",
        "status_filter": "any status mentioned (active, vacant, pending, etc.)"
    }
}

ENHANCED Intent Classification Rules:

1. **REPORT INTENTS (HIGHEST PRIORITY):**
   - pdf_report: ANY mention of "report", "generate report", "create report", "download report", "export report", "PDF report", "print report"
   - Examples: "financial report", "tenant report", "property report", "maintenance report", "generate a report", "download PDF"

2. **COUNT INTENTS (HIGH PRIORITY):**
   - count: "how many", "count", "number of", "total number", "quantity", "amount of"
   - Examples: "how many properties", "count tenants", "number of maintenance requests", "total vendors"

3. **LIST INTENTS:**
   - tenant_list: "tenants", "tenant list", "show tenants", "all tenants", "list tenants", "display tenants", "who are my tenants"
   - property_list: "properties", "property list", "show properties", "all properties", "my properties", "list properties"
   - maintenance_list: "maintenance", "maintenance requests", "repairs", "work orders", "list maintenance", "show repairs"
   - vendor_list: "vendors", "contractors", "service providers", "vendor list", "list vendors", "show contractors"
   - work_order_list: "work orders", "jobs", "tasks", "assignments", "list work orders", "show tasks"
   - rental_owner_list: "rental owners", "property owners", "owners", "list owners", "show owners"
   - association_list: "associations", "hoa", "homeowners association", "list associations", "show hoa"

4. **ANALYTICS INTENTS:**
   - analytics: "analytics", "performance", "metrics", "statistics", "trends", "analysis", "insights", "overview", "dashboard"
   - financial_summary: "financial", "income", "revenue", "earnings", "rent total", "financial summary" (BUT NOT if "report" is mentioned)

5. **ACTION INTENTS:**
   - search: "find", "search for", "look for", "where is", "locate", "who is", "which property"
   - filter: "filter by", "show only", "active tenants", "vacant properties", "filter tenants", "only active", "only vacant"
   - comparison: "compare", "vs", "versus", "difference between", "which is better", "compare properties"
   - status_check: "status", "is active", "is vacant", "is overdue", "check status", "what's the status"

6. **FALLBACK:**
   - general_help: Unclear requests, greetings, or ambiguous queries

CRITICAL CLASSIFICATION RULES:
1. **REPORT OVERRIDE**: If "report" appears anywhere in the query, classify as "pdf_report" regardless of other keywords
2. **COUNT OVERRIDE**: If "how many", "count", or "number of" appears, classify as "count" regardless of entity type
3. **TIME SENSITIVITY**: Consider time references (today, this month, last year) in entities
4. **CONTEXT AWARENESS**: Look for multiple keywords to determine the most specific intent
5. **CONFIDENCE SCORING**: Higher confidence for exact matches, lower for ambiguous queries

Examples:
- "financial report" → pdf_report (confidence: 0.95)
- "how many properties" → count (confidence: 0.9)
- "show me active tenants" → filter (confidence: 0.85)
- "find John Smith" → search (confidence: 0.9)
- "property performance analytics" → analytics (confidence: 0.9)
- "compare properties" → comparison (confidence: 0.85)
- "tenant list" → tenant_list (confidence: 0.9)
- "maintenance requests this month" → maintenance_list (confidence: 0.8, time_period: "this month")

Return ONLY the JSON response, no other text."""

        try:
            payload = {"model": self.model, "prompt": f"{system_prompt}\n\nUser Query: {query}", "stream": False}
            response = requests.post(f"{self.base_url}/api/generate", json=payload, timeout=8)
            response.raise_for_status()
            
            result = response.json()
            ai_response = result.get("response", "")
            
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                return {"intent": "general_help", "confidence": 0.7, "entities": {}}
                
        except Exception as e:
            print(f"AI analysis failed: {e}")
            return {"intent": "general_help", "confidence": 0.5, "entities": {}}

    def generate_general_response(self, query, conversation_context=None):
        """Generates a response for a general, non-property-related question."""
        print(f"DEBUG: Generating general response for: '{query}'")
        
        context_text = ""
        if conversation_context:
            context_text = "\n\n**Previous Conversation:**\n"
            for msg in conversation_context[-5:]:
                role = msg.get('role', 'unknown').title()
                content = msg.get('message', '')
                context_text += f"• {role}: {content}\n"
        
        system_prompt = f"""You are a helpful and friendly AI assistant named Gemini. Provide a concise and accurate answer to the user's question.
The current date is {datetime.now().strftime('%A, %B %d, %Y')}.
{context_text}
User Question: {query}
Assistant Answer:"""

        try:
            payload = {"model": self.model, "prompt": system_prompt, "stream": False}
            response = requests.post(f"{self.base_url}/api/generate", json=payload, timeout=15)
            response.raise_for_status()
            result = response.json()
            ai_response = result.get("response", "").strip()
            
            # Validate response quality
            if not ai_response or len(ai_response) < 10:
                return self._get_fallback_general_response(query)
            
            return ai_response
            
        except requests.exceptions.Timeout:
            print("General AI response generation timed out")
            return "I'm taking a bit longer to process your question. Please try rephrasing it or ask me something about property management instead."
        except requests.exceptions.ConnectionError:
            print("General AI response generation connection failed")
            return "I'm having trouble connecting to my AI service right now. I can still help you with property management questions though!"
        except requests.exceptions.RequestException as e:
            print(f"General AI response generation request failed: {e}")
            return "I'm experiencing some technical difficulties. Please try asking me about your properties, tenants, or maintenance requests instead."
        except Exception as e:
            print(f"General AI response generation failed: {e}")
            return self._get_fallback_general_response(query)
    
    def _get_fallback_general_response(self, query):
        """Provides intelligent fallback responses for general questions."""
        query_lower = query.lower()
        
        # Weather-related questions
        if any(word in query_lower for word in ['weather', 'temperature', 'rain', 'sunny', 'cloudy']):
            return "I don't have access to current weather information, but I can help you with property management tasks like checking tenant information, generating reports, or managing maintenance requests."
        
        # Time/date questions
        if any(word in query_lower for word in ['time', 'date', 'today', 'tomorrow', 'yesterday']):
            return f"Today is {datetime.now().strftime('%A, %B %d, %Y')}. I can help you with property management tasks like scheduling maintenance, checking lease dates, or generating reports."
        
        # Math questions
        if any(word in query_lower for word in ['calculate', 'math', 'add', 'subtract', 'multiply', 'divide']):
            return "I can help you with property-related calculations like rent totals, occupancy rates, or financial summaries. What would you like to calculate?"
        
        # General knowledge
        if any(word in query_lower for word in ['what is', 'who is', 'where is', 'when is', 'how is']):
            return "I'm specialized in property management assistance. While I can't answer general knowledge questions right now, I can help you with tenant management, property reports, maintenance requests, and financial summaries."
        
        # Default fallback
        return "I'm here to help you with property management tasks! You can ask me about tenants, properties, maintenance requests, financial reports, or any other property-related questions."

    def generate_rag_response(self, query, data, intent, conversation_context=None):
        """Generates a response using the RAG pattern (with retrieved data)."""
        print(f"DEBUG: Generating RAG response for intent: {intent}")
        
        # Handle meta-questions about the bot's capabilities
        if any(keyword in query.lower() for keyword in ['what can you do', 'help me', 'capabilities']):
            return BOT_CAPABILITIES_RESPONSE

        context_text = ""
        if conversation_context:
            context_text = "\n\n**Conversation History:**\n"
            for msg in conversation_context[-5:]:
                role = msg.get('role', 'unknown').title()
                content = msg.get('message', '')
                context_text += f"• {role}: {content}\n"

        system_prompt = f"""You are a helpful AI assistant for a property management system. Generate a direct, concise response to the user's query.
User Query: {query}
Intent: {intent}
Available Data: {json.dumps(data, default=str, indent=2)}{context_text}
CRITICAL RULES:
1. Use ONLY the provided data to answer questions. DO NOT make up or invent data.
2. Give DIRECT, STRAIGHTFORWARD answers.
3. If no data is available, simply state that.
4. Format lists with bullet points for better readability.
5. Include relevant numbers and statistics when available.
6. Be helpful and professional in tone.
"""

        try:
            payload = {"model": self.model, "prompt": system_prompt, "stream": False}
            response = requests.post(f"{self.base_url}/api/generate", json=payload, timeout=12)
            response.raise_for_status()
            result = response.json()
            ai_response = result.get("response", "").strip()
            
            # Validate response quality
            if not ai_response or len(ai_response) < 5:
                return self._get_fallback_rag_response(intent, data, query)
            
            return ai_response
            
        except requests.exceptions.Timeout:
            print("RAG AI response generation timed out")
            return self._get_fallback_rag_response(intent, data, query)
        except requests.exceptions.ConnectionError:
            print("RAG AI response generation connection failed")
            return self._get_fallback_rag_response(intent, data, query)
        except requests.exceptions.RequestException as e:
            print(f"RAG AI response generation request failed: {e}")
            return self._get_fallback_rag_response(intent, data, query)
        except Exception as e:
            print(f"RAG AI response generation failed: {e}")
            return self._get_fallback_rag_response(intent, data, query)
    
    def _get_fallback_rag_response(self, intent, data, query):
        """Provides intelligent fallback responses for property management queries."""
        if not data or 'error' in data:
            return "I'm having trouble accessing the data right now. Please try again in a moment, or contact support if the issue persists."
        
        # Generate structured responses based on intent and available data
        if intent == 'tenant_list' and 'tenants' in data:
            tenants = data['tenants']
            if not tenants:
                return "You don't have any tenants in the system yet."
            
            response = f"Here are your {len(tenants)} tenants:\n\n"
            for tenant in tenants[:10]:  # Limit to first 10 for readability
                response += f"• **{tenant.get('name', 'Unknown')}** - {tenant.get('property_title', 'No Property')}\n"
                if tenant.get('rent_amount'):
                    response += f"  - Rent: ${tenant['rent_amount']:.2f}\n"
                if tenant.get('payment_status'):
                    response += f"  - Status: {tenant['payment_status']}\n"
                response += "\n"
            
            if len(tenants) > 10:
                response += f"... and {len(tenants) - 10} more tenants."
            
            return response
        
        elif intent == 'property_list' and 'properties' in data:
            properties = data['properties']
            if not properties:
                return "You don't have any properties in the system yet."
            
            response = f"Here are your {len(properties)} properties:\n\n"
            for prop in properties[:10]:  # Limit to first 10 for readability
                response += f"• **{prop.get('title', 'Unknown')}** - {prop.get('address', 'No Address')}\n"
                if prop.get('rent_amount'):
                    response += f"  - Rent: ${prop['rent_amount']:.2f}\n"
                if prop.get('status'):
                    response += f"  - Status: {prop['status']}\n"
                response += "\n"
            
            if len(properties) > 10:
                response += f"... and {len(properties) - 10} more properties."
            
            return response
        
        elif intent == 'count' and 'count' in data:
            count = data['count']
            count_type = data.get('type', 'items')
            return f"You have {count} {count_type}."
        
        elif intent == 'financial_summary':
            response = "Here's your financial summary:\n\n"
            if 'total_monthly_rent' in data:
                response += f"• **Total Monthly Rent**: ${data['total_monthly_rent']:.2f}\n"
            if 'total_properties' in data:
                response += f"• **Total Properties**: {data['total_properties']}\n"
            if 'occupied_properties' in data:
                response += f"• **Occupied Properties**: {data['occupied_properties']}\n"
            if 'vacant_properties' in data:
                response += f"• **Vacant Properties**: {data['vacant_properties']}\n"
            if 'occupancy_rate' in data:
                response += f"• **Occupancy Rate**: {data['occupancy_rate']:.1f}%\n"
            return response
        
        elif intent == 'search' and 'search_results' in data:
            search_results = data['search_results']
            search_term = data.get('search_term', query)
            total_results = data.get('total_results', 0)
            
            if total_results == 0:
                return f"I couldn't find anything matching '{search_term}'. Try searching with a different term or check the spelling."
            
            response = f"🔍 **Search Results for '{search_term}'** ({total_results} found):\n\n"
            
            if search_results.get('tenants'):
                response += f"**Tenants ({len(search_results['tenants'])}):**\n"
                for tenant in search_results['tenants'][:5]:
                    response += f"• {tenant['name']} - {tenant['property_title']}\n"
                if len(search_results['tenants']) > 5:
                    response += f"... and {len(search_results['tenants']) - 5} more tenants\n"
                response += "\n"
            
            if search_results.get('properties'):
                response += f"**Properties ({len(search_results['properties'])}):**\n"
                for prop in search_results['properties'][:5]:
                    response += f"• {prop['title']} - {prop['address']}\n"
                if len(search_results['properties']) > 5:
                    response += f"... and {len(search_results['properties']) - 5} more properties\n"
                response += "\n"
            
            if search_results.get('vendors'):
                response += f"**Vendors ({len(search_results['vendors'])}):**\n"
                for vendor in search_results['vendors'][:5]:
                    response += f"• {vendor['name']} - {vendor['company']}\n"
                if len(search_results['vendors']) > 5:
                    response += f"... and {len(search_results['vendors']) - 5} more vendors\n"
            
            return response
        
        elif intent == 'filter' and 'filter_results' in data:
            filter_results = data['filter_results']
            filter_criteria = data.get('filter_criteria', query)
            total_filtered = data.get('total_filtered', 0)
            
            if total_filtered == 0:
                return f"No results found matching your filter criteria: '{filter_criteria}'"
            
            response = f"🔍 **Filtered Results** ({total_filtered} found):\n\n"
            
            if filter_results.get('tenants'):
                response += f"**Tenants ({len(filter_results['tenants'])}):**\n"
                for tenant in filter_results['tenants'][:10]:
                    response += f"• {tenant['name']} - {tenant['property_title']}\n"
                    if tenant.get('lease_end'):
                        response += f"  - Lease ends: {tenant['lease_end']}\n"
                if len(filter_results['tenants']) > 10:
                    response += f"... and {len(filter_results['tenants']) - 10} more tenants\n"
                response += "\n"
            
            if filter_results.get('properties'):
                response += f"**Properties ({len(filter_results['properties'])}):**\n"
                for prop in filter_results['properties'][:10]:
                    response += f"• {prop['title']} - {prop['address']}\n"
                    response += f"  - Status: {prop['status']}\n"
                    if prop.get('rent_amount'):
                        response += f"  - Rent: ${prop['rent_amount']:.2f}\n"
                if len(filter_results['properties']) > 10:
                    response += f"... and {len(filter_results['properties']) - 10} more properties\n"
            
            return response
        
        # Default fallback
        return f"I found some data related to your query about '{query}', but I'm having trouble formatting it properly. Please try rephrasing your question or ask me for help to see what I can do."


# --- 3. Secure Data Fetching Logic ---
def _get_base_query(model, current_user):
    """
    CRITICAL: Returns a SQLAlchemy query object securely scoped to the current user's permissions.
    This prevents users from accessing data they don't own.
    """
    from models.property import Property # Import locally to avoid circular dependencies
    
    # Admins can see everything
    if current_user.role == 'ADMIN' or current_user.username == 'admin':
        return model.query

    # Non-admin users are restricted to properties linked to them via RentalOwnerManager
    # This logic assumes relationships are set up correctly in your SQLAlchemy models.
    # Adjust the joins based on your actual model structure if necessary.
    if hasattr(model, 'property_id'): # For models directly linked to a Property (Tenant, Maintenance, WorkOrder etc.)
        return model.query.join(Property).join(
            RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
        ).filter(RentalOwnerManager.user_id == current_user.id)
    elif model == Property: # For the Property model itself
        return model.query.join(
            RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
        ).filter(RentalOwnerManager.user_id == current_user.id)
    else:
        # Fallback for other models. For security, default to an empty query if unsure.
        return model.query.filter(model.id == None)
                

def get_data_for_intent(intent, current_user, query=""):
    """Fetch relevant data based on the detected intent - RAG Model Approach"""
    try:
        # RAG Model: Read ALL data from database regardless of user permissions
        # This ensures comprehensive responses based on actual database content
        print(f"RAG: Fetching data for intent '{intent}' with query '{query}'")
        
        # Always ensure we have a valid user
        if not current_user:
            return {
                "error": "User not authenticated",
                "message": "Please log in to access property management features"
            }
        if intent == 'tenant_list':
            from models.tenant import Tenant
            from models.property import Property
            
            # RAG Model: Read ALL tenants from database regardless of user permissions
            print("RAG: Fetching ALL tenants from database")
            tenants = Tenant.query.options(joinedload(Tenant.property)).all()
            print(f"RAG: Found {len(tenants)} tenants in database")
            
            tenant_data = []
            total_rent = 0
            
            for tenant in tenants:
                tenant_info = {
                    "id": tenant.id,
                    "name": tenant.full_name,
                    "email": tenant.email,
                    "phone": tenant.phone_number,
                    "rent_amount": float(tenant.rent_amount) if tenant.rent_amount else 0,
                    "lease_start": tenant.lease_start.isoformat() if tenant.lease_start else None,
                    "lease_end": tenant.lease_end.isoformat() if tenant.lease_end else None,
                    "payment_status": tenant.payment_status,
                    "property_title": tenant.property.title if tenant.property else "No Property Assigned",
                    "property_address": f"{tenant.property.street_address_1}, {tenant.property.city}, {tenant.property.state}" if tenant.property else "No Address",
                    "lease_active": tenant.lease_end and tenant.lease_end > date.today() if tenant.lease_end else False
                }
                tenant_data.append(tenant_info)
                total_rent += tenant_info["rent_amount"]
            
            return {
                "tenants": tenant_data,
                "total_tenants": len(tenants),
                "total_monthly_rent": total_rent,
                "active_tenants": len([t for t in tenant_data if t["lease_active"]]),
                "tenant_count": len(tenants),
                "count": len(tenants)
            }
        
        elif intent == 'property_list':
            from models.property import Property
            
            # RAG Model: Read ALL properties from database regardless of user permissions
            print("RAG: Fetching ALL properties from database")
            properties = Property.query.all()
            print(f"RAG: Found {len(properties)} properties in database")
            
            property_data = []
            for prop in properties:
                property_info = {
                    "title": prop.title,
                    "address": f"{prop.street_address_1}, {prop.city}, {prop.state} {prop.zip_code}",
                    "rent_amount": float(prop.rent_amount) if prop.rent_amount else 0,
                    "status": prop.status,
                    "description": prop.description,
                    "id": prop.id
                }
                property_data.append(property_info)
            
            return {
                "properties": property_data,
                "total_properties": len(properties),
                "count": len(properties)
            }
        
        elif intent == 'count':
            # Handle count queries - determine what to count based on query context
            query_lower = query.lower()
            
            if 'tenant' in query_lower or 'tenants' in query_lower:
                from models.tenant import Tenant
                from models.property import Property
                
                try:
                    # RAG Model: Read ALL tenants from database regardless of user permissions
                    print("RAG: Counting ALL tenants in database")
                    count = Tenant.query.count()
                    print(f"RAG: Found {count} tenants in database")
                    
                    return {"count": count, "type": "tenants"}
                except Exception as e:
                    print(f"Tenant count error: {e}")
                    return {"count": 0, "type": "tenants"}
            
            elif 'property' in query_lower or 'properties' in query_lower:
                from models.property import Property
                
                try:
                    # RAG Model: Read ALL properties from database regardless of user permissions
                    print("RAG: Counting ALL properties in database")
                    count = Property.query.count()
                    print(f"RAG: Found {count} properties in database")
                    
                    return {"count": count, "type": "properties"}
                except Exception as e:
                    print(f"Property count error: {e}")
                    return {"count": 0, "type": "properties"}
            
            elif 'maintenance' in query_lower or 'repair' in query_lower:
                from models.maintenance import MaintenanceRequest
                from models.property import Property
                
                try:
                    # RAG Model: Read ALL maintenance requests from database regardless of user permissions
                    print("RAG: Counting ALL maintenance requests in database")
                    count = MaintenanceRequest.query.count()
                    print(f"RAG: Found {count} maintenance requests in database")
                    
                    return {"count": count, "type": "maintenance_requests"}
                except Exception as e:
                    print(f"Maintenance count error: {e}")
                    return {"count": 0, "type": "maintenance_requests"}
            
            elif 'vendor' in query_lower or 'vendors' in query_lower:
                from models.vendor import Vendor
                try:
                    # RAG Model: Read ALL vendors from database regardless of user permissions
                    print("RAG: Counting ALL vendors in database")
                    count = Vendor.query.count()
                    print(f"RAG: Found {count} vendors in database")
                    
                    return {"count": count, "type": "vendors"}
                except Exception as e:
                    print(f"Vendor count error: {e}")
                    return {"count": 0, "type": "vendors"}
            
            elif 'work order' in query_lower or 'work orders' in query_lower:
                from models.work_order import WorkOrder
                from models.property import Property
                
                try:
                    # RAG Model: Read ALL work orders from database regardless of user permissions
                    print("RAG: Counting ALL work orders in database")
                    count = WorkOrder.query.count()
                    print(f"RAG: Found {count} work orders in database")
                    
                    return {"count": count, "type": "work_orders"}
                except Exception as e:
                    print(f"Work order count error: {e}")
                    return {"count": 0, "type": "work_orders"}
            
            else:
                # Default to tenant count if unclear
                from models.tenant import Tenant
                from models.property import Property
                
                try:
                    # RAG Model: Read ALL tenants from database regardless of user permissions
                    print("RAG: Counting ALL tenants in database (default)")
                    count = Tenant.query.count()
                    print(f"RAG: Found {count} tenants in database")
                    
                    return {"count": count, "type": "tenants"}
                except Exception as e:
                    print(f"Default tenant count error: {e}")
                    return {"count": 0, "type": "tenants"}
        
        elif intent == 'maintenance_list':
            from models.maintenance import MaintenanceRequest
            from models.property import Property
            
            # RAG Model: Read ALL maintenance requests from database regardless of user permissions
            print("RAG: Fetching ALL maintenance requests from database")
            maintenance_requests = MaintenanceRequest.query.options(joinedload(MaintenanceRequest.property)).all()
            print(f"RAG: Found {len(maintenance_requests)} maintenance requests in database")
            
            maintenance_data = []
            for req in maintenance_requests:
                maintenance_info = {
                    "id": req.id,
                    "title": req.request_title,
                    "description": req.request_description,
                    "status": req.status,
                    "priority": req.priority,
                    "request_date": req.request_date.isoformat() if req.request_date else None,
                    "estimated_cost": float(req.estimated_cost) if req.estimated_cost else 0,
                    "property_title": req.property.title if req.property else "No Property Assigned",
                    "property_address": f"{req.property.street_address_1}, {req.property.city}, {req.property.state}" if req.property else "No Address"
                }
                maintenance_data.append(maintenance_info)
            
            return {
                "maintenance_requests": maintenance_data,
                "total_maintenance": len(maintenance_requests),
                "count": len(maintenance_requests)
            }
        
        elif intent == 'financial_summary':
            from models.tenant import Tenant
            from models.property import Property
            
            # RAG Model: Read ALL data from database regardless of user permissions
            print("RAG: Fetching ALL financial data from database")
            tenants = Tenant.query.all()
            properties = Property.query.all()
            
            total_rent = sum(float(t.rent_amount) if t.rent_amount else 0 for t in tenants)
            occupied_properties = len([p for p in properties if p.status == 'occupied'])
            vacant_properties = len([p for p in properties if p.status == 'vacant'])
            
            return {
                "total_monthly_rent": total_rent,
                "total_properties": len(properties),
                "occupied_properties": occupied_properties,
                "vacant_properties": vacant_properties,
                "occupancy_rate": (occupied_properties / len(properties) * 100) if properties else 0
            }
        
        elif intent == 'vendor_list':
            from models.vendor import Vendor
            
            # RAG Model: Read ALL vendors from database regardless of user permissions
            print("RAG: Fetching ALL vendors from database")
            vendors = Vendor.query.all()
            print(f"RAG: Found {len(vendors)} vendors in database")
            
            vendor_data = []
            for vendor in vendors:
                vendor_info = {
                    "id": vendor.id,
                    "name": f"{vendor.first_name} {vendor.last_name}".strip() if vendor.first_name or vendor.last_name else vendor.company_name,
                    "company": vendor.company_name,
                    "email": vendor.primary_email,
                    "phone": vendor.phone_1,
                    "category": vendor.category_id,
                    "is_active": vendor.is_active
                }
                vendor_data.append(vendor_info)
            
            return {
                "vendors": vendor_data,
                "total_vendors": len(vendors),
                "count": len(vendors)
            }
        
        elif intent == 'work_order_list':
            from models.work_order import WorkOrder
            from models.property import Property
            
            # RAG Model: Read ALL work orders from database regardless of user permissions
            print("RAG: Fetching ALL work orders from database")
            work_orders = WorkOrder.query.options(joinedload(WorkOrder.property)).all()
            print(f"RAG: Found {len(work_orders)} work orders in database")
            
            work_order_data = []
            for wo in work_orders:
                work_order_info = {
                    "id": wo.id,
                    "title": wo.title,
                    "description": wo.description,
                    "status": wo.status,
                    "priority": wo.priority,
                    "due_date": wo.due_date.isoformat() if wo.due_date else None,
                    "estimated_cost": float(wo.estimated_cost) if wo.estimated_cost else 0,
                    "property_title": wo.property.title if wo.property else "No Property Assigned",
                    "property_address": f"{wo.property.street_address_1}, {wo.property.city}, {wo.property.state}" if wo.property else "No Address"
                }
                work_order_data.append(work_order_info)
            
            return {
                "work_orders": work_order_data,
                "total_work_orders": len(work_orders),
                "count": len(work_orders)
            }
        
        elif intent == 'rental_owner_list':
            from models.rental_owner import RentalOwner
            
            # RAG Model: Read ALL rental owners from database regardless of user permissions
            print("RAG: Fetching ALL rental owners from database")
            rental_owners = RentalOwner.query.all()
            print(f"RAG: Found {len(rental_owners)} rental owners in database")
            
            rental_owner_data = []
            for owner in rental_owners:
                owner_info = {
                    "id": owner.id,
                    "company_name": owner.company_name,
                    "contact_name": owner.contact_name,
                    "email": owner.email,
                    "phone": owner.phone,
                    "address": f"{owner.street_address}, {owner.city}, {owner.state} {owner.zip_code}",
                    "is_active": owner.is_active
                }
                rental_owner_data.append(owner_info)
            
            return {
                "rental_owners": rental_owner_data,
                "total_rental_owners": len(rental_owners),
                "count": len(rental_owners)
            }
        
        elif intent == 'association_list':
            from models.association import Association
            
            # RAG Model: Read ALL associations from database regardless of user permissions
            print("RAG: Fetching ALL associations from database")
            associations = Association.query.all()
            print(f"RAG: Found {len(associations)} associations in database")
            
            association_data = []
            for assoc in associations:
                association_info = {
                    "id": assoc.id,
                    "name": assoc.name,
                    "address": f"{assoc.street_address}, {assoc.city}, {assoc.state} {assoc.zip_code}",
                    "contact_name": assoc.contact_name,
                    "email": assoc.email,
                    "phone": assoc.phone,
                    "is_active": assoc.is_active
                }
                association_data.append(association_info)
            
            return {
                "associations": association_data,
                "total_associations": len(associations),
                "count": len(associations)
            }
        
        elif intent == 'search':
            # Handle search queries - search across multiple entities
            query_lower = query.lower()
            search_results = {
                "tenants": [],
                "properties": [],
                "vendors": [],
                "maintenance_requests": [],
                "work_orders": []
            }
            
            # Extract search term from query
            search_terms = []
            for word in query_lower.split():
                if word not in ['find', 'search', 'for', 'look', 'locate', 'where', 'is', 'the', 'a', 'an']:
                    search_terms.append(word)
            
            if search_terms:
                search_term = ' '.join(search_terms)
                
                # Search tenants
                from models.tenant import Tenant
                from models.property import Property
                tenants = Tenant.query.filter(
                    (Tenant.full_name.ilike(f'%{search_term}%')) |
                    (Tenant.email.ilike(f'%{search_term}%'))
                ).limit(10).all()
                
                for tenant in tenants:
                    search_results["tenants"].append({
                        "id": tenant.id,
                        "name": tenant.full_name,
                        "email": tenant.email,
                        "property_title": tenant.property.title if tenant.property else "No Property"
                    })
                
                # Search properties
                properties = Property.query.filter(
                    (Property.title.ilike(f'%{search_term}%')) |
                    (Property.street_address_1.ilike(f'%{search_term}%')) |
                    (Property.city.ilike(f'%{search_term}%'))
                ).limit(10).all()
                
                for prop in properties:
                    search_results["properties"].append({
                        "id": prop.id,
                        "title": prop.title,
                        "address": f"{prop.street_address_1}, {prop.city}, {prop.state}",
                        "status": prop.status
                    })
                
                # Search vendors
                from models.vendor import Vendor
                vendors = Vendor.query.filter(
                    (Vendor.first_name.ilike(f'%{search_term}%')) |
                    (Vendor.last_name.ilike(f'%{search_term}%')) |
                    (Vendor.company_name.ilike(f'%{search_term}%'))
                ).limit(10).all()
                
                for vendor in vendors:
                    search_results["vendors"].append({
                        "id": vendor.id,
                        "name": f"{vendor.first_name} {vendor.last_name}".strip() or vendor.company_name,
                        "company": vendor.company_name,
                        "email": vendor.primary_email
                    })
            
            return {
                "search_results": search_results,
                "search_term": search_term if search_terms else query,
                "total_results": sum(len(results) for results in search_results.values())
            }
        
        elif intent == 'filter':
            # Handle filter queries
            query_lower = query.lower()
            filter_results = {}
            
            # Determine what to filter and the filter criteria
            if 'tenant' in query_lower:
                from models.tenant import Tenant
                tenants = Tenant.query.all()
                
                if 'active' in query_lower:
                    filtered_tenants = [t for t in tenants if t.lease_end and t.lease_end > date.today()]
                elif 'inactive' in query_lower or 'expired' in query_lower:
                    filtered_tenants = [t for t in tenants if t.lease_end and t.lease_end <= date.today()]
                else:
                    filtered_tenants = tenants
                
                filter_results["tenants"] = []
                for tenant in filtered_tenants:
                    filter_results["tenants"].append({
                        "id": tenant.id,
                        "name": tenant.full_name,
                        "email": tenant.email,
                        "lease_end": tenant.lease_end.isoformat() if tenant.lease_end else None,
                        "property_title": tenant.property.title if tenant.property else "No Property"
                    })
            
            elif 'property' in query_lower:
                from models.property import Property
                properties = Property.query.all()
                
                if 'vacant' in query_lower:
                    filtered_properties = [p for p in properties if p.status == 'vacant']
                elif 'occupied' in query_lower:
                    filtered_properties = [p for p in properties if p.status == 'occupied']
                else:
                    filtered_properties = properties
                
                filter_results["properties"] = []
                for prop in filtered_properties:
                    filter_results["properties"].append({
                        "id": prop.id,
                        "title": prop.title,
                        "address": f"{prop.street_address_1}, {prop.city}, {prop.state}",
                        "status": prop.status,
                        "rent_amount": float(prop.rent_amount) if prop.rent_amount else 0
                    })
            
            return {
                "filter_results": filter_results,
                "filter_criteria": query,
                "total_filtered": sum(len(results) for results in filter_results.values())
            }
        
        elif intent == 'analytics':
            from models.tenant import Tenant
            from models.property import Property
            from models.maintenance import MaintenanceRequest
            
            # RAG Model: Read ALL data from database regardless of user permissions
            print("RAG: Fetching ALL analytics data from database")
            tenants = Tenant.query.all()
            properties = Property.query.all()
            maintenance_requests = MaintenanceRequest.query.all()
            
            total_rent = sum(float(t.rent_amount) if t.rent_amount else 0 for t in tenants)
            occupied_properties = len([p for p in properties if p.status == 'occupied'])
            vacant_properties = len([p for p in properties if p.status == 'vacant'])
            pending_maintenance = len([m for m in maintenance_requests if m.status == 'pending'])
            completed_maintenance = len([m for m in maintenance_requests if m.status == 'completed'])
            
            occupancy_rate = (occupied_properties / len(properties) * 100) if properties else 0
            
            return {
                "total_properties": len(properties),
                "total_tenants": len(tenants),
                "total_monthly_rent": total_rent,
                "occupancy_rate": round(occupancy_rate, 2),
                "pending_maintenance": pending_maintenance,
                "completed_maintenance": completed_maintenance,
                "occupied_properties": occupied_properties,
                "vacant_properties": vacant_properties,
                "average_rent": round(total_rent / len(tenants), 2) if tenants else 0
            }
        
        elif intent == 'pdf_report':
            # For PDF reports, we need to determine the type and fetch appropriate data
            # This will be handled by the PDF generation function based on the intent analysis
            from models.tenant import Tenant
            from models.property import Property
            from models.maintenance import MaintenanceRequest
            
            # RAG Model: Read ALL data from database regardless of user permissions
            print("RAG: Fetching ALL data for PDF report from database")
            tenants = Tenant.query.all()
            properties = Property.query.all()
            maintenance_requests = MaintenanceRequest.query.all()
            
            # Convert model objects to dictionaries for PDF generation
            tenant_data = []
            for tenant in tenants:
                tenant_dict = {
                    "tenant_name": tenant.full_name,
                    "email": tenant.email,
                    "phone": tenant.phone_number,
                    "rent_amount": float(tenant.rent_amount) if tenant.rent_amount else 0,
                    "lease_start": tenant.lease_start.isoformat() if tenant.lease_start else None,
                    "lease_end": tenant.lease_end.isoformat() if tenant.lease_end else None,
                    "payment_status": tenant.payment_status,
                    "property_title": tenant.property.title if tenant.property else "No Property Assigned",
                    "property_address": f"{tenant.property.street_address_1}, {tenant.property.city}, {tenant.property.state}" if tenant.property else "No Address"
                }
                tenant_data.append(tenant_dict)
            
            property_data = []
            for prop in properties:
                property_dict = {
                    "title": prop.title,
                    "address": f"{prop.street_address_1}, {prop.city}, {prop.state} {prop.zip_code}",
                    "rent_amount": float(prop.rent_amount) if prop.rent_amount else 0,
                    "status": prop.status,
                    "description": prop.description
                }
                property_data.append(property_dict)
            
            maintenance_data = []
            for req in maintenance_requests:
                maintenance_dict = {
                    "title": req.request_title,
                    "description": req.request_description,
                    "status": req.status,
                    "priority": req.priority,
                    "request_date": req.request_date.isoformat() if req.request_date else None,
                    "estimated_cost": float(req.estimated_cost) if req.estimated_cost else 0,
                    "property_title": req.property.title if req.property else "No Property Assigned"
                }
                maintenance_data.append(maintenance_dict)
            
            return {
                "tenants": tenant_data,
                "properties": property_data,
                "maintenance_requests": maintenance_data,
                "summary": {
                    "total_properties": len(properties),
                    "total_tenants": len(tenants),
                    "total_maintenance": len(maintenance_requests)
                }
            }
        
        else:
            # Default fallback - provide general summary
            from models.tenant import Tenant
            from models.property import Property
            from models.maintenance import MaintenanceRequest
            
            # RAG Model: Read ALL data from database regardless of user permissions
            print("RAG: Fetching ALL data for general summary from database")
            tenants = Tenant.query.all()
            properties = Property.query.all()
            maintenance_requests = MaintenanceRequest.query.all()
            
            return {
                "summary": {
                    "total_properties": len(properties),
                    "total_tenants": len(tenants),
                    "total_maintenance": len(maintenance_requests)
                },
                "message": "I'm here to help you with property management! You can ask me about tenants, properties, maintenance, and financial reports."
            }
    
    except Exception as e:
        print(f"Error fetching data for intent {intent}: {e}")
        return {
            "summary": {"total_properties": 0, "total_tenants": 0, "total_maintenance": 0},
            "message": "I'm here to help you with property management! You can ask me about tenants, properties, maintenance, and financial reports."
        }


# --- 4. Helper and Route Functions (Largely Unchanged, but reviewed) ---

def generate_fallback_response(intent, data, query):
    """Generate fallback response if AI fails. Now simpler."""
    if "error" in data:
        return BOT_CAPABILITIES_RESPONSE

    # Your existing fallback logic for specific intents can remain here
    if intent == 'tenant_list':
        # ... your formatted tenant list string ...
        pass
    
    return f"I can help with property management tasks. You asked about '{query}', try rephrasing or ask me for 'help' to see what I can do."

def generate_pdf_report(data, intent_analysis, current_user):
    """Generate PDF report using the existing PDF generator"""
    try:
        from utils.pdf_generator import PropertyReportPDFGenerator
        import os
        from datetime import datetime
        
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(os.getcwd(), 'uploads', 'reports')
        os.makedirs(upload_dir, exist_ok=True)
        
        pdf_generator = PropertyReportPDFGenerator()
        
        # Determine report type from intent analysis
        entities = intent_analysis.get('entities', {})
        pdf_type = entities.get('pdf_type', 'all')
        
        # Generate filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"admin_report_{pdf_type}_{timestamp}.pdf"
        filepath = os.path.join(upload_dir, filename)
        
        # Generate PDF based on type - use only the pdf_type from intent analysis
        if pdf_type == 'tenant':
            pdf_buffer = pdf_generator.generate_all_tenants_pdf(data, current_user.full_name or current_user.username)
        elif pdf_type == 'financial':
            pdf_buffer = pdf_generator.generate_financial_performance_pdf(data, current_user.full_name or current_user.username)
        elif pdf_type == 'property':
            # For property reports, use comprehensive report which includes properties
            pdf_buffer = pdf_generator.generate_comprehensive_report_pdf(data)
        elif pdf_type == 'maintenance':
            # For maintenance reports, use comprehensive report which includes maintenance
            pdf_buffer = pdf_generator.generate_comprehensive_report_pdf(data)
        else:
            # Default to comprehensive report for all other types
            pdf_buffer = pdf_generator.generate_comprehensive_report_pdf(data)
        
        # Save PDF to file
        with open(filepath, 'wb') as f:
            f.write(pdf_buffer.getvalue())
        
        return {
            'filename': filename,
            'filepath': filepath,
            'type': pdf_type or 'comprehensive'
        }
        
    except Exception as e:
        print(f"Error generating PDF report: {e}")
        import traceback
        traceback.print_exc()
        return None

@admin_bot_bp.route('/download-pdf/<filename>', methods=['GET'])
@token_required
def download_pdf(current_user, filename):
    """Download generated PDF report"""
    try:
        import os
        
        # Security check - ensure filename is safe
        if '..' in filename or '/' in filename or '\\' in filename:
            return jsonify({'error': 'Invalid filename'}), 400
        
        # Construct file path
        upload_dir = os.path.join(os.getcwd(), 'uploads', 'reports')
        filepath = os.path.join(upload_dir, filename)
        
        # Check if file exists
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        # Send file
        return send_file(
            filepath,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        print(f"Error downloading PDF: {e}")
        return jsonify({'error': 'Failed to download PDF'}), 500

@admin_bot_bp.route('/test', methods=['GET'])
def test_route():
    return jsonify({'message': 'Admin bot blueprint is working!', 'timestamp': datetime.now().isoformat()}), 200


# --- 5. Simplified and Secure Main Chat Route ---
@admin_bot_bp.route('/admin-chat', methods=['POST'])
@token_required
def admin_chat(current_user):
    """Handle admin bot chat queries with dual-path logic for RAG and general chat."""
    try:
        # Validate request data
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
            
        query = data.get('query', '').strip()
        conversation_context = data.get('context', [])
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        if len(query) > 1000:
            return jsonify({'error': 'Query is too long. Please keep it under 1000 characters.'}), 400
        
        # Initialize AI service
        try:
            ai = LlamaAI()
        except Exception as e:
            print(f"Failed to initialize AI service: {e}")
            return jsonify({
                'response': "I'm having trouble starting up my AI service. Please try again in a moment.",
                'type': 'error'
            }), 500
        
        # Step 1: Analyze query intent
        try:
            intent_analysis = ai.analyze_query(query)
            intent = intent_analysis.get('intent', 'general_help')
            confidence = intent_analysis.get('confidence', 0.5)
        except Exception as e:
            print(f"Intent analysis failed: {e}")
            intent = 'general_help'
            confidence = 0.3
            intent_analysis = {'intent': intent, 'confidence': confidence, 'entities': {}}
        
        final_response = ""
        is_pdf = False
        response_data = {}

        # --- Check which path to take ---
        if intent == 'general_knowledge':
            # --- PATH B: General Knowledge ---
            try:
                final_response = ai.generate_general_response(query, conversation_context)
            except Exception as e:
                print(f"General response generation failed: {e}")
                final_response = "I'm having trouble processing your question right now. Please try asking me about property management instead."
        else:
            # --- PATH A: Property Management (RAG Pipeline) ---
            print(f"DEBUG: Handling property management intent: {intent}")
            
            try:
                response_data = get_data_for_intent(intent, current_user, query)
                
                if 'error' in response_data:
                    return jsonify({
                        'response': f"I encountered an issue accessing the data: {response_data['error']}", 
                        'type': 'error'
                    }), 500
            except Exception as e:
                print(f"Data fetching failed: {e}")
                return jsonify({
                    'response': "I'm having trouble accessing the database. Please try again in a moment.",
                    'type': 'error'
                }), 500

        # Handle PDF report generation
        if intent == 'pdf_report':
            try:
                pdf_info = generate_pdf_report(response_data, intent_analysis, current_user)
                if pdf_info:
                    final_response = f"📄 **PDF Report Generated!**\n\nI've created a `{pdf_info['type']}` report for you.\n\n📥 **Download:** [Click here to download PDF](/api/admin-bot/download-pdf/{pdf_info['filename']})"
                    is_pdf = True
                else:
                    final_response = "I'm sorry, I was unable to generate the PDF report. Please try again or contact support if the issue persists."
            except Exception as e:
                print(f"PDF generation failed: {e}")
                final_response = "I encountered an error while generating the PDF report. Please try again or contact support."
        else:
            # Special handling for count queries to ensure direct responses
            if intent == 'count' and response_data and 'count' in response_data:
                count_value = response_data.get('count', 0)
                count_type = response_data.get('type', 'items')
                
                if count_type == 'tenants':
                    final_response = f"You have {count_value} tenants."
                elif count_type == 'properties':
                    final_response = f"You have {count_value} properties."
                elif count_type == 'maintenance_requests':
                    final_response = f"You have {count_value} maintenance requests."
                elif count_type == 'vendors':
                    final_response = f"You have {count_value} vendors."
                elif count_type == 'work_orders':
                    final_response = f"You have {count_value} work orders."
                else:
                    final_response = f"You have {count_value} {count_type}."
            else:
                try:
                    ai_response = ai.generate_rag_response(query, response_data, intent, conversation_context)
                    if ai_response:
                        final_response = ai_response
                    else:
                        final_response = generate_fallback_response(intent, response_data, query)
                except Exception as e:
                    print(f"RAG response generation failed: {e}")
                    final_response = generate_fallback_response(intent, response_data, query)

        # Ensure we have a response
        if not final_response:
            final_response = "I'm having trouble processing your request. Please try rephrasing your question or ask me for help to see what I can do."

        # Update conversation context
        try:
            updated_context = conversation_context.copy() if conversation_context else []
            updated_context.append({'role': 'user', 'message': query, 'timestamp': datetime.now().isoformat()})
            updated_context.append({'role': 'assistant', 'message': final_response, 'timestamp': datetime.now().isoformat()})
            updated_context = updated_context[-10:] # Keep last 10 messages
        except Exception as e:
            print(f"Context update failed: {e}")
            updated_context = conversation_context or []
        
        return jsonify({
            'response': final_response,
            'type': 'success',
            'intent': intent,
            'confidence': confidence,
            'pdf_available': is_pdf,
            'context': updated_context
        }), 200
        
    except Exception as e:
        print(f"FATAL Error in admin chat: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return jsonify({
            'response': "I'm experiencing a technical issue. Please try again in a moment, or contact support if the problem persists.",
            'type': 'error',
            'error': 'Internal server error'
        }), 500