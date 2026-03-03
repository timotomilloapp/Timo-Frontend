'use client';

import React, { useState } from 'react';
import { FileUp, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface WhitelistBulkDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File) => Promise<any>;
    isLoading: boolean;
}

export function WhitelistBulkDialog({ isOpen, onClose, onUpload, isLoading }: WhitelistBulkDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [result, setResult] = useState<{ created: number; skipped: number; errors: { row: number, cc: string, reason: string }[] } | null>(null);

    if (!isOpen) {
        if (file) setFile(null);
        if (error) setError('');
        if (result) setResult(null);
        return null;
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Selecciona un archivo primero');
            return;
        }

        try {
            setError('');
            const res = await onUpload(file);
            setResult({ created: res.created, skipped: res.skipped, errors: res.errors || [] });
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error al procesar el archivo');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                            <FileUp size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Carga Masiva</h2>
                            <p className="text-xs text-zinc-500">Sube un Excel (.xlsx) o CSV</p>
                        </div>
                    </div>
                    {!isLoading && (
                        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {result ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">¡Carga exitosa!</h3>
                            <p className="text-sm text-zinc-500 text-balance mb-4">
                                Se han procesado y guardado correctamente <strong>{result.created}</strong> empleados en la base de datos.
                                {result.skipped > 0 && <span> (Se omitieron <strong>{result.skipped}</strong> registros inválidos).</span>}
                            </p>

                            {result.errors && result.errors.length > 0 && (
                                <div className="w-full text-left mt-2 mb-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg overflow-hidden">
                                    <div className="px-3 py-2 bg-red-100/50 dark:bg-red-900/30 border-b border-red-100 dark:border-red-900/30 font-medium text-xs text-red-800 dark:text-red-400">
                                        Detalle de Errores ({result.errors.length})
                                    </div>
                                    <div className="max-h-32 overflow-y-auto p-2 space-y-1">
                                        {result.errors.map((err, idx) => (
                                            <div key={idx} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                                                <span className="font-mono bg-red-100 dark:bg-red-900/40 px-1 rounded">Fila {err.row}</span>
                                                <span>{err.cc}: {err.reason === 'Missing or invalid cc' ? 'Cédula inválida o vacía' : err.reason === 'Missing or invalid name' ? 'Nombre inválido o vacío' : err.reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className="mt-2 px-4 py-2 text-sm font-bold text-white bg-[#3b6154] hover:bg-[#2b473e] rounded-lg shadow-sm transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 border border-red-200 dark:border-red-900/30">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Archivo</label>
                                <input
                                    type="file"
                                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                    onChange={handleFileChange}
                                    disabled={isLoading}
                                    className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300 dark:hover:file:bg-zinc-700"
                                />
                                <p className="mt-2 text-xs text-zinc-500">Las columnas deben llamarse <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">cc</code> y <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">name</code>.</p>
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
                                    onClick={handleUpload}
                                    disabled={!file || isLoading}
                                    className="px-4 py-2 text-sm font-bold text-white bg-[#3b6154] hover:bg-[#2b473e] rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileUp size={16} />}
                                    Subir Archivo
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
