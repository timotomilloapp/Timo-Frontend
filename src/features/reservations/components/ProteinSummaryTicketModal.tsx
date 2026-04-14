'use client';

import { useReservationSummary } from '../hooks/useReservations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, FileText, Loader2 } from 'lucide-react';

interface ProteinSummaryTicketModalProps {
    date: string | null;
    onClose: () => void;
}

export function ProteinSummaryTicketModal({ date, onClose }: ProteinSummaryTicketModalProps) {
    const { data: summary, isLoading } = useReservationSummary(date || '');

    const handlePrint = () => {
        window.print();
    };

    if (!date) return null;

    const formattedDate = format(new Date(date + 'T12:00:00Z'), "EEEE d 'de' MMMM, yyyy", { locale: es });

    return (
        <Dialog open={!!date} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="sm:max-w-[420px] p-0 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden print:w-full print:max-w-none print:shadow-none print:border-none print:p-0 print:bg-white">
                <DialogHeader className="p-6 pb-4 bg-zinc-50 dark:bg-zinc-900 print:hidden shrink-0 border-b border-zinc-200 dark:border-zinc-800">
                    <DialogTitle className="flex justify-between items-center pr-8 text-zinc-900 dark:text-zinc-100">
                        <span>Resumen de Cocina</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="gap-2 shrink-0 bg-white hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 shadow-sm h-8"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Imprimir
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 pt-4 print:p-0 flex-1 overflow-y-auto max-h-[75vh] scrollbar-thin">
                    <div className="bg-white text-zinc-900 mx-auto w-full p-6 sm:p-8 border border-zinc-200 shadow-sm rounded-sm print:shadow-none print:border-none font-mono text-sm relative">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                <p>Cargando resumen...</p>
                            </div>
                        ) : summary ? (
                            <div className="print-ticket">
                                {/* Header */}
                                <div className="text-center pb-6 border-b border-dashed border-zinc-300 mb-6">
                                    <div className="mx-auto w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-white">
                                        <FileText className="h-8 w-8" />
                                    </div>
                                    <h2 className="text-xl font-bold uppercase tracking-widest mb-1 font-sans">Resumen de Cocina</h2>
                                    <p className="text-xs text-zinc-500 uppercase">{formattedDate}</p>
                                </div>

                                {/* Body */}
                                <div className="space-y-4">
                                    <div className="flex justify-between font-bold border-b border-zinc-200 pb-2">
                                        <span>PROTEÍNA</span>
                                        <span>CANT.</span>
                                    </div>

                                    {summary.proteins.length === 0 ? (
                                        <div className="text-center py-4 text-zinc-500 italic">No hay pedidos</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {summary.proteins.map((p: any) => (
                                                <div key={p.proteinTypeId} className="flex justify-between items-center">
                                                    <span className="truncate pr-4">{p.proteinName}</span>
                                                    <span className="font-bold text-lg">{p.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="mt-8 pt-6 border-t border-dashed border-zinc-300 text-center text-xs text-zinc-500 space-y-1">
                                    <p>Totales calculados automáticamente.</p>
                                    <p>TIMOTOMILLO Platform © {new Date().getFullYear()}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-red-500">
                                No se pudo cargar el resumen.
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
            {/* Ocultar el resto de la página al imprimir */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-ticket, .print-ticket * {
                        visibility: visible;
                    }
                    .print-ticket {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </Dialog>
    );
}
