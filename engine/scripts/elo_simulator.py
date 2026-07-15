import sys
import os
import random

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.elo import update_ratings, expected_score

def run_simulation():
    # User's true skill levels (what the system should eventually converge to)
    true_skills = {
        'verbal': 1400.0,
        'quantitative': 1200.0,
        'logical': 1600.0,
        'spatial': 800.0
    }
    
    # User starts at 1000 for all
    ratings = {
        'verbal': 1000.0,
        'quantitative': 1000.0,
        'logical': 1000.0,
        'spatial': 1000.0
    }
    
    total_sessions = 1000
    questions_per_session = 10
    skills = list(true_skills.keys())
    
    print("Starting ELO simulation over 1000 sessions...")
    print(f"True Skills: {true_skills}")
    print(f"Initial Ratings: {ratings}")
    
    for session in range(total_sessions):
        responses = []
        for _ in range(questions_per_session):
            skill = random.choice(skills)
            # System selects a question near the current rating (±100)
            q_diff = random.uniform(ratings[skill] - 100, ratings[skill] + 100)
            
            # Probability of user getting it right depends on TRUE skill vs question difficulty
            prob_correct = expected_score(true_skills[skill], q_diff)
            is_correct = random.random() < prob_correct
            
            # Simulate time: Exactly half the budget to give a 1.0x speed multiplier
            budget_ms = {'verbal': 45000, 'quantitative': 60000, 'logical': 90000, 'spatial': 60000}.get(skill, 60000)
            time_ms = budget_ms // 2
                
            responses.append({
                'skill': skill,
                'questionDifficulty': q_diff,
                'correct': is_correct,
                'timeMs': time_ms
            })
            
        ratings = update_ratings(ratings, responses, session)
        
        # Print progress every 100 sessions
        if (session + 1) % 100 == 0:
            print(f"Session {session+1:4d}: V:{ratings['verbal']:.0f} Q:{ratings['quantitative']:.0f} L:{ratings['logical']:.0f} S:{ratings['spatial']:.0f}")

    print("\n--- Final Results ---")
    print("Skill        | True  | Final | Diff")
    print("-" * 37)
    
    passed = True
    for skill in skills:
        diff = ratings[skill] - true_skills[skill]
        print(f"{skill.ljust(12)} | {true_skills[skill]:4.0f} | {ratings[skill]:5.0f} | {diff:5.0f}")
        
        # Success criteria: within ±50 of true skill
        if abs(diff) > 50:
            passed = False
            
    print("-" * 37)
    if passed:
        print("SIMULATION PASSED: All ratings converged within ±50 of true skill.")
        sys.exit(0)
    else:
        print("SIMULATION FAILED: Ratings did not converge sufficiently.")
        sys.exit(1)

if __name__ == "__main__":
    run_simulation()
