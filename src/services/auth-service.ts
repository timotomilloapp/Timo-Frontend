import { set, get, del } from 'idb-keyval';
import { apiClient } from './api-client';

const TOKEN_KEY = 'auth_token';
const REFRESH_KEY = 'refresh_token';

// Exact shape returned by POST /auth/token
export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    user: {
        id: string;
        aud: string;
        role: string;
        email: string;
        email_confirmed_at: string;
        phone: string;
        confirmed_at: string;
        last_sign_in_at: string;
        app_metadata: {
            provider: string;
            providers: string[];
        };
        user_metadata: {
            email_verified: boolean;
        };
        created_at: string;
        updated_at: string;
        is_anonymous: boolean;
    };
}

// Shape returned by GET /auth/me
export interface UserProfile {
    userId: string;
    role: string;
    email: string;
}

export const authService = {
    /**
     * Authenticate with email + password.
     * Persists access_token and refresh_token to IndexedDB.
     */
    async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
        const { data } = await apiClient.post<AuthResponse>('/auth/token', credentials);
        await this.saveTokens(data.access_token, data.refresh_token);
        return data;
    },

    /**
     * Get the authenticated user profile (requires valid token).
     */
    async me(): Promise<UserProfile> {
        const { data } = await apiClient.get<UserProfile>('/auth/me');
        return data;
    },

    async saveTokens(accessToken: string, refreshToken: string) {
        await set(TOKEN_KEY, accessToken);
        await set(REFRESH_KEY, refreshToken);
    },

    async getToken(): Promise<string | undefined> {
        return await get<string>(TOKEN_KEY);
    },

    async getRefreshToken(): Promise<string | undefined> {
        return await get<string>(REFRESH_KEY);
    },

    async logout(redirectUrl: string = '/admin/login') {
        await del(TOKEN_KEY);
        await del(REFRESH_KEY);
        if (typeof window !== 'undefined' && redirectUrl) {
            window.location.href = redirectUrl;
        }
    },

    async isAuthenticated(): Promise<boolean> {
        const token = await this.getToken();
        return !!token;
    },
};
