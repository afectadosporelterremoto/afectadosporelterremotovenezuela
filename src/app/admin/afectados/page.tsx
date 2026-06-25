import React from "react";
import { createClient } from "@/utils/supabase/server";
import AdminAfectadosList from "@/components/AdminAfectadosList";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Administrar Afectados | Terremoto Venezuela",
};

export default async function AdminAfectadosPage() {
  let people: any[] = [];
  let reports: any[] = [];
  let errorMsg = null;

  try {
    const supabase = await createClient();
    
    // Fetch all affected people (Admins bypass RLS)
    const { data: peopleData, error: peopleError } = await supabase
      .from("affected_people")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch all information reports
    const { data: reportsData, error: reportsError } = await supabase
      .from("information_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (peopleError) errorMsg = peopleError.message;
    if (reportsError && !errorMsg) errorMsg = reportsError.message;

    if (peopleData) people = peopleData;
    if (reportsData) reports = reportsData;
  } catch (err: any) {
    errorMsg = err.message;
  }

  // Mocks de demostración
  const mockPeople = [
    {
      id: "demo-1",
      full_name: "Luis Alejandro Medina",
      cedula: "V-14567890",
      phone: "0424-1234567",
      state: "Aragua",
      city: "Maracay",
      municipality: "Girardot",
      parish: "Las Delicias",
      exact_address: "Calle Los Robles, Quinta Esmeralda, Sector Las Delicias",
      reference_point: "Cerca del centro comercial Las Américas",
      status: "Sin localizar",
      situation_description: "Estaba en su oficina en el centro de Maracay al momento del sismo. No se ha reportado en casa.",
      person_photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
      place_photo_url: "https://images.unsplash.com/photo-1594913785162-e6785b4d1d9f?q=80&w=300&auto=format&fit=crop",
      registered_by_name: "Teresa Medina (Hermana)",
      registered_by_phone: "0412-5556789",
      created_at: new Date().toISOString(),
    },
    {
      id: "demo-2",
      full_name: "Yolanda Isabel Castro",
      cedula: "V-8765432",
      phone: "0412-9876543",
      state: "Sucre",
      city: "Cumaná",
      municipality: "Sucre",
      parish: "Altagracia",
      exact_address: "Edificio Sucre, Apt 3B, Av. Gran Mariscal",
      reference_point: "Frente al banco de Venezuela",
      status: "Rescatado",
      situation_description: "Rescatada de los escombros del edificio de apartamentos. Se encuentra a salvo.",
      person_photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop",
      place_photo_url: "https://images.unsplash.com/photo-1590012314607-cda9d9b6a9a9?q=80&w=300&auto=format&fit=crop",
      registered_by_name: "Carlos Castro (Hijo)",
      registered_by_phone: "0414-9998877",
      created_at: new Date().toISOString(),
    },
  ];

  const mockReports = [
    {
      id: "rep-1",
      related_type: "affected",
      related_id: "demo-1",
      reporter_name: "José Linares (Compañero de Trabajo)",
      reporter_phone: "0416-1234567",
      message: "Lo vi salir corriendo del edificio de oficinas sano y salvo justo después del temblor.",
      created_at: new Date().toISOString(),
    },
  ];

  const usingMock = people.length === 0 && errorMsg;
  const activePeople = usingMock ? mockPeople : people;
  const activeReports = usingMock ? mockReports : reports;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Administración de Personas Afectadas</h1>
        <p className="text-xs text-gray-500">
          Visualice todos los registros ingresados, administre los estados de localización y consulte los informes confidenciales provistos por los ciudadanos.
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

      <AdminAfectadosList initialPeople={activePeople} reports={activeReports} />
    </div>
  );
}
