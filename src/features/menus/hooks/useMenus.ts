import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';

export interface MenuResponse {
    id: string;
    date: string;
    dayOfWeek: string | null;
    status: 'SCHEDULED' | 'SERVED';
    createdAt: string;
    updatedAt: string;
    soup: { id: string; name: string } | null;
    drink: { id: string; name: string } | null;
    defaultProteinType: { id: string; name: string } | null;
    proteinOptions: { id: string; proteinTypeId: string; proteinType: { id: string; name: string } }[];
    sideOptions: { id: string; sideDishId: string; sideDish: { id: string; name: string } }[];
}

export function useMenusList(skip: number = 0, take: number = 50) {
    return useQuery({
        // Incluimos skip y take en la clave de query para cachear páginas diferentes
        queryKey: ['/menus', skip, take],
        queryFn: async () => {
            const { data } = await apiClient.get<MenuResponse[]>(`/menus?skip=${skip}&take=${take}`);
            return data;
        },
    });
}

export function useMenusByDateRange(startDate: string, endDate: string, take: number = 50) {
    return useQuery({
        queryKey: ['/menus', startDate, endDate, take],
        queryFn: async () => {
            const { data } = await apiClient.get<MenuResponse[]>(`/menus?startDate=${startDate}&endDate=${endDate}&take=${take}`);
            return data;
        },
        enabled: !!startDate && !!endDate,
    });
}

export function useMenuCreate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            date: string;
            soupId?: string;
            drinkId?: string;
            defaultProteinTypeId?: string;
            proteinOptionIds?: string[];
            sideOptionIds?: string[];
        }) => {
            const { data } = await apiClient.post(`/menus`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/menus'] });
        },
    });
}

export function useMenuDelete() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await apiClient.delete(`/menus/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/menus'] });
        },
    });
}

export function useMenuStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: 'SCHEDULED' | 'SERVED' }) => {
            const { data } = await apiClient.patch(`/menus/${id}/status`, { status });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/menus'] });
        },
    });
}

export function useMenuClone() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, date }: { id: string; date: string }) => {
            const { data } = await apiClient.post(`/menus/${id}/clone`, { date });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/menus'] });
        },
    });
}

export function useMenuUpdate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: {
            id: string;
            payload: {
                soupId?: string;
                drinkId?: string;
                defaultProteinTypeId?: string;
                proteinOptionIds?: string[];
                sideOptionIds?: string[];
            }
        }) => {
            const { data } = await apiClient.patch(`/menus/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/menus'] });
        },
    });
}
