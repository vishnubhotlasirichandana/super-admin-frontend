import axios from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

/* ── Rate-limit tracking (300 req/day admin limiter) ── */
export const rateLimitState = { remaining: null, limit: null };

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => {
        const rem = response.headers['x-ratelimit-remaining'];
        const lim = response.headers['x-ratelimit-limit'];
        if (rem !== undefined) rateLimitState.remaining = parseInt(rem, 10);
        if (lim !== undefined) rateLimitState.limit = parseInt(lim, 10);
        window.dispatchEvent(new CustomEvent('ratelimit-update', { detail: { ...rateLimitState } }));
        return response;
    },
    (error) => {
        const rem = error.response?.headers?.['x-ratelimit-remaining'];
        const lim = error.response?.headers?.['x-ratelimit-limit'];
        if (rem !== undefined) rateLimitState.remaining = parseInt(rem, 10);
        if (lim !== undefined) rateLimitState.limit = parseInt(lim, 10);
        window.dispatchEvent(new CustomEvent('ratelimit-update', { detail: { ...rateLimitState } }));
        return Promise.reject(error);
    }
);

const refreshAuthLogic = (failedRequest) =>
    axios
        .post(`${API_BASE_URL}/auth/refresh`, { refreshToken: localStorage.getItem('refreshToken') })
        .then((resp) => {
            const { accessToken, refreshToken } = resp.data.tokens;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            failedRequest.response.config.headers.Authorization = `Bearer ${accessToken}`;
            return Promise.resolve();
        })
        .catch((err) => {
            localStorage.clear();
            window.location.href = '/login';
            return Promise.reject(err);
        });

createAuthRefreshInterceptor(api, refreshAuthLogic);

/* ── Auth ── */
export const authApi = {
    login: (data) => api.post('/auth/login', data),
    logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
};

/* ── Module A: Application Management ── */
export const adminApi = {
    listApplications: (params) => api.get('/admin/applications', { params }),
    getApplication: (id, type) => api.get(`/admin/applications/${id}`, { params: { type } }),
    approve: (id, data) => api.post(`/admin/applications/${id}/approve`, data),
    hold: (id, data) => api.post(`/admin/applications/${id}/hold`, data),
    reject: (id, data) => api.post(`/admin/applications/${id}/reject`, data),
    addNote: (id, data) => api.post(`/admin/applications/${id}/notes`, data),
    resendDecision: (id, data) => api.post(`/admin/applications/${id}/resend-decision`, data),
};

/* ── Module B: Global Project Oversight ── */
export const projectApi = {
    adminListAll: () => api.get('/projects/admin/all'),
    getOne: (id) => api.get(`/projects/${id}`),
};

/* ── Module D: Communications & Notifications ── */
export const notifApi = {
    getEmailSends: (params) => api.get('/api/admin/email-sends', { params }),
    resendEmail: (id) => api.post(`/api/admin/email-sends/${id}/resend`),
    createNotification: (data) => api.post('/api/notifications', data),
};

/* ── Module E: Audit Logs ── */
export const auditApi = {
    listLogs: (params) => api.get('/admin/audit-logs', { params }),
};

export default api;
