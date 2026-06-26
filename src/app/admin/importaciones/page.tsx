"use client";

import React, { useState } from "react";
import { previewImport, executeImport } from "@/app/actions";
import { 
  Upload, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Database,
  ArrowRight,
  Info
} from "lucide-react";

export default function ImportacionesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<FileList | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isImported, setIsImported] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewData(null);
      setSuccess(null);
      setError(null);
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImages(e.target.files);
      setPreviewData(null);
      setSuccess(null);
      setError(null);
    }
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && (!images || images.length === 0)) {
      return setError("Por favor, seleccione al menos un archivo Excel/CSV o imágenes para importar.");
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setPreviewData(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }
      if (images) {
        for (let i = 0; i < images.length; i++) {
          formData.append("images", images[i]);
        }
      }

      const res = await previewImport(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setPreviewData(res);
      }
    } catch (err) {
      setError("Ocurrió un error al procesar la vista previa del archivo.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }
      if (images) {
        for (let i = 0; i < images.length; i++) {
          formData.append("images", images[i]);
        }
      }

      const res = await executeImport(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(
          `Importación realizada con éxito. Se insertaron ${res.hospitalizedCount} hospitalizados y ${res.missingCount} fichas de desaparecidos/imágenes.`
        );
        setIsImported(true);
        setPreviewData(null);
        setFile(null);
        setImages(null);
        
        // Reset file inputs
        const fileInput = document.getElementById("excel-file") as HTMLInputElement;
        const imagesInput = document.getElementById("images-files") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        if (imagesInput) imagesInput.value = "";
      }
    } catch (err) {
      setError("Ocurrió un error al ejecutar la importación.");
    } finally {
      setLoading(false);
    }
  };

  // Determine if it is a TXT list (which updates status) vs CSV (which skips duplicates)
  const isTxtMode = file?.name.endsWith(".txt") ?? false;

  const toInsertCount = (previewData?.hospitalized?.toInsert?.length || 0) + (previewData?.missing?.toInsert?.length || 0);
  const toUpdateCount = isTxtMode ? (previewData?.hospitalized?.duplicates?.length || 0) : 0;
  const duplicateCount = !isTxtMode ? (previewData?.hospitalized?.duplicates?.length || 0) : 0;
  const omittedCount = (previewData?.missing?.duplicates?.length || 0) + duplicateCount;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <Upload className="h-7 w-7 text-blue-700" />
          Módulo de Importaciones Masivas
        </h1>
        <p className="text-xs text-gray-500">
          Suba listados de hospitales en formato Excel/CSV/TXT y carpetas de carteles/imágenes para poblar y actualizar la base de datos automáticamente.
        </p>
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
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel de Selección */}
        <form onSubmit={handlePreview} className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-150 pb-3">
            <Database className="h-4 w-4 text-gray-500" />
            Carga de Archivos
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="excel-file" className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Documento de Hospitales (.xlsx, .csv, .txt)
              </label>
              <div className="mt-1 flex items-center space-x-3">
                <input
                  id="excel-file"
                  type="file"
                  accept=".csv,.xlsx,.txt"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Soporta formato CSV depurado de pacientes consolidados o listado plano de hospitalizados en archivo .txt.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label htmlFor="images-files" className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Imágenes / Carteles de Desaparecidos
              </label>
              <div className="mt-1">
                <input
                  id="images-files"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImagesChange}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Puede seleccionar múltiples imágenes simultáneamente para subirlas masivamente como fichas preliminares de búsqueda.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading || (!file && (!images || images.length === 0))}
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-[#0B1F3A] py-2 px-4 text-xs font-bold text-white hover:bg-[#152e4f] transition-colors disabled:opacity-50 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Obtener Vista Previa</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Panel Informativo de Instrucciones */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 pb-3">
            <Info className="h-4 w-4 text-blue-700" />
            Guía de Funcionamiento
          </h2>
          <div className="text-xs text-gray-650 space-y-2.5">
            <p>
              El importador lee, analiza y deduce la información de los archivos de manera inteligente antes de escribir en la base de datos:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
              <li>
                <strong>Detección de Duplicados:</strong> Se normalizan los nombres completos eliminando acentos, caracteres especiales y mayúsculas para compararlos contra registros existentes en <span className="font-semibold text-gray-800">affected_people</span> y <span className="font-semibold text-gray-800">missing_people</span>.
              </li>
              <li>
                <strong>Modo TXT:</strong> Si el nombre de un paciente hospitalizado ya existe, su estado se actualizará a <span className="font-semibold text-gray-800">"Hospitalizado"</span> en lugar de crear un duplicado.
              </li>
              <li>
                <strong>Modo CSV:</strong> Los registros coincidentes se filtrarán y omitirán del lote de inserción.
              </li>
              <li>
                <strong>Imágenes:</strong> Las imágenes subidas serán guardadas en el storage de Supabase y registradas automáticamente como fichas de desaparecidos.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Panel de Vista Previa y Confirmación */}
      {previewData && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-150 pb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Resultados del Análisis Preliminar</h2>
              <p className="text-xs text-gray-500 mt-0.5">Resumen de operaciones que se realizarán si confirma la importación:</p>
            </div>
            <button
              onClick={handleConfirmImport}
              disabled={loading}
              className="flex items-center justify-center space-x-2 rounded-lg bg-green-700 py-2.5 px-6 text-sm font-black text-white hover:bg-green-800 transition-colors shadow-xs"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>CONFIRMAR IMPORTACIÓN</span>
            </button>
          </div>

          {/* Tarjetas de Estadísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
              <span className="block text-2xl font-black text-emerald-800">{toInsertCount}</span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Insertará</span>
            </div>
            
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
              <span className="block text-2xl font-black text-blue-800">{toUpdateCount}</span>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Actualizará</span>
            </div>

            <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
              <span className="block text-2xl font-black text-amber-800">{duplicateCount}</span>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Duplicados</span>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 border border-gray-150">
              <span className="block text-2xl font-black text-gray-700">{omittedCount}</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Omitidos</span>
            </div>
          </div>

          {/* Listados de Vista Previa */}
          <div className="space-y-6 pt-4">
            {/* Listado de Hospitalizados a Importar */}
            {previewData.hospitalized?.toInsert?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Muestra de Hospitalizados a Insertar (Primeros 5)</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
                        <th className="p-2.5">Nombre Completo</th>
                        <th className="p-2.5">Cédula</th>
                        <th className="p-2.5">Edad</th>
                        <th className="p-2.5">Hospital / Referencia</th>
                        <th className="p-2.5">Ubicación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-600">
                      {previewData.hospitalized.toInsert.slice(0, 5).map((p: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2.5 font-medium text-gray-900">{p.full_name}</td>
                          <td className="p-2.5 font-mono">{p.cedula || "N/A"}</td>
                          <td className="p-2.5">{p.age || "N/A"}</td>
                          <td className="p-2.5">{p.hospital || p.reference_point || "N/A"}</td>
                          <td className="p-2.5">{p.location || p.address || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Listado de Hospitalizados Existentes a Actualizar o Omitir */}
            {previewData.hospitalized?.duplicates?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Muestra de Hospitalizados Coincidentes ({isTxtMode ? "Se actualizarán" : "Se omitirán"}) (Primeros 5)
                </h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
                        <th className="p-2.5">Nombre Completo</th>
                        <th className="p-2.5">Cédula</th>
                        <th className="p-2.5">Hospital</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-600">
                      {previewData.hospitalized.duplicates.slice(0, 5).map((p: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50 bg-amber-50/20">
                          <td className="p-2.5 font-medium text-gray-900">{p.full_name}</td>
                          <td className="p-2.5 font-mono">{p.cedula || "N/A"}</td>
                          <td className="p-2.5">{p.hospital || p.reference_point || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Listado de imágenes a Importar */}
            {previewData.missing?.toInsert?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Muestra de Carteles a Importar</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {previewData.missing.toInsert.slice(0, 6).map((img: any, idx: number) => (
                    <div key={idx} className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-center space-x-3 text-xs">
                      <ImageIcon className="h-8 w-8 text-purple-600 shrink-0" />
                      <div className="overflow-hidden">
                        <span className="block font-medium text-gray-900 truncate" title={img.name}>{img.name}</span>
                        <span className="block text-[10px] text-gray-400 font-mono mt-0.5">{img.filename} ({(img.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
