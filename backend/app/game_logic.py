from typing import Dict, Any
from .models import GameState
import math

class CookieClickerGame:
    # Конфигурация генераторов (точные значения из оригинала Cookie Clicker)
    GENERATORS = {
        "cursor": {
            "name": "Cursor",
            "base_cost": 15.0,
            "base_cps": 0.1,
            "price_increase": 1.15,
            "description": "Autoclicks once every 10 seconds."
        },
        "grandma": {
            "name": "Grandma",
            "base_cost": 100.0,
            "base_cps": 1.0,
            "price_increase": 1.15,
            "description": "A nice grandma to bake more cookies."
        },
        "farm": {
            "name": "Farm",
            "base_cost": 1100.0,
            "base_cps": 8.0,
            "price_increase": 1.15,
            "description": "Grows cookie plants from cookie seeds."
        },
        "mine": {
            "name": "Mine",
            "base_cost": 12000.0,
            "base_cps": 47.0,
            "price_increase": 1.15,
            "description": "Mines out cookie dough and chocolate chips."
        },
        "factory": {
            "name": "Factory",
            "base_cost": 130000.0,
            "base_cps": 260.0,
            "price_increase": 1.15,
            "description": "Produces large quantities of cookies."
        }
    }
    
    # Улучшения для MVP
    UPGRADES = [
        {
            "id": 1,
            "name": "Reinforced index finger",
            "description": "Cursors are twice as efficient.",
            "cost": 100.0,
            "type": "cursor_multiplier",
            "value": 2.0,
            "requires": {"cursors": 1}
        },
        {
            "id": 2,
            "name": "Forwards from grandma",
            "description": "Grandmas are twice as efficient.",
            "cost": 500.0,
            "type": "grandma_multiplier",
            "value": 2.0,
            "requires": {"grandmas": 1}
        },
        {
            "id": 3,
            "name": "Steel-plated rolling pins",
            "description": "Grandmas are twice as efficient.",
            "cost": 5000.0,
            "type": "grandma_multiplier",
            "value": 2.0,
            "requires": {"grandmas": 5}
        },
        {
            "id": 4,
            "name": "Lubricated dentures",
            "description": "Grandmas are twice as efficient.",
            "cost": 50000.0,
            "type": "grandma_multiplier",
            "value": 2.0,
            "requires": {"grandmas": 25}
        }
    ]
    
    @staticmethod
    def calculate_generator_cost(generator_type: str, owned: int) -> float:
        """Вычисление стоимости следующего генератора"""
        if generator_type not in CookieClickerGame.GENERATORS:
            raise ValueError(f"Unknown generator type: {generator_type}")
        
        gen = CookieClickerGame.GENERATORS[generator_type]
        return gen["base_cost"] * (gen["price_increase"] ** owned)
    
    @staticmethod
    def calculate_cps(game_state: GameState) -> float:
        """Вычисление печенек в секунду"""
        total_cps = 0.0
        
        # Проходим по всем генераторам
        for gen_type, gen_data in CookieClickerGame.GENERATORS.items():
            count = getattr(game_state, f"{gen_type}s", 0)
            if count > 0:
                base_cps = gen_data["base_cps"]
                multiplier = 1.0
                
                # Применяем улучшения для каждого типа генератора
                for upgrade in game_state.upgrades:
                    if upgrade in [1, 2, 3, 4]:  # Улучшения для курсоров и бабушек
                        if gen_type == "cursor" and upgrade == 1:
                            multiplier *= 2.0
                        elif gen_type == "grandma" and upgrade in [2, 3, 4]:
                            multiplier *= 2.0
                
                total_cps += count * base_cps * multiplier
        
        # Глобальный множитель CPS
        return total_cps * game_state.cps_multiplier
    
    @staticmethod
    def calculate_click_value(game_state: GameState) -> float:
        """Вычисление значения одного клика"""
        base_value = 1.0
        click_mult = game_state.click_multiplier
        heavenly_mult = 1.0 + (game_state.heavenly_chips * 0.02)
        
        return base_value * click_mult * heavenly_mult
    
    @staticmethod
    def get_available_upgrades(game_state: GameState) -> list:
        """Получение списка доступных улучшений"""
        available = []
        
        for upgrade in CookieClickerGame.UPGRADES:
            if upgrade["id"] in game_state.upgrades:
                continue
                
            # Проверка требований
            requirements_met = True
            for req_type, req_count in upgrade["requires"].items():
                if getattr(game_state, f"{req_type}s", 0) < req_count:
                    requirements_met = False
                    break
            
            if requirements_met:
                available.append(upgrade)
        
        return available
    
    @staticmethod
    def can_afford_upgrade(game_state: GameState, upgrade_id: int) -> bool:
        """Проверка, хватает ли печенек для улучшения"""
        for upgrade in CookieClickerGame.UPGRADES:
            if upgrade["id"] == upgrade_id:
                return game_state.cookies >= upgrade["cost"]
        return False
    
    @staticmethod
    def apply_upgrade(game_state: GameState, upgrade_id: int):
        """Применение улучшения"""
        for upgrade in CookieClickerGame.UPGRADES:
            if upgrade["id"] == upgrade_id:
                if upgrade["type"] == "cursor_multiplier":
                    game_state.click_multiplier *= upgrade["value"]
                elif upgrade["type"] == "grandma_multiplier":
                    # Здесь можно добавить логику для множителя бабушек
                    pass
                
                game_state.upgrades.append(upgrade_id)
                game_state.cookies -= upgrade["cost"]
                return True
        return False