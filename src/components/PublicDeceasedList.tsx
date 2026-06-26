"use client";

import React, { useState } from "react";
import { Search, Heart, MapPin, Calendar, ShieldCheck, HeartHandshake } from "lucide-react";
import { formatVenezuelaDateTime } from "@/utils/date";
import { maskCedula } from "@/utils/mask";

interface PublicDeceasedPerson {
  id: string;
  full_name: string;
  cedula?: string | null;
  age?: number | null;
  state?: string | null;
  city?: string | null;
  location?: string | null;
  source_type?: string | null;
  created_at: string;
  updated_at: string;
}

interface PublicDeceasedListProps {
  initialPeople: PublicDeceasedPerson[];
}

export default function PublicDeceasedList({ initialPeople }: PublicDeceasedListProps) {
  const [people] = useState<PublicDeceasedPerson[]>(initialPeople);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPeople = people.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.full_name.toLowerCase().includes(q) ||
      (p.city && p.city.toLowerCase().includes(q)) ||
      (p.state && p.state.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 flex-1 flex flex-col">
      {/* Mensaje de Respeto y Condolencia */}
      <div className="rounded-xl border-l-4 border-[#C0392B] bg-[#C0392B]/5 p-6 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-[#C0392B]">
          <Heart className="h-6 w-6 fill-[#C0392B]" />
          <h2 className="text-base md:text-lg font-black tracking-tight uppercase">Mensaje de Respeto y Condolencia</h2>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed font-medium">
          Esta plataforma expresa sus más sinceras condolencias, solidaridad y profundo respeto a las familias de las víctimas de esta lamentable catástrofe. Honramos su memoria y compartimos el dolor de toda la nación. Paz a sus almas.
        </p>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md w-full">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o ciudad/estado..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
        />
      </div>

      {filteredPeople.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center flex-1 flex flex-col items-center justify-center">
          <HeartHandshake className="h-10 w-10 text-gray-300 mb-2" />
          <h3 className="text-base font-bold text-gray-700">No se encontraron registros</h3>
          <p className="text-xs text-gray-500 mt-1">
            No hay fallecidos registrados públicamente que coincidan con la búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPeople.map((person) => (
            <div
              key={person.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-shadow p-5 justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start border-b border-gray-50 pb-2.5">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 leading-snug">{person.full_name}</h3>
                    {person.age !== null && person.age !== undefined && (
                      <span className="text-xs text-gray-500 font-semibold block mt-0.5">{person.age} años</span>
                    )}
                  </div>
                  <span className="inline-flex items-center space-x-1 rounded-full bg-red-50 border border-red-250/30 px-2 py-0.5 text-[9px] font-bold text-[#C0392B] uppercase">
                    Fallecido
                  </span>
                </div>

                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start space-x-1.5">
                    <MapPin size={14} className="text-[#C0392B] shrink-0 mt-0.5" />
                    <span>
                      {person.city ? `${person.city}, ` : ""}
                      {person.state || "Estado no especificado"}
                    </span>
                  </div>

                  {person.cedula && (
                    <div className="flex items-start space-x-1.5">
                      <ShieldCheck size={14} className="text-gray-400 shrink-0 mt-0.5" />
                      <span>C.I. Enmascarada: <strong>{maskCedula(person.cedula)}</strong></span>
                    </div>
                  )}

                  {person.source_type && (
                    <div className="text-[10px] text-gray-500 bg-gray-50 px-2.5 py-1 rounded border border-gray-150 w-fit capitalize font-medium">
                      Fuente: {person.source_type === "oficial" ? "Organismo Oficial" : person.source_type}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 text-[10px] text-gray-400 border-t border-gray-50 pt-3 mt-4">
                <Calendar size={11} />
                <span>Última actualización: {formatVenezuelaDateTime(person.updated_at || person.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
