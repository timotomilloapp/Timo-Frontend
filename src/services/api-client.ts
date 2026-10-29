import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { authService } from './auth-service';
import { clearDeviceSession, getDeviceToken } from './device-session';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Custom Axios instance for the Lunch App.
 * Includes automatic JWT injection and response interceptors.
 */
export const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor: Inject Bearer Token
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const isAdmin = typeof window !== 'undefined' && (window.location.pathname.startsWith('/admin') || window.location.pathname === '/tickets');
        const token = isAdmin ? await authService.getToken() : undefined;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        const deviceToken = getDeviceToken();
        if (deviceToken) config.headers['X-Device-Session'] = deviceToken;
        if (config.method === 'get' && /\/(device-access|whitelist|menus|reservations)(\/|$)/.test(config.url || '')) {
            config.params = { ...config.params, _accessCheck: `${Date.now()}-${Math.random()}` };
        }

        // Allow browser to automatically set boundary for FormData
        if (config.data instanceof FormData && config.headers) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: Handle global errors (like 401)
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.data?.code === 'DEVICE_SESSION_REQUIRED' && typeof window !== 'undefined') {
            if (error.config?.headers?.['X-Device-Session'] === getDeviceToken()) clearDeviceSession();
        }
        const originalRequest = error.config;

        // Handle 401 Unauthorized (Expired Tokens)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // If we are offline, we can't refresh. The SyncManager will handle the retry 
            // when we come back online.
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                return Promise.reject(error);
            }

            // Logic for token refresh could go here
            // await authService.refreshToken();
            // return apiClient(originalRequest);
        }

        return Promise.reject(error);
    }
);
