'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useReservationsByDate } from '@/features/reservations/hooks/useReservations';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Printer, ArrowLeft, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TicketsGeneratorPage() {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const { data: reservations, isLoading } = useReservationsByDate(todayStr);

    // Valor en el input
    const [inputValue, setInputValue] = useState('');
    // Valor que se usó para buscar (al dar click en la lupa o enter)
    const [searchCc, setSearchCc] = useState('');
    // Control de visibilidad del autocompletado
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const autocompleteRef = useRef<HTMLDivElement>(null);

    const tickets = useMemo(() => {
        if (!reservations) return [];
        return reservations.filter(r => r.status === 'RESERVADA' || r.status === 'AUTO_ASIGNADA');
    }, [reservations]);

    // Opciones de autocompletado (mostrar si hay 5 o más caracteres)
    const autocompleteResults = useMemo(() => {
        if (inputValue.length < 5) return [];
        return tickets.filter(t => t.cc.includes(inputValue)).slice(0, 5); // Mostrar máximo 5 opciones sugeridas
    }, [inputValue, tickets]);

    const matchingTicket = useMemo(() => {
        if (!searchCc.trim()) return null;
        return tickets.find(t => t.cc === searchCc.trim());
    }, [searchCc, tickets]);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSearchCc(inputValue.trim());
        setShowAutocomplete(false);
    };

    const handleSelectOption = (cc: string) => {
        setInputValue(cc);
        setSearchCc(cc);
        setShowAutocomplete(false);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleClear = () => {
        setInputValue('');
        setSearchCc('');
        setShowAutocomplete(false);
    };

    // Cerrar autocomplete al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
                setShowAutocomplete(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500 mb-4" />
                <p className="text-zinc-500 font-medium">Cargando reservaciones...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
            {/* Cabecera (no visible en impresión) */}
            <div className="print:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10 transition-colors">
                <div className="flex items-center gap-4">
                    <Link href="/admin/reservations" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-white shrink-0">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight">TICKETS para el servicio de {format(new Date(), "dd 'de' MMMM", { locale: es })}</h1>
                        <p className="text-sm text-zinc-500">
                            {tickets.length} reservas confirmadas cargadas
                        </p>
                    </div>
                </div>

                <div className="relative w-full sm:w-[400px]" ref={autocompleteRef}>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                type="text"
                                placeholder="Digita el documento (CC)..."
                                className="pl-3 h-10 w-full bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 transition-all font-mono"
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    setShowAutocomplete(true);
                                }}
                                onFocus={() => setShowAutocomplete(true)}
                                autoFocus
                            />
                        </div>
                        <Button type="submit" className="h-10 px-4 bg-zinc-900 hover:bg-zinc-800 text-white shrink-0">
                            <Search className="h-4 w-4 shrink-0" />
                        </Button>
                    </form>

                    {/* Autocomplete Dropdown */}
                    {showAutocomplete && inputValue.length >= 5 && autocompleteResults.length > 0 && (
                        <div className="absolute top-full left-0 right-14 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg overflow-hidden z-20 animate-in fade-in slide-in-from-top-1">
                            <div className="py-1">
                                {autocompleteResults.map(res => (
                                    <button
                                        key={res.id}
                                        onClick={() => handleSelectOption(res.cc)}
                                        className="w-full text-left px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex flex-col items-start transition-colors"
                                    >
                                        <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                            {res.cc}
                                        </span>
                                        <span className="text-xs text-zinc-500 uppercase truncate w-full">
                                            {res.name || 'Sin nombre'} • {res.proteinType?.name || 'Por defecto'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Contenedor Principal (búsqueda y visualización) */}
            <div className="flex-1 p-6 print:p-0 flex flex-col items-center justify-center">

                {!searchCc.trim() ? (
                    <div className="text-center py-20 text-zinc-500 print:hidden flex flex-col items-center max-w-sm">
                        <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 rounded-full flex items-center justify-center mb-4">
                            <Search size={28} />
                        </div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Busca la reserva</h2>
                        <p className="text-sm">Digita el número de cédula y usa el botón de buscar o selecciona del listado para generar el ticket.</p>
                    </div>
                ) : !matchingTicket ? (
                    <div className="text-center py-20 text-red-500 print:hidden flex flex-col items-center max-w-sm bg-red-50 dark:bg-red-950/20 p-8 rounded-2xl border border-red-100 dark:border-red-900/50">
                        <h2 className="text-lg font-bold mb-2">Reserva no encontrada</h2>
                        <p className="text-sm text-red-600/80 dark:text-red-400">No se encontró una reserva confirmada para el documento <strong>{searchCc}</strong> el día de hoy.</p>
                        <button
                            onClick={handleClear}
                            className="mt-6 text-sm font-medium underline underline-offset-4 hover:text-red-700"
                        >
                            Intentar con otro documento
                        </button>
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* El Ticket a Imprimir */}
                        <div className="print:block print:w-[300px] print:m-0 mx-auto w-full max-w-sm">
                            <div className="bg-white border border-zinc-200 shadow-xl rounded-xl overflow-hidden flex flex-col font-mono text-xs print:border-none print:shadow-none print:rounded-none">
                                {/* Ticket Content */}
                                <div className="p-6 text-zinc-900 w-full" style={{ padding: '24px 16px' }}>
                                    <div className="text-center border-b border-zinc-300 pb-3 mb-3" style={{ borderBottomStyle: 'dashed' }}>
                                        <div className="font-extrabold text-3xl tracking-tighter font-sans mb-1" style={{ letterSpacing: '-1.5px' }}>TIMO<span className="text-[#3b6154]">TOMILLO</span></div>
                                        <div className="font-bold text-[14px] uppercase tracking-wider">RESERVA DE ALMUERZO</div>
                                        <div className="text-[14px] mt-1 text-zinc-600">{format(new Date(), "dd 'de' MMMM", { locale: es })}</div>
                                    </div>

                                    <div className="my-4 border-b border-zinc-300 pb-4" style={{ borderBottomStyle: 'dashed' }}>
                                        <div className="flex justify-between items-center py-1.5">
                                            <span className="font-normal text-[13px] text-zinc-500">C.C:</span>
                                            <span className="font-bold text-[14px] tracking-widest">{matchingTicket.cc}</span>
                                        </div>
                                        <div className="flex justify-between items-start py-1.5">
                                            <span className="font-normal text-[13px] text-zinc-500 mt-0.5">NOMBRE:</span>
                                            <span className="font-bold text-[13px] uppercase text-right max-w-[150px] leading-tight">
                                                {matchingTicket.name || 'SIN NOMBRE'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="my-5 border-b border-zinc-300 pb-5 flex flex-col items-center" style={{ borderBottomStyle: 'dashed' }}>
                                        <span className="text-[12px] text-zinc-500 mb-2 font-medium tracking-widest">PLATO PRINCIPAL</span>
                                        <span className="font-black text-[18px] uppercase text-center mt-1 tracking-tight">
                                            {matchingTicket.proteinType?.name || 'POR DEFECTO'}
                                        </span>
                                    </div>

                                    <div className="text-center text-[11px] text-zinc-500 my-4 leading-relaxed">
                                        Generado el<br />
                                        {format(new Date(), "dd/MM/yyyy HH:mm:ss")}
                                    </div>
                                    <div className="text-center font-bold text-[13px] my-4 mb-0 tracking-widest">
                                        *** GRACIAS ***
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Botones de acción Ocultos en Impresión */}
                        <div className="mt-8 print:hidden flex items-center gap-4">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-white px-8 py-4 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <Printer size={20} />
                                IMPRIMIR TICKET
                            </button>
                            <button
                                onClick={handleClear}
                                className="px-6 py-4 font-bold text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
                            >
                                NUEVA BÚSQUEDA
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Estilos globales para la impresión POS térmico */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: 80mm auto; /* Adaptable a impresoras térmicas típicas de 80mm */
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: white;
                        color: black;
                        font-family: 'Courier New', Courier, monospace;
                    }
                }
            `}</style>
        </div>
    );
}
