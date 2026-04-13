'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Settings2, LogOut, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MenuCard } from '@/components/menus/MenuCard';
import { menuService } from '@/services/menu-service';
import { whitelistService } from '@/services/whitelist-service';
import { Menu } from '@/types';

/**
 * Returns today's date in Colombia (America/Bogota, UTC-5) as a plain
 * { year, month (1-based), day } object.
 *
 * Using Intl.DateTimeFormat guarantees correctness even at UTC midnight
 * boundaries where simple offset arithmetic can return the wrong calendar day.
 */
function todayColombiaYMD(): { year: number; month: number; day: number } {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());

    const get = (type: string) =>
        parseInt(parts.find(p => p.type === type)!.value, 10);

    return { year: get('year'), month: get('month'), day: get('day') };
}

/**
 * Checks whether a given JS Date (UTC midnight) falls on a weekend.
 */
function isWeekend(date: Date): boolean {
    const day = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6;
}

/**
 * Returns exactly ONE next business day relative to today in Colombia time,
 * skipping weekends.
 *
 * Example flows:
 *   Monday   → Tuesday
 *   Tuesday  → Wednesday
 *   Thursday → Friday
 *   Friday   → Monday  (skips Saturday + Sunday)
 *   Saturday → Monday  (skips Sunday)
 *   Sunday   → Monday
 */
function getNextWorkDay(): Date[] {
    const { year, month, day } = todayColombiaYMD();
    // Work with UTC-midnight dates so getUTCDay() reflects the calendar day
    const startDate = new Date(Date.UTC(year, month - 1, day));

    const days: Date[] = [];
    // Start from tomorrow
    const cursor = new Date(startDate);
    cursor.setUTCDate(cursor.getUTCDate() + 1);

    while (days.length < 1) {
        if (!isWeekend(cursor)) {
            days.push(new Date(cursor));
        }
        // Always advance to avoid infinite loop; if we just pushed a valid
        // day the while condition will exit after this iteration.
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return days;
}

export default function MenusPage() {
    const router = useRouter();
    const [cedula, setCedula] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('');
    const [weekDays, setWeekDays] = useState<Date[]>([]);
    const [menus, setMenus] = useState<Record<string, Menu | null>>({});
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

    const fetchDayMenu = async (date: Date, userCc?: string) => {
        // Date objects from getNextWorkDay() are UTC-midnight; read with getUTC* methods
        const yyyy = date.getUTCFullYear();
        const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(date.getUTCDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        setIsLoading(prev => ({ ...prev, [dateStr]: true }));
        try {
            const menu = await menuService.findByDate(dateStr, userCc);
            setMenus(prev => ({ ...prev, [dateStr]: menu }));
        } catch {
            setMenus(prev => ({ ...prev, [dateStr]: null }));
        } finally {
            setIsLoading(prev => ({ ...prev, [dateStr]: false }));
        }
    };

    useEffect(() => {
        const storedCedula = localStorage.getItem('user_cedula');
        if (!storedCedula) {
            router.push('/');
            return;
        }
        setCedula(storedCedula);

        const session = whitelistService.getSession();
        if (session && session.name) {
            setUserName(session.name);
        }

        const days = getNextWorkDay();
        setWeekDays(days);

        days.forEach(day => fetchDayMenu(day, storedCedula));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('user_cedula');
        router.push('/');
    };

    if (!cedula) return null; // Avoid flicker before redirect

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200 flex flex-col">

            {/* Header */}
            <header className="bg-[#3b6154] sticky top-0 z-10 shadow-sm">
                <div className="w-full px-4 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <UtensilsCrossed size={16} className="text-white" />
                        <span className="font-black tracking-tighter text-2xl text-white leading-none">
                            TIMO<span className="text-[#061210]">TOMILLO</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />

                        <div className="flex items-center gap-2 pl-4 border-l border-white/20">
                            <span className="text-xs font-semibold uppercase tracking-widest text-white/80 hidden sm:block">
                                C.C: {cedula}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="group relative flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                                title="Cerrar sesión"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>

                        <Link
                            href="/admin/login"
                            className="group relative flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                            title="Acceso Administrativo"
                        >
                            <Settings2 size={18} className="group-hover:rotate-45 transition-transform duration-300" />
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full px-4 lg:px-8 py-8 flex flex-col gap-8">
                <div className="flex flex-col gap-2 md:gap-3 xl:gap-2">
                    <div className="flex items-center gap-3 text-[#3b6154]">
                        <CalendarDays className="w-5 h-5 md:w-8 md:h-8 xl:w-5 xl:h-5" />
                        <h1 className="text-2xl md:text-4xl xl:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            Menú del día {userName && <>— <span className="text-[#3b6154]">{userName}</span></>}
                        </h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-lg xl:text-sm">
                        Reserva y prepara tu almuerzo para el siguiente día hábil.
                    </p>
                </div>

                {/* Calendar Layout: Scroll mobile, Center 2-card Carousel tablet, Grid desktop */}
                <div className="flex-1 w-full pb-4 flex justify-center text-center">
                    <div className="w-full sm:w-[320px] md:w-[360px]">
                        {weekDays.map((day, idx) => {
                            const yyyy = day.getUTCFullYear();
                            const mm = String(day.getUTCMonth() + 1).padStart(2, '0');
                            const dd = String(day.getUTCDate()).padStart(2, '0');
                            const dateStr = `${yyyy}-${mm}-${dd}`;

                            return (
                                <div key={idx} className="w-full mx-auto">
                                    <MenuCard
                                        date={day}
                                        menu={menus[dateStr] || null}
                                        isLoading={isLoading[dateStr] !== false}
                                        cedula={cedula}
                                        userName={userName}
                                        onReservationSuccess={() => fetchDayMenu(day, cedula)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
