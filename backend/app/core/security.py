"""Security, Password Hashing, JWT Tokens, and RBAC Dependencies"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_BASE_URL}/auth/token", auto_error=False)


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[str] = None


class UserRole:
    SUPER_ADMIN = "SUPER_ADMIN"
    SCHEME_VERIFIER = "SCHEME_VERIFIER"
    CSC_OPERATOR = "CSC_OPERATOR"
    NGO_WORKER = "NGO_WORKER"
    CITIZEN_GUEST = "CITIZEN_GUEST"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


async def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[TokenData]:
    """Allows anonymous citizen requests while capturing authenticated institutional users."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role", UserRole.CITIZEN_GUEST)
        user_id: str = payload.get("user_id")
        if username is None:
            return None
        return TokenData(username=username, role=role, user_id=user_id)
    except JWTError:
        return None


async def require_authenticated_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        user_id: str = payload.get("user_id")
        if username is None or role is None:
            raise credentials_exception
        return TokenData(username=username, role=role, user_id=user_id)
    except JWTError:
        raise credentials_exception


def require_roles(*allowed_roles: str):
    async def role_checker(current_user: TokenData = Depends(require_authenticated_user)) -> TokenData:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{current_user.role}' lacks permission for this action."
            )
        return current_user
    return role_checker
