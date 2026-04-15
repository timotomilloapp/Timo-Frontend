import React, { useEffect } from 'react';
import { X } from 'lucide-react';
// We use basic React state and Zod for the form, keeping it dependency free

// Actually `zod` is installed. We can just use standard controlled state with zod validation to keep it 100% dependency free regarding form libraries, or use `react-hook-form` if installed.
// The user uses zod in package.json, let's just make a simple form handler for the Factory.

import { CrudEntityConfig, FormField } from '../types';

interface CrudFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    config: CrudEntityConfig;
    initialData?: any;
    isLoading?: boolean;
}

export function CrudFormDialog({
    isOpen,
    onClose,
    onSubmit,
    config,
    initialData,
    isLoading = false,
}: CrudFormDialogProps) {
    const [formData, setFormData] = React.useState<any>({});
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Only pick the fields declared in formFields to avoid sending
                // extra fields (id, createdAt, updatedAt...) that would cause a 400
                const picked = config.formFields.reduce((acc: any, field) => {
                    acc[field.name] = initialData[field.name] ?? (config.defaultValues as any)?.[field.name] ?? '';
                    return acc;
                }, {});
                setFormData(picked);
            } else {
                setFormData(config.defaultValues || {});
            }
            setErrors({});
        }
    }, [isOpen, initialData, config.formFields, config.defaultValues]);

    if (!isOpen) return null;

    const handleChange = (name: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
        // Clear error for field
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        if (!config.formSchema) return true;
        const result = config.formSchema.safeParse(formData);
        if (!result.success) {
            const formattedErrors: Record<string, string> = {};
            result.error.issues.forEach((issue) => {
                if (issue.path[0]) {
                    formattedErrors[issue.path[0].toString()] = issue.message;
                }
            });
            setErrors(formattedErrors);
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        await onSubmit(formData);
    };

    const isEdit = !!initialData;

    const renderField = (field: FormField) => {
        const value = formData[field.name] !== undefined ? formData[field.name] : '';
        const error = errors[field.name];

        const baseInputClasses = `w-full px-3 py-2 bg-white dark:bg-zinc-950 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors
      ${error ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'}`;

        return (
            <div key={field.name} className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {field.label}
                </label>

                {field.type === 'text' && (
                    <input
                        type="text"
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className={baseInputClasses}
                        disabled={isLoading}
                    />
                )}

                {field.type === 'number' && (
                    <input
                        type="number"
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(e) => handleChange(field.name, Number(e.target.value))}
                        className={baseInputClasses}
                        disabled={isLoading}
                    />
                )}

                {field.type === 'select' && field.options && (
                    <select
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className={baseInputClasses}
                        disabled={isLoading}
                    >
                        <option value="" disabled>Seleccionar {field.label.toLowerCase()}</option>
                        {field.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                )}

                {field.type === 'boolean' && (
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                        <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => handleChange(field.name, e.target.checked)}
                            disabled={isLoading}
                            className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:checked:bg-white"
                        />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">Activo</span>
                    </label>
                )}

                {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm overflow-y-auto">
            <div
                className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 my-8"
            >
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                        {isEdit ? 'Editar' : 'Crear'} {config.singularTitle}
                    </h2>
                    {!isLoading && (
                        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {config.formFields.map(renderField)}

                    <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-bold text-white bg-[#3b6154] rounded-lg hover:bg-[#2b473e] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {isEdit ? 'Guardar Cambios' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
