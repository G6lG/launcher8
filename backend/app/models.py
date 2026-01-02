from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    game_state = relationship("GameState", back_populates="user", uselist=False, cascade="all, delete-orphan")

class GameState(Base):
    __tablename__ = "game_states"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    
    # Основные показатели
    cookies = Column(Float, default=0.0)
    cookies_clicked = Column(Integer, default=0)
    cookies_forfeited = Column(Float, default=0.0)
    baked_all_time = Column(Float, default=0.0)
    
    # Генераторы (MVP: 5 генераторов)
    cursors = Column(Integer, default=0)
    grandmas = Column(Integer, default=0)
    farms = Column(Integer, default=0)
    mines = Column(Integer, default=0)
    factories = Column(Integer, default=0)
    
    # Улучшения (JSON массив ID улучшений)
    upgrades = Column(JSON, default=[])
    
    # Множители
    click_multiplier = Column(Float, default=1.0)
    cps_multiplier = Column(Float, default=1.0)
    
    # Престиж
    prestige_level = Column(Integer, default=0)
    heavenly_chips = Column(Float, default=0.0)
    
    # Системные
    last_auto_save = Column(DateTime, default=datetime.utcnow)
    version = Column(String(10), default="1.0.0")
    
    user = relationship("User", back_populates="game_state")