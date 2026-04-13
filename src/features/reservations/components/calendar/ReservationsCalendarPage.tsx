'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useMenusByDateRange, MenuResponse } from '../../../menus/hooks/useMenus';
import { useMonthCalendar } from '../../../menus/hooks/useMonthCalendar';
import { MonthCalendarHeader } from '../../../menus/components/calendar/MonthCalendarHeader';
import { ReservationCalendarCard } from './ReservationCalendarCard';
import { ProteinSummaryTicketModal } from '../ProteinSummaryTicketModal';
import { MenuReservationsDialog } from '../MenuReservationsDialog';
import { MenuDetailsDialog } from '../../../menus/components/MenuDetailsDialog';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReservationsBulkServed, useReservationsBulkCancelled } from '../../hooks/useReservations';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

export function ReservationsCalendarPage() {
    const calendar = useMonthCalendar();
    const { startDateStr, endDateStr, monthDays, currentMonth } = calendar;

    const { data: menus, isLoading } = useMenusByDateRange(startDateStr, endDateStr);

    const { mutateAsync: bulkServed, isPending: isServingBulk } = useReservationsBulkServed();
    const { mutateAsync: bulkCancelled, isPending: isCancellingBulk } = useReservationsBulkCancelled();

    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [viewReservationsMenuId, setViewReservationsMenuId] = useState<string | null>(null);
    const [downloadSummaryDate, setDownloadSummaryDate] = useState<string | null>(null);
    const [viewDetailsMenu, setViewDetailsMenu] = useState<MenuResponse | null>(null);

    type ConfirmActionType = 'served' | 'cancel' | null;
    const [confirmAction, setConfirmAction] = useState<ConfirmActionType>(null);

    const stickyMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (selectedDates.length === 0) return;
            const target = e.target as HTMLElement;
            // Ignorar clicks en modales/dialogs o tooltips para no interferir
            if (target.closest('[role="dialog"]') || target.closest('[role="menu"]')) return;
            // Ignorar clicks en botones o dentro de las tarjetas del calendario
            if (target.closest('button') || target.closest('.group.relative.h-full')) return;

            // Si el click es en el fondo de la página, deseleccionamos todo
            if (stickyMenuRef.current && !stickyMenuRef.current.contains(target)) {
                setSelectedDates([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedDates.length]);

    // Mapear menús por fecha para acceso O(1)
    const menusByDate = (menus || []).reduce((acc, menu) => {
        // Asumiendo que menu.date viene como ISO string, extraemos sólo YYYY-MM-DD
        const dateKey = menu.date.split('T')[0];
        acc[dateKey] = menu;
        return acc;
    }, {} as Record<string, any>);

    const handleSelectChange = (date: Date, checked: boolean) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        setSelectedDates((prev) =>
            checked ? [...prev, dateStr] : prev.filter((d) => d !== dateStr)
        );
    };

    const handleViewReservations = (menuId: string) => {
        setViewReservationsMenuId(menuId);
    };

    const handleDownloadSummary = (dateStr: string) => {
        setDownloadSummaryDate(dateStr);
    };

    const handleBulkMarkServed = () => {
        if (selectedDates.length === 0) return;
        setConfirmAction('served');
    };

    const handleBulkCancel = () => {
        if (selectedDates.length === 0) return;
        setConfirmAction('cancel');
    };

    const executeConfirmAction = async () => {
        if (selectedDates.length === 0 || !confirmAction) return;

        try {
            if (confirmAction === 'served') {
                await Promise.all(selectedDates.map(date => bulkServed(date)));
            } else if (confirmAction === 'cancel') {
                await Promise.all(selectedDates.map(date => bulkCancelled(date)));
            }
            setSelectedDates([]);
        } finally {
            setConfirmAction(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950/50 p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
            <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="min-w-[800px] flex flex-col h-full">
                    <MonthCalendarHeader
                        title="Reservaciones"
                        monthName={calendar.monthName}
                        onNextMonth={calendar.handleNextMonth}
                        onPrevMonth={calendar.handlePrevMonth}
                        onToday={calendar.handleToday}
                    />

                    <div className="flex-1 w-full relative min-h-[500px]">
                        {isLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-950/50 rounded-lg">
                                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-7 gap-px rounded-lg h-full">
                                {monthDays.map((date, i) => {
                                    const dateStr = format(date, 'yyyy-MM-dd');
                                    const menu = menusByDate[dateStr];
                                    const isSelected = selectedDates.includes(dateStr);

                                    return (
                                        <div key={i} className="bg-zinc-100 dark:bg-zinc-800/50 min-h-[120px]">
                                            <ReservationCalendarCard
                                                date={date}
                                                currentMonth={currentMonth}
                                                menu={menu}
                                                isSelected={isSelected}
                                                onSelectChange={handleSelectChange}
                                                onViewReservations={handleViewReservations}
                                                onDownloadSummary={handleDownloadSummary}
                                                onViewDetails={(menu) => setViewDetailsMenu(menu)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Action Menu for Batch Operations */}
            {selectedDates.length > 0 && (
                <div
                    ref={stickyMenuRef}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 px-6 py-3 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-6 animate-in slide-in-from-bottom flex-wrap"
                >
                    <span className="font-semibold text-sm">
                        {selectedDates.length} d{selectedDates.length > 1 ? 'ías' : 'ía'} seleccionado{selectedDates.length > 1 && 's'}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 h-8"
                            onClick={handleBulkCancel}
                            disabled={isCancellingBulk || isServingBulk || confirmAction !== null}
                        >
                            Cancelar
                        </Button>
                        <Button
                            size="sm"
                            className="bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 h-8 border-none"
                            onClick={handleBulkMarkServed}
                            disabled={isCancellingBulk || isServingBulk || confirmAction !== null}
                        >
                            Marcar Servidas
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-full ml-2"
                            onClick={() => setSelectedDates([])}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <MenuReservationsDialog
                menuId={viewReservationsMenuId}
                onClose={() => setViewReservationsMenuId(null)}
            />

            <ProteinSummaryTicketModal
                date={downloadSummaryDate}
                onClose={() => setDownloadSummaryDate(null)}
            />

            <MenuDetailsDialog
                menu={viewDetailsMenu}
                onClose={() => setViewDetailsMenu(null)}
            />

            <ConfirmationDialog
                isOpen={confirmAction !== null}
                onClose={() => setConfirmAction(null)}
                onConfirm={executeConfirmAction}
                title={confirmAction === 'served' ? "Marcar como servidas" : "Cancelar reservaciones en bloque"}
                description={`¿Estás seguro que deseas ${confirmAction === 'served' ? 'marcar como servidas' : 'cancelar'} todas las reservaciones en los ${selectedDates.length} días seleccionados?`}
                confirmText={confirmAction === 'served' ? "Sí, marcar servidas" : "Sí, cancelar"}
                cancelText="Cerrar"
                isDangerous={confirmAction === 'cancel'}
                isLoading={isCancellingBulk || isServingBulk}
            />
        </div>
    );
}
