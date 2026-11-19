from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import ChatQueryRequest, ChatQueryResponse
from app.services.ai_assistant import answer_decision_support_query
from app.api.deps import get_current_user

router = APIRouter(prefix="/chat", tags=["AI Decision Support Assistant"])

@router.post("", response_model=ChatQueryResponse)
def chat_with_assistant(
    payload: ChatQueryRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if not payload.question or not payload.question.strip():
        raise HTTPException(status_code=400, detail="Inquiry question cannot be empty.")
        
    response = answer_decision_support_query(
        request_question=payload.question.strip(),
        db=db,
        context_project_id=payload.project_id
    )
    return response
