import React, { useEffect, useState } from 'react';
import { X, Calendar, MapPin, AlertCircle } from 'lucide-react';

interface WhitelistCompleteDataDialogProps {
    isOpen: boolean;
    entry: any | null;
    areas: any[];
    onClose: () => void;
    onSave: (data: { areaId?: string | null; birthdate?: string | null }) => Promise<void>;
    isLoading?: boolean;
}

export function WhitelistCompleteDataDialog({ isOpen, entry, areas, onClose, onSave, isLoading }: WhitelistCompleteDataDialogProps) {
    const [areaId, setAreaId] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && entry) {
            setAreaId(entry.area?.id || entry.areaId || '');
            setBirthdate(entry.birthdate ? entry.birthdate.split('T')[0] : '');
            setError('');
        }
    }, [isOpen, entry]);

    if (!isOpen || !entry) return null;

    const isMissingData = !entry.areaId || !entry.birthdate;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!areaId) {
            setError('Seleccione un área válida');
            return;
        }
        if (!birthdate) {
            setError('La fecha de cumpleaños es requerida');
            return;
        }

        try {
            setError('');
            await onSave({ areaId, birthdate });
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error al actualizar los datos');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Completar Datos</h2>
                        <p className="text-sm text-zinc-500">{entry.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-4 overflow-y-auto">
                    {isMissingData && (
                        <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 p-3 rounded-lg flex gap-3 text-sm border border-amber-200 dark:border-amber-800/50">
                            <AlertCircle className="shrink-0 mt-0.5" size={16} />
                            <p>Este usuario no tiene registrado su Área o Fecha de Nacimiento. Por favor completa estos datos.</p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex gap-3 text-sm border border-red-200 dark:border-red-900/30">
                            <AlertCircle className="shrink-0 mt-0.5" size={16} />
                            <p>{error}</p>
                        </div>
                    )}

                    <form id="complete-data-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                <MapPin size={16} className="text-[#3b6154]" />
                                Área
                            </label>
                            <select
                                value={areaId}
                                onChange={e => setAreaId(e.target.value)}
                                disabled={isLoading}
                                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b6154] dark:text-white transition-colors"
                            >
                                <option value="">Selecciona un área...</option>
                                {areas.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                <Calendar size={16} className="text-[#3b6154]" />
                                Fecha de Nacimiento
                            </label>
                            <input
                                type="date"
                                value={birthdate}
                                onChange={e => setBirthdate(e.target.value)}
                                disabled={isLoading}
                                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b6154] dark:text-white transition-colors"
                            />
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2 bg-zinc-50 dark:bg-zinc-950 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="complete-data-form"
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-bold text-white bg-[#3b6154] hover:bg-[#2b473e] rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Guardando...' : 'Guardar Datos'}
                    </button>
                </div>
            </div>
        </div>
    );
}
