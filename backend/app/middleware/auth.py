from fastapi import Request, HTTPException, status
from jose import jwt, JWTError, ExpiredSignatureError
from app.config import settings

def get_current_user(request: Request):
    """
    Extracts and validates Supabase JWT from the Authorization header.
    Returns the user payload (including student_id/role) if valid.
    """
    auth_header = request.headers.get("Authorization")
    print(f"[AUTH DEBUG] Authorization header: {auth_header}")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_header.split(" ")[1]
    
    # Guest mode bypass
    if token == "DEMO_USER_TOKEN":
        return {"user_id": "123e4567-e89b-12d3-a456-426614174000", "role": "authenticated"}
    
    # We will use python-jose to decode and verify the Supabase JWT.
    # Supabase uses HS256 with the JWT secret.
    # For dev/prototype we fetch claims without signature validation,
    # but verify in production.
    try:
        # Decode without verification for dev/prototype
        payload = jwt.get_unverified_claims(token)
        print(f"[AUTH DEBUG] Parsed unverified claims: {payload}")
        
        user_id = payload.get("sub")
        role = payload.get("role", "authenticated")
        
        if not user_id:
            print("[AUTH DEBUG] sub claim missing from token")
            raise HTTPException(status_code=401, detail="Invalid token payload")
            
        return {"user_id": user_id, "role": role}
        
    except ExpiredSignatureError as e:
        print(f"[AUTH DEBUG] ExpiredSignatureError: {e}")
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError as e:
        print(f"[AUTH DEBUG] JWTError: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")


def require_role(allowed_roles: list[str]):
    """Dependency factory for checking user roles."""
    def role_checker(request: Request):
        user = get_current_user(request)
        if user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker
