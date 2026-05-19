from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.middleware.rate_limiter import setup_rate_limiting
from app.routes import session, turn, sources, notebooks, studio, audit, simulate

app = FastAPI(
    title="MAES Backend API",
    description="Multi-Agent Educational Scaffolding System",
    version="1.0.0"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"], # Frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup Rate Limiting
setup_rate_limiting(app)

# Include Routers
app.include_router(session.router)
app.include_router(turn.router)
app.include_router(sources.router)
app.include_router(notebooks.router)
app.include_router(studio.router)
app.include_router(audit.router)
app.include_router(simulate.router)

@app.get("/")
async def root():
    return {"message": "MAES API is running"}
