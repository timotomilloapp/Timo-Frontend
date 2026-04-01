export interface BaseEntity {
    id: string;
    name: string;
}

export interface ProteinOption {
    id: string;
    proteinTypeId: string;
    proteinType: BaseEntity;
}

export interface SideOption {
    id: string;
    sideDishId: string;
    sideDish: BaseEntity;
}

export interface Menu {
    id: string;
    date: string;
    dayOfWeek: string;
    status: 'SCHEDULED' | 'SERVED';
    soupId: string | null;
    soup: BaseEntity | null;
    drinkId: string | null;
    drink: BaseEntity | null;
    defaultProteinTypeId: string | null;
    defaultProteinType: BaseEntity | null;
    proteinOptions: ProteinOption[];
    sideOptions: SideOption[];
    createdAt: string;
    updatedAt: string;
    hasReservation?: boolean;
    reservationId?: string | null;
    reservedProteinId?: string | null;
    isPrinted?: boolean;
}

export interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export interface OfflineOrder {
    id?: number;
    tempId: string;
    userId: string;
    items: OrderItem[];
    total: number;
    status: 'pending' | 'synced' | 'failed';
    createdAt: string;
    syncedAt?: string;
}

export interface CachedMenu {
    id: string;
    data: Menu;
    updatedAt: string;
}
