'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useMenusByDateRange, useMenuStatus } from '../../hooks/useMenus';
import { useMonthCalendar } from '../../hooks/useMonthCalendar';
import { MonthCalendarHeader } from './MonthCalendarHeader';
import { MenuCalendarCard } from './MenuCalendarCard';
import { MenuCreateDialog } from '../MenuCreateDialog';
import { MenuDetailsDialog } from '../MenuDetailsDialog';
import { Loader2 } from 'lucide-react';
import { MenuResponse, useMenuDelete, useMenuClone } from '../../hooks/useMenus';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function MenusCalendarPage() {
    const calendar = useMonthCalendar();
    const { startDateStr, endDateStr, monthDays, currentMonth } = calendar;

    const { data: menus, isLoading } = useMenusByDateRange(startDateStr, endDateStr);
    const { mutate: updateStatus } = useMenuStatus();
    const { mutateAsync: deleteMenuFn, isPending: isDeleting } = useMenuDelete();
    const { mutateAsync: cloneMenuFn, isPending: isCloning } = useMenuClone();

    const [creationDate, setCreationDate] = useState<Date | null>(null);
    const [viewDetailsMenu, setViewDetailsMenu] = useState<MenuResponse | null>(null);
    const [menuToEdit, setMenuToEdit] = useState<MenuResponse | null>(null);

    // Action dialog states
    const [menuToDelete, setMenuToDelete] = useState<MenuResponse | null>(null);
    const [menuToClone, setMenuToClone] = useState<MenuResponse | null>(null);
    const [cloneTargetDate, setCloneTargetDate] = useState<string>('');
    const [cloneError, setCloneError] = useState<string>('');

    const isNonServiceDate = (value: Date | string) => {
        const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
        const weekDay = date.getDay();
        return weekDay === 0 || weekDay === 6;
    };

    // Mapear menús por fecha para acceso O(1)
    const menusByDate = (menus || []).reduce((acc, menu) => {
        // Asumiendo que menu.date viene como ISO string, extraemos sólo YYYY-MM-DD
        const dateKey = menu.date.split('T')[0];
        acc[dateKey] = menu;
        return acc;
    }, {} as Record<string, any>);

    const handleCreateClick = (date: Date) => {
        if (isNonServiceDate(date)) return;
        setCreationDate(date);
    };

    const handleStartCreateClose = () => {
        setCreationDate(null);
        setMenuToEdit(null);
        setCloneError('');
    };

    const handleChangeStatus = (menuId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'SERVED' ? 'SCHEDULED' : 'SERVED';
        updateStatus({ id: menuId, status: newStatus });
    };

    const handleDeleteConfirm = async () => {
        if (!menuToDelete) return;
        try {
            await deleteMenuFn(menuToDelete.id);
            setMenuToDelete(null);
        } catch (e: any) {
            // Avoid logging full error objects to console to prevent Next.js dev overlay
            console.warn("Delete menu failed:", e?.response?.data?.message || e.message);
        }
    };

    const handleCloneConfirm = async () => {
        if (!menuToClone || !cloneTargetDate) return;
        if (isNonServiceDate(cloneTargetDate)) {
            setCloneError('Sabados y domingos no estan disponibles para crear menus.');
            return;
        }
        setCloneError('');
        try {
            await cloneMenuFn({ id: menuToClone.id, date: cloneTargetDate });
            setMenuToClone(null);
            setCloneTargetDate('');
        } catch (e: any) {
            // We only log the message, not the full Axios error, to avoid Next.js dev overlay catching it
            console.warn("Clone menu failed:", e?.response?.data?.message || e.message);
            setCloneError(e.response?.data?.message || e.message || "Error al clonar el menú. Revisa la fecha seleccionada.");
        }
    };

    const handleEditMenu = (menu: MenuResponse) => {
        setMenuToEdit(menu);
    };

    return (
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950/50 p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
            <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="min-w-[800px] flex flex-col h-full">
                    <MonthCalendarHeader
                        title="Menús"
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
                                    return (
                                        <div key={i} className="bg-zinc-100 dark:bg-zinc-800/50 min-h-[120px]">
                                            <MenuCalendarCard
                                                date={date}
                                                currentMonth={currentMonth}
                                                menu={menu}
                                                onCreateClick={handleCreateClick}
                                                onChangeStatus={handleChangeStatus}
                                                onViewDetails={(menu) => setViewDetailsMenu(menu)}
                                                onEditMenu={handleEditMenu}
                                                onDeleteMenu={(menu) => setMenuToDelete(menu)}
                                                onCloneMenu={(menu) => setMenuToClone(menu)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {(creationDate || menuToEdit) && (
                <MenuCreateDialog
                    trigger={null}
                    forceOpen={!!creationDate || !!menuToEdit}
                    onOpenChange={handleStartCreateClose}
                    defaultDate={creationDate || undefined}
                    editMenu={menuToEdit || undefined}
                />
            )}

            <MenuDetailsDialog
                menu={viewDetailsMenu}
                onClose={() => setViewDetailsMenu(null)}
            />

            {/* Modal para Eliminar */}
            <AlertDialog open={!!menuToDelete} onOpenChange={(open: boolean) => !open && setMenuToDelete(null)}>
                <AlertDialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar Menú?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de eliminar el menú del día <strong>{menuToDelete?.date.slice(0, 10)}</strong>.
                            Esta acción no se puede deshacer. Se perderán las reservaciones asociadas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting} className="bg-transparent border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-red-500 hover:bg-red-600 text-white">
                            {isDeleting ? 'Eliminando...' : 'Eliminar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal para Clonar */}
            <Dialog open={!!menuToClone} onOpenChange={(open: boolean) => {
                if (!open) {
                    setMenuToClone(null);
                    setCloneError('');
                }
            }}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                    <DialogHeader>
                        <DialogTitle>Clonar Menú</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Fecha de destino
                            </label>
                            <Input
                                type="date"
                                className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 dark:[color-scheme:dark]"
                                value={cloneTargetDate}
                                onChange={(e) => {
                                    const nextDate = e.target.value;
                                    setCloneTargetDate(nextDate);
                                    if (nextDate && isNonServiceDate(nextDate)) {
                                        setCloneError('Sabados y domingos no estan disponibles para crear menus.');
                                    } else if (cloneError === 'Sabados y domingos no estan disponibles para crear menus.') {
                                        setCloneError('');
                                    }
                                }}
                            />
                            <p className="text-xs text-zinc-500">
                                Las proteínas, acompañantes, sopa y jugo se copiarán a este nuevo día.
                            </p>
                            {cloneError && (
                                <div className="mt-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 p-2 rounded border border-red-200 dark:border-red-900">
                                    {cloneError === "Cannot clone a menu to a past date (Colombia timezone)"
                                        ? "No se puede clonar a una fecha pasada."
                                        : cloneError}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setMenuToClone(null); setCloneError(''); }} disabled={isCloning} className="bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                            Cancelar
                        </Button>
                        <Button onClick={handleCloneConfirm} disabled={!cloneTargetDate || isCloning || isNonServiceDate(cloneTargetDate)} className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 border-none px-6">
                            {isCloning ? 'Clonando...' : 'Confirmar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
