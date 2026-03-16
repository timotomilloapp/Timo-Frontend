'use client';

import React, { useEffect, useState } from 'react';
import { UtensilsCrossed, LogOut, Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { authService, UserProfile } from '@/services/auth-service';
import { useRouter } from 'next/navigation';

export function AdminHeader({ onMenuToggle }: { onMenuToggle?: () => void }) {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const data = await authService.me();
                setProfile(data);
            } catch {
                // We'll let layout handle unauthenticated states usually
            }
        }
        fetchProfile();
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 h-16 border-b border-[#3b6154] dark:border-[#3b6154] bg-[#3b6154] z-50">
            <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">

                {/* Brand */}
                <div className="flex items-center gap-3 w-auto md:w-60">
                    <button onClick={onMenuToggle} className="md:hidden p-1.5 -ml-1.5 mr-1 text-white/70 hover:text-white rounded-md">
                        <Menu size={20} />
                    </button>
                    <UtensilsCrossed size={16} className="text-white/80 hidden sm:block" />
                    <span className="font-black tracking-tighter text-2xl text-white leading-none">TIMO<span className="text-emerald-200">TOMILLO</span></span>
                    <span className="text-white/60 text-xs hidden sm:block">/ Admin</span>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-3">
                    {profile && (
                        <div className="hidden sm:flex items-center gap-2 text-xs text-white/70 mr-2">
                            <span className="text-white/90">{profile.email}</span>
                            <span className="text-white/50">·</span>
                            <span className="font-bold text-white uppercase tracking-widest">{profile.role}</span>
                        </div>
                    )}

                    <ThemeToggle />

                    <button
                        onClick={() => authService.logout().then(() => router.replace('/admin/login'))}
                        title="Cerrar sesión"
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-red-400 hover:bg-white/10 transition-all"
                    >
                        <LogOut size={16} />
                    </button>
                </div>

            </div>
        </header>
    );
}
