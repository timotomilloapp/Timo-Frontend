'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UtensilsCrossed, ChevronRight, Settings2, Loader2, AlertCircle } from 'lucide-react';
import { whitelistService } from '@/services/whitelist-service';

export default function Home() {
  const [cedula, setCedula] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula) return;

    setIsLoading(true);
    setError('');

    try {
      await whitelistService.loginByCc(cedula);
      // Guardar también en localStorage por compatibilidad
      localStorage.setItem('user_cedula', cedula);
      // Redirigir a la página de menús (calendario)
      router.push('/menus');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al verificar la cédula');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">

      {/* Header */}
      <header className="bg-[#3b6154]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <UtensilsCrossed size={16} className="text-white" />
              TIMO<span className="text-emerald-200">TOMILLO</span>

          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/admin/login"
              className="group relative flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
              title="Acceso Administrativo"
            >
              <Settings2 size={18} className="group-hover:rotate-45 transition-transform duration-300" />
              <span className="text-xs font-semibold uppercase tracking-widest hidden sm:block">Admin</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 xl:py-24 grid grid-cols-1 xl:grid-cols-2 gap-16 items-center min-h-[calc(100vh-4rem-3rem)]">

        {/* Left Column: Cédula Login */}
        <section className="space-y-10 flex flex-col items-center xl:items-start text-center xl:text-left w-full">
          <div className="w-full max-w-sm md:max-w-md xl:max-w-sm space-y-6 md:space-y-8 xl:space-y-6">

            <div className="space-y-2 md:space-y-4 xl:space-y-2">
              <h2 className="text-3xl md:text-5xl xl:text-3xl font-bold tracking-tight">Reserva tu proteína</h2>

              <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-lg xl:text-sm leading-relaxed">
                Ingresa tu número de cédula para consultar el menú del día y realizar tu reserva.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Número de cédula"
                value={cedula}
                onChange={(e) => {
                  setCedula(e.target.value);
                  if (error) setError('');
                }}
                required
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={isLoading}
                className={`md:h-16 md:text-2xl xl:h-10 xl:text-sm ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50 rounded-lg flex items-start gap-2 border border-red-200 dark:border-red-900/30">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full group bg-[#3b6154] text-white hover:bg-zinc-200 hover:text-zinc-900 border-none transition-colors duration-300 md:h-16 md:text-xl xl:h-10 xl:text-sm">
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    Ingresar
                    <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </section>

        {/* Right Column: Brand block */}
        <section className="space-y-6 md:space-y-8 xl:space-y-6 xl:border-l xl:border-zinc-100 dark:xl:border-zinc-800 xl:pl-16 py-8 flex flex-col items-center xl:items-start text-center xl:text-left w-full">
          <h1 className="text-5xl md:text-[6rem] xl:text-7xl font-black leading-[1.05] tracking-tighter">
            TIMO<span className="text-[#3b6154]">TOMILLO</span>
          </h1>
          <p className="text-base md:text-xl xl:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md md:max-w-xl mx-auto xl:mx-0">
            Almuerzos corporativos para tu equipo, sin complicaciones.
            Rápido, confiable y siempre disponible.
          </p>
          <div className="flex flex-wrap justify-center xl:justify-start gap-8 md:gap-12 xl:gap-8 pt-4 md:pt-6 xl:pt-4 border-t border-zinc-100 dark:border-zinc-800 w-full max-w-md md:max-w-xl xl:max-w-none">
            <FeatureItem title="Pedidos" desc="Rápidos y simples" />
            <FeatureItem title="Menú diario" desc="Actualizado cada jornada" />
            <FeatureItem title="Sin internet" desc="Disponible offline" />
          </div>
        </section>

      </main>

      <footer className="fixed bottom-0 w-full border-t border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-center">
          <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-[0.2em]">
            © 2026 TIMOTOMILLO — Gestión de Almuerzos Corporativos

          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="space-y-0.5 md:space-y-1.5 xl:space-y-0.5">
      <p className="text-xs md:text-base xl:text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">{title}</p>
      <p className="text-[11px] md:text-sm xl:text-[11px] text-zinc-400 font-medium">{desc}</p>
    </div>
  );
}
