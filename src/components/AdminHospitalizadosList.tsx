"use client";

import React, { useState } from "react";
import { toggleAffectedPersonPublic, deleteAffectedPerson, updateAffectedPersonStatus } from "@/app/actions";
import { Trash2, Shield, MapPin, Eye, FileText, CheckCircle, AlertCircle, EyeOff, Building } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { formatVenezuelaDateTime } from "@/utils/date";

interface AdminHospitalizadosListProps {
  initialPatients: any[];
}

export default function AdminHospitalizadosList({ initialPatients }: AdminHospitalizadosListProps) {
  const [patients, setPatients] = useState(initialPatients);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTogglePublic = async (id: string, currentPublic: boolean) => {
    setUpdatingId(id);
    setError(null);
    try {
      const nextPublic = !currentPublic;
      const res = await toggleAffectedPersonPublic(id, nextPublic);
      if (res.error) {
        setError(res.error);
      } else {
        setPatients(patients.map((p) => (p.id === id ? { ...p, is_public: nextPublic } : p)));
        if (selectedPatient && selectedPatient.id === id) {
          setSelectedPatient({ ...selectedPatient, is_public: nextPublic });
        }
      }
    } catch (err) {
      setError("Error al cambiar visibilidad.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await updateAffectedPersonStatus(id, newStatus);
      if (res.error) {
        setError(res.error);
      } else {
        // Si cambia de Hospitalizado, remover de la lista local
        if (newStatus !== "Hospitalizado") {
          setPatients(patients.filter((p) => p.id !== id));
          if (selectedPatient && selectedPatient.id === id) {
            setSelectedPatient(null);
          }
        } else {
          setPatients(patients.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
        }
      }
    } catch (err) {
      setError("Error al cambiar estado.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar permanentemente este registro?")) return;
    setError(null);
    try {
      const res = await deleteAffectedPerson(id);
      if (res.error) {
        setError(res.error);
      } else {
        setPatients(patients.filter((p) => p.id !== id));
        if (selectedPatient && selectedPatient.id === id) {
          setSelectedPatient(null);
        }
      }
    } catch (err) {
      setError("Error al eliminar registro.");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-xs text-red-700 flex items-center space-x-1.5">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Paciente</th>
                  <th className="px-6 py-3">Centro Médico</th>
                  <th className="px-6 py-3">Público</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{patient.full_name}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">CI: {patient.cedula || "N/R"}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 font-semibold">
                      <div className="flex items-center space-x-1">
                        <Building size={14} className="text-gray-400 shrink-0" />
                        <span>{patient.exact_address || "No especificado"}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{patient.city}, {patient.state}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublic(patient.id, patient.is_public)}
                        disabled={updatingId === patient.id}
                        className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-1 text-xs font-bold border transition-colors ${
                          patient.is_public
                            ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                        }`}
                      >
                        {patient.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>{patient.is_public ? "Público" : "Oculto"}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedPatient(patient)}
                        className="inline-flex items-center p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-[#0B1F3A] hover:bg-gray-50 transition-colors"
                        title="Ver detalle completo"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(patient.id)}
                        className="inline-flex items-center p-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:text-red-700 hover:bg-red-100 transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500 font-medium">
                      No hay pacientes hospitalizados en revisión.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detalle Sidebar */}
        <div className="lg:col-span-1">
          {selectedPatient ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedPatient.full_name}</h3>
                  <span className="text-xs text-gray-400 font-mono">ID: {selectedPatient.id}</span>
                </div>
                <StatusBadge status="Hospitalizado" />
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="block text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1">Cédula</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedPatient.cedula || "No registrada"}</span>
                </div>

                <div>
                  <span className="block text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1">Ubicación del hospital</span>
                  <p className="text-sm font-semibold text-gray-800 bg-gray-50 p-2.5 rounded-md border border-gray-150 leading-relaxed">
                    {selectedPatient.exact_address}
                  </p>
                </div>

                <div>
                  <span className="block text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1">Ciudad y Estado</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedPatient.city}, {selectedPatient.state}</span>
                </div>

                <div>
                  <span className="block text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1">Última actualización</span>
                  <span className="text-sm font-semibold text-gray-800">{formatVenezuelaDateTime(selectedPatient.updated_at || selectedPatient.created_at)}</span>
                </div>

                <div>
                  <span className="block text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1">Información de la Importación</span>
                  <p className="text-gray-600 bg-gray-50 p-2.5 rounded-md border border-gray-100 leading-normal">
                    {selectedPatient.situation_description}
                  </p>
                </div>

                <div>
                  <span className="block text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1">Acciones de Moderación</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => handleTogglePublic(selectedPatient.id, selectedPatient.is_public)}
                      className={`w-full py-2 text-center rounded-lg font-bold border text-xs transition-colors ${
                        selectedPatient.is_public
                          ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                          : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {selectedPatient.is_public ? "Ocultar de la Web" : "Aprobar y Publicar"}
                    </button>
                    <select
                      onChange={(e) => handleStatusChange(selectedPatient.id, e.target.value)}
                      value={selectedPatient.status}
                      className="w-full rounded-lg border border-gray-300 px-2.5 py-2 text-xs font-bold text-gray-700 bg-white"
                    >
                      <option value="Hospitalizado">Hospitalizado</option>
                      <option value="Localizado">Localizado (De Alta)</option>
                      <option value="Rescatado">Rescatado</option>
                      <option value="Fallecido">Fallecido</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-gray-400 flex flex-col items-center justify-center p-6 bg-white">
              <Eye size={24} className="mb-2 text-gray-300" />
              <p className="text-xs font-semibold">Seleccione un paciente para ver su ficha completa y moderar su visibilidad.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
