"""Master v1 API Router Assembly"""

from fastapi import APIRouter
from app.api.v1.endpoints.schemes import router as schemes_router
from app.api.v1.endpoints.eligibility import router as eligibility_router
from app.api.v1.endpoints.assistant import router as assistant_router
from app.api.v1.endpoints.documents import router as documents_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.admin import router as admin_router

api_router = APIRouter()
api_router.include_router(schemes_router)
api_router.include_router(eligibility_router)
api_router.include_router(assistant_router)
api_router.include_router(documents_router)
api_router.include_router(auth_router)
api_router.include_router(admin_router)
