import React from "react";
import { createClient } from "@/utils/supabase/server";
import AdminHospitalizadosList from "@/components/AdminHospitalizadosList";
import { AlertCircle, Building } from "lucide-react";
import { formatVenezuelaDateTime } from "@/utils/date";

export const metadata = {
  title: "Administrar Hospitalizados | Terremoto Venezuela",
};

export default async function AdminHospitalizadosPage() {
  let patients: any[] = [];
  let errorMsg = null;

  try {
    const supabase = await createClient();
    
    // Fetch all hospitalized patients (Admins bypass RLS)
    const { data: patientsData, error: patientsError } = await supabase
      .from("affected_people")
      .select("*")
      .eq("status", "Hospitalizado")
      .order("created_at", { ascending: false });

    if (patientsError) errorMsg = patientsError.message;
    if (patientsData) patients = patientsData;
  } catch (err: any) {
    errorMsg = err.message;
  }

  // Mocks fallback if DB fails
  const mockPatients = [
    {
      id: "demo-h1",
      full_name: "Andrés Eloy Blanco",
      cedula: "V-20345678",
      exact_address: "Hospital Dr. Domingo Luciani (El Llanito)",
      city: "Caracas",
      state: "Distrito Capital",
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "demo-h2",
      full_name: "Francis Medina",
      cedula: "V-2856598",
      exact_address: "Hospital Miguel Pérez Carreño (La Yaguara)",
      city: "Caracas",
      state: "Distrito Capital",
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  const usingMock = patients.length === 0 && errorMsg;
  const activeList = usingMock ? mockPatients : patients;

  const dates = activeList.map((p) => new Date(p.updated_at || p.created_at).getTime());
  const lastUpdate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
          <Building className="text-[#0B1F3A]" />
          <span>Panel de Hospitalizados (Revisión)</span>
        </h1>
        <p className="text-xs text-gray-500">
          Modere la lista de ciudadanos ingresados en centros médicos. Publique o oculte registros para visualización pública de familiares.
        </p>
        <p className="text-xs text-gray-500 font-semibold mt-1">
          Última actualización de hospitalizados: <span className="text-gray-700 font-bold">{formatVenezuelaDateTime(lastUpdate)}</span>
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start space-x-2 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">Modo Demostración Activo:</p>
            <p className="text-xs">Los datos a continuación son ficticios para permitir la previsualización del panel ({errorMsg}).</p>
          </div>
        </div>
      )}

      <AdminHospitalizadosList initialPatients={activeList} />
    </div>
  );
}
