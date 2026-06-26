"use client";

import React, { useState } from "react";
import { updateMissingPersonStatus, deleteMissingPerson } from "@/app/actions";
import { Trash2, Phone, Calendar, MapPin, Eye, Shield, CheckCircle, AlertCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { formatVenezuelaDateTime } from "@/utils/date";

interface AdminDesaparecidosListProps {
  initialPeople: any[];
}

export default function AdminDesaparecidosList({ initialPeople }: AdminDesaparecidosListProps) {
  const [people, setPeople] = useState(initialPeople);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await updateMissingPersonStatus(id, newStatus);
      if (res.error) {
        setError(res.error);
      } else {
        setPeople(people.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
        if (selectedPerson && selectedPerson.id === id) {
          setSelectedPerson({ ...selectedPerson, status: newStatus });
        }
      }
    } catch (err) {
      setError("Error al actualizar el estado.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar permanentemente este reporte de búsqueda?")) return;
    setError(null);
    try {
      const res = await deleteMissingPerson(id);
      if (res.error) {
        setError(res.error);
      } else {
        setPeople(people.filter((p) => p.id !== id));
        if (selectedPerson && selectedPerson.id === id) {
          setSelectedPerson(null);
        }
      }
    } catch (err) {
      setError("Error al eliminar el registro.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Listado */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 text-xs text-red-700 font-medium border-b border-red-150 flex items-center space-x-1.5">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Persona Desaparecida</th>
                <th className="px-6 py-3">Lugar/Zona</th>
                <th className="px-6 py-3">Estado de Búsqueda</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {people.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{person.full_name}</div>
                    <div className="text-xs text-gray-400">Edad: {person.approximate_age || "N/R"} años</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                    {person.last_seen_location}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={person.status}
                      disabled={updatingId === person.id}
                      onChange={(e) => handleStatusChange(person.id, e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-[#0B1F3A] focus:outline-hidden bg-white font-semibold text-gray-700"
                    >
                      <option value="missing">Sin localizar (missing)</option>
                      <option value="located">Localizado (located)</option>
                      <option value="rescued">Rescatado (rescued)</option>
                      <option value="hospitalized">Hospitalizado (hospitalized)</option>
                      <option value="deceased">Fallecido (deceased)</option>
                    </select>
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
                      className="inline-flex items-center p-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:text-red-700 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {people.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500 font-medium">
                    No hay reportes de búsqueda registrados.
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
              <span className="text-xs text-gray-400 font-bold uppercase block">Ficha de Desaparecido</span>
              <h3 className="text-lg font-black text-gray-900 mt-1">{selectedPerson.full_name}</h3>
              <div className="mt-2">
                <StatusBadge status={selectedPerson.status} />
              </div>
            </div>

            {selectedPerson.photo_url && (
              <div className="aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedPerson.photo_url} alt="Fila" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="text-xs space-y-3">
              <div>
                <span className="block text-gray-400 font-bold uppercase text-[9px]">Descripción Física</span>
                <p className="text-gray-800 font-semibold leading-relaxed mt-0.5">{selectedPerson.physical_description || "Sin especificar"}</p>
              </div>
              
              <div>
                <span className="block text-gray-400 font-bold uppercase text-[9px]">Vestimenta</span>
                <p className="text-gray-800 font-semibold leading-relaxed mt-0.5">{selectedPerson.clothes_description || "Sin especificar"}</p>
              </div>

              <div>
                <span className="block text-gray-400 font-bold uppercase text-[9px]">Última actualización</span>
                <p className="text-gray-800 font-semibold mt-0.5">{formatVenezuelaDateTime(selectedPerson.updated_at || selectedPerson.created_at)}</p>
              </div>

              {selectedPerson.last_contact_at && (
                <div>
                  <span className="block text-gray-400 font-bold uppercase text-[9px]">Fecha/Hora de Última Comunicación</span>
                  <p className="text-gray-800 font-semibold mt-0.5">{new Date(selectedPerson.last_contact_at).toLocaleString("es-VE")}</p>
                </div>
              )}

              {selectedPerson.notes && (
                <div>
                  <span className="block text-gray-400 font-bold uppercase text-[9px]">Observaciones / Notas</span>
                  <p className="text-gray-800 font-semibold leading-relaxed mt-0.5 bg-gray-50 p-2.5 rounded-lg border border-gray-150">{selectedPerson.notes}</p>
                </div>
              )}
            </div>

            {/* Datos del Reportante Familiar */}
            <div className="space-y-3 bg-amber-50/40 border border-amber-200 p-4 rounded-lg text-xs">
              <h4 className="font-bold text-amber-800 uppercase tracking-wide flex items-center space-x-1">
                <Shield size={14} />
                <span>Contacto de Búsqueda</span>
              </h4>
              <div className="space-y-1.5 text-gray-700">
                <div>
                  <span className="block text-[9px] text-gray-400 font-semibold uppercase">Familiar</span>
                  <span className="font-bold text-gray-900">{selectedPerson.reporter_name}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-gray-400 font-semibold uppercase">Teléfono</span>
                  <a href={`tel:${selectedPerson.reporter_phone}`} className="font-bold text-blue-600 hover:underline">{selectedPerson.reporter_phone}</a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Eye size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-semibold">Seleccione un reporte de búsqueda de la lista para ver todos sus detalles.</p>
          </div>
        )}
      </div>
    </div>
  );
}
