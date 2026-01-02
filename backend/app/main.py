from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import uvicorn

from . import crud, schemas, auth, game_logic
from .database import get_db, engine, Base
from .models import User

# Создаем таблицы в БД
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cookie Clicker Clone API",
    description="Backend API for Cookie Clicker Clone",
    version="1.0.0"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Аутентификация
@app.post("/api/auth/register", response_model=schemas.Token)
async def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Проверка существующего пользователя
    db_user = crud.get_user_by_username(db, username=user_data.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    db_user = crud.get_user_by_email(db, email=user_data.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Создание пользователя
    user = crud.create_user(db, user_data)
    
    # Создание токена
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=schemas.Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Обновляем время последнего входа
    user.last_login = auth.datetime.utcnow()
    db.commit()
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.User)
async def get_current_user_info(current_user: User = Depends(auth.get_current_active_user)):
    return current_user

# Игровые эндпоинты
@app.get("/api/game", response_model=schemas.GameResponse)
async def get_game_state(
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    game_state = crud.get_game_state(db, current_user.id)
    if not game_state:
        game_state = crud.create_initial_game_state(db, current_user.id)
    
    cps = game_logic.CookieClickerGame.calculate_cps(game_state)
    click_value = game_logic.CookieClickerGame.calculate_click_value(game_state)
    
    return {
        "cookies": game_state.cookies,
        "cps": cps,
        "generators": {
            "cursors": game_state.cursors,
            "grandmas": game_state.grandmas,
            "farms": game_state.farms,
            "mines": game_state.mines,
            "factories": game_state.factories
        },
        "upgrades": game_state.upgrades,
        "prestige": {
            "level": game_state.prestige_level,
            "heavenly_chips": game_state.heavenly_chips
        },
        "click_value": click_value
    }

@app.post("/api/game/click", response_model=schemas.ClickResponse)
async def click_cookie(
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    game_state = crud.get_game_state(db, current_user.id)
    if not game_state:
        raise HTTPException(status_code=404, detail="Game state not found")
    
    click_value = game_logic.CookieClickerGame.calculate_click_value(game_state)
    
    game_state.cookies += click_value
    game_state.cookies_clicked += 1
    game_state.baked_all_time += click_value
    
    db.commit()
    db.refresh(game_state)
    
    return {
        "success": True,
        "cookies": game_state.cookies,
        "click_value": click_value,
        "total_clicks": game_state.cookies_clicked
    }

@app.post("/api/game/buy", response_model=schemas.BuyResponse)
async def buy_generator(
    buy_request: schemas.BuyRequest,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    game_state = crud.get_game_state(db, current_user.id)
    if not game_state:
        raise HTTPException(status_code=404, detail="Game state not found")
    
    generator_type = buy_request.generator_type
    amount = buy_request.amount
    
    # Проверяем существование генератора
    if generator_type not in game_logic.CookieClickerGame.GENERATORS:
        return {
            "success": False,
            "error": f"Unknown generator type: {generator_type}"
        }
    
    current_count = getattr(game_state, f"{generator_type}s", 0)
    cost = game_logic.CookieClickerGame.calculate_generator_cost(generator_type, current_count) * amount
    
    if game_state.cookies >= cost:
        game_state.cookies -= cost
        setattr(game_state, f"{generator_type}s", current_count + amount)
        
        db.commit()
        db.refresh(game_state)
        
        return {
            "success": True,
            "cookies": game_state.cookies,
            "new_count": current_count + amount,
            "cost": cost
        }
    
    return {
        "success": False,
        "error": "Not enough cookies"
    }

@app.post("/api/game/buy_upgrade/{upgrade_id}")
async def buy_upgrade(
    upgrade_id: int,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    game_state = crud.get_game_state(db, current_user.id)
    if not game_state:
        raise HTTPException(status_code=404, detail="Game state not found")
    
    # Проверяем, есть ли уже это улучшение
    if upgrade_id in game_state.upgrades:
        return {"success": False, "error": "Upgrade already purchased"}
    
    # Проверяем, можем ли купить
    if game_logic.CookieClickerGame.can_afford_upgrade(game_state, upgrade_id):
        if game_logic.CookieClickerGame.apply_upgrade(game_state, upgrade_id):
            db.commit()
            db.refresh(game_state)
            return {"success": True, "cookies": game_state.cookies}
    
    return {"success": False, "error": "Cannot purchase upgrade"}

@app.post("/api/game/save")
async def save_game(
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    game_state = crud.get_game_state(db, current_user.id)
    if game_state:
        game_state.last_auto_save = auth.datetime.utcnow()
        db.commit()
    
    return {"success": True, "message": "Game saved successfully"}

@app.get("/api/game/upgrades")
async def get_available_upgrades(
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    game_state = crud.get_game_state(db, current_user.id)
    if not game_state:
        return {"upgrades": []}
    
    available = game_logic.CookieClickerGame.get_available_upgrades(game_state)
    return {"upgrades": available}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)