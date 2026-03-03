import { useState } from 'react';
import { useUserCreate } from '../hooks/useUsers';
import { X, UserPlus, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

interface UserCreateDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UserCreateDialog({ isOpen, onClose }: UserCreateDialogProps) {
    const createMut = useUserCreate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'USER'>('USER');
    const [enabled, setEnabled] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
        setEmail('');
        setPassword('');
        setRole('USER');
        setEnabled(true);
        setShowPassword(false);
        setError(null);
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !password.trim()) {
            setError('El correo y la contraseña son obligatorios');
            return;
        }

        try {
            await createMut.mutateAsync({
                email: email.trim(),
                password,
                role,
                enabled
            });
            handleClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al crear el usuario. Verifica los datos.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900/80 flex items-center justify-center text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Nuevo Usuario</h2>
                            <p className="text-xs text-zinc-500">Crear cuenta en el sistema</p>
                        </div>
                    </div>
                    {!createMut.isPending && (
                        <button onClick={handleClose} type="button" className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
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
                            <label className="block text-sm font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Correo Electrónico</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="usuario@ejemplo.com"
                                required
                                disabled={createMut.isPending}
                                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    disabled={createMut.isPending}
                                    className="w-full pl-3 pr-10 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Rol de Usuario</label>
                            <div className="relative">
                                <select
                                    value={role}
                                    onChange={e => setRole(e.target.value as 'ADMIN' | 'USER')}
                                    disabled={createMut.isPending}
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors appearance-none"
                                >
                                    <option value="USER">Usuario (Estándar)</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/20">
                            <div>
                                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cuenta Activa</label>
                                <p className="text-xs text-zinc-500">Permite al usuario iniciar sesión</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={e => setEnabled(e.target.checked)}
                                    disabled={createMut.isPending}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-zinc-900 dark:peer-focus:ring-white rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-zinc-900 dark:peer-checked:bg-zinc-100 peer-checked:after:border-transparent transition-colors"></div>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={createMut.isPending}
                            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createMut.isPending}
                            className="px-4 py-2 text-sm font-bold text-white bg-[#3b6154] rounded-lg hover:bg-[#2b473e] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {createMut.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                'Crear Usuario'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
