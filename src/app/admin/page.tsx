import React from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { 
  Users, 
  UserMinus, 
  HeartHandshake, 
  BookOpen, 
  Phone, 
  FileText,
  AlertTriangle 
} from "lucide-react";

export default async function AdminDashboardPage() {
  let stats = {
    affected: 0,
    missing: 0,
    rescued: 0,
    stories: 0,
    reports: 0,
  };
  let errorMsg = null;

  try {
    const supabase = await createClient();
    const [affectedRes, missingRes, rescuedRes, storiesRes, reportsRes] = await Promise.all([
      supabase.from("affected_people").select("*", { count: "exact", head: true }),
      supabase.from("missing_people").select("*", { count: "exact", head: true }).eq("status", "missing"),
      supabase.from("rescued_people").select("*", { count: "exact", head: true }),
      supabase.from("stories").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("information_reports").select("*", { count: "exact", head: true }),
    ]);

    stats.affected = affectedRes.count || 0;
    stats.missing = missingRes.count || 0;
    stats.rescued = rescuedRes.count || 0;
    stats.stories = storiesRes.count || 0;
    stats.reports = reportsRes.count || 0;
  } catch (err: any) {
    errorMsg = err.message;
    // Mocks de demostración
    stats = {
      affected: 3,
      missing: 2,
      rescued: 2,
      stories: 1,
      reports: 4,
    };
  }

  const statCards = [
    { name: "Afectados Registrados", value: stats.affected, href: "/admin/afectados", icon: Users, color: "text-[#0B1F3A]" },
    { name: "Búsquedas de Desaparecidos", value: stats.missing, href: "/admin/desaparecidos", icon: UserMinus, color: "text-[#C0392B]" },
    { name: "Personas Rescatadas", value: stats.rescued, href: "/admin/rescatados", icon: HeartHandshake, color: "text-emerald-600" },
    { name: "Historias por Moderar", value: stats.stories, href: "/admin/historias", icon: BookOpen, color: "text-purple-600" },
    { name: "Reportes Recibidos (Tengo info)", value: stats.reports, href: "/admin/afectados", icon: FileText, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Panel de Control General</h1>
        <p className="text-xs text-gray-500">Resumen del estado de la plataforma y de los datos recolectados.</p>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start space-x-2 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <span>Ejecutando en modo de demostración local. No hay conexión activa a Supabase.</span>
        </div>
      )}

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.name}
              href={card.href}
              className="rounded-xl border border-gray-200 bg-white p-5 flex items-center justify-between shadow-2xs hover:shadow-xs hover:border-[#0B1F3A]/20 transition-all"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.name}</span>
                <span className="block text-2xl font-black text-gray-900">{card.value}</span>
              </div>
              <div className={`p-2.5 rounded-lg bg-gray-50 ${card.color}`}>
                <Icon size={24} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Guía Rápida para el Administrador */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Flujo de Trabajo Administrativo</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-600">
          <div className="space-y-1.5 p-4 rounded-lg bg-gray-50">
            <span className="font-bold text-[#0B1F3A] block">1. Moderación de Testimonios</span>
            <p>Acceda a la sección de <strong>Historias</strong> para aprobar o rechazar los testimonios enviados por el público antes de que se muestren en el blog.</p>
          </div>
          
          <div className="space-y-1.5 p-4 rounded-lg bg-gray-50">
            <span className="font-bold text-[#0B1F3A] block">2. Control y Seguimiento</span>
            <p>Revise los reportes confidenciales recibidos en <strong>Afectados</strong>. Actualice los estados a "Localizado" o "Rescatado" cuando se verifique con las autoridades.</p>
          </div>

          <div className="space-y-1.5 p-4 rounded-lg bg-gray-50">
            <span className="font-bold text-[#0B1F3A] block">3. Directorio de Emergencias</span>
            <p>Mantenga actualizado el listado de números telefónicos de ayuda por estado en <strong>Números de Emergencia</strong>, asegurándose de citar fuentes oficiales.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
