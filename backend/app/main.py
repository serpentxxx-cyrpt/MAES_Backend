import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import session, turn, notebooks, sources, studio, audit, simulate
from app.middleware.rate_limiter import RateLimitingMiddleware

app = FastAPI(title="MAES Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitingMiddleware)


app.include_router(session.router, prefix="/session", tags=["Session"])
app.include_router(turn.router, prefix="/turn", tags=["Turn"])
app.include_router(notebooks.router, tags=["Notebooks"])
app.include_router(sources.router, tags=["Sources"])
app.include_router(studio.router, tags=["Studio"])
app.include_router(audit.router, tags=["Audit"])
app.include_router(simulate.router, tags=["Simulation"])

@app.get("/")
def health_check():
    return {"status": "ok", "service": "MAES Backend"}

