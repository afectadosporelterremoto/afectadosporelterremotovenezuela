import React from "react";
import RescuedPersonForm from "@/components/RescuedPersonForm";
import { createClient } from "@/utils/supabase/server";
import { MapPin, Heart, Calendar, Info, Search, AlertCircle, PlusCircle, Hospital } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

export const metadata = {
  title: "Personas Rescatadas e Identificadas | Terremoto Venezuela",
  description: "Consulte el registro de personas que han sido localizadas con vida, rescatadas de escombros o trasladadas a albergues.",
};

interface RescatadosPageProps {
  searchParams: Promise<{
    buscar?: string;
    crear?: string;
  }>;
}

export default async function RescatadosPage({ searchParams }: RescatadosPageProps) {
  const params = await searchParams;
  const searchName = params.buscar || "";
  const showCreateForm = params.crear === "true";

  let rescuedList: any[] = [];
  let dbError = null;

  try {
    const supabase = await createClient();
    let query = supabase.from("rescued_people").select("*");

    if (searchName) {
      query = query.ilike("full_name", `%${searchName}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) dbError = error.message;
    else if (data) rescuedList = data;
  } catch (err: any) {
    dbError = err.message;
  }

  // Fallback mocks si falla base de datos
  const mockRescued = [
    {
      id: "demo-rescued-1",
      full_name: "Yolanda Isabel Castro",
      photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop",
      description: "Aproximadamente 60 años. Se encontraba deshidratada pero sin heridas graves.",
      rescued_location: "Zona residencial, Av. Gran Mariscal, Cumaná",
      hospital_or_shelter: "Hospital Central de Cumaná",
      health_status: "Estable / En observación",
      reported_by_name: "Carlos Castro (Hijo)",
      rescued_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "demo-rescued-2",
      full_name: "Niño de aprox. 8 años (Por identificar)",
      photo_url: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=300&auto=format&fit=crop",
      description: "Pelo castaño corto, ojos oscuros. Estaba solo al momento del rescate. Viste franela azul con rayas rojas.",
      rescued_location: "Sector El Milagro, Maracay",
      hospital_or_shelter: "Albergue de la Cruz Roja, Polideportivo Las Delicias",
      health_status: "Estable / Asustado",
      reported_by_name: "Grupo de Rescate Aragua",
      rescued_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  const usingMock = rescuedList.length === 0 && !searchName && dbError;
  const activeList = usingMock ? mockRescued : rescuedList;

  return (
    <div className="py-8 px-4 md:py-12 max-w-7xl mx-auto w-full space-y-8 flex-1 flex flex-col">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
            <Heart className="text-emerald-500 fill-emerald-500" />
            <span>Personas Rescatadas / Localizadas</span>
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl">
            Consulte la lista de personas que han sido localizadas con vida tras el evento. Si reconoce a un familiar o persona sin identificar en esta lista, póngase en contacto con el refugio de traslado.
          </p>
        </div>

        <div>
          {showCreateForm ? (
            <a
              href="/rescatados"
              className="inline-flex items-center space-x-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>Ver Lista de Rescatados</span>
            </a>
          ) : (
            <a
              href="/rescatados?crear=true"
              className="inline-flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <PlusCircle size={16} />
              <span>Reportar Rescatado</span>
            </a>
          )}
        </div>
      </div>

      {showCreateForm ? (
        <div className="py-4">
          <RescuedPersonForm />
        </div>
      ) : (
        <div className="space-y-6 flex-1 flex flex-col">
          {/* Buscador Simple */}
          <form method="GET" action="/rescatados" className="flex gap-2 max-w-md">
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
              <Heart className="h-10 w-10 text-gray-300 mb-2" />
              <h3 className="text-base font-bold text-gray-700">No hay reportes de rescatados registrados</h3>
              <p className="text-xs text-gray-500 mt-1">
                Si conoces el rescate o paradero de alguna persona con vida que no esté en la lista, utiliza el botón superior para registrarla.
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
                      src={person.photo_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop"}
                      alt={person.full_name || "Persona Rescatada"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <StatusBadge status="Rescatado" />
                    </div>
                  </div>

                  {/* Detalle */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-gray-900 leading-snug">{person.full_name || "Desconocido/a (Por Identificar)"}</h3>
                      {person.health_status && (
                        <span className="inline-block rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          Salud: {person.health_status}
                        </span>
                      )}

                      <div className="flex items-start space-x-1.5 text-sm text-gray-600 mt-2">
                        <MapPin size={16} className="text-[#C0392B] shrink-0 mt-0.5" />
                        <span>Rescate en: {person.rescued_location || "No especificado"}</span>
                      </div>

                      <div className="flex items-start space-x-1.5 text-sm text-gray-600">
                        <Hospital size={16} className="text-blue-600 shrink-0 mt-0.5" />
                        <span>Ubicación: <strong className="text-gray-800">{person.hospital_or_shelter}</strong></span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-600 leading-relaxed italic">
                        "{person.description || "Sin descripción de rescate detallada."}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-50 pt-3">
                      <div className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>Rescatado: {person.rescued_at ? new Date(person.rescued_at).toLocaleDateString("es-VE") : new Date(person.created_at).toLocaleDateString("es-VE")}</span>
                      </div>
                      <span className="font-semibold text-gray-500">Reporta: {person.reported_by_name || "Anónimo"}</span>
                    </div>

                    <a
                      href={`/emergencias`}
                      className="w-full text-center block rounded-lg bg-gray-100 hover:bg-gray-200 py-2 text-xs font-bold text-gray-700 transition-colors"
                    >
                      Reconozco a esta persona / Contactar Albergue
                    </a>
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
