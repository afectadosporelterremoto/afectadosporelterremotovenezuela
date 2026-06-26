"use client";

import React, { useState } from "react";
import { addDeceasedPerson, updateDeceasedPerson, deleteDeceasedPerson } from "@/app/actions";
import { Trash2, Edit2, Plus, X, Search, Shield, AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { formatVenezuelaDateTime } from "@/utils/date";
import { VENEZUELAN_STATES } from "./SearchFilters";

interface DeceasedPerson {
  id: string;
  full_name: string;
  cedula: string | null;
  age: number | null;
  state: string | null;
  city: string | null;
  location: string | null;
  source_type: string | null;
  source_name: string | null;
  source_contact: string | null;
  verification_status: "pending_review" | "confirmed" | "rejected" | "duplicate";
  is_public: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

interface AdminFallecidosListProps {
  initialPeople: DeceasedPerson[];
}

export default function AdminFallecidosList({ initialPeople }: AdminFallecidosListProps) {
  const [people, setPeople] = useState<DeceasedPerson[]>(initialPeople);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<DeceasedPerson | null>(null);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState("");
  const [cedula, setCedula] = useState("");
  const [age, setAge] = useState<string>("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [sourceType, setSourceType] = useState("oficial");
  const [sourceName, setSourceName] = useState("");
  const [sourceContact, setSourceContact] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<DeceasedPerson["verification_status"]>("pending_review");
  const [isPublic, setIsPublic] = useState(false);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setFullName("");
    setCedula("");
    setAge("");
    setState("");
    setCity("");
    setLocation("");
    setSourceType("oficial");
    setSourceName("");
    setSourceContact("");
    setVerificationStatus("pending_review");
    setIsPublic(false);
    setNotes("");
    setFormId(null);
    setEditMode(false);
    setError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (p: DeceasedPerson) => {
    setError(null);
    setFormId(p.id);
    setFullName(p.full_name);
    setCedula(p.cedula || "");
    setAge(p.age !== null ? String(p.age) : "");
    setState(p.state || "");
    setCity(p.city || "");
    setLocation(p.location || "");
    setSourceType(p.source_type || "oficial");
    setSourceName(p.source_name || "");
    setSourceContact(p.source_contact || "");
    setVerificationStatus(p.verification_status);
    setIsPublic(p.is_public);
    setNotes(p.notes || "");
    setEditMode(true);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      return setError("El nombre completo es obligatorio.");
    }

    setLoading(true);

    const data = {
      full_name: fullName.trim(),
      cedula: cedula.trim() || undefined,
      age: age ? Number(age) : undefined,
      state: state || undefined,
      city: city.trim() || undefined,
      location: location.trim() || undefined,
      source_type: sourceType || undefined,
      source_name: sourceName.trim() || undefined,
      source_contact: sourceContact.trim() || undefined,
      verification_status: verificationStatus,
      is_public: isPublic,
      notes: notes.trim() || undefined,
    };

    try {
      if (editMode && formId) {
        const res = await updateDeceasedPerson(formId, data);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccess("Fallecido actualizado con éxito.");
          // Update local state
          setPeople(
            people.map((p) =>
              p.id === formId
                ? {
                    ...p,
                    ...data,
                    cedula: data.cedula || null,
                    age: data.age || null,
                    state: data.state || null,
                    city: data.city || null,
                    location: data.location || null,
                    source_type: data.source_type || null,
                    source_name: data.source_name || null,
                    source_contact: data.source_contact || null,
                    notes: data.notes || null,
                    updated_at: new Date().toISOString(),
                  }
                : p
            )
          );
          setShowForm(false);
          resetForm();
        }
      } else {
        const res = await addDeceasedPerson(data);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccess("Fallecido registrado con éxito.");
          // Reload list or add dummy
          // Since it's a server action, a hard reload or pushing a dummy state
          // To be 100% accurate we can just push a placeholder or instruct to refresh,
          // but let's push a simulated item to make UI interactive
          const newItem: DeceasedPerson = {
            id: Math.random().toString(),
            full_name: data.full_name,
            cedula: data.cedula || null,
            age: data.age || null,
            state: data.state || null,
            city: data.city || null,
            location: data.location || null,
            source_type: data.source_type || null,
            source_name: data.source_name || null,
            source_contact: data.source_contact || null,
            verification_status: data.verification_status,
            is_public: data.is_public,
            notes: data.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            updated_by: null,
          };
          setPeople([newItem, ...people]);
          setShowForm(false);
          resetForm();
        }
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar permanentemente este registro?")) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await deleteDeceasedPerson(id);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Registro eliminado correctamente.");
        setPeople(people.filter((p) => p.id !== id));
        if (selectedPerson?.id === id) {
          setSelectedPerson(null);
        }
      }
    } catch (err: any) {
      setError("Error al eliminar el registro.");
    }
  };

  const handleTogglePublic = async (p: DeceasedPerson) => {
    setError(null);
    setSuccess(null);
    const newPublicState = !p.is_public;
    try {
      const res = await updateDeceasedPerson(p.id, { is_public: newPublicState });
      if (res.error) {
        setError(res.error);
      } else {
        setPeople(people.map((item) => (item.id === p.id ? { ...item, is_public: newPublicState } : item)));
        if (selectedPerson?.id === p.id) {
          setSelectedPerson({ ...selectedPerson, is_public: newPublicState });
        }
        setSuccess(`Visibilidad cambiada con éxito.`);
      }
    } catch (err) {
      setError("Error al cambiar la visibilidad.");
    }
  };

  const handleStatusChange = async (id: string, newStatus: DeceasedPerson["verification_status"]) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await updateDeceasedPerson(id, { verification_status: newStatus });
      if (res.error) {
        setError(res.error);
      } else {
        setPeople(people.map((item) => (item.id === id ? { ...item, verification_status: newStatus } : item)));
        if (selectedPerson?.id === id) {
          setSelectedPerson({ ...selectedPerson, verification_status: newStatus });
        }
        setSuccess(`Estado de verificación actualizado.`);
      }
    } catch (err) {
      setError("Error al cambiar el estado.");
    }
  };

  // Filter list
  const filteredPeople = people.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.full_name.toLowerCase().includes(q) ||
      (p.cedula && p.cedula.toLowerCase().includes(q)) ||
      (p.city && p.city.toLowerCase().includes(q)) ||
      (p.state && p.state.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start space-x-2 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start space-x-2 text-xs text-green-800">
          <CheckCircle className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Acciones principales */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o ciudad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
          />
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-1.5 rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-bold text-white hover:bg-[#152e4f] transition-colors"
        >
          <Plus size={16} />
          <span>Registrar Fallecido</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Listado de fallecidos */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Nombre / Datos</th>
                  <th className="px-6 py-3">Ubicación</th>
                  <th className="px-6 py-3">Verificación</th>
                  <th className="px-6 py-3">Público</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPeople.map((person) => (
                  <tr key={person.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{person.full_name}</div>
                      <div className="text-xs text-gray-400">
                        C.I.: {person.cedula || "N/R"} | Edad: {person.age !== null ? `${person.age} años` : "N/R"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-gray-700">
                        {person.city || "Sin especificar"}
                      </div>
                      <div className="text-[10px] text-gray-400">{person.state || "Sin especificar"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={person.verification_status}
                        onChange={(e) => handleStatusChange(person.id, e.target.value as any)}
                        className="rounded-md border border-gray-300 px-2 py-0.5 text-xs focus:border-[#0B1F3A] focus:outline-hidden bg-white font-semibold text-gray-700"
                      >
                        <option value="pending_review">Pendiente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="rejected">Rechazado</option>
                        <option value="duplicate">Duplicado</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublic(person)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                          person.is_public
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-250"
                            : "bg-gray-50 text-gray-500 border border-gray-200"
                        }`}
                      >
                        {person.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>{person.is_public ? "Público" : "Privado"}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedPerson(person)}
                        className="inline-flex items-center p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-[#0B1F3A] hover:bg-gray-50 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(person)}
                        className="inline-flex items-center p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(person.id)}
                        className="inline-flex items-center p-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:text-red-700 hover:bg-red-100 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPeople.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500 font-medium">
                      No hay registros de fallecidos que coincidan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ficha lateral de detalles */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-6 space-y-6 self-start">
          {selectedPerson ? (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <span className="text-xs text-gray-400 font-bold uppercase block">Ficha de Fallecido</span>
                <h3 className="text-lg font-black text-gray-900 mt-1">{selectedPerson.full_name}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedPerson.verification_status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : selectedPerson.verification_status === "pending_review"
                        ? "bg-amber-100 text-amber-800"
                        : selectedPerson.verification_status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedPerson.verification_status.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedPerson.is_public ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"}`}>
                    {selectedPerson.is_public ? "VISIBLE PÚBLICAMENTE" : "OCULTO"}
                  </span>
                </div>
              </div>

              <div className="text-xs space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-gray-400 font-bold uppercase text-[9px]">Cédula</span>
                    <p className="text-gray-800 font-semibold mt-0.5">{selectedPerson.cedula || "No registrada"}</p>
                  </div>
                  <div>
                    <span className="block text-gray-400 font-bold uppercase text-[9px]">Edad</span>
                    <p className="text-gray-800 font-semibold mt-0.5">{selectedPerson.age !== null ? `${selectedPerson.age} años` : "No registrada"}</p>
                  </div>
                </div>

                <div>
                  <span className="block text-gray-400 font-bold uppercase text-[9px]">Ubicación Geográfica</span>
                  <p className="text-gray-800 font-semibold mt-0.5">
                    {selectedPerson.city ? `${selectedPerson.city}, ` : ""}
                    {selectedPerson.state || "Sin especificar"}
                  </p>
                  {selectedPerson.location && (
                    <p className="text-gray-500 font-medium mt-1 bg-gray-50 p-2 rounded border border-gray-150">{selectedPerson.location}</p>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <h4 className="font-bold text-gray-800 uppercase tracking-wide text-[10px] mb-2">Información de Fuente</h4>
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-150">
                    <div>
                      <span className="block text-gray-400 font-semibold uppercase text-[8px]">Tipo de Fuente</span>
                      <span className="font-semibold text-gray-700 capitalize">{selectedPerson.source_type || "No especificado"}</span>
                    </div>
                    {selectedPerson.source_name && (
                      <div>
                        <span className="block text-gray-400 font-semibold uppercase text-[8px]">Nombre de Fuente</span>
                        <span className="font-semibold text-gray-700">{selectedPerson.source_name}</span>
                      </div>
                    )}
                    {selectedPerson.source_contact && (
                      <div>
                        <span className="block text-gray-400 font-semibold uppercase text-[8px]">Contacto de Fuente</span>
                        <span className="font-semibold text-gray-700">{selectedPerson.source_contact}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedPerson.notes && (
                  <div>
                    <span className="block text-gray-400 font-bold uppercase text-[9px]">Notas Internas</span>
                    <p className="text-gray-800 font-semibold leading-relaxed mt-0.5 bg-amber-50/20 p-2.5 rounded-lg border border-amber-250/30">
                      {selectedPerson.notes}
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3 text-[10px] text-gray-400 space-y-1">
                  <div>Registro creado: {formatVenezuelaDateTime(selectedPerson.created_at)}</div>
                  <div>Última actualización: {formatVenezuelaDateTime(selectedPerson.updated_at)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Eye size={36} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-semibold">Seleccione un fallecido para ver todos los detalles confidenciales de la ficha.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal / Overlay para Formulario Agregar/Editar */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
              {editMode ? "Modificar Registro de Fallecido" : "Registrar Fallecido Manualmente"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Juan Vicente Pérez"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cédula de Identidad</label>
                  <input
                    type="text"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="Ej. V-12345678"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Edad</label>
                  <input
                    type="number"
                    min="0"
                    max="125"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Ej. 65"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estado</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#0B1F3A] focus:outline-hidden bg-white"
                  >
                    <option value="">Seleccione Estado</option>
                    {VENEZUELAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ciudad / Localidad</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej. Cariaco"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Dirección / Sector Específico</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ej. Sector Centro, Calle Comercio"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-4">
                <h4 className="font-bold text-gray-800 text-xs">Datos de la Fuente de Información</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Fuente</label>
                    <select
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#0B1F3A] focus:outline-hidden bg-white"
                    >
                      <option value="oficial">Organismo Oficial (PC/Bomberos)</option>
                      <option value="familiar">Familiar / Reportante</option>
                      <option value="medios">Medios de Comunicación</option>
                      <option value="redes">Redes Sociales</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre de Fuente</label>
                    <input
                      type="text"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      placeholder="Ej. Protección Civil Sucre / Diario El Tiempo"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Contacto de Fuente (Telf/Link)</label>
                    <input
                      type="text"
                      value={sourceContact}
                      onChange={(e) => setSourceContact(e.target.value)}
                      placeholder="Ej. 0424-1234567 / link de la noticia"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estado de Verificación *</label>
                  <select
                    value={verificationStatus}
                    onChange={(e) => setVerificationStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#0B1F3A] focus:outline-hidden bg-white font-bold"
                  >
                    <option value="pending_review">Pendiente de revisión</option>
                    <option value="confirmed">Confirmado / Verificado</option>
                    <option value="rejected">Rechazado</option>
                    <option value="duplicate">Duplicado</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-5">
                  <input
                    id="form-is-public"
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-gray-300 text-[#0B1F3A] focus:ring-[#0B1F3A]"
                  />
                  <label htmlFor="form-is-public" className="text-xs font-semibold text-gray-700 select-none cursor-pointer">
                    Publicar en la lista web visible a todos
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notas Internas / Bitácora</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Detalles confidenciales, estado de la autopsia, verificación adicional..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center space-x-1.5 px-6 py-2 bg-[#0B1F3A] rounded-lg text-xs font-bold text-white hover:bg-[#152e4f] transition-colors"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editMode ? "Guardar Cambios" : "Registrar Fallecido"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
