import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { MenuResponse } from '../hooks/useMenus';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface MenuDetailsDialogProps {
    menu: MenuResponse | null;
    onClose: () => void;
}

export function MenuDetailsDialog({ menu, onClose }: MenuDetailsDialogProps) {
    if (!menu) return null;

    return (
        <Dialog open={!!menu} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                <DialogHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <DialogTitle className="text-xl">Detalles del Menú</DialogTitle>
                    <DialogDescription>
                        Ítems programados para este día.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Principales (Sopa y Jugo) - Desactivado visualmente
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                Principales
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-zinc-500 dark:text-zinc-400 block mb-1">🥣 Sopa</span>
                                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{menu.soup?.name || 'No aplica'}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500 dark:text-zinc-400 block mb-1">🥤 Jugo</span>
                                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{menu.drink?.name || 'No aplica'}</span>
                                </div>
                            </div>
                        </div>
                        */}

                        {/* Opciones de Proteína */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                Opciones de Proteína
                            </h3>
                            {menu.proteinOptions.length > 0 ? (
                                <ul className="space-y-2">
                                    {menu.proteinOptions.map((po: any) => {
                                        const isDefault = menu.defaultProteinType?.id === po.proteinTypeId;
                                        return (
                                            <li key={po.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200">
                                                <span>{po.proteinType.name}</span>
                                                {isDefault && <Badge variant="secondary" className="text-[10px]">Por Defecto</Badge>}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-sm text-zinc-500">No hay proteínas asignadas.</p>
                            )}
                        </div>

                        {/* Opciones de Acompañante - Desactivado visualmente
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                Opciones de Acompañante
                            </h3>
                            {menu.sideOptions.length > 0 ? (
                                <ul className="space-y-2">
                                    {menu.sideOptions.map((so: any) => (
                                        <li key={so.id} className="text-sm p-2 rounded-md bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200">
                                            {so.sideDish.name}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-zinc-500">No hay acompañantes asignados.</p>
                            )}
                        </div>
                        */}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
