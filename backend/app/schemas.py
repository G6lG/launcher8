from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Game schemas
class GameStateBase(BaseModel):
    cookies: float = 0.0
    cookies_clicked: int = 0
    baked_all_time: float = 0.0
    
    # Генераторы
    cursors: int = 0
    grandmas: int = 0
    farms: int = 0
    mines: int = 0
    factories: int = 0
    
    # Улучшения
    upgrades: List[int] = []
    
    # Множители
    click_multiplier: float = 1.0
    cps_multiplier: float = 1.0
    
    # Престиж
    prestige_level: int = 0
    heavenly_chips: float = 0.0

class GameStateCreate(GameStateBase):
    user_id: int

class GameState(GameStateBase):
    id: int
    user_id: int
    last_auto_save: datetime
    version: str
    
    class Config:
        from_attributes = True

class ClickResponse(BaseModel):
    success: bool
    cookies: float
    click_value: float
    total_clicks: int

class BuyRequest(BaseModel):
    generator_type: str
    amount: int = 1

class BuyResponse(BaseModel):
    success: bool
    cookies: float
    new_count: int
    cost: float
    error: Optional[str] = None

class GameResponse(BaseModel):
    cookies: float
    cps: float
    generators: Dict[str, int]
    upgrades: List[int]
    prestige: Dict[str, Any]
    click_value: float