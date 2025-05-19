from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from typing import Optional

class HazardStatus(str, Enum):
    reported = "reported"
    in_progress = "in_progress"
    resolved = "resolved"

class HazardBase(BaseModel):
    latitude: float
    longitude: float
    type: str
    severity: int
    status: HazardStatus = HazardStatus.reported  # NEW FIELD

class HazardCreate(BaseModel):
    latitude: float
    longitude: float
    type: str
    severity: int
    status: Optional[HazardStatus] = HazardStatus.reported


class Hazard(HazardBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

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
       