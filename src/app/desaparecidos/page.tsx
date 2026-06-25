import React from "react";
import MissingPersonForm from "@/components/MissingPersonForm";
import { createClient } from "@/utils/supabase/server";
import { maskCedula, maskPhone } from "@/utils/mask";
import { MapPin, Phone, Calendar, Info, Shield, Search, AlertCircle, PlusCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

export const metadata = {
  title: "Localización de Desaparecidos | Terremoto Venezuela",
  description: "Consulte o reporte personas no localizadas tras el sismo. Ayude a sus familiares suministrando información verídica.",
};

interface DesaparecidosPageProps {
  searchParams: Promise<{
    buscar?: string;
    crear?: string;
  }>;
}

export default async function DesaparecidosPage({ searchParams }: DesaparecidosPageProps) {
  const params = await searchParams;
  const searchName = params.buscar || "";
  const showCreateForm = params.crear === "true";

  let missingList: any[] = [];
  let dbError = null;

  try {
    const supabase = await createClient();
    let query = supabase.from("missing_people").select("*").in("status", ["missing", "hospitalized"]);

    if (searchName) {
      query = query.ilike("full_name", `%${searchName}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) dbError = error.message;
    else if (data) {
      // Excluir registros pendientes de revisión
      missingList = data.filter((p: any) => !p.notes?.includes("[PENDING REVIEW]"));
    }
  } catch (err: any) {
    dbError = err.message;
  }

  // Fallback mocks si falla base de datos
  const mockMissing = [
    {
      id: "demo-missing-1",
      full_name: "Gabriela Sofía Rangel",
      cedula: "V-18999888",
      approximate_age: 26,
      photo_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=300&auto=format&fit=crop",
      last_seen_location: "Zona del desastre, Sector El Milagro, Maracay",
      physical_description: "Estatura de 1.65m, tez clara, cabello castaño largo. Tiene un lunar en la mejilla izquierda.",
      clothes_description: "Llevaba puesto un jean azul claro y una franela blanca deportiva.",
      reporter_name: "Pedro Rangel (Padre)",
      reporter_phone: "0412-5556677",
      created_at: new Date().toISOString(),
    },
    {
      id: "demo-missing-2",
      full_name: "José Manuel Gil",
      cedula: "V-11222333",
      approximate_age: 52,
      photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop",
      last_seen_location: "Av. Bermúdez, Cumaná",
      physical_description: "De contextura fuerte, tez morena, cabello corto canoso. Usa lentes recetados.",
      clothes_description: "Vestía pantalón de vestir gris y camisa de botones azul claro.",
      reporter_name: "Yuliana Gil (Hija)",
      reporter_phone: "0414-7778899",
      created_at: new Date().toISOString(),
    },
  ];

  const usingMock = missingList.length === 0 && !searchName && dbError;
  const activeList = usingMock ? mockMissing : missingList;

  return (
    <div className="py-8 px-4 md:py-12 max-w-7xl mx-auto w-full space-y-8 flex-1 flex flex-col">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Personas Reportadas como Desaparecidas
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl">
            Consulte la lista de búsquedas activas. Si tiene información sobre el paradero de alguna de estas personas, use el botón para reportar información en su ficha.
          </p>
        </div>

        <div>
          {showCreateForm ? (
            <a
              href="/desaparecidos"
              className="inline-flex items-center space-x-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>Ver Lista de Búsqueda</span>
            </a>
          ) : (
            <a
              href="/desaparecidos?crear=true"
              className="inline-flex items-center space-x-1.5 rounded-lg bg-[#C0392B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#A93226] transition-colors shadow-xs"
            >
              <PlusCircle size={16} />
              <span>Reportar Desaparecido</span>
            </a>
          )}
        </div>
      </div>

      {showCreateForm ? (
        <div className="py-4">
          <MissingPersonForm />
        </div>
      ) : (
        <div className="space-y-6 flex-1 flex flex-col">
          {/* Buscador Simple */}
          <form method="GET" action="/desaparecidos" className="flex gap-2 max-w-md">
            <input
              type="text"
              name="buscar"
              defaultValue={searchName}
              placeholder="Buscar por nombre..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-bold text-white hover:bg-[#152e4f] transition-colors"
            >
              Buscar
            </button>
          </form>

          {dbError && !usingMock && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-start space-x-2 text-sm text-blue-700">
              <AlertCircle className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" />
              <div>
                <p className="font-semibold">Nota de demostración:</p>
                <p className="text-xs">Mostrando registros de ejemplo ya que no hay conexión activa a Supabase en este momento.</p>
              </div>
            </div>
          )}

          {activeList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center flex-1 flex flex-col items-center justify-center">
              <Search className="h-10 w-10 text-gray-400 mb-2" />
              <h3 className="text-base font-bold text-gray-700">No hay reportes de búsqueda activos</h3>
              <p className="text-xs text-gray-500 mt-1">
                Utiliza el botón superior para agregar una nueva solicitud de búsqueda si tienes un familiar desaparecido.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activeList.map((person) => (
                <div key={person.id} className="flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-shadow">
                  {/* Foto */}
                  <div className="relative h-48 bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={person.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop"}
                      alt={person.full_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={person.status} />
                    </div>
                  </div>

                  {/* Detalle */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-gray-900 leading-snug">{person.full_name}</h3>
                      {person.approximate_age && (
                        <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                          Edad: {person.approximate_age} años
                        </span>
                      )}
                      
                      <div className="flex items-center space-x-1 text-xs text-gray-500 font-semibold">
                        <Shield size={13} className="text-gray-400" />
                        <span>Cédula: {maskCedula(person.cedula)}</span>
                      </div>

                      <div className="flex items-start space-x-1.5 text-sm text-gray-600">
                        <MapPin size={16} className="text-[#C0392B] shrink-0 mt-0.5" />
                        <span className="line-clamp-2">Visto en: {person.last_seen_location}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        <span className="font-bold block text-gray-700">Rasgos físicos:</span>
                        {person.physical_description || "Sin descripción física específica."}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        <span className="font-bold block text-gray-700">Vestimenta:</span>
                        {person.clothes_description || "No detallada."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-50 pt-3">
                      <div className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>Reportado: {new Date(person.created_at).toLocaleDateString("es-VE")}</span>
                      </div>
                      <span className="font-bold text-[#0B1F3A]">Familiar: {person.reporter_name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
