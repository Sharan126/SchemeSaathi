"""Authentication & Token Management for Institutional Users"""

from datetime import timedelta
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from app.core.config import settings
from app.core.security import (
    create_access_token,
    verify_password,
    get_password_hash,
    require_authenticated_user,
    TokenData,
    UserRole
)

router = APIRouter(prefix="/auth", tags=["Auth"])

# Initial authorized institutional seed users
SEED_USERS = {
    "admin": {
        "user_id": "usr-admin-1",
        "username": "admin",
        "hashed_password": get_password_hash("SchemeSaathiAdmin2026!"),
        "role": UserRole.SUPER_ADMIN,
        "full_name": "Chief Information Administrator",
        "organization": "SchemeSaathi Central Governance"
    },
    "verifier": {
        "user_id": "usr-verifier-1",
        "username": "verifier",
        "hashed_password": get_password_hash("VerifierSaathi2026!"),
        "role": UserRole.SCHEME_VERIFIER,
        "full_name": "Senior Welfare Scheme Verifier",
        "organization": "Ministry Evaluation Wing"
    },
    "csc_operator": {
        "user_id": "usr-csc-1",
        "username": "csc_operator",
        "hashed_password": get_password_hash("CscOperator2026!"),
        "role": UserRole.CSC_OPERATOR,
        "full_name": "Gram Panchayat CSC Desk",
        "organization": "Common Service Centre Network"
    }
}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    full_name: str


@router.post("/token", response_model=TokenResponse)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = SEED_USERS.get(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"], "user_id": user["user_id"]},
        expires_delta=access_token_expires
    )

    return TokenResponse(
        access_token=access_token,
        role=user["role"],
        username=user["username"],
        full_name=user["full_name"]
    )


@router.get("/me")
async def read_current_user(current_user: TokenData = Depends(require_authenticated_user)):
    user = SEED_USERS.get(current_user.username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "username": user["username"],
        "role": user["role"],
        "full_name": user["full_name"],
        "organization": user["organization"]
    }
