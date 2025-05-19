from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class HazardStatus(str, Enum):
    reported = "Reported"
    in_progress = "In Progress"
    resolved = "Resolved"

class HazardBase(BaseModel):
    latitude: float
    longitude: float
    type: str
    severity: int
    status: HazardStatus = HazardStatus.reported  # NEW FIELD

class HazardCreate(HazardBase):
    pass

class Hazard(HazardBase):
    id: int
    timestamp: datetime

    class Config:
        orm_mode = True

class HazardOut(BaseModel):
    id: int
    latitude: float
    longitude: float
    type: str
    severity: int
    status: HazardStatus
    timestamp: datetime

    class Config:
        from_attributes = True  # replaces orm_mode in Pydantic v2
       