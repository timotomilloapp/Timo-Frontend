import { apiClient } from './api-client';
import { getDeviceToken } from './device-session';

export interface WhitelistLoginResponse {
    publicToken: string;
    cc: string;
    name: string;
}

const SESSION_KEY = 'whitelist_session';

export const whitelistService = {
    /**
     * Authenticate with just the cédula (CC).
     * Stores the session in sessionStorage for the reservation flow.
     */
    async loginByCc(cc: string): Promise<WhitelistLoginResponse> {
        const deviceToken = getDeviceToken();
        const { data } = await apiClient.post<WhitelistLoginResponse>(
            '/whitelist/login',
            { cc },
        );
        if (!deviceToken || deviceToken !== getDeviceToken()) throw new Error('La sesión del dispositivo cambió. Ingresa nuevamente.');
        // Persist session for the order flow
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
        }
        return data;
    },

    getSession(): WhitelistLoginResponse | null {
        if (typeof window === 'undefined') return null;
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as WhitelistLoginResponse;
        } catch {
            return null;
        }
    },

    clearSession() {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(SESSION_KEY);
        }
    },

    changeUser() {
        this.clearSession();
        localStorage.removeItem('user_cedula');
        window.location.assign('/');
    },
};
