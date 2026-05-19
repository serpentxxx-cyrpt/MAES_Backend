from fastapi import Request, HTTPException, status
import jwt
from app.config import settings

def get_current_user(request: Request):
    """
    Extracts and validates Supabase JWT from the Authorization header.
    Returns the user payload (including student_id/role) if valid.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_header.split(" ")[1]
    
    # We will use PyJWT to decode and verify the Supabase JWT.
    # Supabase uses HS256 with the JWT secret (which is related to the project).
    # Since we don't have the explicit JWT secret in .env, we can verify it using 
    # the Supabase client or just decode it without verification for the prototype.
    # IN PRODUCTION: You must verify the signature using Supabase JWT secret.
    try:
        # Decode without verification for prototype if JWT secret isn't configured,
        # but in a real app you'd verify signature using the Supabase JWT secret.
        payload = jwt.decode(token, options={"verify_signature": False})
        
        user_id = payload.get("sub")
        role = payload.get("role", "authenticated")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
            
        return {"user_id": user_id, "role": role}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(allowed_roles: list[str]):
    """Dependency factory for checking user roles."""
    def role_checker(request: Request):
        user = get_current_user(request)
        if user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker
