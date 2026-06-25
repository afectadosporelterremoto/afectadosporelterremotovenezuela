import React from "react";
import { createClient } from "@/utils/supabase/server";
import AdminRescatadosList from "@/components/AdminRescatadosList";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Administrar Rescatados | Terremoto Venezuela",
};

export default async function AdminRescatadosPage() {
  let people: any[] = [];
  let errorMsg = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("rescued_people")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) errorMsg = error.message;
    else if (data) people = data;
  } catch (err: any) {
    errorMsg = err.message;
  }

  // Mocks de demostración
  const mockPeople = [
    {
      id: "demo-rescued-1",
      full_name: "Yolanda Isabel Castro",
      photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop",
      description: "Aproximadamente 60 años. Se encontraba deshidratada pero sin heridas graves.",
      rescued_location: "Zona residencial, Av. Gran Mariscal, Cumaná",
      hospital_or_shelter: "Hospital Central de Cumaná",
      health_status: "Estable / En observación",
      reported_by_name: "Carlos Castro (Hijo)",
      reported_by_phone: "0414-9998877",
      rescued_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  const usingMock = people.length === 0 && errorMsg;
  const activePeople = usingMock ? mockPeople : people;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Administración de Personas Rescatadas</h1>
        <p className="text-xs text-gray-500">
          Revise los reportes de personas que han sido localizadas con vida y elimine posibles duplicados.
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

      <AdminRescatadosList initialPeople={activePeople} />
    </div>
  );
}
