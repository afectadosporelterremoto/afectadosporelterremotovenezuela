"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, RotateCcw } from "lucide-react";

// Listado de estados de Venezuela para consistencia en filtros
export const VENEZUELAN_STATES = [
  "Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas", "Bolívar", "Carabobo", "Cojedes", 
  "Delta Amacuro", "Distrito Capital", "Falcón", "Guárico", "Lara", "Mérida", "Miranda", 
  "Monagas", "Nueva Esparta", "Portuguesa", "Sucre", "Táchira", "Trujillo", "Vargas (La Guaira)", 
  "Yaracuy", "Zulia"
];

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados locales inicializados desde los parámetros de la URL
  const [name, setName] = useState(searchParams.get("nombre") || "");
  const [cedula, setCedula] = useState(searchParams.get("cedula") || "");
  const [state, setState] = useState(searchParams.get("estado") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (name.trim()) params.set("nombre", name.trim());
    if (cedula.trim()) params.set("cedula", cedula.trim());
    if (state) params.set("estado", state);
    if (status) params.set("status", status);

    router.push(`/buscar?${params.toString()}`);
  };

  const handleReset = () => {
    setName("");
    setCedula("");
    setState("");
    setStatus("");
    router.push("/buscar");
  };

  return (
    <form onSubmit={handleSearch} className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Filtros de Búsqueda</h3>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Nombre */}
        <div>
          <label htmlFor="search-name" className="block text-xs font-semibold text-gray-600 mb-1">Nombre Completo</label>
          <input
            id="search-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Juan Pérez"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          />
        </div>

        {/* Cédula */}
        <div>
          <label htmlFor="search-cedula" className="block text-xs font-semibold text-gray-600 mb-1">Cédula</label>
          <input
            id="search-cedula"
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="Ej. 12345678"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          />
        </div>

        {/* Estado */}
        <div>
          <label htmlFor="search-state" className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
          <select
            id="search-state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          >
            <option value="">Todos los estados</option>
            {VENEZUELAN_STATES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* Estado actual de la persona */}
        <div>
          <label htmlFor="search-status" className="block text-xs font-semibold text-gray-600 mb-1">Situación Actual</label>
          <select
            id="search-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          >
            <option value="">Cualquier estado</option>
            <option value="Sin localizar">Sin localizar</option>
            <option value="Localizado">Localizado</option>
            <option value="Rescatado">Rescatado</option>
            <option value="Hospitalizado">Hospitalizado</option>
            <option value="Fallecido">Fallecido</option>
            <option value="Necesita ayuda">Necesita ayuda</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center space-x-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RotateCcw size={16} />
          <span>Limpiar</span>
        </button>
        <button
          type="submit"
          className="flex items-center space-x-1.5 rounded-lg bg-[#0B1F3A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#152e4f] transition-colors"
        >
          <Search size={16} />
          <span>Buscar</span>
        </button>
      </div>
    </form>
  );
}
