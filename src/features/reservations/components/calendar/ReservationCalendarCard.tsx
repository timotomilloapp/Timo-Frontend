import { useMemo } from 'react';
import { format, isPast, isToday, isSameMonth } from 'date-fns';
import { MenuResponse } from '../../../menus/hooks/useMenus';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Download, Users, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReservationCalendarCardProps {
    date: Date;
    currentMonth: Date;
    menu?: MenuResponse;
    isSelected: boolean;
    onSelectChange: (date: Date, checked: boolean) => void;
    onViewReservations: (menuId: string) => void;
    onDownloadSummary: (date: string) => void;
    onViewDetails: (menu: MenuResponse) => void;
}

export function ReservationCalendarCard({
    date,
    currentMonth,
    menu,
    isSelected,
    onSelectChange,
    onViewReservations,
    onDownloadSummary,
    onViewDetails,
}: ReservationCalendarCardProps) {
    const isPastDate = isPast(date) && !isToday(date);
    const dateNumber = format(date, 'd');
    const dateStr = format(date, 'yyyy-MM-dd');
    const isCurrentMonth = isSameMonth(date, currentMonth);

    // Empty state
    if (!menu) {
        return (
            <div className={cn(
                "group relative h-full min-h-[100px] w-full p-2 flex flex-col transition-colors border border-transparent",
                isCurrentMonth ? "bg-white dark:bg-zinc-950" : "bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400 dark:text-zinc-600"
            )}>
                <span className={cn(
                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full opacity-60 flex-shrink-0"
                )}>
                    {dateNumber}
                </span>
            </div>
        );
    }

    const isServed = menu.status === 'SERVED';
    const proteinCount = menu.proteinOptions.length;
    const sideOptionCount = menu.sideOptions.length;

    return (
        <div
            onClick={() => onSelectChange(date, !isSelected)}
            className={cn(
                "group relative h-full min-h-[100px] w-full p-2 flex flex-col gap-1 transition-all duration-200 border cursor-pointer",
                isSelected ? "border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900/20 dark:ring-zinc-100/20 shadow-sm" :
                    (isCurrentMonth ? "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700" : "border-transparent opacity-60 bg-zinc-50 dark:bg-zinc-900/20 text-zinc-400"),
                (!isSelected && isCurrentMonth && isServed) ? "bg-zinc-50 dark:bg-zinc-900/10" : "bg-white dark:bg-zinc-950"
            )}>
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                    <span className={cn(
                        "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 transition-colors",
                        isToday(date) ? "bg-white text-zinc-900 ring-1 ring-zinc-200 shadow-sm leading-none" : "leading-none",
                        isSelected && !isToday(date) ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : ""
                    )}>
                        {dateNumber}
                    </span>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-7 w-7 p-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 opacity-100 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-md">
                        <DropdownMenuLabel>Acciones de Reservas</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                        <DropdownMenuItem onClick={() => onViewDetails(menu)} className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 dark:focus:text-white text-zinc-700 dark:text-zinc-200">
                            <Settings2 className="mr-2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                            <span>Ver Detalles</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewReservations(menu.id)} className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 dark:focus:text-white text-zinc-700 dark:text-zinc-200">
                            <Users className="mr-2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                            <span>Ver Reservaciones</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownloadSummary(dateStr)} className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 dark:focus:text-white text-zinc-700 dark:text-zinc-200">
                            <Download className="mr-2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                            <span>Ticket de Resumen</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex-1 mt-1">
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isPastDate) onViewReservations(menu.id);
                    }}
                    className={cn(
                        "w-full text-xs p-1.5 rounded transition-colors border flex items-center h-[34px]",
                        isPastDate ? "cursor-default opacity-80" : "cursor-pointer",
                        isServed
                            ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 dark:border-zinc-700"
                            : "bg-[#3b6154]/10 hover:bg-[#3b6154]/20 text-[#3b6154] border-[#3b6154]/20 dark:bg-[#3b6154]/20 dark:hover:bg-[#3b6154]/30 dark:text-[#528775] dark:border-[#3b6154]/30"
                    )}
                >
                    <div className="font-semibold truncate">
                        {isServed ? 'Servido' : 'Programado'}
                    </div>
                </div>
            </div>
        </div>
    );
}
