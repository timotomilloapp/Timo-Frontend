import React from 'react';
import { X, User, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { WhitelistEntry } from '../hooks/useWhitelist';

interface WhitelistInfoDialogProps {
    isOpen: boolean;
    entry: WhitelistEntry | null;
    onClose: () => void;
    onOpenCompleteData: () => void;
}

export function WhitelistInfoDialog({ isOpen, entry, onClose, onOpenCompleteData }: WhitelistInfoDialogProps) {
    if (!isOpen || !entry) return null;

    const hasMissingData = !entry.areaId || !entry.birthdate;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Información</h2>
                            <p className="text-xs text-zinc-500">Detalles del empleado</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Nombre</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{entry.name}</p>
                    </div>
                    
                    <div>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Cédula (CC)</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{entry.cc}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-zinc-400" />
                        <div>
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Área</p>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {entry.area?.name ? entry.area.name : <span className="text-zinc-400 italic">No registrada</span>}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-zinc-400" />
                        <div>
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Cumpleaños</p>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {entry.birthdate ? new Date(entry.birthdate).toLocaleDateString('es-CO', { timeZone: 'UTC' }) : <span className="text-zinc-400 italic">No registrado</span>}
                            </p>
                        </div>
                    </div>

                    {hasMissingData && (
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50 flex flex-col gap-3">
                            <div className="flex gap-2 text-amber-800 dark:text-amber-400 text-sm">
                                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                                <p>Este usuario no tiene registrado su Área o Fecha de Nacimiento.</p>
                            </div>
                            <button
                                onClick={() => {
                                    onClose();
                                    onOpenCompleteData();
                                }}
                                className="w-full px-3 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-600/80 dark:hover:bg-amber-600 rounded-md transition-colors"
                            >
                                Actualizar Datos
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-end p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
