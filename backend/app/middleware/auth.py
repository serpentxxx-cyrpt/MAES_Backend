from fastapi import Request, HTTPException, status
from app.db.supabase_client import supabase

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
    
    try:
        # Validate token securely with Supabase API
        user_response = supabase.auth.get_user(token)
        user_id = user_response.user.id
        role = user_response.user.role
        
        if not user_id:
            print("[AUTH DEBUG] sub claim missing from token")
            raise HTTPException(status_code=401, detail="Invalid token payload")
            
        return {"user_id": user_id, "role": role}
        
    except Exception as e:
        print(f"[AUTH DEBUG] AuthError: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_role(allowed_roles: list[str]):
    """Dependency factory for checking user roles."""
    def role_checker(request: Request):
        user = get_current_user(request)
        if user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker
