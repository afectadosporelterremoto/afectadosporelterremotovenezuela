import React from "react";
import { createClient } from "@/utils/supabase/server";
import AdminEmergencyList from "@/components/AdminEmergencyList";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Administrar Números de Emergencia | Terremoto Venezuela",
};

export default async function AdminEmergenciasPage() {
  let contacts: any[] = [];
  let errorMsg = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("emergency_contacts")
      .select("*")
      .order("state", { ascending: true })
      .order("city", { ascending: true });

    if (error) errorMsg = error.message;
    else if (data) contacts = data;
  } catch (err: any) {
    errorMsg = err.message;
  }

  // Mocks de demostración
  const mockContacts = [
    {
      id: "demo-contact-1",
      state: "Nacional",
      city: "Todo el país",
      institution: "Emergencias Nacionales Ven911",
      phone: "911",
      whatsapp: null,
      address: "Sedes de videovigilancia a nivel nacional",
      official_source: "Ministerio de Relaciones Interiores, Justicia y Paz",
      is_active: true,
      verified_at: new Date().toISOString(),
    },
    {
      id: "demo-contact-2",
      state: "Aragua",
      city: "Maracay",
      institution: "Bomberos de Aragua (Maracay)",
      phone: "0243-2461011",
      whatsapp: null,
      address: "Calle Páez, Maracay",
      official_source: "Directorio del estado Aragua",
      is_active: true,
      verified_at: new Date().toISOString(),
    },
  ];

  const usingMock = contacts.length === 0 && errorMsg;
  const activeContacts = usingMock ? mockContacts : contacts;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Administración de Números de Emergencia</h1>
        <p className="text-xs text-gray-500">
          Agregue, edite o elimine los números telefónicos y albergues de asistencia humanitaria.
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

      <AdminEmergencyList initialContacts={activeContacts} />
    </div>
  );
}
