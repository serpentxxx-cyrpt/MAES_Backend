from pydantic import BaseModel
from typing import Optional, Dict, List

class SessionStartRequest(BaseModel):
    student_id: str
    domain: str
    notebook_id: Optional[str] = None

class SessionEndRequest(BaseModel):
    session_id: str

class TurnRequest(BaseModel):
    session_id: str
    student_message: str

class AgentADraft(BaseModel):
    hint_text: str
    internal_reasoning: str
    estimated_bloom_level: str

class AgentBResult(BaseModel):
    decision: str
    correction_note: Optional[str] = None
    register_switch: Optional[str] = None
    struggle_level: Optional[str] = None
    bloom_tag_student: str
    bloom_tag_hint: str
    rubric_scores: Dict[str, int]

# Notebook Models
class CreateNotebookRequest(BaseModel):
    title: str
    domain: Optional[str] = "General"

class CreateNoteRequest(BaseModel):
    title: str
    content: str

class UpdateNoteRequest(BaseModel):
    content: str

# Source Ingestion Models
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

# Studio Models
class GenerateFlashcardsRequest(BaseModel):
    notebook_id: str
    topic: Optional[str] = None

class GenerateQuizRequest(BaseModel):
    notebook_id: str
    num_questions: Optional[int] = 5
    difficulty: Optional[str] = "medium"

class GenerateStudyGuideRequest(BaseModel):
    notebook_id: str

# Simulation Models
class SimulateRequest(BaseModel):
    profile_id: str
    n_turns: int
    learning_rate: float

