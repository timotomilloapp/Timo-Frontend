'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/services/auth-service';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';


export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Exclude login page from this layout's auth check logic
    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        if (isLoginPage) {
            setIsLoading(false);
            return;
        }

        async function checkAuth() {
            try {
                const profile = await authService.me();
                setRole(profile.role);
                setIsLoading(false);
            } catch {
                router.replace('/admin/login');
            }
        }

        checkAuth();
    }, [router, isLoginPage]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-[3px] border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white rounded-full animate-spin" />
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Verificando sesión…</p>
                </div>
            </div>
        );
    }

    // If we are on the login page, just render the children without Sidebar/Header container
    if (isLoginPage) {
        return <>{children}</>;
    }

    const isRestrictedForUser = (userRole: string | null, path: string) => {
        if (userRole !== 'USER') return false;
        
        // Permitted paths for role 'USER':
        if (path === '/admin' || path === '/admin/') return false;
        if (path.startsWith('/admin/menu-items/appetizers')) return false;
        if (path.startsWith('/admin/reservations')) return false;
        if (path.startsWith('/admin/birthdays')) return false;
        
        return true;
    };

    const restricted = isRestrictedForUser(role, pathname);

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800">
            <AdminHeader onMenuToggle={() => setIsMobileMenuOpen(true)} />

            <div className="flex pt-16 max-w-[1600px] mx-auto">
                <AdminSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
                <main className="flex-1 min-h-[calc(100vh-4rem)] p-4 sm:p-6 overflow-x-hidden">
                    {restricted ? (
                        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-6 bg-white dark:bg-zinc-950">
                            <div className="w-full max-w-md p-8 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/10 backdrop-blur-md text-center flex flex-col items-center gap-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 dark:text-red-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                    </svg>
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Acceso Restringido</h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        Tu cuenta de usuario no cuenta con privilegios suficientes para acceder a la sección <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{pathname}</span>.
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.replace('/admin')}
                                    className="w-full py-2.5 bg-[#3b6154] hover:bg-[#2b473e] text-white rounded-xl text-sm font-bold shadow-sm transition-colors mt-2"
                                >
                                    Volver al Inicio
                                </button>
                            </div>
                        </div>
                    ) : (
                        children
                    )}
                </main>
            </div>
        </div>
    );
}
