"""
GATE Aptitude Trainer — Adaptive Engine

FastAPI service that handles ELO-based adaptive difficulty calculations.
Receives performance data from the Node.js API and returns optimal
question selections and updated ratings.
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional
from contextlib import asynccontextmanager
from app.db import connect_to_mongo, close_mongo_connection
from app.question_selector import select_questions
from app.elo import update_ratings


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

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(
    title="GATE Aptitude Engine",
    description="Adaptive difficulty engine for GATE Aptitude Trainer",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health_check():
    """Health check endpoint for Docker Compose."""
    return {"status": "ok", "service": "engine"}


@app.post("/calculate-next")
async def calculate_next(request: NextQuestionRequest):
    """
    Calculate the next set of questions for a user based on their skill ratings.
    Uses ELO-based selection from MongoDB.
    """
    ratings_dict = request.skillRatings.model_dump()
    question_ids = await select_questions(ratings_dict, request.questionCount)
    
    return {
        "questionIds": question_ids,
        "message": "Questions selected successfully",
        "requestedCount": request.questionCount,
        "returnedCount": len(question_ids)
    }


@app.post("/update-rating")
async def update_rating(request: UpdateRatingRequest):
    """
    Update user ratings after completing a quiz session.
    """
    current_ratings_dict = request.currentRatings.model_dump()
    responses_list = [resp.model_dump() for resp in request.responses]
    
    new_ratings = update_ratings(
        current_ratings=current_ratings_dict,
        responses=responses_list,
        sessions_completed=request.sessionsCompleted
    )
    
    # Calculate XP with speed bonus
    # Base: 10 XP per correct answer. Speed bonus up to 1.5x for answering under 30s par time.
    PAR_TIME_MS = 30000
    xp_earned = 0
    for resp in responses_list:
        if resp.get('correct'):
            time_ms = resp.get('timeMs', PAR_TIME_MS)
            multiplier = 1.0
            if time_ms < PAR_TIME_MS:
                multiplier += max(0.0, (PAR_TIME_MS - time_ms) / PAR_TIME_MS) * 0.5
            xp_earned += int(10 * multiplier + 0.5)
    
    return {
        "newRatings": new_ratings,
        "xpEarned": xp_earned,
        "message": "Ratings updated successfully",
    }
