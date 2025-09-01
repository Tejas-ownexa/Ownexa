import io
import os
from datetime import datetime, date
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.platypus.frames import Frame
from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER

class PropertyReportPDFGenerator:
    """Generate professional PDF reports for property management"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Setup custom styles for the PDF"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#2563eb'),
            alignment=TA_CENTER
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            spaceBefore=20,
            textColor=colors.HexColor('#1f2937'),
            borderWidth=0,
            borderColor=colors.HexColor('#e5e7eb'),
            borderPadding=5
        ))
        
        # Subsection style
        self.styles.add(ParagraphStyle(
            name='Subsection',
            parent=self.styles['Heading3'],
            fontSize=14,
            spaceAfter=8,
            spaceBefore=12,
            textColor=colors.HexColor('#374151')
        ))
        
        # Info style
        self.styles.add(ParagraphStyle(
            name='InfoText',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            textColor=colors.HexColor('#4b5563')
        ))
        
        # Highlight style
        self.styles.add(ParagraphStyle(
            name='Highlight',
            parent=self.styles['Normal'],
            fontSize=12,
            spaceAfter=6,
            textColor=colors.HexColor('#059669'),
            fontName='Helvetica-Bold'
        ))
    
    def create_header_footer(self, canvas, doc):
        """Create header and footer for each page"""
        # Header
        canvas.saveState()
        canvas.setFont('Helvetica-Bold', 10)
        canvas.setFillColor(colors.HexColor('#6b7280'))
        canvas.drawString(inch, letter[1] - 0.5*inch, "Property Management Report")
        canvas.drawRightString(letter[0] - inch, letter[1] - 0.5*inch, 
                              f"Generated: {datetime.now().strftime('%m/%d/%Y %I:%M %p')}")
        
        # Footer
        canvas.setFont('Helvetica', 9)
        canvas.drawCentredString(letter[0]/2.0, 0.5*inch, f"Page {doc.page}")
        canvas.restoreState()
    
    def generate_tenant_report_pdf(self, report_data, owner_name="Property Owner"):
        """Generate a comprehensive tenant report PDF"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1*inch, bottomMargin=1*inch)
        story = []
        
        # Title
        title = f"Comprehensive Tenant Report"
        story.append(Paragraph(title, self.styles['CustomTitle']))
        story.append(Spacer(1, 20))
        
        # Report metadata
        tenant_name = report_data.get('tenant_info', {}).get('name', 'Unknown Tenant')
        story.append(Paragraph(f"<b>Tenant:</b> {tenant_name}", self.styles['InfoText']))
        story.append(Paragraph(f"<b>Generated for:</b> {owner_name}", self.styles['InfoText']))
        story.append(Paragraph(f"<b>Report Date:</b> {report_data.get('generated_date', 'N/A')}", self.styles['InfoText']))
        story.append(Spacer(1, 20))
        
        # Tenant Information Section
        story.append(Paragraph("📋 Tenant Information", self.styles['SectionHeader']))
        
        tenant_info = report_data.get('tenant_info', {})
        tenant_data = [
            ['Field', 'Information'],
            ['Full Name', tenant_info.get('name', 'N/A')],
            ['Email', tenant_info.get('email', 'N/A')],
            ['Phone', tenant_info.get('phone', 'N/A')],
            ['Tenant ID', str(tenant_info.get('tenant_id', 'N/A'))]
        ]
        
        tenant_table = Table(tenant_data, colWidths=[2*inch, 4*inch])
        tenant_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(tenant_table)
        story.append(Spacer(1, 20))
        
        # Property Information Section
        story.append(Paragraph("🏠 Property Information", self.styles['SectionHeader']))
        
        property_info = report_data.get('property_info', {})
        property_data = [
            ['Field', 'Information'],
            ['Property Name', property_info.get('title', 'N/A')],
            ['Address', property_info.get('address', 'N/A')],
            ['Unit', property_info.get('unit', 'N/A')]
        ]
        
        property_table = Table(property_data, colWidths=[2*inch, 4*inch])
        property_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(property_table)
        story.append(Spacer(1, 20))
        
        # Lease Information Section
        story.append(Paragraph("📄 Lease Information", self.styles['SectionHeader']))
        
        lease_info = report_data.get('lease_info', {})
        lease_data = [
            ['Field', 'Information'],
            ['Start Date', lease_info.get('start_date', 'N/A')],
            ['End Date', lease_info.get('end_date', 'N/A')],
            ['Status', lease_info.get('status', 'N/A')],
            ['Days Remaining', str(lease_info.get('days_remaining', 'N/A'))],
            ['Monthly Rent', f"${lease_info.get('monthly_rent', 0):,.2f}"],
            ['Lease Duration', f"{lease_info.get('duration_days', 0)} days"]
        ]
        
        lease_table = Table(lease_data, colWidths=[2*inch, 4*inch])
        lease_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(lease_table)
        story.append(Spacer(1, 20))
        
        # Financial Summary Section
        story.append(Paragraph("💰 Financial Summary", self.styles['SectionHeader']))
        
        financial_info = report_data.get('financial_summary', {})
        financial_data = [
            ['Metric', 'Value'],
            ['Total Payments Received', f"${financial_info.get('total_payments_received', 0):,.2f}"],
            ['Number of Payments', str(financial_info.get('number_of_payments', 0))],
            ['On-Time Payments', str(financial_info.get('on_time_payments', 0))],
            ['Late Payments', str(financial_info.get('late_payments', 0))],
            ['Payment Reliability', financial_info.get('payment_reliability', 'N/A')],
            ['Outstanding Balance', f"${financial_info.get('outstanding_balance', 0):,.2f}"]
        ]
        
        financial_table = Table(financial_data, colWidths=[2.5*inch, 3.5*inch])
        financial_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(financial_table)
        story.append(Spacer(1, 20))
        
        # Recent Payments Section
        story.append(Paragraph("💳 Recent Payment History", self.styles['SectionHeader']))
        
        recent_payments = report_data.get('recent_payments', [])
        if recent_payments:
            payment_data = [['Date', 'Amount', 'Method', 'Status']]
            for payment in recent_payments[:6]:  # Show last 6 payments
                payment_data.append([
                    payment.get('date', 'N/A'),
                    f"${payment.get('amount', 0):,.2f}",
                    payment.get('method', 'N/A'),
                    payment.get('status', 'N/A')
                ])
            
            payment_table = Table(payment_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
            payment_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
            ]))
            story.append(payment_table)
        else:
            story.append(Paragraph("No payment history available.", self.styles['InfoText']))
        
        story.append(Spacer(1, 20))
        
        # Maintenance Summary Section
        story.append(Paragraph("🔧 Maintenance Summary", self.styles['SectionHeader']))
        
        maintenance_info = report_data.get('maintenance_summary', {})
        maintenance_data = [
            ['Metric', 'Count'],
            ['Total Requests', str(maintenance_info.get('total_requests', 0))],
            ['Pending Requests', str(maintenance_info.get('pending_requests', 0))],
            ['Completed Requests', str(maintenance_info.get('completed_requests', 0))]
        ]
        
        maintenance_table = Table(maintenance_data, colWidths=[3*inch, 3*inch])
        maintenance_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(maintenance_table)
        
        # Recent maintenance requests
        recent_requests = maintenance_info.get('recent_requests', [])
        if recent_requests:
            story.append(Spacer(1, 15))
            story.append(Paragraph("Recent Maintenance Requests:", self.styles['Subsection']))
            
            request_data = [['Date', 'Title', 'Status', 'Priority']]
            for req in recent_requests:
                request_data.append([
                    req.get('date', 'N/A'),
                    req.get('title', 'N/A')[:30] + ('...' if len(req.get('title', '')) > 30 else ''),
                    req.get('status', 'N/A'),
                    req.get('priority', 'N/A')
                ])
            
            request_table = Table(request_data, colWidths=[1.2*inch, 2.5*inch, 1*inch, 1.3*inch])
            request_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
            ]))
            story.append(request_table)
        
        # Build PDF
        doc.build(story, onFirstPage=self.create_header_footer, onLaterPages=self.create_header_footer)
        buffer.seek(0)
        
        return buffer
    
    def generate_lease_expiration_pdf(self, report_data, owner_name="Property Owner"):
        """Generate lease expiration report PDF"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1*inch, bottomMargin=1*inch)
        story = []
        
        # Title
        story.append(Paragraph("Lease Expiration Report", self.styles['CustomTitle']))
        story.append(Spacer(1, 20))
        
        # Report metadata
        story.append(Paragraph(f"<b>Generated for:</b> {owner_name}", self.styles['InfoText']))
        story.append(Paragraph(f"<b>Report Date:</b> {report_data.get('generated_date', 'N/A')}", self.styles['InfoText']))
        story.append(Paragraph(f"<b>Period:</b> {report_data.get('period', 'N/A')}", self.styles['InfoText']))
        story.append(Paragraph(f"<b>Total Expiring:</b> {report_data.get('total_expiring', 0)} leases", self.styles['Highlight']))
        story.append(Spacer(1, 30))
        
        # Expiring leases table
        expiring_leases = report_data.get('expiring_leases', [])
        if expiring_leases:
            story.append(Paragraph("📅 Expiring Leases", self.styles['SectionHeader']))
            
            lease_data = [['Tenant', 'Property', 'End Date', 'Days Left', 'Monthly Rent', 'Contact']]
            
            for lease in expiring_leases:
                lease_data.append([
                    lease.get('tenant_name', 'N/A'),
                    lease.get('property', 'N/A')[:20] + ('...' if len(lease.get('property', '')) > 20 else ''),
                    lease.get('lease_end_date', 'N/A'),
                    str(lease.get('days_remaining', 'N/A')),
                    f"${lease.get('monthly_rent', 0):,.0f}",
                    lease.get('phone', 'N/A')
                ])
            
            lease_table = Table(lease_data, colWidths=[1.2*inch, 1.3*inch, 1*inch, 0.8*inch, 1*inch, 1.2*inch])
            lease_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
            ]))
            story.append(lease_table)
        else:
            story.append(Paragraph("No leases expiring in the specified period.", self.styles['InfoText']))
        
        # Build PDF
        doc.build(story, onFirstPage=self.create_header_footer, onLaterPages=self.create_header_footer)
        buffer.seek(0)
        
        return buffer
    
    def generate_financial_performance_pdf(self, report_data, owner_name="Property Owner"):
        """Generate financial performance report PDF"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1*inch, bottomMargin=1*inch)
        story = []
        
        # Title
        story.append(Paragraph("Financial Performance Report", self.styles['CustomTitle']))
        story.append(Spacer(1, 20))
        
        # Report metadata
        story.append(Paragraph(f"<b>Generated for:</b> {owner_name}", self.styles['InfoText']))
        story.append(Paragraph(f"<b>Report Date:</b> {report_data.get('generated_date', 'N/A')}", self.styles['InfoText']))
        story.append(Paragraph(f"<b>Period:</b> {report_data.get('period', 'N/A')}", self.styles['InfoText']))
        story.append(Spacer(1, 30))
        
        # Portfolio Summary
        portfolio = report_data.get('portfolio_summary', {})
        story.append(Paragraph("📊 Portfolio Summary", self.styles['SectionHeader']))
        
        portfolio_data = [
            ['Metric', 'Value'],
            ['Total Properties', str(portfolio.get('total_properties', 0))],
            ['Occupied Units', str(portfolio.get('occupied_units', 0))],
            ['Vacancy Rate', f"{portfolio.get('vacancy_rate', 0):.1f}%"],
            ['Total Monthly Rent', f"${portfolio.get('total_monthly_rent', 0):,.2f}"],
            ['Actual Monthly Income', f"${portfolio.get('actual_monthly_income', 0):,.2f}"]
        ]
        
        portfolio_table = Table(portfolio_data, colWidths=[3*inch, 3*inch])
        portfolio_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(portfolio_table)
        story.append(Spacer(1, 30))
        
        # Property Breakdown
        properties = report_data.get('property_breakdown', [])
        if properties:
            story.append(Paragraph("🏠 Property Breakdown", self.styles['SectionHeader']))
            
            prop_data = [['Property', 'Address', 'Occupancy', 'Monthly Rent', 'Outstanding', 'Tenants']]
            
            for prop in properties:
                prop_data.append([
                    prop.get('property_name', 'N/A')[:15] + ('...' if len(prop.get('property_name', '')) > 15 else ''),
                    prop.get('address', 'N/A')[:25] + ('...' if len(prop.get('address', '')) > 25 else ''),
                    f"{prop.get('occupancy_rate', 0):.0f}%",
                    f"${prop.get('monthly_rent', 0):,.0f}",
                    f"${prop.get('outstanding_balance', 0):,.0f}",
                    str(prop.get('tenant_count', 0))
                ])
            
            prop_table = Table(prop_data, colWidths=[1.2*inch, 1.5*inch, 0.8*inch, 1*inch, 1*inch, 0.5*inch])
            prop_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
            ]))
            story.append(prop_table)
        
        # Build PDF
        doc.build(story, onFirstPage=self.create_header_footer, onLaterPages=self.create_header_footer)
        buffer.seek(0)
        
        return buffer
    
    def generate_all_tenants_pdf(self, report_data, owner_name="Property Owner"):
        """Generate comprehensive all tenants report PDF"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1*inch, bottomMargin=1*inch)
        story = []
        
        # Title
        story.append(Paragraph("Comprehensive All Tenants Report", self.styles['CustomTitle']))
        story.append(Spacer(1, 20))
        
        # Report metadata
        story.append(Paragraph(f"<b>Generated for:</b> {owner_name}", self.styles['InfoText']))
        story.append(Paragraph(f"<b>Report Date:</b> {report_data.get('generated_date', 'N/A')}", self.styles['InfoText']))
        story.append(Paragraph(f"<b>Total Tenants:</b> {report_data.get('summary', {}).get('total_tenants', 0)}", self.styles['Highlight']))
        story.append(Spacer(1, 30))
        
        # Summary Section
        summary = report_data.get('summary', {})
        story.append(Paragraph("📊 Portfolio Summary", self.styles['SectionHeader']))
        
        summary_data = [
            ['Metric', 'Value'],
            ['Total Tenants', str(summary.get('total_tenants', 0))],
            ['Active Tenants', str(summary.get('active_tenants', 0))],
            ['Inactive Tenants', str(summary.get('inactive_tenants', 0))],
            ['Future Tenants', str(summary.get('future_tenants', 0))],
            ['Total Monthly Rent', summary.get('total_monthly_rent', '$0.00')],
            ['Total Outstanding Balance', summary.get('total_outstanding_balance', '$0.00')],
            ['Total Maintenance Requests', str(summary.get('total_maintenance_requests', 0))]
        ]
        
        summary_table = Table(summary_data, colWidths=[3*inch, 3*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 30))
        
        # Individual Tenant Details
        tenants = report_data.get('tenants', [])
        if tenants:
            story.append(Paragraph("👥 Individual Tenant Details", self.styles['SectionHeader']))
            
            for i, tenant in enumerate(tenants):
                if i > 0:
                    story.append(PageBreak())  # New page for each tenant after the first
                
                # Tenant header
                story.append(Paragraph(f"Tenant #{i+1}: {tenant.get('tenant_name', 'N/A')}", self.styles['Subsection']))
                story.append(Spacer(1, 10))
                
                # Basic Info Table
                basic_data = [
                    ['Field', 'Information'],
                    ['Full Name', tenant.get('tenant_name', 'N/A')],
                    ['Email', tenant.get('email', 'N/A')],
                    ['Phone', tenant.get('phone', 'N/A')],
                    ['Property', tenant.get('property_name', 'N/A')],
                    ['Property Address', tenant.get('property_address', 'N/A')]
                ]
                
                basic_table = Table(basic_data, colWidths=[2*inch, 4*inch])
                basic_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
                ]))
                story.append(basic_table)
                story.append(Spacer(1, 15))
                
                # Lease Info Table
                lease_data = [
                    ['Lease Detail', 'Value'],
                    ['Start Date', tenant.get('lease_start', 'N/A')],
                    ['End Date', tenant.get('lease_end', 'N/A')],
                    ['Status', tenant.get('lease_status', 'N/A')],
                    ['Days Remaining', str(tenant.get('days_remaining', 'N/A'))],
                    ['Monthly Rent', tenant.get('rent_amount', '$0.00')],
                    ['Payment Status', tenant.get('payment_status', 'N/A')]
                ]
                
                lease_table = Table(lease_data, colWidths=[2*inch, 4*inch])
                lease_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e0f2fe')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
                ]))
                story.append(lease_table)
                story.append(Spacer(1, 15))
                
                # Financial Info Table
                financial_data = [
                    ['Financial Detail', 'Value'],
                    ['Outstanding Balance', tenant.get('outstanding_balance', '$0.00')],
                    ['Maintenance Requests', str(tenant.get('maintenance_requests_count', 0))]
                ]
                
                financial_table = Table(financial_data, colWidths=[2*inch, 4*inch])
                financial_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0fdf4')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
                ]))
                story.append(financial_table)
                story.append(Spacer(1, 15))
                
                # Emergency Contact
                if tenant.get('emergency_contact') or tenant.get('emergency_phone'):
                    emergency_data = [
                        ['Emergency Contact', 'Information'],
                        ['Name', tenant.get('emergency_contact', 'N/A')],
                        ['Phone', tenant.get('emergency_phone', 'N/A')]
                    ]
                    
                    emergency_table = Table(emergency_data, colWidths=[2*inch, 4*inch])
                    emergency_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fef2f2')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, -1), 9),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
                    ]))
                    story.append(emergency_table)
                    story.append(Spacer(1, 15))
                
                # Recent Maintenance Requests
                maintenance_requests = tenant.get('maintenance_requests', [])
                if maintenance_requests:
                    story.append(Paragraph("Recent Maintenance Requests:", self.styles['InfoText']))
                    req_data = [['ID', 'Description', 'Status', 'Date']]
                    for req in maintenance_requests[:3]:  # Show max 3 requests per tenant
                        desc = req.get('description', 'N/A')
                        if len(desc) > 40:
                            desc = desc[:37] + '...'
                        req_data.append([
                            str(req.get('id', 'N/A')),
                            desc,
                            req.get('status', 'N/A'),
                            req.get('date', 'N/A')
                        ])
                    
                    req_table = Table(req_data, colWidths=[0.8*inch, 2.7*inch, 1*inch, 1.5*inch])
                    req_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fefce8')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, -1), 8),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
                    ]))
                    story.append(req_table)
                
                story.append(Spacer(1, 20))
        else:
            story.append(Paragraph("No tenant data available.", self.styles['InfoText']))
        
        # Build PDF
        doc.build(story, onFirstPage=self.create_header_footer, onLaterPages=self.create_header_footer)
        buffer.seek(0)
        
        return buffer

    def generate_comprehensive_report_pdf(self, report_data):
        """Generate a comprehensive property management report PDF"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1*inch, bottomMargin=1*inch)
        story = []
        
        # Title
        title = f"Comprehensive Property Management Report"
        story.append(Paragraph(title, self.styles['CustomTitle']))
        story.append(Spacer(1, 20))
        
        # Report metadata
        metadata = [
            f"Generated by: {report_data.get('generated_by', 'System')}",
            f"Date Range: {report_data.get('date_range', {}).get('start_date', 'N/A')} to {report_data.get('date_range', {}).get('end_date', 'N/A')}",
            f"Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}"
        ]
        
        for meta in metadata:
            story.append(Paragraph(meta, self.styles['InfoText']))
        
        story.append(Spacer(1, 20))
        
        # Overview Section
        overview = report_data.get('overview', {})
        if overview:
            story.append(Paragraph("Executive Summary", self.styles['SectionHeader']))
            
            overview_data = [
                ['Metric', 'Value'],
                ['Total Properties', str(overview.get('total_properties', 0))],
                ['Total Tenants', str(overview.get('total_tenants', 0))],
                ['Maintenance Requests', str(overview.get('total_maintenance_requests', 0))],
                ['Total Income', f"${overview.get('total_income', 0):,.2f}"],
                ['Total Expenses', f"${overview.get('total_expenses', 0):,.2f}"],
                ['Net Income', f"${overview.get('net_income', 0):,.2f}"],
                ['Occupancy Rate', f"{overview.get('occupancy_rate', 0):.1f}%"]
            ]
            
            overview_table = Table(overview_data, colWidths=[2.5*inch, 3.5*inch])
            overview_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
            ]))
            story.append(overview_table)
            story.append(Spacer(1, 20))
        
        # Sections
        sections = report_data.get('sections', {})
        
        # Properties Section
        if 'properties' in sections:
            story.append(Paragraph("Properties Overview", self.styles['SectionHeader']))
            properties = sections['properties'].get('properties', [])
            
            if properties:
                prop_data = [['Property', 'Address', 'Type', 'Status', 'Monthly Rent', 'Tenant']]
                for prop in properties[:10]:  # Limit to first 10 properties
                    prop_data.append([
                        prop.get('title', 'N/A'),
                        prop.get('address', 'N/A')[:30] + '...' if len(prop.get('address', '')) > 30 else prop.get('address', 'N/A'),
                        prop.get('property_type', 'N/A'),
                        prop.get('status', 'N/A'),
                        f"${prop.get('monthly_rent', 0):,.2f}",
                        prop.get('tenant_name', 'Vacant')
                    ])
                
                prop_table = Table(prop_data, colWidths=[1.5*inch, 1.5*inch, 1*inch, 1*inch, 1*inch, 1*inch])
                prop_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
                ]))
                story.append(prop_table)
            else:
                story.append(Paragraph("No properties found.", self.styles['InfoText']))
            
            story.append(Spacer(1, 20))
        
        # Tenants Section
        if 'tenants' in sections:
            story.append(Paragraph("Tenants Overview", self.styles['SectionHeader']))
            tenants = sections['tenants'].get('tenants', [])
            
            if tenants:
                tenant_data = [['Name', 'Property', 'Monthly Rent', 'Lease End', 'Status']]
                for tenant in tenants[:10]:  # Limit to first 10 tenants
                    tenant_data.append([
                        tenant.get('full_name', 'N/A'),
                        tenant.get('property_title', 'N/A')[:20] + '...' if len(tenant.get('property_title', '')) > 20 else tenant.get('property_title', 'N/A'),
                        f"${tenant.get('monthly_rent', 0):,.2f}",
                        tenant.get('lease_end', 'N/A'),
                        'Active' if tenant.get('is_active') else 'Inactive'
                    ])
                
                tenant_table = Table(tenant_data, colWidths=[1.5*inch, 1.5*inch, 1.2*inch, 1.2*inch, 1*inch])
                tenant_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
                ]))
                story.append(tenant_table)
            else:
                story.append(Paragraph("No tenants found.", self.styles['InfoText']))
            
            story.append(Spacer(1, 20))
        
        # Financial Section
        if 'financial' in sections:
            story.append(Paragraph("Financial Overview", self.styles['SectionHeader']))
            financial_summary = sections['financial'].get('summary', {})
            
            if financial_summary:
                fin_data = [
                    ['Financial Metric', 'Value'],
                    ['Total Income', f"${financial_summary.get('total_income', 0):,.2f}"],
                    ['Total Expenses', f"${financial_summary.get('total_expenses', 0):,.2f}"],
                    ['Net Income', f"${financial_summary.get('net_income', 0):,.2f}"],
                    ['Profit Margin', f"{financial_summary.get('profit_margin', 0):.1f}%"],
                    ['Total Transactions', str(financial_summary.get('total_transactions', 0))]
                ]
                
                fin_table = Table(fin_data, colWidths=[2.5*inch, 3.5*inch])
                fin_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
                ]))
                story.append(fin_table)
            else:
                story.append(Paragraph("No financial data available.", self.styles['InfoText']))
            
            story.append(Spacer(1, 20))
        
        # Maintenance Section
        if 'maintenance' in sections:
            story.append(Paragraph("Maintenance Overview", self.styles['SectionHeader']))
            maintenance_summary = sections['maintenance'].get('summary', {})
            
            if maintenance_summary:
                maint_data = [
                    ['Maintenance Metric', 'Value'],
                    ['Total Requests', str(maintenance_summary.get('total_requests', 0))],
                    ['Completed Requests', str(maintenance_summary.get('completed_requests', 0))],
                    ['Pending Requests', str(maintenance_summary.get('pending_requests', 0))],
                    ['Completion Rate', f"{maintenance_summary.get('completion_rate', 0):.1f}%"],
                    ['Total Cost', f"${maintenance_summary.get('total_cost', 0):,.2f}"],
                    ['Average Cost', f"${maintenance_summary.get('average_cost', 0):,.2f}"]
                ]
                
                maint_table = Table(maint_data, colWidths=[2.5*inch, 3.5*inch])
                maint_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f59e0b')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
                ]))
                story.append(maint_table)
            else:
                story.append(Paragraph("No maintenance data available.", self.styles['InfoText']))
        
        # Build PDF
        doc.build(story, onFirstPage=self.create_header_footer, onLaterPages=self.create_header_footer)
        buffer.seek(0)
        
        return buffer