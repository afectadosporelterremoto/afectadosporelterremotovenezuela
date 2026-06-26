import React from "react";
import Link from "next/link";
import { 
  UserPlus, 
  Search, 
  UserMinus, 
  HeartHandshake, 
  BookOpen, 
  Phone, 
  ShieldCheck, 
  AlertTriangle 
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { formatVenezuelaDateTime } from "@/utils/date";
import WelcomeModal from "@/components/WelcomeModal";

export const revalidate = 60; // Revalidar la página cada minuto para refrescar estadísticas

export default async function Home() {
  // Consultar estadísticas reales desde Supabase
  let stats = { affected: 0, missing: 0, rescued: 0, hospitalized: 0, deceased: 0 };
  let lastSyncTime = new Date();
  
  // Cifras oficiales del balance nacional (actualizables manualmente)
  let officialStats = {
    deaths: 188,
    injuries: 1520,
    missing: 157,
    rescued: 200,
    families: 2227,
    buildings: 250,
    source: "" as string | undefined,
    updated_at: undefined as string | undefined,
  };

  const safeQuery = async (queryBuilder: any) => {
    try {
      const res = await queryBuilder;
      if (res.error) return { count: 0, data: [], error: res.error };
      return res;
    } catch (err) {
      return { count: 0, data: [], error: err };
    }
  };

  try {
    const supabase = await createClient();
    
    const [
      affectedRes,
      missingRes,
      rescuedRes,
      hospitalizedRes,
      deceasedRes,
      latestAffected,
      latestMissing,
      latestRescued,
      latestDeceased,
      officialBalanceRes
    ] = await Promise.all([
      safeQuery(supabase.from("affected_people").select("*", { count: "exact", head: true }).eq("is_public", true)),
      safeQuery(supabase.from("missing_people").select("notes").eq("status", "missing")),
      safeQuery(supabase.from("rescued_people").select("*", { count: "exact", head: true })),
      safeQuery(supabase.from("affected_people").select("*", { count: "exact", head: true }).eq("status", "Hospitalizado").eq("is_public", true)),
      safeQuery(supabase.from("deceased_people").select("*", { count: "exact", head: true }).eq("is_public", true).eq("verification_status", "confirmed")),
      safeQuery(supabase.from("affected_people").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle()),
      safeQuery(supabase.from("missing_people").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle()),
      safeQuery(supabase.from("rescued_people").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle()),
      safeQuery(supabase.from("deceased_people").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle()),
      safeQuery(supabase.from("official_balance").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle()),
    ]);

    stats.affected = affectedRes.count || 0;
    // Excluir desaparecidos que están en revisión
    stats.missing = (missingRes.data || []).filter((p: any) => !p.notes?.includes("[PENDING REVIEW]")).length;
    stats.rescued = rescuedRes.count || 0;
    stats.hospitalized = hospitalizedRes.count || 0;
    stats.deceased = deceasedRes.count || 0;

    if (officialBalanceRes.data) {
      officialStats = {
        deaths: officialBalanceRes.data.deceased_count,
        injuries: officialBalanceRes.data.injured_count,
        missing: officialBalanceRes.data.missing_count,
        rescued: officialBalanceRes.data.rescued_count,
        families: officialBalanceRes.data.families_count,
        buildings: officialBalanceRes.data.buildings_count,
        source: officialBalanceRes.data.source || undefined,
        updated_at: officialBalanceRes.data.updated_at,
      };
    }

    const dates = [
      latestAffected?.data?.updated_at,
      latestMissing?.data?.updated_at,
      latestRescued?.data?.updated_at,
      latestDeceased?.data?.updated_at,
    ].filter(Boolean).map(d => new Date(d).getTime());

    if (dates.length > 0) {
      lastSyncTime = new Date(Math.max(...dates));
    }
  } catch (err) {
    console.error("Error al obtener estadísticas del home:", err);
  }

  const actionCards = [
    {
      title: "Registrar Afectado",
      desc: "Registrar datos de personas damnificadas, hospitalizadas o que requieren ayuda crítica.",
      href: "/registrar-afectado",
      icon: UserPlus,
      color: "border-l-4 border-[#0B1F3A]",
      iconColor: "text-[#0B1F3A]",
    },
    {
      title: "Buscar Persona",
      desc: "Buscar registros de familiares y amigos afectados para conocer su estado de localización.",
      href: "/buscar",
      icon: Search,
      color: "border-l-4 border-[#F2C94C]",
      iconColor: "text-[#F2C94C]",
    },
    {
      title: "Reportar Desaparecido",
      desc: "Publicar ficha de búsqueda de familiares con quienes se ha perdido el contacto.",
      href: "/desaparecidos",
      icon: UserMinus,
      color: "border-l-4 border-[#C0392B]",
      iconColor: "text-[#C0392B]",
    },
    {
      title: "Personas Rescatadas",
      desc: "Consultar y reportar listas de personas localizadas con vida o trasladadas a albergues.",
      href: "/rescatados",
      icon: HeartHandshake,
      color: "border-l-4 border-emerald-500",
      iconColor: "text-emerald-500",
    },
    {
      title: "Historias y Testimonios",
      desc: "Compartir relatos de sobrevivientes o reportar necesidades colectivas de comunidades afectadas.",
      href: "/historias",
      icon: BookOpen,
      color: "border-l-4 border-purple-500",
      iconColor: "text-purple-500",
    },
    {
      title: "Números de Emergencia",
      desc: "Central telefónica de Protección Civil, Bomberos y organismos verificados por región.",
      href: "/emergencias",
      icon: Phone,
      color: "border-l-4 border-blue-500",
      iconColor: "text-blue-500",
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <WelcomeModal />
      {/* Sección Hero */}
      <section className="bg-[#0B1F3A] text-white py-16 px-4 md:py-20 relative overflow-hidden">
        {/* Adorno de fondo sobrio */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-[#C0392B]/20 border border-[#C0392B]/35 px-4 py-1.5 text-xs font-semibold text-[#F2C94C]">
            <ShieldCheck size={14} />
            <span>Plataforma Humanitaria y de Búsqueda</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Afectados por el Terremoto <br className="hidden sm:inline" />
            <span className="text-[#F2C94C]">Venezuela</span>
          </h1>
          
          <p className="text-base md:text-xl text-gray-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Un espacio seguro y centralizado para la localización de personas, reporte de rescatados y registro de solicitudes de auxilio tras el sismo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/buscar"
              className="w-full sm:w-auto rounded-lg bg-[#C0392B] px-8 py-3 text-sm font-bold text-white hover:bg-[#A93226] transition-colors shadow-lg shadow-black/10"
            >
              Buscar Familiar
            </Link>
            <Link
              href="/registrar-afectado"
              className="w-full sm:w-auto rounded-lg bg-white px-8 py-3 text-sm font-bold text-[#0B1F3A] hover:bg-gray-100 transition-colors border border-transparent"
            >
              Registrar Afectado
            </Link>
          </div>
        </div>
      </section>

      {/* Sección de Estadísticas Oficiales */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-1">BALANCE OFICIAL DEL SISMO</h3>
          <p className="text-[10px] text-gray-400 text-center mb-5">Fuente: {officialStats.source || "Protección Civil y medios verificados"} &middot; Cifras sujetas a actualización</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
            <Link 
              href="/fallecidos" 
              className="flex flex-col p-3 rounded-lg bg-gray-50 hover:bg-gray-100 hover:shadow-xs transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              <span className="text-2xl md:text-3xl font-extrabold text-gray-900">{officialStats.deaths}</span>
              <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mt-1">Fallecidos oficiales</span>
            </Link>
            <div className="flex flex-col p-3 rounded-lg bg-gray-50 select-none">
              <span className="text-2xl md:text-3xl font-extrabold text-amber-600">{officialStats.injuries.toLocaleString()}</span>
              <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mt-1">Heridos oficiales</span>
            </div>
            <Link 
              href="/desaparecidos" 
              className="flex flex-col p-3 rounded-lg bg-gray-50 hover:bg-gray-100 hover:shadow-xs transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              <span className="text-2xl md:text-3xl font-extrabold text-[#C0392B]">{officialStats.missing}</span>
              <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mt-1">Desaparecidos oficiales</span>
            </Link>
            <Link 
              href="/rescatados" 
              className="flex flex-col p-3 rounded-lg bg-gray-50 hover:bg-gray-100 hover:shadow-xs transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              <span className="text-2xl md:text-3xl font-extrabold text-emerald-600">+{officialStats.rescued}</span>
              <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mt-1">Rescatados oficiales</span>
            </Link>
            <div className="flex flex-col p-3 rounded-lg bg-gray-50 select-none">
              <span className="text-2xl md:text-3xl font-extrabold text-blue-600">{officialStats.families.toLocaleString()}</span>
              <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mt-1">Familias afectadas</span>
            </div>
            <div className="flex flex-col p-3 rounded-lg bg-gray-50 select-none">
              <span className="text-2xl md:text-3xl font-extrabold text-orange-600">+{officialStats.buildings}</span>
              <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mt-1">Edificaciones afectadas</span>
            </div>
          </div>

          <div className="text-center mt-6">
            <span className="text-xs text-gray-500 font-semibold bg-gray-50/50 py-1.5 px-3 rounded-lg border border-gray-100/50 inline-block">
              Última actualización del balance oficial: <span className="text-gray-700 font-bold">{formatVenezuelaDateTime(officialStats.updated_at || "2026-06-25T12:00:00Z")}</span>
            </span>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-150">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-4">REGISTRADOS EN ESTA PLATAFORMA</h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-center">
              <Link 
                href="/buscar"
                className="flex flex-col p-4 rounded-xl border border-gray-100 bg-white shadow-2xs hover:shadow-md hover:border-[#0B1F3A]/20 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                <span className="text-2xl md:text-4xl font-extrabold text-[#0B1F3A]">{stats.affected}</span>
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mt-0.5">Afectados registrados</span>
              </Link>
              <Link 
                href="/hospitalizados"
                className="flex flex-col p-4 rounded-xl border border-gray-100 bg-white shadow-2xs hover:shadow-md hover:border-blue-700/20 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                <span className="text-2xl md:text-4xl font-extrabold text-blue-700">{stats.hospitalized}</span>
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mt-0.5">Hospitalizados</span>
              </Link>
              <Link 
                href="/desaparecidos"
                className="flex flex-col p-4 rounded-xl border border-gray-100 bg-white shadow-2xs hover:shadow-md hover:border-[#C0392B]/20 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                <span className="text-2xl md:text-4xl font-extrabold text-[#C0392B]">{stats.missing}</span>
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mt-0.5">Reportes de búsqueda</span>
              </Link>
              <Link 
                href="/rescatados"
                className="flex flex-col p-4 rounded-xl border border-gray-100 bg-white shadow-2xs hover:shadow-md hover:border-emerald-600/20 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                <span className="text-2xl md:text-4xl font-extrabold text-emerald-600">{stats.rescued}</span>
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mt-0.5">Rescatados registrados en la plataforma</span>
              </Link>
              <Link 
                href="/fallecidos"
                className="flex flex-col p-4 rounded-xl border border-gray-100 bg-white shadow-2xs hover:shadow-md hover:border-[#C0392B]/20 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                <span className="text-2xl md:text-4xl font-extrabold text-gray-800">{stats.deceased}</span>
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mt-0.5">Fallecidos confirmados en la plataforma</span>
              </Link>
            </div>
            <div className="text-center mt-6">
              <span className="text-xs text-gray-500 font-semibold bg-gray-50/50 py-1.5 px-3 rounded-lg border border-gray-100/50 inline-block">
                Última actualización de la plataforma: <span className="text-gray-700 font-bold">{formatVenezuelaDateTime(lastSyncTime)}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Acciones Principales */}
      <section className="py-12 md:py-16 px-4 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Acciones y Servicios de la Plataforma</h2>
          <p className="text-sm text-gray-500">
            Seleccione la opción correspondiente para registrar información o realizar consultas directas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {actionCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className={`group flex flex-col justify-between p-6 rounded-xl bg-white border border-gray-200 shadow-2xs hover:shadow-md transition-all hover:-translate-y-0.5 ${card.color}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-lg bg-gray-50 ${card.iconColor}`}>
                      <Icon size={24} />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0B1F3A] transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50 text-xs font-bold text-[#0B1F3A] group-hover:underline flex items-center space-x-1">
                  <span>Acceder &rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Sección de Advertencia General */}
      <section className="bg-gray-100 border-t border-gray-200 py-10 px-4 mt-auto">
        <div className="max-w-4xl mx-auto rounded-xl border border-amber-200 bg-amber-50/50 p-6 flex flex-col sm:flex-row items-start gap-4">
          <AlertTriangle className="h-8 w-8 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Aviso Importante a la Ciudadanía</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Esta plataforma es una herramienta colaborativa y humanitaria. Las cédulas, los teléfonos y las direcciones exactas se enmascaran en el módulo de búsqueda público para proteger la integridad y la seguridad física de los afectados. 
            </p>
            <p className="text-xs text-gray-500 font-medium">
              Cualquier uso indebido de los datos, reporte de información falsa o suplantación de identidad será penalizado y reportado de forma inmediata a los órganos competentes nacionales.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
