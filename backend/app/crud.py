from sqlalchemy.orm import Session
from app import models, schemas


def get_hazards(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Hazard).offset(skip).limit(limit).all()


def create_hazard(db: Session, hazard: schemas.HazardCreate):
    db_hazard = models.Hazard(**hazard.dict())
    db.add(db_hazard)
    db.commit()
    db.refresh(db_hazard)
    return db_hazard