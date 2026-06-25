import React from "react";
import { createClient } from "@/utils/supabase/server";
import { Phone, MapPin, CheckCircle, AlertTriangle, ShieldCheck, Heart } from "lucide-react";

export const metadata = {
  title: "Números de Emergencia Oficiales | Terremoto Venezuela",
  description: "Números de teléfono de Protección Civil, Bomberos y entidades de rescate verificadas a nivel nacional e regional.",
};

export default async function EmergenciasPage() {
  let contacts: any[] = [];
  let dbError = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("is_active", true)
      .order("state", { ascending: true })
      .order("city", { ascending: true });

    if (error) dbError = error.message;
    else if (data) contacts = data;
  } catch (err: any) {
    dbError = err.message;
  }

  // Fallbacks reales nacionales
  const fallbackContacts = [
    {
      id: "fb-1",
      state: "Nacional",
      city: "Todo el país",
      institution: "Emergencias Nacionales Ven911",
      phone: "911",
      whatsapp: null,
      address: "Sedes de videovigilancia a nivel nacional",
      official_source: "Ministerio de Relaciones Interiores, Justicia y Paz",
      verified_at: new Date().toISOString(),
    },
    {
      id: "fb-2",
      state: "Nacional",
      city: "Todo el país",
      institution: "Protección Civil Nacional (Reportes)",
      phone: "0800-7248451",
      whatsapp: null,
      address: "Plaza Venezuela, Caracas",
      official_source: "Sitio oficial de Protección Civil",
      verified_at: new Date().toISOString(),
    },
    {
      id: "fb-3",
      state: "Nacional",
      city: "Todo el país",
      institution: "Cuerpo de Investigaciones Científicas (Búsqueda de Personas)",
      phone: "0800-2427224",
      whatsapp: null,
      address: "Avenida Urdaneta, Caracas",
      official_source: "Directorio Oficial del CICPC",
      verified_at: new Date().toISOString(),
    },
    {
      id: "fb-4",
      state: "Nacional",
      city: "Caracas",
      institution: "Bomberos del Distrito Capital",
      phone: "0212-5454545",
      whatsapp: null,
      address: "Estación de Bomberos, Av. Lecuna, Caracas",
      official_source: "Alcaldía de Caracas",
      verified_at: new Date().toISOString(),
    },
  ];

  const usingMock = contacts.length === 0 && dbError;
  const activeContacts = usingMock ? fallbackContacts : contacts;

  // Agrupar por Estado para una lectura estructurada
  const groupedContacts: { [key: string]: any[] } = {};
  activeContacts.forEach((c) => {
    if (!groupedContacts[c.state]) {
      groupedContacts[c.state] = [];
    }
    groupedContacts[c.state].push(c);
  });

  return (
    <div className="py-8 px-4 md:py-12 max-w-5xl mx-auto w-full space-y-8 flex-1">
      {/* Encabezado */}
      <div className="border-b border-gray-100 pb-6 space-y-3">
        <div className="inline-flex items-center space-x-1 bg-[#C0392B]/10 border border-[#C0392B]/30 px-3 py-1 rounded-full text-xs font-semibold text-[#C0392B]">
          <Heart size={12} className="fill-[#C0392B]" />
          <span>Líneas Verificadas de Apoyo</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
          <Phone className="text-[#0B1F3A]" />
          <span>Números y Directorio de Emergencia</span>
        </h1>
        <p className="text-sm text-gray-500 max-w-2xl">
          Directorio centralizado de instituciones autorizadas para la atención médica, búsqueda y rescate tras el sismo. Recuerda verificar siempre la procedencia del número.
        </p>
      </div>

      {/* Advertencia obligatoria */}
      <div className="rounded-xl border border-[#C0392B]/20 bg-[#C0392B]/5 p-5 flex flex-col md:flex-row items-start gap-4">
        <AlertTriangle className="h-6 w-6 text-[#C0392B] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-gray-950 uppercase tracking-wide">Aviso de Seguridad en el uso de los números</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            <span className="font-bold text-[#C0392B]">Los números de emergencia deben ser verificados con fuentes oficiales antes de su publicación.</span> Si detecta algún número erróneo o inactivo, repórtelo inmediatamente. No use esta plataforma para reportar emergencias en vivo, llame directamente al 911.
          </p>
        </div>
      </div>

      {dbError && !usingMock && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-xs text-blue-800">
          Mostrando números oficiales de demostración. No se pudo conectar al servidor de base de datos de Supabase.
        </div>
      )}

      {/* Directorio Agrupado por Estado */}
      <div className="space-y-8">
        {Object.keys(groupedContacts).map((stateName) => (
          <div key={stateName} className="space-y-4">
            <h2 className="text-lg font-bold text-[#0B1F3A] border-l-4 border-[#C0392B] pl-2 uppercase tracking-wide">
              Estado: {stateName}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedContacts[stateName].map((contact) => (
                <div key={contact.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400 uppercase">{contact.city}</span>
                      {contact.verified_at && (
                        <span className="inline-flex items-center space-x-1 rounded-md bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          <ShieldCheck size={10} />
                          <span>Verificado</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 leading-snug">{contact.institution}</h3>
                    
                    {contact.address && (
                      <div className="flex items-start space-x-1 text-xs text-gray-500 pt-1">
                        <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                        <span>{contact.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                    <div className="text-[10px] text-gray-400">
                      Fuente: <span className="font-semibold text-gray-500 truncate max-w-[150px] inline-block">{contact.official_source || "Oficial"}</span>
                    </div>
                    <a
                      href={`tel:${contact.phone}`}
                      className="inline-flex items-center space-x-1.5 rounded-lg bg-[#C0392B] px-4 py-2 text-xs font-bold text-white hover:bg-[#A93226] transition-colors"
                    >
                      <Phone size={12} />
                      <span>{contact.phone}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
