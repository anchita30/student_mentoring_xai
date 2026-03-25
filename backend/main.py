from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models.models
from app.api import students, predictions, seed, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Student Analytics API",
    description="ML-powered student domain inclination analysis system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(predictions.router)
app.include_router(seed.router)

@app.get("/")
def root():
    return {"message": "Student Analytics API is running ✅"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}