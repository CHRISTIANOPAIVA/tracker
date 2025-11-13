const ACTIVITY_TYPES = [
    { value: 'running', label: 'Corrida' },
    { value: 'cycling', label: 'Ciclismo' },
    { value: 'swimming', label: 'Natação' },
    { value: 'walking', label: 'Caminhada' },
    { value: 'gym', label: 'Academia' },
    { value: 'yoga', label: 'Yoga' },
    { value: 'other', label: 'Outra' },
];

const QUICK_ACTIONS = [
    { label: 'Corrida 30m', type: 'running', duration: 30 },
    { label: 'Ciclismo 45m', type: 'cycling', duration: 45 },
    { label: 'Caminhada 20m', type: 'walking', duration: 20 },
    { label: 'Yoga 40m', type: 'yoga', duration: 40 },
];

const DEFAULT_API_PORT = 3000;

// Try to keep the API usable even when the frontend is served from a different origin (Live Server, etc.).
// Consumers can override this behavior via window.APP_CONFIG.apiBaseUrl.
const resolveApiBaseUrl = () => {
    if (typeof window === 'undefined') {
        return `http://localhost:${DEFAULT_API_PORT}`;
    }

    if (window.APP_CONFIG?.apiBaseUrl) {
        return window.APP_CONFIG.apiBaseUrl;
    }

    const { origin, hostname, port, protocol } = window.location;
    const normalizedOrigin = origin && origin !== 'null' ? origin : '';
    const isHttpProtocol = /^https?:$/i.test(protocol);
    const isLocalHost = ['localhost', '127.0.0.1', '', undefined].includes(hostname);

    if (normalizedOrigin && (!isLocalHost || !port || Number(port) === DEFAULT_API_PORT)) {
        return normalizedOrigin;
    }

    if (isLocalHost) {
        const safeHost = hostname && hostname.length ? hostname : 'localhost';
        const safeProtocol = isHttpProtocol ? protocol : 'http:';
        return `${safeProtocol}//${safeHost}:${DEFAULT_API_PORT}`;
    }

    return `http://localhost:${DEFAULT_API_PORT}`;
};

const API_BASE_URL = resolveApiBaseUrl();

const buildApiUrl = (path) => {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    try {
        return new URL(path, API_BASE_URL).toString();
    } catch (error) {
        const trimmedBase = API_BASE_URL.replace(/\/+$/, '');
        const trimmedPath = path.replace(/^\/+/, '');
        return `${trimmedBase}/${trimmedPath}`;
    }
};

const parseJsonOrThrow = (text, url) => {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (error) {
        const preview = text.slice(0, 80).replace(/\s+/g, ' ').trim();
        throw new Error(
            `Resposta inesperada da API (${url}). Esperado JSON, mas recebemos: ${preview || 'conteúdo diferente'}.`
        );
    }
};

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const formatNumber = (value, options = {}) => {
    const formatter = new Intl.NumberFormat('pt-BR', {
        maximumFractionDigits: options.maximumFractionDigits ?? 1,
        minimumFractionDigits: options.minimumFractionDigits ?? 0,
    });
    return formatter.format(value || 0);
};

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

const formatDuration = (minutes) => `${minutes ?? 0} min`;

const formatTimer = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

const Toast = (() => {
    const container = qs('#toast-container');

    const show = (message, type = 'success') => {
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hide');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3500);
    };

    return { show };
})();

class ActivityTimer {
    constructor(displayNode) {
        this.displayNode = displayNode;
        this.intervalId = null;
        this.isRunning = false;
        this.startTime = 0;
        this.elapsed = 0;
        this.render();
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startTime = Date.now() - this.elapsed;
        this.intervalId = setInterval(() => this.render(), 500);
    }

    pause() {
        if (!this.isRunning) return;
        this.isRunning = false;
        clearInterval(this.intervalId);
        this.elapsed = Date.now() - this.startTime;
        this.render();
    }

    reset() {
        this.isRunning = false;
        this.elapsed = 0;
        clearInterval(this.intervalId);
        this.render();
    }

    render() {
        const elapsedMs = this.isRunning ? Date.now() - this.startTime : this.elapsed;
        if (this.displayNode) {
            this.displayNode.textContent = formatTimer(elapsedMs);
        }
    }
}

const apiRequest = async (path, options = {}) => {
    const url = buildApiUrl(path);
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
    });

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get('content-type') || '';
    const bodyText = await response.text();

    if (!response.ok) {
        if (contentType.includes('application/json')) {
            const errorPayload = parseJsonOrThrow(bodyText, url) || {};
            const message = errorPayload?.error || 'Falha ao processar requisição';
            throw new Error(message);
        }

        const hint = bodyText.slice(0, 80).replace(/\s+/g, ' ').trim();
        throw new Error(
            `Falha ao acessar ${url} (${response.status}). ` +
                `Conteúdo retornado: ${contentType || 'desconhecido'}. ` +
                `Verifique se o backend (${API_BASE_URL}) está ativo.${hint ? ` Resposta: ${hint}` : ''}`
        );
    }

    if (!bodyText) {
        return null;
    }

    if (!contentType.includes('application/json')) {
        throw new Error(
            `Resposta inesperada da API (${url}). Esperado 'application/json', mas recebemos '${contentType ||
                'desconhecido'}'. Verifique se o backend está respondendo corretamente.`
        );
    }

    return parseJsonOrThrow(bodyText, url);
};

const api = {
    getUsers: () => apiRequest('/api/users'),
    getUserStats: (id) => apiRequest(`/api/users/${id}/stats`),
    createUser: (data) =>
        apiRequest('/api/users', { method: 'POST', body: JSON.stringify(data) }),
    getActivities: (params = {}) => {
        const query = new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null && value !== '') acc[key] = value;
                return acc;
            }, {})
        ).toString();
        const suffix = query ? `?${query}` : '';
        return apiRequest(`/api/activities${suffix}`);
    },
    createActivity: (data) =>
        apiRequest('/api/activities', { method: 'POST', body: JSON.stringify(data) }),
    getOverview: () => apiRequest('/api/activities/stats/overview'),
};

class FitTrackApp {
    constructor() {
        this.state = {
            users: [],
            selectedUserId: null,
            currentUserStats: null,
            activities: [],
            recentActivities: [],
            filters: {
                type: '',
                startDate: '',
                endDate: '',
            },
            overview: null,
            charts: {},
        };

        this.nodes = {
            views: qsa('.view'),
            navButtons: qsa('.nav-link'),
            userSelect: qs('#user-select'),
            statusPill: qs('#status-pill'),
            dashboard: {
                calories: qs('#stat-total-calories'),
                duration: qs('#stat-total-duration'),
                distance: qs('#stat-total-distance'),
                activities: qs('#stat-total-activities'),
                recentActivities: qs('#recent-activities'),
                quickActions: qs('#quick-actions'),
            },
            filters: {
                type: qs('#filter-type'),
                start: qs('#filter-start'),
                end: qs('#filter-end'),
            },
            activityTable: qs('#activities-table'),
            activityForm: qs('#new-activity-form'),
            activityFormPanel: qs('#activity-form'),
            profile: {
                details: qs('#user-details'),
                stats: qs('#user-stats'),
            },
            newUserForm: qs('#new-user-form'),
        };

        this.timer = new ActivityTimer(qs('#timer-display'));
        this.bindEvents();
        this.populateStaticOptions();
        this.renderQuickActions();
        this.init();
    }

    setStatus(message, success = true) {
        if (!this.nodes.statusPill) return;
        this.nodes.statusPill.textContent = message;
        this.nodes.statusPill.style.background = success
            ? 'rgba(16, 185, 129, 0.15)'
            : 'rgba(239, 68, 68, 0.15)';
        this.nodes.statusPill.style.color = success ? '#34d399' : '#ef4444';
    }

    bindEvents() {
        qs('#refresh-data')?.addEventListener('click', () => this.refreshAll());
        qs('#load-user-stats')?.addEventListener('click', () => this.loadUserContext());

        const timerControls = {
            '#timer-start': () => this.timer.start(),
            '#timer-pause': () => this.timer.pause(),
            '#timer-reset': () => this.timer.reset(),
        };
        Object.entries(timerControls).forEach(([selector, handler]) => {
            qs(selector)?.addEventListener('click', handler);
        });

        this.nodes.navButtons.forEach((button) => {
            button.addEventListener('click', () => this.switchView(button.dataset.view, button));
        });

        this.nodes.userSelect?.addEventListener('change', (event) => {
            this.state.selectedUserId = Number(event.target.value) || null;
            this.syncFormUser();
            this.loadUserContext();
            this.loadActivities();
        });

        this.nodes.activityForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleActivitySubmit(new FormData(event.target));
        });

        this.nodes.newUserForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleUserSubmit(new FormData(event.target));
        });

        qs('#apply-filters')?.addEventListener('click', () => {
            this.state.filters.type = this.nodes.filters.type.value;
            this.state.filters.startDate = this.nodes.filters.start.value;
            this.state.filters.endDate = this.nodes.filters.end.value;
            this.loadActivities();
        });

        qs('#clear-filters')?.addEventListener('click', () => {
            this.nodes.filters.type.value = '';
            this.nodes.filters.start.value = '';
            this.nodes.filters.end.value = '';
            this.state.filters = { type: '', startDate: '', endDate: '' };
            this.loadActivities();
        });

        document.addEventListener('click', (event) => {
            const trigger = event.target.closest('[data-open-panel="activity-form"]');
            if (trigger) {
                this.switchView('activities');
                this.nodes.activityFormPanel?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    populateStaticOptions() {
        const selects = [
            this.nodes.filters.type,
            this.nodes.activityForm?.querySelector('select[name="type"]'),
        ].filter(Boolean);

        selects.forEach((select) => {
            select.innerHTML =
                select === this.nodes.filters.type ? '<option value="">Todos</option>' : '';
            ACTIVITY_TYPES.forEach((type) => {
                const option = document.createElement('option');
                option.value = type.value;
                option.textContent = type.label;
                select.appendChild(option);
            });
        });
    }

    renderQuickActions() {
        const container = this.nodes.dashboard.quickActions;
        if (!container) return;
        container.innerHTML = '';
        QUICK_ACTIONS.forEach((action) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'quick-action';
            btn.textContent = action.label;
            btn.addEventListener('click', () => this.prefillActivity(action));
            container.appendChild(btn);
        });
    }

    switchView(view, trigger) {
        this.nodes.views.forEach((section) => {
            section.classList.toggle('active', section.dataset.view === view);
        });

        if (trigger) {
            this.nodes.navButtons.forEach((button) => button.classList.remove('active'));
            trigger.classList.add('active');
        } else {
            this.nodes.navButtons.forEach((button) =>
                button.classList.toggle('active', button.dataset.view === view)
            );
        }
    }

    async init() {
        try {
            this.setStatus('Sincronizando…', true);
            await this.loadUsers();
            await Promise.all([this.loadUserContext(), this.loadOverview(), this.loadActivities()]);
            this.setStatus('Sincronizado');
        } catch (error) {
            console.error(error);
            this.setStatus(error.message, false);
            Toast.show(error.message, 'error');
        }
    }

    async refreshAll() {
        this.setStatus('Atualizando…');
        await Promise.all([this.loadUserContext(), this.loadOverview(), this.loadActivities()]);
        this.setStatus('Sincronizado');
    }

    async loadUsers() {
        const users = await api.getUsers();
        this.state.users = users;
        if (!this.state.selectedUserId && users.length) {
            this.state.selectedUserId = users[0].id;
        }
        this.renderUserSelects();
        this.syncFormUser();
        if (!users.length) {
            Toast.show('Cadastre um usuário para começar.', 'error');
        }
    }

    renderUserSelects() {
        const selects = [
            this.nodes.userSelect,
            this.nodes.activityForm?.querySelector('select[name="userId"]'),
        ].filter(Boolean);

        selects.forEach((select) => {
            select.innerHTML = '';
            if (!this.state.users.length) {
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = 'Cadastre um usuário';
                select.appendChild(emptyOption);
                return;
            }
            this.state.users.forEach((user) => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.name} (#${user.id})`;
                if (user.id === this.state.selectedUserId) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        });
    }

    syncFormUser() {
        const select = this.nodes.activityForm?.querySelector('select[name="userId"]');
        if (select && this.state.selectedUserId) {
            select.value = String(this.state.selectedUserId);
        }
    }

    async loadUserContext() {
        if (!this.state.selectedUserId) {
            this.state.currentUserStats = null;
            this.renderDashboardCards();
            this.renderProfile();
            return;
        }

        const stats = await api.getUserStats(this.state.selectedUserId);
        this.state.currentUserStats = stats;
        this.state.recentActivities = stats.recentActivities || [];
        this.renderDashboardCards();
        this.renderRecentActivities();
        this.renderProfile();
    }

    renderDashboardCards() {
        const stats = this.state.currentUserStats?.stats;
        const isEmpty = !stats;
        const calories = stats?.totalCalories || 0;
        const duration = stats?.totalDuration || 0;
        const distance = stats?.totalDistance || 0;
        const activities = stats?.totalActivities || 0;

        this.nodes.dashboard.calories.textContent = isEmpty
            ? '0 kcal'
            : `${formatNumber(calories, { maximumFractionDigits: 0 })} kcal`;
        this.nodes.dashboard.duration.textContent = isEmpty
            ? '0 min'
            : `${formatNumber(duration, { maximumFractionDigits: 0 })} min`;
        this.nodes.dashboard.distance.textContent = isEmpty
            ? '0 km'
            : `${formatNumber(distance, { maximumFractionDigits: 1 })} km`;
        this.nodes.dashboard.activities.textContent = isEmpty
            ? '0'
            : formatNumber(activities, { maximumFractionDigits: 0 });
    }

    renderRecentActivities() {
        const list = this.nodes.dashboard.recentActivities;
        if (!list) return;
        list.innerHTML = '';
        if (!this.state.recentActivities.length) {
            list.innerHTML = '<li class="muted">Nenhuma atividade recente.</li>';
            return;
        }

        this.state.recentActivities.forEach((activity) => {
            const item = document.createElement('li');
            item.className = 'activity-item';
            item.innerHTML = `
                <div>
                    <strong>${this.getActivityLabel(activity.type)}</strong>
                    <p class="activity-meta">${formatDate(activity.startTime)}</p>
                </div>
                <div>
                    <p class="activity-meta">${formatDuration(activity.duration)}</p>
                    <p class="activity-meta">${formatNumber(activity.caloriesBurned, {
                        maximumFractionDigits: 0,
                    })} kcal</p>
                </div>
            `;
            list.appendChild(item);
        });
    }

    getActivityLabel(type) {
        return ACTIVITY_TYPES.find((t) => t.value === type)?.label || type;
    }

    prefillActivity(action) {
        const form = this.nodes.activityForm;
        if (!form) return;
        const typeField = form.elements.namedItem('type');
        const durationField = form.elements.namedItem('duration');
        const startField = form.elements.namedItem('startTime');
        if (typeField) typeField.value = action.type;
        if (durationField) durationField.value = action.duration;
        if (startField) startField.value = this.toLocalInputValue(new Date());
        this.syncFormUser();
        this.switchView('activities');
        this.nodes.activityFormPanel?.scrollIntoView({ behavior: 'smooth' });
    }

    toLocalInputValue(date) {
        const pad = (value) => String(value).padStart(2, '0');
        const iso = new Date(date);
        const year = iso.getFullYear();
        const month = pad(iso.getMonth() + 1);
        const day = pad(iso.getDate());
        const hours = pad(iso.getHours());
        const minutes = pad(iso.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    async loadActivities() {
        const params = {
            userId: this.state.selectedUserId,
            type: this.state.filters.type,
            startDate: this.state.filters.startDate,
            endDate: this.state.filters.endDate,
        };
        const activities = await api.getActivities(params);
        this.state.activities = activities;
        this.renderActivitiesTable();
    }

    renderActivitiesTable() {
        if (!this.nodes.activityTable) return;
        this.nodes.activityTable.innerHTML = '';

        if (!this.state.activities.length) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6" class="muted">Nenhuma atividade encontrada.</td>`;
            this.nodes.activityTable.appendChild(row);
            return;
        }

        this.state.activities.forEach((activity) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(activity.startTime)}</td>
                <td>${this.getActivityLabel(activity.type)}</td>
                <td>${formatDuration(activity.duration)}</td>
                <td>${formatNumber(activity.distance, { maximumFractionDigits: 2 })} km</td>
                <td>${formatNumber(activity.caloriesBurned, { maximumFractionDigits: 0 })} kcal</td>
                <td>${activity.heartRate ?? '—'}</td>
            `;
            this.nodes.activityTable.appendChild(row);
        });
    }

    renderProfile() {
        const details = this.nodes.profile.details;
        const statsNode = this.nodes.profile.stats;
        if (!details || !statsNode) return;
        const data = this.state.currentUserStats?.user;

        details.innerHTML = '';
        statsNode.innerHTML = '';

        if (!data) {
            details.innerHTML = '<li>Selecione ou cadastre um usuário.</li>';
            statsNode.innerHTML = '<li>Sem estatísticas disponíveis.</li>';
            return;
        }

        const detailEntries = [
            ['Nome', data.name],
            ['Email', data.email],
            ['Idade', data.age ?? '—'],
            ['Peso', data.weight ? `${data.weight} kg` : '—'],
            ['Altura', data.height ? `${data.height} cm` : '—'],
            ['Criado em', formatDate(data.createdAt)],
        ];
        detailEntries.forEach(([label, value]) => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${label}</strong><br>${value}`;
            details.appendChild(li);
        });

        const stats = this.state.currentUserStats?.stats || {
            totalDuration: 0,
            totalCalories: 0,
            totalDistance: 0,
            totalActivities: 0,
        };
        const statEntries = [
            ['IMC', data.bmi ? data.bmi.toFixed(2) : '—'],
            ['Categoria', data.bmiCategory || '—'],
            ['Tempo total', `${stats.totalDuration} min`],
            ['Calorias', `${formatNumber(stats.totalCalories, { maximumFractionDigits: 0 })} kcal`],
            ['Distância', `${formatNumber(stats.totalDistance, { maximumFractionDigits: 1 })} km`],
            ['Atividades', stats.totalActivities],
        ];
        statEntries.forEach(([label, value]) => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${label}</strong><br>${value}`;
            statsNode.appendChild(li);
        });
    }

    async handleActivitySubmit(formData) {
        if (!this.state.selectedUserId) {
            Toast.show('Cadastre um usuário antes de registrar atividades.', 'error');
            return;
        }

        const payload = {
            userId: Number(formData.get('userId')),
            type: formData.get('type'),
            duration: Number(formData.get('duration')),
            startTime: this.toIso(formData.get('startTime')),
            heartRate: formData.get('heartRate')
                ? Number(formData.get('heartRate'))
                : undefined,
            notes: formData.get('notes')?.trim() || undefined,
        };

        try {
            await api.createActivity(payload);
            Toast.show('Atividade registrada com sucesso.');
            this.nodes.activityForm?.reset();
            this.syncFormUser();
            await Promise.all([this.loadUserContext(), this.loadActivities(), this.loadOverview()]);
        } catch (error) {
            Toast.show(error.message, 'error');
        }
    }

    toIso(value) {
        const date = value ? new Date(value) : new Date();
        return date.toISOString();
    }

    async handleUserSubmit(formData) {
        const payload = {
            name: formData.get('name'),
            email: formData.get('email'),
            age: formData.get('age') ? Number(formData.get('age')) : undefined,
            weight: formData.get('weight') ? Number(formData.get('weight')) : undefined,
            height: formData.get('height') ? Number(formData.get('height')) : undefined,
        };

        try {
            await api.createUser(payload);
            Toast.show('Usuário cadastrado com sucesso.');
            this.nodes.newUserForm?.reset();
            await this.loadUsers();
            await this.loadUserContext();
        } catch (error) {
            Toast.show(error.message, 'error');
        }
    }

    async loadOverview() {
        const overview = await api.getOverview();
        this.state.overview = overview;
        this.renderCharts();
    }

    renderCharts() {
        if (!window.Chart || !this.state.overview) return;
        const {
            caloriesByType = [],
            weeklyCalories = [],
            durationByType = [],
        } = this.state.overview;

        this.renderChart('calories', 'calories-chart', {
            type: 'doughnut',
            data: {
                labels: caloriesByType.map((row) => this.getActivityLabel(row.type)),
                datasets: [
                    {
                        data: caloriesByType.map((row) => row.calories),
                        backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'],
                    },
                ],
            },
        });

        this.renderChart('weekly', 'weekly-chart', {
            type: 'line',
            data: {
                labels: weeklyCalories.map((row) => row.day),
                datasets: [
                    {
                        data: weeklyCalories.map((row) => row.calories),
                        label: 'Calorias',
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.15)',
                        tension: 0.4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });

        this.renderChart('duration', 'duration-chart', {
            type: 'bar',
            data: {
                labels: durationByType.map((row) => this.getActivityLabel(row.type)),
                datasets: [
                    {
                        data: durationByType.map((row) => row.duration),
                        label: 'Minutos',
                        backgroundColor: '#10b981',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });
    }

    renderChart(key, canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        if (this.state.charts[key]) {
            this.state.charts[key].destroy();
        }
        const mergedConfig = {
            type: config.type,
            data: config.data,
            options: {
                plugins: { legend: { position: 'bottom' } },
                ...(config.options || {}),
            },
        };
        this.state.charts[key] = new Chart(canvas, mergedConfig);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new FitTrackApp();
});
