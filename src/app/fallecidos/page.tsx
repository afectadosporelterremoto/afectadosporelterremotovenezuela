import React from "react";
import { getPublicDeceasedPeople } from "@/app/actions";
import PublicDeceasedList from "@/components/PublicDeceasedList";
import { Heart, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Víctimas del Sismo | Terremoto Venezuela",
  description: "Registro y memoria de personas fallecidas a causa del sismo en Venezuela. Homenaje, respeto y condolencias a las familias.",
};

export default async function FallecidosPage() {
  let deceasedList: any[] = [];
  let dbError = null;

  try {
    const data = await getPublicDeceasedPeople();
    deceasedList = data || [];
  } catch (err: any) {
    dbError = err.message;
  }

  // Mocks de demostración si falla base de datos o está vacía
  const mockDeceased = [
    {
      id: "demo-public-1",
      full_name: "Luis Alejandro Medina",
      cedula: "V-8451296",
      age: 48,
      state: "Sucre",
      city: "Cumaná",
      source_type: "oficial",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  const usingMock = deceasedList.length === 0 && dbError;
  const activeList = usingMock ? mockDeceased : deceasedList;

  return (
    <div className="py-8 px-4 md:py-12 max-w-7xl mx-auto w-full space-y-8 flex-1 flex flex-col">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
            <Heart className="text-[#C0392B]" />
            <span>Registro y Memoria de Fallecidos</span>
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl">
            Listado verificado de víctimas fatales confirmadas por las autoridades a raíz del sismo.
          </p>
        </div>
      </div>

      {dbError && !usingMock && (
        <div className="rounded-lg bg-amber-50 border border-amber-250/30 p-4 flex items-start space-x-2 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">Nota de demostración:</p>
            <p className="text-xs">Mostrando registros de ejemplo ya que no hay conexión activa a Supabase ({dbError}).</p>
          </div>
        </div>
      )}

      <PublicDeceasedList initialPeople={activeList} />
    </div>
  );
}
