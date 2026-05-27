'use client';

import React, { useState } from 'react';
import { useWhitelistList, useWhitelistToggle, useWhitelistDelete, useWhitelistUpdate, useWhitelistBulkCreate, useWhitelistCreate, WhitelistEntry } from '../hooks/useWhitelist';
import { CrudTable } from '@/features/admin-crud/components/CrudTable';
import { CrudConfirmDialog } from '@/features/admin-crud/components/CrudConfirmDialog';
import { TableColumn } from '@/features/admin-crud/types';
import { Edit, FileUp, Search, Trash2, Power, Plus } from 'lucide-react';
import { WhitelistBulkDialog } from './WhitelistBulkDialog';
import { WhitelistEditDialog } from './WhitelistEditDialog';
import { WhitelistCreateDialog } from './WhitelistCreateDialog';
import { WhitelistCompleteDataDialog } from './WhitelistCompleteDataDialog';
import { WhitelistInfoDialog } from './WhitelistInfoDialog';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Eye } from 'lucide-react';
import { apiClient } from '@/services/api-client';

export function WhitelistPage() {
    const [page, setPage] = useState(0);
    const take = 8;
    const skip = page * take;
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const { data: listResponse, isLoading, isFetching } = useWhitelistList(skip, take, debouncedSearch);
    const { data: areas } = useQuery({
        queryKey: ['/areas', 'active-all'],
        queryFn: async () => {
            const { data } = await apiClient.get<any[]>('/areas/active/all');
            return data;
        }
    });

    const toggleMut = useWhitelistToggle();
    const deleteMut = useWhitelistDelete();
    const updateMut = useWhitelistUpdate();
    const bulkMut = useWhitelistBulkCreate();
    const createMut = useWhitelistCreate();

    // Dialogs state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', description: '', onConfirm: () => { } });

    const [editDialog, setEditDialog] = useState<{ isOpen: boolean; entry: WhitelistEntry | null }>({ isOpen: false, entry: null });
    const [infoDialog, setInfoDialog] = useState<{ isOpen: boolean; entry: WhitelistEntry | null }>({ isOpen: false, entry: null });
    const [completeDataDialog, setCompleteDataDialog] = useState<{ isOpen: boolean; entry: WhitelistEntry | null }>({ isOpen: false, entry: null });
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    // Search debounce
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(0); // Reset page on new search
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const columns: TableColumn<WhitelistEntry>[] = [
        {
            accessorKey: 'cc',
            header: 'Cédula (CC)'
        },
        {
            accessorKey: 'name',
            header: 'Nombre',
            render: (row) => (
                <div className="max-w-[120px] sm:max-w-[180px] md:max-w-[250px] truncate" title={row.name}>
                    {row.name}
                </div>
            )
        },
        {
            accessorKey: 'enabled',
            header: 'Estado',
            render: (row) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${row.enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {row.enabled ? 'ACTIVO' : 'INACTIVO'}
                </span>
            )
        },
        {
            accessorKey: 'createdAt',
            header: 'Fecha Registro',
            render: (row) => new Date(row.createdAt).toLocaleDateString('es-CO')
        },
        {
            accessorKey: 'actions',
            header: '',
            render: (row) => (
                <div className="flex items-center gap-1 justify-end">
                    <button
                        onClick={() => setInfoDialog({ isOpen: true, entry: row })}
                        title="Ver Información"
                        className="p-2 text-zinc-500 hover:text-zinc-900 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md transition-colors hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={() => toggleMut.mutate(row.id)}
                        disabled={toggleMut.isPending}
                        title={row.enabled ? "Desactivar" : "Activar"}
                        className={`p-2 rounded-lg transition-colors ${row.enabled ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'} disabled:opacity-50`}
                    >
                        <Power size={16} />
                    </button>
                    <button
                        onClick={() => setEditDialog({ isOpen: true, entry: row })}
                        title="Editar"
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => {
                            setConfirmDialog({
                                isOpen: true,
                                title: 'Eliminar Empleado',
                                description: `¿Estás seguro de eliminar a ${row.name}? Esta acción no se puede deshacer.`,
                                onConfirm: async () => {
                                    await deleteMut.mutateAsync(row.id);
                                    setConfirmDialog(p => ({ ...p, isOpen: false }));
                                }
                            });
                        }}
                        title="Eliminar"
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Empleados</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gestiona la whitelist de usuarios autorizados</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCreateDialogOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Nuevo Empleado</span>
                    </button>
                    <button
                        onClick={() => setBulkDialogOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                    >
                        <FileUp size={16} />
                        <span className="hidden sm:inline">Carga Masiva</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                        type="search"
                        placeholder="Buscar por cédula o nombre..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                </div>
                {(isLoading || isFetching) && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
            </div>

            <CrudTable
                data={listResponse?.data || []}
                columns={columns}
                isLoading={isLoading}
                pagination={{
                    page,
                    pageSize: take,
                    onPageChange: setPage,
                    hasMore: listResponse && listResponse.data ? listResponse.data.length === take : false,
                    totalElements: listResponse?.total
                }}
            />

            <CrudConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                description={confirmDialog.description}
                onConfirm={confirmDialog.onConfirm}
                onClose={() => setConfirmDialog(p => ({ ...p, isOpen: false }))}
                isLoading={deleteMut.isPending}
            />

            <WhitelistEditDialog
                isOpen={editDialog.isOpen}
                entry={editDialog.entry}
                areas={areas || []}
                onClose={() => setEditDialog({ isOpen: false, entry: null })}
                onSave={async (payload) => {
                    if (editDialog.entry) {
                        await updateMut.mutateAsync({ id: editDialog.entry.id, data: payload });
                    }
                }}
                isLoading={updateMut.isPending}
            />

            <WhitelistInfoDialog
                isOpen={infoDialog.isOpen}
                entry={infoDialog.entry}
                onClose={() => setInfoDialog({ isOpen: false, entry: null })}
                onOpenCompleteData={() => setCompleteDataDialog({ isOpen: true, entry: infoDialog.entry })}
            />

            <WhitelistCompleteDataDialog
                isOpen={completeDataDialog.isOpen}
                entry={completeDataDialog.entry}
                areas={areas || []}
                onClose={() => setCompleteDataDialog({ isOpen: false, entry: null })}
                onSave={async (payload) => {
                    if (completeDataDialog.entry) {
                        await updateMut.mutateAsync({ id: completeDataDialog.entry.id, data: payload });
                    }
                }}
                isLoading={updateMut.isPending}
            />

            <WhitelistBulkDialog
                isOpen={bulkDialogOpen}
                onClose={() => setBulkDialogOpen(false)}
                onUpload={async (file) => {
                    return await bulkMut.mutateAsync(file);
                }}
                isLoading={bulkMut.isPending}
            />

            <WhitelistCreateDialog
                isOpen={createDialogOpen}
                areas={areas || []}
                onClose={() => setCreateDialogOpen(false)}
                onSave={async (payload) => {
                    await createMut.mutateAsync(payload);
                }}
                isLoading={createMut.isPending}
            />
        </div>
    );
}
