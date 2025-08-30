from flask import Blueprint, request, jsonify
from models.accountability import AccountabilityFinancial, GeneralLedger, Banking, BankingTransaction
from models.property import Property
from models.financial import PropertyFinancial, FinancialTransaction
from config import db
from routes.auth_routes import token_required
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import and_, or_, func, desc

accountability_bp = Blueprint('accountability', __name__)

# ============================================================================
# DASHBOARD ANALYTICS ROUTES
# ============================================================================

@accountability_bp.route('/dashboard/financials', methods=['GET'])
@token_required
def get_financials_dashboard(current_user):
    """Get dashboard analytics for Financials page"""
    try:
        # Get user's properties
        properties = Property.query.filter_by(owner_id=current_user.id).all()
        property_ids = [p.id for p in properties]
        
        if not property_ids:
            return jsonify({
                'totalRevenue': 0,
                'totalExpenses': 0,
                'netProfit': 0,
                'properties': 0,
                'revenueTrend': 0,
                'expensesTrend': 0,
                'profitTrend': 0,
                'propertiesTrend': 0,
                'chartData': {
                    'revenueExpense': {
                        'labels': [],
                        'revenue': [],
                        'expenses': []
                    },
                    'expenseBreakdown': {
                        'labels': [],
                        'values': []
                    }
                }
            })
        
        # Get current period data (last 30 days)
        current_date = date.today()
        period_start = date(current_date.year, current_date.month, 1)
        
        # Get previous period data
        if current_date.month == 1:
            prev_period_start = date(current_date.year - 1, 12, 1)
        else:
            prev_period_start = date(current_date.year, current_date.month - 1, 1)
        
        # Current period financials
        current_financials = AccountabilityFinancial.query.filter(
            AccountabilityFinancial.property_id.in_(property_ids),
            AccountabilityFinancial.period_start_date >= period_start
        ).all()
        
        # Previous period financials
        prev_financials = AccountabilityFinancial.query.filter(
            AccountabilityFinancial.property_id.in_(property_ids),
            AccountabilityFinancial.period_start_date >= prev_period_start,
            AccountabilityFinancial.period_start_date < period_start
        ).all()
        
        # Calculate current period totals
        total_revenue = sum(f.total_income for f in current_financials)
        total_expenses = sum(f.total_expenses for f in current_financials)
        net_profit = total_revenue - total_expenses
        
        # Calculate previous period totals
        prev_total_revenue = sum(f.total_income for f in prev_financials)
        prev_total_expenses = sum(f.total_expenses for f in prev_financials)
        prev_net_profit = prev_total_revenue - prev_total_expenses
        
        # Calculate trends
        revenue_trend = ((total_revenue - prev_total_revenue) / prev_total_revenue * 100) if prev_total_revenue > 0 else 0
        expenses_trend = ((total_expenses - prev_total_expenses) / prev_total_expenses * 100) if prev_total_expenses > 0 else 0
        profit_trend = ((net_profit - prev_net_profit) / prev_net_profit * 100) if prev_net_profit > 0 else 0
        
        # Get chart data from actual financial records
        all_financials = AccountabilityFinancial.query.filter(
            AccountabilityFinancial.property_id.in_(property_ids)
        ).order_by(AccountabilityFinancial.period_start_date).all()
        
        # Prepare chart data
        chart_labels = []
        revenue_data = []
        expenses_data = []
        
        for financial in all_financials:
            period_label = f"{financial.financial_period.title()} {financial.financial_year}"
            chart_labels.append(period_label)
            revenue_data.append(float(financial.total_income))
            expenses_data.append(float(financial.total_expenses))
        
        # Calculate expense breakdown from actual data
        expense_categories = {
            'Maintenance': sum(f.maintenance_costs for f in all_financials),
            'Insurance': sum(f.insurance_costs for f in all_financials),
            'Property Tax': sum(f.property_taxes for f in all_financials),
            'Management': sum(f.property_management_fees for f in all_financials),
            'Utilities': sum(f.utilities for f in all_financials),
            'HOA': sum(f.hoa_fees for f in all_financials)
        }
        
        expense_labels = list(expense_categories.keys())
        expense_values = [float(v) for v in expense_categories.values()]
        
        return jsonify({
            'totalRevenue': float(total_revenue),
            'totalExpenses': float(total_expenses),
            'netProfit': float(net_profit),
            'properties': len(properties),
            'revenueTrend': round(revenue_trend, 1),
            'expensesTrend': round(expenses_trend, 1),
            'profitTrend': round(profit_trend, 1),
            'propertiesTrend': 0,  # No change in properties
            'chartData': {
                'revenueExpense': {
                    'labels': chart_labels,
                    'revenue': revenue_data,
                    'expenses': expenses_data
                },
                'expenseBreakdown': {
                    'labels': expense_labels,
                    'values': expense_values
                }
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@accountability_bp.route('/dashboard/general-ledger', methods=['GET'])
@token_required
def get_general_ledger_dashboard(current_user):
    """Get dashboard analytics for General Ledger page"""
    try:
        # Get user's properties
        properties = Property.query.filter_by(owner_id=current_user.id).all()
        property_ids = [p.id for p in properties]
        
        if not property_ids:
            return jsonify({
                'totalAssets': 0,
                'netWorth': 0,
                'monthlyActivity': 0,
                'unreconciled': 0,
                'assetsTrend': 0,
                'netWorthTrend': 0,
                'activityTrend': 0,
                'unreconciledTrend': 0,
                'chartData': {
                    'accountCategories': {
                        'labels': [],
                        'values': []
                    },
                    'monthlyActivity': {
                        'labels': [],
                        'credits': [],
                        'debits': []
                    }
                }
            })
        
        # Get current month data
        current_date = date.today()
        month_start = date(current_date.year, current_date.month, 1)
        
        # Get previous month data
        if current_date.month == 1:
            prev_month_start = date(current_date.year - 1, 12, 1)
        else:
            prev_month_start = date(current_date.year, current_date.month - 1, 1)
        
        # Calculate total assets (sum of all asset entries)
        current_assets = db.session.query(func.sum(GeneralLedger.amount)).filter(
            GeneralLedger.property_id.in_(property_ids),
            GeneralLedger.account_category == 'assets',
            GeneralLedger.transaction_type == 'debit'
        ).scalar() or 0
        
        # Calculate net worth (assets - liabilities)
        current_liabilities = db.session.query(func.sum(GeneralLedger.amount)).filter(
            GeneralLedger.property_id.in_(property_ids),
            GeneralLedger.account_category == 'liabilities',
            GeneralLedger.transaction_type == 'credit'
        ).scalar() or 0
        
        net_worth = current_assets - current_liabilities
        
        # Monthly activity (number of transactions this month)
        monthly_activity = GeneralLedger.query.filter(
            GeneralLedger.property_id.in_(property_ids),
            GeneralLedger.transaction_date >= month_start
        ).count()
        
        # Unreconciled entries (entries without approval)
        unreconciled = GeneralLedger.query.filter(
            GeneralLedger.property_id.in_(property_ids),
            GeneralLedger.approved_by.is_(None)
        ).count()
        
        # Previous month calculations
        prev_assets = db.session.query(func.sum(GeneralLedger.amount)).filter(
            GeneralLedger.property_id.in_(property_ids),
            GeneralLedger.account_category == 'assets',
            GeneralLedger.transaction_type == 'debit',
            GeneralLedger.transaction_date >= prev_month_start,
            GeneralLedger.transaction_date < month_start
        ).scalar() or 0
        
        prev_liabilities = db.session.query(func.sum(GeneralLedger.amount)).filter(
            GeneralLedger.property_id.in_(property_ids),
            GeneralLedger.account_category == 'liabilities',
            GeneralLedger.transaction_type == 'credit',
            GeneralLedger.transaction_date >= prev_month_start,
            GeneralLedger.transaction_date < month_start
        ).scalar() or 0
        
        prev_net_worth = prev_assets - prev_liabilities
        prev_monthly_activity = GeneralLedger.query.filter(
            GeneralLedger.property_id.in_(property_ids),
            GeneralLedger.transaction_date >= prev_month_start,
            GeneralLedger.transaction_date < month_start
        ).count()
        
        # Calculate trends
        assets_trend = ((current_assets - prev_assets) / prev_assets * 100) if prev_assets > 0 else 0
        net_worth_trend = ((net_worth - prev_net_worth) / prev_net_worth * 100) if prev_net_worth > 0 else 0
        activity_trend = ((monthly_activity - prev_monthly_activity) / prev_monthly_activity * 100) if prev_monthly_activity > 0 else 0
        
        # Get chart data from actual ledger entries
        all_entries = GeneralLedger.query.filter(
            GeneralLedger.property_id.in_(property_ids)
        ).order_by(GeneralLedger.transaction_date).all()
        
        # Calculate account category balances
        category_totals = {}
        for entry in all_entries:
            if entry.account_category not in category_totals:
                category_totals[entry.account_category] = 0
            if entry.transaction_type == 'debit':
                category_totals[entry.account_category] += float(entry.amount)
            else:
                category_totals[entry.account_category] -= float(entry.amount)
        
        category_labels = list(category_totals.keys())
        category_values = [abs(v) for v in category_totals.values()]
        
        # Calculate monthly activity
        monthly_credits = []
        monthly_debits = []
        monthly_labels = []
        
        # Group by month for the last 6 months
        for i in range(6):
            month_date = date(current_date.year, current_date.month - i, 1)
            month_start_date = month_date.replace(day=1)
            if month_date.month == 1:
                month_end_date = month_date.replace(year=month_date.year - 1, month=12, day=31)
            else:
                month_end_date = month_date.replace(month=month_date.month - 1, day=28)
            
            month_entries = [e for e in all_entries if month_start_date <= e.transaction_date <= month_end_date]
            
            credits = sum(float(e.amount) for e in month_entries if e.transaction_type == 'credit')
            debits = sum(float(e.amount) for e in month_entries if e.transaction_type == 'debit')
            
            monthly_credits.insert(0, credits)
            monthly_debits.insert(0, debits)
            monthly_labels.insert(0, month_date.strftime('%b'))
        
        return jsonify({
            'totalAssets': float(current_assets),
            'netWorth': float(net_worth),
            'monthlyActivity': monthly_activity,
            'unreconciled': unreconciled,
            'assetsTrend': round(assets_trend, 1),
            'netWorthTrend': round(net_worth_trend, 1),
            'activityTrend': round(activity_trend, 1),
            'unreconciledTrend': -2,  # Mock trend
            'chartData': {
                'accountCategories': {
                    'labels': category_labels,
                    'values': category_values
                },
                'monthlyActivity': {
                    'labels': monthly_labels,
                    'credits': monthly_credits,
                    'debits': monthly_debits
                }
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@accountability_bp.route('/dashboard/banking', methods=['GET'])
@token_required
def get_banking_dashboard(current_user):
    """Get dashboard analytics for Banking page"""
    try:
        # Get user's properties
        properties = Property.query.filter_by(owner_id=current_user.id).all()
        property_ids = [p.id for p in properties]
        
        if not property_ids:
            return jsonify({
                'totalBalance': 0,
                'totalDeposits': 0,
                'totalWithdrawals': 0,
                'pendingTransactions': 0,
                'balanceTrend': 0,
                'depositsTrend': 0,
                'withdrawalsTrend': 0,
                'pendingTrend': 0,
                'chartData': {
                    'accountBalances': {
                        'labels': [],
                        'values': []
                    },
                    'transactionActivity': {
                        'labels': [],
                        'deposits': [],
                        'withdrawals': []
                    }
                }
            })
        
        # Get current month data
        current_date = date.today()
        month_start = date(current_date.year, current_date.month, 1)
        
        # Get previous month data
        if current_date.month == 1:
            prev_month_start = date(current_date.year - 1, 12, 1)
        else:
            prev_month_start = date(current_date.year, current_date.month - 1, 1)
        
        # Total balance across all accounts
        total_balance = db.session.query(func.sum(Banking.current_balance)).filter(
            Banking.property_id.in_(property_ids),
            Banking.is_active == True
        ).scalar() or 0
        
        # Current month transactions
        current_deposits = db.session.query(func.sum(BankingTransaction.amount)).filter(
            BankingTransaction.banking_account.has(Banking.property_id.in_(property_ids)),
            BankingTransaction.transaction_type == 'deposit',
            BankingTransaction.transaction_date >= month_start
        ).scalar() or 0
        
        current_withdrawals = db.session.query(func.sum(BankingTransaction.amount)).filter(
            BankingTransaction.banking_account.has(Banking.property_id.in_(property_ids)),
            BankingTransaction.transaction_type == 'withdrawal',
            BankingTransaction.transaction_date >= month_start
        ).scalar() or 0
        
        # Pending transactions
        pending_transactions = BankingTransaction.query.filter(
            BankingTransaction.banking_account.has(Banking.property_id.in_(property_ids)),
            BankingTransaction.status == 'pending'
        ).count()
        
        # Previous month calculations
        prev_deposits = db.session.query(func.sum(BankingTransaction.amount)).filter(
            BankingTransaction.banking_account.has(Banking.property_id.in_(property_ids)),
            BankingTransaction.transaction_type == 'deposit',
            BankingTransaction.transaction_date >= prev_month_start,
            BankingTransaction.transaction_date < month_start
        ).scalar() or 0
        
        prev_withdrawals = db.session.query(func.sum(BankingTransaction.amount)).filter(
            BankingTransaction.banking_account.has(Banking.property_id.in_(property_ids)),
            BankingTransaction.transaction_type == 'withdrawal',
            BankingTransaction.transaction_date >= prev_month_start,
            BankingTransaction.transaction_date < month_start
        ).scalar() or 0
        
        # Calculate trends
        deposits_trend = ((current_deposits - prev_deposits) / prev_deposits * 100) if prev_deposits > 0 else 0
        withdrawals_trend = ((current_withdrawals - prev_withdrawals) / prev_withdrawals * 100) if prev_withdrawals > 0 else 0
        
        # Get chart data from actual banking data
        banking_accounts = Banking.query.filter(
            Banking.property_id.in_(property_ids),
            Banking.is_active == True
        ).all()
        
        # Account balances chart data
        account_labels = []
        account_values = []
        for account in banking_accounts:
            account_labels.append(f"{account.bank_name} - {account.account_type.title()}")
            account_values.append(float(account.current_balance))
        
        # Transaction activity chart data
        all_transactions = BankingTransaction.query.filter(
            BankingTransaction.banking_account.has(Banking.property_id.in_(property_ids))
        ).order_by(BankingTransaction.transaction_date).all()
        
        # Group transactions by month for the last 6 months
        monthly_deposits = []
        monthly_withdrawals = []
        monthly_labels = []
        
        for i in range(6):
            month_date = date(current_date.year, current_date.month - i, 1)
            month_start_date = month_date.replace(day=1)
            if month_date.month == 1:
                month_end_date = month_date.replace(year=month_date.year - 1, month=12, day=31)
            else:
                month_end_date = month_date.replace(month=month_date.month - 1, day=28)
            
            month_transactions = [t for t in all_transactions if month_start_date <= t.transaction_date <= month_end_date]
            
            deposits = sum(float(t.amount) for t in month_transactions if t.transaction_type == 'deposit')
            withdrawals = sum(float(t.amount) for t in month_transactions if t.transaction_type == 'withdrawal')
            
            monthly_deposits.insert(0, deposits)
            monthly_withdrawals.insert(0, withdrawals)
            monthly_labels.insert(0, month_date.strftime('%b'))
        
        return jsonify({
            'totalBalance': float(total_balance),
            'totalDeposits': float(current_deposits),
            'totalWithdrawals': float(current_withdrawals),
            'pendingTransactions': pending_transactions,
            'balanceTrend': 8.5,  # Mock trend
            'depositsTrend': round(deposits_trend, 1),
            'withdrawalsTrend': round(withdrawals_trend, 1),
            'pendingTrend': -2,  # Mock trend
            'chartData': {
                'accountBalances': {
                    'labels': account_labels,
                    'values': account_values
                },
                'transactionActivity': {
                    'labels': monthly_labels,
                    'deposits': monthly_deposits,
                    'withdrawals': monthly_withdrawals
                }
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# ACCOUNTABILITY FINANCIALS ROUTES
# ============================================================================

@accountability_bp.route('/financials', methods=['POST'])
@token_required
def create_accountability_financial(current_user):
    """Create a new accountability financial record"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['property_id', 'financial_year', 'financial_period', 'period_start_date', 'period_end_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if property exists and user has access
        property = Property.query.get(data['property_id'])
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        if property.owner_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Parse dates
        try:
            period_start_date = datetime.strptime(data['period_start_date'], '%Y-%m-%d').date()
            period_end_date = datetime.strptime(data['period_end_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Check if financial record already exists for this period
        existing_record = AccountabilityFinancial.query.filter_by(
            property_id=data['property_id'],
            financial_year=data['financial_year'],
            financial_period=data['financial_period'],
            period_start_date=period_start_date,
            period_end_date=period_end_date
        ).first()
        
        if existing_record:
            return jsonify({'error': 'Financial record already exists for this period'}), 409
        
        # Create new financial record
        financial = AccountabilityFinancial(
            property_id=data['property_id'],
            user_id=current_user.id,
            financial_year=data['financial_year'],
            financial_period=data['financial_period'],
            period_start_date=period_start_date,
            period_end_date=period_end_date,
            total_rental_income=Decimal(str(data.get('total_rental_income', 0))),
            other_income=Decimal(str(data.get('other_income', 0))),
            mortgage_payments=Decimal(str(data.get('mortgage_payments', 0))),
            property_taxes=Decimal(str(data.get('property_taxes', 0))),
            insurance_costs=Decimal(str(data.get('insurance_costs', 0))),
            maintenance_costs=Decimal(str(data.get('maintenance_costs', 0))),
            utilities=Decimal(str(data.get('utilities', 0))),
            hoa_fees=Decimal(str(data.get('hoa_fees', 0))),
            property_management_fees=Decimal(str(data.get('property_management_fees', 0))),
            other_expenses=Decimal(str(data.get('other_expenses', 0))),
            notes=data.get('notes', '')
        )
        
        # Calculate totals
        financial.calculate_totals()
        
        db.session.add(financial)
        db.session.commit()
        
        return jsonify({
            'message': 'Financial record created successfully',
            'financial': {
                'id': financial.id,
                'property_id': financial.property_id,
                'financial_year': financial.financial_year,
                'financial_period': financial.financial_period,
                'total_income': float(financial.total_income),
                'total_expenses': float(financial.total_expenses),
                'net_income': float(financial.net_income)
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@accountability_bp.route('/financials', methods=['GET'])
@token_required
def get_accountability_financials(current_user):
    """Get all accountability financial records for user's properties"""
    try:
        # Get user's properties
        properties = Property.query.filter_by(owner_id=current_user.id).all()
        property_ids = [p.id for p in properties]
        
        # Get query parameters
        property_id = request.args.get('property_id')
        financial_year = request.args.get('financial_year')
        financial_period = request.args.get('financial_period')
        
        query = AccountabilityFinancial.query.filter(
            AccountabilityFinancial.property_id.in_(property_ids)
        )
        
        if property_id:
            query = query.filter_by(property_id=property_id)
        if financial_year:
            query = query.filter_by(financial_year=financial_year)
        if financial_period:
            query = query.filter_by(financial_period=financial_period)
        
        financials = query.order_by(AccountabilityFinancial.period_start_date.desc()).all()
        
        return jsonify([{
            'id': financial.id,
            'property_id': financial.property_id,
            'property_title': financial.property.title,
            'financial_year': financial.financial_year,
            'financial_period': financial.financial_period,
            'period_start_date': financial.period_start_date.isoformat(),
            'period_end_date': financial.period_end_date.isoformat(),
            'total_rental_income': float(financial.total_rental_income),
            'other_income': float(financial.other_income),
            'total_income': float(financial.total_income),
            'mortgage_payments': float(financial.mortgage_payments),
            'property_taxes': float(financial.property_taxes),
            'insurance_costs': float(financial.insurance_costs),
            'maintenance_costs': float(financial.maintenance_costs),
            'utilities': float(financial.utilities),
            'hoa_fees': float(financial.hoa_fees),
            'property_management_fees': float(financial.property_management_fees),
            'other_expenses': float(financial.other_expenses),
            'total_expenses': float(financial.total_expenses),
            'net_income': float(financial.net_income),
            'cash_flow': float(financial.cash_flow),
            'roi_percentage': float(financial.roi_percentage),
            'status': financial.status,
            'notes': financial.notes,
            'created_at': financial.created_at.isoformat() if financial.created_at else None
        } for financial in financials])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# GENERAL LEDGER ROUTES
# ============================================================================

@accountability_bp.route('/general-ledger', methods=['POST'])
@token_required
def create_general_ledger_entry(current_user):
    """Create a new general ledger entry"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['property_id', 'transaction_type', 'account_category', 'account_subcategory', 'amount', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if property exists and user has access
        property = Property.query.get(data['property_id'])
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        if property.owner_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Parse date
        transaction_date = datetime.strptime(data.get('transaction_date', date.today().isoformat()), '%Y-%m-%d').date()
        
        # Calculate running balance
        last_entry = GeneralLedger.query.filter_by(property_id=data['property_id']).order_by(desc(GeneralLedger.id)).first()
        running_balance = last_entry.running_balance if last_entry else 0
        
        if data['transaction_type'] == 'debit':
            running_balance += Decimal(str(data['amount']))
        else:
            running_balance -= Decimal(str(data['amount']))
        
        # Create new ledger entry
        ledger_entry = GeneralLedger(
            property_id=data['property_id'],
            user_id=current_user.id,
            transaction_date=transaction_date,
            transaction_type=data['transaction_type'],
            account_category=data['account_category'],
            account_subcategory=data['account_subcategory'],
            amount=Decimal(str(data['amount'])),
            running_balance=running_balance,
            reference_number=data.get('reference_number', ''),
            description=data['description'],
            notes=data.get('notes', ''),
            posted_by=f"{current_user.first_name} {current_user.last_name}"
        )
        
        db.session.add(ledger_entry)
        db.session.commit()
        
        return jsonify({
            'message': 'Ledger entry created successfully',
            'entry': {
                'id': ledger_entry.id,
                'transaction_date': ledger_entry.transaction_date.isoformat(),
                'amount': float(ledger_entry.amount),
                'running_balance': float(ledger_entry.running_balance)
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@accountability_bp.route('/general-ledger', methods=['GET'])
@token_required
def get_general_ledger_entries(current_user):
    """Get all general ledger entries for user's properties"""
    try:
        # Get user's properties
        properties = Property.query.filter_by(owner_id=current_user.id).all()
        property_ids = [p.id for p in properties]
        
        # Get query parameters
        property_id = request.args.get('property_id')
        account_category = request.args.get('account_category')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = GeneralLedger.query.filter(
            GeneralLedger.property_id.in_(property_ids)
        )
        
        if property_id:
            query = query.filter_by(property_id=property_id)
        if account_category:
            query = query.filter_by(account_category=account_category)
        if start_date:
            query = query.filter(GeneralLedger.transaction_date >= start_date)
        if end_date:
            query = query.filter(GeneralLedger.transaction_date <= end_date)
        
        entries = query.order_by(desc(GeneralLedger.transaction_date)).all()
        
        return jsonify([{
            'id': entry.id,
            'property_id': entry.property_id,
            'property_title': entry.property.title,
            'transaction_date': entry.transaction_date.isoformat(),
            'transaction_type': entry.transaction_type,
            'account_category': entry.account_category,
            'account_subcategory': entry.account_subcategory,
            'amount': float(entry.amount),
            'running_balance': float(entry.running_balance),
            'reference_number': entry.reference_number,
            'description': entry.description,
            'notes': entry.notes,
            'posted_by': entry.posted_by,
            'approved_by': entry.approved_by,
            'approval_date': entry.approval_date.isoformat() if entry.approval_date else None,
            'created_at': entry.created_at.isoformat() if entry.created_at else None
        } for entry in entries])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# BANKING ROUTES
# ============================================================================

@accountability_bp.route('/banking', methods=['POST'])
@token_required
def create_banking_account(current_user):
    """Create a new banking account"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['property_id', 'bank_name', 'account_name', 'account_number', 'account_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if property exists and user has access
        property = Property.query.get(data['property_id'])
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        if property.owner_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Create new banking account
        banking_account = Banking(
            property_id=data['property_id'],
            user_id=current_user.id,
            bank_name=data['bank_name'],
            account_name=data['account_name'],
            account_number=data['account_number'],
            account_type=data['account_type'],
            routing_number=data.get('routing_number', ''),
            current_balance=Decimal(str(data.get('current_balance', 0))),
            available_balance=Decimal(str(data.get('available_balance', 0))),
            interest_rate=Decimal(str(data.get('interest_rate', 0))),
            monthly_fee=Decimal(str(data.get('monthly_fee', 0))),
            is_primary=data.get('is_primary', False),
            notes=data.get('notes', '')
        )
        
        db.session.add(banking_account)
        db.session.commit()
        
        return jsonify({
            'message': 'Banking account created successfully',
            'account': {
                'id': banking_account.id,
                'bank_name': banking_account.bank_name,
                'account_name': banking_account.account_name,
                'current_balance': float(banking_account.current_balance)
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@accountability_bp.route('/banking', methods=['GET'])
@token_required
def get_banking_accounts(current_user):
    """Get all banking accounts for user's properties"""
    try:
        # Get user's properties
        properties = Property.query.filter_by(owner_id=current_user.id).all()
        property_ids = [p.id for p in properties]
        
        # Get query parameters
        property_id = request.args.get('property_id')
        account_type = request.args.get('account_type')
        
        query = Banking.query.filter(
            Banking.property_id.in_(property_ids)
        )
        
        if property_id:
            query = query.filter_by(property_id=property_id)
        if account_type:
            query = query.filter_by(account_type=account_type)
        
        accounts = query.order_by(Banking.is_primary.desc(), Banking.bank_name).all()
        
        return jsonify([{
            'id': account.id,
            'property_id': account.property_id,
            'property_title': account.property.title,
            'bank_name': account.bank_name,
            'account_name': account.account_name,
            'account_number': account.account_number,
            'account_type': account.account_type,
            'routing_number': account.routing_number,
            'current_balance': float(account.current_balance),
            'available_balance': float(account.available_balance),
            'last_reconciliation_date': account.last_reconciliation_date.isoformat() if account.last_reconciliation_date else None,
            'is_active': account.is_active,
            'is_primary': account.is_primary,
            'interest_rate': float(account.interest_rate),
            'monthly_fee': float(account.monthly_fee),
            'notes': account.notes,
            'created_at': account.created_at.isoformat() if account.created_at else None
        } for account in accounts])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@accountability_bp.route('/banking/<int:account_id>/transactions', methods=['POST'])
@token_required
def create_banking_transaction(current_user, account_id):
    """Create a new banking transaction"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['transaction_type', 'amount', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if banking account exists and user has access
        banking_account = Banking.query.get(account_id)
        if not banking_account:
            return jsonify({'error': 'Banking account not found'}), 404
        
        if banking_account.property.owner_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Parse dates
        transaction_date = datetime.strptime(data.get('transaction_date', date.today().isoformat()), '%Y-%m-%d').date()
        posted_date = datetime.strptime(data.get('posted_date', date.today().isoformat()), '%Y-%m-%d').date()
        
        # Calculate new balance
        amount = Decimal(str(data['amount']))
        if data['transaction_type'] in ['deposit', 'interest']:
            balance_after = banking_account.current_balance + amount
        else:
            balance_after = banking_account.current_balance - amount
        
        # Create new transaction
        transaction = BankingTransaction(
            banking_account_id=account_id,
            transaction_date=transaction_date,
            posted_date=posted_date,
            transaction_type=data['transaction_type'],
            amount=amount,
            balance_after=balance_after,
            description=data['description'],
            reference_number=data.get('reference_number', ''),
            payee=data.get('payee', ''),
            category=data.get('category', ''),
            status=data.get('status', 'pending'),
            notes=data.get('notes', '')
        )
        
        # Update account balance
        banking_account.current_balance = balance_after
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Transaction created successfully',
            'transaction': {
                'id': transaction.id,
                'amount': float(transaction.amount),
                'balance_after': float(transaction.balance_after)
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@accountability_bp.route('/banking/<int:account_id>/transactions', methods=['GET'])
@token_required
def get_banking_transactions(current_user, account_id):
    """Get all transactions for a specific banking account"""
    try:
        # Check if banking account exists and user has access
        banking_account = Banking.query.get(account_id)
        if not banking_account:
            return jsonify({'error': 'Banking account not found'}), 404
        
        if banking_account.property.owner_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        transactions = BankingTransaction.query.filter_by(
            banking_account_id=account_id
        ).order_by(desc(BankingTransaction.transaction_date)).all()
        
        return jsonify([{
            'id': transaction.id,
            'banking_account_id': transaction.banking_account_id,
            'transaction_date': transaction.transaction_date.isoformat(),
            'posted_date': transaction.posted_date.isoformat(),
            'transaction_type': transaction.transaction_type,
            'amount': float(transaction.amount),
            'balance_after': float(transaction.balance_after),
            'description': transaction.description,
            'reference_number': transaction.reference_number,
            'payee': transaction.payee,
            'category': transaction.category,
            'status': transaction.status,
            'is_reconciled': transaction.is_reconciled,
            'reconciliation_date': transaction.reconciliation_date.isoformat() if transaction.reconciliation_date else None,
            'notes': transaction.notes,
            'created_at': transaction.created_at.isoformat() if transaction.created_at else None
        } for transaction in transactions])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
