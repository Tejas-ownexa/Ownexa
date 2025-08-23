from config import db
from datetime import datetime, date
from models import BaseModel
from decimal import Decimal

class PropertyFinancial(BaseModel):
    __tablename__ = 'property_financials'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False)
    
    # Property Value Information
    total_value = db.Column(db.Numeric(12, 2), nullable=False)  # Total property value
    purchase_price = db.Column(db.Numeric(12, 2), nullable=False)  # Original purchase price
    purchase_date = db.Column(db.Date, nullable=False)  # Date of purchase
    purchase_price_per_sqft = db.Column(db.Numeric(8, 2))  # Price per square foot
    
    # Mortgage Information
    mortgage_amount = db.Column(db.Numeric(12, 2), nullable=False)  # Total mortgage amount
    down_payment = db.Column(db.Numeric(12, 2), nullable=False)  # Down payment amount
    current_apr = db.Column(db.Numeric(5, 4), nullable=False)  # Annual Percentage Rate (e.g., 0.0450 for 4.5%)
    loan_term_years = db.Column(db.Integer, nullable=False, default=30)  # Loan term in years
    monthly_loan_payment = db.Column(db.Numeric(10, 2), nullable=False)  # Calculated monthly payment
    loan_payment_date = db.Column(db.Integer, nullable=False, default=1)  # Day of month for payment (1-31)
    
    # Additional Financial Details
    property_tax_annual = db.Column(db.Numeric(10, 2), default=0)  # Annual property tax
    insurance_annual = db.Column(db.Numeric(10, 2), default=0)  # Annual insurance cost
    hoa_fees_monthly = db.Column(db.Numeric(8, 2), default=0)  # Monthly HOA fees
    maintenance_reserve_monthly = db.Column(db.Numeric(8, 2), default=0)  # Monthly maintenance reserve
    
    # Relationships
    property = db.relationship('Property', back_populates='financial_details')
    loan_payments = db.relationship('LoanPayment', back_populates='property_financial', cascade='all, delete-orphan')
    
    def calculate_monthly_payment(self):
        """Calculate monthly mortgage payment using the standard formula"""
        if self.mortgage_amount <= 0 or self.current_apr <= 0 or self.loan_term_years <= 0:
            print(f"Invalid inputs for monthly payment calculation: mortgage_amount={self.mortgage_amount}, apr={self.current_apr}, term={self.loan_term_years}")
            return Decimal('0.00')
        
        # Convert APR to monthly rate (APR is stored as percentage, e.g., 4.5 for 4.5%)
        monthly_rate = self.current_apr / 12 / 100
        
        # Number of payments
        num_payments = self.loan_term_years * 12
        
        print(f"Monthly payment calculation: mortgage_amount={self.mortgage_amount}, apr={self.current_apr}%, monthly_rate={monthly_rate}, num_payments={num_payments}")
        
        # Standard mortgage payment formula
        if monthly_rate > 0:
            payment = self.mortgage_amount * (monthly_rate * (1 + monthly_rate) ** num_payments) / ((1 + monthly_rate) ** num_payments - 1)
            result = round(payment, 2)
            print(f"Calculated monthly payment: {result}")
            return result
        else:
            result = self.mortgage_amount / num_payments
            print(f"Calculated monthly payment (zero interest): {result}")
            return result
    
    def calculate_total_monthly_expenses(self):
        """Calculate total monthly expenses including mortgage, taxes, insurance, etc."""
        monthly_tax = self.property_tax_annual / 12 if self.property_tax_annual else 0
        monthly_insurance = self.insurance_annual / 12 if self.insurance_annual else 0
        
        total = (
            self.monthly_loan_payment +
            monthly_tax +
            monthly_insurance +
            self.hoa_fees_monthly +
            self.maintenance_reserve_monthly
        )
        result = round(total, 2)
        print(f"Total monthly expenses calculation:")
        print(f"  Monthly loan payment: {self.monthly_loan_payment}")
        print(f"  Monthly tax: {monthly_tax}")
        print(f"  Monthly insurance: {monthly_insurance}")
        print(f"  HOA fees: {self.hoa_fees_monthly}")
        print(f"  Maintenance reserve: {self.maintenance_reserve_monthly}")
        print(f"  Total: {result}")
        return result
    
    def calculate_cash_flow(self, monthly_rent):
        """Calculate monthly cash flow (rent - expenses)"""
        total_expenses = self.calculate_total_monthly_expenses()
        return round(monthly_rent - total_expenses, 2)
    
    def calculate_roi(self, monthly_rent):
        """Calculate Return on Investment percentage"""
        if self.down_payment <= 0:
            return 0
        
        annual_cash_flow = self.calculate_cash_flow(monthly_rent) * 12
        roi_percentage = (annual_cash_flow / self.down_payment) * 100
        return round(roi_percentage, 2)

class LoanPayment(BaseModel):
    __tablename__ = 'loan_payments'
    
    id = db.Column(db.Integer, primary_key=True)
    property_financial_id = db.Column(db.Integer, db.ForeignKey('property_financials.id', ondelete='CASCADE'), nullable=False)
    
    # Payment Details
    payment_date = db.Column(db.Date, nullable=False)  # Actual payment date
    due_date = db.Column(db.Date, nullable=False)  # Due date for the payment
    amount_paid = db.Column(db.Numeric(10, 2), nullable=False)  # Amount actually paid
    amount_due = db.Column(db.Numeric(10, 2), nullable=False)  # Amount that was due
    
    # Payment Status
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, paid, late, partial
    
    # Additional Information
    late_fees = db.Column(db.Numeric(8, 2), default=0)  # Late fees if any
    notes = db.Column(db.Text)  # Any additional notes
    
    # Relationships
    property_financial = db.relationship('PropertyFinancial', back_populates='loan_payments')
    
    # Status constants
    STATUS_PENDING = 'pending'
    STATUS_PAID = 'paid'
    STATUS_LATE = 'late'
    STATUS_PARTIAL = 'partial'
    STATUS_OVERDUE = 'overdue'

class FinancialTransaction(BaseModel):
    __tablename__ = 'financial_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False)
    
    # Transaction Details
    transaction_date = db.Column(db.Date, nullable=False, default=date.today)
    transaction_type = db.Column(db.String(50), nullable=False)  # rent_collected, mortgage_payment, expense, etc.
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    # Transaction Categories
    category = db.Column(db.String(50), nullable=False)  # income, expense, mortgage, maintenance, etc.
    
    # Additional Details
    reference_number = db.Column(db.String(100))  # Check number, transaction ID, etc.
    notes = db.Column(db.Text)
    
    # Relationships
    property = db.relationship('Property', back_populates='financial_transactions')
    
    # Transaction type constants
    TYPE_RENT_COLLECTED = 'rent_collected'
    TYPE_MORTGAGE_PAYMENT = 'mortgage_payment'
    TYPE_PROPERTY_TAX = 'property_tax'
    TYPE_INSURANCE = 'insurance'
    TYPE_MAINTENANCE = 'maintenance'
    TYPE_HOA_FEES = 'hoa_fees'
    TYPE_UTILITIES = 'utilities'
    TYPE_OTHER_EXPENSE = 'other_expense'
    TYPE_OTHER_INCOME = 'other_income'
    
    # Category constants
    CATEGORY_INCOME = 'income'
    CATEGORY_EXPENSE = 'expense'
    CATEGORY_MORTGAGE = 'mortgage'
    CATEGORY_TAX = 'tax'
    CATEGORY_INSURANCE = 'insurance'
    CATEGORY_MAINTENANCE = 'maintenance'
    CATEGORY_HOA = 'hoa'
    CATEGORY_UTILITIES = 'utilities'
    CATEGORY_OTHER = 'other'
