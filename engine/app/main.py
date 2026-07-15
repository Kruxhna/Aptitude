"""
GATE Aptitude Trainer — Adaptive Engine

FastAPI service that handles ELO-based adaptive difficulty calculations.
Receives performance data from the Node.js API and returns optimal
question selections and updated ratings.
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional


# --- Pydantic Models ---

class SkillRatings(BaseModel):
    """Per-skill ELO ratings for a user."""
    verbal: float = Field(default=1000, description="Verbal reasoning ELO")
    quantitative: float = Field(default=1000, description="Quantitative aptitude ELO")
    logical: float = Field(default=1000, description="Logical reasoning ELO")
    spatial: float = Field(default=1000, description="Spatial reasoning ELO")


class NextQuestionRequest(BaseModel):
    """Request to calculate next question set for a user."""
    userId: str
    skillRatings: SkillRatings
    questionCount: int = Field(default=10, ge=1, le=30)


class ResponseItem(BaseModel):
    """Single question response from a quiz session."""
    questionId: str
    skill: str
    questionDifficulty: float = Field(default=1000.0)
    answer: str | int | float
    correct: bool
    timeMs: int = Field(ge=0)


class UpdateRatingRequest(BaseModel):
    """Request to update user ratings after a quiz session."""
    userId: str
    currentRatings: SkillRatings
    responses: list[ResponseItem]
    sessionsCompleted: int = Field(default=0)


# --- FastAPI App ---

app = FastAPI(
    title="GATE Aptitude Engine",
    description="Adaptive difficulty engine for GATE Aptitude Trainer",
    version="0.1.0",
)


@app.get("/health")
async def health_check():
    """Health check endpoint for Docker Compose."""
    return {"status": "ok", "service": "engine"}


@app.post("/calculate-next")
async def calculate_next(request: NextQuestionRequest):
    """
    Calculate the next set of questions for a user based on their skill ratings.
    
    Stub implementation — will be replaced with actual ELO-based selection
    in Phase 3 (Adaptive Engine).
    """
    return {
        "questionIds": [],
        "message": "Stub — adaptive engine not yet implemented",
        "requestedCount": request.questionCount,
    }


@app.post("/update-rating")
async def update_rating(request: UpdateRatingRequest):
    """
    Update user ratings after completing a quiz session.
    
    Stub implementation — will be replaced with actual ELO calculation
    in Phase 3 (Adaptive Engine).
    """
    return {
        "newRatings": {
            "verbal": 1000,
            "quantitative": 1000,
            "logical": 1000,
            "spatial": 1000,
        },
        "xpEarned": 0,
        "message": "Stub — rating calculation not yet implemented",
    }
