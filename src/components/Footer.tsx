import React from "react";
import Link from "next/link";
import { Phone, ShieldAlert, AlertTriangle } from "lucide-react";
import Logo from "./Logo";
import { createClient } from "@/utils/supabase/server";

export default async function Footer() {
  // Intentar obtener contactos de emergencia activos desde la base de datos
  let activeContacts: any[] = [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("is_active", true)
      .limit(6);
      
    if (!error && data) {
      activeContacts = data;
    }
  } catch (err) {
    console.error("Error al obtener contactos para el footer:", err);
  }

  // Fallbacks si no hay base de datos configurada o si la consulta falla
  const fallbacks = [
    { id: "1", institution: "V-911 Emergencias", phone: "911", state: "Nacional", city: "Todo el país" },
    { id: "2", institution: "Protección Civil", phone: "0800-7248451", state: "Nacional", city: "Todo el país" },
    { id: "3", institution: "Bomberos Caracas", phone: "0212-5454545", state: "Distrito Capital", city: "Caracas" },
  ];

  const displayContacts = activeContacts.length > 0 ? activeContacts : fallbacks;

  return (
    <footer className="w-full bg-[#0B1F3A] text-white border-t-4 border-[#C0392B] mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Logo y descripción */}
          <div className="flex flex-col space-y-4">
            <div className="rounded-lg bg-white p-2 w-fit">
              <Logo variant="full" height={36} />
            </div>
            <p className="text-gray-300 text-sm max-w-xs">
              Plataforma humanitaria de registro, búsqueda y apoyo para la localización de familiares
              y reporte de situaciones críticas tras el terremoto en Venezuela.
            </p>
            <span className="text-xs text-gray-400">
              © {new Date().getFullYear()} Afectados por el Terremoto Venezuela. Iniciativa independiente y solidaria.
            </span>
          </div>

          {/* Números de emergencia */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-base font-bold tracking-wider text-[#F2C94C] uppercase flex items-center space-x-1.5">
              <Phone size={18} />
              <span>Contactos de Emergencia</span>
            </h3>
            
            <div className="space-y-2">
              {displayContacts.map((contact) => (
                <div key={contact.id} className="flex justify-between border-b border-white/10 pb-1.5 text-sm">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-100">{contact.institution}</span>
                    <span className="text-xs text-gray-400">
                      {contact.city !== "Todo el país" ? `${contact.state} - ${contact.city}` : contact.city}
                    </span>
                  </div>
                  <a
                    href={`tel:${contact.phone}`}
                    className="font-bold text-[#F2C94C] hover:underline flex items-center space-x-1"
                  >
                    <span>{contact.phone}</span>
                  </a>
                </div>
              ))}
            </div>

            <Link href="/emergencias" className="text-xs text-gray-300 hover:text-white hover:underline font-semibold">
              Ver todos los números de emergencia &rarr;
            </Link>
          </div>

          {/* Enlaces Rápidos y Advertencia */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-base font-bold tracking-wider text-[#F2C94C] uppercase flex items-center space-x-1.5">
              <ShieldAlert size={18} />
              <span>Enlaces y Seguridad</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
              <Link href="/buscar" className="hover:text-white hover:underline">Buscar Persona</Link>
              <Link href="/registrar-afectado" className="hover:text-white hover:underline">Registrar Afectado</Link>
              <Link href="/desaparecidos" className="hover:text-white hover:underline">Desaparecidos</Link>
              <Link href="/rescatados" className="hover:text-white hover:underline">Rescatados</Link>
              <Link href="/hospitalizados" className="hover:text-white hover:underline">Hospitalizados</Link>
              <Link href="/fallecidos" className="hover:text-white hover:underline">Fallecidos</Link>
              <Link href="/historias" className="hover:text-white hover:underline">Historias</Link>
              <Link href="/admin" className="hover:text-white hover:underline flex items-center space-x-1">
                <span>Acceso Admin</span>
              </Link>
            </div>

            {/* Advertencia obligatoria */}
            <div className="rounded-md border border-[#C0392B] bg-[#C0392B]/10 p-3 mt-2">
              <div className="flex space-x-2">
                <AlertTriangle className="h-5 w-5 text-[#C0392B] shrink-0" />
                <p className="text-xs text-gray-300 leading-tight">
                  <span className="font-bold text-[#C0392B] block mb-1">Advertencia de Seguridad</span>
                  Los números de emergencia deben ser verificados con fuentes oficiales antes de su publicación. No use esta plataforma para reportar emergencias inmediatas en curso, llame directamente a las autoridades.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
