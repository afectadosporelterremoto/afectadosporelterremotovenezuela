"use client";

import React, { useState } from "react";
import { manageEmergencyContact, deleteEmergencyContact } from "@/app/actions";
import { VENEZUELAN_STATES } from "@/components/SearchFilters";
import { Trash2, Edit, Plus, X, ShieldCheck, AlertCircle, Phone, Calendar } from "lucide-react";

interface AdminEmergencyListProps {
  initialContacts: any[];
}

export default function AdminEmergencyList({ initialContacts }: AdminEmergencyListProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  
  // Estados para el formulario (Crear / Editar)
  const [isOpen, setIsOpen] = useState(false);
  const [id, setId] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [institution, setInstitution] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [officialSource, setOfficialSource] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openForm = (contact: any = null) => {
    setError(null);
    if (contact) {
      setId(contact.id);
      setState(contact.state);
      setCity(contact.city);
      setInstitution(contact.institution);
      setPhone(contact.phone);
      setWhatsapp(contact.whatsapp || "");
      setAddress(contact.address || "");
      setOfficialSource(contact.official_source || "");
      setIsActive(contact.is_active);
      setEditingContact(contact);
    } else {
      setId("");
      setState("");
      setCity("");
      setInstitution("");
      setPhone("");
      setWhatsapp("");
      setAddress("");
      setOfficialSource("");
      setIsActive(true);
      setEditingContact(null);
    }
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state || !city.trim() || !institution.trim() || !phone.trim()) {
      return setError("Por favor completa los campos obligatorios (Estado, Ciudad, Institución y Teléfono).");
    }

    setError(null);
    setLoading(true);

    try {
      const res = await manageEmergencyContact({
        id: id || undefined,
        state,
        city: city.trim(),
        institution: institution.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || undefined,
        address: address.trim() || undefined,
        officialSource: officialSource.trim() || undefined,
        isActive,
      });

      if (res.error) {
        setError(res.error);
      } else {
        // Recargar o simular
        window.location.reload(); // Recargar de forma rápida y sencilla para reflejar los cambios en el Server Component
      }
    } catch (err) {
      setError("Error al guardar el contacto.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar permanentemente este contacto de emergencia?")) return;
    setError(null);
    try {
      const res = await deleteEmergencyContact(contactId);
      if (res.error) {
        setError(res.error);
      } else {
        setContacts(contacts.filter((c) => c.id !== contactId));
      }
    } catch (err) {
      setError("Error al eliminar el contacto.");
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

      <div className="flex justify-end">
        <button
          onClick={() => openForm()}
          className="flex items-center space-x-1.5 rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-bold text-white hover:bg-[#152e4f] transition-colors"
        >
          <Plus size={16} />
          <span>Agregar Contacto</span>
        </button>
      </div>

      {/* Grid de contactos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Estado / Ciudad</th>
                <th className="px-6 py-3">Institución</th>
                <th className="px-6 py-3">Teléfono</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{contact.state}</div>
                    <div className="text-xs text-gray-400 font-semibold">{contact.city}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">
                    {contact.institution}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-[#C0392B]">
                    {contact.phone}
                  </td>
                  <td className="px-6 py-4">
                    {contact.is_active ? (
                      <span className="rounded-md bg-green-50 border border-green-200 px-2 py-0.5 text-xs font-semibold text-green-700">Activo</span>
                    ) : (
                      <span className="rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-700">Inactivo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openForm(contact)}
                      className="inline-flex items-center p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-[#0B1F3A] hover:bg-gray-50 transition-colors"
                      title="Editar"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="inline-flex items-center p-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:text-red-700 hover:bg-red-100 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500 font-medium">
                    No hay contactos de emergencia registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Formulario Flotante */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            {/* Cabecera Modal */}
            <div className="bg-[#0B1F3A] text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider">
                {editingContact ? "Editar Contacto" : "Agregar Nuevo Contacto"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                <X size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Estado *</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                    required
                  >
                    <option value="">Seleccionar</option>
                    <option value="Nacional">Nacional</option>
                    {VENEZUELAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ciudad *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej. Cumaná / Caracas"
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Institución / Cuerpo *</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Ej. Protección Civil / Bomberos"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Teléfono Principal *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 0800-7248451"
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">WhatsApp (Opcional)</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ej. +584121234567"
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Dirección Física (Opcional)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Sede local de la institución"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Fuente Oficial Citada (Opcional)</label>
                <input
                  type="text"
                  value={officialSource}
                  onChange={(e) => setOfficialSource(e.target.value)}
                  placeholder="Ej. Directorio Oficial MPPRIJP / Prensa Oficial"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  id="active-check"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-gray-300 text-[#0B1F3A] focus:ring-[#0B1F3A]"
                />
                <label htmlFor="active-check" className="text-xs font-bold text-gray-700 uppercase">
                  Contacto de Emergencia Activo y Visible
                </label>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#0B1F3A] px-6 py-2 text-xs font-bold text-white hover:bg-[#152e4f] transition-colors disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar Contacto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
