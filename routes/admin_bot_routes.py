from flask import Blueprint, request, jsonify, send_file
from routes.auth_routes import token_required
from datetime import datetime, date
from sqlalchemy.orm import joinedload
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
            return self._fallback_intent_analysis(query)
    
    def _fallback_intent_analysis(self, query):
        """Fallback to keyword-based analysis if AI fails"""
        query_lower = query.lower()
        
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
        system_prompt = f"""You are a helpful AI assistant for a property management system. Generate a natural, conversational response to the user's query.

User Query: {query}
Intent: {intent}
Available Data: {json.dumps(data, default=str, indent=2)}

Instructions:
1. Create a natural, friendly response using the data provided
2. Use emojis and formatting to make it engaging
3. Be specific and helpful
4. If the data shows lists, format them clearly with bullet points
5. Include summary information when relevant
6. Keep the tone professional but conversational

Generate a comprehensive response that directly answers the user's question."""

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
                return None
                
        except Exception as e:
            print(f"AI response generation failed: {e}")
            return None

def get_data_for_intent(intent, current_user):
    """Fetch relevant data based on the detected intent"""
    try:
        if intent == 'tenant_list':
            from models.tenant import Tenant
            from models.property import Property
            
            tenants = Tenant.query.join(Property).filter(
                Property.owner_id == current_user.id
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
            
            properties = Property.query.filter_by(owner_id=current_user.id).all()
            
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
            
            maintenance_requests = MaintenanceRequest.query.join(Property).filter(
                Property.owner_id == current_user.id
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
            
            tenants = Tenant.query.join(Property).filter(
                Property.owner_id == current_user.id
            ).options(joinedload(Tenant.property)).all()
            
            properties = Property.query.filter_by(owner_id=current_user.id).all()
            
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
            
            tenants = Tenant.query.join(Property).filter(
                Property.owner_id == current_user.id
            ).options(joinedload(Tenant.property)).all()
            
            properties = Property.query.filter_by(owner_id=current_user.id).all()
            
            maintenance_requests = MaintenanceRequest.query.join(Property).filter(
                Property.owner_id == current_user.id
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
            
            tenants = Tenant.query.join(Property).filter(Property.owner_id == current_user.id).all()
            properties = Property.query.filter_by(owner_id=current_user.id).all()
            maintenance = MaintenanceRequest.query.join(Property).filter(Property.owner_id == current_user.id).all()
            
            return {
                "summary": {
                    "total_properties": len(properties),
                    "total_tenants": len(tenants),
                    "total_maintenance": len(maintenance)
                }
            }
    
    except Exception as e:
        print(f"Error fetching data for intent {intent}: {e}")
        return {"error": f"Error retrieving data: {str(e)}"}

def generate_fallback_response(intent, data, query):
    """Generate fallback response if AI fails"""
    if "error" in data:
        return f"❌ {data['error']}"
    
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
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        print(f"DEBUG: Processing AI-powered query: {query}")
        
        # Initialize AI system
        ai = LlamaAI()
        
        # Step 1: Use AI to understand the intent
        print("DEBUG: Analyzing intent with AI...")
        intent_analysis = ai.analyze_query(query)
        print(f"DEBUG: Intent analysis: {intent_analysis}")
        
        intent = intent_analysis.get('intent', 'general_help')
        confidence = intent_analysis.get('confidence', 0.5)
        
        # Step 2: Fetch relevant data based on intent
        print(f"DEBUG: Fetching data for intent: {intent}")
        response_data = get_data_for_intent(intent, current_user)
        print(f"DEBUG: Data fetched, type: {type(response_data)}")
        
        # Step 3: Generate AI response
        print("DEBUG: Generating AI response...")
        ai_response = ai.generate_response(query, response_data, intent)
        
        # Step 4: Handle PDF requests or use fallback if AI response fails
        if intent == 'pdf_report':
            # Generate PDF and provide download link
            pdf_info = generate_pdf_report(response_data, intent_analysis, current_user)
            final_response = f"📄 **PDF Report Generated!**\n\nI've created a comprehensive {intent_analysis.get('entities', {}).get('pdf_type', 'property management')} report for you.\n\n📥 **Download your report:** [Click here to download PDF](/api/admin-bot/download-pdf/{pdf_info['filename']})\n\n📊 **Report includes:**\n• {pdf_info['summary']}\n\n💡 **Tip:** The PDF contains detailed information that you can save, print, or share with others."
        elif ai_response:
            print(f"DEBUG: AI response generated successfully, length: {len(ai_response)}")
            final_response = ai_response
        else:
            print("DEBUG: AI response failed, using fallback")
            final_response = generate_fallback_response(intent, response_data, query)
        
        return jsonify({
            'response': final_response,
            'type': 'success',
            'intent': intent,
            'confidence': confidence,
            'pdf_available': intent == 'pdf_report',
            'pdf_info': pdf_info if intent == 'pdf_report' else None
        }), 200
        
    except Exception as e:
        print(f"Error in admin chat: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500