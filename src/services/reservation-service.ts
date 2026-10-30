import { apiClient } from './api-client';

export interface CreateReservationDto {
    cc: string;
    menuId: string;
    proteinTypeId: string;
    sideDishId?: string;
    drinkId?: string;
}

export interface ReservationResponse {
    id: string;
    cc: string;
    status: 'PENDIENTE' | 'SERVIDA' | 'CANCELADA';
    createdAt: string;
    menu: {
        date: string;
    };
    protein: {
        name: string;
    };
}

export const reservationService = {
    /**
     * Create a new reservation (order).
     * This is a public endpoint that uses CC for identification.
     */
    async create(dto: CreateReservationDto): Promise<ReservationResponse> {
        const { data } = await apiClient.post<ReservationResponse>('/reservations', dto);
        return data;
    },

    /**
     * Fetch all reservations for a specific CC (customer document).
     */
    async findByCC(cc: string, date?: string): Promise<ReservationResponse[]> {
        const { data } = await apiClient.get<ReservationResponse[]>(`/reservations/by-cc/${cc}`, {
            params: { date },
        });
        return data;
    },

    /**
     * Mark a reservation ticket as printed, making the protein selection immutable.
     */
    async markAsPrinted(id: string): Promise<ReservationResponse> {
        const { data } = await apiClient.patch<ReservationResponse>(`/reservations/${id}/printed`);
        return data;
    },
};
