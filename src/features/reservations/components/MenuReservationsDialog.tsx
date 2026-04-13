import { useState, useMemo } from 'react';
import { useReservationsByMenu, useReservationsBulkStatus } from '../hooks/useReservations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Users, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { es } from 'date-fns/locale';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface MenuReservationsDialogProps {
    menuId: string | null;
    onClose: () => void;
}

export function MenuReservationsDialog({ menuId, onClose }: MenuReservationsDialogProps) {
    const { data: reservations, isLoading } = useReservationsByMenu(menuId || '');
    const { mutateAsync: updateBulkStatus, isPending: isUpdatingBulk } = useReservationsBulkStatus();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    type ConfirmActionType = 'served' | 'cancel' | null;
    const [confirmAction, setConfirmAction] = useState<ConfirmActionType>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredReservations = useMemo(() => {
        if (!reservations) return [];
        return reservations.filter(r =>
            r.cc.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.proteinType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.status.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [reservations, searchTerm]);

    const paginatedReservations = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredReservations.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredReservations, currentPage]);

    const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(paginatedReservations.map(r => r.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    };

    const handleBulkMarkServed = () => {
        if (selectedIds.length === 0) return;
        setConfirmAction('served');
    };

    const handleBulkCancel = () => {
        if (selectedIds.length === 0) return;
        setConfirmAction('cancel');
    };

    const executeConfirmAction = async () => {
        if (selectedIds.length === 0 || !confirmAction) return;

        try {
            if (confirmAction === 'served') {
                await updateBulkStatus({ ids: selectedIds, status: 'SERVIDA' });
            } else if (confirmAction === 'cancel') {
                await updateBulkStatus({ ids: selectedIds, status: 'CANCELADA' });
            }
            setSelectedIds([]);
        } finally {
            setConfirmAction(null);
        }
    };

    if (!menuId) return null;

    const totalConfirmed = reservations?.filter(r => r.status === 'RESERVADA' || r.status === 'SERVIDA').length || 0;
    const isAllSelected = paginatedReservations.length > 0 && selectedIds.length === paginatedReservations.length;

    return (
        <>
            <Dialog open={!!menuId} onOpenChange={(open: boolean) => !open && onClose()}>
                <DialogContent 
                    className="sm:max-w-[800px] h-[85vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-950 border-transparent dark:border-zinc-800"
                    onInteractOutside={(e) => {
                        const originalEvent = (e as any).detail?.originalEvent;
                        const target = (originalEvent?.target || e.target) as Element;
                        if (target?.closest('#sticky-batch-menu')) {
                            e.preventDefault();
                        }
                    }}
                >
                    <DialogHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Users className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
                            Listado de Reservaciones
                        </DialogTitle>
                        <div className="flex items-center justify-between mt-2">
                            <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                Total confirmadas: <strong className="text-zinc-900 dark:text-zinc-100">{totalConfirmed}</strong> de <strong className="text-zinc-900 dark:text-zinc-100">{reservations?.length || 0}</strong>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                                <Input
                                    placeholder="Buscar CC o Proteína..."
                                    className="pl-9 h-9"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-0 bg-white dark:bg-zinc-950 relative">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                <Loader2 className="h-8 w-8 animate-spin mb-4 text-zinc-500 dark:text-zinc-400" />
                                <p>Cargando reservaciones...</p>
                            </div>
                        ) : !reservations || reservations.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500 bg-white dark:bg-zinc-900 m-6 rounded-lg border border-zinc-200 dark:border-zinc-800 border-dashed">
                                No hay reservaciones registradas para este menú.
                            </div>
                        ) : (
                            <div className="w-full">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 backdrop-blur-sm">
                                        <tr>
                                            <th className="px-6 py-3 font-medium w-[50px]">
                                                <Checkbox
                                                    checked={isAllSelected}
                                                    onCheckedChange={handleSelectAll}
                                                    className="data-[state=checked]:bg-zinc-900 data-[state=checked]:border-zinc-900 dark:data-[state=checked]:bg-zinc-100 dark:data-[state=checked]:border-zinc-100 dark:data-[state=checked]:text-zinc-900"
                                                />
                                            </th>
                                            <th className="px-6 py-3 font-medium">Cédula (CC)</th>
                                            <th className="px-6 py-3 font-medium">Proteína</th>
                                            <th className="px-6 py-3 font-medium text-right">Fecha Creación</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                        {paginatedReservations.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-zinc-500">
                                                    No se encontraron resultados para "{searchTerm}"
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedReservations.map((res) => {
                                                const isSelected = selectedIds.includes(res.id);
                                                return (
                                                    <tr
                                                        key={res.id}
                                                        className={cn(
                                                            "hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors",
                                                            isSelected ? "bg-orange-50/50 dark:bg-orange-500/10" : ""
                                                        )}
                                                    >
                                                        <td className="px-6 py-3">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={(c: boolean) => handleSelectRow(res.id, c)}
                                                                className="data-[state=checked]:bg-zinc-900 data-[state=checked]:border-zinc-900 dark:data-[state=checked]:bg-zinc-100 dark:data-[state=checked]:border-zinc-100 dark:data-[state=checked]:text-zinc-900"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                                                            {res.cc}
                                                        </td>
                                                        <td className="px-6 py-3 text-zinc-600 dark:text-zinc-300">
                                                            {res.proteinType.name}
                                                        </td>
                                                        <td className="px-6 py-3 text-right text-zinc-500 dark:text-zinc-400 space-x-2">
                                                            <span>{format(new Date(res.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Footer / Pagination */}
                    <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0 flex items-center justify-between">
                        <div className="text-sm text-zinc-500">
                            Mostrando {paginatedReservations.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} a {Math.min(currentPage * itemsPerPage, filteredReservations.length)} de {filteredReservations.length} resultados
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                </DialogContent>

                {/* Sticky Action Menu for Batch Operations overlapping the modal */}
                {selectedIds.length > 0 && (
                    <div id="sticky-batch-menu" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 dark:bg-white text-zinc-50 dark:text-zinc-900 px-6 py-3 rounded-full shadow-lg border border-zinc-800 dark:border-zinc-200 flex items-center justify-between gap-6 animate-in slide-in-from-bottom flex-wrap w-max">
                        <span className="font-semibold text-sm">
                            {selectedIds.length} reserva{selectedIds.length > 1 && 's'} seleccionada{selectedIds.length > 1 && 's'}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-200 dark:border-zinc-300 dark:hover:bg-zinc-100 dark:text-zinc-800 h-8"
                                onClick={handleBulkCancel}
                                disabled={isUpdatingBulk || confirmAction !== null}
                            >
                                Cancelar Seleccionadas
                            </Button>
                            <Button
                                size="sm"
                                className="bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 h-8 border-none"
                                onClick={handleBulkMarkServed}
                                disabled={isUpdatingBulk || confirmAction !== null}
                            >
                                Marcar Servidas
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:text-white rounded-full ml-2"
                                onClick={() => setSelectedIds([])}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Dialog>

            <ConfirmationDialog
                isOpen={confirmAction !== null}
                onClose={() => setConfirmAction(null)}
                onConfirm={executeConfirmAction}
                title={confirmAction === 'served' ? "Marcar como servidas" : "Cancelar reservaciones"}
                description={`¿Estás seguro que deseas ${confirmAction === 'served' ? 'marcar como servidas' : 'cancelar'} las ${selectedIds.length} reservaciones seleccionadas?`}
                confirmText={confirmAction === 'served' ? "Sí, marcar servidas" : "Sí, cancelar"}
                cancelText="Cerrar"
                isDangerous={confirmAction === 'cancel'}
                isLoading={isUpdatingBulk}
            />
        </>
    );
}
