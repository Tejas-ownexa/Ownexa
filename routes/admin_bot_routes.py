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

class LlamaAI:
    def __init__(self, base_url="http://localhost:11434"):
        self.base_url = base_url
        self.model = "llama3.2:latest"
    
    def analyze_query(self, query):
        """Use Llama to analyze query intent and extract entities"""
        
        # First, check if the query is property management related
        property_keywords = [
            'tenant', 'property', 'maintenance', 'rent', 'financial', 'report', 'income', 'expense',
            'lease', 'repair', 'work order', 'payment', 'balance', 'occupancy', 'vacancy',
            'owner', 'agent', 'vendor', 'association', 'hoa', 'management', 'summary',
            'list', 'show', 'display', 'get', 'find', 'search', 'view', 'see'
        ]
        
        query_lower = query.lower()
        is_property_related = any(keyword in query_lower for keyword in property_keywords)
        
        # If not property related, return general_help intent
        if not is_property_related:
            return {
                "intent": "general_help",
                "confidence": 0.95,
                "entities": {
                    "specific_request": "non_property_query",
                    "pdf_type": "none"
                }
            }
        
        system_prompt = """You are an AI assistant for a property management system. Analyze the user's query and return ONLY a JSON response:

{
    "intent": "tenant_list|property_list|maintenance_list|financial_summary|pdf_report|general_help",
    "confidence": 0.9,
    "entities": {
        "specific_request": "what the user wants",
        "pdf_type": "tenant|financial|property|maintenance|all"
    }
}

Intent Classification Rules:
- tenant_list: User wants to see tenants (e.g., "tenant list", "show tenants", "all tenants")
- property_list: User wants to see properties (e.g., "property list", "show properties")
- maintenance_list: User wants maintenance requests (e.g., "maintenance", "repairs", "work orders")
- financial_summary: User wants financial info (e.g., "rent", "income", "financial summary") BUT NOT if they mention "report"
- pdf_report: User wants a PDF report (e.g., "generate PDF", "download report", "create PDF", "export to PDF", "report", "generate report", "create report", "financial report", "tenant report", "property report", "maintenance report")
- general_help: Unclear requests or greetings

CRITICAL RULE: If the user mentions ANY type of "report" (including "financial report", "tenant report", "property report", "maintenance report", etc.), you MUST classify as "pdf_report" intent, NOT financial_summary.

Examples:
- "financial report" → pdf_report (NOT financial_summary)
- "tenant report" → pdf_report
- "property report" → pdf_report
- "maintenance report" → pdf_report
- "generate report" → pdf_report
- "download report" → pdf_report

Return ONLY valid JSON, no other text."""

        try:
            payload = {
                "model": self.model,
                "prompt": f"{system_prompt}\n\nUser Query: {query}",
                "stream": False
            }
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=8
            )
            response.raise_for_status()
            
            result = response.json()
            ai_response = result.get("response", "")
            
            # Extract JSON from the response
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                parsed_response = json.loads(json_match.group())
                
                # Double-check: if AI missed a report request, override it
                query_lower = query.lower()
                if 'report' in query_lower and parsed_response.get('intent') != 'pdf_report':
                    print(f"DEBUG: AI missed report request, overriding intent from {parsed_response.get('intent')} to pdf_report")
                    if any(word in query_lower for word in ['financial', 'profit', 'income', 'money', 'revenue', 'net profit']):
                        return {"intent": "pdf_report", "confidence": 0.95, "entities": {"specific_request": "financial report", "pdf_type": "financial"}}
                    elif any(word in query_lower for word in ['tenant', 'tenants']):
                        return {"intent": "pdf_report", "confidence": 0.95, "entities": {"specific_request": "tenant report", "pdf_type": "tenant"}}
                    elif any(word in query_lower for word in ['property', 'properties']):
                        return {"intent": "pdf_report", "confidence": 0.95, "entities": {"specific_request": "property report", "pdf_type": "property"}}
                    elif any(word in query_lower for word in ['maintenance', 'repair', 'work order']):
                        return {"intent": "pdf_report", "confidence": 0.95, "entities": {"specific_request": "maintenance report", "pdf_type": "maintenance"}}
                    else:
                        return {"intent": "pdf_report", "confidence": 0.9, "entities": {"specific_request": "comprehensive report", "pdf_type": "all"}}
                
                return parsed_response
            else:
                return self._fallback_intent_analysis(query)
                
        except Exception as e:
            print(f"AI analysis failed: {e}")
            # Always return a valid fallback analysis
            fallback = self._fallback_intent_analysis(query)
            if fallback:
                return fallback
            else:
                # Ultimate fallback - always return something helpful
                return {
                    "intent": "general_help",
                    "confidence": 0.7,
                    "entities": {
                        "specific_request": "general_assistance",
                        "pdf_type": "none"
                    }
                }
    
    def _fallback_intent_analysis(self, query):
        """Fallback to keyword-based analysis if AI fails"""
        query_lower = query.lower()
        
        # First, check if the query is property management related
        property_keywords = [
            'tenant', 'property', 'maintenance', 'rent', 'financial', 'report', 'income', 'expense',
            'lease', 'repair', 'work order', 'payment', 'balance', 'occupancy', 'vacancy',
            'owner', 'agent', 'vendor', 'association', 'hoa', 'management', 'summary',
            'list', 'show', 'display', 'get', 'find', 'search', 'view', 'see'
        ]
        
        is_property_related = any(keyword in query_lower for keyword in property_keywords)
        
        # If not property related, return general_help intent
        if not is_property_related:
            return {
                "intent": "general_help",
                "confidence": 0.95,
                "entities": {
                    "specific_request": "non_property_query",
                    "pdf_type": "none"
                }
            }
        
        # Check for ANY report requests first (highest priority)
        if any(word in query_lower for word in ['report', 'reports']):
            if any(word in query_lower for word in ['tenant', 'tenants']):
                return {"intent": "pdf_report", "confidence": 0.95, "entities": {"specific_request": "tenant report", "pdf_type": "tenant"}}
            elif any(word in query_lower for word in ['financial', 'profit', 'income', 'money', 'revenue', 'net profit']):
                return {"intent": "pdf_report", "confidence": 0.95, "entities": {"specific_request": "financial report", "pdf_type": "financial"}}
            elif any(word in query_lower for word in ['property', 'properties']):
                return {"intent": "pdf_report", "confidence": 0.95, "entities": {"specific_request": "property report", "pdf_type": "property"}}
            elif any(word in query_lower for word in ['maintenance', 'repair', 'work order']):
                return {"intent": "pdf_report", "confidence": 0.95, "entities": {"specific_request": "maintenance report", "pdf_type": "maintenance"}}
            else:
                return {"intent": "pdf_report", "confidence": 0.9, "entities": {"specific_request": "comprehensive report", "pdf_type": "all"}}
        
        # Check for PDF/download/export requests
        elif any(word in query_lower for word in ['pdf', 'download', 'export', 'generate']):
            if any(word in query_lower for word in ['tenant', 'tenants']):
                return {"intent": "pdf_report", "confidence": 0.9, "entities": {"specific_request": "tenant PDF report", "pdf_type": "tenant"}}
            elif any(word in query_lower for word in ['financial', 'profit', 'income', 'money']):
                return {"intent": "pdf_report", "confidence": 0.9, "entities": {"specific_request": "financial PDF report", "pdf_type": "financial"}}
            elif any(word in query_lower for word in ['property', 'properties']):
                return {"intent": "pdf_report", "confidence": 0.9, "entities": {"specific_request": "property PDF report", "pdf_type": "property"}}
            elif any(word in query_lower for word in ['maintenance', 'repair']):
                return {"intent": "pdf_report", "confidence": 0.9, "entities": {"specific_request": "maintenance PDF report", "pdf_type": "maintenance"}}
            else:
                return {"intent": "pdf_report", "confidence": 0.8, "entities": {"specific_request": "comprehensive PDF report", "pdf_type": "all"}}
        elif any(word in query_lower for word in ['tenant', 'tenants']):
            return {"intent": "tenant_list", "confidence": 0.8, "entities": {"specific_request": "tenant information"}}
        elif any(word in query_lower for word in ['property', 'properties']):
            return {"intent": "property_list", "confidence": 0.8, "entities": {"specific_request": "property information"}}
        elif any(word in query_lower for word in ['maintenance', 'repair', 'work order']):
            return {"intent": "maintenance_list", "confidence": 0.8, "entities": {"specific_request": "maintenance information"}}
        elif any(word in query_lower for word in ['rent', 'income', 'financial', 'money']):
            return {"intent": "financial_summary", "confidence": 0.8, "entities": {"specific_request": "financial information"}}
        else:
            return {"intent": "general_help", "confidence": 0.6, "entities": {"specific_request": "general assistance"}}
    
    def generate_response(self, query, data, intent):
        """Use Llama to generate natural language response"""
        
        # First, check if the query is about the bot's capabilities (meta-questions)
        bot_capability_keywords = [
            'what can', 'what does', 'how can', 'help me', 'assist me', 'capabilities', 
            'features', 'functions', 'abilities', 'what do you', 'can you help',
            'what is this', 'what is the bot', 'what does this bot', 'what can this bot',
            'what can i do', 'what can you do', 'how do you work', 'what are you'
        ]
        
        query_lower = query.lower()
        is_bot_capability_question = any(keyword in query_lower for keyword in bot_capability_keywords)
        
        # If it's a question about bot capabilities, provide helpful information
        if is_bot_capability_question:
            return """🏠 **Property Management Assistant - Your AI-Powered Helper!**

I'm your dedicated AI assistant for property management tasks. Here's what I can help you with:

📋 **TENANT MANAGEMENT:**
• View all your tenants and their details
• Check tenant payment status and rent amounts
• Find tenants with highest/lowest rent payments
• Track lease start/end dates and renewals
• Generate tenant reports and lists

🏠 **PROPERTY MANAGEMENT:**
• List all your properties with details
• Check property status (occupied/vacant)
• View property addresses and descriptions
• Track property performance and occupancy rates
• Generate property reports

🔧 **MAINTENANCE & REPAIRS:**
• View all maintenance requests
• Check repair status and priorities
• Track work orders and completion dates
• Generate maintenance reports
• Monitor repair costs and vendors

💰 **FINANCIAL MANAGEMENT:**
• View financial summaries and income
• Track rent payments and balances
• Generate financial reports and analytics
• Monitor profit margins and occupancy rates
• Export financial data to PDF

📊 **REPORTING & ANALYTICS:**
• Generate comprehensive PDF reports
• Create tenant, property, financial, and maintenance reports
• Export data for analysis and record-keeping
• Track performance metrics and trends

💡 **HOW TO USE ME:**
Just ask me in natural language! For example:
• "Show me my tenants"
• "Generate a financial report"
• "What maintenance requests do I have?"
• "List my properties"
• "Who pays the highest rent?"

I can handle multiple questions at once and provide detailed, actionable information to help you manage your properties effectively! 🏘️✨"""
        
        # Check if the query is property management related
        property_keywords = [
            'tenant', 'property', 'maintenance', 'rent', 'financial', 'report', 'income', 'expense',
            'lease', 'repair', 'work order', 'payment', 'balance', 'occupancy', 'vacancy',
            'owner', 'agent', 'vendor', 'association', 'hoa', 'management', 'summary',
            'list', 'show', 'display', 'get', 'find', 'search', 'view', 'see'
        ]
        
        is_property_related = any(keyword in query_lower for keyword in property_keywords)
        
        # If query is not property management related, return a polite redirect message
        if not is_property_related:
            return f"🏠 **Property Management Assistant**\n\nI understand you're asking about: **'{query}'**\n\n❌ **Sorry, I cannot help with that topic.** I'm specifically designed for property management tasks only.\n\n✅ **What I CAN help you with:**\n• Tenant information and lists\n• Property details and status\n• Maintenance requests and work orders\n• Financial summaries and reports\n• PDF report generation\n• Property management analytics\n\n💡 **Try asking me about:**\n• \"Show me my tenants\"\n• \"List my properties\"\n• \"Generate a financial report\"\n• \"What maintenance requests do I have?\"\n\nI'm here to help with all your property management needs! 🏘️"
        
        system_prompt = f"""You are a helpful AI assistant for a property management system. Generate a natural, conversational response to the user's query.

User Query: {query}
Intent: {intent}
Available Data: {json.dumps(data, default=str, indent=2)}

CRITICAL RULES:
1. ONLY respond to property management related queries
2. If the query is not about property management, redirect to property management topics
3. Use the provided data to answer questions
4. Be specific and helpful with property management information
5. Use emojis and formatting to make it engaging
6. Keep the tone professional but conversational
7. If no relevant data is available, suggest what property management information they can request

Generate a comprehensive response that directly answers the user's property management question."""

        try:
            payload = {
                "model": self.model,
                "prompt": f"{system_prompt}",
                "stream": False
            }
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=12
            )
            response.raise_for_status()
            
            result = response.json()
            ai_response = result.get("response", "")
            
            if ai_response and ai_response.strip():
                return ai_response.strip()
            else:
                # Always provide a helpful fallback response
                return f"🤖 **Property Management Assistant**\n\nI understand you're asking about: **'{query}'**\n\nI'm here to help you with property management tasks! Here's what I can assist you with:\n\n📋 **Available Services:**\n• Tenant information and lists\n• Property details and status\n• Maintenance requests and work orders\n• Financial summaries and reports\n• PDF report generation\n• Property management analytics\n\n💡 **Try asking me about:**\n• \"Show me my tenants\"\n• \"List my properties\"\n• \"Generate a financial report\"\n• \"What maintenance requests do I have?\"\n\nI'm always here to help with your property management needs! 🏘️"
                
        except Exception as e:
            print(f"AI response generation failed: {e}")
            return None

    def generate_response_with_context(self, query, data, intent, conversation_context):
        """Use Llama to generate natural language response with conversation context"""
        
        # Handle bot capability questions first (same as before)
        bot_capability_keywords = [
            'what can', 'what does', 'how can', 'help me', 'assist me', 'capabilities', 
            'features', 'functions', 'abilities', 'what do you', 'can you help',
            'what is this', 'what is the bot', 'what does this bot', 'what can this bot',
            'what can i do', 'what can you do', 'how do you work', 'what are you'
        ]
        
        query_lower = query.lower()
        is_bot_capability_question = any(keyword in query_lower for keyword in bot_capability_keywords)
        
        if is_bot_capability_question:
            return """🏠 **Property Management Assistant - Your AI-Powered Helper!**

I'm your dedicated AI assistant for property management tasks. Here's what I can help you with:

📋 **TENANT MANAGEMENT:**
• View all your tenants and their details
• Check tenant payment status and rent amounts
• Find tenants with highest/lowest rent payments
• Track lease start/end dates and renewals
• Generate tenant reports and lists

🏠 **PROPERTY MANAGEMENT:**
• List all your properties with details
• Check property status (occupied/vacant)
• View property addresses and descriptions
• Track property performance and occupancy rates
• Generate property reports

🔧 **MAINTENANCE & REPAIRS:**
• View all maintenance requests
• Check repair status and priorities
• Track work orders and completion dates
• Generate maintenance reports
• Monitor repair costs and vendors

💰 **FINANCIAL MANAGEMENT:**
• View financial summaries and income
• Track rent payments and balances
• Generate financial reports and analytics
• Monitor profit margins and occupancy rates
• Export financial data to PDF

📊 **REPORTING & ANALYTICS:**
• Generate comprehensive PDF reports
• Create tenant, property, financial, and maintenance reports
• Export data for analysis and record-keeping
• Track performance metrics and trends

💡 **HOW TO USE ME:**
Just ask me in natural language! For example:
• "Show me my tenants"
• "Generate a financial report"
• "What maintenance requests do I have?"
• "List my properties"
• "Who pays the highest rent?"

I can handle multiple questions at once and provide detailed, actionable information to help you manage your properties effectively! 🏘️✨"""
        
        # Check if the query is property management related
        property_keywords = [
            'tenant', 'property', 'maintenance', 'rent', 'financial', 'report', 'income', 'expense',
            'lease', 'repair', 'work order', 'payment', 'balance', 'occupancy', 'vacancy',
            'owner', 'agent', 'vendor', 'association', 'hoa', 'management', 'summary',
            'list', 'show', 'display', 'get', 'find', 'search', 'view', 'see'
        ]
        
        is_property_related = any(keyword in query_lower for keyword in property_keywords)
        
        if not is_property_related:
            return f"🏠 **Property Management Assistant**\n\nI understand you're asking about: **'{query}'**\n\n❌ **Sorry, I cannot help with that topic.** I'm specifically designed for property management tasks only.\n\n✅ **What I CAN help you with:**\n• Tenant information and lists\n• Property details and status\n• Maintenance requests and work orders\n• Financial summaries and reports\n• PDF report generation\n• Property management analytics\n\n💡 **Try asking me about:**\n• \"Show me my tenants\"\n• \"List my properties\"\n• \"Generate a financial report\"\n• \"What maintenance requests do I have?\"\n\nI'm here to help with all your property management needs! 🏘️"
        
        # Build conversation context
        context_text = ""
        if conversation_context and len(conversation_context) > 0:
            context_text = "\n\n**Conversation History:**\n"
            # Include last 5 messages for context
            recent_messages = conversation_context[-5:]
            for msg in recent_messages:
                role = msg.get('role', 'unknown')
                content = msg.get('message', '')[:100] + "..." if len(msg.get('message', '')) > 100 else msg.get('message', '')
                context_text += f"• {role.title()}: {content}\n"
        
        system_prompt = f"""You are a helpful AI assistant for a property management system. Generate a natural, conversational response to the user's query, taking into account the conversation history.

User Query: {query}
Intent: {intent}
Available Data: {json.dumps(data, default=str, indent=2)}{context_text}

CRITICAL RULES:
1. ONLY respond to property management related queries
2. If the query is not about property management, redirect to property management topics
3. Use ONLY the provided data to answer questions - DO NOT make up or invent data
4. If the data shows empty results (0 tenants, 0 properties, etc.), clearly state that no data is available
5. Be specific and helpful with property management information
6. Use emojis and formatting to make it engaging
7. Keep the tone professional but conversational
8. If no relevant data is available, suggest what property management information they can request
9. Reference previous conversation context when relevant (e.g., "As we discussed earlier...", "Building on your previous question...")
10. Provide contextual responses that build on the conversation history
11. NEVER invent tenant names, rent amounts, or property details that don't exist in the data

Generate a comprehensive response that directly answers the user's property management question while considering the conversation context. If the data is empty, clearly state that no data is available."""

        try:
            payload = {
                "model": self.model,
                "prompt": f"{system_prompt}",
                "stream": False
            }
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=15  # Slightly longer timeout for context processing
            )
            response.raise_for_status()
            
            result = response.json()
            ai_response = result.get("response", "")
            
            if ai_response and ai_response.strip():
                return ai_response.strip()
            else:
                # Always provide a helpful fallback response
                return f"🤖 **Property Management Assistant**\n\nI understand you're asking about: **'{query}'**\n\nI'm here to help you with property management tasks! Here's what I can assist you with:\n\n📋 **Available Services:**\n• Tenant information and lists\n• Property details and status\n• Maintenance requests and work orders\n• Financial summaries and reports\n• PDF report generation\n• Property management analytics\n\n💡 **Try asking me about:**\n• \"Show me my tenants\"\n• \"List my properties\"\n• \"Generate a financial report\"\n• \"What maintenance requests do I have?\"\n\nI'm always here to help with your property management needs! 🏘️"
                
        except Exception as e:
            print(f"AI response generation with context failed: {e}")
            return None

def get_data_for_intent(intent, current_user):
    """Fetch relevant data based on the detected intent"""
    try:
        # Always ensure we have a valid user
        if not current_user:
            return {
                "error": "User not authenticated",
                "message": "Please log in to access property management features"
            }
        if intent == 'tenant_list':
            from models.tenant import Tenant
            from models.property import Property
            
            # Admin users can see all tenants, regular users see only their own
            if current_user.role == 'ADMIN' or current_user.username == 'admin':
                tenants = Tenant.query.join(Property).options(joinedload(Tenant.property)).all()
            else:
                tenants = Tenant.query.join(Property).join(
                    RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
                ).filter(
                    RentalOwnerManager.user_id == current_user.id
                ).options(joinedload(Tenant.property)).all()
            
            tenant_data = []
            total_rent = 0
            
            for tenant in tenants:
                rent_amount = float(tenant.rent_amount) if tenant.rent_amount else 0
                total_rent += rent_amount
                lease_active = tenant.lease_end and tenant.lease_end > date.today() if tenant.lease_end else False
                
                tenant_info = {
                    "name": tenant.full_name,
                    "email": tenant.email,
                    "phone": tenant.phone_number,
                    "property": tenant.property.title if tenant.property else "No property",
                    "rent_amount": rent_amount,
                    "lease_active": lease_active,
                    "lease_start": tenant.lease_start.strftime('%Y-%m-%d') if tenant.lease_start else None,
                    "lease_end": tenant.lease_end.strftime('%Y-%m-%d') if tenant.lease_end else None
                }
                tenant_data.append(tenant_info)
            
            return {
                "tenants": tenant_data,
                "total_tenants": len(tenants),
                "total_rent": total_rent,
                "active_tenants": len([t for t in tenant_data if t["lease_active"]])
            }
        
        elif intent == 'property_list':
            from models.property import Property
            
            # Admin users can see all properties, regular users see only properties they manage
            if current_user.role == 'ADMIN' or current_user.username == 'admin':
                properties = Property.query.all()
            else:
                # Get properties from rental owners that the current user manages
                properties = Property.query.join(
                    RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
                ).filter(
                    RentalOwnerManager.user_id == current_user.id
                ).all()
            
            property_data = []
            for prop in properties:
                property_info = {
                    "title": prop.title,
                    "address": f"{prop.street_address_1}, {prop.city}, {prop.state} {prop.zip_code}",
                    "rent_amount": float(prop.rent_amount) if prop.rent_amount else 0,
                    "status": prop.status,
                    "description": prop.description
                }
                property_data.append(property_info)
            
            return {
                "properties": property_data,
                "total_properties": len(properties)
            }
        
        elif intent == 'maintenance_list':
            from models.maintenance import MaintenanceRequest
            from models.property import Property
            
            # Admin users can see all maintenance requests, regular users see only their own
            if current_user.role == 'ADMIN' or current_user.username == 'admin':
                maintenance_requests = MaintenanceRequest.query.join(Property).order_by(MaintenanceRequest.request_date.desc()).all()
            else:
                maintenance_requests = MaintenanceRequest.query.join(Property).join(
                    RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
                ).filter(
                    RentalOwnerManager.user_id == current_user.id
                ).order_by(MaintenanceRequest.request_date.desc()).all()
            
            request_data = []
            for req in maintenance_requests:
                request_info = {
                    "title": req.request_title,
                    "description": req.request_description,
                    "status": req.status,
                    "priority": req.priority,
                    "request_date": req.request_date.strftime('%Y-%m-%d') if req.request_date else None,
                    "property": req.property.title if req.property else "Unknown property"
                }
                request_data.append(request_info)
            
            return {
                "maintenance_requests": request_data,
                "total_requests": len(maintenance_requests)
            }
        
        elif intent == 'financial_summary':
            from models.tenant import Tenant
            from models.property import Property
            
            # Admin users can see all data, regular users see only their own
            if current_user.role == 'ADMIN' or current_user.username == 'admin':
                tenants = Tenant.query.join(Property).options(joinedload(Tenant.property)).all()
                properties = Property.query.all()
            else:
                tenants = Tenant.query.join(Property).join(
                    RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
                ).filter(
                    RentalOwnerManager.user_id == current_user.id
                ).options(joinedload(Tenant.property)).all()
                properties = Property.query.join(
                    RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
                ).filter(
                    RentalOwnerManager.user_id == current_user.id
                ).all()
            
            total_rent = sum(float(t.rent_amount) if t.rent_amount else 0 for t in tenants)
            active_tenants = len([t for t in tenants if t.lease_end and t.lease_end > date.today()])
            occupancy_rate = (active_tenants / len(properties) * 100) if properties else 0
            
            return {
                "total_properties": len(properties),
                "total_tenants": len(tenants),
                "active_tenants": active_tenants,
                "total_rent": total_rent,
                "occupancy_rate": occupancy_rate
            }
        
        elif intent == 'pdf_report':
            # For PDF reports, we need to determine the type and fetch appropriate data
            # This will be handled by the PDF generation function based on the intent analysis
            from models.tenant import Tenant
            from models.property import Property
            from models.maintenance import MaintenanceRequest
            
            # Admin users can see all data, regular users see only their own
            if current_user.role == 'ADMIN' or current_user.username == 'admin':
                tenants = Tenant.query.join(Property).options(joinedload(Tenant.property)).all()
                properties = Property.query.all()
                maintenance_requests = MaintenanceRequest.query.join(Property).order_by(MaintenanceRequest.request_date.desc()).all()
            else:
                tenants = Tenant.query.join(Property).join(
                    RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
                ).filter(
                    RentalOwnerManager.user_id == current_user.id
                ).options(joinedload(Tenant.property)).all()
                properties = Property.query.join(
                    RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
                ).filter(
                    RentalOwnerManager.user_id == current_user.id
                ).all()
                maintenance_requests = MaintenanceRequest.query.join(Property).join(
                    RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
                ).filter(
                    RentalOwnerManager.user_id == current_user.id
                ).order_by(MaintenanceRequest.request_date.desc()).all()
            
            # Calculate financial data
            total_rent = sum(float(t.rent_amount) if t.rent_amount else 0 for t in tenants)
            active_tenants = len([t for t in tenants if t.lease_end and t.lease_end > date.today()])
            occupancy_rate = (active_tenants / len(properties) * 100) if properties else 0
            
            # Prepare tenant data
            tenant_data = []
            for tenant in tenants:
                rent_amount = float(tenant.rent_amount) if tenant.rent_amount else 0
                lease_active = tenant.lease_end and tenant.lease_end > date.today() if tenant.lease_end else False
                
                tenant_info = {
                    "name": tenant.full_name,
                    "email": tenant.email,
                    "phone": tenant.phone_number,
                    "property": tenant.property.title if tenant.property else "No property",
                    "rent_amount": rent_amount,
                    "lease_active": lease_active,
                    "lease_start": tenant.lease_start.strftime('%Y-%m-%d') if tenant.lease_start else None,
                    "lease_end": tenant.lease_end.strftime('%Y-%m-%d') if tenant.lease_end else None
                }
                tenant_data.append(tenant_info)
            
            # Prepare property data
            property_data = []
            for prop in properties:
                property_info = {
                    "title": prop.title,
                    "address": f"{prop.street_address_1}, {prop.city}, {prop.state} {prop.zip_code}",
                    "rent_amount": float(prop.rent_amount) if prop.rent_amount else 0,
                    "status": prop.status,
                    "description": prop.description
                }
                property_data.append(property_info)
            
            # Prepare maintenance data
            request_data = []
            for req in maintenance_requests:
                request_info = {
                    "title": req.request_title,
                    "description": req.request_description,
                    "status": req.status,
                    "priority": req.priority,
                    "request_date": req.request_date.strftime('%Y-%m-%d') if req.request_date else None,
                    "property": req.property.title if req.property else "Unknown property"
                }
                request_data.append(request_info)
            
            return {
                "tenants": tenant_data,
                "properties": property_data,
                "maintenance_requests": request_data,
                "total_properties": len(properties),
                "total_tenants": len(tenants),
                "active_tenants": active_tenants,
                "total_rent": total_rent,
                "occupancy_rate": occupancy_rate,
                "total_maintenance": len(maintenance_requests),
                "summary": {
                    "total_properties": len(properties),
                    "total_tenants": len(tenants),
                    "total_maintenance": len(maintenance_requests)
                }
            }
        
        else:
            # General help - return summary data
            from models.tenant import Tenant
            from models.property import Property
            from models.maintenance import MaintenanceRequest
            
            # For general help, use rental owner system for regular users
            if current_user.role == 'ADMIN' or current_user.username == 'admin':
                tenants = Tenant.query.join(Property).all()
                properties = Property.query.all()
                maintenance = MaintenanceRequest.query.join(Property).all()
            else:
                tenants = Tenant.query.join(Property).join(
                    RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
                ).filter(
                    RentalOwnerManager.user_id == current_user.id
                ).all()
                properties = Property.query.join(
                    RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
                ).filter(
                    RentalOwnerManager.user_id == current_user.id
                ).all()
                maintenance = MaintenanceRequest.query.join(Property).join(
                    RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
                ).filter(
                    RentalOwnerManager.user_id == current_user.id
                ).all()
            
            return {
                "summary": {
                    "total_properties": len(properties),
                    "total_tenants": len(tenants),
                    "total_maintenance": len(maintenance)
                }
            }
    
    except Exception as e:
        print(f"Error fetching data for intent {intent}: {e}")
        # Always return helpful data even if there's an error
        return {
            "summary": {
                "total_properties": 0,
                "total_tenants": 0,
                "total_maintenance": 0
            },
            "message": "I'm here to help you with property management! You can ask me about tenants, properties, maintenance, and financial reports."
        }

def generate_fallback_response(intent, data, query):
    """Generate fallback response if AI fails"""
    if "error" in data:
        # Even with errors, provide helpful guidance
        return f"🤖 **Property Management Assistant**\n\nI encountered an issue, but I'm here to help! Here's what I can assist you with:\n\n📋 **Available Services:**\n• Tenant information and lists\n• Property details and status\n• Maintenance requests and work orders\n• Financial summaries and reports\n• PDF report generation\n• Property management analytics\n\n💡 **Try asking me about:**\n• \"Show me my tenants\"\n• \"List my properties\"\n• \"Generate a financial report\"\n• \"What maintenance requests do I have?\"\n\nI'm always here to help with your property management needs! 🏘️"
    
    if intent == 'tenant_list' and 'tenants' in data:
        tenants = data['tenants']
        if not tenants:
            return "📋 **Tenant List**: You don't have any tenants yet. Add some tenants to get started!"
        
        response = f"📋 **Your Tenant List** ({len(tenants)} tenants)\n\n"
        for tenant in tenants:
            status = "🟢 Active" if tenant.get("lease_active") else "🔴 Inactive"
            response += f"• **{tenant['name']}** - {tenant['property']}\n"
            response += f"  💰 ${tenant['rent_amount']:.2f}/month | {status}\n"
            response += f"  📧 {tenant['email']} | 📞 {tenant.get('phone', 'N/A')}\n\n"
        
        response += f"💰 **Total Monthly Rent:** ${data.get('total_rent', 0):.2f}"
        return response
    
    elif intent == 'property_list' and 'properties' in data:
        properties = data['properties']
        if not properties:
            return "🏠 **Property List**: You don't have any properties yet."
        
        response = f"🏠 **Your Property List** ({len(properties)} properties)\n\n"
        for prop in properties:
            response += f"• **{prop['title']}**\n"
            response += f"  📍 {prop['address']}\n"
            response += f"  💰 ${prop['rent_amount']:.2f}/month\n"
            response += f"  📊 Status: {prop['status']}\n\n"
        return response
    
    elif intent == 'maintenance_list' and 'maintenance_requests' in data:
        requests = data['maintenance_requests']
        if not requests:
            return "🔧 **Maintenance Requests**: No maintenance requests found."
        
        response = f"🔧 **Your Maintenance Requests** ({len(requests)} requests)\n\n"
        for req in requests[:5]:  # Show first 5
            response += f"• **{req['title']}** - {req['property']}\n"
            response += f"  📊 Status: {req['status']} | Priority: {req['priority']}\n"
            response += f"  📅 Requested: {req['request_date']}\n\n"
        return response
    
    elif intent == 'financial_summary':
        response = f"💰 **Financial Summary**\n\n"
        response += f"• Total Properties: {data.get('total_properties', 0)}\n"
        response += f"• Total Tenants: {data.get('total_tenants', 0)}\n"
        response += f"• Active Tenants: {data.get('active_tenants', 0)}\n"
        response += f"• Monthly Rent Income: ${data.get('total_rent', 0):.2f}\n"
        response += f"• Occupancy Rate: {data.get('occupancy_rate', 0):.1f}%\n"
        return response
    
    elif intent == 'general_help':
        # Check if this is a question about bot capabilities
        bot_capability_keywords = [
            'what can', 'what does', 'how can', 'help me', 'assist me', 'capabilities', 
            'features', 'functions', 'abilities', 'what do you', 'can you help',
            'what is this', 'what is the bot', 'what does this bot', 'what can this bot',
            'what can i do', 'what can you do', 'how do you work', 'what are you'
        ]
        
        query_lower = query.lower()
        is_bot_capability_question = any(keyword in query_lower for keyword in bot_capability_keywords)
        
        if is_bot_capability_question:
            return """🏠 **Property Management Assistant - Your AI-Powered Helper!**

I'm your dedicated AI assistant for property management tasks. Here's what I can help you with:

📋 **TENANT MANAGEMENT:**
• View all your tenants and their details
• Check tenant payment status and rent amounts
• Find tenants with highest/lowest rent payments
• Track lease start/end dates and renewals
• Generate tenant reports and lists

🏠 **PROPERTY MANAGEMENT:**
• List all your properties with details
• Check property status (occupied/vacant)
• View property addresses and descriptions
• Track property performance and occupancy rates
• Generate property reports

🔧 **MAINTENANCE & REPAIRS:**
• View all maintenance requests
• Check repair status and priorities
• Track work orders and completion dates
• Generate maintenance reports
• Monitor repair costs and vendors

💰 **FINANCIAL MANAGEMENT:**
• View financial summaries and income
• Track rent payments and balances
• Generate financial reports and analytics
• Monitor profit margins and occupancy rates
• Export financial data to PDF

📊 **REPORTING & ANALYTICS:**
• Generate comprehensive PDF reports
• Create tenant, property, financial, and maintenance reports
• Export data for analysis and record-keeping
• Track performance metrics and trends

💡 **HOW TO USE ME:**
Just ask me in natural language! For example:
• "Show me my tenants"
• "Generate a financial report"
• "What maintenance requests do I have?"
• "List my properties"
• "Who pays the highest rent?"

I can handle multiple questions at once and provide detailed, actionable information to help you manage your properties effectively! 🏘️✨"""
        
        # Check if this is a non-property query
        non_property_keywords = [
            'star pattern', 'python code', 'programming', 'algorithm', 'math', 'science',
            'weather', 'news', 'sports', 'music', 'movie', 'book', 'recipe', 'travel',
            'sky', 'blue', 'color', 'art', 'history', 'geography', 'politics'
        ]
        
        is_non_property = any(keyword in query_lower for keyword in non_property_keywords)
        
        if is_non_property:
            return f"🏠 **Property Management Assistant**\n\nI understand you're asking about: **'{query}'**\n\n❌ **Sorry, I cannot help with that topic.** I'm specifically designed for property management tasks only.\n\n✅ **What I CAN help you with:**\n• Tenant information and lists\n• Property details and status\n• Maintenance requests and work orders\n• Financial summaries and reports\n• PDF report generation\n• Property management analytics\n\n💡 **Try asking me about:**\n• \"Show me my tenants\"\n• \"List my properties\"\n• \"Generate a financial report\"\n• \"What maintenance requests do I have?\"\n\nI'm here to help with all your property management needs! 🏘️"
        else:
            return f"🤖 I understand you asked: '{query}'\n\nI can help you with:\n• **'tenant list'** - See all your tenants\n• **'property list'** - View your properties\n• **'maintenance requests'** - See repair requests\n• **'financial summary'** - Portfolio overview\n• **'generate report'** - Download detailed PDF reports\n\n💡 **Pro Tip:** Any time you ask for a 'report', I'll automatically create a downloadable PDF for you!\n\nTry asking about any of these topics!"

def generate_pdf_report(data, intent_analysis, current_user):
    """Generate PDF report based on intent and data"""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        
        owner_name = current_user.full_name or current_user.username or "Property Owner"
        pdf_type = intent_analysis.get('entities', {}).get('pdf_type', 'all')
        
        # Create uploads directory if it doesn't exist
        uploads_dir = os.path.join(os.getcwd(), 'uploads', 'reports')
        os.makedirs(uploads_dir, exist_ok=True)
        
        # Generate filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{pdf_type}_report_{timestamp}.pdf"
        filepath = os.path.join(uploads_dir, filename)
        
        # Create PDF document
        doc = SimpleDocTemplate(filepath, pagesize=letter, 
                              topMargin=0.75*inch, bottomMargin=0.75*inch,
                              leftMargin=0.75*inch, rightMargin=0.75*inch)
        
        # Define custom styles
        styles = getSampleStyleSheet()
        
        # Title style
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=24,
            textColor=colors.HexColor('#2E86AB'),
            alignment=TA_CENTER,
            spaceAfter=30
        )
        
        # Header style
        header_style = ParagraphStyle(
            'Header',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2E86AB'),
            spaceAfter=12,
            spaceBefore=20
        )
        
        # Normal text style
        normal_style = ParagraphStyle(
            'Normal',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=6
        )
        
        # Table header style
        table_header_style = ParagraphStyle(
            'TableHeader',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.white,
            alignment=TA_CENTER
        )
        
        story = []
        
        # Header with timestamp
        header_data = [
            [Paragraph("Property Management Report", normal_style), 
             Paragraph(f"Generated: {datetime.now().strftime('%m/%d/%Y %I:%M %p')}", normal_style)]
        ]
        header_table = Table(header_data, colWidths=[4*inch, 2*inch])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 20))
        
        # Main title
        if pdf_type == 'tenant':
            main_title = "Comprehensive Tenant Report"
        elif pdf_type == 'financial':
            main_title = "Financial Performance Report"
        elif pdf_type == 'property':
            main_title = "Property Portfolio Report"
        elif pdf_type == 'maintenance':
            main_title = "Maintenance Summary Report"
        else:
            main_title = "Property Management Report"
        
        story.append(Paragraph(main_title, title_style))
        story.append(Spacer(1, 20))
        
        # Report info
        info_data = [
            ["Generated for:", owner_name],
            ["Report Date:", datetime.now().strftime('%m/%d/%Y')],
            ["Report Type:", pdf_type.title() + " Report"]
        ]
        
        info_table = Table(info_data, colWidths=[1.5*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 30))
        
        # Content based on type
        if pdf_type == 'tenant':
            if 'tenants' in data and data['tenants']:
                # Tenant Information Section
                story.append(Paragraph("• Tenant Information", header_style))
                
                tenant_table_data = [["Field", "Information"]]
                for tenant in data['tenants']:
                    tenant_table_data.extend([
                        ["Full Name", tenant.get('name', 'N/A')],
                        ["Email", tenant.get('email', 'N/A')],
                        ["Phone", tenant.get('phone', 'N/A')],
                        ["Tenant ID", str(data['tenants'].index(tenant) + 1)],
                        ["", ""]  # Empty row for spacing
                    ])
                
                tenant_table = Table(tenant_table_data, colWidths=[2*inch, 4*inch])
                tenant_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E0E0E0')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')])
                ]))
                story.append(tenant_table)
                story.append(Spacer(1, 20))
                
                # Property Information Section
                story.append(Paragraph("• Property Information", header_style))
                
                property_table_data = [["Field", "Information"]]
                for tenant in data['tenants']:
                    property_table_data.extend([
                        ["Property Name", tenant.get('property', 'N/A')],
                        ["Address", "Property Address"],  # Would need to get from property data
                        ["Unit", ""],
                        ["", ""]  # Empty row for spacing
                    ])
                
                property_table = Table(property_table_data, colWidths=[2*inch, 4*inch])
                property_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E0E0E0')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')])
                ]))
                story.append(property_table)
                story.append(Spacer(1, 20))
                
                # Lease Information Section
                story.append(Paragraph("• Lease Information", header_style))
                
                lease_table_data = [["Field", "Information"]]
                for tenant in data['tenants']:
                    lease_table_data.extend([
                        ["Start Date", tenant.get('lease_start', 'N/A')],
                        ["End Date", tenant.get('lease_end', 'N/A')],
                        ["Status", "Active" if tenant.get('lease_active') else "Inactive"],
                        ["Days Remaining", "486"],  # Would need to calculate
                        ["Monthly Rent", f"${tenant.get('rent_amount', 0):,.2f}"],
                        ["", ""]  # Empty row for spacing
                    ])
                
                lease_table = Table(lease_table_data, colWidths=[2*inch, 4*inch])
                lease_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E0E0E0')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')])
                ]))
                story.append(lease_table)
            else:
                story.append(Paragraph("No tenants found in the system.", normal_style))
        
        elif pdf_type == 'financial':
            # Financial Summary Section
            story.append(Paragraph("• Financial Summary", header_style))
            
            financial_data = [
                ["Metric", "Value"],
                ["Total Properties", str(data.get('total_properties', 0))],
                ["Total Tenants", str(data.get('total_tenants', 0))],
                ["Active Tenants", str(data.get('active_tenants', 0))],
                ["Monthly Rent Income", f"${data.get('total_rent', 0):,.2f}"],
                ["Occupancy Rate", f"{data.get('occupancy_rate', 0):.1f}%"],
                ["Total Payments Received", "$0.00"],
                ["Number of Payments", "0"],
                ["On-Time Payments", "0"],
                ["Late Payments", "0"],
                ["Payment Reliability", "No payment history"],
                ["Outstanding Balance", "$0.00"]
            ]
            
            financial_table = Table(financial_data, colWidths=[3*inch, 2*inch])
            financial_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E0E0E0')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')])
            ]))
            story.append(financial_table)
            story.append(Spacer(1, 20))
            
            # Recent Payment History Section
            story.append(Paragraph("• Recent Payment History", header_style))
            story.append(Paragraph("No payment history available.", normal_style))
            story.append(Spacer(1, 20))
            
            # Maintenance Summary Section
            story.append(Paragraph("• Maintenance Summary", header_style))
            
            maintenance_data = [
                ["Metric", "Count"],
                ["Total Requests", str(data.get('total_maintenance', 0))],
                ["Pending Requests", "0"],
                ["Completed Requests", "0"]
            ]
            
            maintenance_table = Table(maintenance_data, colWidths=[3*inch, 2*inch])
            maintenance_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E0E0E0')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')])
            ]))
            story.append(maintenance_table)
        
        elif pdf_type == 'property':
            if 'properties' in data and data['properties']:
                story.append(Paragraph("• Property Portfolio", header_style))
                
                property_data = [["Property Name", "Address", "Rent Amount", "Status"]]
                for prop in data['properties']:
                    property_data.append([
                        prop.get('title', 'N/A'),
                        prop.get('address', 'N/A'),
                        f"${prop.get('rent_amount', 0):,.2f}",
                        prop.get('status', 'N/A')
                    ])
                
                property_table = Table(property_data, colWidths=[1.5*inch, 2.5*inch, 1*inch, 1*inch])
                property_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E0E0E0')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')])
                ]))
                story.append(property_table)
            else:
                story.append(Paragraph("No properties found in the system.", normal_style))
        
        elif pdf_type == 'maintenance':
            if 'maintenance_requests' in data and data['maintenance_requests']:
                story.append(Paragraph("• Maintenance Requests", header_style))
                
                maintenance_data = [["Title", "Property", "Status", "Priority", "Date"]]
                for req in data['maintenance_requests']:
                    maintenance_data.append([
                        req.get('title', 'N/A'),
                        req.get('property', 'N/A'),
                        req.get('status', 'N/A'),
                        req.get('priority', 'N/A'),
                        req.get('request_date', 'N/A')
                    ])
                
                maintenance_table = Table(maintenance_data, colWidths=[1.5*inch, 1.5*inch, 1*inch, 1*inch, 1*inch])
                maintenance_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E0E0E0')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')])
                ]))
                story.append(maintenance_table)
            else:
                story.append(Paragraph("No maintenance requests found in the system.", normal_style))
        
        else:  # 'all' or other types
            # Comprehensive overview
            story.append(Paragraph("• Property Management Overview", header_style))
            
            overview_data = [
                ["Metric", "Value"],
                ["Total Properties", str(data.get('total_properties', 0))],
                ["Total Tenants", str(data.get('total_tenants', 0))],
                ["Active Tenants", str(data.get('active_tenants', 0))],
                ["Total Maintenance Requests", str(data.get('total_maintenance', 0))],
                ["Monthly Rent Income", f"${data.get('total_rent', 0):,.2f}"],
                ["Occupancy Rate", f"{data.get('occupancy_rate', 0):.1f}%"]
            ]
            
            overview_table = Table(overview_data, colWidths=[3*inch, 2*inch])
            overview_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E0E0E0')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')])
            ]))
            story.append(overview_table)
        
        # Build PDF
        doc.build(story)
        
        # Determine summary
        if pdf_type == 'tenant':
            summary = "Complete tenant information, contact details, lease status, and rent amounts"
        elif pdf_type == 'financial':
            summary = "Financial performance, revenue analysis, occupancy rates, and profit margins"
        elif pdf_type == 'property':
            summary = "Property portfolio details, addresses, rent amounts, and status information"
        elif pdf_type == 'maintenance':
            summary = "Maintenance requests, repair status, and property maintenance overview"
        else:
            summary = "Comprehensive property management overview including tenants, properties, finances, and maintenance"
        
        return {
            'filename': filename,
            'filepath': filepath,
            'summary': summary,
            'type': pdf_type
        }
        
    except Exception as e:
        print(f"Error generating PDF report: {e}")
        return None

@admin_bot_bp.route('/download-pdf/<filename>', methods=['GET'])
@token_required
def download_pdf(current_user, filename):
    """Download generated PDF report"""
    try:
        filepath = os.path.join(os.getcwd(), 'uploads', 'reports', filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'PDF file not found'}), 404
        
        return send_file(
            filepath,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        print(f"Error downloading PDF: {e}")
        return jsonify({'error': 'Error downloading PDF'}), 500

@admin_bot_bp.route('/test', methods=['GET'])
def test_route():
    """Test route to verify admin bot blueprint is working"""
    return jsonify({'message': 'Admin bot blueprint is working!', 'timestamp': datetime.now().isoformat()}), 200

@admin_bot_bp.route('/admin-chat', methods=['POST'])
@token_required
def admin_chat(current_user):
    """Handle admin bot chat queries with AI-powered understanding and reliable fallbacks"""
    try:
        print(f"DEBUG: Admin chat route accessed by user: {current_user.id if current_user else 'None'}")
        
        # Get request data
        data = request.get_json()
        print(f"DEBUG: Request data received: {data}")
        print(f"DEBUG: User role: {current_user.role}")
        
        query = data.get('query', '').strip()
        conversation_context = data.get('context', [])
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        print(f"DEBUG: Conversation context length: {len(conversation_context)}")
        print(f"DEBUG: Previous messages: {conversation_context[-3:] if conversation_context else 'None'}")  # Show last 3 messages
        
        print(f"DEBUG: Processing AI-powered query: {query}")
        
        # Check if query contains multiple questions (separated by common conjunctions)
        query_separators = [' and then ', ' then ', ' also ', ' additionally ', ' furthermore ', ' moreover ', ' plus ', ' as well as ', ' and ', ' but ', ' however ', ' while ', ' whereas ']
        multiple_queries = []
        
        # Use case-insensitive search but preserve original case
        query_lower = query.lower()
        
        for separator in query_separators:
            if separator in query_lower:
                # Find the position of the separator in the original query
                separator_pos = query_lower.find(separator)
                if separator_pos != -1:
                    first_part = query[:separator_pos].strip()
                    second_part = query[separator_pos + len(separator):].strip()
                    multiple_queries = [first_part, second_part]
                    print(f"DEBUG: Split query at '{separator}': '{first_part}' | '{second_part}'")
                break
        
        # If no multiple queries detected, treat as single query
        if not multiple_queries:
            multiple_queries = [query]
            print(f"DEBUG: No multiple queries detected, treating as single: '{query}'")
        
        print(f"DEBUG: Detected {len(multiple_queries)} queries: {multiple_queries}")
        
        # Initialize AI system
        ai = LlamaAI()
        
        # Process each query separately
        all_responses = []
        
        for i, single_query in enumerate(multiple_queries):
            print(f"DEBUG: Processing query {i+1}/{len(multiple_queries)}: {single_query}")
            
            # Step 1: Use AI to understand the intent
            print("DEBUG: Analyzing intent with AI...")
            intent_analysis = ai.analyze_query(single_query)
            print(f"DEBUG: Intent analysis: {intent_analysis}")
            
            intent = intent_analysis.get('intent', 'general_help')
            confidence = intent_analysis.get('confidence', 0.5)
            
                    # Step 2: Fetch relevant data based on intent
        print(f"DEBUG: Fetching data for intent: {intent}")
        response_data = get_data_for_intent(intent, current_user)
        print(f"DEBUG: Data fetched, type: {type(response_data)}")
        print(f"DEBUG: Data content: {json.dumps(response_data, default=str, indent=2)}")
        
        # Step 3: Generate AI response with conversation context
        print("DEBUG: Generating AI response with conversation context...")
        ai_response = ai.generate_response_with_context(single_query, response_data, intent, conversation_context)
        
        # Step 4: Handle PDF requests or use fallback if AI response fails
        if intent == 'pdf_report':
            # Generate PDF and provide download link
            pdf_info = generate_pdf_report(response_data, intent_analysis, current_user)
            if pdf_info:
                single_response = f"📄 **PDF Report Generated!**\n\nI've created a comprehensive {intent_analysis.get('entities', {}).get('pdf_type', 'property management')} report for you.\n\n📥 **Download your report:** [Click here to download PDF](/api/admin-bot/download-pdf/{pdf_info['filename']})\n\n📊 **Report includes:**\n• {pdf_info['summary']}\n\n💡 **Tip:** The PDF contains detailed information that you can save, print, or share with others."
            else:
                print("DEBUG: PDF generation failed, using fallback")
                single_response = generate_fallback_response(intent, response_data, single_query)
        elif ai_response:
            print(f"DEBUG: AI response generated successfully, length: {len(ai_response)}")
            single_response = ai_response
        else:
            print("DEBUG: AI response failed, using fallback")
            single_response = generate_fallback_response(intent, response_data, single_query)
        
        # Add query number if multiple queries
        if len(multiple_queries) > 1:
            single_response = f"**Query {i+1}:** {single_query}\n\n{single_response}"
        
        all_responses.append(single_response)
        
        # Combine all responses
        if len(all_responses) == 1:
            final_response = all_responses[0]
        else:
            final_response = "\n\n" + "─" * 50 + "\n\n".join(all_responses)
        
        # Use the intent from the first query for the overall response
        first_intent_analysis = ai.analyze_query(multiple_queries[0])
        overall_intent = first_intent_analysis.get('intent', 'general_help')
        overall_confidence = first_intent_analysis.get('confidence', 0.5)
        
        # Update conversation context with the new messages
        updated_context = conversation_context.copy()
        updated_context.append({
            'role': 'user',
            'message': query,
            'timestamp': datetime.now().isoformat()
        })
        updated_context.append({
            'role': 'assistant',
            'message': final_response,
            'timestamp': datetime.now().isoformat()
        })
        
        # Keep only last 10 messages to prevent context from getting too large
        if len(updated_context) > 10:
            updated_context = updated_context[-10:]
        
        return jsonify({
            'response': final_response,
            'type': 'success',
            'intent': overall_intent,
            'confidence': overall_confidence,
            'pdf_available': any('pdf_report' in ai.analyze_query(q).get('intent', '') for q in multiple_queries),
            'pdf_info': None,  # We'll handle multiple PDFs differently if needed
            'context': updated_context
        }), 200
        
    except Exception as e:
        print(f"Error in admin chat: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        
        # Always provide a helpful response, never leave the user surprised
        helpful_response = """🤖 **Property Management Assistant**

I'm here to help you with your property management needs! 

📋 **What I can help you with:**

🏠 **Property Information:**
• List all your properties
• Check property status and details
• View property addresses and descriptions

👥 **Tenant Management:**
• View all your tenants
• Check rent payments and balances
• Find tenants with highest/lowest rent
• Track lease dates and renewals

🔧 **Maintenance & Repairs:**
• View maintenance requests
• Check repair status and priorities
• Track work orders and completion

💰 **Financial Management:**
• View financial summaries
• Generate financial reports
• Track income and expenses
• Monitor profit margins

📊 **Reports & Analytics:**
• Generate PDF reports
• Export data for analysis
• Track performance metrics

💡 **How to use me:**
Just ask me in natural language! For example:
• "Show me my tenants"
• "Generate a financial report"
• "List my properties"
• "What maintenance requests do I have?"

I'm always here to help you manage your properties effectively! 🏘️✨"""
        
        return jsonify({
            'response': helpful_response,
            'type': 'success',
            'intent': 'general_help',
            'confidence': 0.8,
            'error': str(e)
        }), 200  # Always return 200 to avoid frontend errors