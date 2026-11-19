import os
import io
import csv
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import Project, Milestone, FinancialTransaction, ProgressUpdate, IssueRisk
from app.services.risk_engine import evaluate_all_risks
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_csv_report(report_type: str, db: Session, params: Optional[Dict[str, Any]] = None) -> str:
    """
    Generates CSV string with proper government metadata and synthetic data labels.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Metadata Header
    writer.writerow(["GOVERNMENT OF UTTAR PRADESH - DEPARTMENT OF TOURISM & CULTURE"])
    writer.writerow(["EXECUTIVE PROJECT MONITORING & DECISION SUPPORT SYSTEM"])
    writer.writerow([f"REPORT TYPE: {report_type.upper().replace('_', ' ')}"])
    writer.writerow([f"GENERATION DATE: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"])
    writer.writerow(["DATA NOTICE: [SYNTHETIC DEMO DATA] Generated for demonstration and review purposes."])
    writer.writerow([])
    
    projects = db.query(Project).all()
    
    if report_type == "portfolio":
        writer.writerow(["Project ID", "External ID", "Project Name", "Scheme", "District", "Status", "Approved Budget (INR)", "Revised Budget (INR)", "Total Spent (INR)", "Utilisation %", "Physical Progress %"])
        for p in projects:
            spent = sum(t.amount_spent for t in p.financial_transactions if t.amount_spent)
            baseline = p.revised_budget if (p.revised_budget and p.revised_budget > 0) else p.approved_budget
            util = round(spent / baseline * 100.0, 1) if baseline > 0 else 0.0
            latest = db.query(ProgressUpdate).filter(ProgressUpdate.project_id == p.project_id).order_by(ProgressUpdate.report_date.desc()).first()
            prog = latest.progress_percent if latest else 0.0
            writer.writerow([
                p.project_id, p.external_project_id, p.project_name, p.scheme_name, p.district,
                p.project_status, p.approved_budget, p.revised_budget or p.approved_budget,
                spent, util, prog
            ])
            
    elif report_type == "delayed_projects":
        writer.writerow(["External ID", "Project Name", "District", "Implementing Agency", "Original End Date", "Revised End Date", "Approved Budget (INR)", "Physical Progress %", "Status"])
        for p in projects:
            if p.project_status == "Delayed":
                latest = db.query(ProgressUpdate).filter(ProgressUpdate.project_id == p.project_id).order_by(ProgressUpdate.report_date.desc()).first()
                prog = latest.progress_percent if latest else 0.0
                writer.writerow([
                    p.external_project_id, p.project_name, p.district, p.implementing_agency,
                    p.original_end_date, p.revised_end_date or "N/A", p.approved_budget, prog, p.project_status
                ])
                
    elif report_type == "financial_utilisation":
        writer.writerow(["External ID", "Project Name", "District", "Approved Budget (Cr)", "Revised Budget (Cr)", "Amount Released (Cr)", "Amount Spent (Cr)", "Utilisation %", "Physical Progress %", "Variance Gap %"])
        for p in projects:
            spent = sum(t.amount_spent for t in p.financial_transactions if t.amount_spent)
            released = sum(t.amount_released for t in p.financial_transactions if t.amount_released)
            baseline = p.revised_budget if (p.revised_budget and p.revised_budget > 0) else p.approved_budget
            util = round(spent / baseline * 100.0, 1) if baseline > 0 else 0.0
            latest = db.query(ProgressUpdate).filter(ProgressUpdate.project_id == p.project_id).order_by(ProgressUpdate.report_date.desc()).first()
            prog = latest.progress_percent if latest else 0.0
            gap = round(util - prog, 1)
            writer.writerow([
                p.external_project_id, p.project_name, p.district,
                round(p.approved_budget / 1e7, 2), round((p.revised_budget or p.approved_budget) / 1e7, 2),
                round(released / 1e7, 2), round(spent / 1e7, 2),
                util, prog, gap
            ])
            
    elif report_type == "risks":
        alerts = evaluate_all_risks(db)
        writer.writerow(["Alert ID", "External Project ID", "Project Name", "District", "Category", "Severity", "Triggering Condition", "Recommended Action", "Status"])
        for a in alerts:
            writer.writerow([
                a.alert_id, a.external_project_id, a.project_name, a.district,
                a.risk_category, a.severity, a.triggering_condition, a.recommended_next_action, a.review_status
            ])
            
    else: # District report
        writer.writerow(["District", "Project Name", "Scheme", "Status", "Approved Budget (Cr)", "Physical Progress %"])
        for p in projects:
            latest = db.query(ProgressUpdate).filter(ProgressUpdate.project_id == p.project_id).order_by(ProgressUpdate.report_date.desc()).first()
            prog = latest.progress_percent if latest else 0.0
            writer.writerow([
                p.district, p.project_name, p.scheme_name, p.project_status,
                round(p.approved_budget / 1e7, 2), prog
            ])
            
    return output.getvalue()

def generate_pdf_report(report_type: str, db: Session, params: Optional[Dict[str, Any]] = None) -> bytes:
    """
    Generates professional PDF report with Government of UP styling using reportlab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'GovernmentTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0B3B60'), # UP Tourism Deep Navy
        alignment=1 # Center
    )
    subtitle_style = ParagraphStyle(
        'GovernmentSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )
    disclaimer_style = ParagraphStyle(
        'SyntheticDisclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#DC2626'),
        alignment=1
    )
    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10
    )
    cell_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    story = []
    
    # Header
    story.append(Paragraph("GOVERNMENT OF UTTAR PRADESH", title_style))
    story.append(Paragraph("DEPARTMENT OF TOURISM & CULTURE — PROJECT MONITORING & DECISION SUPPORT SYSTEM", subtitle_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"<b>OFFICIAL STATUS REPORT: {report_type.upper().replace('_', ' ')}</b> | Generated: {datetime.now().strftime('%d %B %Y %H:%M')}", subtitle_style))
    story.append(Paragraph("NOTICE: [SYNTHETIC DEMO DATA] Generated strictly for demonstration purposes.", disclaimer_style))
    story.append(Spacer(1, 12))
    
    projects = db.query(Project).all()
    
    if report_type in ["portfolio", "financial_utilisation"]:
        headers = [
            Paragraph("<b>Project ID</b>", cell_header),
            Paragraph("<b>Project Name</b>", cell_header),
            Paragraph("<b>District</b>", cell_header),
            Paragraph("<b>Status</b>", cell_header),
            Paragraph("<b>Approved (Cr)</b>", cell_header),
            Paragraph("<b>Spent (Cr)</b>", cell_header),
            Paragraph("<b>Fin Util %</b>", cell_header),
            Paragraph("<b>Phys Prog %</b>", cell_header),
            Paragraph("<b>Variance</b>", cell_header)
        ]
        table_data = [headers]
        for p in projects:
            spent = sum(t.amount_spent for t in p.financial_transactions if t.amount_spent)
            baseline = p.revised_budget if (p.revised_budget and p.revised_budget > 0) else p.approved_budget
            util = round(spent / baseline * 100.0, 1) if baseline > 0 else 0.0
            latest = db.query(ProgressUpdate).filter(ProgressUpdate.project_id == p.project_id).order_by(ProgressUpdate.report_date.desc()).first()
            prog = latest.progress_percent if latest else 0.0
            gap = round(util - prog, 1)
            gap_str = f"+{gap}%" if gap > 0 else f"{gap}%"
            
            table_data.append([
                Paragraph(p.external_project_id, cell_style),
                Paragraph(p.project_name[:36] + ("..." if len(p.project_name) > 36 else ""), cell_style),
                Paragraph(p.district, cell_style),
                Paragraph(p.project_status, cell_style),
                Paragraph(f"₹{p.approved_budget/1e7:.2f}", cell_style),
                Paragraph(f"₹{spent/1e7:.2f}", cell_style),
                Paragraph(f"{util}%", cell_style),
                Paragraph(f"{prog}%", cell_style),
                Paragraph(gap_str, cell_style)
            ])
            
        t = Table(table_data, colWidths=[80, 200, 70, 70, 75, 75, 60, 65, 65])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0B3B60')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t)
        
    elif report_type == "risks":
        alerts = evaluate_all_risks(db)
        headers = [
            Paragraph("<b>Severity</b>", cell_header),
            Paragraph("<b>Project</b>", cell_header),
            Paragraph("<b>District</b>", cell_header),
            Paragraph("<b>Category</b>", cell_header),
            Paragraph("<b>Triggering Condition</b>", cell_header),
            Paragraph("<b>Recommended Next Action</b>", cell_header)
        ]
        table_data = [headers]
        for a in alerts[:25]:
            table_data.append([
                Paragraph(a.severity, cell_style),
                Paragraph(f"<b>{a.external_project_id}</b><br/>{a.project_name[:28]}", cell_style),
                Paragraph(a.district, cell_style),
                Paragraph(a.risk_category, cell_style),
                Paragraph(a.triggering_condition[:90] + ("..." if len(a.triggering_condition) > 90 else ""), cell_style),
                Paragraph(a.recommended_next_action[:90] + ("..." if len(a.recommended_next_action) > 90 else ""), cell_style)
            ])
            
        t = Table(table_data, colWidths=[60, 130, 70, 100, 200, 200])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0B3B60')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t)

    else:
        # Default project summary table
        headers = [
            Paragraph("<b>External ID</b>", cell_header),
            Paragraph("<b>Project Name</b>", cell_header),
            Paragraph("<b>Scheme</b>", cell_header),
            Paragraph("<b>District</b>", cell_header),
            Paragraph("<b>Status</b>", cell_header),
            Paragraph("<b>Sanction (Cr)</b>", cell_header)
        ]
        table_data = [headers]
        for p in projects:
            table_data.append([
                Paragraph(p.external_project_id, cell_style),
                Paragraph(p.project_name[:40], cell_style),
                Paragraph(p.scheme_name, cell_style),
                Paragraph(p.district, cell_style),
                Paragraph(p.project_status, cell_style),
                Paragraph(f"₹{p.approved_budget/1e7:.2f}", cell_style)
            ])
        t = Table(table_data, colWidths=[90, 260, 120, 90, 80, 80])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0B3B60')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t)

    doc.build(story)
    return buffer.getvalue()
