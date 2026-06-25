"use client";

import React, { useState } from "react";
import { Trash2, Phone, Calendar, MapPin, Eye, Shield, Hospital, Heart } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface AdminRescatadosListProps {
  initialPeople: any[];
}

export default function AdminRescatadosList({ initialPeople }: AdminRescatadosListProps) {
  const [people, setPeople] = useState(initialPeople);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar permanentemente este reporte de persona rescatada?")) return;
    setError(null);
    setDeletingId(id);
    try {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("rescued_people")
        .delete()
        .eq("id", id);

      if (dbError) {
        setError(dbError.message);
      } else {
        setPeople(people.filter((p) => p.id !== id));
        if (selectedPerson && selectedPerson.id === id) {
          setSelectedPerson(null);
        }
      }
    } catch (err: any) {
      setError("Error al eliminar el registro.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Listado */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 text-xs text-red-700 font-medium border-b border-red-150 flex items-center space-x-1.5">
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Nombre / Identificación</th>
                <th className="px-6 py-3">Lugar de Rescate</th>
                <th className="px-6 py-3">Trasladado a</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {people.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {person.full_name || "Desconocido (Por Identificar)"}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                    {person.rescued_location || "N/R"}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-emerald-700">
                    {person.hospital_or_shelter || "N/R"}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedPerson(person)}
                      className="inline-flex items-center p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-[#0B1F3A] hover:bg-gray-50 transition-colors"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(person.id)}
                      disabled={deletingId === person.id}
                      className="inline-flex items-center p-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {people.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500 font-medium">
                    No hay reportes de rescatados registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalle */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-6 space-y-6 self-start">
        {selectedPerson ? (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <span className="text-xs text-gray-400 font-bold uppercase block">Ficha de Rescatado</span>
              <h3 className="text-lg font-black text-gray-900 mt-1">{selectedPerson.full_name || "Desconocido (Por Identificar)"}</h3>
              <div className="mt-2 inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                <Heart size={12} className="fill-emerald-600 text-emerald-600" />
                <span>A Salvo / Localizado</span>
              </div>
            </div>

            {selectedPerson.photo_url && (
              <div className="aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedPerson.photo_url} alt="Ficha" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="text-xs space-y-3">
              <div>
                <span className="block text-gray-400 font-bold uppercase text-[9px]">Lugar de Rescate</span>
                <p className="text-gray-800 font-semibold leading-relaxed mt-0.5 flex items-center space-x-1">
                  <MapPin size={13} className="text-[#C0392B]" />
                  <span>{selectedPerson.rescued_location || "Sin especificar"}</span>
                </p>
              </div>

              <div>
                <span className="block text-gray-400 font-bold uppercase text-[9px]">Lugar de Traslado / Refugio</span>
                <p className="text-gray-800 font-semibold leading-relaxed mt-0.5 flex items-center space-x-1">
                  <Hospital size={13} className="text-blue-600" />
                  <span>{selectedPerson.hospital_or_shelter}</span>
                </p>
              </div>

              <div>
                <span className="block text-gray-400 font-bold uppercase text-[9px]">Estado de Salud</span>
                <p className="text-gray-800 font-semibold leading-relaxed mt-0.5">{selectedPerson.health_status || "Estable / Sin detalles"}</p>
              </div>

              <div>
                <span className="block text-gray-400 font-bold uppercase text-[9px]">Descripción del Caso</span>
                <p className="text-gray-800 font-semibold leading-relaxed mt-0.5 bg-gray-50 p-2.5 rounded-lg border border-gray-150">{selectedPerson.description || "Sin descripción adicional."}</p>
              </div>

              {selectedPerson.rescued_at && (
                <div>
                  <span className="block text-gray-400 font-bold uppercase text-[9px]">Fecha/Hora del Rescate</span>
                  <p className="text-gray-800 font-semibold mt-0.5">{new Date(selectedPerson.rescued_at).toLocaleString("es-VE")}</p>
                </div>
              )}
            </div>

            {/* Datos del Reportante */}
            <div className="space-y-3 bg-amber-50/40 border border-amber-200 p-4 rounded-lg text-xs">
              <h4 className="font-bold text-amber-800 uppercase tracking-wide flex items-center space-x-1">
                <Shield size={14} />
                <span>Información del Informante</span>
              </h4>
              <div className="space-y-1.5 text-gray-700">
                <div>
                  <span className="block text-[9px] text-gray-400 font-semibold uppercase">Nombre del Reportante</span>
                  <span className="font-bold text-gray-900">{selectedPerson.reported_by_name || "Anónimo"}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-gray-400 font-semibold uppercase">Teléfono</span>
                  <a href={`tel:${selectedPerson.reported_by_phone}`} className="font-bold text-blue-600 hover:underline">{selectedPerson.reported_by_phone || "N/A"}</a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Eye size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-semibold">Seleccione un reporte de rescatado de la lista para ver todos sus detalles.</p>
          </div>
        )}
      </div>
    </div>
  );
}
