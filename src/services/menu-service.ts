import { apiClient } from './api-client';
import { type Menu } from '@/types';

export const menuService = {
    /**
     * Fetch all menus with optional pagination.
     */
    async findAll(params?: { skip?: number; take?: number; startDate?: string; endDate?: string; cc?: string }): Promise<Menu[]> {
        const { data } = await apiClient.get<Menu[]>('/menus', {
            params,
        });
        return data;
    },

    /**
     * Fetch a specific menu by its date, optionally checking user reservation status.
     * @param date Date in YYYY-MM-DD format.
     * @param cc Optional user document to check reservations.
     */
    async findByDate(date: string, cc?: string): Promise<Menu> {
        let url = `/menus/by-date/${date}`;
        if (cc) {
            url = `/menus/by-date/${date}/user/${cc}`;
        }
        const { data } = await apiClient.get<Menu>(url);
        return data;
    },

    /**
     * Fetch a menu by its UUID.
     */
    async findOne(id: string): Promise<Menu> {
        const { data } = await apiClient.get<Menu>(`/menus/${id}`);
        return data;
    },
};
