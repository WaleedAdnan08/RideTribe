from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import time
from db import db
from config import settings
from routers import auth, destinations, tribes, schedules, matches, notifications

app = FastAPI()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("backend_requests.log")
    ]
)
logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"Incoming request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"Request handled: {request.method} {request.url} - Status: {response.status_code} - Time: {process_time:.4f}s")
        return response
    except Exception as e:
        logger.error(f"Request failed: {request.method} {request.url} - Error: {str(e)}")
        raise e

# Debug settings issue
try:
    frontend_url = settings.FRONTEND_URL
except AttributeError:
    logger.error(f"CRITICAL: Settings object missing FRONTEND_URL. Available config: {settings.model_dump()}")
    frontend_url = "http://localhost:5137" # Fallback

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5137",
    "http://127.0.0.1:5137",
    frontend_url,
    "https://ridetribe-pwkh.onrender.com",
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
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])

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
# Force reload - version 2
logger.info("MAIN.PY RELOADED - VERSION 2")
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)