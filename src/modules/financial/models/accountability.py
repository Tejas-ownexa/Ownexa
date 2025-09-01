from models import db
from datetime import datetime, date
from models import BaseModel
from decimal import Decimal

class AccountabilityFinancial(BaseModel):
    __tablename__ = 'accountability_financials'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    
    # Financial Details
    financial_year = db.Column(db.Integer, nullable=False)  # e.g., 2024
    financial_period = db.Column(db.String(20), nullable=False)  # monthly, quarterly, annually
    period_start_date = db.Column(db.Date, nullable=False)
    period_end_date = db.Column(db.Date, nullable=False)
    
    # Income Tracking
    total_rental_income = db.Column(db.Numeric(12, 2), default=0)
    other_income = db.Column(db.Numeric(12, 2), default=0)
    total_income = db.Column(db.Numeric(12, 2), default=0)
    
    # Expense Tracking
    mortgage_payments = db.Column(db.Numeric(12, 2), default=0)
    property_taxes = db.Column(db.Numeric(12, 2), default=0)
    insurance_costs = db.Column(db.Numeric(12, 2), default=0)
    maintenance_costs = db.Column(db.Numeric(12, 2), default=0)
    utilities = db.Column(db.Numeric(12, 2), default=0)
    hoa_fees = db.Column(db.Numeric(12, 2), default=0)
    property_management_fees = db.Column(db.Numeric(12, 2), default=0)
    other_expenses = db.Column(db.Numeric(12, 2), default=0)
    total_expenses = db.Column(db.Numeric(12, 2), default=0)
    
    # Net Results
    net_income = db.Column(db.Numeric(12, 2), default=0)
    cash_flow = db.Column(db.Numeric(12, 2), default=0)
    roi_percentage = db.Column(db.Numeric(5, 2), default=0)  # Return on Investment
    
    # Status and Notes
    status = db.Column(db.String(20), default='draft')  # draft, submitted, approved, rejected
    notes = db.Column(db.Text)
    
    # Relationships (commented out to avoid circular imports)
    # property = db.relationship('Property', back_populates='accountability_financials')
    # user = db.relationship('User', back_populates='accountability_financials')
    
    # Status constants
    STATUS_DRAFT = 'draft'
    STATUS_SUBMITTED = 'submitted'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    
    def calculate_totals(self):
        """Calculate totals based on individual line items"""
        self.total_income = self.total_rental_income + self.other_income
        self.total_expenses = (
            self.mortgage_payments + self.property_taxes + self.insurance_costs +
            self.maintenance_costs + self.utilities + self.hoa_fees +
            self.property_management_fees + self.other_expenses
        )
        self.net_income = self.total_income - self.total_expenses
        return self.net_income

class GeneralLedger(BaseModel):
    __tablename__ = 'general_ledger'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    
    # Transaction Details
    transaction_date = db.Column(db.Date, nullable=False, default=date.today)
    transaction_type = db.Column(db.String(50), nullable=False)  # debit, credit
    account_category = db.Column(db.String(100), nullable=False)  # assets, liabilities, equity, revenue, expenses
    account_subcategory = db.Column(db.String(100), nullable=False)  # cash, accounts_receivable, rent_income, etc.
    
    # Amount and Balance
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    running_balance = db.Column(db.Numeric(12, 2), nullable=False)
    
    # Reference Information
    reference_number = db.Column(db.String(100))  # invoice number, check number, etc.
    description = db.Column(db.Text, nullable=False)
    notes = db.Column(db.Text)
    
    # Audit Information
    posted_by = db.Column(db.String(100))
    approved_by = db.Column(db.String(100))
    approval_date = db.Column(db.DateTime)
    
    # Relationships (commented out to avoid circular imports)
    # property = db.relationship('Property', back_populates='general_ledger_entries')
    # user = db.relationship('User', back_populates='general_ledger_entries')
    
    # Transaction type constants
    TYPE_DEBIT = 'debit'
    TYPE_CREDIT = 'credit'
    
    # Account category constants
    CATEGORY_ASSETS = 'assets'
    CATEGORY_LIABILITIES = 'liabilities'
    CATEGORY_EQUITY = 'equity'
    CATEGORY_REVENUE = 'revenue'
    CATEGORY_EXPENSES = 'expenses'

class Banking(BaseModel):
    __tablename__ = 'banking'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    
    # Bank Account Information
    bank_name = db.Column(db.String(100), nullable=False)
    account_name = db.Column(db.String(100), nullable=False)
    account_number = db.Column(db.String(50), nullable=False)
    account_type = db.Column(db.String(50), nullable=False)  # checking, savings, escrow
    routing_number = db.Column(db.String(20))
    
    # Balance Information
    current_balance = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    available_balance = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    last_reconciliation_date = db.Column(db.Date)
    
    # Account Status
    is_active = db.Column(db.Boolean, default=True)
    is_primary = db.Column(db.Boolean, default=False)  # Primary account for the property
    
    # Additional Information
    interest_rate = db.Column(db.Numeric(5, 4), default=0)  # Annual interest rate
    monthly_fee = db.Column(db.Numeric(8, 2), default=0)
    notes = db.Column(db.Text)
    
    # Relationships (commented out to avoid circular imports)
    # property = db.relationship('Property', back_populates='banking_accounts')
    # user = db.relationship('User', back_populates='banking_accounts')
    transactions = db.relationship('BankingTransaction', back_populates='banking_account', cascade='all, delete-orphan')
    
    # Account type constants
    TYPE_CHECKING = 'checking'
    TYPE_SAVINGS = 'savings'
    TYPE_ESCROW = 'escrow'
    TYPE_MONEY_MARKET = 'money_market'

class BankingTransaction(BaseModel):
    __tablename__ = 'banking_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    banking_account_id = db.Column(db.Integer, db.ForeignKey('banking.id', ondelete='CASCADE'), nullable=False)
    
    # Transaction Details
    transaction_date = db.Column(db.Date, nullable=False, default=date.today)
    posted_date = db.Column(db.Date, nullable=False, default=date.today)
    transaction_type = db.Column(db.String(50), nullable=False)  # deposit, withdrawal, transfer, fee, interest
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    balance_after = db.Column(db.Numeric(12, 2), nullable=False)
    
    # Transaction Information
    description = db.Column(db.Text, nullable=False)
    reference_number = db.Column(db.String(100))  # check number, transaction ID
    payee = db.Column(db.String(200))  # Who the transaction is with
    category = db.Column(db.String(100))  # rent_income, mortgage_payment, maintenance, etc.
    
    # Status and Reconciliation
    status = db.Column(db.String(20), default='pending')  # pending, cleared, reconciled
    is_reconciled = db.Column(db.Boolean, default=False)
    reconciliation_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    
    # Relationships
    banking_account = db.relationship('Banking', back_populates='transactions')
    
    # Transaction type constants
    TYPE_DEPOSIT = 'deposit'
    TYPE_WITHDRAWAL = 'withdrawal'
    TYPE_TRANSFER = 'transfer'
    TYPE_FEE = 'fee'
    TYPE_INTEREST = 'interest'
    
    # Status constants
    STATUS_PENDING = 'pending'
    STATUS_CLEARED = 'cleared'
    STATUS_RECONCILED = 'reconciled'
