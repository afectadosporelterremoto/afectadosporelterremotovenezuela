"use client";

import React, { useState } from "react";
import { updateOfficialBalance, getOfficialBalanceHistory, restoreLastBalance } from "@/app/actions";
import { AlertCircle, CheckCircle, Loader2, Save, History, RotateCcw, X, ArrowRight } from "lucide-react";
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
    source_org?: string | null;
    source_bulletin?: string | null;
    source_report_number?: string | null;
    source_report_date?: string | null;
    source_report_time?: string | null;
    source_url?: string | null;
  } | null;
}

export default function AdminBalanceForm({ initialBalance }: AdminBalanceFormProps) {
  // Current values
  const [deceasedCount, setDeceasedCount] = useState<string>(String(initialBalance?.deceased_count ?? 188));
  const [injuredCount, setInjuredCount] = useState<string>(String(initialBalance?.injured_count ?? 1520));
  const [missingCount, setMissingCount] = useState<string>(String(initialBalance?.missing_count ?? 157));
  const [rescuedCount, setRescuedCount] = useState<string>(String(initialBalance?.rescued_count ?? 200));
  const [familiesCount, setFamiliesCount] = useState<string>(String(initialBalance?.families_count ?? 2227));
  const [buildingsCount, setBuildingsCount] = useState<string>(String(initialBalance?.buildings_count ?? 250));
  const [source, setSource] = useState(initialBalance?.source ?? "Cifras Oficiales de Protección Civil");
  const [internalNotes, setInternalNotes] = useState(initialBalance?.internal_notes ?? "");

  // Advanced source fields
  const [sourceOrg, setSourceOrg] = useState(initialBalance?.source_org ?? "Protección Civil");
  const [sourceBulletin, setSourceBulletin] = useState(initialBalance?.source_bulletin ?? "");
  const [sourceReportNumber, setSourceReportNumber] = useState(initialBalance?.source_report_number ?? "");
  const [sourceReportDate, setSourceReportDate] = useState(initialBalance?.source_report_date ?? "");
  const [sourceReportTime, setSourceReportTime] = useState(initialBalance?.source_report_time ?? "");
  const [sourceUrl, setSourceUrl] = useState(initialBalance?.source_url ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(initialBalance?.updated_at);

  // Modals state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Helper to translate field names for the UI
  function translateFieldName(field: string) {
    const map: Record<string, string> = {
      deceased_count: "Fallecidos",
      injured_count: "Heridos",
      missing_count: "Desaparecidos",
      rescued_count: "Rescatados",
      families_count: "Familias",
      buildings_count: "Edificaciones",
      source: "Fuente General",
      internal_notes: "Notas internas",
      source_org: "Nombre del Organismo",
      source_bulletin: "Boletín",
      source_report_number: "Número de reporte",
      source_report_date: "Fecha del reporte",
      source_report_time: "Hora del reporte",
      source_url: "URL"
    };
    return map[field] || field;
  }

  // Calculate the diff list between current inputs and initial balance
  const getDiffList = () => {
    const diffs: { label: string; oldVal: any; newVal: any }[] = [];

    const compareNum = (label: string, oldVal: number | undefined, newVal: string) => {
      const oldStr = oldVal !== undefined ? String(oldVal) : "0";
      if (oldStr !== newVal) {
        diffs.push({ label, oldVal: oldStr, newVal });
      }
    };

    const compareStr = (label: string, oldVal: string | null | undefined, newVal: string) => {
      const oldStr = oldVal || "";
      if (oldStr.trim() !== newVal.trim()) {
        diffs.push({ label, oldVal: oldStr || "Vacio", newVal: newVal || "Vacio" });
      }
    };

    compareNum("Fallecidos", initialBalance?.deceased_count, deceasedCount);
    compareNum("Heridos", initialBalance?.injured_count, injuredCount);
    compareNum("Desaparecidos", initialBalance?.missing_count, missingCount);
    compareNum("Rescatados", initialBalance?.rescued_count, rescuedCount);
    compareNum("Familias", initialBalance?.families_count, familiesCount);
    compareNum("Edificaciones", initialBalance?.buildings_count, buildingsCount);
    compareStr("Fuente General", initialBalance?.source, source);
    compareStr("Notas Internas", initialBalance?.internal_notes, internalNotes);
    compareStr("Nombre del Organismo", initialBalance?.source_org, sourceOrg);
    compareStr("Boletín", initialBalance?.source_bulletin, sourceBulletin);
    compareStr("Número de reporte", initialBalance?.source_report_number, sourceReportNumber);
    compareStr("Fecha del reporte", initialBalance?.source_report_date, sourceReportDate);
    compareStr("Hora del reporte", initialBalance?.source_report_time, sourceReportTime);
    compareStr("URL Fuente", initialBalance?.source_url, sourceUrl);

    return diffs;
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Form validation
    const numDeceased = Number(deceasedCount);
    const numInjured = Number(injuredCount);
    const numMissing = Number(missingCount);
    const numRescued = Number(rescuedCount);
    const numFamilies = Number(familiesCount);
    const numBuildings = Number(buildingsCount);

    if (
      isNaN(numDeceased) || isNaN(numInjured) || isNaN(numMissing) ||
      isNaN(numRescued) || isNaN(numFamilies) || isNaN(numBuildings)
    ) {
      return setError("Por favor ingrese cifras válidas. No se permiten letras en los contadores numéricos.");
    }

    if (
      numDeceased < 0 || numInjured < 0 || numMissing < 0 ||
      numRescued < 0 || numFamilies < 0 || numBuildings < 0
    ) {
      return setError("Las cifras del balance no pueden ser números negativos.");
    }

    if (!sourceOrg.trim()) {
      return setError("El campo 'Nombre del organismo' es obligatorio para la información de la fuente.");
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError(null);
    setSuccess(false);

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
        source_org: sourceOrg.trim() || undefined,
        source_bulletin: sourceBulletin.trim() || undefined,
        source_report_number: sourceReportNumber.trim() || undefined,
        source_report_date: sourceReportDate.trim() || undefined,
        source_report_time: sourceReportTime.trim() || undefined,
        source_url: sourceUrl.trim() || undefined,
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

  const handleRestore = async () => {
    if (!confirm("¿Está seguro de que desea restaurar el balance oficial a la versión inmediatamente anterior?")) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await restoreLastBalance();
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        // Refresh page or update states by reload to reflect db
        window.location.reload();
      }
    } catch (err) {
      setError("Error al restaurar la última versión del balance.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const history = await getOfficialBalanceHistory();
      setHistoryList(history || []);
    } catch (err: any) {
      setHistoryError("No se pudo cargar el historial de cambios.");
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleOpenHistory}
          className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white py-2 px-4 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <History className="h-4 w-4 text-gray-500" />
          <span>Historial de cambios</span>
        </button>

        <button
          type="button"
          onClick={handleRestore}
          disabled={loading}
          className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white py-2 px-4 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4 text-gray-500" />
          <span>Restaurar último balance</span>
        </button>
      </div>

      <form onSubmit={handlePreSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-xs">
        <div className="border-b border-gray-100 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 md:text-xl">Cifras del Balance Oficial</h2>
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
              type="text"
              required
              value={deceasedCount}
              onChange={(e) => setDeceasedCount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="injured-count" className="block text-sm font-semibold text-gray-700 mb-1">
              Heridos Oficiales *
            </label>
            <input
              id="injured-count"
              type="text"
              required
              value={injuredCount}
              onChange={(e) => setInjuredCount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="missing-count" className="block text-sm font-semibold text-gray-700 mb-1">
              Desaparecidos Oficiales *
            </label>
            <input
              id="missing-count"
              type="text"
              required
              value={missingCount}
              onChange={(e) => setMissingCount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="rescued-count" className="block text-sm font-semibold text-gray-700 mb-1">
              Rescatados Oficiales *
            </label>
            <input
              id="rescued-count"
              type="text"
              required
              value={rescuedCount}
              onChange={(e) => setRescuedCount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="families-count" className="block text-sm font-semibold text-gray-700 mb-1">
              Familias Afectadas *
            </label>
            <input
              id="families-count"
              type="text"
              required
              value={familiesCount}
              onChange={(e) => setFamiliesCount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="buildings-count" className="block text-sm font-semibold text-gray-700 mb-1">
              Edificaciones Afectadas *
            </label>
            <input
              id="buildings-count"
              type="text"
              required
              value={buildingsCount}
              onChange={(e) => setBuildingsCount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>
        </div>

        {/* 4. INFORMACIÓN DE LA FUENTE DETALLADA */}
        <div className="space-y-4 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Detalles de la Fuente Oficial</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="source-org" className="block text-xs font-semibold text-gray-700 mb-1">
                Nombre del Organismo *
              </label>
              <input
                id="source-org"
                type="text"
                required
                value={sourceOrg}
                onChange={(e) => setSourceOrg(e.target.value)}
                placeholder="Ej. Protección Civil / CICPC"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="source-bulletin" className="block text-xs font-semibold text-gray-700 mb-1">
                Boletín
              </label>
              <input
                id="source-bulletin"
                type="text"
                value={sourceBulletin}
                onChange={(e) => setSourceBulletin(e.target.value)}
                placeholder="Ej. Boletín Oficial del Sismo"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="source-report-number" className="block text-xs font-semibold text-gray-700 mb-1">
                Número de reporte
              </label>
              <input
                id="source-report-number"
                type="text"
                value={sourceReportNumber}
                onChange={(e) => setSourceReportNumber(e.target.value)}
                placeholder="Ej. Reporte Nº 2"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="source-report-date" className="block text-xs font-semibold text-gray-700 mb-1">
                Fecha del reporte
              </label>
              <input
                id="source-report-date"
                type="date"
                value={sourceReportDate}
                onChange={(e) => setSourceReportDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="source-report-time" className="block text-xs font-semibold text-gray-700 mb-1">
                Hora del reporte
              </label>
              <input
                id="source-report-time"
                type="time"
                value={sourceReportTime}
                onChange={(e) => setSourceReportTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="source-url" className="block text-xs font-semibold text-gray-700 mb-1">
                URL de la Fuente (opcional)
              </label>
              <input
                id="source-url"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="Ej. https://proteccioncivil.gob.ve/reporte2"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label htmlFor="balance-source" className="block text-xs font-semibold text-gray-700 mb-1">
              Etiqueta de Fuente General (Resumen)
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
            <label htmlFor="internal-notes" className="block text-xs font-semibold text-gray-700 mb-1">
              Notas Internas (No visibles al público)
            </label>
            <textarea
              id="internal-notes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={3}
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Confirmar Actualización</h3>
            <p className="text-sm text-gray-500 mb-4">
              Por favor revise detenidamente las cifras que van a cambiar antes de confirmar la actualización oficial:
            </p>
            
            <div className="max-h-60 overflow-y-auto space-y-3 mb-6 border border-gray-100 rounded-lg p-4 bg-gray-50">
              {getDiffList().map((diff, idx) => (
                <div key={idx} className="text-xs text-gray-700 flex flex-col border-b border-gray-200/50 pb-2 last:border-0 last:pb-0">
                  <span className="font-bold text-gray-900 text-xs">{diff.label}</span>
                  <div className="flex items-center space-x-2 mt-1 font-mono">
                    <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded line-through">{diff.oldVal ?? "Ninguno"}</span>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <span className="text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-bold">{diff.newVal ?? "Ninguno"}</span>
                  </div>
                </div>
              ))}
              {getDiffList().length === 0 && (
                <div className="text-xs text-gray-500 italic text-center py-4">No hay cambios detectados.</div>
              )}
            </div>

            <div className="flex space-x-3 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={loading}
                className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-bold text-white hover:bg-[#152e4f] flex items-center space-x-1"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                <span>Confirmar actualización</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl rounded-xl bg-white p-6 shadow-xl border border-gray-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="h-5 w-5 text-gray-600" />
                Historial de Cambios del Balance Oficial
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-auto flex-1 space-y-4 pr-1">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12 text-sm text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin mr-2 text-gray-500" />
                  Cargando historial de cambios...
                </div>
              ) : historyError ? (
                <div className="text-sm text-red-600 p-4 bg-red-50 rounded-lg">{historyError}</div>
              ) : historyList.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-12 italic">
                  No hay registros de cambios del balance en el historial o las tablas no están creadas.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Fecha/Hora (VE)</th>
                        <th className="p-3">Administrador</th>
                        <th className="p-3">IP</th>
                        <th className="p-3">Campo</th>
                        <th className="p-3">Anterior</th>
                        <th className="p-3">Nuevo</th>
                        <th className="p-3">Observación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {historyList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 text-gray-600">
                          <td className="p-3 whitespace-nowrap font-medium">{formatVenezuelaDateTime(item.changed_at || item.created_at)}</td>
                          <td className="p-3">{item.admin_email || "Administrador"}</td>
                          <td className="p-3 font-mono text-[10px]">{item.ip_address || "127.0.0.1"}</td>
                          <td className="p-3 font-semibold text-gray-800">{translateFieldName(item.field_name)}</td>
                          <td className="p-3 text-red-600 line-through font-mono">{item.old_value ?? "N/A"}</td>
                          <td className="p-3 text-green-700 font-bold font-mono">{item.new_value ?? "N/A"}</td>
                          <td className="p-3 max-w-[200px] truncate" title={item.notes}>{item.notes || "Actualización"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="rounded-lg bg-gray-100 hover:bg-gray-200 px-4 py-2 text-xs font-bold text-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
