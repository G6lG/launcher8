// Дополнительные UI функции

// Инициализация UI
function initUI() {
    // Добавляем обработчик для кнопки настроек
    const optionsBtn = document.getElementById('options-btn');
    if (optionsBtn) {
        optionsBtn.addEventListener('click', showOptions);
    }
    
    // Добавляем возможность клика по печеньке с помощью пробела
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            const cookie = document.getElementById('big-cookie');
            if (cookie) {
                // Создаем синтетическое событие клика
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                cookie.dispatchEvent(clickEvent);
            }
        }
    });
    
    // Добавляем эффект при наведении на генераторы
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('.generator-item')) {
            e.target.closest('.generator-item').style.transform = 'translateX(5px)';
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('.generator-item')) {
            e.target.closest('.generator-item').style.transform = '';
        }
    });
}

// Показать настройки
function showOptions() {
    // Создаем модальное окно настроек
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Options</h2>
            <div class="options-list">
                <div class="option-item">
                    <label>
                        <input type="checkbox" id="sound-toggle" checked>
                        Enable sounds
                    </label>
                </div>
                <div class="option-item">
                    <label>
                        <input type="checkbox" id="music-toggle" checked>
                        Enable background music
                    </label>
                </div>
                <div class="option-item">
                    <label>
                        <input type="checkbox" id="auto-save-toggle" checked>
                        Auto-save every 30 seconds
                    </label>
                </div>
                <div class="option-item">
                    <label>
                        <input type="checkbox" id="animations-toggle" checked>
                        Enable animations
                    </label>
                </div>
                <div class="option-item">
                    <label for="number-format">Number format:</label>
                    <select id="number-format">
                        <option value="standard">Standard (1.5K)</option>
                        <option value="scientific">Scientific (1.5e3)</option>
                        <option value="full">Full (1500)</option>
                    </select>
                </div>
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button id="save-options" style="flex: 1; background: var(--cc-green)">Save</button>
                <button id="close-options" style="flex: 1; background: var(--cc-red)">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Загружаем сохраненные настройки
    loadOptions();
    
    // Обработчики событий
    document.getElementById('save-options').addEventListener('click', saveOptions);
    document.getElementById('close-options').addEventListener('click', () => {
        modal.remove();
    });
    
    // Закрытие по клику вне окна
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Загрузить настройки
function loadOptions() {
    const options = JSON.parse(localStorage.getItem('cookieClickerOptions') || '{}');
    
    if (options.sound !== undefined) {
        document.getElementById('sound-toggle').checked = options.sound;
    }
    if (options.music !== undefined) {
        document.getElementById('music-toggle').checked = options.music;
    }
    if (options.autoSave !== undefined) {
        document.getElementById('auto-save-toggle').checked = options.autoSave;
    }
    if (options.animations !== undefined) {
        document.getElementById('animations-toggle').checked = options.animations;
    }
    if (options.numberFormat) {
        document.getElementById('number-format').value = options.numberFormat;
    }
}

// Сохранить настройки
function saveOptions() {
    const options = {
        sound: document.getElementById('sound-toggle').checked,
        music: document.getElementById('music-toggle').checked,
        autoSave: document.getElementById('auto-save-toggle').checked,
        animations: document.getElementById('animations-toggle').checked,
        numberFormat: document.getElementById('number-format').value
    };
    
    localStorage.setItem('cookieClickerOptions', JSON.stringify(options));
    
    // Применяем настройки
    applyOptions(options);
    
    // Закрываем окно
    document.querySelector('.modal').remove();
    
    showNotification('Options saved!');
}

// Применить настройки
function applyOptions(options) {
    // Применяем настройки звука
    const clickSound = document.getElementById('click-sound');
    const buySound = document.getElementById('buy-sound');
    const bgMusic = document.getElementById('bg-music');
    
    if (clickSound) clickSound.muted = !options.sound;
    if (buySound) buySound.muted = !options.sound;
    if (bgMusic) {
        bgMusic.muted = !options.music;
        if (options.music && bgMusic.paused) {
            bgMusic.play().catch(e => console.log('Music play failed:', e));
        }
    }
    
    // Применяем настройки автосохранения
    if (window.autoSaveInterval) {
        clearInterval(window.autoSaveInterval);
        if (options.autoSave) {
            window.autoSaveInterval = setInterval(() => {
                window.saveGame(true);
            }, 30000);
        }
    }
    
    // Применяем настройки анимаций
    document.body.classList.toggle('no-animations', !options.animations);
    
    // Сохраняем формат чисел
    window.numberFormat = options.numberFormat;
}

// Показать статистику
function showStats() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Statistics</h2>
            <div class="stats-list">
                <div class="stat-item">
                    <span class="stat-label">Cookies baked (all time):</span>
                    <span class="stat-value" id="stat-total-cookies">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Cookies clicked:</span>
                    <span class="stat-value" id="stat-clicks">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Hand-made cookies:</span>
                    <span class="stat-value" id="stat-handmade">0%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Time played:</span>
                    <span class="stat-value" id="stat-time">0:00</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Buildings owned:</span>
                    <span class="stat-value" id="stat-buildings">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Upgrades unlocked:</span>
                    <span class="stat-value" id="stat-upgrades">0/4</span>
                </div>
            </div>
            <button id="close-stats" style="width: 100%; margin-top: 20px;">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обновляем статистику
    updateStats();
    
    // Обработчик закрытия
    document.getElementById('close-stats').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Обновить статистику
function updateStats() {
    const totalCookies = window.gameState?.baked_all_time || 0;
    const clicks = window.gameState?.cookies_clicked || 0;
    const buildings = Object.values(window.gameState?.generators || {}).reduce((a, b) => a + b, 0);
    const upgrades = window.gameState?.upgrades?.length || 0;
    
    document.getElementById('stat-total-cookies').textContent = formatNumber(totalCookies);
    document.getElementById('stat-clicks').textContent = clicks.toLocaleString();
    document.getElementById('stat-handmade').textContent = totalCookies > 0 ? 
        ((clicks / totalCookies * 100) || 0).toFixed(1) + '%' : '0%';
    document.getElementById('stat-buildings').textContent = buildings.toLocaleString();
    document.getElementById('stat-upgrades').textContent = `${upgrades}/${GAME_CONFIG.upgrades.length}`;
}

// Добавляем CSS для модальных окон
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .options-list, .stats-list {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }
    
    .option-item, .stat-item {
        padding: 10px;
        background: var(--cc-dark-beige);
        border-radius: 8px;
        border: 1px solid var(--cc-light-brown);
    }
    
    .option-item label {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        font-size: 16px;
    }
    
    .option-item input[type="checkbox"] {
        width: 18px;
        height: 18px;
    }
    
    .option-item select {
        width: 100%;
        padding: 8px;
        margin-top: 5px;
        border-radius: 5px;
        border: 1px solid var(--cc-light-brown);
        background: white;
    }
    
    .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .stat-label {
        font-weight: bold;
        color: var(--cc-brown);
    }
    
    .stat-value {
        font-weight: bold;
        color: var(--cc-green);
    }
    
    .no-animations * {
        animation: none !important;
        transition: none !important;
    }
`;

document.head.appendChild(modalStyles);

// Инициализируем UI при загрузке
document.addEventListener('DOMContentLoaded', initUI);

// Экспортируем функции для использования
window.showStats = showStats;
window.showOptions = showOptions;