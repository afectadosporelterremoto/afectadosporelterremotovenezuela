import React from "react";
import SearchFilters from "@/components/SearchFilters";
import PersonCard from "@/components/PersonCard";
import { createClient } from "@/utils/supabase/server";
import { Search, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Buscar Familiar o Persona Afectada | Terremoto Venezuela",
  description: "Busque a familiares y personas afectadas por el terremoto por su nombre, cédula o estado de localización.",
};

interface SearchPageProps {
  searchParams: Promise<{
    nombre?: string;
    cedula?: string;
    estado?: string;
    status?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const { nombre, cedula, estado, status } = params;

  let people: any[] = [];
  let dbError = null;

  try {
    const supabase = await createClient();
    let query = supabase
      .from("affected_people")
      .select("id, full_name, cedula, phone, state, city, municipality, status, situation_description, person_photo_url, created_at")
      .eq("is_public", true);

    if (nombre) {
      query = query.ilike("full_name", `%${nombre}%`);
    }
    if (cedula) {
      query = query.ilike("cedula", `%${cedula}%`);
    }
    if (estado) {
      query = query.eq("state", estado);
    }
    if (status) {
      query = query.eq("status", status);
    }

    // Ordenar por fecha de registro descendente
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      dbError = error.message;
    } else if (data) {
      people = data;
    }
  } catch (err: any) {
    dbError = err.message;
  }

  // Registros simulados de demostración si la base de datos no está disponible
  const mockPeople = [
    {
      id: "demo-1",
      full_name: "Luis Alejandro Medina",
      cedula: "V-14567890",
      phone: "0424-1234567",
      state: "Aragua",
      city: "Maracay",
      municipality: "Girardot",
      status: "Sin localizar",
      situation_description: "Estaba en su oficina en el centro de Maracay al momento del sismo. No se ha reportado en casa.",
      person_photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
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
      status: "Rescatado",
      situation_description: "Rescatada de los escombros del edificio de apartamentos. Se encuentra a salvo.",
      person_photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop",
      created_at: new Date().toISOString(),
    },
    {
      id: "demo-3",
      full_name: "Andrés Eloy Blanco",
      cedula: "V-20345678",
      phone: "0416-5551234",
      state: "Miranda",
      city: "Guarenas",
      municipality: "Plaza",
      status: "Hospitalizado",
      situation_description: "Ingresado con traumatismo en el Hospital del Seguro Social de Guarenas. Requiere insumos médicos.",
      person_photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop",
      created_at: new Date().toISOString(),
    },
  ];

  // Si no se configuró la base de datos o falló, usar los mocks filtrados
  const usingMock = people.length === 0 && !nombre && !cedula && !estado && !status && dbError;
  const activeList = usingMock ? mockPeople : people;

  return (
    <div className="py-8 px-4 md:py-12 max-w-7xl mx-auto w-full space-y-8 flex-1 flex flex-col">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center space-x-2">
          <Search className="text-[#0B1F3A]" />
          <span>Búsqueda de Familiares y Afectados</span>
        </h1>
        <p className="text-sm text-gray-500 max-w-2xl">
          Utiliza los filtros de abajo para buscar personas registradas. Por razones de confidencialidad, la cédula y el número telefónico se muestran enmascarados de forma parcial.
        </p>
      </div>

      <SearchFilters />

      {dbError && !usingMock && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-start space-x-2 text-sm text-blue-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" />
          <div>
            <p className="font-semibold">Nota de demostración:</p>
            <p className="text-xs">No se pudo conectar a Supabase ({dbError}). Mostrando registros de ejemplo con fines de demostración.</p>
          </div>
        </div>
      )}

      {activeList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center flex-1 flex flex-col items-center justify-center">
          <Search className="h-10 w-10 text-gray-400 mb-2" />
          <h3 className="text-base font-bold text-gray-700">No se encontraron resultados</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-xs">
            Intente ajustando los filtros de búsqueda o verifique que los nombres estén bien escritos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeList.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
