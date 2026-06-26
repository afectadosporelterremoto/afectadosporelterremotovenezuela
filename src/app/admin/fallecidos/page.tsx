import React from "react";
import { getAdminDeceasedPeople } from "@/app/actions";
import AdminFallecidosList from "@/components/AdminFallecidosList";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Administrar Fallecidos | Terremoto Venezuela",
};

export default async function AdminFallecidosPage() {
  let people: any[] = [];
  let errorMsg = null;

  try {
    const res = await getAdminDeceasedPeople();
    if (res && "error" in res && res.error) {
      errorMsg = res.error;
    } else if (res && "data" in res && res.data) {
      people = res.data;
    }
  } catch (err: any) {
    errorMsg = err.message;
  }

  // Mocks de demostración si hay error o está vacío
  const mockDeceased = [
    {
      id: "demo-deceased-1",
      full_name: "Luis Alejandro Medina",
      cedula: "V-8451296",
      age: 48,
      state: "Sucre",
      city: "Cumaná",
      location: "Sector El Monumental, Calle 3",
      source_type: "oficial",
      source_name: "Protección Civil Sucre",
      source_contact: "PC Sucre Oficina",
      verification_status: "confirmed" as const,
      is_public: true,
      notes: "Cuerpo rescatado de entre los escombros del Edificio Sucre y plenamente identificado por familiares.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: null,
    },
    {
      id: "demo-deceased-2",
      full_name: "Carmen Elena Rivas",
      cedula: "V-11025874",
      age: 62,
      state: "Sucre",
      city: "Cariaco",
      location: "Sector El Clavel, Av. Bolívar",
      source_type: "familiar",
      source_name: "Hijo de la fallecida",
      source_contact: "0414-7894512",
      verification_status: "pending_review" as const,
      is_public: false,
      notes: "Reportado por familiar, se espera confirmación de morgue u organismo oficial antes de publicar.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: null,
    }
  ];

  const usingMock = people.length === 0 && errorMsg;
  const displayPeople = usingMock ? mockDeceased : people;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gestión Manual de Fallecidos</h1>
        <p className="text-xs text-gray-500">
          Registre y valide la lista de personas fallecidas a causa del sismo. Solo se mostrarán públicamente aquellos registros marcados como Confirmados e Habilitados como Públicos.
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

      <AdminFallecidosList initialPeople={displayPeople} />
    </div>
  );
}
