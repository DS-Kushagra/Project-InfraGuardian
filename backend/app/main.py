from fastapi import FastAPI
from app.routers import hazards
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="InfraGuardian API")

app.include_router(hazards.router, prefix="/hazards", tags=["hazards"])

origins = [
    "http://localhost:5173",
    # you can add more, or use "*" for all origins (not recommended for production)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OR replace with ["http://your-mobile-ip"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}