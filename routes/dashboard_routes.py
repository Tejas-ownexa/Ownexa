from flask import Blueprint, jsonify
from models import db, Property, Tenant, User, MaintenanceRequest, FinancialTransaction
from models.rental_owner import RentalOwner
from routes.auth_routes import token_required
from sqlalchemy import func, and_, extract
from datetime import datetime, date, timedelta

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@token_required
def get_dashboard_stats(current_user):
    """Get comprehensive dashboard statistics"""
    try:
        # Get user's properties
        if current_user.role == 'OWNER':
            properties = Property.query.filter_by(owner_id=current_user.id).all()
        else:
            # For admins, get all properties
            properties = Property.query.all()
        
        property_ids = [p.id for p in properties]
        
        # Basic counts
        total_properties = len(properties)
        
        # Get tenants for these properties
        tenants = Tenant.query.filter(Tenant.property_id.in_(property_ids)).all() if property_ids else []
        active_tenants = len([t for t in tenants if t.move_out_date is None or t.move_out_date > date.today()])
        
        # Get maintenance requests
        maintenance_requests = MaintenanceRequest.query.filter(
            MaintenanceRequest.property_id.in_(property_ids)
        ).all() if property_ids else []
        pending_maintenance = len([r for r in maintenance_requests if r.status == 'pending'])
        
        # Calculate revenue statistics
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        # Monthly revenue from rent
        monthly_rent_revenue = sum(float(t.rent_amount or 0) for t in tenants if t.move_out_date is None or t.move_out_date > date.today())
        
        # Get financial transactions for more accurate revenue calculation
        financial_transactions = FinancialTransaction.query.filter(
            and_(
                FinancialTransaction.property_id.in_(property_ids),
                extract('month', FinancialTransaction.transaction_date) == current_month,
                extract('year', FinancialTransaction.transaction_date) == current_year,
                FinancialTransaction.transaction_type == 'income'
            )
        ).all() if property_ids else []
        
        actual_monthly_revenue = sum(float(t.amount or 0) for t in financial_transactions)
        
        # Use actual revenue if available, otherwise use rent amount
        monthly_revenue = actual_monthly_revenue if actual_monthly_revenue > 0 else monthly_rent_revenue
        
        # Calculate occupancy rate
        occupancy_rate = (active_tenants / total_properties * 100) if total_properties > 0 else 0
        
        # Calculate collection rate (simplified - assuming all rent is collected unless there are outstanding balances)
        collection_rate = 95.0  # Default for now - can be improved with actual payment tracking
        
        # Average response time for maintenance (simplified)
        avg_response_time = "2.4h"  # Default for now - can be calculated from actual maintenance data
        
        # Recent 6 months revenue for chart
        revenue_chart_data = []
        for i in range(6):
            # Approximate month calculation using 30 days
            month_date = datetime.now() - timedelta(days=30*i)
            month_transactions = FinancialTransaction.query.filter(
                and_(
                    FinancialTransaction.property_id.in_(property_ids),
                    extract('month', FinancialTransaction.transaction_date) == month_date.month,
                    extract('year', FinancialTransaction.transaction_date) == month_date.year,
                    FinancialTransaction.transaction_type == 'income'
                )
            ).all() if property_ids else []
            
            month_revenue = sum(float(t.amount or 0) for t in month_transactions)
            # If no financial data, use estimated rent
            if month_revenue == 0:
                month_revenue = monthly_rent_revenue
            
            revenue_chart_data.insert(0, month_revenue)  # Insert at beginning to get chronological order
        
        # Calculate year-to-date revenue
        ytd_transactions = FinancialTransaction.query.filter(
            and_(
                FinancialTransaction.property_id.in_(property_ids),
                extract('year', FinancialTransaction.transaction_date) == current_year,
                FinancialTransaction.transaction_type == 'income'
            )
        ).all() if property_ids else []
        
        ytd_revenue = sum(float(t.amount or 0) for t in ytd_transactions)
        if ytd_revenue == 0:
            # Estimate based on monthly rent * months elapsed
            months_elapsed = current_month
            ytd_revenue = monthly_rent_revenue * months_elapsed
        
        # Calculate average vacancy days (simplified)
        avg_vacancy_days = 12  # Default for now
        
        # Calculate average maintenance cost
        maintenance_costs = [float(r.estimated_cost or 0) for r in maintenance_requests if r.estimated_cost]
        avg_maintenance_cost = sum(maintenance_costs) / len(maintenance_costs) if maintenance_costs else 0
        
        return jsonify({
            'success': True,
            'stats': {
                'total_properties': total_properties,
                'active_tenants': active_tenants,
                'pending_maintenance': pending_maintenance,
                'monthly_revenue': monthly_revenue,
                'occupancy_rate': round(occupancy_rate, 1),
                'collection_rate': collection_rate,
                'avg_response_time': avg_response_time,
                'ytd_revenue': ytd_revenue,
                'avg_vacancy_days': avg_vacancy_days,
                'avg_maintenance_cost': avg_maintenance_cost,
                'revenue_chart_data': revenue_chart_data,
                'roi': 4.8  # Default for now - can be calculated with actual property values and costs
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting dashboard stats: {str(e)}")
        return jsonify({'error': str(e)}), 400
