'use client';

import { createContext, FormEvent, ReactNode, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { LockKeyhole, Clock3, Loader2, LogOut, UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { apiClient } from '@/services/api-client';
import { clearDeviceSession, DEVICE_SESSION_CHANGED, DEVICE_SESSION_KEY, getDeviceToken } from '@/services/device-session';
import { queryClient } from '@/core/query-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DeviceSessionContext = createContext<{ expiresAt: number; busy: boolean; error: string; requestLogout: () => void } | null>(null);

export function DeviceSessionStatus() {
    const session = useContext(DeviceSessionContext);
    if (!session) return null;
    return <div className="border-b border-[#3b6154]/20 bg-[#3b6154]/10 dark:bg-zinc-900 px-4 sm:px-6 py-3 text-sm text-zinc-800 dark:text-zinc-100">
        <p className="flex items-center gap-2 font-medium"><Clock3 aria-hidden="true" className="size-4 shrink-0 text-[#3b6154] dark:text-emerald-400" /><span>Dispositivo habilitado · hasta las <time dateTime={new Date(session.expiresAt).toISOString()}>{new Date(session.expiresAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time></span></p>
        {session.error && <p role="alert" className="mt-2 text-red-600 dark:text-red-400">{session.error}</p>}
    </div>;
}

export function DeviceSessionLogout() {
    const session = useContext(DeviceSessionContext);
    if (!session) return null;
    return <Button variant="ghost" className="min-h-11 text-white hover:bg-white/10 hover:text-white" title="Terminar sesión" aria-label="Terminar sesión" disabled={session.busy} onClick={session.requestLogout}><LogOut aria-hidden="true" /><span className="hidden sm:inline">Terminar sesión</span></Button>;
}

export function DeviceAccessGate({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    if (pathname.startsWith('/admin') || pathname === '/tickets') return <>{children}</>;
    return <PublicAccess key={pathname}>{children}</PublicAccess>;
}

function PublicAccess({ children }: { children: ReactNode }) {
    const [expiresAt, setExpiresAt] = useState<number | null>(null);
    const [deadline, setDeadline] = useState<number | null>(null);
    const [checking, setChecking] = useState(true);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [confirmLogout, setConfirmLogout] = useState(false);

    useEffect(() => {
        let cancelled = false;
        let sequence = 0;
        const check = async () => {
            const current = ++sequence;
            if (!navigator.onLine) {
                setExpiresAt(null);
                setChecking(false);
                setError('Sin conexión. Conéctate a internet para verificar el acceso.');
                return;
            }
            const token = getDeviceToken();
            if (!token) {
                setExpiresAt(null);
                setChecking(false);
                sessionStorage.removeItem('whitelist_session');
                localStorage.removeItem('user_cedula');
                queryClient.clear();
                return;
            }
            try {
                const { data } = await apiClient.get<{ active: boolean; expiresAt: string | null }>('/device-access/session');
                if (cancelled || current !== sequence || token !== getDeviceToken()) return;
                if (data.active && data.expiresAt && new Date(data.expiresAt).getTime() > Date.now()) {
                    setExpiresAt(new Date(data.expiresAt).getTime());
                    setDeadline(new Date(data.expiresAt).getTime());
                    setError('');
                } else {
                    clearDeviceSession();
                }
            } catch {
                if (!cancelled && current === sequence) {
                    setExpiresAt(null);
                    setError('No se pudo verificar la sesión. Revisa la conexión.');
                }
            } finally {
                if (!cancelled && current === sequence) setChecking(false);
            }
        };
        const changed = () => {
            setExpiresAt(null);
            sessionStorage.removeItem('whitelist_session');
            localStorage.removeItem('user_cedula');
            queryClient.clear();
            void check();
        };
        const foreground = () => { setExpiresAt(null); setChecking(true); void check(); };
        const storage = (event: StorageEvent) => {
            if (event.key === DEVICE_SESSION_KEY || event.key === null) changed();
        };
        void check();
        const interval = window.setInterval(check, 15000);
        window.addEventListener('storage', storage);
        window.addEventListener(DEVICE_SESSION_CHANGED, changed);
        window.addEventListener('focus', foreground);
        window.addEventListener('pageshow', foreground);
        window.addEventListener('online', foreground);
        window.addEventListener('offline', check);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
            window.removeEventListener('storage', storage);
            window.removeEventListener(DEVICE_SESSION_CHANGED, changed);
            window.removeEventListener('focus', foreground);
            window.removeEventListener('pageshow', foreground);
            window.removeEventListener('online', foreground);
            window.removeEventListener('offline', check);
        };
    }, []);

    useEffect(() => {
        if (!deadline) return;
        const token = getDeviceToken();
        const timer = window.setTimeout(() => {
            if (token === getDeviceToken()) clearDeviceSession();
        }, Math.max(0, deadline - Date.now()));
        return () => window.clearTimeout(timer);
    }, [deadline]);

    async function login(event: FormEvent) {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            const { data } = await apiClient.post<{ token: string; expiresAt: string }>('/device-access/login', { password });
            clearDeviceSession();
            localStorage.setItem(DEVICE_SESSION_KEY, data.token);
            setPassword('');
            setShowPassword(false);
            window.dispatchEvent(new Event(DEVICE_SESSION_CHANGED));
        } catch (failure) {
            const message = axios.isAxiosError(failure) ? failure.response?.data?.message : null;
            setError(typeof message === 'string' ? message : 'No se pudo abrir la sesión. Revisa la conexión y la clave.');
        } finally { setBusy(false); }
    }

    async function logout() {
        setBusy(true);
        setError('');
        try {
            await apiClient.post('/device-access/logout');
            clearDeviceSession();
            window.location.replace('/');
        } catch {
            setError('No se pudo cerrar la sesión en el servidor. Revisa la conexión e intenta nuevamente.');
        } finally { setBusy(false); setConfirmLogout(false); }
    }

    if (checking) return <div role="status" className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300"><Loader2 aria-hidden="true" className="animate-spin text-[#3b6154]" />Verificando acceso del dispositivo…</div>;
    if (expiresAt && expiresAt > Date.now()) return <DeviceSessionContext.Provider value={{ expiresAt, busy, error, requestLogout: () => setConfirmLogout(true) }}>
        <ConfirmationDialog isOpen={confirmLogout} onClose={() => setConfirmLogout(false)} onConfirm={logout} isLoading={busy} title="¿Terminar la sesión de este dispositivo?" description="Se borrará la cédula actual y se bloquearán las reservas en todas las pestañas de este navegador. Otros dispositivos seguirán habilitados." confirmText="Terminar sesión" />
        {children}
    </DeviceSessionContext.Provider>;

    return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <header className="flex min-h-16 items-center justify-between gap-3 bg-[#3b6154] px-4 sm:px-8"><div className="flex items-center gap-2"><UtensilsCrossed aria-hidden="true" className="size-4 text-white" /><span className="font-black tracking-tighter text-2xl text-white">TIMO<span className="text-[#061210]">TOMILLO</span></span></div><ThemeToggle /></header>
        <main className="flex items-center justify-center px-4 py-10 sm:py-16">
        <section className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-xl shadow-zinc-200/40 dark:shadow-none space-y-6">
            <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#3b6154] text-white"><LockKeyhole aria-hidden="true" size={28} /></div>
                <h1 className="text-xl font-bold tracking-tight">Habilita la sesión</h1>
            </div>
            <form onSubmit={login} className="space-y-4">
                <label htmlFor="device-password" className="text-sm font-medium">Clave de acceso</label>
                <div className="relative">
                    <Input id="device-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} maxLength={128} required disabled={busy} className="pr-12 text-base" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-11 w-11 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900" aria-label={showPassword ? 'Ocultar clave' : 'Mostrar clave'} aria-pressed={showPassword} aria-controls="device-password" disabled={busy} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</Button>
                </div>
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                <Button className="w-full min-h-12 bg-[#3b6154] hover:bg-[#2b473e] text-white" disabled={busy}>{busy && <Loader2 aria-hidden="true" className="animate-spin" />}{busy ? 'Verificando…' : 'Habilitar dispositivo'}</Button>
            </form>
            <Link href="/admin/login" className="flex min-h-11 items-center justify-center rounded-lg text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Acceso administrativo</Link>
        </section>
    </main></div>;
}
