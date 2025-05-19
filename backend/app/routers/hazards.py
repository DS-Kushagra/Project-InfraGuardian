from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas, models
from app.database import get_db

router = APIRouter()


@router.post("/", response_model=schemas.Hazard)
async def create_hazard(hazard: schemas.HazardCreate, db: Session = Depends(get_db)):
    return crud.create_hazard(db, hazard)


@router.get("/", response_model=List[schemas.Hazard])
def get_hazards(
    db: Session = Depends(get_db),
    min_severity: int = Query(1, ge=1, le=5),
    max_severity: int = Query(5, ge=1, le=5)
):
    hazards = db.query(models.Hazard).filter(
        models.Hazard.severity >= min_severity,
        models.Hazard.severity <= max_severity
    ).order_by(models.Hazard.timestamp.desc()).all()
    return hazards

@router.patch("/{hazard_id}", response_model=schemas.HazardOut)
def update_hazard_status(hazard_id: int, status: schemas.HazardStatus, db: Session = Depends(get_db)):
    hazard = db.query(models.Hazard).filter(models.Hazard.id == hazard_id).first()
    if not hazard:
        raise HTTPException(status_code=404, detail="Hazard not found")

    hazard.status = status
    db.commit()
    db.refresh(hazard)
    return hazard
