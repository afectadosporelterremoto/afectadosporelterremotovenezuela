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
  User, 
  AlertTriangle 
} from "lucide-react";
import PrivacyNotice from "@/components/PrivacyNotice";

interface DetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PersonDetailPage({ params }: DetailPageProps) {
  const { id } = await params;

  let person: any = null;
  let isAdmin = false;
  let errorMsg = null;

  try {
    const supabase = await createClient();
    
    // Verificar si es administrador
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

    // Buscar a la persona (bypass RLS si es admin, de lo contrario PostgREST aplica RLS)
    const { data, error } = await supabase
      .from("affected_people")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      errorMsg = error.message;
    } else {
      person = data;
    }
  } catch (err: any) {
    errorMsg = err.message;
  }

  // Mocks de fallback para testing local si no existe en BD
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
      {
        id: "demo-3",
        full_name: "Andrés Eloy Blanco",
        cedula: "V-20345678",
        phone: "0416-5551234",
        state: "Miranda",
        city: "Guarenas",
        municipality: "Plaza",
        parish: "Guarenas",
        exact_address: "Urbanización Vicente Emilio Sojo, Bloque 4, Piso 2, Apto A",
        reference_point: "Detrás del CDI",
        status: "Hospitalizado",
        situation_description: "Ingresado con traumatismo en el Hospital del Seguro Social de Guarenas. Requiere insumos médicos.",
        person_photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop",
        place_photo_url: "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?q=80&w=300&auto=format&fit=crop",
        registered_by_name: "María Blanco (Esposa)",
        registered_by_phone: "0416-9993322",
        created_at: new Date().toISOString(),
      },
    ].find((p) => p.id === id);
  }

  if (!person) {
    notFound();
  }

  const defaultPhoto = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop";

  return (
    <div className="py-8 px-4 md:py-12 max-w-4xl mx-auto w-full space-y-6 flex-1">
      {/* Botón de Retorno */}
      <Link
        href="/buscar"
        className="inline-flex items-center space-x-1 text-sm font-semibold text-gray-600 hover:text-[#0B1F3A]"
      >
        <ArrowLeft size={16} />
        <span>Volver a la búsqueda</span>
      </Link>

      {/* Tarjeta de Detalle Principal */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
        {/* Cabecera / Cover */}
        <div className="bg-[#0B1F3A] text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <StatusBadge status={person.status} />
              {isAdmin && (
                <span className="rounded-md bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-[#F2C94C] uppercase">
                  Vista Admin
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{person.full_name}</h1>
            <p className="text-xs text-gray-300">
              ID de Registro: <span className="font-mono">{person.id}</span>
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fotos */}
            <div className="md:col-span-1 space-y-4">
              <div className="aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={person.person_photo_url || defaultPhoto}
                  alt={person.full_name}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-[11px] text-center text-gray-500 font-semibold uppercase tracking-wider">Foto del Afectado</p>

              {person.place_photo_url && (
                <>
                  <div className="aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 mt-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={person.place_photo_url}
                      alt="Ubicación afectada"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-[11px] text-center text-gray-500 font-semibold uppercase tracking-wider">Foto de Estructura/Lugar</p>
                </>
              )}
            </div>

            {/* Información Detallada */}
            <div className="md:col-span-2 space-y-6">
              {/* Información Personal */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Información Personal</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-xs font-medium text-gray-500">Cédula</span>
                    <span className="font-bold text-gray-800">
                      {isAdmin ? person.cedula || "No registrada" : maskCedula(person.cedula)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500">Teléfono</span>
                    <span className="font-bold text-gray-800">
                      {isAdmin ? person.phone || "No registrado" : maskPhone(person.phone)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información Geográfica */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Última Ubicación Conocida</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-xs font-medium text-gray-500">Estado</span>
                    <span className="font-semibold text-gray-800">{person.state}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500">Ciudad</span>
                    <span className="font-semibold text-gray-800">{person.city}</span>
                  </div>
                  {person.municipality && (
                    <div>
                      <span className="block text-xs font-medium text-gray-500">Municipio</span>
                      <span className="font-semibold text-gray-800">{person.municipality}</span>
                    </div>
                  )}
                  {person.parish && (
                    <div>
                      <span className="block text-xs font-medium text-gray-500">Parroquia</span>
                      <span className="font-semibold text-gray-800">{person.parish}</span>
                    </div>
                  )}
                </div>

                <div className="text-sm pt-2">
                  <span className="block text-xs font-medium text-gray-500">Dirección Exacta</span>
                  <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">
                    {maskAddress(person.exact_address, isAdmin)}
                  </p>
                </div>

                {person.reference_point && (
                  <div className="text-sm">
                    <span className="block text-xs font-medium text-gray-500">Punto de Referencia</span>
                    <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">
                      {isAdmin ? person.reference_point : "Oculto por motivos de seguridad"}
                    </p>
                  </div>
                )}

                {(person.latitude || person.longitude) && isAdmin && (
                  <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                    <div>
                      <span className="block text-xs font-medium text-gray-500">Latitud</span>
                      <span className="font-mono text-gray-800 font-semibold">{person.latitude}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-gray-500">Longitud</span>
                      <span className="font-mono text-gray-800 font-semibold">{person.longitude}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Descripción de la Situación */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Descripción de la Situación</h3>
                <p className="text-sm text-gray-700 leading-relaxed bg-[#0B1F3A]/5 p-4 rounded-lg border border-[#0B1F3A]/10 italic">
                  "{person.situation_description || "No se ha suministrado una descripción específica para este registro."}"
                </p>
              </div>

              {/* Datos de quien registró */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Datos de Quien Registró</h3>
                {isAdmin ? (
                  <div className="grid grid-cols-2 gap-4 text-sm bg-amber-50/50 border border-amber-200 p-4 rounded-lg">
                    <div>
                      <span className="block text-xs font-medium text-gray-500">Nombre de Registro</span>
                      <span className="font-bold text-gray-800">{person.registered_by_name}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-gray-500">Teléfono de Registro</span>
                      <span className="font-bold text-gray-800">{person.registered_by_phone}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-150">
                    <Info size={16} className="text-[#0B1F3A]" />
                    <span>Los datos del informante están protegidos. Solo el personal de rescate y administradores tienen acceso.</span>
                  </div>
                )}
              </div>

              {/* Fecha de Registro */}
              <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                <Calendar size={14} />
                <span>Fecha del Registro: {new Date(person.created_at).toLocaleString("es-VE")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isAdmin && <PrivacyNotice />}
    </div>
  );
}
