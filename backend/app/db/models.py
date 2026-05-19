from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Session Models
class StartSessionRequest(BaseModel):
    notebook_id: str
    domain: Optional[str] = "General"

class EndSessionRequest(BaseModel):
    session_id: str

# Turn Models
class TurnRequest(BaseModel):
    session_id: str
    student_message: str

# Sources Models
class ImportUrlRequest(BaseModel):
    notebook_id: str
    url: str

class ImportYoutubeRequest(BaseModel):
    notebook_id: str
    url: str

class PasteTextRequest(BaseModel):
    notebook_id: str
    title: str
    content: str

class ToggleSourceRequest(BaseModel):
    is_active: bool

# Notebook Models
class CreateNotebookRequest(BaseModel):
    title: str
    domain: Optional[str] = None

class CreateNoteRequest(BaseModel):
    title: str
    content: str

class UpdateNoteRequest(BaseModel):
    content: str

# Studio Models
class GenerateFlashcardsRequest(BaseModel):
    notebook_id: str
    topic: Optional[str] = None

class GenerateQuizRequest(BaseModel):
    notebook_id: str
    num_questions: int = Field(5, ge=1, le=20)
    difficulty: str = Field("medium", pattern="^(easy|medium|hard)$")

class GenerateStudyGuideRequest(BaseModel):
    notebook_id: str

# Simulation Models
class SimulateRequest(BaseModel):
    profile_id: str
    n_turns: int = Field(10, ge=1, le=50)
    learning_rate: str = Field("average", pattern="^(slow|average|fast)$")
