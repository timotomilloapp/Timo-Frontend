'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Ban, Check, FileText, X, Download, ChevronDown, FileSpreadsheet } from 'lucide-react';
import { CrudEntityConfig, TableColumn } from '../types';
import { useCrudList, useCrudCreate, useCrudUpdate, useCrudToggle, useCrudDelete } from '../hooks/useCrud';
import { CrudTable } from './CrudTable';
import { CrudFormDialog } from './CrudFormDialog';
import { CrudConfirmDialog } from './CrudConfirmDialog';
import { authService } from '@/services/auth-service';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface CrudPageProps {
    config: CrudEntityConfig;
}

const PAGE_SIZE = 10;

export function CrudPage({ config }: CrudPageProps) {
    const [isReadOnly, setIsReadOnly] = useState(false);
    // Pagination state
    const [page, setPage] = useState(0);

    useEffect(() => {
        async function fetchRole() {
            try {
                const profile = await authService.me();
                if (profile?.role === 'USER') {
                    setIsReadOnly(true);
                }
            } catch {
                // Ignore
            }
        }
        fetchRole();
    }, []);

    // Queries & Mutations
    const { data, isLoading } = useCrudList(config.endpoints.base, {
        skip: page * PAGE_SIZE,
        take: PAGE_SIZE,
    });
    const createMut = useCrudCreate(config.endpoints.base);
    const updateMut = useCrudUpdate(config.endpoints.base);
    const toggleMut = useCrudToggle(config.endpoints.base);
    const deleteMut = useCrudDelete(config.endpoints.base);

    // UI State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [selectedObs, setSelectedObs] = useState<string | null>(null);

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        type: 'toggle' | 'delete' | null;
        item: any | null;
    }>({ isOpen: false, type: null, item: null });

    // Handlers
    const handleOpenCreate = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (item: any) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (formData: any) => {
        try {
            if (editingItem) {
                // Update
                await updateMut.mutateAsync({ id: editingItem.id, payload: formData });
            } else {
                // Create — go back to first page so user sees the new item
                const payload = { ...formData };
                if (config.entityKey === 'appetizers') {
                    delete payload.status;
                }
                await createMut.mutateAsync(payload);
                setPage(0);
            }
            setIsFormOpen(false);
        } catch (err) {
            console.error('Error in form submit', err);
            // In a real app we might show a toast here
        }
    };

    const handleConfirmAction = async () => {
        const { type, item } = confirmDialog;
        if (!type || !item) return;

        try {
            if (type === 'toggle') {
                await toggleMut.mutateAsync(item.id);
            } else if (type === 'delete') {
                await deleteMut.mutateAsync(item.id);
            }
            setConfirmDialog({ isOpen: false, type: null, item: null });
        } catch (err: any) {
            console.error('Error in confirm action', err);
        }
    };

    // Extend table columns with an Action column
    const tableColumns: TableColumn<any>[] = [
        ...config.columns,
        {
            header: 'Acciones',
            accessorKey: 'actions',
            render: (item) => {
                const allowedToEdit = config.canEdit ? config.canEdit(item) : true;
                const allowedToDelete = config.canDelete ? config.canDelete(item) : true;
                return (
                    <div className="flex items-center justify-center gap-2">
                        {config.customActions?.(item)}
                        {item.observations !== undefined && (
                            <button
                                onClick={() => {
                                    if (item.observations && item.observations.trim() !== '') {
                                        setSelectedObs(item.observations);
                                    }
                                }}
                                disabled={!item.observations || item.observations.trim() === ''}
                                className={`p-1.5 border rounded-md transition-colors ${
                                    item.observations && item.observations.trim() !== ''
                                        ? 'text-zinc-500 hover:text-zinc-900 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 cursor-pointer'
                                        : 'text-zinc-300 dark:text-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/30 cursor-not-allowed opacity-40'
                                }`}
                                title={item.observations && item.observations.trim() !== '' ? "Ver observaciones" : "Sin observaciones"}
                            >
                                <FileText size={14} />
                            </button>
                        )}
                        {!isReadOnly && (
                            <>
                                <button
                                    onClick={() => allowedToEdit && handleOpenEdit(item)}
                                    disabled={!allowedToEdit}
                                    className={`p-1.5 border rounded-md transition-colors ${
                                        allowedToEdit
                                            ? 'text-zinc-500 hover:text-zinc-900 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
                                            : 'text-zinc-300 dark:text-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800/30 cursor-not-allowed opacity-50'
                                    }`}
                                    title={allowedToEdit ? "Editar" : "No se puede editar"}
                                >
                                    <Pencil size={14} />
                                </button>

                                {config.hasToggle !== false && (
                                    <button
                                        onClick={() => setConfirmDialog({ isOpen: true, type: 'toggle', item })}
                                        className={`p-1.5 border rounded-md transition-colors ${item.isActive
                                            ? 'text-orange-500 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                            : 'text-green-500 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-green-50 dark:hover:bg-green-900/20'
                                            }`}
                                        title={item.isActive ? "Desactivar" : "Activar"}
                                    >
                                        {item.isActive ? <Ban size={14} /> : <Check size={14} />}
                                    </button>
                                )}

                                <button
                                    onClick={() => allowedToDelete && setConfirmDialog({ isOpen: true, type: 'delete', item })}
                                    disabled={!allowedToDelete}
                                    className={`p-1.5 border rounded-md transition-colors ${
                                        allowedToDelete
                                            ? 'text-red-500 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/20'
                                            : 'text-red-300 dark:text-red-900/30 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800/30 cursor-not-allowed opacity-50'
                                    }`}
                                    title={allowedToDelete ? "Eliminar" : "No se puede eliminar"}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
                        {config.title}
                    </h1>
                    <p className="text-sm text-[#3b6154] dark:text-[#528775] mt-1 font-medium">
                        Gestiona los registros de {config.title.toLowerCase()} en el sistema.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {config.onExport && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-bold shadow-sm transition-colors"
                                >
                                    <Download size={16} />
                                    Exportar
                                    <ChevronDown size={14} className="opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-md">
                                <DropdownMenuItem onClick={() => config.onExport?.('xlsx')} className="cursor-pointer gap-2 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-zinc-700 dark:text-zinc-200 dark:focus:text-white">
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                    <span>Exportar a Excel</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => config.onExport?.('csv')} className="cursor-pointer gap-2 focus:bg-zinc-100 dark:focus:bg-zinc-800 text-zinc-700 dark:text-zinc-200 dark:focus:text-white">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    <span>Exportar a CSV</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {!isReadOnly && (
                        <button
                            onClick={handleOpenCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-[#3b6154] hover:bg-[#2b473e] text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
                        >
                            <Plus size={16} />
                            Crear {config.singularTitle}
                        </button>
                    )}
                </div>
            </div>

            <CrudTable
                data={data || []}
                columns={tableColumns}
                isLoading={isLoading}
                pagination={{
                    page,
                    pageSize: PAGE_SIZE,
                    onPageChange: setPage,
                    hasMore: (data?.length ?? 0) >= PAGE_SIZE,
                }}
            />

            <CrudFormDialog
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
                config={config}
                initialData={editingItem}
                isLoading={createMut.isPending || updateMut.isPending}
            />

            <CrudConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, type: null, item: null })}
                onConfirm={handleConfirmAction}
                title={confirmDialog.type === 'toggle' ? (confirmDialog.item?.isActive ? `Desactivar ${config.singularTitle}` : `Activar ${config.singularTitle}`) : `Eliminar ${config.singularTitle}`}
                description={
                    confirmDialog.type === 'toggle'
                        ? (confirmDialog.item?.isActive ? `¿Estás seguro de que deseas desactivar este registro? No podrá ser usado hasta que se reactive.` : `¿Estás seguro de que deseas activar este registro y permitir su uso nuevamente?`)
                        : `¿Estás seguro de que deseas ELIMINAR permanentemente este registro? Esta acción no se puede deshacer.`
                }
                confirmText={confirmDialog.type === 'toggle' ? (confirmDialog.item?.isActive ? 'Desactivar' : 'Activar') : 'Eliminar'}
                isLoading={toggleMut.isPending || deleteMut.isPending}
                isDestructive={true}
            />

            {/* Observations Card Modal */}
            {selectedObs !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <FileText size={18} className="text-[#3b6154]" />
                                Observaciones
                            </h3>
                            <button 
                                onClick={() => setSelectedObs(null)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800/50 max-h-60 overflow-y-auto whitespace-pre-wrap text-left">
                            {selectedObs || "Sin observaciones"}
                        </div>
                        <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                            <button
                                onClick={() => setSelectedObs(null)}
                                className="px-4 py-2 text-sm font-bold text-white bg-[#3b6154] hover:bg-[#2b473e] rounded-lg transition-colors shadow-sm"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
