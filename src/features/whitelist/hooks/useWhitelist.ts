import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';

export interface WhitelistEntry {
    id: string;
    cc: string;
    name: string;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
    birthdate?: string | null;
    areaId?: string | null;
    area?: { id: string; name: string } | null;
}

export function useWhitelistList(skip: number = 0, take: number = 10, q?: string) {
    return useQuery({
        queryKey: ['/whitelist', skip, take, q],
        queryFn: async () => {
            let url = `/whitelist?skip=${skip}&take=${take}`;
            if (q) {
                url += `&q=${encodeURIComponent(q)}`;
            }
            const response = await apiClient.get<{ data: WhitelistEntry[], total: number }>(url);
            return response.data;
        },
    });
}

export function useWhitelistCreate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { cc: string; name: string; birthdate?: string | null; areaId?: string | null }) => {
            const { data } = await apiClient.post<WhitelistEntry>(`/whitelist`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/whitelist'] });
            queryClient.invalidateQueries({ queryKey: ['/whitelist/birthdays'] });
        },
    });
}

export function useWhitelistToggle() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await apiClient.patch<WhitelistEntry>(`/whitelist/${id}/deactivate`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/whitelist'] });
            queryClient.invalidateQueries({ queryKey: ['/whitelist/birthdays'] });
        },
    });
}

export function useWhitelistDelete() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/whitelist/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/whitelist'] });
            queryClient.invalidateQueries({ queryKey: ['/whitelist/birthdays'] });
        },
    });
}

export function useWhitelistUpdate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { cc?: string; name?: string; birthdate?: string | null; areaId?: string | null } }) => {
            const res = await apiClient.patch<WhitelistEntry>(`/whitelist/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/whitelist'] });
            queryClient.invalidateQueries({ queryKey: ['/whitelist/birthdays'] });
        },
    });
}

export function useWhitelistBulkCreate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await apiClient.post('/whitelist/bulk', formData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/whitelist'] });
            queryClient.invalidateQueries({ queryKey: ['/whitelist/birthdays'] });
        },
    });
}
