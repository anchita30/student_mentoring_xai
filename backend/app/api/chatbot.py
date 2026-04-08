from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.chatbot_service import ChatbotService
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter(prefix="/api/chat", tags=["Chatbot"])


# ─── Schemas ──────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = []
    user_role: str  # "student" or "mentor"
    user_id: int


class ChatResponse(BaseModel):
    response: str
    success: bool = True


# ─── Endpoints ────────────────────────────────────────────────

@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Chat endpoint for AI assistant.
    
    - Accepts user message and conversation history
    - Returns AI-generated response grounded in database
    - Context-aware based on user role (student/mentor)
    """
    try:
        # Validate role
        if request.user_role not in ["student", "mentor"]:
            raise HTTPException(status_code=400, detail="Invalid user_role. Must be 'student' or 'mentor'")
        
        # Initialize chatbot service
        chatbot = ChatbotService(db)
        
        # Convert conversation history to dict format
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]
        
        # Get AI response
        response = await chatbot.chat(
            message=request.message,
            conversation_history=history,
            role=request.user_role,
            user_id=request.user_id
        )
        
        return ChatResponse(
            response=response,
            success=True
        )
        
    except ValueError as ve:
        # API key not configured
        import traceback
        print("ValueError in chatbot:", str(ve))
        print(traceback.format_exc())
        raise HTTPException(
            status_code=503,
            detail=str(ve)
        )
    except Exception as e:
        import traceback
        print("Exception in chatbot:", str(e))
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Chat service error: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Check if chatbot service is configured properly."""
    from app.config import settings
    api_key = settings.GROQ_API_KEY
    
    if not api_key or api_key == "your_groq_api_key_here":
        return {
            "status": "not_configured",
            "message": "GROQ_API_KEY not set. Get free key from https://console.groq.com"
        }
    
    return {
        "status": "ready",
        "message": "Chatbot service is ready"
    }
