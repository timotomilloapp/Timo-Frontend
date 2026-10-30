'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { queryClient } from '@/core/query-client';
import { ReactNode } from 'react';

export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </ThemeProvider>
    );
}
