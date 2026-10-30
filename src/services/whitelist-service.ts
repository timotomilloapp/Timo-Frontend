import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
        const { data } = await axios.post<WhitelistLoginResponse>(
            `${API_URL}/whitelist/login`,
            { cc },
        );
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
};
