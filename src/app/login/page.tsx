"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ShieldAlert, Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comprobar si ya está logueado
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/admin");
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (loginError) {
        setError(loginError.message);
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch (err: any) {
      setError("Ocurrió un error inesperado al intentar iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex flex-col items-center space-y-4">
          <Logo variant="icon" height={50} />
          <h2 className="text-center text-2xl font-black text-gray-900 tracking-tight">
            Acceso Administrativo
          </h2>
          <p className="text-center text-xs text-gray-500 max-w-xs">
            Esta sección está reservada exclusivamente para personal autorizado y moderadores de la plataforma.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start space-x-2 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-bold text-gray-700 uppercase mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@dominio.com"
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-bold text-gray-700 uppercase mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 rounded-lg bg-[#0B1F3A] py-2.5 text-sm font-bold text-white hover:bg-[#152e4f] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <span>Entrar</span>
            )}
          </button>
        </form>

        <div className="border-t border-gray-150 pt-4 text-center">
          <span className="text-[10px] text-gray-400 block font-semibold">SEGURIDAD RLS ACTIVADA</span>
          <span className="text-[10px] text-gray-400 block">Todas las acciones administrativas quedan registradas.</span>
        </div>
      </div>
    </div>
  );
}
