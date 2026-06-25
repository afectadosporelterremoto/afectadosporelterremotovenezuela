"use client";

import React, { useState } from "react";
import { moderateStory } from "@/app/actions";
import { Check, X, Calendar, MapPin, Eye, AlertCircle, Quote } from "lucide-react";

interface AdminStoriesListProps {
  initialStories: any[];
}

export default function AdminStoriesList({ initialStories }: AdminStoriesListProps) {
  const [stories, setStories] = useState(initialStories);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleModeration = async (id: string, newStatus: "approved" | "rejected" | "pending") => {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await moderateStory(id, newStatus);
      if (res.error) {
        setError(res.error);
      } else {
        setStories(stories.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
        if (selectedStory && selectedStory.id === id) {
          setSelectedStory({ ...selectedStory, status: newStatus });
        }
      }
    } catch (err) {
      setError("Error al moderar la historia.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="rounded-md bg-green-50 border border-green-200 px-2 py-0.5 text-xs font-semibold text-green-700">Aprobada</span>;
      case "rejected":
        return <span className="rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-700">Rechazada</span>;
      default:
        return <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700">Pendiente</span>;
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
                <th className="px-6 py-3">Título / Historia</th>
                <th className="px-6 py-3">Autor</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-right">Moderación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stories.map((story) => (
                <tr key={story.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 line-clamp-1">{story.title}</div>
                    <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">{story.content}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                    {story.is_anonymous ? "Anónimo" : story.author_name}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusPill(story.status)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-1.5 flex justify-end items-center h-14">
                    <button
                      onClick={() => setSelectedStory(story)}
                      className="inline-flex items-center p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-[#0B1F3A] hover:bg-gray-50 transition-colors"
                      title="Leer historia completa"
                    >
                      <Eye size={14} />
                    </button>
                    {story.status !== "approved" && (
                      <button
                        onClick={() => handleModeration(story.id, "approved")}
                        disabled={updatingId === story.id}
                        className="inline-flex items-center p-1.5 rounded-lg border border-green-100 bg-green-50 text-green-600 hover:text-green-700 hover:bg-green-100 transition-colors"
                        title="Aprobar historia"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    {story.status !== "rejected" && (
                      <button
                        onClick={() => handleModeration(story.id, "rejected")}
                        disabled={updatingId === story.id}
                        className="inline-flex items-center p-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:text-red-700 hover:bg-red-100 transition-colors"
                        title="Rechazar historia"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {stories.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500 font-medium">
                    No hay testimonios registrados para moderar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalle */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-6 space-y-6 self-start relative">
        {selectedStory ? (
          <div className="space-y-6">
            <Quote className="absolute top-4 right-4 h-12 w-12 text-gray-100 pointer-events-none" />
            
            <div className="border-b border-gray-100 pb-4">
              <span className="text-xs text-gray-400 font-bold uppercase block">Moderación de Testimonio</span>
              <h3 className="text-lg font-black text-gray-900 mt-1 leading-snug">{selectedStory.title}</h3>
              <div className="mt-2 flex items-center justify-between">
                {getStatusPill(selectedStory.status)}
                <span className="text-[10px] text-gray-400 font-mono">ID: {selectedStory.id}</span>
              </div>
            </div>

            {selectedStory.photo_url && (
              <div className="aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedStory.photo_url} alt="FOTO" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-4">
              <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-150 whitespace-pre-line italic">
                "{selectedStory.content}"
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 border-t border-gray-100 pt-3">
                <div>
                  <span className="block text-[9px] text-gray-400 font-bold uppercase">Autor / Firma</span>
                  <span className="font-bold text-gray-900">{selectedStory.is_anonymous ? "Anónimo" : selectedStory.author_name || "Anónimo"}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-gray-400 font-bold uppercase">Ubicación</span>
                  <span className="font-semibold text-gray-800 flex items-center space-x-0.5">
                    <MapPin size={12} className="text-red-500 shrink-0" />
                    <span className="truncate">{selectedStory.city || "Sin especificar"}{selectedStory.state ? `, ${selectedStory.state}` : ""}</span>
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-gray-400">
                Enviado: {new Date(selectedStory.created_at).toLocaleString("es-VE")}
              </div>
            </div>

            {/* Acciones de Moderación Rápida */}
            <div className="border-t border-gray-100 pt-4 flex gap-2">
              {selectedStory.status !== "approved" && (
                <button
                  onClick={() => handleModeration(selectedStory.id, "approved")}
                  disabled={updatingId === selectedStory.id}
                  className="flex-1 flex items-center justify-center space-x-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2 transition-colors"
                >
                  <Check size={14} />
                  <span>Aprobar</span>
                </button>
              )}
              {selectedStory.status !== "rejected" && (
                <button
                  onClick={() => handleModeration(selectedStory.id, "rejected")}
                  disabled={updatingId === selectedStory.id}
                  className="flex-1 flex items-center justify-center space-x-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 transition-colors"
                >
                  <X size={14} />
                  <span>Rechazar</span>
                </button>
              )}
              {selectedStory.status !== "pending" && (
                <button
                  onClick={() => handleModeration(selectedStory.id, "pending")}
                  disabled={updatingId === selectedStory.id}
                  className="w-full flex items-center justify-center space-x-1.5 rounded-lg border border-gray-300 text-gray-700 font-bold text-xs py-2 hover:bg-gray-50 transition-colors"
                >
                  <span>Mover a Pendiente</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Eye size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-semibold">Seleccione un testimonio de la lista para leer el contenido y moderar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
