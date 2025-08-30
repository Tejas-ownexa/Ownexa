@admin_bot_bp.route('/admin-chat', methods=['POST'])
@token_required
def admin_chat(current_user):
    """Handle admin bot chat queries with simple rule-based processing"""
    try:
        print(f"DEBUG: Admin chat route accessed by user: {current_user.id if current_user else 'None'}")
        
        # Get request data first
        data = request.get_json()
        print(f"DEBUG: Request data received: {data}")
        
        # Check if user is owner or agent (temporarily disabled for debugging)
        print(f"DEBUG: User role: {current_user.role}")
        
        query = data.get('query', '').strip()
        context = data.get('context', [])  # For conversation context
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        print(f"DEBUG: Processing query: {query}")
        
        # Check for "all tenants" queries first (simple rule-based detection)
        query_lower = query.lower()
        if any(phrase in query_lower for phrase in ['all tenant', 'tenants monthly', 'all tenants']) and any(word in query_lower for word in ['report', 'give me', 'show me']):
            print("DEBUG: Detected all tenants request, generating report directly")
            try:
                from models.tenant import Tenant, RentRoll, OutstandingBalance
                from models.property import Property
                from sqlalchemy.orm import joinedload
                
                # Get all tenants for this owner's properties
                tenants = Tenant.query.join(Property).filter(
                    Property.owner_id == current_user.id
                ).options(joinedload(Tenant.property)).all()
                
                if not tenants:
                    return jsonify({
                        'response': "You don't have any tenants yet. Add some tenants first to generate reports.",
                        'type': 'info'
                    }), 200
                
                # Generate simple tenant summary
                total_rent = sum(float(t.rent_amount) if t.rent_amount else 0 for t in tenants)
                
                response = f"📊 **All Tenants Report**\n\n"
                response += f"**Portfolio Summary:**\n"
                response += f"• Total Tenants: {len(tenants)}\n"
                response += f"• Total Monthly Rent: ${total_rent:.2f}\n\n"
                response += f"**Tenant Details:**\n"
                
                for tenant in tenants[:5]:  # Show first 5
                    prop_name = tenant.property.title if tenant.property else "No property"
                    rent = f"${float(tenant.rent_amount):.2f}" if tenant.rent_amount else "$0.00"
                    response += f"• **{tenant.full_name}** - {prop_name} - {rent}/month\n"
                
                if len(tenants) > 5:
                    response += f"\n... and {len(tenants) - 5} more tenants."
                
                return jsonify({
                    'response': response,
                    'type': 'success',
                    'intent': 'tenant_report',
                    'confidence': 1.0,
                    'pdf_available': False,
                    'pdf_info': None
                }), 200
                
            except Exception as e:
                print(f"ERROR: Failed to generate tenant report: {e}")
                return jsonify({
                    'response': f"❌ I found your tenants but encountered an error generating the report: {str(e)}",
                    'type': 'error'
                }), 200
        
        # For other queries, provide a helpful response
        return jsonify({
            'response': f"🤖 I received your query: '{query}'. I can help with tenant reports, property information, and maintenance requests. Try asking 'Give me report for all tenants' or 'Show me my properties'.",
            'type': 'success',
            'intent': 'general',
            'confidence': 0.8,
            'pdf_available': False,
            'pdf_info': None
        }), 200
        
    except Exception as e:
        print(f"Error in admin chat: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
