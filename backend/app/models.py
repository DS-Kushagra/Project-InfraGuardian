from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from sqlalchemy import Enum
import enum

Base = declarative_base()

class HazardStatus(str, enum.Enum):
    reported = "Reported"
    in_progress = "In Progress"
    resolved = "Resolved"

class Hazard(Base):
    __tablename__ = "hazards"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    type = Column(String, nullable=False)
    severity = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(HazardStatus), default=HazardStatus.reported)