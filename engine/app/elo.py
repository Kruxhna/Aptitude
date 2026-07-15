import numpy as np
from typing import Dict, Any, List

def expected_score(user_rating: float, question_difficulty: float) -> float:
    """Calculate the expected score (probability of getting it right)."""
    return 1.0 / (1.0 + 10.0 ** ((question_difficulty - user_rating) / 400.0))

def calculate_speed_factor(time_ms: int, skill: str, is_correct: bool) -> float:
    """Calculate the speed multiplier for correct answers."""
    if not is_correct:
        return 1.0
        
    time_budgets_sec = {
        'verbal': 45.0,
        'quantitative': 60.0,
        'logical': 90.0,
        'spatial': 60.0
    }
    
    # Default to 60s if skill not found
    budget_sec = time_budgets_sec.get(skill, 60.0)
    time_sec = time_ms / 1000.0
    
    # Speed factor = remaining_time / total_time
    # clamped between 0.5 and 1.5
    remaining = max(0, budget_sec - time_sec)
    factor = remaining / budget_sec
    
    # Shift factor so that perfectly fast = 1.5, half time = 1.0, out of time = 0.5
    # Wait, the formula D-14 says: speed_factor = remaining_time / total_time clamped to [0.5, 1.5]
    # If we just do remaining/total, it goes from 1.0 (instant) down to 0.0 (out of time).
    # To map to [0.5, 1.5], let's use: 0.5 + (remaining/budget_sec)
    # E.g. instant = 0.5 + 1.0 = 1.5
    # taking all the time = 0.5 + 0.0 = 0.5
    
    mapped_factor = 0.5 + factor
    return float(np.clip(mapped_factor, 0.5, 1.5))

def compute_k_factor(sessions_completed: int) -> float:
    """Linear decay of K factor from 40 to 20 over 10 sessions."""
    return float(max(20.0, 40.0 - (2.0 * sessions_completed)))

def calculate_rating_change(
    user_rating: float, 
    question_difficulty: float, 
    is_correct: bool, 
    time_ms: int, 
    skill: str, 
    sessions_completed: int
) -> float:
    """Calculate the complete ELO delta."""
    expected = expected_score(user_rating, question_difficulty)
    actual = 1.0 if is_correct else 0.0
    k_factor = compute_k_factor(sessions_completed)
    speed_mult = calculate_speed_factor(time_ms, skill, is_correct)
    
    # Standard delta
    delta = k_factor * (actual - expected)
    
    # Apply speed multiplier only on gains (correct answers)
    if is_correct and delta > 0:
        delta *= speed_mult
        
    return delta

def update_ratings(
    current_ratings: Dict[str, float], 
    responses: List[Dict[str, Any]], 
    sessions_completed: int
) -> Dict[str, float]:
    """Batch update across multiple responses."""
    new_ratings = current_ratings.copy()
    
    for resp in responses:
        skill = resp.get('skill')
        if not skill or skill not in new_ratings:
            continue
            
        is_correct = resp.get('correct', False)
        time_ms = resp.get('timeMs', 0)
        q_diff = resp.get('questionDifficulty', 1000.0)
        
        delta = calculate_rating_change(
            user_rating=new_ratings[skill],
            question_difficulty=q_diff,
            is_correct=is_correct,
            time_ms=time_ms,
            skill=skill,
            sessions_completed=sessions_completed
        )
        
        new_ratings[skill] += delta
        
    return new_ratings
