'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { authService } from '@/services/auth-service';
import { UtensilsCrossed, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await authService.login({ email, password });
            router.push('/admin');
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } }).response?.status;
            if (status === 401) {
                setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
            } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
                setError('Sin conexión. El login administrativo requiere internet.');
            } else {
                setError('Error al conectar con el servidor. Inténtalo de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 font-sans transition-colors duration-200">

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 border-b border-[#3b6154] dark:border-[#3b6154] bg-[#3b6154]">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
                >
                    <UtensilsCrossed size={16} className="text-zinc-500" />
                    <span className="font-black tracking-tighter text-2xl text-white leading-none">TIMO<span className="text-emerald-200">TOMILLO</span></span>
                </Link>
                <ThemeToggle />
            </div>

            <div className="w-full max-w-sm md:max-w-md space-y-8 md:space-y-10 pt-8 md:pt-16">
                <div className="flex flex-col items-center space-y-3 md:space-y-5">
                    <div className="bg-[#3b6154] border border-[#3b6154]/50 p-3.5 md:p-5 rounded-2xl md:rounded-3xl shadow-xl text-white">
                        <UtensilsCrossed size={28} className="md:w-10 md:h-10" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Panel TIMOTOMILLO</h1>
                        <p className="text-zinc-400 dark:text-zinc-500 text-sm md:text-base mt-1 md:mt-2">Acceso exclusivo para administradores</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-8 md:p-10 rounded-3xl md:rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-100 dark:shadow-zinc-950">
                    <form onSubmit={handleLogin} className="space-y-5 md:space-y-7">

                        {error && (
                            <div className="p-3.5 bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700 dark:text-red-400 font-medium leading-relaxed">{error}</p>
                            </div>
                        )}

                        <Input
                            label="Correo electrónico"
                            labelClassName="text-zinc-900 dark:text-white md:text-base md:mb-2"
                            className="md:h-14 md:text-lg"
                            placeholder="admin@empresa.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            label="Contraseña"
                            labelClassName="text-zinc-900 dark:text-white md:text-base md:mb-2"
                            className="md:h-14 md:text-lg"
                            placeholder="••••••••"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <Button
                            type="submit"
                            className="w-full h-12 md:h-14 text-base md:text-lg font-bold tracking-wide mt-2 md:mt-4 bg-[#3b6154] hover:bg-[#2b473e] text-white border-none shadow-md transition-colors"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                "Entrar"
                            )}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-[10px] md:text-xs text-zinc-400 font-medium uppercase tracking-[0.2em] md:tracking-[0.25em]">
                    Uso restringido · Personal autorizado
                </p>
            </div>
        </div>
    );
}
