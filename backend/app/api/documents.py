from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Document, Project
from app.schemas.schemas import DocumentOut

router = APIRouter(prefix="/documents", tags=["Documents & RAG Hub"])

@router.get("", response_model=List[DocumentOut])
def list_documents(
    project_id: Optional[str] = Query(None),
    doc_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if project_id:
        query = query.filter(Document.project_id == project_id)
    if doc_type:
        query = query.filter(Document.document_type == doc_type)
    if search:
        query = query.filter(
            (Document.file_name.ilike(f"%{search}%")) |
            (Document.extracted_text.ilike(f"%{search}%"))
        )
    return query.order_by(Document.upload_date.desc()).all()

@router.get("/{document_id}")
def get_document_details(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    project = doc.project
    return {
        "document": DocumentOut.from_orm(doc),
        "project_name": project.project_name if project else "General Portfolio",
        "district": project.district if project else "State Level",
        "extracted_text": doc.extracted_text,
        "extraction_confidence": doc.extraction_confidence,
        "chunks_count": len(doc.chunks)
    }

@router.get("/{document_id}/download-text")
def download_extracted_text(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return PlainTextResponse(doc.extracted_text or "No extracted text available.")
