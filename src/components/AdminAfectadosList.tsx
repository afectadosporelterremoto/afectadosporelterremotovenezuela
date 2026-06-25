"use client";

import React, { useState } from "react";
import { updateAffectedPersonStatus, deleteAffectedPerson } from "@/app/actions";
import StatusBadge from "@/components/StatusBadge";
import { Trash2, Phone, Shield, MapPin, Eye, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface AdminAfectadosListProps {
  initialPeople: any[];
  reports: any[];
}

export default function AdminAfectadosList({ initialPeople, reports }: AdminAfectadosListProps) {
  const [people, setPeople] = useState(initialPeople);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Agrupar reportes por ID relacionado
  const reportsByPerson = reports.reduce((acc: any, report: any) => {
    if (!acc[report.related_id]) {
      acc[report.related_id] = [];
    }
    acc[report.related_id].push(report);
    return acc;
  }, {});

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await updateAffectedPersonStatus(id, newStatus);
      if (res.error) {
        setError(res.error);
      } else {
        // Actualizar estado local
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
    if (!confirm("¿Está seguro de que desea eliminar permanentemente este registro?")) return;
    setError(null);
    try {
      const res = await deleteAffectedPerson(id);
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
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-xs text-red-700 flex items-center space-x-1.5">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla / Listado */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Ubicación</th>
                  <th className="px-6 py-3">Reportes</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {people.map((person) => {
                  const personReports = reportsByPerson[person.id] || [];
                  return (
                    <tr key={person.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{person.full_name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">CI: {person.cedula || "N/R"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={person.status}
                          disabled={updatingId === person.id}
                          onChange={(e) => handleStatusChange(person.id, e.target.value)}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-[#0B1F3A] focus:outline-hidden bg-white font-semibold text-gray-700"
                        >
                          <option value="Sin localizar">Sin localizar</option>
                          <option value="Localizado">Localizado</option>
                          <option value="Rescatado">Rescatado</option>
                          <option value="Hospitalizado">Hospitalizado</option>
                          <option value="Fallecido">Fallecido</option>
                          <option value="Necesita ayuda">Necesita ayuda</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                        {person.city}, {person.state}
                      </td>
                      <td className="px-6 py-4">
                        {personReports.length > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-bold text-blue-700">
                            {personReports.length} {personReports.length === 1 ? "reporte" : "reportes"}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Ninguno</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedPerson(person)}
                          className="inline-flex items-center p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-[#0B1F3A] hover:bg-gray-50 transition-colors"
                          title="Ver detalle completo"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(person.id)}
                          className="inline-flex items-center p-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:text-red-700 hover:bg-red-100 transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {people.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500 font-medium">
                      No hay personas afectadas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel lateral de Detalle Completo de Admin */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-6 space-y-6 self-start">
          {selectedPerson ? (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-bold uppercase">Detalle Administrativo</span>
                  <StatusBadge status={selectedPerson.status} />
                </div>
                <h3 className="text-lg font-black text-gray-900 mt-2">{selectedPerson.full_name}</h3>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {selectedPerson.id}</p>
              </div>

              {/* Datos Privados Desencriptados */}
              <div className="space-y-3 bg-amber-50/40 border border-amber-200 p-4 rounded-lg text-xs">
                <h4 className="font-bold text-amber-800 uppercase tracking-wide flex items-center space-x-1">
                  <Shield size={14} />
                  <span>Datos Sensibles Desencriptados</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-gray-700">
                  <div>
                    <span className="block text-gray-400 font-semibold uppercase text-[9px]">Cédula Real</span>
                    <span className="font-mono font-bold text-gray-900">{selectedPerson.cedula || "No registrada"}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 font-semibold uppercase text-[9px]">Teléfono Real</span>
                    <a href={`tel:${selectedPerson.phone}`} className="font-bold text-blue-600 hover:underline">{selectedPerson.phone || "No registrado"}</a>
                  </div>
                </div>
                <div className="pt-2 border-t border-amber-100 mt-2">
                  <span className="block text-gray-400 font-semibold uppercase text-[9px]">Dirección Exacta Completa</span>
                  <p className="text-gray-950 font-semibold leading-relaxed mt-0.5">{selectedPerson.exact_address || "No especificada"}</p>
                </div>
                {selectedPerson.reference_point && (
                  <div className="pt-2 border-t border-amber-100 mt-2">
                    <span className="block text-gray-400 font-semibold uppercase text-[9px]">Punto de Referencia</span>
                    <p className="text-gray-950 font-semibold leading-relaxed mt-0.5">{selectedPerson.reference_point}</p>
                  </div>
                )}
              </div>

              {/* Informante */}
              <div className="text-xs space-y-1.5">
                <h4 className="font-bold text-gray-800 uppercase tracking-wider">Registrado por:</h4>
                <div className="bg-gray-50 border border-gray-150 p-3 rounded-lg text-gray-700">
                  <p className="font-semibold text-gray-900">{selectedPerson.registered_by_name}</p>
                  <p className="font-mono mt-0.5">Telf: {selectedPerson.registered_by_phone}</p>
                </div>
              </div>

              {/* Reportes Recibidos */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-1">
                  <FileText size={14} />
                  <span>Reportes Adicionales ({reportsByPerson[selectedPerson.id]?.length || 0})</span>
                </h4>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(reportsByPerson[selectedPerson.id] || []).map((report: any) => (
                    <div key={report.id} className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-blue-900">
                        <span>De: {report.reporter_name}</span>
                        <a href={`tel:${report.reporter_phone}`} className="hover:underline text-[10px]">{report.reporter_phone}</a>
                      </div>
                      <p className="text-gray-700 italic">"{report.message}"</p>
                      <span className="block text-[9px] text-gray-400 text-right font-medium">
                        Recibido: {new Date(report.created_at).toLocaleDateString("es-VE")}
                      </span>
                    </div>
                  ))}
                  {(!reportsByPerson[selectedPerson.id] || reportsByPerson[selectedPerson.id].length === 0) && (
                    <p className="text-xs text-gray-400 italic">No se han recibido informes de terceros para esta persona.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Eye size={36} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-semibold">Seleccione una persona de la lista para ver su información privada desencriptada y sus reportes recibidos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
