from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import db
from routers import auth, destinations, tribes, schedules, matches

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5137",
    "http://127.0.0.1:5137",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(destinations.router, prefix="/api/v1/destinations", tags=["destinations"])
app.include_router(tribes.router, prefix="/api/v1/tribes", tags=["tribes"])
app.include_router(schedules.router, prefix="/api/v1/schedules", tags=["schedules"])
app.include_router(matches.router, prefix="/api/v1/matches", tags=["matches"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Magical Bear Wag API"}

@app.get("/api/v1/healthz")
async def health_check():
    try:
        # Attempt a simple DB operation to verify connectivity
        await db.list_collection_names()
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": "disconnected", "detail": str(e)}
# Trigger reload