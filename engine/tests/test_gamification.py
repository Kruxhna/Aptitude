import sys
from unittest.mock import MagicMock

# Mock app.db to prevent motor import requirement during unit tests
sys.modules['app.db'] = MagicMock()

import pytest
from app.main import update_rating, UpdateRatingRequest, SkillRatings, ResponseItem

@pytest.mark.anyio
async def test_xp_speed_bonus():
    request = UpdateRatingRequest(
        userId="test_user",
        currentRatings=SkillRatings(),
        responses=[
            ResponseItem(
                questionId="q1",
                skill="verbal",
                questionDifficulty=1000.0,
                answer="A",
                correct=True,
                timeMs=15000  # Half of 30s -> should give 1.25x multiplier -> 13 XP
            ),
            ResponseItem(
                questionId="q2",
                skill="verbal",
                questionDifficulty=1000.0,
                answer="B",
                correct=False,
                timeMs=5000  # Incorrect -> 0 XP
            )
        ]
    )
    res = await update_rating(request)
    assert res["xpEarned"] == 13
