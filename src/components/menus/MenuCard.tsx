import React, { useState, useEffect } from 'react';
import { Menu } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coffee, Drumstick, Salad, Check, Loader2, Pencil, Trash2, ReceiptText, X } from 'lucide-react';
import { reservationService } from '@/services/reservation-service';
import { authService } from '@/services/auth-service';

interface MenuCardProps {
    date: Date;
    menu: Menu | null;
    isLoading: boolean;
    cedula: string;
    userName?: string;
    onReservationSuccess: () => void;
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function MenuCard({ date, menu, isLoading, cedula, userName, onReservationSuccess }: MenuCardProps) {
    const [selectedProteinId, setSelectedProteinId] = useState<string | null>(null);
    const [isReserving, setIsReserving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showTicket, setShowTicket] = useState(false);
    const [reservationError, setReservationError] = useState<string | null>(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isTomorrowOrLater = date.getTime() > today.getTime();

    // Initialize the selected protein if there is a reservation
    useEffect(() => {
        if (menu?.reservedProteinId) {
            setSelectedProteinId(menu.reservedProteinId);
        } else if (menu?.defaultProteinType && !isTomorrowOrLater) {
            setSelectedProteinId(menu.defaultProteinType.id);
        }
    }, [menu?.reservedProteinId, menu?.defaultProteinType, isTomorrowOrLater]);

    const dayName = DAYS[date.getDay()];
    const dateString = `${date.getDate()} de ${MONTHS[date.getMonth()]}`;

    if (isLoading) {
        return (
            <div className="flex flex-col w-full h-full pb-4">
                <Card className="h-[480px] sm:h-[500px] flex flex-col w-full min-w-0 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                    <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-1"></div>
                        <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800/50 rounded animate-pulse"></div>
                    </CardHeader>
                    <CardContent className="flex-1 p-5 flex items-center justify-center">
                        <div className="h-8 w-8 border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin"></div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!menu) {
        return (
            <div className="flex flex-col w-full h-full pb-4">
                <Card className="h-[480px] sm:h-[500px] flex flex-col w-full min-w-0 border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/50 opacity-60">
                    <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                        <CardTitle className="text-lg font-bold tracking-tight">{dayName}</CardTitle>
                        <CardDescription className="text-xs font-medium uppercase tracking-wider">{dateString}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-2">
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-500">
                            No hay menú <br /> disponible para este día
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { id: menuId, drink, defaultProteinType, proteinOptions, sideOptions, status, hasReservation, reservationId, reservedProteinId } = menu;
    const isServed = status === 'SERVED';
    const showReservedState = hasReservation && !isServed && !isEditing;
    const isLocked = isServed || showReservedState;

    // Preparar lista de proteínas evitando duplicados
    const allProteinsRaw = [
        defaultProteinType ? { id: defaultProteinType.id, name: defaultProteinType.name } : null,
        ...(proteinOptions?.map(p => ({ id: p.proteinType.id, name: p.proteinType.name })) || [])
    ].filter(Boolean) as { id: string, name: string }[];

    const allProteins = Array.from(new Map(allProteinsRaw.map(p => [p.id, p])).values());

    const handleReserve = async () => {
        if (!selectedProteinId || isReserving) return;
        setIsReserving(true);
        setReservationError(null);
        try {
            if (isEditing && reservationId) {
                await reservationService.update(reservationId, {
                    cc: cedula,
                    proteinTypeId: selectedProteinId
                });
                setIsEditing(false);
            } else {
                await reservationService.create({
                    cc: cedula,
                    menuId,
                    proteinTypeId: selectedProteinId
                });
            }
            onReservationSuccess();
            setShowTicket(true);
        } catch (error: any) {
            const apiMessage = error.response?.data?.message;
            const errorMessage = apiMessage || (isEditing ? 'No se pudo actualizar la reserva.' : 'No se pudo completar la reserva.');
            setReservationError(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
        } finally {
            setIsReserving(false);
        }
    };

    const performDeleteReservation = async () => {
        if (!reservationId || isDeleting) return;

        setIsDeleting(true);
        setReservationError(null);
        try {
            await reservationService.deleteReservation(reservationId, cedula);
            setIsEditing(false);
            setShowDeleteConfirm(false);
            setSelectedProteinId(null);
            onReservationSuccess();
        } catch (error: any) {
            const apiMessage = error.response?.data?.message;
            const errorMessage = apiMessage || 'No se pudo eliminar la reserva.';
            setReservationError(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
            setShowDeleteConfirm(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePrintTicket = () => {
        if (!menu || !selectedProteinId) return;

        const proteinName = allProteinsRaw.find(p => p?.id === selectedProteinId)?.name || 'Sin especificar';

        // Formato para ticket/impresora térmica (POS) - 58mm/80mm style
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const ticketHtml = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ticket Reserva TIMO</title>
                <style>
                    @page { margin: 0; size: auto; }
                    body { 
                        font-family: 'Courier New', Courier, monospace; 
                        width: 300px; /* Ancho típico de impresora POS 80mm */
                        margin: 0 auto;
                        padding: 20px 10px;
                        color: #000;
                        background: #fff;
                        font-size: 14px;
                        line-height: 1.4;
                    }
                    .text-center { text-align: center; }
                    .font-bold { font-weight: bold; }
                    .text-xl { font-size: 24px; }
                    .text-sm { font-size: 12px; }
                    .text-md { font-size: 16px; }
                    .my-2 { margin: 10px 0; }
                    .my-4 { margin: 20px 0; }
                    .border-b { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                    .flex-between { display: flex; justify-content: space-between; gap: 10px;}
                    .uppercase { text-transform: uppercase; }
                    .label { font-weight: normal; font-size: 12px; }
                    .value { font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="text-center">
                    <div class="font-bold text-xl tracking-tighter my-2 border-b" style="font-family: sans-serif; letter-spacing: -1px; color: #3b6154;">TIMO<span style="color: #061210;">TOMILLO</span></div>
                    <div class="font-bold my-2">RESERVA DE ALMUERZO</div>
                    <div class="text-sm my-2">${dateString}</div>
                </div>
                
                <div class="my-4 border-b">
                    <div class="flex-between my-2">
                        <span class="label">NOMBRE:</span>
                        <span class="value" style="text-align: right; max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${userName || 'No especificado'}</span>
                    </div>
                    <div class="flex-between my-2">
                        <span class="label">C.C:</span>
                        <span class="value">${cedula}</span>
                    </div>
                </div>

                <div class="my-4 border-b">
                    <div class="label text-center mb-1">PROTEÍNA SELECCIONADA</div>
                    <div class="value text-md text-center uppercase my-2">${proteinName}</div>
                </div>

                <div class="text-center text-sm my-4">
                    Comprobante generado el<br/>
                    ${new Date().toLocaleString('es-CO')}
                </div>
                <div class="text-center font-bold my-4">
                    *** GRACIAS ***
                </div>
                <script>
                    window.onload = function() { 
                        setTimeout(function() {
                            window.print(); 
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(ticketHtml);
        printWindow.document.close();

        // Cierra sesión y redirige tras imprimir el ticket para agilizar el proceso
        setTimeout(() => {
            authService.logout('/');
        }, 1000);
    };

    return (
        <div className="flex flex-col w-full h-full pb-4">
            <Card className={`h-[480px] sm:h-[500px] md:h-[580px] xl:h-[500px] flex flex-col w-full min-w-0 overflow-hidden border-zinc-200 dark:border-zinc-800 transition-all duration-300 ${isServed ? 'bg-zinc-50 dark:bg-zinc-950 opacity-70 grayscale-[0.2]' : 'bg-white dark:bg-zinc-900 ' + (showReservedState ? 'border-[#3b6154]/60 dark:border-[#3b6154]/50 shadow-[0_0_15px_rgba(59,97,84,0.15)] dark:shadow-[0_0_15px_rgba(59,97,84,0.25)]' : 'hover:border-[#3b6154]/50 dark:hover:border-[#3b6154]/50 hover:shadow-[0_8px_25px_rgba(59,97,84,0.15)] dark:hover:shadow-[0_8px_25px_rgba(59,97,84,0.25)]')}`}>
                <CardHeader className={`pb-1 pt-4 border-b border-[#3b6154] dark:border-[#3b6154] flex flex-row !items-center justify-between gap-2 px-4 !grid-none !auto-rows-auto min-h-[62px] text-white bg-[#3b6154]`}>
                    <div className="flex flex-col justify-center flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <CardTitle className={`text-lg font-bold tracking-tight leading-none truncate text-white`}>
                                {dayName}
                            </CardTitle>
                            {showReservedState && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#d8efe3] bg-[#274037] px-2 py-0.5 rounded-full shrink-0">
                                    Reservaste
                                </span>
                            )}
                            {isServed && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 bg-white/70 px-2 py-0.5 rounded-full shrink-0">
                                    Servido
                                </span>
                            )}
                            {isEditing && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#3b6154] bg-white px-2 py-0.5 rounded-full shrink-0">
                                    Editando
                                </span>
                            )}
                        </div>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-white/70 mt-1 truncate">
                            {dateString}
                        </CardDescription>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0">
                        {showReservedState && (
                            <div className="flex bg-white/10 border border-white/20 rounded-md overflow-hidden disabled:opacity-50">
                                <button
                                    onClick={() => setShowTicket(true)}
                                    disabled={isDeleting}
                                    className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                                    title="Ver ticket de reserva"
                                >
                                    <ReceiptText size={14} />
                                </button>
                                {isTomorrowOrLater && (
                                    <>
                                        <div className="w-px bg-white/20"></div>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            disabled={isDeleting}
                                            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                                            title="Editar reserva"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <div className="w-px bg-white/20"></div>
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            disabled={isDeleting}
                                            className="p-1.5 text-white/80 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                                            title="Eliminar reserva"
                                        >
                                            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {/* Bebida Block - Desactivado visualmente
                    <div className={`p-4 flex flex-col gap-2 transition-colors ${!isLocked && 'group hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 mb-1">
                            <Coffee size={14} />
                            <span className="text-xs font-bold uppercase tracking-widest">Bebida</span>
                        </div>
                        <p className={`text-sm font-medium ${(isServed || showReservedState) ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                            {drink ? drink.name : 'No especificada'}
                        </p>
                    </div>
                    */}

                    {/* Proteína Block */}
                    <div className={`p-4 flex flex-col gap-2 transition-colors ${!isLocked && 'group hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 mb-1">
                            <Drumstick size={14} />
                            <span className="text-xs font-bold uppercase tracking-widest">Proteínas</span>
                        </div>
                        {!isTomorrowOrLater && !isServed && !hasReservation && (
                            <p className="text-[10px] text-orange-500 dark:text-orange-400 leading-tight">
                                Para reservas de hoy o pasadas, se asigna la proteína por defecto.
                            </p>
                        )}
                        {allProteins.length > 0 ? (
                            <div className="space-y-2 mt-1">
                                {allProteins.map((p) => {
                                    const isSelected = selectedProteinId === p.id;

                                    // Determinar estilos condicionales
                                    let buttonClass = 'border-transparent text-zinc-500 dark:text-zinc-400 cursor-default px-0'; // Default para bloqueados no seleccionados

                                    if (showReservedState && isSelected) {
                                        // Highlight para la proteína reservada
                                        buttonClass = 'border-[#3b6154]/50 bg-[#3b6154]/80 dark:bg-[#3b6154]/80 text-white font-bold shadow-sm px-3';
                                    } else if (!isLocked) {
                                        // Modos interactivos
                                        if (isSelected) {
                                            buttonClass = 'border-[#3b6154]/80 bg-[#3b6154]/90 dark:bg-[#3b6154]/80 text-white font-bold shadow-sm px-3';
                                        } else {
                                            buttonClass = 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-3';
                                        }
                                    }

                                    const isProteinSelectionLocked = isLocked || (!isTomorrowOrLater && !showReservedState);

                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => !isProteinSelectionLocked && setSelectedProteinId(prev => prev === p.id ? null : p.id)}
                                            disabled={isProteinSelectionLocked}
                                            className={`w-full flex items-center justify-between text-left text-sm font-medium py-2 rounded-md border transition-all ${buttonClass}`}
                                        >
                                            <span className="flex items-center gap-2">
                                                {isLocked && !isSelected && <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>}
                                                {p.name}
                                            </span>
                                            {isSelected && <Check size={14} />}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm font-medium text-zinc-500 italic">No especificadas</p>
                        )}
                    </div>

                    {/* SideDishes Block - Desactivado visualmente
                    <div className={`p-4 flex flex-col gap-2 transition-colors ${!isLocked && 'group hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 mb-1">
                            <Salad size={14} />
                            <span className="text-xs font-bold uppercase tracking-widest">Acompañamientos</span>
                        </div>
                        {sideOptions && sideOptions.length > 0 ? (
                            <ul className="space-y-1.5 mt-1">
                                {sideOptions.map((s, idx) => (
                                    <li key={idx} className={`text-sm font-medium flex items-center gap-2 ${(isServed || showReservedState) ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                                        {s.sideDish.name}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm font-medium text-zinc-500 italic">No especificados</p>
                        )}
                    </div>
                    */}
                </CardContent>
            </Card>

            {/* Acciones de Reserva Flotando Debajo */}
            {!isServed && !showReservedState && (selectedProteinId || isEditing) && (
                <div className="mt-4 flex flex-col gap-3 px-1 animate-in slide-in-from-top-2 fade-in duration-200">
                    {reservationError && (
                        <p className="text-xs text-red-600 dark:text-red-400 text-center font-medium">
                            {reservationError}
                        </p>
                    )}

                    <Button
                        className="w-full font-bold uppercase tracking-wider text-xs shadow-md p-4 h-auto bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors rounded-xl"
                        disabled={!selectedProteinId || isReserving}
                        onClick={handleReserve}
                    >
                        {isReserving ? (
                            <span className="flex items-center gap-2 justify-center">
                                <Loader2 size={14} className="animate-spin" />
                                Guardando...
                            </span>
                        ) : (isEditing ? 'Guardar Cambios' : 'RESERVAR')}
                    </Button>

                    {isEditing && (
                        <Button
                            variant="outline"
                            className="w-full text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 bg-transparent dark:bg-transparent rounded-xl h-auto py-3"
                            onClick={() => {
                                setIsEditing(false);
                                setSelectedProteinId(reservedProteinId || null);
                                setReservationError(null);
                            }}
                            disabled={isReserving}
                        >
                            Cancelar edición
                        </Button>
                    )}
                </div>
            )}

            {/* Modal de Confirmación de Eliminación Personalizado */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-[2px] flex-col">
                    <div className="w-56 p-4 shadow-xl border border-red-200/50 dark:border-red-900/30 bg-white dark:bg-zinc-900 rounded-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-3 text-red-600 dark:text-red-500">
                            <Trash2 size={18} />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1.5 leading-tight text-center">¿Eliminar Reserva?</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-5 leading-relaxed">
                            Puedes quedarte sin proteína asignada.
                        </p>
                        <div className="flex gap-2 w-full">
                            <Button
                                variant="outline"
                                className="flex-1 text-[10px] h-8 font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 px-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className="flex-1 text-[10px] h-8 font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white border-none px-0 shadow-sm"
                                onClick={performDeleteReservation}
                                disabled={isDeleting}
                            >
                                {isDeleting ? <Loader2 size={12} className="animate-spin" /> : 'Eliminar'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Ticket POS */}
            {showTicket && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-[2px] flex-col"
                    onClick={() => setShowTicket(false)}
                >
                    <div
                        className="w-72 md:w-80 p-0 shadow-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* Ticket Content (Simulated POS) */}
                        <div className="bg-white p-6 text-zinc-900 font-mono text-sm border-b border-zinc-200 dark:border-zinc-800 dashed border-b-2" style={{ borderBottomStyle: 'dashed' }}>
                            <div className="text-center border-b border-zinc-300 pb-4 mb-4" style={{ borderBottomStyle: 'dashed' }}>
                                <div className="font-extrabold text-3xl tracking-tighter font-sans mb-1 text-[#3b6154]">TIMO<span style={{ color: '#061210' }}>TOMILLO</span></div>
                                <div className="font-bold text-xs uppercase">Reserva de Almuerzo</div>
                                <div className="text-xs mt-1">{dateString}</div>
                            </div>

                            <div className="flex justify-between items-center py-1 gap-2">
                                <span className="text-zinc-500">Nombre:</span>
                                <span className="font-bold text-right truncate overflow-hidden max-w-[160px]" title={userName || 'No especificado'}>{userName || 'No especificado'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-zinc-500">C.C:</span>
                                <span className="font-bold">{cedula}</span>
                            </div>

                            <div className="mt-4 border-t border-zinc-300 pt-4 flex flex-col items-center" style={{ borderTopStyle: 'dashed' }}>
                                <span className="text-xs text-zinc-500 mb-1">PROTEÍNA SELECCIONADA</span>
                                <span className="font-bold text-base uppercase text-center">
                                    {allProteinsRaw.find(p => p?.id === selectedProteinId)?.name || 'Sin especificar'}
                                </span>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex flex-col gap-2 p-3 bg-zinc-50 dark:bg-zinc-900">
                            <Button
                                className="w-full text-xs font-bold uppercase tracking-wider bg-[#3b6154] hover:bg-zinc-200 text-white hover:text-zinc-900 border-none shadow-sm flex gap-2 items-center transition-colors duration-300"
                                onClick={handlePrintTicket}
                            >
                                <ReceiptText size={14} /> Imprimir Ticket
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                onClick={() => setShowTicket(false)}
                            >
                                Ver menú
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
