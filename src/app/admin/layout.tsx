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
                await authService.me();
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

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800">
            <AdminHeader onMenuToggle={() => setIsMobileMenuOpen(true)} />

            <div className="flex pt-16 max-w-[1600px] mx-auto">
                <AdminSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
                <main className="flex-1 min-h-[calc(100vh-4rem)] p-4 sm:p-6 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
