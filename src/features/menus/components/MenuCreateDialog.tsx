import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, X, AlertCircle, Pencil, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCrudList } from '@/features/admin-crud/hooks/useCrud';
import { apiClient } from '@/services/api-client';
import { useMenuCreate, useMenuUpdate } from '../hooks/useMenus';

interface CrudItem {
    id: string;
    name: string;
    isActive: boolean;
}

interface MenuCreateDialogProps {
    trigger?: React.ReactNode;
    forceOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultDate?: Date;
    editMenu?: any; // We receive MenuResponse if editing
}

export function MenuCreateDialog({ trigger, forceOpen, onOpenChange, defaultDate, editMenu }: MenuCreateDialogProps) {
    const PROTEINS_PER_PAGE = 6;
    const [isOpenInternal, setIsOpenInternal] = useState(false);
    const isOpen = forceOpen !== undefined ? forceOpen : isOpenInternal;
    const isEditing = !!editMenu;

    const handleClose = () => {
        setIsOpenInternal(false);
        if (onOpenChange) onOpenChange(false);
    };
    // Form State
    const [date, setDate] = useState(defaultDate ? defaultDate.toISOString().split('T')[0] : '');
    const [selectedSoup, setSelectedSoup] = useState<string>('');
    const [selectedDrink, setSelectedDrink] = useState<string>('');
    const [selectedProteins, setSelectedProteins] = useState<Set<string>>(new Set());
    const [defaultProtein, setDefaultProtein] = useState<string>('');
    const [selectedSides, setSelectedSides] = useState<Set<string>>(new Set());
    const [proteinSearch, setProteinSearch] = useState('');
    const [proteinPage, setProteinPage] = useState(1);
    const [error, setError] = useState('');

    React.useEffect(() => {
        if (isOpen && editMenu) {
            setDate(editMenu.date.split('T')[0]);
            setSelectedSoup(editMenu.soup?.id || '');
            setSelectedDrink(editMenu.drink?.id || '');
            setDefaultProtein(editMenu.defaultProteinType?.id || '');
            setSelectedProteins(new Set((editMenu.proteinOptions || []).map((po: any) => po.proteinTypeId || po.proteinType?.id)));
            setSelectedSides(new Set((editMenu.sideOptions || []).map((so: any) => so.sideDishId || so.sideDish?.id)));
            setProteinSearch('');
            setProteinPage(1);
        } else if (isOpen && !editMenu) {
            // Reset to defaults
            setDate(defaultDate ? defaultDate.toISOString().split('T')[0] : '');
            setSelectedSoup('');
            setSelectedDrink('');
            setDefaultProtein('');
            setSelectedProteins(new Set());
            setSelectedSides(new Set());
            setProteinSearch('');
            setProteinPage(1);
            setError('');
        }
    }, [isOpen, editMenu, defaultDate]);

    // Fetch Data
    const { data: soups = [], isLoading: isLoadingSoups } = useCrudList<CrudItem>('/soups', { active: true, take: 200 });
    const { data: drinks = [], isLoading: isLoadingDrinks } = useCrudList<CrudItem>('/drinks', { active: true, take: 200 });
    const { data: proteins = [], isLoading: isLoadingProteins } = useQuery({
        queryKey: ['proteins', 'active', 'all'],
        queryFn: async () => {
            const { data } = await apiClient.get<CrudItem[]>('/proteins/active/all');
            return data;
        },
    });
    const { data: sides = [], isLoading: isLoadingSides } = useCrudList<CrudItem>('/side-dishes', { active: true, take: 200 });

    // Filter Active only
    const activeSoups = useMemo(() => soups.filter(s => s.isActive), [soups]);
    const activeDrinks = useMemo(() => drinks.filter(d => d.isActive), [drinks]);
    const activeProteins = useMemo(() => proteins.filter(p => p.isActive), [proteins]);
    const activeSides = useMemo(() => sides.filter(s => s.isActive), [sides]);
    const filteredProteins = useMemo(() => {
        const normalizedSearch = proteinSearch.trim().toLowerCase();
        if (!normalizedSearch) return activeProteins;
        return activeProteins.filter((protein) => protein.name.toLowerCase().includes(normalizedSearch));
    }, [activeProteins, proteinSearch]);
    const totalProteinPages = Math.max(1, Math.ceil(filteredProteins.length / PROTEINS_PER_PAGE));
    const visibleProteins = useMemo(() => {
        const startIndex = (proteinPage - 1) * PROTEINS_PER_PAGE;
        return filteredProteins.slice(startIndex, startIndex + PROTEINS_PER_PAGE);
    }, [filteredProteins, proteinPage]);

    React.useEffect(() => {
        setProteinPage(1);
    }, [proteinSearch]);

    React.useEffect(() => {
        if (proteinPage > totalProteinPages) {
            setProteinPage(totalProteinPages);
        }
    }, [proteinPage, totalProteinPages]);

    const { mutateAsync: createMenu, isPending: isCreating } = useMenuCreate();
    const { mutateAsync: updateMenu, isPending: isUpdating } = useMenuUpdate();

    const isNonServiceDate = (value: string) => {
        if (!value) return false;
        const weekDay = new Date(`${value}T00:00:00`).getDay();
        return weekDay === 0 || weekDay === 6;
    };

    if (!isOpen) {
        if (date) setDate('');
        if (selectedSoup) setSelectedSoup('');
        if (selectedDrink) setSelectedDrink('');
        if (selectedProteins.size > 0) setSelectedProteins(new Set());
        if (defaultProtein) setDefaultProtein('');
        if (selectedSides.size > 0) setSelectedSides(new Set());
        if (proteinSearch) setProteinSearch('');
        if (proteinPage !== 1) setProteinPage(1);
        if (error) setError('');
        return null;
    }

    const isDataLoading = isLoadingSoups || isLoadingDrinks || isLoadingProteins || isLoadingSides;

    const toggleSet = (set: Set<string>, id: string, max?: number) => {
        const next = new Set(set);
        if (next.has(id)) {
            next.delete(id);
        } else {
            if (max && next.size >= max) {
                const arr = Array.from(next);
                next.delete(arr[0]);
                next.add(id);
            } else {
                next.add(id);
            }
        }
        return next;
    };

    const handleToggleProtein = (id: string) => {
        const next = toggleSet(selectedProteins, id);
        setSelectedProteins(next);

        if (next.size === 1 && !defaultProtein) {
            setDefaultProtein(id);
        } else if (!next.has(defaultProtein)) {
            setDefaultProtein(next.size > 0 ? Array.from(next)[0] : '');
        }
    };

    const handleToggleSide = (id: string) => {
        setSelectedSides(toggleSet(selectedSides, id));
    };

    const handleSelectSoup = (id: string) => {
        setSelectedSoup(prev => prev === id ? '' : id);
    };

    const handleSelectDrink = (id: string) => {
        setSelectedDrink(prev => prev === id ? '' : id);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date) {
            setError('Por favor selecciona una fecha.');
            return;
        }
        if (isNonServiceDate(date)) {
            setError('Sbados y domingos no estn disponibles para crear mens.');
            return;
        }
        if (selectedProteins.size === 0) {
            setError('Selecciona al menos una protena.');
            return;
        }
        if (!defaultProtein) {
            setError('Asegrate de tener una protena por defecto.');
            return;
        }

        setError('');
        try {
            const payload = {
                soupId: selectedSoup || undefined,
                drinkId: selectedDrink || undefined,
                proteinOptionIds: Array.from(selectedProteins),
                defaultProteinTypeId: defaultProtein,
                sideOptionIds: Array.from(selectedSides),
            };

            if (isEditing && editMenu) {
                await updateMenu({ id: editMenu.id, payload });
            } else {
                await createMenu({ ...payload, date });
            }
            handleClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error al procesar el men.');
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <>
            {trigger && (
                <div onClick={() => setIsOpenInternal(true)}>{trigger}</div>
            )}

            <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-zinc-950/50 backdrop-blur-sm">
                <div className="w-full h-full sm:h-auto sm:max-h-[calc(100vh-2rem)] max-w-4xl bg-white dark:bg-zinc-950 sm:border border-zinc-200 dark:border-zinc-800 sm:rounded-xl shadow-xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-10 sm:rounded-t-xl">
                        <div className="flex items-center gap-3 text-zinc-900 dark:text-zinc-100">
                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                                {isEditing ? <Pencil size={20} /> : <Plus size={20} />}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{isEditing ? 'Editar Men' : 'Crear Nuevo Men'}</h2>
                                <p className="text-xs text-zinc-500">{isEditing ? 'Modifica los componentes del men' : 'Configura los componentes para la carta'}</p>
                            </div>
                        </div>
                        {!isLoading && (
                            <button type="button" onClick={handleClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {isDataLoading ? (
                        <div className="p-12 text-center text-zinc-500 flex-1 flex flex-col items-center justify-center">
                            <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin mx-auto mb-4" />
                            <p>Cargando catlogo...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
                                {error && (
                                    <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 border border-red-200 dark:border-red-900/30">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-2 flex block">
                                        Fecha del Men *
                                    </label>
                                    <input
                                        type="date"
                                        value={date}
                                        min={new Date().toLocaleDateString('en-CA')}
                                        onChange={(e) => {
                                            const nextDate = e.target.value;
                                            setDate(nextDate);
                                            if (isNonServiceDate(nextDate)) {
                                                setError('Sbados y domingos no estn disponibles para crear mens.');
                                            } else if (error === 'Sbados y domingos no estn disponibles para crear mens.') {
                                                setError('');
                                            }
                                        }}
                                        disabled={isLoading}
                                        required
                                        className="w-full sm:w-1/2 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-colors disabled:opacity-50"
                                    />
                                    <p className="text-xs text-zinc-500">Sbados y domingos estn bloqueados para la creacin de mens.</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                        <label className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                                            <span>Protenas <span className="text-[#3b6154] dark:text-[#528775]">*</span></span>
                                            <span className="text-xs font-normal text-zinc-500">Selecciona una o ms</span>
                                        </label>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                            <input
                                                type="text"
                                                value={proteinSearch}
                                                onChange={(e) => setProteinSearch(e.target.value)}
                                                placeholder="Buscar protena..."
                                                disabled={isLoading}
                                                className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-zinc-500">
                                            <span>
                                                {filteredProteins.length === 0
                                                    ? 'Sin resultados'
                                                    : `Mostrando ${visibleProteins.length} de ${filteredProteins.length} protenas`}
                                            </span>
                                            {filteredProteins.length > PROTEINS_PER_PAGE && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setProteinPage((current) => Math.max(1, current - 1))}
                                                        disabled={proteinPage === 1 || isLoading}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                                    >
                                                        <ChevronLeft size={14} />
                                                    </button>
                                                    <span>Pgina {proteinPage} de {totalProteinPages}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setProteinPage((current) => Math.min(totalProteinPages, current + 1))}
                                                        disabled={proteinPage === totalProteinPages || isLoading}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                                    >
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {visibleProteins.map(p => {
                                            const isSelected = selectedProteins.has(p.id);
                                            const isDefault = defaultProtein === p.id;
                                            return (
                                                <div key={p.id} className={`flex items-start gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900/10 dark:ring-zinc-100/10 bg-zinc-50 dark:bg-zinc-900/40' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleProtein(p.id)}
                                                        disabled={isLoading}
                                                        className="mt-0.5 w-4 h-4 flex-shrink-0 text-zinc-900 dark:text-zinc-100 rounded border-zinc-300 dark:border-zinc-600"
                                                    />
                                                    <div className="flex-1 flex flex-col items-start">
                                                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug" onClick={() => handleToggleProtein(p.id)}>{p.name}</span>
                                                        {isSelected && (
                                                            <label className="mt-1.5 flex items-center gap-1.5 cursor-pointer text-xs text-zinc-500" onClick={(e) => e.stopPropagation()}>
                                                                <input
                                                                    type="radio"
                                                                    name="defaultProtein"
                                                                    checked={isDefault}
                                                                    onChange={() => setDefaultProtein(p.id)}
                                                                    disabled={isLoading}
                                                                    className="w-3 h-3 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-600"
                                                                />
                                                                Por defecto
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {activeProteins.length === 0 && <p className="text-sm text-zinc-400 italic">No hay protenas activas creadas.</p>}
                                </div>
                            </div>

                            <div className="flex-shrink-0 p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 text-right sm:rounded-b-xl flex justify-end gap-3 z-10">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isLoading}
                                    className="px-4 sm:px-6 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-4 sm:px-6 py-2 text-sm font-bold bg-[#3b6154] hover:bg-[#2b473e] text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    {isEditing ? 'Guardar Cambios' : 'Crear Men'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
