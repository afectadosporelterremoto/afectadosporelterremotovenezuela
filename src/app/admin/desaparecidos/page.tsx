import React from "react";
import { createClient } from "@/utils/supabase/server";
import AdminDesaparecidosList from "@/components/AdminDesaparecidosList";
import { AlertCircle } from "lucide-react";
import { formatVenezuelaDateTime } from "@/utils/date";

export const metadata = {
  title: "Administrar Desaparecidos | Terremoto Venezuela",
};

export default async function AdminDesaparecidosPage() {
  let people: any[] = [];
  let errorMsg = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("missing_people")
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
      status: "missing",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const usingMock = people.length === 0 && errorMsg;
  const activePeople = usingMock ? mockPeople : people;

  const dates = activePeople.map((p) => new Date(p.updated_at || p.created_at).getTime());
  const lastUpdate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Administración de Personas Desaparecidas</h1>
        <p className="text-xs text-gray-500">
          Supervise los reportes de búsqueda activos y actualice sus estados cuando sean localizados o rescatados.
        </p>
        <p className="text-xs text-gray-500 font-semibold mt-1">
          Última actualización de desaparecidos: <span className="text-gray-700 font-bold">{formatVenezuelaDateTime(lastUpdate)}</span>
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

      <AdminDesaparecidosList initialPeople={activePeople} />
    </div>
  );
}
