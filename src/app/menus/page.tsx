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

// Helper to get Mon-Sat for the current week based on Colombia time
function getCurrentWeekDays(): Date[] {
    const today = new Date();
    // Use local time approximations for now, assuming user is in Colombia
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday

    // Calculate difference to Monday. If Sunday (0), Monday is -6. Otherwise day - 1.
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < 6; i++) { // Lunes to Sabado (6 days)
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        days.push(d);
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

        const days = getCurrentWeekDays();
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
                            TIMO.
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
                            Menú Semanal
                        </h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-lg xl:text-sm">
                        Selecciona o visualiza el menú disponible para esta semana.
                    </p>
                </div>

                {/* Calendar Layout: Scroll mobile, Center 2-card Carousel tablet, Grid desktop */}
                <div className="flex-1 w-full pb-4 flex md:justify-center xl:block">
                    <div className="flex overflow-x-auto w-full md:max-w-[712px] xl:max-w-none xl:grid xl:grid-cols-6 xl:overflow-visible snap-x snap-mandatory gap-4 md:gap-8 xl:gap-4 pb-4 scrollbar-hide px-4 md:px-0 xl:px-0">
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
