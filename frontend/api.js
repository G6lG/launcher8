// API взаимодействие с бэкендом

const API_BASE_URL = 'http://localhost:8000';

// Утилиты для работы с API
class API {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (response.status === 401) {
                // Неавторизован - перенаправляем на страницу входа
                this.clearToken();
                window.location.reload();
                return null;
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(error.detail || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Аутентификация
    async register(username, email, password) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    }

    async login(username, password) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        
        return this.request('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });
    }

    async getCurrentUser() {
        return this.request('/api/auth/me');
    }

    // Игра
    async getGameState() {
        return this.request('/api/game');
    }

    async clickCookie() {
        return this.request('/api/game/click', {
            method: 'POST'
        });
    }

    async buyGenerator(generatorType, amount = 1) {
        return this.request('/api/game/buy', {
            method: 'POST',
            body: JSON.stringify({ generator_type: generatorType, amount })
        });
    }

    async buyUpgrade(upgradeId) {
        return this.request(`/api/game/buy_upgrade/${upgradeId}`, {
            method: 'POST'
        });
    }

    async getUpgrades() {
        return this.request('/api/game/upgrades');
    }

    async saveGame() {
        return this.request('/api/game/save', {
            method: 'POST'
        });
    }
}

// Создаем глобальный экземпляр API
const api = new API();

// Экспортируем для использования в других файлах
window.api = api;