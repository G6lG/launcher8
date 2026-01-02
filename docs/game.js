// Конфигурация игры
const GAME_CONFIG = {
    version: '1.0.0',
    autoSaveInterval: 30000, // 30 секунд
    updateInterval: 1000, // 1 секунда
    generators: {
        cursor: { 
            name: 'Cursor', 
            baseCost: 15, 
            baseCps: 0.1,
            emoji: '🖱️',
            description: 'Autoclicks once every 10 seconds.'
        },
        grandma: { 
            name: 'Grandma', 
            baseCost: 100, 
            baseCps: 1,
            emoji: '👵',
            description: 'A nice grandma to bake more cookies.'
        },
        farm: { 
            name: 'Farm', 
            baseCost: 1100, 
            baseCps: 8,
            emoji: '🌾',
            description: 'Grows cookie plants from cookie seeds.'
        },
        mine: { 
            name: 'Mine', 
            baseCost: 12000, 
            baseCps: 47,
            emoji: '⛏️',
            description: 'Mines out cookie dough and chocolate chips.'
        },
        factory: { 
            name: 'Factory', 
            baseCost: 130000, 
            baseCps: 260,
            emoji: '🏭',
            description: 'Produces large quantities of cookies.'
        }
    },
    upgrades: [
        {
            id: 1,
            name: 'Reinforced index finger',
            description: 'Cursors are twice as efficient.',
            cost: 100,
            emoji: '💪',
            type: 'cursor'
        },
        {
            id: 2,
            name: 'Forwards from grandma',
            description: 'Grandmas are twice as efficient.',
            cost: 500,
            emoji: '📨',
            type: 'grandma'
        },
        {
            id: 3,
            name: 'Steel-plated rolling pins',
            description: 'Grandmas are twice as efficient.',
            cost: 5000,
            emoji: '🥖',
            type: 'grandma'
        },
        {
            id: 4,
            name: 'Lubricated dentures',
            description: 'Grandmas are twice as efficient.',
            cost: 50000,
            emoji: '🦷',
            type: 'grandma'
        }
    ]
};

// Глобальное состояние игры
let gameState = {
    cookies: 0,
    cps: 0,
    clickValue: 1,
    generators: {
        cursor: 0,
        grandma: 0,
        farm: 0,
        mine: 0,
        factory: 0
    },
    upgrades: [],
    prestige: {
        level: 0,
        heavenlyChips: 0
    },
    totalClicks: 0
};

// Таймеры
let gameLoopInterval;
let autoSaveInterval;

// Инициализация игры
async function initGame() {
    console.log('Initializing game...');
    
    // Проверяем авторизацию
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginModal();
        return;
    }
    
    try {
        // Проверяем токен
        await api.getCurrentUser();
        
        // Загружаем состояние игры
        await loadGameState();
        
        // Скрываем модальное окно
        hideLoginModal();
        
        // Запускаем игровой цикл
        startGameLoop();
        
        // Настраиваем обработчики событий
        setupEventListeners();
        
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showLoginModal();
    }
}

// Показать модальное окно входа
function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Скрыть модальное окно входа
function hideLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Загрузить состояние игры с сервера
async function loadGameState() {
    try {
        const data = await api.getGameState();
        
        gameState.cookies = data.cookies;
        gameState.cps = data.cps;
        gameState.clickValue = data.click_value;
        gameState.generators = data.generators;
        gameState.upgrades = data.upgrades;
        gameState.prestige = data.prestige;
        
        updateUI();
        updateGeneratorsList();
        updateUpgradesList();
        
        console.log('Game state loaded:', data);
    } catch (error) {
        console.error('Failed to load game state:', error);
        throw error;
    }
}

// Настроить обработчики событий
function setupEventListeners() {
    // Клик по печеньке
    const bigCookie = document.getElementById('big-cookie');
    if (bigCookie) {
        bigCookie.addEventListener('click', handleCookieClick);
    }
    
    // Кнопка сохранения
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveGame);
    }
    
    // Кнопка выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Формы аутентификации
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Переключение между вкладками
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Обработка нажатия клавиш
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Spacebar') {
            // Пробел для клика по печеньке
            handleCookieClick();
        } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
            // Ctrl+S для сохранения
            e.preventDefault();
            saveGame();
        }
    });
}

// Переключение между вкладками
function switchTab(tabName) {
    // Обновляем активные кнопки
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Обновляем активные формы
    document.querySelectorAll('.tab-content').forEach(form => {
        form.classList.toggle('active', form.id === `${tabName}-form`);
    });
    
    // Очищаем сообщение об ошибке
    const errorElement = document.getElementById('auth-error');
    if (errorElement) {
        errorElement.textContent = '';
    }
}

// Обработка входа
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('auth-error');
    
    try {
        const response = await api.login(username, password);
        api.setToken(response.access_token);
        await initGame();
    } catch (error) {
        if (errorElement) {
            errorElement.textContent = error.message || 'Login failed';
        }
        console.error('Login failed:', error);
    }
}

// Обработка регистрации
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorElement = document.getElementById('auth-error');
    
    try {
        const response = await api.register(username, email, password);
        api.setToken(response.access_token);
        await initGame();
    } catch (error) {
        if (errorElement) {
            errorElement.textContent = error.message || 'Registration failed';
        }
        console.error('Registration failed:', error);
    }
}

// Выход из системы
function logout() {
    api.clearToken();
    window.location.reload();
}

// Игровой цикл
function startGameLoop() {
    // Останавливаем предыдущие интервалы
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    
    // Обновляем интерфейс каждую секунду
    gameLoopInterval = setInterval(() => {
        if (gameState.cps > 0) {
            gameState.cookies += gameState.cps;
            updateCookieCounter();
        }
    }, 1000);
    
    // Автосохранение каждые 30 секунд
    autoSaveInterval = setInterval(() => {
        saveGame(true); // auto-save
    }, 30000);
    
    console.log('Game loop started');
}

// Обработка клика по печеньке
async function handleCookieClick(event) {
    try {
        const response = await api.clickCookie();
        
        if (response && response.success) {
            gameState.cookies = response.cookies;
            gameState.totalClicks = response.total_clicks;
            
            // Визуальный эффект клика
            if (event) {
                createClickEffect(event.clientX, event.clientY, response.click_value);
            }
            
            // Звуковой эффект
            playSound('click');
            
            // Анимация печеньки
            animateCookieClick();
            
            updateUI();
        }
    } catch (error) {
        console.error('Click failed:', error);
    }
}

// Создать эффект клика
function createClickEffect(x, y, value) {
    const feedback = document.getElementById('click-feedback');
    if (!feedback) return;
    
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = `+${value.toFixed(1)}`;
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    
    feedback.appendChild(effect);
    
    // Удаляем эффект после анимации
    setTimeout(() => {
        effect.remove();
    }, 1000);
}

// Анимация клика по печеньке
function animateCookieClick() {
    const cookie = document.getElementById('cookie-img');
    if (cookie) {
        cookie.classList.add('pulse');
        setTimeout(() => {
            cookie.classList.remove('pulse');
        }, 300);
    }
}

// Воспроизвести звук
function playSound(type) {
    try {
        const audio = document.getElementById(`${type}-sound`);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Audio play failed:', e));
        }
    } catch (error) {
        console.log('Sound error:', error);
    }
}

// Покупка генератора
async function buyGenerator(type) {
    try {
        const response = await api.buyGenerator(type, 1);
        
        if (response && response.success) {
            gameState.cookies = response.cookies;
            gameState.generators[type] = response.new_count;
            
            // Обновляем CPS
            updateCPS();
            
            // Звуковой эффект
            playSound('buy');
            
            updateUI();
            updateGeneratorsList();
            updateUpgradesList();
            
            return true;
        } else {
            console.log('Purchase failed:', response?.error);
            return false;
        }
    } catch (error) {
        console.error('Purchase failed:', error);
        return false;
    }
}

// Покупка улучшения
async function buyUpgrade(upgradeId) {
    try {
        const response = await api.buyUpgrade(upgradeId);
        
        if (response && response.success) {
            gameState.cookies = response.cookies;
            gameState.upgrades.push(upgradeId);
            
            // Обновляем CPS
            updateCPS();
            
            // Звуковой эффект
            playSound('buy');
            
            updateUI();
            updateUpgradesList();
            updateGeneratorsList();
            
            return true;
        } else {
            console.log('Upgrade purchase failed:', response?.error);
            return false;
        }
    } catch (error) {
        console.error('Upgrade purchase failed:', error);
        return false;
    }
}

// Обновить список генераторов
function updateGeneratorsList() {
    const generatorsList = document.getElementById('generators-list');
    if (!generatorsList) return;
    
    generatorsList.innerHTML = '';
    
    Object.entries(GAME_CONFIG.generators).forEach(([type, config]) => {
        const count = gameState.generators[type] || 0;
        const cost = calculateGeneratorCost(type, count);
        const canAfford = gameState.cookies >= cost;
        
        const generatorElement = document.createElement('div');
        generatorElement.className = 'generator-item';
        
        generatorElement.innerHTML = `
            <div class="generator-info">
                <div class="generator-icon">${config.emoji}</div>
                <div class="generator-text">
                    <div class="generator-name">${config.name}</div>
                    <div class="generator-stats">
                        ${count} owned • ${config.baseCps} cookies/sec each
                        ${count > 0 ? `<br>Total: ${(count * config.baseCps).toFixed(1)}/sec` : ''}
                    </div>
                </div>
            </div>
            <div class="generator-cost">🍪 ${cost.toFixed(1)}</div>
            <button class="buy-button" data-type="${type}" ${!canAfford ? 'disabled' : ''}>
                Buy (1)
            </button>
        `;
        
        // Добавляем обработчик клика на кнопку покупки
        const buyButton = generatorElement.querySelector('.buy-button');
        buyButton.addEventListener('click', async () => {
            if (await buyGenerator(type)) {
                // Обновляем только этот генератор
                const newCost = calculateGeneratorCost(type, gameState.generators[type]);
                const newCanAfford = gameState.cookies >= newCost;
                
                generatorElement.querySelector('.generator-stats').innerHTML = `
                    ${gameState.generators[type]} owned • ${config.baseCps} cookies/sec each
                    ${gameState.generators[type] > 0 ? `<br>Total: ${(gameState.generators[type] * config.baseCps).toFixed(1)}/sec` : ''}
                `;
                generatorElement.querySelector('.generator-cost').textContent = `🍪 ${newCost.toFixed(1)}`;
                buyButton.disabled = !newCanAfford;
            }
        });
        
        generatorsList.appendChild(generatorElement);
    });
}

// Обновить список улучшений
function updateUpgradesList() {
    const upgradesList = document.getElementById('upgrades-list');
    if (!upgradesList) return;
    
    upgradesList.innerHTML = '';
    
    // Загружаем доступные улучшения с сервера
    api.getUpgrades().then(data => {
        const availableUpgrades = data.upgrades || [];
        
        GAME_CONFIG.upgrades.forEach(upgrade => {
            const isPurchased = gameState.upgrades.includes(upgrade.id);
            const isAvailable = availableUpgrades.some(u => u.id === upgrade.id);
            const canAfford = gameState.cookies >= upgrade.cost && isAvailable && !isPurchased;
            
            const upgradeElement = document.createElement('div');
            upgradeElement.className = `upgrade-item ${isPurchased ? 'purchased' : ''} ${!isAvailable ? 'unavailable' : ''}`;
            
            upgradeElement.innerHTML = `
                <div class="upgrade-icon">${upgrade.emoji}</div>
                <div class="upgrade-name">${upgrade.name}</div>
                <div class="upgrade-description">${upgrade.description}</div>
                <div class="upgrade-cost">${upgrade.cost}</div>
                ${!isPurchased ? `<button class="buy-button" ${!canAfford ? 'disabled' : ''}>Buy</button>` : ''}
            `;
            
            if (!isPurchased) {
                const buyButton = upgradeElement.querySelector('.buy-button');
                buyButton.addEventListener('click', async () => {
                    if (await buyUpgrade(upgrade.id)) {
                        upgradeElement.classList.add('purchased');
                        buyButton.remove();
                    }
                });
            }
            
            upgradesList.appendChild(upgradeElement);
        });
    }).catch(error => {
        console.error('Failed to load upgrades:', error);
    });
}

// Обновить CPS
function updateCPS() {
    // В реальной реализации нужно получать CPS с сервера
    // Здесь используем упрощенный расчет
    let totalCPS = 0;
    
    Object.entries(gameState.generators).forEach(([type, count]) => {
        if (count > 0) {
            const generator = GAME_CONFIG.generators[type];
            let multiplier = 1;
            
            // Применяем улучшения
            if (type === 'cursor' && gameState.upgrades.includes(1)) {
                multiplier *= 2;
            }
            if (type === 'grandma' && gameState.upgrades.some(id => [2, 3, 4].includes(id))) {
                // Каждое улучшение удваивает эффективность бабушек
                const grandmaUpgrades = gameState.upgrades.filter(id => [2, 3, 4].includes(id)).length;
                multiplier *= Math.pow(2, grandmaUpgrades);
            }
            
            totalCPS += count * generator.baseCps * multiplier;
        }
    });
    
    gameState.cps = totalCPS;
    updateCPSDisplay();
}

// Рассчитать стоимость генератора
function calculateGeneratorCost(type, owned) {
    const generator = GAME_CONFIG.generators[type];
    if (!generator) return 0;
    
    return generator.baseCost * Math.pow(1.15, owned);
}

// Обновить отображение счетчика печенек
function updateCookieCounter() {
    const cookieCount = document.getElementById('cookie-count');
    if (cookieCount) {
        cookieCount.textContent = formatNumber(gameState.cookies);
    }
}

// Обновить отображение CPS
function updateCPSDisplay() {
    const cpsDisplay = document.getElementById('cps');
    if (cpsDisplay) {
        cpsDisplay.textContent = formatNumber(gameState.cps);
    }
}

// Обновить имя пользователя
function updateUsername() {
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        // В реальной реализации нужно получать имя пользователя с сервера
        usernameElement.textContent = 'Player';
    }
}

// Обновить весь интерфейс
function updateUI() {
    updateCookieCounter();
    updateCPSDisplay();
    updateUsername();
}

// Сохранить игру
async function saveGame(isAutoSave = false) {
    try {
        await api.saveGame();
        if (!isAutoSave) {
            showNotification('Game saved!');
        }
        console.log('Game saved');
    } catch (error) {
        console.error('Save failed:', error);
        if (!isAutoSave) {
            showNotification('Save failed!', true);
        }
    }
}

// Показать уведомление
function showNotification(message, isError = false) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${isError ? '#f44336' : '#4caf50'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Форматировать число
function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(1);
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    initGame();
    
    // Добавляем стили для анимаций
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .notification {
            font-weight: bold;
            font-size: 16px;
        }
    `;
    document.head.appendChild(style);
});

// Экспортируем для отладки
window.gameState = gameState;
window.buyGenerator = buyGenerator;
window.buyUpgrade = buyUpgrade;
window.saveGame = saveGame;