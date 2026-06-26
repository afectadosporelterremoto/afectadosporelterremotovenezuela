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
    tipo?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const { nombre, cedula, estado, status, tipo } = params;

  let consolidatedList: any[] = [];
  let dbError = null;

  try {
    const supabase = await createClient();

    // 1. Query affected_people (public records only)
    let affectedQuery = supabase
      .from("affected_people")
      .select("id, full_name, cedula, phone, state, city, municipality, status, situation_description, person_photo_url, exact_address, created_at, updated_at")
      .eq("is_public", true);

    // 2. Query missing_people
    let missingQuery = supabase
      .from("missing_people")
      .select("id, full_name, cedula, photo_url, last_seen_location, physical_description, status, notes, created_at, updated_at, approximate_age");

    // 3. Query rescued_people
    let rescuedQuery = supabase
      .from("rescued_people")
      .select("id, full_name, photo_url, description, rescued_location, hospital_or_shelter, health_status, created_at, updated_at");

    // Apply Filters
    if (nombre) {
      affectedQuery = affectedQuery.ilike("full_name", `%${nombre}%`);
      missingQuery = missingQuery.ilike("full_name", `%${nombre}%`);
      rescuedQuery = rescuedQuery.ilike("full_name", `%${nombre}%`);
    }

    if (cedula) {
      affectedQuery = affectedQuery.ilike("cedula", `%${cedula}%`);
      missingQuery = missingQuery.ilike("cedula", `%${cedula}%`);
      // rescued_people does not have a cedula column, force empty if searching by cedula
      rescuedQuery = rescuedQuery.eq("id", "00000000-0000-0000-0000-000000000000");
    }

    if (estado) {
      affectedQuery = affectedQuery.eq("state", estado);
      missingQuery = missingQuery.ilike("last_seen_location", `%${estado}%`);
      rescuedQuery = rescuedQuery.or(`rescued_location.ilike.%${estado}%,hospital_or_shelter.ilike.%${estado}%`);
    }

    const [affectedRes, missingRes, rescuedRes] = await Promise.all([
      affectedQuery,
      missingQuery,
      rescuedQuery,
    ]);

    let list: any[] = [];

    // Map affected_people to unified format
    if (affectedRes.data) {
      affectedRes.data.forEach((p) => {
        const isHospitalized = p.status === "Hospitalizado";
        const isRescued = p.status === "Rescatado" || p.status === "Localizado";
        
        let recordType = "afectado";
        if (isHospitalized) recordType = "hospitalizado";
        else if (isRescued) recordType = "rescatado";

        list.push({
          id: p.id,
          full_name: p.full_name,
          cedula: p.cedula,
          phone: p.phone,
          state: p.state,
          city: p.city,
          municipality: p.municipality,
          status: p.status,
          situation_description: p.situation_description || (isHospitalized ? `Hospitalizado en: ${p.exact_address}` : undefined),
          person_photo_url: p.person_photo_url,
          exact_address: p.exact_address,
          created_at: p.created_at,
          updated_at: p.updated_at,
          type: recordType,
        });
      });
    }

    // Map missing_people to unified format
    if (missingRes.data) {
      // Filter out pending reviews
      const filteredMissing = missingRes.data.filter((p) => !p.notes?.includes("[PENDING REVIEW]"));
      filteredMissing.forEach((p) => {
        const isHospitalized = p.status === "hospitalized";
        const isRescued = p.status === "located" || p.status === "rescued";
        
        let recordType = "desaparecido";
        if (isHospitalized) recordType = "hospitalizado";
        else if (isRescued) recordType = "rescatado";

        list.push({
          id: p.id,
          full_name: p.full_name,
          cedula: p.cedula,
          phone: undefined,
          state: "Varios",
          city: p.last_seen_location,
          municipality: undefined,
          status: isHospitalized ? "Hospitalizado" : (isRescued ? "Rescatado" : "Sin localizar"),
          situation_description: p.physical_description || p.notes,
          person_photo_url: p.photo_url,
          created_at: p.created_at,
          updated_at: p.updated_at,
          type: recordType,
        });
      });
    }

    // Map rescued_people to unified format
    if (rescuedRes.data) {
      rescuedRes.data.forEach((p) => {
        list.push({
          id: p.id,
          full_name: p.full_name || "Persona Desconocida",
          cedula: undefined,
          phone: undefined,
          state: "Varios",
          city: p.rescued_location || p.hospital_or_shelter || "Desconocida",
          municipality: undefined,
          status: "Rescatado",
          situation_description: p.description || `Ubicado en: ${p.hospital_or_shelter || "Albergue"}`,
          person_photo_url: p.photo_url,
          hospital_or_shelter: p.hospital_or_shelter,
          created_at: p.created_at,
          updated_at: p.updated_at,
          type: "rescatado",
        });
      });
    }

    // Deduplication with priority
    // Priority order: 1. Rescatado/localizado, 2. Hospitalizado, 3. Desaparecido, 4. Afectado
    function getStatusPriority(status: string, type: string): number {
      const normStatus = (status || "").toLowerCase().trim();
      const normType = (type || "").toLowerCase().trim();
      if (normStatus === "rescatado" || normStatus === "localizado" || normStatus === "located" || normStatus === "rescued") {
        return 1;
      }
      if (normStatus === "hospitalizado" || normStatus === "hospitalized" || normType === "hospitalizado") {
        return 2;
      }
      if (normStatus === "sin localizar" || normStatus === "missing") {
        return 3;
      }
      return 4;
    }

    const groups: { bestRecord: any; cedulaKeys: Set<string>; nameKeys: Set<string> }[] = [];

    list.forEach((p) => {
      const cc = p.cedula ? p.cedula.replace(/[^0-9]/g, "") : "";
      const nn = p.full_name ? p.full_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "") : "";

      // Find an existing group
      let matchedGroup = groups.find((g) => {
        if (cc && g.cedulaKeys.has(cc)) return true;
        if (nn && g.nameKeys.has(nn)) return true;
        return false;
      });

      if (matchedGroup) {
        if (cc) matchedGroup.cedulaKeys.add(cc);
        if (nn) matchedGroup.nameKeys.add(nn);

        const currentBest = matchedGroup.bestRecord;
        const pPrio = getStatusPriority(p.status, p.type);
        const bestPrio = getStatusPriority(currentBest.status, currentBest.type);

        const dateA = new Date(currentBest.updated_at || currentBest.created_at).getTime();
        const dateB = new Date(p.updated_at || p.created_at).getTime();
        const maxDate = new Date(Math.max(dateA, dateB)).toISOString();

        if (pPrio < bestPrio) {
          // p has higher status priority, replace bestRecord but keep merged details
          matchedGroup.bestRecord = {
            ...currentBest,
            ...p,
            person_photo_url: p.person_photo_url || currentBest.person_photo_url,
            exact_address: p.exact_address || currentBest.exact_address,
            hospital_or_shelter: p.hospital_or_shelter || currentBest.hospital_or_shelter,
            phone: p.phone || currentBest.phone,
            situation_description: p.situation_description || currentBest.situation_description,
            updated_at: maxDate,
          };
        } else {
          // Keep current bestRecord but merge useful details from p
          matchedGroup.bestRecord = {
            ...p,
            ...currentBest,
            person_photo_url: currentBest.person_photo_url || p.person_photo_url,
            exact_address: currentBest.exact_address || p.exact_address,
            hospital_or_shelter: currentBest.hospital_or_shelter || p.hospital_or_shelter,
            phone: currentBest.phone || p.phone,
            situation_description: currentBest.situation_description || p.situation_description,
            updated_at: maxDate,
          };
        }
      } else {
        groups.push({
          bestRecord: { ...p },
          cedulaKeys: new Set(cc ? [cc] : []),
          nameKeys: new Set(nn ? [nn] : []),
        });
      }
    });

    list = groups.map((g) => g.bestRecord);

    // Apply category type filter (afectado, desaparecido, hospitalizado, rescatado)
    if (tipo) {
      list = list.filter((p) => p.type === tipo);
    }

    // Apply situation status filter
    if (status) {
      list = list.filter((p) => p.status === status || (status === "Hospitalizado" && p.type === "hospitalizado") || (status === "Rescatado" && p.type === "rescatado"));
    }

    // Sort chronologically descending based on latest update
    list.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
    consolidatedList = list;

    if (affectedRes.error) dbError = affectedRes.error.message;
  } catch (err: any) {
    dbError = err.message;
  }

  const usingMock = consolidatedList.length === 0 && !nombre && !cedula && !estado && !status && !tipo && dbError;

  // Fallback mocks if DB is not available
  const mockPeople = [
    {
      id: "demo-1",
      full_name: "Luis Alejandro Medina",
      cedula: "V-14567890",
      phone: "0424-1234567",
      state: "Aragua",
      city: "Maracay",
      status: "Sin localizar",
      situation_description: "Estaba en su oficina en el centro de Maracay al momento del sismo. No se ha reportado en casa.",
      person_photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
      created_at: new Date().toISOString(),
      type: "afectado",
    },
    {
      id: "demo-2",
      full_name: "Yolanda Isabel Castro",
      cedula: "V-8765432",
      phone: "0412-9876543",
      state: "Sucre",
      city: "Cumaná",
      status: "Rescatado",
      situation_description: "Rescatada de los escombros del edificio de apartamentos. Se encuentra a salvo.",
      person_photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop",
      created_at: new Date().toISOString(),
      type: "rescatado",
    },
    {
      id: "demo-3",
      full_name: "Andrés Eloy Blanco",
      cedula: "V-20345678",
      phone: "0416-5551234",
      state: "Miranda",
      city: "Guarenas",
      status: "Hospitalizado",
      situation_description: "Ingresado con traumatismo en el Hospital del Seguro Social de Guarenas. Requiere insumos médicos.",
      person_photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop",
      created_at: new Date().toISOString(),
      type: "hospitalizado",
    },
  ];

  const activeList = usingMock ? mockPeople : consolidatedList;

  return (
    <div className="py-8 px-4 md:py-12 max-w-7xl mx-auto w-full space-y-8 flex-1 flex flex-col">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center space-x-2">
          <Search className="text-[#0B1F3A]" />
          <span>Buscador Global de Personas</span>
        </h1>
        <p className="text-sm text-gray-500 max-w-2xl">
          Busca en todas las categorías (Afectados, Desaparecidos, Hospitalizados y Rescatados) de forma unificada. Por razones de confidencialidad, los datos sensibles se muestran enmascarados.
        </p>
      </div>

      <SearchFilters />

      {dbError && !usingMock && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-start space-x-2 text-sm text-blue-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" />
          <div>
            <p className="font-semibold">Nota de demostración:</p>
            <p className="text-xs">Mostrando registros locales debido a problemas de conexión de base de datos ({dbError}).</p>
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
            <PersonCard key={`${person.type}-${person.id}`} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
