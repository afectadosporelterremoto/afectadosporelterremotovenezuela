import React from "react";
import { createClient } from "@/utils/supabase/server";
import { getAuditLogs, getOfficialBalance } from "@/app/actions";
import { formatVenezuelaDateTime } from "@/utils/date";
import { 
  Activity, 
  Database, 
  Users, 
  UserMinus, 
  Building, 
  Skull, 
  HeartHandshake, 
  Clock, 
  FileText, 
  RefreshCw,
  AlertTriangle
} from "lucide-react";

export const metadata = {
  title: "Centro de Operaciones | Terremoto Venezuela",
};

export default async function CentroOperacionesPage() {
  const supabase = await createClient();

  // Fetch counts from DB
  const { count: totalAffected } = await supabase.from("affected_people").select("*", { count: "exact", head: true });
  const { count: hospitalizedCount } = await supabase.from("affected_people").select("*", { count: "exact", head: true }).eq("status", "Hospitalizado");
  const { count: missingCount } = await supabase.from("missing_people").select("*", { count: "exact", head: true }).eq("status", "missing");
  const { count: rescuedCount } = await supabase.from("rescued_people").select("*", { count: "exact", head: true });
  const { count: deceasedCount } = await supabase.from("deceased_people").select("*", { count: "exact", head: true }).eq("verification_status", "confirmed");
  const { count: pendingStories } = await supabase.from("stories").select("*", { count: "exact", head: true }).eq("status", "pending");
  const { count: pendingReports } = await supabase.from("information_reports").select("*", { count: "exact", head: true });
  const { count: duplicateDeceased } = await supabase.from("deceased_people").select("*", { count: "exact", head: true }).eq("verification_status", "duplicate");

  // Fetch last update times
  const { data: lastAffected } = await supabase.from("affected_people").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  const { data: lastMissing } = await supabase.from("missing_people").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  const { data: lastRescued } = await supabase.from("rescued_people").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  const { data: lastDeceased } = await supabase.from("deceased_people").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  
  const officialBalance = await getOfficialBalance();
  const auditLogs = await getAuditLogs();

  // Calculate last synchronization (max updated_at across tables)
  const dates = [
    lastAffected?.updated_at,
    lastMissing?.updated_at,
    lastRescued?.updated_at,
    lastDeceased?.updated_at,
  ].filter(Boolean).map(d => new Date(d!).getTime());

  const lastSync = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null;

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Activity className="h-7 w-7 text-[#C0392B]" />
            Centro de Operaciones
          </h1>
          <p className="text-xs text-gray-500">
            Monitoreo en tiempo real de las estadísticas de la base de datos y logs de auditoría administrativa.
          </p>
        </div>
      </div>

      {/* Grid de Resumen General */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-[#C0392B] rounded-lg">
            <Skull className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Fallecidos</span>
            <span className="text-2xl font-black text-gray-900">{deceasedCount || 0}</span>
            <span className="block text-[10px] text-gray-400 mt-0.5">Confirmados en DB</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Hospitalizados</span>
            <span className="text-2xl font-black text-gray-900">{hospitalizedCount || 0}</span>
            <span className="block text-[10px] text-gray-400 mt-0.5">Registrados en DB</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
            <UserMinus className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Desaparecidos</span>
            <span className="text-2xl font-black text-gray-900">{missingCount || 0}</span>
            <span className="block text-[10px] text-gray-400 mt-0.5">Fichas activas</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Rescatados</span>
            <span className="text-2xl font-black text-gray-900">{rescuedCount || 0}</span>
            <span className="block text-[10px] text-gray-400 mt-0.5">Personas localizadas</span>
          </div>
        </div>
      </div>

      {/* Panel de Estadísticas Adicionales e Info del Sismo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1 & 2: Balance Oficial vs Base de Datos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4 w-4 text-gray-500" />
              Balance Oficial del Sismo vs Cifras Registradas
            </h3>
            
            {officialBalance ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-gray-100 pb-5 mb-5">
                <div className="p-3 rounded-lg bg-gray-50">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Fallecidos Oficiales</span>
                  <span className="text-xl font-bold text-gray-900">{officialBalance.deceased_count}</span>
                  <span className="block text-[9px] text-gray-550 mt-1">Registrados en DB: {deceasedCount}</span>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Heridos Oficiales</span>
                  <span className="text-xl font-bold text-gray-950">{officialBalance.injured_count}</span>
                  <span className="block text-[9px] text-gray-550 mt-1">Registrados en DB: {hospitalizedCount}</span>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Desaparecidos Oficiales</span>
                  <span className="text-xl font-bold text-gray-900">{officialBalance.missing_count}</span>
                  <span className="block text-[9px] text-gray-550 mt-1">Registrados en DB: {missingCount}</span>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Rescatados Oficiales</span>
                  <span className="text-xl font-bold text-gray-900">{officialBalance.rescued_count}</span>
                  <span className="block text-[9px] text-gray-550 mt-1">Registrados en DB: {rescuedCount}</span>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Familias Damnificadas</span>
                  <span className="text-xl font-bold text-gray-900">{officialBalance.families_count}</span>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Edificaciones Afectadas</span>
                  <span className="text-xl font-bold text-gray-900">{officialBalance.buildings_count}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic mb-5">No se pudo cargar el balance oficial.</p>
            )}

            <div className="space-y-2 text-xs text-gray-500 pt-3 border-t border-gray-100">
              <h4 className="font-bold text-gray-700 uppercase text-[10px] tracking-wider mb-2">Tiempos de Actualización (Venezuela):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex justify-between py-1 border-b border-gray-100/60">
                  <span className="font-medium">Balance Oficial:</span>
                  <span className="font-bold text-gray-750">{officialBalance?.updated_at ? formatVenezuelaDateTime(officialBalance.updated_at) : "No registrado"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100/60">
                  <span className="font-medium">Hospitalizados:</span>
                  <span className="font-bold text-gray-750">{lastAffected?.updated_at ? formatVenezuelaDateTime(lastAffected.updated_at) : "No registrado"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100/60">
                  <span className="font-medium">Desaparecidos:</span>
                  <span className="font-bold text-gray-750">{lastMissing?.updated_at ? formatVenezuelaDateTime(lastMissing.updated_at) : "No registrado"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100/60">
                  <span className="font-medium">Fallecidos:</span>
                  <span className="font-bold text-gray-750">{lastDeceased?.updated_at ? formatVenezuelaDateTime(lastDeceased.updated_at) : "No registrado"}</span>
                </div>
                <div className="flex justify-between py-1 col-span-1 sm:col-span-2">
                  <span className="font-medium">Rescatados:</span>
                  <span className="font-bold text-gray-750">{lastRescued?.updated_at ? formatVenezuelaDateTime(lastRescued.updated_at) : "No registrado"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Reportes Pendientes y Sincronización */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              Pendientes y Alertas
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-yellow-100 bg-yellow-50/50">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs font-bold text-gray-700">Historias Pendientes</span>
                </div>
                <span className="text-sm font-black text-yellow-700">{pendingStories || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50/50">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-[#C0392B]" />
                  <span className="text-xs font-bold text-gray-700">Reportes de Info.</span>
                </div>
                <span className="text-sm font-black text-[#C0392B]">{pendingReports || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-blue-100 bg-blue-50/50">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-gray-700">Fallecidos Duplicados</span>
                </div>
                <span className="text-sm font-black text-blue-700">{duplicateDeceased || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Auditoría */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          Log de Auditoría de Acciones Administrativas
        </h3>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Fecha y Hora (VE)</th>
                <th className="p-3">Usuario Administrador</th>
                <th className="p-3">IP</th>
                <th className="p-3">Acción realizada</th>
                <th className="p-3">Tabla afectada</th>
                <th className="p-3">ID Registro</th>
                <th className="p-3">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {auditLogs && auditLogs.length > 0 ? (
                auditLogs.map((log: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 text-gray-600">
                    <td className="p-3 whitespace-nowrap font-medium">{formatVenezuelaDateTime(log.created_at)}</td>
                    <td className="p-3 font-mono text-[11px] text-gray-700">{log.admin_email || "Administrador"}</td>
                    <td className="p-3 font-mono text-[10px]">{log.ip_address || "127.0.0.1"}</td>
                    <td className="p-3">
                      <span className="inline-block rounded-sm bg-gray-100 px-2 py-0.5 font-semibold text-gray-800 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[10px] text-gray-500">{log.target_table || "N/A"}</td>
                    <td className="p-3 font-mono text-[10px] text-gray-400 truncate max-w-[100px]" title={log.target_id}>{log.target_id || "N/A"}</td>
                    <td className="p-3 max-w-[200px] truncate font-mono text-[10px] text-gray-500" title={JSON.stringify(log.details)}>
                      {log.details ? JSON.stringify(log.details) : "Ninguno"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500 italic">
                    No hay registros de auditoría disponibles o la tabla no está creada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
