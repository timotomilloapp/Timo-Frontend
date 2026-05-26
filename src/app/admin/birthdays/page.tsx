'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { Cake, Gift, Calendar, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Area {
    id: string;
    name: string;
}

interface WhitelistEntry {
    id: string;
    cc: string;
    name: string;
    birthdate: string;
    area?: Area | null;
    daysUntil?: number;
}

interface BirthdaysResponse {
    upcoming: WhitelistEntry[];
    all: WhitelistEntry[];
}

const MONTHS_SPANISH = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function formatBirthdate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getUTCDate();
    const month = MONTHS_SPANISH[date.getUTCMonth()];
    return `${day} de ${month}`;
}

export default function BirthdaysPage() {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'all'>('upcoming');
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading, error } = useQuery<BirthdaysResponse>({
        queryKey: ['/whitelist/birthdays'],
        queryFn: async () => {
            const { data } = await apiClient.get<BirthdaysResponse>('/whitelist/birthdays');
            return data;
        }
    });

    const upcomingList = data?.upcoming || [];
    const allList = data?.all || [];

    // Filter overall list based on search query
    const filteredAllList = allList.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.cc.includes(searchQuery) ||
        (e.area?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group the complete list by month
    const groupedBirthdays = MONTHS_SPANISH.map((monthName, idx) => {
        const employees = filteredAllList.filter(e => {
            if (!e.birthdate) return false;
            const d = new Date(e.birthdate);
            return d.getUTCMonth() === idx;
        });
        return {
            monthName,
            employees
        };
    }).filter(group => group.employees.length > 0);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] bg-white dark:bg-zinc-950">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-[3px] border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white rounded-full animate-spin" />
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Cargando cumpleaños…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-500 mb-4">
                    <span className="font-bold text-xl">!</span>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Error al cargar datos</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Ocurrió un error al obtener la lista de cumpleaños.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <Cake className="text-[#3b6154] dark:text-[#528775]" />
                    Cumpleaños
                </h1>
                <p className="text-sm text-[#3b6154] dark:text-[#528775] mt-1 font-medium">
                    Visualiza y celebra los cumpleaños del equipo de trabajo.
                </p>
            </div>

            {/* Tab Switched Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-px">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={cn(
                            "px-4 py-2.5 text-sm font-bold border-b-2 transition-all -mb-px flex items-center gap-2",
                            activeTab === 'upcoming'
                                ? "border-[#3b6154] text-[#3b6154] dark:border-[#528775] dark:text-[#528775]"
                                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                        )}
                    >
                        <Sparkles size={16} />
                        Próximos 7 días
                        {upcomingList.length > 0 && (
                            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-[#3b6154]/10 text-[#3b6154] dark:bg-[#528775]/25 dark:text-[#528775] font-black">
                                {upcomingList.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={cn(
                            "px-4 py-2.5 text-sm font-bold border-b-2 transition-all -mb-px flex items-center gap-2",
                            activeTab === 'all'
                                ? "border-[#3b6154] text-[#3b6154] dark:border-[#528775] dark:text-[#528775]"
                                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                        )}
                    >
                        <Calendar size={16} />
                        Todos los Cumpleaños
                    </button>
                </div>

                {activeTab === 'all' && (
                    <div className="relative w-full sm:w-64">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
                            <Search size={16} />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar empleado o área..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#3b6154] dark:focus:ring-[#528775] text-zinc-800 dark:text-zinc-100 transition-colors"
                        />
                    </div>
                )}
            </div>

            {/* Content Tabs */}
            {activeTab === 'upcoming' ? (
                /* Primary Screen: Next 7 days */
                upcomingList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/10 text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-2">
                            <Gift size={20} />
                        </div>
                        <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200">No hay cumpleaños programados</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                            Ningún empleado registrado cumple años en los próximos 7 días.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingList.map((emp) => {
                            const isToday = emp.daysUntil === 0;
                            const isTomorrow = emp.daysUntil === 1;

                            return (
                                <div
                                    key={emp.id}
                                    className={cn(
                                        "p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex items-start gap-4 relative overflow-hidden",
                                        isToday 
                                            ? "border-emerald-200 dark:border-emerald-950 bg-emerald-50/30 dark:bg-emerald-950/10" 
                                            : isTomorrow 
                                                ? "border-amber-200 dark:border-amber-950 bg-amber-50/30 dark:bg-amber-950/10" 
                                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                                    )}
                                >
                                    {/* Balloon decoration for today */}
                                    {isToday && (
                                        <div className="absolute -top-3 -right-3 text-3xl opacity-20 pointer-events-none select-none">🎈</div>
                                    )}

                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                        isToday 
                                            ? "bg-emerald-500 text-white" 
                                            : isTomorrow 
                                                ? "bg-amber-500 text-white" 
                                                : "bg-[#3b6154]/10 text-[#3b6154] dark:bg-[#528775]/20 dark:text-[#528775]"
                                    )}>
                                        {isToday ? <Sparkles size={22} className="animate-pulse" /> : <Gift size={22} />}
                                    </div>

                                    <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <span className={cn(
                                                "px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md",
                                                isToday 
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" 
                                                    : isTomorrow 
                                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" 
                                                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                            )}>
                                                {isToday ? '¡Hoy! 🎉' : isTomorrow ? 'Mañana 🎂' : `En ${emp.daysUntil} días`}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base truncate pt-1">{emp.name}</h3>

                                        <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-0.5">
                                            <p className="font-mono">CC: {emp.cc}</p>
                                            <p className="truncate">Área: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{emp.area?.name || 'Sin especificar'}</span></p>
                                        </div>

                                        <div className="pt-2 flex items-center gap-1.5 text-xs text-[#3b6154] dark:text-[#528775] font-bold">
                                            <Calendar size={13} />
                                            {formatBirthdate(emp.birthdate)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                /* Secondary Screen: All birthdays organized by month */
                groupedBirthdays.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/10 text-center gap-2">
                        <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200">No se encontraron resultados</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Ningún empleado coincide con la búsqueda.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupedBirthdays.map((group) => (
                            <div
                                key={group.monthName}
                                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col"
                            >
                                <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-between items-center">
                                    <h3 className="font-black text-zinc-900 dark:text-zinc-50 tracking-tight text-lg">{group.monthName}</h3>
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-[#3b6154]/10 text-[#3b6154] dark:bg-[#528775]/20 dark:text-[#528775] font-bold">
                                        {group.employees.length} {group.employees.length === 1 ? 'cumpleaños' : 'cumpleaños'}
                                    </span>
                                </div>

                                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 flex-1 overflow-y-auto max-h-[350px]">
                                    {group.employees.map((emp) => {
                                        const date = new Date(emp.birthdate);
                                        const dayStr = String(date.getUTCDate()).padStart(2, '0');

                                        return (
                                            <div
                                                key={emp.id}
                                                className="px-5 py-3.5 flex items-center gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-[#3b6154]/5 text-[#3b6154] dark:bg-[#528775]/10 dark:text-[#528775] flex items-center justify-center shrink-0 font-black text-sm">
                                                    {dayStr}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-zinc-800 dark:text-zinc-100 text-sm truncate">{emp.name}</p>
                                                    <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                                                        {emp.area?.name || 'Sin área'} • CC: {emp.cc}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
