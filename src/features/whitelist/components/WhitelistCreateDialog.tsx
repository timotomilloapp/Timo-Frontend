'use client';

import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';

interface WhitelistCreateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    areas: { id: string; name: string }[];
    onSave: (payload: { cc: string; name: string; birthdate: string | null; areaId: string | null }) => Promise<void>;
    isLoading: boolean;
}

export function WhitelistCreateDialog({ isOpen, onClose, areas, onSave, isLoading }: WhitelistCreateDialogProps) {
    const [name, setName] = useState('');
    const [cc, setCc] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [areaId, setAreaId] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) {
        if (name) setName('');
        if (cc) setCc('');
        if (birthdate) setBirthdate('');
        if (areaId) setAreaId('');
        if (error) setError('');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError('');
            await onSave({ 
                name, 
                cc, 
                birthdate: birthdate || null, 
                areaId: areaId || null 
            });
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error al crear el empleado');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900/80 flex items-center justify-center text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Nuevo Empleado</h2>
                            <p className="text-xs text-zinc-500">Registrar en whitelist</p>
                        </div>
                    </div>
                    {!isLoading && (
                        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 border border-red-200 dark:border-red-900/30">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Cédula (CC)</label>
                            <input
                                type="text"
                                value={cc}
                                onChange={e => setCc(e.target.value)}
                                minLength={4}
                                maxLength={32}
                                required
                                disabled={isLoading}
                                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Nombre</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                minLength={2}
                                required
                                disabled={isLoading}
                                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Cumpleaños</label>
                            <input
                                type="date"
                                value={birthdate}
                                onChange={e => setBirthdate(e.target.value)}
                                disabled={isLoading}
                                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-zinc-900 dark:text-zinc-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Área</label>
                            <select
                                value={areaId}
                                onChange={e => setAreaId(e.target.value)}
                                disabled={isLoading}
                                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-zinc-900 dark:text-zinc-100"
                            >
                                <option value="">Seleccionar área (opcional)</option>
                                {areas.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 bg-zinc-900 dark:bg-white rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center gap-2"
                        >
                            {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Crear
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
