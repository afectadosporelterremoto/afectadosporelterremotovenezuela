"use client";

import React, { useState } from "react";
import { submitStory } from "@/app/actions";
import ImageUpload from "./ImageUpload";
import { VENEZUELAN_STATES } from "./SearchFilters";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function StoryForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // Honeypot
  const [websiteHoneypot, setWebsiteHoneypot] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError("El título es obligatorio.");
    if (!content.trim()) return setError("El contenido del testimonio es obligatorio.");

    setLoading(true);

    try {
      const res = await submitStory({
        title,
        content,
        authorName,
        isAnonymous,
        state,
        city,
        photoUrl,
        websiteHoneypot,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTitle("");
        setContent("");
        setAuthorName("");
        setIsAnonymous(false);
        setState("");
        setCity("");
        setPhotoUrl("");
      }
    } catch (err) {
      setError("Ocurrió un error inesperado al enviar la historia.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center shadow-xs">
        <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-3" />
        <h3 className="text-xl font-bold text-green-900">Testimonio Enviado</h3>
        <p className="text-sm text-green-700 mt-2 max-w-md mx-auto">
          Gracias por compartir tu historia. Para asegurar la veracidad y el respeto de la comunidad, tu testimonio pasará por un proceso de moderación y será publicado muy pronto.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#152e4f] transition-colors"
        >
          Escribir otra historia
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-xs max-w-3xl mx-auto">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={websiteHoneypot}
        onChange={(e) => setWebsiteHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold text-gray-900 md:text-xl">Comparte tu Historia o Necesidades</h2>
        <p className="text-xs text-gray-500 mt-1">
          Cuéntanos qué viviste, cómo te encuentras o qué ayuda necesitas en tu zona. Puedes publicar como anónimo.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start space-x-2 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="story-title" className="block text-sm font-semibold text-gray-700 mb-1">Título del Testimonio / Necesidad *</label>
          <input
            id="story-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Necesitamos agua potable en Sector Las Rosas / Mi experiencia en el terremoto"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          />
        </div>

        <div>
          <label htmlFor="story-content" className="block text-sm font-semibold text-gray-700 mb-1">Tu Historia / Reporte *</label>
          <textarea
            id="story-content"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Escribe detalladamente tu historia, necesidades, situación de la comunidad, etc..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="story-state" className="block text-sm font-semibold text-gray-700 mb-1">Estado (Opcional)</label>
            <select
              id="story-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            >
              <option value="">Seleccione un estado</option>
              {VENEZUELAN_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="story-city" className="block text-sm font-semibold text-gray-700 mb-1">Ciudad / Localidad (Opcional)</label>
            <input
              id="story-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej. Cumaná / Cariaco"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <input
              id="story-anon"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded-sm border-gray-300 text-[#0B1F3A] focus:ring-[#0B1F3A]"
            />
            <label htmlFor="story-anon" className="text-sm text-gray-700 font-medium">
              Publicar de forma Anónima
            </label>
          </div>

          {!isAnonymous && (
            <div>
              <label htmlFor="story-author" className="block text-sm font-semibold text-gray-700 mb-1">Tu Nombre</label>
              <input
                id="story-author"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ej. María Teresa"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden sm:max-w-md"
              />
            </div>
          )}
        </div>

        <div>
          <ImageUpload onUploadComplete={setPhotoUrl} label="Subir foto ilustrativa (Opcional)" placeholder="Subir foto" />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center space-x-2 rounded-lg bg-[#0B1F3A] py-3 text-base font-bold text-white hover:bg-[#152e4f] transition-colors sm:w-auto sm:px-12"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Enviando historia...</span>
            </>
          ) : (
            <span>Compartir Historia</span>
          )}
        </button>
      </div>
    </form>
  );
}
