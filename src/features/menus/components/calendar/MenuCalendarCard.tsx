import { format, isPast, isToday, isSameMonth } from 'date-fns';
import { MenuResponse } from '../../hooks/useMenus';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Lock, Unlock, Settings2, Pencil, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MenuCalendarCardProps {
    date: Date;
    currentMonth: Date;
    menu?: MenuResponse;
    onCreateClick: (date: Date) => void;
    onChangeStatus: (menuId: string, currentStatus: string) => void;
    onViewDetails: (menu: MenuResponse) => void;
    onEditMenu: (menu: MenuResponse) => void;
    onCloneMenu: (menu: MenuResponse) => void;
    onDeleteMenu: (menu: MenuResponse) => void;
}

export function MenuCalendarCard({
    date,
    currentMonth,
    menu,
    onCreateClick,
    onChangeStatus,
    onViewDetails,
    onEditMenu,
    onCloneMenu,
    onDeleteMenu,
}: MenuCalendarCardProps) {
    const isPastDate = isPast(date) && !isToday(date);
    const isSunday = date.getDay() === 0;
    const dateNumber = format(date, 'd');
    const isCurrentMonth = isSameMonth(date, currentMonth);

    // Empty state
    if (!menu) {
        return (
            <div className={cn(
                "group relative h-full min-h-[100px] w-full p-2 flex flex-col transition-colors border border-transparent",
                isCurrentMonth ? "bg-white dark:bg-zinc-950" : "bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400 dark:text-zinc-600",
                isSunday ? "bg-zinc-100/80 dark:bg-zinc-900/60" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
            )}>
                <span className={cn(
                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                    isToday(date) ? "bg-white text-zinc-900 ring-1 ring-zinc-200" : ""
                )}>
                    {dateNumber}
                </span>

                {isSunday ? (
                    <div className="mt-auto rounded-md border border-dashed border-zinc-200 px-2 py-1.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                        Día sin servicio
                    </div>
                ) : !isPastDate && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 transition-colors"
                            onClick={() => onCreateClick(date)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    const isServed = menu.status === 'SERVED';
    return (
        <div className={cn(
            "group relative h-full min-h-[100px] w-full p-2 flex flex-col gap-1 transition-colors border",
            isCurrentMonth ? "bg-white dark:bg-zinc-950" : "opacity-60 bg-zinc-50 dark:bg-zinc-900/20",
            isServed ? "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/10" : "border-[#3b6154]/30 dark:border-[#3b6154]/20 shadow-sm shadow-[#3b6154]/5"
        )}>
            <div className="flex items-center justify-between">
                <span className={cn(
                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                    isToday(date) ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200" : ""
                )}>
                    {dateNumber}
                </span>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-7 w-7 p-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 opacity-100 transition-colors">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-md">
                        <DropdownMenuLabel>Acciones del Menú</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />

                        <DropdownMenuItem onClick={() => onViewDetails(menu)} className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 dark:focus:text-white text-zinc-700 dark:text-zinc-200">
                            <Settings2 className="mr-2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                            <span>Ver Detalles</span>
                        </DropdownMenuItem>

                        {!isServed && (
                            <DropdownMenuItem onClick={() => onEditMenu(menu)} className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 dark:focus:text-white text-zinc-700 dark:text-zinc-200">
                                <Pencil className="mr-2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                <span>Editar</span>
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuItem onClick={() => onCloneMenu(menu)} className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 dark:focus:text-white text-zinc-700 dark:text-zinc-200">
                            <Copy className="mr-2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                            <span>Clonar Menú</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />

                        <DropdownMenuItem onClick={() => onChangeStatus(menu.id, menu.status)} className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 dark:focus:text-white text-zinc-700 dark:text-zinc-200">
                            {isServed ? (
                                <Unlock className="mr-2 h-4 w-4 text-emerald-500" />
                            ) : (
                                <Lock className="mr-2 h-4 w-4 text-orange-500" />
                            )}
                            <span>Marcar como {isServed ? 'Programado' : 'Servido'}</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />

                        <DropdownMenuItem onClick={() => onDeleteMenu(menu)} className="cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50 dark:focus:text-red-300">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Eliminar</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex-1 mt-1">
                <div onClick={() => onViewDetails(menu)} className={cn(
                    "w-full text-xs p-1.5 rounded cursor-pointer transition-colors border flex items-center h-[34px]",
                    isServed
                        ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 dark:border-zinc-700"
                        : "bg-[#3b6154]/10 hover:bg-[#3b6154]/20 text-[#3b6154] border-[#3b6154]/20 dark:bg-[#3b6154]/20 dark:hover:bg-[#3b6154]/30 dark:text-[#528775] dark:border-[#3b6154]/30"
                )}>
                    <div className="font-semibold truncate">
                        {isServed ? 'Servido' : 'Programado'}
                    </div>
                </div>
            </div>
        </div>
    );
}
