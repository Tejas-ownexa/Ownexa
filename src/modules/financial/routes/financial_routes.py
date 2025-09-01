from flask import Blueprint, request, jsonify
from models.financial import PropertyFinancial, LoanPayment, FinancialTransaction
from models.property import Property
from config import db
from routes.auth_routes import token_required
from datetime import datetime, date
from decimal import Decimal
import calendar

financial_bp = Blueprint('financial', __name__)

@financial_bp.route('/property/<int:property_id>/financial', methods=['POST'])
@token_required
def create_property_financial(current_user, property_id):
    """Create or update financial details for a property"""
    try:
        # Check if property exists
        property = Property.query.get(property_id)
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        # Temporarily comment out ownership check for testing
        # if property.owner_id != current_user.id:
        #     return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = [
            'total_value', 'purchase_price', 'purchase_date', 
            'mortgage_amount', 'down_payment', 'current_apr', 'loan_term_years'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Parse purchase date
        try:
            purchase_date = datetime.strptime(data['purchase_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid purchase date format. Use YYYY-MM-DD'}), 400
        
        # Check if financial details already exist
        financial = PropertyFinancial.query.filter_by(property_id=property_id).first()
        
        if financial:
            # Update existing financial details
            financial.total_value = Decimal(str(data['total_value']))
            financial.purchase_price = Decimal(str(data['purchase_price']))
            financial.purchase_date = purchase_date
            financial.purchase_price_per_sqft = Decimal(str(data.get('purchase_price_per_sqft', 0)))
            financial.mortgage_amount = Decimal(str(data['mortgage_amount']))
            financial.down_payment = Decimal(str(data['down_payment']))
            financial.current_apr = Decimal(str(data['current_apr']))
            financial.loan_term_years = int(data['loan_term_years'])
            financial.loan_payment_date = int(data.get('loan_payment_date', 1))
            financial.property_tax_annual = Decimal(str(data.get('property_tax_annual', 0)))
            financial.insurance_annual = Decimal(str(data.get('insurance_annual', 0)))
            financial.hoa_fees_monthly = Decimal(str(data.get('hoa_fees_monthly', 0)))
            financial.maintenance_reserve_monthly = Decimal(str(data.get('maintenance_reserve_monthly', 0)))
        else:
            # Create new financial details
            financial = PropertyFinancial(
                property_id=property_id,
                total_value=Decimal(str(data['total_value'])),
                purchase_price=Decimal(str(data['purchase_price'])),
                purchase_date=purchase_date,
                purchase_price_per_sqft=Decimal(str(data.get('purchase_price_per_sqft', 0))),
                mortgage_amount=Decimal(str(data['mortgage_amount'])),
                down_payment=Decimal(str(data['down_payment'])),
                current_apr=Decimal(str(data['current_apr'])),
                loan_term_years=int(data['loan_term_years']),
                loan_payment_date=int(data.get('loan_payment_date', 1)),
                property_tax_annual=Decimal(str(data.get('property_tax_annual', 0))),
                insurance_annual=Decimal(str(data.get('insurance_annual', 0))),
                hoa_fees_monthly=Decimal(str(data.get('hoa_fees_monthly', 0))),
                maintenance_reserve_monthly=Decimal(str(data.get('maintenance_reserve_monthly', 0)))
            )
            db.session.add(financial)
        
        # Calculate and set monthly loan payment
        financial.monthly_loan_payment = financial.calculate_monthly_payment()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Property financial details saved successfully',
            'financial_id': financial.id,
            'monthly_loan_payment': float(financial.monthly_loan_payment),
            'total_monthly_expenses': float(financial.calculate_total_monthly_expenses()),
            'cash_flow': float(financial.calculate_cash_flow(property.rent_amount)),
            'roi': float(financial.calculate_roi(property.rent_amount))
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating property financial details: {str(e)}")
        return jsonify({'error': str(e)}), 400

@financial_bp.route('/property/<int:property_id>/financial', methods=['GET'])
@token_required
def get_property_financial(current_user, property_id):
    """Get financial details for a property"""
    try:
        # Check if property exists
        property = Property.query.get(property_id)
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        # Temporarily comment out ownership check for testing
        # if property.owner_id != current_user.id:
        #     return jsonify({'error': 'Access denied'}), 403
        
        financial = PropertyFinancial.query.filter_by(property_id=property_id).first()
        
        if not financial:
            return jsonify({'error': 'No financial details found for this property'}), 404
        
        return jsonify({
            'id': financial.id,
            'property_id': financial.property_id,
            'total_value': float(financial.total_value),
            'purchase_price': float(financial.purchase_price),
            'purchase_date': financial.purchase_date.isoformat(),
            'purchase_price_per_sqft': float(financial.purchase_price_per_sqft) if financial.purchase_price_per_sqft else None,
            'mortgage_amount': float(financial.mortgage_amount),
            'down_payment': float(financial.down_payment),
            'current_apr': float(financial.current_apr),
            'loan_term_years': financial.loan_term_years,
            'monthly_loan_payment': float(financial.monthly_loan_payment),
            'loan_payment_date': financial.loan_payment_date,
            'property_tax_annual': float(financial.property_tax_annual),
            'insurance_annual': float(financial.insurance_annual),
            'hoa_fees_monthly': float(financial.hoa_fees_monthly),
            'maintenance_reserve_monthly': float(financial.maintenance_reserve_monthly),
            'total_monthly_expenses': float(financial.calculate_total_monthly_expenses()),
            'cash_flow': float(financial.calculate_cash_flow(property.rent_amount)),
            'roi': float(financial.calculate_roi(property.rent_amount))
        }), 200
        
    except Exception as e:
        print(f"Error getting property financial details: {str(e)}")
        return jsonify({'error': str(e)}), 400

@financial_bp.route('/property/<int:property_id>/loan-payments', methods=['POST'])
@token_required
def create_loan_payment(current_user, property_id):
    """Record a loan payment for a property"""
    try:
        # Check if property exists
        property = Property.query.get(property_id)
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        # Temporarily comment out ownership check for testing
        # if property.owner_id != current_user.id:
        #     return jsonify({'error': 'Access denied'}), 403
        
        financial = PropertyFinancial.query.filter_by(property_id=property_id).first()
        if not financial:
            return jsonify({'error': 'Financial details not found for this property'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['payment_date', 'due_date', 'amount_paid', 'amount_due']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Parse dates
        try:
            payment_date = datetime.strptime(data['payment_date'], '%Y-%m-%d').date()
            due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Determine payment status
        status = 'paid'
        if payment_date > due_date:
            status = 'late'
        elif data['amount_paid'] < data['amount_due']:
            status = 'partial'
        
        loan_payment = LoanPayment(
            property_financial_id=financial.id,
            payment_date=payment_date,
            due_date=due_date,
            amount_paid=Decimal(str(data['amount_paid'])),
            amount_due=Decimal(str(data['amount_due'])),
            status=status,
            late_fees=Decimal(str(data.get('late_fees', 0))),
            notes=data.get('notes', '')
        )
        
        db.session.add(loan_payment)
        db.session.commit()
        
        return jsonify({
            'message': 'Loan payment recorded successfully',
            'payment_id': loan_payment.id,
            'status': loan_payment.status
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating loan payment: {str(e)}")
        return jsonify({'error': str(e)}), 400

@financial_bp.route('/property/<int:property_id>/loan-payments', methods=['GET'])
@token_required
def get_loan_payments(current_user, property_id):
    """Get loan payments for a property"""
    try:
        # Check if property exists
        property = Property.query.get(property_id)
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        # Temporarily comment out ownership check for testing
        # if property.owner_id != current_user.id:
        #     return jsonify({'error': 'Access denied'}), 403
        
        financial = PropertyFinancial.query.filter_by(property_id=property_id).first()
        if not financial:
            return jsonify({'error': 'Financial details not found for this property'}), 404
        
        payments = LoanPayment.query.filter_by(property_financial_id=financial.id).order_by(LoanPayment.due_date.desc()).all()
        
        return jsonify([{
            'id': payment.id,
            'payment_date': payment.payment_date.strftime('%Y-%m-%d'),
            'due_date': payment.due_date.strftime('%Y-%m-%d'),
            'amount_paid': float(payment.amount_paid),
            'amount_due': float(payment.amount_due),
            'status': payment.status,
            'late_fees': float(payment.late_fees),
            'notes': payment.notes
        } for payment in payments]), 200
        
    except Exception as e:
        print(f"Error fetching loan payments: {str(e)}")
        return jsonify({'error': str(e)}), 400

@financial_bp.route('/property/<int:property_id>/transactions', methods=['POST'])
@token_required
def create_financial_transaction(current_user, property_id):
    """Create a financial transaction for a property"""
    try:
        # Check if property exists
        property = Property.query.get(property_id)
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        # Temporarily comment out ownership check for testing
        # if property.owner_id != current_user.id:
        #     return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['transaction_type', 'amount', 'description', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        transaction = FinancialTransaction(
            property_id=property_id,
            transaction_date=datetime.strptime(data.get('transaction_date', date.today().strftime('%Y-%m-%d')), '%Y-%m-%d').date(),
            transaction_type=data['transaction_type'],
            amount=Decimal(str(data['amount'])),
            description=data['description'],
            category=data['category'],
            reference_number=data.get('reference_number', ''),
            notes=data.get('notes', '')
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Financial transaction created successfully',
            'transaction_id': transaction.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating financial transaction: {str(e)}")
        return jsonify({'error': str(e)}), 400

@financial_bp.route('/property/<int:property_id>/transactions', methods=['GET'])
@token_required
def get_financial_transactions(current_user, property_id):
    """Get financial transactions for a property"""
    try:
        # Check if property exists
        property = Property.query.get(property_id)
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        # Temporarily comment out ownership check for testing
        # if property.owner_id != current_user.id:
        #     return jsonify({'error': 'Access denied'}), 403
        
        # Get query parameters for filtering
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        category = request.args.get('category')
        transaction_type = request.args.get('transaction_type')
        
        query = FinancialTransaction.query.filter_by(property_id=property_id)
        
        if start_date:
            query = query.filter(FinancialTransaction.transaction_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            query = query.filter(FinancialTransaction.transaction_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        if category:
            query = query.filter_by(category=category)
        if transaction_type:
            query = query.filter_by(transaction_type=transaction_type)
        
        transactions = query.order_by(FinancialTransaction.transaction_date.desc()).all()
        
        return jsonify([{
            'id': transaction.id,
            'transaction_date': transaction.transaction_date.strftime('%Y-%m-%d'),
            'transaction_type': transaction.transaction_type,
            'amount': float(transaction.amount),
            'description': transaction.description,
            'category': transaction.category,
            'reference_number': transaction.reference_number,
            'notes': transaction.notes
        } for transaction in transactions]), 200
        
    except Exception as e:
        print(f"Error fetching financial transactions: {str(e)}")
        return jsonify({'error': str(e)}), 400

@financial_bp.route('/summary/<int:property_id>', methods=['GET'])
@token_required
def get_financial_summary(current_user, property_id):
    """Get financial summary for a property"""
    try:
        # Check if property exists
        property = Property.query.get(property_id)
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        # Temporarily comment out ownership check for testing
        # if property.owner_id != current_user.id:
        #     return jsonify({'error': 'Access denied'}), 403
        
        financial = PropertyFinancial.query.filter_by(property_id=property_id).first()
        if not financial:
            return jsonify({'error': 'Financial details not found for this property'}), 404
        
        # Calculate summary metrics
        total_monthly_expenses = financial.calculate_total_monthly_expenses()
        cash_flow = financial.calculate_cash_flow(property.rent_amount)
        roi = financial.calculate_roi(property.rent_amount)
        
        # Debug logging
        print(f"Financial Summary for Property {property_id}:")
        print(f"  Monthly Rent: {property.rent_amount}")
        print(f"  Total Monthly Expenses: {total_monthly_expenses}")
        print(f"  Monthly Cash Flow: {cash_flow}")
        print(f"  Annual ROI: {roi}")
        print(f"  Monthly Loan Payment: {financial.monthly_loan_payment}")
        print(f"  Property Tax Annual: {financial.property_tax_annual}")
        print(f"  Insurance Annual: {financial.insurance_annual}")
        print(f"  HOA Fees Monthly: {financial.hoa_fees_monthly}")
        print(f"  Maintenance Reserve Monthly: {financial.maintenance_reserve_monthly}")
        
        # Get recent transactions (last 6 months)
        six_months_ago = date.today().replace(day=1)
        for _ in range(6):
            if six_months_ago.month == 1:
                six_months_ago = six_months_ago.replace(year=six_months_ago.year - 1, month=12)
            else:
                six_months_ago = six_months_ago.replace(month=six_months_ago.month - 1)
        
        recent_transactions = FinancialTransaction.query.filter(
            FinancialTransaction.property_id == property_id,
            FinancialTransaction.transaction_date >= six_months_ago
        ).order_by(FinancialTransaction.transaction_date.desc()).limit(10).all()
        
        # Calculate income vs expenses
        income_transactions = [t for t in recent_transactions if t.category == 'income']
        expense_transactions = [t for t in recent_transactions if t.category == 'expense']
        
        total_income = sum(float(t.amount) for t in income_transactions)
        total_expenses = sum(float(t.amount) for t in expense_transactions)
        
        return jsonify({
            'property_id': property_id,
            'property_title': property.title,
            'monthly_rent': float(property.rent_amount),
            'total_monthly_expenses': float(total_monthly_expenses),
            'monthly_cash_flow': float(cash_flow),
            'annual_roi': float(roi),
            'mortgage_details': {
                'monthly_payment': float(financial.monthly_loan_payment),
                'remaining_balance': float(financial.mortgage_amount),
                'apr': float(financial.current_apr),
                'loan_term': financial.loan_term_years
            },
            'property_value': {
                'total_value': float(financial.total_value),
                'purchase_price': float(financial.purchase_price),
                'appreciation': float(financial.total_value - financial.purchase_price)
            },
            'recent_activity': {
                'total_income': total_income,
                'total_expenses': total_expenses,
                'net_income': total_income - total_expenses,
                'transaction_count': len(recent_transactions)
            }
        }), 200
        
    except Exception as e:
        print(f"Error fetching financial summary: {str(e)}")
        return jsonify({'error': str(e)}), 400
