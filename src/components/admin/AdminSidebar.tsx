import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Beef,
    Wine,
    Salad,
    Soup,
    LayoutDashboard,
    Utensils,
    CalendarCheck,
    ShieldCheck,
    Users,
    Printer,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    title: string;
    href: string;
    icon: React.ReactNode;
    isActive?: boolean;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

interface AdminSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
    const pathname = usePathname();

    const sections: NavSection[] = [
        {
            title: 'General',
            items: [
                {
                    title: 'Dashboard',
                    href: '/admin',
                    icon: <LayoutDashboard size={18} />,
                    isActive: pathname === '/admin'
                }
            ]
        },
        {
            title: 'Elementos del menú',
            items: [
                {
                    title: 'Proteínas',
                    href: '/admin/menu-items/proteins',
                    icon: <Beef size={18} />,
                    isActive: pathname.startsWith('/admin/menu-items/proteins')
                },
                {
                    title: 'Acompañamientos',
                    href: '/admin/menu-items/side-dishes',
                    icon: <Salad size={18} />,
                    isActive: pathname.startsWith('/admin/menu-items/side-dishes')
                },
                {
                    title: 'Sopas',
                    href: '/admin/menu-items/soups',
                    icon: <Soup size={18} />,
                    isActive: pathname.startsWith('/admin/menu-items/soups')
                },
                {
                    title: 'Bebidas',
                    href: '/admin/menu-items/drinks',
                    icon: <Wine size={18} />,
                    isActive: pathname.startsWith('/admin/menu-items/drinks')
                }
            ]
        },
        {
            title: 'Operaciones',
            items: [
                {
                    title: 'Menús',
                    href: '/admin/menus',
                    icon: <Utensils size={18} />,
                    isActive: pathname.startsWith('/admin/menus')
                },
                {
                    title: 'Reservaciones',
                    href: '/admin/reservations',
                    icon: <CalendarCheck size={18} />,
                    isActive: pathname.startsWith('/admin/reservations')
                },
                {
                    title: 'Tickets',
                    href: '/tickets',
                    icon: <Printer size={18} />,
                    isActive: pathname.startsWith('/tickets')
                },
                {
                    title: 'Empleados',
                    href: '/admin/whitelist',
                    icon: <ShieldCheck size={18} />,
                    isActive: pathname.startsWith('/admin/whitelist')
                },
                {
                    title: 'Usuarios',
                    href: '/admin/users',
                    icon: <Users size={18} />,
                    isActive: pathname.startsWith('/admin/users')
                }
            ]
        }
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-zinc-950/50 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-[calc(100vh-4rem)] md:sticky md:top-16",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between p-4 md:hidden border-b border-zinc-200 dark:border-zinc-800">
                    <span className="font-black tracking-tighter text-xl text-zinc-900 dark:text-white">TIMO<span className="text-[#3b6154]">TOMILLO</span></span>
                    <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 space-y-6 overflow-y-auto flex-1">
                    {sections.map((section, idx) => (
                        <div key={idx}>
                            <h4 className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-[#3b6154] dark:text-[#528775]">
                                {section.title}
                            </h4>
                            <nav className="space-y-1">
                                {section.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors group",
                                            item.isActive
                                                ? "bg-[#3b6154] text-white shadow-sm"
                                                : "text-zinc-600 hover:text-[#3b6154] hover:bg-[#3b6154]/10 dark:text-zinc-400 dark:hover:text-[#528775] dark:hover:bg-[#3b6154]/20"
                                        )}
                                    >
                                        <div className={cn("transition-colors", item.isActive ? "text-white" : "text-[#3b6154] dark:text-[#528775]")}>
                                            {item.icon}
                                        </div>
                                        {item.title}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    ))}
                </div>
            </aside>
        </>
    );
}
