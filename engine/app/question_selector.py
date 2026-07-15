import random
from typing import List, Dict
from app.db import get_database

async def select_questions(skill_ratings: Dict[str, float], question_count: int) -> List[str]:
    """
    Select questions across all skills based on ELO ratings.
    Uses adaptive widening if pool is too small.
    """
    db = get_database()
    questions_col = db.questions
    
    selected_ids = []
    
    skills = ["verbal", "quantitative", "logical", "spatial"]
    
    # Calculate how many questions per skill we want
    base_count = question_count // len(skills)
    remainder = question_count % len(skills)
    
    skill_counts = {skill: base_count for skill in skills}
    # distribute remainder randomly
    for skill in random.sample(skills, remainder):
        skill_counts[skill] += 1
        
    for skill in skills:
        target_count = skill_counts[skill]
        if target_count == 0:
            continue
            
        rating = skill_ratings.get(skill, 1000.0)
        
        # Adaptive widening
        band = 100
        max_band = 300
        
        candidates = []
        
        while band <= max_band:
            lower = rating - band
            upper = rating + band
            
            # Find matching active questions
            cursor = questions_col.find({
                "skill": skill,
                "active": True,
                "difficulty": {"$gte": lower, "$lte": upper}
            }, {"_id": 1})
            
            docs = await cursor.to_list(length=None)
            candidates = [str(doc["_id"]) for doc in docs if str(doc["_id"]) not in selected_ids]
            
            if len(candidates) >= target_count:
                break
                
            band += 50
            
        # Sample randomly from candidates (up to target_count)
        if len(candidates) > target_count:
            chosen = random.sample(candidates, target_count)
        else:
            chosen = candidates
            
        selected_ids.extend(chosen)
        
    random.shuffle(selected_ids)
    return selected_ids
