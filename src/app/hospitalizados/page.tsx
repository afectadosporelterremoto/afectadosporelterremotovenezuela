import React from "react";
import { createClient } from "@/utils/supabase/server";
import { maskCedula } from "@/utils/mask";
import { Search, MapPin, Building, Calendar, AlertCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

export const metadata = {
  title: "Pacientes Hospitalizados | Terremoto Venezuela",
  description: "Consulte la lista pública de ciudadanos ingresados en centros hospitalarios tras el sismo en Venezuela.",
};

interface HospitalizadosPageProps {
  searchParams: Promise<{
    buscar?: string;
  }>;
}

export default async function HospitalizadosPage({ searchParams }: HospitalizadosPageProps) {
  const params = await searchParams;
  const searchName = params.buscar || "";

  let patients: any[] = [];
  let dbError = null;

  try {
    const supabase = await createClient();
    let query = supabase
      .from("affected_people")
      .select("id, full_name, cedula, exact_address, city, state, created_at")
      .eq("status", "Hospitalizado")
      .eq("is_public", true);

    if (searchName) {
      query = query.or(`full_name.ilike.%${searchName}%,exact_address.ilike.%${searchName}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) dbError = error.message;
    else if (data) patients = data;
  } catch (err: any) {
    dbError = err.message;
  }

  // Mocks fallback if DB fails and no search is entered
  const mockPatients = [
    {
      id: "demo-h1",
      full_name: "Andrés Eloy Blanco",
      cedula: "V-20345678",
      exact_address: "Hospital Dr. Domingo Luciani (El Llanito)",
      city: "Caracas",
      state: "Distrito Capital",
      created_at: new Date().toISOString(),
    },
    {
      id: "demo-h2",
      full_name: "Francis Medina",
      cedula: "V-2856598",
      exact_address: "Hospital Miguel Pérez Carreño (La Yaguara)",
      city: "Caracas",
      state: "Distrito Capital",
      created_at: new Date().toISOString(),
    }
  ];

  const usingMock = patients.length === 0 && !searchName && dbError;
  const activeList = usingMock ? mockPatients : patients;

  return (
    <div className="py-8 px-4 md:py-12 max-w-7xl mx-auto w-full space-y-8 flex-1 flex flex-col">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center space-x-2">
          <Building className="text-[#0B1F3A]" />
          <span>Lista Pública de Hospitalizados</span>
        </h1>
        <p className="text-sm text-gray-500 max-w-2xl">
          Listado de personas ingresadas en centros de salud. Esta información es pública para facilitar la ubicación de familiares. Los datos sensibles están protegidos.
        </p>
      </div>

      {/* Buscador interno */}
      <form method="GET" action="/hospitalizados" className="max-w-xl flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            name="buscar"
            defaultValue={searchName}
            placeholder="Buscar por nombre o centro hospitalario..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2.5 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#152e4f] transition-colors"
        >
          Buscar
        </button>
      </form>

      {dbError && !usingMock && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-start space-x-2 text-xs text-blue-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
          <span>Mostrando lista de ejemplo debido a problemas de conexión de base de datos ({dbError}).</span>
        </div>
      )}

      {activeList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <Building className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-gray-700">No se encontraron pacientes hospitalizados</h3>
          <p className="text-xs text-gray-500 mt-1">
            Intente con otra búsqueda o vuelva a consultar más tarde.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeList.map((patient) => (
            <div key={patient.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <h3 className="text-base font-bold text-gray-900 leading-tight">{patient.full_name}</h3>
                <StatusBadge status="Hospitalizado" />
              </div>

              <div className="text-xs text-gray-500 font-semibold flex items-center space-x-1">
                <Shield size={13} className="text-gray-400" />
                <span>Cédula: {maskCedula(patient.cedula)}</span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <div className="flex items-start space-x-1.5 text-xs text-gray-600">
                  <Building size={14} className="text-[#0B1F3A] shrink-0 mt-0.5" />
                  <span className="font-semibold">{patient.exact_address || "Centro médico no indicado"}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                  <MapPin size={14} className="text-[#C0392B] shrink-0" />
                  <span>{patient.city}, {patient.state}</span>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-[10px] text-gray-400 border-t border-gray-50 pt-3">
                <Calendar size={12} />
                <span>Registrado: {new Date(patient.created_at).toLocaleDateString("es-VE")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Icono inline para simplificar importaciones
function Shield({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
