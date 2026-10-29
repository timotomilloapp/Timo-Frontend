'use client';

import { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import { apiClient } from '@/services/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { ShieldCheck, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { clearDeviceSession } from '@/services/device-session';

export default function DeviceAccessSettings() {
    const [configured, setConfigured] = useState<boolean | null>(null);
    const [password, setPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [currentPasswordError, setCurrentPasswordError] = useState('');
    const [reloadRequired, setReloadRequired] = useState(false);
    const [confirmation, setConfirmation] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [confirmSave, setConfirmSave] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);

    async function loadSettings() {
        setLoading(true);
        setError('');
        try {
            const { data } = await apiClient.get('/device-access/settings');
            setConfigured(data.configured);
            setUpdatedAt(data.updatedAt);
            setReloadRequired(false);
            setCurrentPassword('');
            setCurrentPasswordError('');
        } catch { setError('No se pudo consultar la configuración. Verifica tu conexión y que tengas una cuenta administradora habilitada.'); }
        finally { setLoading(false); }
    }

    useEffect(() => { void loadSettings(); }, []);

    async function save(event: FormEvent) {
        event.preventDefault();
        setMessage('');
        setError('');
        setCurrentPasswordError('');
        if (busy || loading || configured === null || reloadRequired) return;
        if (configured && !currentPassword) { setCurrentPasswordError('Ingresa la clave actual del dispositivo.'); return; }
        if (password !== confirmation) { setError('Las claves no coinciden. Revisa la confirmación.'); return; }
        setConfirmSave(true);
    }

    async function confirmChange() {
        if (busy || loading || configured === null || reloadRequired) return;
        setBusy(true);
        setError('');
        try {
            await apiClient.put('/device-access/settings', configured ? { password, currentPassword } : { password });
            setConfigured(true);
            setPassword('');
            setCurrentPassword('');
            setCurrentPasswordError('');
            setConfirmation('');
            clearDeviceSession();
            setUpdatedAt(null);
            setMessage('Clave guardada. Las sesiones anteriores quedaron invalidadas.');
        } catch (failure) {
            const response = axios.isAxiosError(failure) ? failure.response : undefined;
            const code = response?.data?.code;
            if (response?.status === 400 && code === 'CURRENT_PASSWORD_REQUIRED') {
                setConfigured(true);
                setCurrentPasswordError('Ingresa la clave actual del dispositivo para cambiarla.');
            } else if (response?.status === 403 && code === 'CURRENT_PASSWORD_INVALID') {
                setCurrentPassword('');
                setCurrentPasswordError('La clave actual del dispositivo es incorrecta. Inténtalo de nuevo.');
            } else if (response?.status === 409 && code === 'DEVICE_PASSWORD_CHANGED') {
                setCurrentPassword('');
                setReloadRequired(true);
                setError('La clave del dispositivo cambió mientras guardabas. Recarga la configuración e ingresa la clave vigente. No se guardaron tus cambios.');
            } else if (response?.status === 400) {
                setError('Revisa las claves: deben tener entre 8 y 128 caracteres.');
            } else {
                setError('No se pudo guardar la clave. Verifica tus permisos y la conexión.');
            }
        }
        finally { setBusy(false); setConfirmSave(false); }
    }

    return <section className="mx-auto w-full max-w-2xl space-y-6 py-2 sm:py-6">
        <div className="space-y-2">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#3b6154]/10 text-[#3b6154] dark:text-emerald-400"><ShieldCheck aria-hidden="true" /></div>
            <h1 className="text-2xl font-bold">Acceso de dispositivos</h1>
            <p className="text-sm text-zinc-500">Define la clave compartida para habilitar las reservas. Cada sesión dura 3 horas desde su apertura y puede cerrarse desde la página general.</p>
            <p role="status" className="flex items-center gap-2 pt-2 text-sm font-medium">{loading && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}{loading ? 'Consultando configuración…' : configured === null ? 'Configuración no disponible.' : configured ? 'Clave configurada · acceso disponible con clave' : 'Sin clave · acceso de usuarios bloqueado'}</p>
            {updatedAt && <p className="text-xs text-zinc-500">Última actualización: {new Date(updatedAt).toLocaleString('es-CO')}</p>}
        </div>
        <form onSubmit={save} aria-busy={busy} className="space-y-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-5 sm:p-8">
            <h2 className="text-lg font-semibold">{configured ? 'Cambiar clave compartida' : 'Definir clave compartida'}</h2>
            <fieldset disabled={busy || loading || configured === null || reloadRequired} className="space-y-4">
            {configured && <div className="space-y-2">
                <label htmlFor="current-device-password" className="block text-sm font-medium">Clave actual del dispositivo</label>
                <Input id="current-device-password" type="password" autoComplete="off" minLength={8} maxLength={128} required value={currentPassword} onChange={event => { setCurrentPassword(event.target.value); setCurrentPasswordError(''); }} aria-invalid={!!currentPasswordError} aria-describedby={currentPasswordError ? 'current-device-password-help current-device-password-error' : 'current-device-password-help'} className="text-base" />
                <p id="current-device-password-help" className="text-xs text-zinc-600 dark:text-zinc-400">Usa la clave que habilita los dispositivos, no tu contraseña de ingreso al panel administrativo. De 8 a 128 caracteres.</p>
                {currentPasswordError && <p id="current-device-password-error" role="alert" className="text-sm text-red-700 dark:text-red-300">{currentPasswordError}</p>}
            </div>}
            <label htmlFor="new-password" className="block text-sm font-medium">Nueva clave (8 a 128 caracteres)</label>
            <Input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} className="text-base" />
            <label htmlFor="confirm-password" className="block text-sm font-medium">Confirmar nueva clave</label>
            <Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={event => setConfirmation(event.target.value)} />
            </fieldset>
            <div className="flex gap-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200"><AlertTriangle aria-hidden="true" className="size-5 shrink-0" /><p>Cambiar la clave invalida todas las sesiones abiertas. Todos los dispositivos deberán ingresar la nueva clave. La autenticación administrativa es independiente.</p></div>
            <Button className="min-h-11 w-full sm:w-auto bg-[#3b6154] hover:bg-[#2b473e] text-white" disabled={busy || loading || configured === null || reloadRequired}>{busy && <Loader2 aria-hidden="true" className="animate-spin" />}{busy ? 'Guardando…' : configured ? 'Cambiar clave' : 'Guardar clave'}</Button>
            {message && <p role="status" className="flex gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-4 text-sm text-emerald-800 dark:text-emerald-200"><CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />{message}</p>}
            {error && <p role="alert" className="rounded-xl bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
            {!loading && configured === null && <Button type="button" variant="outline" onClick={loadSettings}>Reintentar consulta</Button>}
            {reloadRequired && <Button type="button" variant="outline" disabled={loading} onClick={loadSettings}>{loading ? 'Recargando…' : 'Recargar configuración'}</Button>}
        </form>
        <ConfirmationDialog isOpen={confirmSave} onClose={() => setConfirmSave(false)} onConfirm={confirmChange} isLoading={busy} title={configured ? '¿Cambiar la clave de todos los dispositivos?' : '¿Habilitar el acceso con esta clave?'} description="Las sesiones abiertas quedarán invalidadas. Comparte la nueva clave con las personas responsables de habilitar los dispositivos. Esta acción no cambia tu contraseña administrativa." confirmText="Confirmar y guardar clave" />
    </section>;
}
