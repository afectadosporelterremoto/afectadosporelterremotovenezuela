import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { maskCedula, maskPhone, maskAddress } from "@/utils/mask";
import StatusBadge from "@/components/StatusBadge";
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Shield, 
  Calendar, 
  Info, 
  AlertTriangle 
} from "lucide-react";
import PrivacyNotice from "@/components/PrivacyNotice";
import { formatVenezuelaDateTime } from "@/utils/date";

interface DetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PersonDetailPage({ params }: DetailPageProps) {
  const { id } = await params;

  let person: any = null;
  let isAdmin = false;
  let recordType = "afectado"; // 'afectado' | 'desaparecido' | 'hospitalizado' | 'rescatado'
  let unifiedPerson: any = {};

  try {
    const supabase = await createClient();
    
    // Verify Admin Status
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("role")
        .eq("user_id", user.id)
        .single();
      if (adminUser && adminUser.role === "admin") {
        isAdmin = true;
      }
    }

    // 1. Try fetching from affected_people
    const { data: affectedData } = await supabase
      .from("affected_people")
      .select("*")
      .eq("id", id)
      .single();

    if (affectedData) {
      person = affectedData;
      recordType = affectedData.status === "Hospitalizado" ? "hospitalizado" : "afectado";
      unifiedPerson = {
        id: affectedData.id,
        full_name: affectedData.full_name,
        cedula: affectedData.cedula,
        phone: affectedData.phone,
        state: affectedData.state,
        city: affectedData.city,
        municipality: affectedData.municipality,
        parish: affectedData.parish,
        exact_address: affectedData.exact_address,
        reference_point: affectedData.reference_point,
        latitude: affectedData.latitude,
        longitude: affectedData.longitude,
        status: affectedData.status,
        photo_url: affectedData.person_photo_url,
        place_photo_url: affectedData.place_photo_url,
        situation_description: affectedData.situation_description,
        registered_by_name: affectedData.registered_by_name,
        registered_by_phone: affectedData.registered_by_phone,
        created_at: affectedData.created_at,
        updated_at: affectedData.updated_at,
      };
    } else {
      // 2. Try fetching from missing_people
      const { data: missingData } = await supabase
        .from("missing_people")
        .select("*")
        .eq("id", id)
        .single();

      if (missingData) {
        person = missingData;
        recordType = missingData.status === "hospitalized" ? "hospitalizado" : (missingData.status === "located" || missingData.status === "rescued" ? "rescatado" : "desaparecido");
        unifiedPerson = {
          id: missingData.id,
          full_name: missingData.full_name,
          cedula: missingData.cedula,
          phone: undefined,
          state: "Varios",
          city: missingData.last_seen_location,
          exact_address: missingData.last_seen_location,
          status: recordType === "hospitalizado" ? "Hospitalizado" : (recordType === "rescatado" ? "Rescatado" : "Sin localizar"),
          photo_url: missingData.photo_url,
          situation_description: `Desaparecido/a. Edad aprox: ${missingData.approximate_age || "No indicada"}. Rasgos físicos: ${missingData.physical_description || "No detallados"}. Vestimenta: ${missingData.clothes_description || "No detallada"}. Notas: ${missingData.notes || ""}`,
          registered_by_name: missingData.reporter_name,
          registered_by_phone: missingData.reporter_phone,
          created_at: missingData.created_at,
          updated_at: missingData.updated_at,
        };
      } else {
        // 3. Try fetching from rescued_people
        const { data: rescuedData } = await supabase
          .from("rescued_people")
          .select("*")
          .eq("id", id)
          .single();

        if (rescuedData) {
          person = rescuedData;
          recordType = "rescatado";
          unifiedPerson = {
            id: rescuedData.id,
            full_name: rescuedData.full_name || "Persona Desconocida",
            cedula: undefined,
            phone: undefined,
            state: "Varios",
            city: rescuedData.rescued_location || "Desconocida",
            exact_address: rescuedData.rescued_location || rescuedData.hospital_or_shelter,
            status: "Rescatado",
            photo_url: rescuedData.photo_url,
            situation_description: `Localizado/a con éxito. Salud: ${rescuedData.health_status || "No especificada"}. Refugio/Hospital: ${rescuedData.hospital_or_shelter || "No detallado"}. Detalles: ${rescuedData.description || ""}`,
            registered_by_name: rescuedData.reported_by_name,
            registered_by_phone: rescuedData.reported_by_phone,
            created_at: rescuedData.created_at,
            updated_at: rescuedData.updated_at,
          };
        }
      }
    }
  } catch (err: any) {
    console.error("Error loading detail:", err);
  }

  // Demonstration Fallback mock check if not found
  if (!person && id.startsWith("demo-")) {
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
        type: "afectado",
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
        type: "rescatado",
      },
    ];
    
    const mock = mockPeople.find((p) => p.id === id);
    if (mock) {
      person = mock;
      recordType = mock.type;
      unifiedPerson = {
        ...mock,
        photo_url: mock.person_photo_url,
      };
    }
  }

  if (!person) {
    notFound();
  }

  const defaultPhoto = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop";

  return (
    <div className="py-8 px-4 md:py-12 max-w-4xl mx-auto w-full space-y-6 flex-1">
      {/* Retorno */}
      <Link
        href="/buscar"
        className="inline-flex items-center space-x-1 text-sm font-semibold text-gray-600 hover:text-[#0B1F3A]"
      >
        <ArrowLeft size={16} />
        <span>Volver a la búsqueda</span>
      </Link>

      {/* Tarjeta de Detalle */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
        {/* Cabecera */}
        <div className="bg-[#0B1F3A] text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase ${
                recordType === "desaparecido" ? "bg-red-600 text-white border-red-700" :
                recordType === "hospitalizado" ? "bg-blue-600 text-white border-blue-700" :
                recordType === "rescatado" ? "bg-emerald-600 text-white border-emerald-700" :
                "bg-slate-700 text-white border-slate-800"
              }`}>
                {recordType === "desaparecido" ? "Desaparecido" :
                 recordType === "hospitalizado" ? "Hospitalizado" :
                 recordType === "rescatado" ? "Rescatado" : "Afectado"}
              </span>
              <StatusBadge status={unifiedPerson.status} />
              {isAdmin && (
                <span className="rounded-md bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-[#F2C94C] uppercase">
                  Vista Admin
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{unifiedPerson.full_name}</h1>
            <p className="text-xs text-gray-300">
              ID de Registro: <span className="font-mono">{unifiedPerson.id}</span>
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Foto */}
            <div className="md:col-span-1 space-y-4">
              <div className="aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={unifiedPerson.photo_url || defaultPhoto}
                  alt={unifiedPerson.full_name}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-[11px] text-center text-gray-500 font-semibold uppercase tracking-wider">Fotografía registrada</p>

              {unifiedPerson.place_photo_url && (
                <>
                  <div className="aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 mt-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={unifiedPerson.place_photo_url}
                      alt="Ubicación afectada"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-[11px] text-center text-gray-500 font-semibold uppercase tracking-wider">Foto del Lugar</p>
                </>
              )}
            </div>

            {/* Detalles */}
            <div className="md:col-span-2 space-y-6">
              {/* Información Personal */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Información Personal</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-xs font-medium text-gray-500">Cédula</span>
                    <span className="font-bold text-gray-800">
                      {isAdmin ? unifiedPerson.cedula || "No registrada" : maskCedula(unifiedPerson.cedula)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500">Teléfono</span>
                    <span className="font-bold text-gray-800">
                      {isAdmin ? unifiedPerson.phone || "No registrado" : maskPhone(unifiedPerson.phone)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Ubicación y Localización</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-xs font-medium text-gray-500">Estado</span>
                    <span className="font-semibold text-gray-800">{unifiedPerson.state || "No especificado"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500">Ciudad / Lugar</span>
                    <span className="font-semibold text-gray-800">{unifiedPerson.city || "No especificada"}</span>
                  </div>
                </div>

                <div className="text-sm pt-2">
                  <span className="block text-xs font-medium text-gray-500">Dirección o Lugar del Suceso</span>
                  <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">
                    {maskAddress(unifiedPerson.exact_address, isAdmin)}
                  </p>
                </div>

                {unifiedPerson.reference_point && (
                  <div className="text-sm">
                    <span className="block text-xs font-medium text-gray-500">Punto de Referencia</span>
                    <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">
                      {isAdmin ? unifiedPerson.reference_point : "Oculto por seguridad"}
                    </p>
                  </div>
                )}
              </div>

              {/* Descripción de la Situación */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Descripción de la Situación</h3>
                <p className="text-sm text-gray-700 leading-relaxed bg-[#0B1F3A]/5 p-4 rounded-lg border border-[#0B1F3A]/10 italic">
                  "{unifiedPerson.situation_description || "Sin descripción detallada de la situación."}"
                </p>
              </div>

              {/* Informante */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Datos del Reportante (Contacto)</h3>
                {isAdmin ? (
                  <div className="grid grid-cols-2 gap-4 text-sm bg-amber-50/50 border border-amber-200 p-4 rounded-lg">
                    <div>
                      <span className="block text-xs font-medium text-gray-500">Nombre de Contacto</span>
                      <span className="font-bold text-gray-800">{unifiedPerson.registered_by_name || "No indicado"}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-gray-500">Teléfono de Contacto</span>
                      <span className="font-bold text-gray-800">{unifiedPerson.registered_by_phone || "No indicado"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-150">
                    <Info size={16} className="text-[#0B1F3A]" />
                    <span>Los datos del contacto familiar se encuentran protegidos. Solo personal autorizado tiene acceso.</span>
                  </div>
                )}
              </div>

              {/* Fecha */}
              <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                <Calendar size={14} />
                <span>Última actualización: {formatVenezuelaDateTime(unifiedPerson.updated_at || unifiedPerson.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isAdmin && <PrivacyNotice />}
    </div>
  );
}
