from sqlalchemy.orm import Session
from sqlalchemy import and_
from . import models, schemas
from .auth import get_password_hash
from datetime import datetime

# User CRUD operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Создаем начальное состояние игры для пользователя
    game_state = models.GameState(user_id=db_user.id)
    db.add(game_state)
    db.commit()
    
    return db_user

# GameState CRUD operations
def get_game_state(db: Session, user_id: int):
    return db.query(models.GameState).filter(models.GameState.user_id == user_id).first()

def update_game_state(db: Session, user_id: int, game_state_update: dict):
    game_state = get_game_state(db, user_id)
    if not game_state:
        return None
    
    for key, value in game_state_update.items():
        setattr(game_state, key, value)
    
    game_state.last_auto_save = datetime.utcnow()
    db.commit()
    db.refresh(game_state)
    return game_state

def create_initial_game_state(db: Session, user_id: int):
    game_state = models.GameState(user_id=user_id)
    db.add(game_state)
    db.commit()
    db.refresh(game_state)
    return game_state