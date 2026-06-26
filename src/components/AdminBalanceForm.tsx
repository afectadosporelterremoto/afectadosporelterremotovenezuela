"use client";

import React, { useState } from "react";
import { updateOfficialBalance } from "@/app/actions";
import { AlertCircle, CheckCircle, Loader2, Save } from "lucide-react";
import { formatVenezuelaDateTime } from "@/utils/date";

interface AdminBalanceFormProps {
  initialBalance: {
    deceased_count: number;
    injured_count: number;
    missing_count: number;
    rescued_count: number;
    families_count: number;
    buildings_count: number;
    source: string | null;
    internal_notes: string | null;
    updated_at?: string;
  } | null;
}

export default function AdminBalanceForm({ initialBalance }: AdminBalanceFormProps) {
  const [deceasedCount, setDeceasedCount] = useState(initialBalance?.deceased_count ?? 188);
  const [injuredCount, setInjuredCount] = useState(initialBalance?.injured_count ?? 1520);
  const [missingCount, setMissingCount] = useState(initialBalance?.missing_count ?? 157);
  const [rescuedCount, setRescuedCount] = useState(initialBalance?.rescued_count ?? 200);
  const [familiesCount, setFamiliesCount] = useState(initialBalance?.families_count ?? 2227);
  const [buildingsCount, setBuildingsCount] = useState(initialBalance?.buildings_count ?? 250);
  const [source, setSource] = useState(initialBalance?.source ?? "Cifras Oficiales de Protección Civil");
  const [internalNotes, setInternalNotes] = useState(initialBalance?.internal_notes ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(initialBalance?.updated_at);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (
      deceasedCount < 0 ||
      injuredCount < 0 ||
      missingCount < 0 ||
      rescuedCount < 0 ||
      familiesCount < 0 ||
      buildingsCount < 0
    ) {
      return setError("Las cifras del balance no pueden ser números negativos.");
    }

    setLoading(true);

    try {
      const res = await updateOfficialBalance({
        deceased_count: Number(deceasedCount),
        injured_count: Number(injuredCount),
        missing_count: Number(missingCount),
        rescued_count: Number(rescuedCount),
        families_count: Number(familiesCount),
        buildings_count: Number(buildingsCount),
        source: source.trim() || undefined,
        internal_notes: internalNotes.trim() || undefined,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setLastUpdated(new Date().toISOString());
      }
    } catch (err) {
      setError("Ocurrió un error inesperado al actualizar el balance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-xs max-w-3xl">
      <div className="border-b border-gray-100 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 md:text-xl">Balance Oficial del Sismo</h2>
          <p className="text-xs text-gray-500 mt-1">
            Actualice las cifras del sismo que se muestran en el bloque oficial en la página de inicio.
          </p>
        </div>
        {lastUpdated && (
          <div className="text-right">
            <span className="block text-[10px] uppercase font-bold text-gray-400">Última Modificación</span>
            <span className="text-xs font-semibold text-gray-700">{formatVenezuelaDateTime(lastUpdated)}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start space-x-2 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start space-x-2 text-sm text-green-700">
          <CheckCircle className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
          <span>¡Balance oficial actualizado correctamente! Se reflejará de inmediato en la home.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="deceased-count" className="block text-sm font-semibold text-gray-700 mb-1">
            Fallecidos Oficiales *
          </label>
          <input
            id="deceased-count"
            type="number"
            required
            min="0"
            value={deceasedCount}
            onChange={(e) => setDeceasedCount(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          />
        </div>

        <div>
          <label htmlFor="injured-count" className="block text-sm font-semibold text-gray-700 mb-1">
            Heridos Oficiales *
          </label>
          <input
            id="injured-count"
            type="number"
            required
            min="0"
            value={injuredCount}
            onChange={(e) => setInjuredCount(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          />
        </div>

        <div>
          <label htmlFor="missing-count" className="block text-sm font-semibold text-gray-700 mb-1">
            Desaparecidos Oficiales *
          </label>
          <input
            id="missing-count"
            type="number"
            required
            min="0"
            value={missingCount}
            onChange={(e) => setMissingCount(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          />
        </div>

        <div>
          <label htmlFor="rescued-count" className="block text-sm font-semibold text-gray-700 mb-1">
            Rescatados Oficiales *
          </label>
          <input
            id="rescued-count"
            type="number"
            required
            min="0"
            value={rescuedCount}
            onChange={(e) => setRescuedCount(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          />
        </div>

        <div>
          <label htmlFor="families-count" className="block text-sm font-semibold text-gray-700 mb-1">
            Familias Afectadas *
          </label>
          <input
            id="families-count"
            type="number"
            required
            min="0"
            value={familiesCount}
            onChange={(e) => setFamiliesCount(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          />
        </div>

        <div>
          <label htmlFor="buildings-count" className="block text-sm font-semibold text-gray-700 mb-1">
            Edificaciones Afectadas *
          </label>
          <input
            id="buildings-count"
            type="number"
            required
            min="0"
            value={buildingsCount}
            onChange={(e) => setBuildingsCount(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-gray-100 pt-4">
        <div>
          <label htmlFor="balance-source" className="block text-sm font-semibold text-gray-700 mb-1">
            Fuente del Balance
          </label>
          <input
            id="balance-source"
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Ej. Segundo reporte de Protección Civil / Rueda de prensa oficial"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          />
        </div>

        <div>
          <label htmlFor="internal-notes" className="block text-sm font-semibold text-gray-700 mb-1">
            Notas Internas (No visibles al público)
          </label>
          <textarea
            id="internal-notes"
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            rows={4}
            placeholder="Comentarios sobre la verificación del reporte, discordancia en medios, etc..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center space-x-2 rounded-lg bg-[#0B1F3A] py-2.5 px-6 text-sm font-bold text-white hover:bg-[#152e4f] transition-colors sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Guardar Balance Oficial</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
