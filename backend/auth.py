from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from db_models import User

DEMO_USER = User(
    user_id="demo_user",
    email="demo@mediguard.ai",
    name="Demo User",
    picture=None,
)

def build_auth_router(db) -> APIRouter:

    router = APIRouter(
        prefix="/auth",
        tags=["auth"],
    )

    async def _get_user_from_session(
        session_token: Optional[str] = None,
    ) -> Optional[User]:
        return DEMO_USER

    @router.post("/session")
    async def exchange_session():
        return {
            "user_id": DEMO_USER.user_id,
            "email": DEMO_USER.email,
            "name": DEMO_USER.name,
            "picture": DEMO_USER.picture,
        }

    @router.get("/me")
    async def me():

        profile = await db.patient_profiles.find_one(
            {"user_id": DEMO_USER.user_id},
            {"_id": 0},
        )

        return {
            "user_id": DEMO_USER.user_id,
            "email": DEMO_USER.email,
            "name": DEMO_USER.name,
            "picture": DEMO_USER.picture,
            "profile": profile,
        }

    @router.post("/logout")
    async def logout():
        return {"ok": True}

    return router, _get_user_from_session


async def require_user(
    db,
    session_token: Optional[str],
    authorization: Optional[str],
) -> User:

    return DEMO_USER