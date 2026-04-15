'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Ban, Check } from 'lucide-react';
import { CrudEntityConfig, TableColumn } from '../types';
import { useCrudList, useCrudCreate, useCrudUpdate, useCrudToggle, useCrudDelete } from '../hooks/useCrud';
import { CrudTable } from './CrudTable';
import { CrudFormDialog } from './CrudFormDialog';
import { CrudConfirmDialog } from './CrudConfirmDialog';

interface CrudPageProps {
    config: CrudEntityConfig;
}

const PAGE_SIZE = 10;

export function CrudPage({ config }: CrudPageProps) {
    // Pagination state
    const [page, setPage] = useState(0);

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
                await createMut.mutateAsync(formData);
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
            render: (item) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-900 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md transition-colors hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
                        title="Editar"
                    >
                        <Pencil size={14} />
                    </button>

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

                    <button
                        onClick={() => setConfirmDialog({ isOpen: true, type: 'delete', item })}
                        className="p-1.5 text-red-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Eliminar"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ),
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
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-[#3b6154] hover:bg-[#2b473e] text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
                >
                    <Plus size={16} />
                    Crear {config.singularTitle}
                </button>
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
        </div>
    );
}
