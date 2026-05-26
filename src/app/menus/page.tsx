'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Settings2, LogOut, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MenuCard } from '@/components/menus/MenuCard';
import { menuService } from '@/services/menu-service';
import { whitelistService } from '@/services/whitelist-service';
import { reservationService } from '@/services/reservation-service';
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

export default function MenusPage() {
    const router = useRouter();
    const [cedula, setCedula] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('');

    // States for Card 1 (Today or Last Reserved)
    const [card1Menu, setCard1Menu] = useState<Menu | null>(null);
    const [card1Date, setCard1Date] = useState<Date | null>(null);
    const [card1Loading, setCard1Loading] = useState<boolean>(true);

    // States for Card 2 (Next scheduled)
    const [card2Menu, setCard2Menu] = useState<Menu | null>(null);
    const [card2Date, setCard2Date] = useState<Date | null>(null);
    const [card2Loading, setCard2Loading] = useState<boolean>(true);

    // States for Card 3 (Second next scheduled)
    const [card3Menu, setCard3Menu] = useState<Menu | null>(null);
    const [card3Date, setCard3Date] = useState<Date | null>(null);
    const [card3Loading, setCard3Loading] = useState<boolean>(true);

    const loadAllCards = async (userCc: string) => {
        setCard1Loading(true);
        setCard2Loading(true);
        setCard3Loading(true);

        const { year, month, day } = todayColombiaYMD();
        const todayUTC = new Date(Date.UTC(year, month - 1, day));
        const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const tomorrowUTC = new Date(todayUTC);
        tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);
        const tomorrowStr = `${tomorrowUTC.getUTCFullYear()}-${String(tomorrowUTC.getUTCMonth() + 1).padStart(2, '0')}-${String(tomorrowUTC.getUTCDate()).padStart(2, '0')}`;

        // 1. Fetch Card 1 (Today's Menu or Last Reserved Menu)
        let todayMenu: Menu | null = null;
        try {
            todayMenu = await menuService.findByDate(todayStr, userCc);
        } catch {
            todayMenu = null;
        }

        if (todayMenu) {
            setCard1Menu(todayMenu);
            setCard1Date(todayUTC);
            setCard1Loading(false);
        } else {
            // Fallback: get last reserved menu
            try {
                const reservations = await reservationService.findByCC(userCc, 'all');
                // Filter reservations to only past/today (menu date <= today)
                const pastReservations = reservations.filter(r => {
                    const menuDate = new Date(r.menu.date);
                    return menuDate.getTime() <= todayUTC.getTime();
                });

                if (pastReservations.length > 0) {
                    // Sort descending by menu date
                    pastReservations.sort((a, b) => new Date(b.menu.date).getTime() - new Date(a.menu.date).getTime());
                    const lastRes = pastReservations[0];
                    const lastResDateStr = lastRes.menu.date.slice(0, 10);
                    const lastResMenu = await menuService.findByDate(lastResDateStr, userCc);
                    
                    const lastResDate = new Date(lastResMenu.date);
                    const lastResUTCDate = new Date(Date.UTC(lastResDate.getUTCFullYear(), lastResDate.getUTCMonth(), lastResDate.getUTCDate()));

                    setCard1Menu(lastResMenu);
                    setCard1Date(lastResUTCDate);
                } else {
                    setCard1Menu(null);
                    setCard1Date(todayUTC);
                }
            } catch (err) {
                console.error("Error fetching past reservations", err);
                setCard1Menu(null);
                setCard1Date(todayUTC);
            } finally {
                setCard1Loading(false);
            }
        }

        // 2. Fetch Card 2 and Card 3 (Next 2 scheduled menus starting tomorrow)
        try {
            const upcomingMenus = await menuService.findAll({ startDate: tomorrowStr, cc: userCc });
            // Sort ascending by date
            const sortedMenus = upcomingMenus.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            // Card 2
            if (sortedMenus.length > 0) {
                const m2 = sortedMenus[0];
                const d2 = new Date(m2.date);
                setCard2Menu(m2);
                setCard2Date(new Date(Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate())));
            } else {
                setCard2Menu(null);
                setCard2Date(tomorrowUTC);
            }

            // Card 3
            if (sortedMenus.length > 1) {
                const m3 = sortedMenus[1];
                const d3 = new Date(m3.date);
                setCard3Menu(m3);
                setCard3Date(new Date(Date.UTC(d3.getUTCFullYear(), d3.getUTCMonth(), d3.getUTCDate())));
            } else {
                let d3Date = new Date(tomorrowUTC);
                d3Date.setUTCDate(d3Date.getUTCDate() + 1);
                if (sortedMenus.length > 0) {
                    const d2 = new Date(sortedMenus[0].date);
                    d3Date = new Date(Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate() + 1));
                }
                setCard3Menu(null);
                setCard3Date(d3Date);
            }
        } catch (err) {
            console.error("Error fetching upcoming menus", err);
            setCard2Menu(null);
            setCard2Date(tomorrowUTC);
            
            const tomorrowPlusOne = new Date(tomorrowUTC);
            tomorrowPlusOne.setUTCDate(tomorrowPlusOne.getUTCDate() + 1);
            setCard3Menu(null);
            setCard3Date(tomorrowPlusOne);
        } finally {
            setCard2Loading(false);
            setCard3Loading(false);
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

        loadAllCards(storedCedula);
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('user_cedula');
        router.push('/');
    };

    if (!cedula) return null; // Avoid flicker before redirect

    const todayStr = `${todayColombiaYMD().year}-${String(todayColombiaYMD().month).padStart(2, '0')}-${String(todayColombiaYMD().day).padStart(2, '0')}`;

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
                            Menús del día {userName && <>— <span className="text-[#3b6154]">{userName}</span></>}
                        </h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-lg xl:text-sm">
                        Gestiona tus reservas de almuerzo: revisa tu última reserva y programa tus próximos días hábiles.
                    </p>
                </div>

                {/* 3-Card layout */}
                <div className="flex-1 w-full pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full">
                        {/* Card 1 */}
                        <div className="flex flex-col gap-3 text-center md:text-left">
                            <div className="text-xs font-bold uppercase tracking-widest text-[#3b6154] dark:text-[#528271]">
                                {card1Menu && card1Menu.date.toString().slice(0, 10) === todayStr
                                    ? "Menú de Hoy"
                                    : "Último Reservado"}
                            </div>
                            {card1Date && (
                                <MenuCard
                                    date={card1Date}
                                    menu={card1Menu}
                                    isLoading={card1Loading}
                                    cedula={cedula}
                                    userName={userName}
                                    onReservationSuccess={() => loadAllCards(cedula)}
                                />
                            )}
                        </div>

                        {/* Card 2 */}
                        <div className="flex flex-col gap-3 text-center md:text-left">
                            <div className="text-xs font-bold uppercase tracking-widest text-[#3b6154] dark:text-[#528271]">
                                Siguiente Programado
                            </div>
                            {card2Date && (
                                <MenuCard
                                    date={card2Date}
                                    menu={card2Menu}
                                    isLoading={card2Loading}
                                    cedula={cedula}
                                    userName={userName}
                                    onReservationSuccess={() => loadAllCards(cedula)}
                                />
                            )}
                        </div>

                        {/* Card 3 */}
                        <div className="flex flex-col gap-3 text-center md:text-left">
                            <div className="text-xs font-bold uppercase tracking-widest text-[#3b6154] dark:text-[#528271]">
                                Próximo Programado
                            </div>
                            {card3Date && (
                                <MenuCard
                                    date={card3Date}
                                    menu={card3Menu}
                                    isLoading={card3Loading}
                                    cedula={cedula}
                                    userName={userName}
                                    onReservationSuccess={() => loadAllCards(cedula)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
