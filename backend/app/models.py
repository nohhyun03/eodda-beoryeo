from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON

from .database import Base


class User(Base):
    __tablename__ = "USERS"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_token = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())

    scan_history = relationship("ScanHistory", back_populates="user", cascade="all, delete-orphan")


class ScanHistory(Base):
    __tablename__ = "SCAN_HISTORY"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("USERS.id"), nullable=False, index=True)
    image_path = Column(String(500), nullable=False)
    item_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    guide_steps = Column(JSON, nullable=False)
    warning = Column(String(255), nullable=True)
    is_favorite = Column(Boolean, nullable=False, default=False, server_default="0")
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())

    user = relationship("User", back_populates="scan_history")