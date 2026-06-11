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
import { RotateCcw, X, Eye, Plus, Trash2 } from 'lucide-react';

interface Slot {
    areaId: string;
    quantity: number;
}

interface AppetizerFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    isLoading?: boolean;
    activeAreas: any[];
}

function AppetizerFormDialog({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
    activeAreas
}: AppetizerFormDialogProps) {
    const [date, setDate] = React.useState('');
    const [observations, setObservations] = React.useState('');
    const [status, setStatus] = React.useState('PENDIENTE');
    const [slots, setSlots] = React.useState<Slot[]>([{ areaId: '', quantity: 1 }]);
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        if (isOpen) {
            setErrors({});
            if (initialData) {
                let formattedDate = '';
                if (initialData.date) {
                    try {
                        const d = new Date(initialData.date);
                        if (!isNaN(d.getTime())) {
                            const yyyy = d.getUTCFullYear();
                            const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
                            const dd = String(d.getUTCDate()).padStart(2, '0');
                            formattedDate = `${yyyy}-${mm}-${dd}`;
                        }
                    } catch (e) {
                        formattedDate = initialData.date.split('T')[0];
                    }
                }
                setDate(formattedDate);
                setObservations(initialData.observations || '');
                setStatus(initialData.status || 'PENDIENTE');

                if (initialData.details && initialData.details.length > 0) {
                    setSlots(initialData.details.map((d: any) => ({
                        areaId: d.areaId,
                        quantity: d.quantity
                    })));
                } else {
                    setSlots([{ areaId: '', quantity: 1 }]);
                }
            } else {
                setDate('');
                setObservations('');
                setStatus('PENDIENTE');
                setSlots([{ areaId: '', quantity: 1 }]);
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleAddSlot = () => {
        setSlots(prev => [...prev, { areaId: '', quantity: 1 }]);
    };

    const handleRemoveSlot = (index: number) => {
        setSlots(prev => prev.filter((_, i) => i !== index));
    };

    const handleSlotChange = (index: number, field: keyof Slot, value: any) => {
        setSlots(prev => prev.map((s, i) => {
            if (i === index) {
                return { ...s, [field]: value };
            }
            return s;
        }));
        if (errors.details) {
            setErrors(prev => ({ ...prev, details: '' }));
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!date) {
            newErrors.date = 'La fecha es requerida';
        }

        // Process slots: filter out empty or <= 0, sum duplicate area IDs
        const summaryMap: Record<string, number> = {};
        slots.forEach(s => {
            if (s.areaId && s.quantity > 0) {
                summaryMap[s.areaId] = (summaryMap[s.areaId] || 0) + s.quantity;
            }
        });

        const details = Object.entries(summaryMap).map(([areaId, quantity]) => ({
            areaId,
            quantity
        }));

        if (details.length === 0) {
            newErrors.details = 'Debe ingresar al menos un área con cantidad mayor a 0.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        await onSubmit({
            date,
            observations,
            status,
            details
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 my-8">
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                        {initialData ? 'Editar' : 'Crear'} Refrigerio
                    </h2>
                    {!isLoading && (
                        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                    {/* Date Field */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-left block">
                            Fecha a pedir
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => {
                                setDate(e.target.value);
                                if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                            }}
                            className={`w-full px-3 py-2 bg-white dark:bg-zinc-950 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors ${
                                errors.date ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                            }`}
                            disabled={isLoading}
                        />
                        {errors.date && <span className="text-xs text-red-500 text-left block">{errors.date}</span>}
                    </div>

                    {/* Status Field (only when editing) */}
                    {initialData && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-left block">
                                Estado
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors"
                                disabled={isLoading}
                            >
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="ENTREGADO">Entregado</option>
                            </select>
                        </div>
                    )}

                    {/* Dynamic Slots Section */}
                    <div className="space-y-3">
                        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2">
                            <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200 text-left block">
                                Áreas y Cantidades
                            </label>
                        </div>

                        {errors.details && (
                            <div className="text-xs text-red-500 font-semibold text-left">
                                {errors.details}
                            </div>
                        )}

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {slots.map((slot, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <select
                                                value={slot.areaId}
                                                onChange={(e) => handleSlotChange(index, 'areaId', e.target.value)}
                                                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#3b6154]"
                                                disabled={isLoading}
                                            >
                                                <option value="" disabled>Seleccionar área</option>
                                                {activeAreas.map((a: any) => (
                                                    <option key={a.id} value={a.id}>{a.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-20">
                                            <input
                                                type="number"
                                                value={slot.quantity}
                                                placeholder="Cant."
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    handleSlotChange(index, 'quantity', val === '' ? '' : Math.max(0, parseInt(val, 10)));
                                                }}
                                                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#3b6154] text-center"
                                                disabled={isLoading}
                                                min="0"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSlot(index)}
                                            disabled={isLoading || slots.length === 1}
                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-40"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    
                                    {/* WordPress-style Centered Add Button only below the LAST row */}
                                    {index === slots.length - 1 && (
                                        <div className="relative flex items-center justify-center py-2 mt-1">
                                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                <div className="w-full border-t border-dashed border-[#3b6154]/40"></div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddSlot}
                                                disabled={isLoading}
                                                className="relative z-10 flex items-center justify-center w-5 h-5 bg-[#3b6154] hover:bg-[#2b473e] text-white rounded-full shadow-sm transition-all hover:scale-110 focus:outline-none cursor-pointer"
                                                title="Agregar área"
                                            >
                                                <Plus size={10} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Observations Field */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-left block">
                            Observaciones (Opcional)
                        </label>
                        <textarea
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            placeholder="Ej. Observaciones adicionales para el pedido..."
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors h-16 resize-none"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Form Actions */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 mt-4 font-bold">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-bold text-white bg-[#3b6154] rounded-lg hover:bg-[#2b473e] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {initialData ? 'Guardar Cambios' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
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
    
    // Details Modal State
    const [detailsAppetizerId, setDetailsAppetizerId] = React.useState<string | null>(null);
    const [detailsAppetizerDate, setDetailsAppetizerDate] = React.useState<string>('');

    const { data: detailsData, isLoading: isDetailsLoading } = useQuery({
        queryKey: ['/appetizers', detailsAppetizerId, 'details'],
        queryFn: async () => {
            if (!detailsAppetizerId) return null;
            const { data } = await apiClient.get<any[]>(`/appetizers/${detailsAppetizerId}/details`);
            return data;
        },
        enabled: !!detailsAppetizerId
    });

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

    // 3. Build the config reactively
    const appetizersConfig: CrudEntityConfig = {
        entityKey: 'appetizers',
        title: 'Refrigerios',
        singularTitle: 'Refrigerio',
        endpoints: {
            base: '/appetizers',
        },
        hasToggle: false, // Hide toggle since Appetizer has no isActive field
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
            return (
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => {
                            setDetailsAppetizerId(item.id);
                            if (item.date) {
                                setDetailsAppetizerDate(new Date(item.date).toLocaleDateString('es-CO', { timeZone: 'UTC' }));
                            } else {
                                setDetailsAppetizerDate('-');
                            }
                        }}
                        className="p-1.5 text-emerald-500 hover:text-emerald-700 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center justify-center cursor-pointer"
                        title="Ver detalles"
                    >
                        <Eye size={14} />
                    </button>
                    {!isReadOnly && (
                        <button
                            onClick={() => handleToggleStatus(item)}
                            disabled={isUpdatingStatus}
                            className="p-1.5 text-blue-500 hover:text-blue-700 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 flex items-center justify-center cursor-pointer"
                            title="Actualizar estado"
                        >
                            <RotateCcw size={14} className={isUpdatingStatus ? "animate-spin" : ""} />
                        </button>
                    )}
                </div>
            );
        },
        columns: [
            {
                header: 'Unidades',
                accessorKey: 'quantity',
                align: 'left',
                render: (item) => <div className="w-16 text-center font-bold text-zinc-900 dark:text-white">{item.quantity}</div>
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
        formFields: [], // Not used because we override with customForm
        formSchema: z.any(), // Not used because we override with customForm
        defaultValues: {}, // Not used because we override with customForm
        customForm: ({ isOpen, onClose, onSubmit, initialData, isLoading }) => (
            <AppetizerFormDialog
                isOpen={isOpen}
                onClose={onClose}
                onSubmit={onSubmit}
                initialData={initialData}
                isLoading={isLoading}
                activeAreas={activeAreas}
            />
        )
    };

    if (isAreasLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center bg-white dark:bg-zinc-950">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-[3px] border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white rounded-full animate-spin" />
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Cargando refrigerios…</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <CrudPage config={appetizersConfig} />

            {/* Details Modal */}
            {detailsAppetizerId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Eye size={18} className="text-[#3b6154]" />
                                    Detalles de Refrigerios
                                </h3>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium text-left mt-0.5">
                                    Reserva para el {detailsAppetizerDate}
                                </p>
                            </div>
                            <button 
                                onClick={() => setDetailsAppetizerId(null)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {isDetailsLoading ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                                <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-800 dark:border-zinc-700 dark:border-t-white rounded-full animate-spin" />
                                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Cargando detalles...</span>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {detailsData && detailsData.length > 0 ? (
                                    detailsData.map((d: any) => (
                                        <div key={d.id} className="flex justify-between items-center py-2 px-3 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-800/40 rounded-lg">
                                            <span className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">{d.area?.name || 'Área desconocida'}</span>
                                            <span className="px-2.5 py-0.5 bg-[#3b6154]/10 dark:bg-[#3b6154]/20 rounded-md text-xs font-bold text-[#3b6154] dark:text-[#528775]">{d.quantity} {d.quantity === 1 ? 'unidad' : 'unidades'}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-zinc-400 text-center py-4 text-xs font-medium">No hay detalles registrados.</div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-800 font-bold mt-2">
                            <span className="text-xs text-zinc-800 dark:text-zinc-200">Total a Pedir</span>
                            <span className="text-sm text-[#3b6154] dark:text-[#528775] bg-[#3b6154]/5 dark:bg-[#3b6154]/10 px-3 py-1 rounded-md border border-[#3b6154]/20">
                                {detailsData?.reduce((sum: number, d: any) => sum + d.quantity, 0) || 0} unidades
                            </span>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-2 font-bold">
                            <button
                                onClick={() => setDetailsAppetizerId(null)}
                                className="px-4 py-2 text-sm font-bold text-white bg-[#3b6154] hover:bg-[#2b473e] rounded-lg transition-colors shadow-sm"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
