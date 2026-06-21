from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
import logging

logger = logging.getLogger("auth")
security_helper = HTTPBearer(auto_error=False)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security_helper)) -> str:
    """
    Verifies Bearer tokens via Firebase Admin SDK.
    If USE_MOCK_AUTH is set to True, skips cryptographic validation and extracts
    the user UID from the token suffix or uses a standard default.
    """
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization Header. Standard format is: Bearer <token>"
        )

    token = credentials.credentials

    if settings.USE_MOCK_AUTH:
        # Mock mode splits token or returns default
        if token.startswith("mock-user-"):
            uid = token
        else:
            uid = "mock-user-default"
        logger.debug("Mock auth session verified")
        return uid

    try:
        from firebase_admin import auth
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
        return uid
    except Exception as e:
        logger.error(f"Failed to authenticate Firebase Token: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token"
        )
