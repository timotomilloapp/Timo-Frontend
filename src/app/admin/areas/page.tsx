'use client';

import React from 'react';
import { z } from 'zod';
import { CrudPage } from '@/features/admin-crud/components/CrudPage';
import { CrudEntityConfig } from '@/features/admin-crud/types';

const areasConfig: CrudEntityConfig = {
    entityKey: 'areas',
    title: 'Áreas',
    singularTitle: 'Área',
    endpoints: {
        base: '/areas',
    },
    columns: [
        { header: 'Nombre', accessorKey: 'name' },
        {
            header: 'Estado',
            accessorKey: 'isActive',
            render: (item) => (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
            ${item.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500'
                        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                    {item.isActive ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            header: 'Fecha Creación',
            accessorKey: 'createdAt',
            render: (item) => item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'
        },
    ],
    formFields: [
        { name: 'name', label: 'Nombre de la área', type: 'text', placeholder: 'Ej. Pintura' },
        { name: 'isActive', label: 'Estado (Activo/Inactivo)', type: 'boolean' },
    ],
    formSchema: z.object({
        name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        isActive: z.boolean().default(true),
    }),
    defaultValues: { isActive: true, name: '' },
};

export default function AreasPage() {
    return <CrudPage config={areasConfig} />;
}
