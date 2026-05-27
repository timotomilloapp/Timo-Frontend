'use client';

import React from 'react';
import { z } from 'zod';
import { CrudPage } from '@/features/admin-crud/components/CrudPage';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { CrudEntityConfig } from '@/features/admin-crud/types';
import { exportAppetizersToXlsx, exportAppetizersToCsv } from '@/lib/export-appetizers';
import { useCrudUpdate } from '@/features/admin-crud/hooks/useCrud';
import { authService } from '@/services/auth-service';
import { RotateCcw } from 'lucide-react';

function isDateTomorrowOrLaterColombia(dateStr: string): boolean {
    if (!dateStr) return false;
    const now = new Date();
    // Colombia is UTC-5
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const colDate = new Date(utc + (3600000 * -5));
    const todayStr = colDate.toISOString().slice(0, 10);
    const targetStr = dateStr.split('T')[0];
    return targetStr > todayStr;
}

export default function AppetizersPage() {
    // 1. Fetch active areas dynamically from the database
    const { data: areas, isLoading: isAreasLoading } = useQuery({
        queryKey: ['/areas', 'active-all'],
        queryFn: async () => {
            const { data } = await apiClient.get<any[]>('/areas/active/all');
            return data;
        }
    });

    // 2. Fetch current user role to toggle edit permissions
    const [isReadOnly, setIsReadOnly] = React.useState(false);
    React.useEffect(() => {
        async function fetchRole() {
            try {
                const profile = await authService.me();
                if (profile?.role === 'USER') {
                    setIsReadOnly(true);
                }
            } catch {
                // ignore
            }
        }
        fetchRole();
    }, []);

    const updateMut = useCrudUpdate('/appetizers');
    const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

    const handleToggleStatus = async (item: any) => {
        setIsUpdatingStatus(true);
        try {
            const newStatus = item.status === 'PENDIENTE' ? 'ENTREGADO' : 'PENDIENTE';
            await updateMut.mutateAsync({ id: item.id, payload: { status: newStatus } });
        } catch (error) {
            console.error('Error toggling status', error);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const activeAreas = areas || [];

    // 2. Build the config reactively
    const appetizersConfig: CrudEntityConfig = {
        entityKey: 'appetizers',
        title: 'Aperitivos',
        singularTitle: 'Aperitivo',
        endpoints: {
            base: '/appetizers',
        },
        hasToggle: false, // Hide toggle since Appetizer has no isActive field
        // Only admins can see edit/delete buttons, so we return true unconditionally.
        // The CrudPage automatically hides these buttons if the user is a 'USER'.
        canEdit: () => true,
        canDelete: () => true,
        onExport: async (format) => {
            try {
                const { data } = await apiClient.get<any[]>('/appetizers', {
                    params: { take: 1000, skip: 0 }
                });
                if (format === 'xlsx') {
                    exportAppetizersToXlsx(data);
                } else {
                    exportAppetizersToCsv(data);
                }
            } catch (err) {
                console.error('Error exporting appetizers', err);
            }
        },
        customActions: (item) => {
            if (isReadOnly) return null;
            return (
                <button
                    onClick={() => handleToggleStatus(item)}
                    disabled={isUpdatingStatus}
                    className="p-1.5 text-blue-500 hover:text-blue-700 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 flex items-center justify-center"
                    title="Actualizar estado"
                >
                    <RotateCcw size={14} className={isUpdatingStatus ? "animate-spin" : ""} />
                </button>
            );
        },
        columns: [
            {
                header: 'Unidades',
                accessorKey: 'quantity',
                align: 'left',
                render: (item) => <div className="w-16 text-center font-bold">{item.quantity}</div>
            },
            {
                header: 'Área',
                accessorKey: 'area.name',
                render: (item) => item.area?.name || '-'
            },
            {
                header: 'Fecha a pedir',
                accessorKey: 'date',
                render: (item) => item.date ? new Date(item.date).toLocaleDateString('es-CO', { timeZone: 'UTC' }) : '-'
            },
            {
                header: 'Estado',
                accessorKey: 'status',
                render: (item) => {
                    const isPending = item.status === 'PENDIENTE';
                    return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${isPending
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                            {isPending ? 'Pendiente' : 'Entregado'}
                        </span>
                    );
                }
            },
            {
                header: 'Fecha Creación',
                accessorKey: 'createdAt',
                render: (item) => item.createdAt ? new Date(item.createdAt).toLocaleString('es-CO') : '-'
            }
        ],
        formFields: [
            {
                name: 'quantity',
                label: 'Unidades',
                type: 'number',
                placeholder: 'Ej. 10'
            },
            {
                name: 'areaId',
                label: 'Área',
                type: 'select',
                options: activeAreas.map((a: any) => ({ label: a.name, value: a.id }))
            },
            {
                name: 'date',
                label: 'Fecha a pedir',
                type: 'date'
            },
            {
                name: 'status',
                label: 'Estado',
                type: 'select',
                options: [
                    { label: 'Pendiente', value: 'PENDIENTE' },
                    { label: 'Entregado', value: 'ENTREGADO' }
                ]
            },
            {
                name: 'observations',
                label: 'Observaciones (Opcional)',
                type: 'textarea',
                placeholder: 'Ej. Observaciones adicionales para el pedido...'
            },
        ],
        formSchema: z.object({
            quantity: z.coerce.number().min(1, 'La cantidad debe ser mayor o igual a 1'),
            areaId: z.string().uuid('Por favor seleccione una área válida'),
            date: z.string().min(1, 'Por favor seleccione una fecha válida').refine(
                (val) => isDateTomorrowOrLaterColombia(val),
                { message: 'La fecha de la solicitud debe ser de mañana en adelante (Colombia timezone)' }
            ),
            status: z.enum(['PENDIENTE', 'ENTREGADO']).default('PENDIENTE'),
            observations: z.string().optional(),
        }),
        defaultValues: {
            quantity: 1,
            areaId: '',
            date: '',
            status: 'PENDIENTE',
            observations: '',
        },
    };

    if (isAreasLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center bg-white dark:bg-zinc-950">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-[3px] border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white rounded-full animate-spin" />
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Cargando aperitivos…</p>
                </div>
            </div>
        );
    }

    return <CrudPage config={appetizersConfig} />;
}
