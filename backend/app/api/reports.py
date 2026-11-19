from fastapi import APIRouter, Depends, Query, Response, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.services.report_generator import generate_csv_report, generate_pdf_report

router = APIRouter(prefix="/reports", tags=["Report Generation"])

@router.get("/export")
def export_report(
    report_type: str = Query("portfolio"), # "portfolio", "delayed_projects", "financial_utilisation", "risks", "district"
    format: str = Query("csv"), # "csv" or "pdf"
    db: Session = Depends(get_db)
):
    format = format.lower()
    if format == "csv":
        csv_data = generate_csv_report(report_type, db)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=UP_Tourism_{report_type}_report.csv"
            }
        )
    elif format == "pdf":
        pdf_bytes = generate_pdf_report(report_type, db)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=UP_Tourism_{report_type}_report.pdf"
            }
        )
    else:
        raise HTTPException(status_code=400, detail="Supported formats are 'csv' and 'pdf'")
