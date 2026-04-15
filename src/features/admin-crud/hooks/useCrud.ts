import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';

/**
 * Generic Fetch Hooks for the Admin CRUD factory.
 * Assumes standardized NestJS REST endpoints:
 * GET /api/v1/{resource}
 * GET /api/v1/{resource}/{id}
 * POST /api/v1/{resource}
 * PATCH /api/v1/{resource}/{id}/deactivate  (or update)
 * DELETE /api/v1/{resource}/{id}
 */

interface PaginatedParams {
    skip?: number;
    take?: number;
    [key: string]: any;
}

export function useCrudList<T>(resource: string, params?: PaginatedParams) {
    const { skip = 0, take = 10, ...rest } = params ?? {};
    return useQuery({
        queryKey: [resource, skip, take, rest],
        queryFn: async () => {
            const { data } = await apiClient.get<T[]>(`${resource}`, {
                params: { skip, take, ...rest },
            });
            return data;
        },
    });
}

export function useCrudCreate<T, DTO>(resource: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: DTO) => {
            const { data } = await apiClient.post<T>(`${resource}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [resource] });
        },
    });
}

export function useCrudUpdate<T, DTO>(resource: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: string | number; payload: DTO }) => {
            const { data } = await apiClient.patch<T>(`${resource}/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [resource] });
        },
    });
}

export function useCrudToggle(resource: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string | number) => {
            const { data } = await apiClient.patch(`${resource}/${id}/toggle`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [resource] });
        },
    });
}

export function useCrudDelete(resource: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string | number) => {
            const { data } = await apiClient.delete(`${resource}/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [resource] });
        },
    });
}
