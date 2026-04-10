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

// Colombia is always UTC-5 (no daylight saving time)
const COLOMBIA_OFFSET_MS = -5 * 60 * 60 * 1000;

/**
 * Returns a Date representing "now" in Colombia time,
 * using the same UTC-5 logic as the backend date.util.ts.
 */
function nowColombia(): Date {
    return new Date(Date.now() + COLOMBIA_OFFSET_MS);
}

/**
 * Checks whether a given JS Date (UTC midnight) falls on a weekend.
 */
function isWeekend(date: Date): boolean {
    const day = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6;
}

/**
 * Returns today (Colombia) + the next 2 business days, skipping weekends.
 * This mirrors the backend dayOfWeek logic so the 3 cards always
 * show Mon–Fri días hábiles only.
 *
 * Example flows:
 *   Monday   → Mon, Tue, Wed
 *   Tuesday  → Tue, Wed, Thu
 *   Thursday → Thu, Fri, Mon
 *   Friday   → Fri, Mon, Tue
 */
function getNext3WorkDays(): Date[] {
    const now = nowColombia();
    // Build a UTC midnight date from Colombia's local year/month/day
    const startDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    const days: Date[] = [];
    let cursor = new Date(startDate);

    while (days.length < 3) {
        if (!isWeekend(cursor)) {
            days.push(new Date(cursor));
        }
        if (days.length < 3) {
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
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
        // format YYYY-MM-DD
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
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

        const days = getNext3WorkDays();
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
                        Visualiza los próximos 3 días hábiles y reserva tu almuerzo.
                    </p>
                </div>

                {/* Calendar Layout: Scroll mobile, Center 2-card Carousel tablet, Grid desktop */}
                <div className="flex-1 w-full pb-4 flex md:justify-center xl:block">
                    <div className="flex overflow-x-auto w-full md:max-w-[712px] xl:max-w-none xl:grid xl:grid-cols-3 xl:overflow-visible snap-x snap-mandatory gap-4 md:gap-8 xl:gap-4 pb-4 scrollbar-hide px-4 md:px-0 xl:px-0">
                        {weekDays.map((day, idx) => {
                            const yyyy = day.getFullYear();
                            const mm = String(day.getMonth() + 1).padStart(2, '0');
                            const dd = String(day.getDate()).padStart(2, '0');
                            const dateStr = `${yyyy}-${mm}-${dd}`;

                            return (
                                <div key={idx} className="w-[85vw] sm:w-[320px] md:w-[340px] xl:w-auto shrink-0 snap-center">
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
