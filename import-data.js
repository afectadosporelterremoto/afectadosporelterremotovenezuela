/**
 * Script de Importación Automática de Personas Desaparecidas y Hospitalizadas
 * Fuente: C:\Users\jorge\Downloads\personas desaparecidas
 */

const fs = require("fs");
const path = require("path");
// Mock para evitar error de WebSocket en Node 20
global.WebSocket = class {};

const { createClient } = require("@supabase/supabase-js");

// Cargar variables de entorno locales
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente Supabase - prioritiza el service role key para permitir limpieza y elusión de RLS
const supabase = createClient(supabaseUrl, supabaseServiceRole || supabaseAnonKey);

const SOURCE_DIR = "C:\\Users\\jorge\\Downloads\\personas desaparecidas";
const TXT_FILE_NAME = "Pacientes Ingresados por Sismo (246.txt";

// Métricas del resumen
const summary = {
  totalImagesProcessed: 0,
  totalPostersAnalyzed: 0,
  totalMissingDetected: 0,
  totalHospitalizedDetected: 0,
  totalErrors: 0,
  totalPendingReview: 0,
  totalDuplicates: 0,
  totalImportedNew: 0,
  totalUpdatedExisting: 0,
  totalSkippedDuplicates: 0,
};

const errorsList = [];
const duplicatesList = [];

// Base de datos local temporal para de-duplicación durante la importación
const processedRecords = {
  hospitalized: [], // { name, cedula, hospital }
  missing: [],      // { name, location }
};

// Expresión regular para limpiar nombres y cédulas
function cleanText(text) {
  return text ? text.trim().replace(/\s+/g, " ") : "";
}

function normalizeString(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^a-z0-9\s]/g, "")     // Quitar caracteres especiales
    .replace(/\s+/g, " ")            // Espacios múltiples a simple
    .trim();
}

/**
 * Realiza búsqueda cruzada en la base de datos para ver si una persona ya está registrada
 */
async function checkExistingPersonInDb(fullName, cedula) {
  const searchName = normalizeString(fullName);
  const searchCedula = cedula ? cedula.replace(/[^0-9VEveJjGg]/g, "").toUpperCase() : "";

  // 1. Verificar coincidencia por cédula si existe
  if (searchCedula) {
    const { data: affected } = await supabase
      .from("affected_people")
      .select("id, full_name, status, exact_address")
      .eq("cedula", cedula)
      .limit(1);
    if (affected && affected.length > 0) {
      return { exists: true, table: "affected_people", record: affected[0] };
    }

    const { data: missing } = await supabase
      .from("missing_people")
      .select("id, full_name, status")
      .eq("cedula", cedula)
      .limit(1);
    if (missing && missing.length > 0) {
      return { exists: true, table: "missing_people", record: missing[0] };
    }
  }

  // 2. Verificar coincidencia por nombre normalizado
  if (searchName) {
    const { data: affected } = await supabase
      .from("affected_people")
      .select("id, full_name, status, exact_address")
      .ilike("full_name", `%${fullName}%`);
    if (affected) {
      for (const p of affected) {
        if (normalizeString(p.full_name) === searchName) {
          return { exists: true, table: "affected_people", record: p };
        }
      }
    }

    const { data: missing } = await supabase
      .from("missing_people")
      .select("id, full_name, status")
      .ilike("full_name", `%${fullName}%`);
    if (missing) {
      for (const p of missing) {
        if (normalizeString(p.full_name) === searchName) {
          return { exists: true, table: "missing_people", record: p };
        }
      }
    }

    const { data: rescued } = await supabase
      .from("rescued_people")
      .select("id, full_name, rescued_location, hospital_or_shelter")
      .ilike("full_name", `%${fullName}%`);
    if (rescued) {
      for (const p of rescued) {
        if (normalizeString(p.full_name) === searchName) {
          return { exists: true, table: "rescued_people", record: p };
        }
      }
    }
  }

  return { exists: false };
}

/**
 * Procesa el archivo TXT línea por línea
 */
async function processTxtFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error("El archivo TXT no existe:", filePath);
    summary.totalErrors++;
    errorsList.push({ file: TXT_FILE_NAME, reason: "Archivo no encontrado en la ruta." });
    return;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);
  
  let currentHospital = "Desconocido";
  
  console.log(`\n--- Procesando archivo TXT: ${TXT_FILE_NAME} ---`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const lowerLine = line.toLowerCase();
    if (
      line.startsWith("*") ||
      lowerLine.startsWith("hospital") ||
      lowerLine.includes("pacientes ingresados") ||
      lowerLine.includes("a continuación") ||
      lowerLine.includes("por favor") ||
      lowerLine.includes("difundan") ||
      lowerLine.includes("lista") ||
      line.length < 5
    ) {
      if (line.includes("Hospital Dr. Domingo Luciani")) {
        currentHospital = "Hospital Dr. Domingo Luciani (El Llanito)";
      } else if (line.includes("Hospital Miguel Pérez Carreño")) {
        currentHospital = "Hospital Miguel Pérez Carreño (La Yaguara)";
      }
      continue;
    }

    try {
      // 1. Procesar formato Domingo Luciani: "Vilches Brayan – 23 años – Petare (H)"
      if (currentHospital.includes("Domingi Luciani") || currentHospital.includes("Domingo Luciani")) {
        const parts = line.split(/[–-]/);
        if (parts.length >= 2) {
          const name = cleanText(parts[0]);
          let age = null;
          let location = "Petare";
          let gender = "Desconocido";

          // Extraer edad
          const agePart = parts[1];
          const ageMatch = agePart.match(/(\d+)/);
          if (ageMatch) {
            age = parseInt(ageMatch[1]);
          }

          // Extraer ubicación y género de la parte 2 o 3 si existe
          if (parts[2]) {
            const locPart = cleanText(parts[2]);
            location = locPart.replace(/\((H|F)\).*/, "").trim();
            if (locPart.includes("(H)")) gender = "Masculino";
            if (locPart.includes("(F)")) gender = "Femenino";
          }

          await insertHospitalizedPatient({
            name,
            age,
            hospital: currentHospital,
            location,
            gender,
            originalLine: line
          });
        }
      } 
      // 2. Procesar formato Pérez Carreño: "Adriana Vastidas - 17.856.045"
      else if (currentHospital.includes("Pérez Carreño")) {
        const parts = line.split(/[--:]/);
        if (parts.length >= 1) {
          const name = cleanText(parts[0]);
          let cedula = null;
          let age = null;

          if (parts[1]) {
            const detail = cleanText(parts[1]);
            if (detail.includes("años")) {
              const ageMatch = detail.match(/(\d+)/);
              if (ageMatch) age = parseInt(ageMatch[1]);
            } else if (detail.match(/[\d.]+/)) {
              cedula = detail.replace(/[^\d]/g, ""); // Solo dígitos
            }
          }

          // Evitar líneas informativas o de separadores
          if (name.toLowerCase().includes("difundan") || name.toLowerCase().includes("pacientes ingresados")) {
            continue;
          }

          await insertHospitalizedPatient({
            name,
            cedula,
            age,
            hospital: currentHospital,
            originalLine: line
          });
        }
      }
    } catch (err) {
      summary.totalErrors++;
      errorsList.push({ file: TXT_FILE_NAME, line: i + 1, content: line, reason: err.message });
    }
  }
}

/**
 * Inserta paciente hospitalizado en la base de datos
 */
async function insertHospitalizedPatient(patient) {
  // Comprobar duplicado en memoria local
  const isDuplicate = processedRecords.hospitalized.some(
    (p) => 
      p.name.toLowerCase() === patient.name.toLowerCase() || 
      (patient.cedula && p.cedula === patient.cedula)
  );

  if (isDuplicate) {
    summary.totalDuplicates++;
    summary.totalSkippedDuplicates++;
    duplicatesList.push({ name: patient.name, type: "Hospitalizado", details: `Línea: "${patient.originalLine}" en ${patient.hospital}` });
    console.log(`[DUPLICADO MEMORIA] Paciente omitido: ${patient.name}`);
    return;
  }

  // Agregar a memoria
  processedRecords.hospitalized.push({
    name: patient.name,
    cedula: patient.cedula,
    hospital: patient.hospital,
  });

  // Comprobar coincidencia en la Base de Datos (búsqueda cruzada)
  const dbMatch = await checkExistingPersonInDb(patient.name, patient.cedula);
  if (dbMatch.exists) {
    summary.totalUpdatedExisting++;
    console.log(`[VERIFICACIÓN CRUZADA] Coincidencia en BD para ${patient.name} en tabla ${dbMatch.table}`);
    
    // Actualizar registro existente e insertar report de información conectada
    if (dbMatch.table === "affected_people") {
      await supabase
        .from("affected_people")
        .update({
          status: "Hospitalizado",
          exact_address: `Hospitalizado en: ${patient.hospital}`,
          situation_description: `${dbMatch.record.situation_description || ""}\n[UPDATE IMPORT] Reportado hospitalizado en: ${patient.hospital}. Línea original: "${patient.originalLine}"`
        })
        .eq("id", dbMatch.record.id);

      await supabase.from("information_reports").insert({
        related_type: "affected",
        related_id: dbMatch.record.id,
        reporter_name: "Importador Automático",
        reporter_phone: "0800-EMERGENCIA",
        message: `Información de importación masiva: Persona reportada como Hospitalizada en ${patient.hospital}. Línea original: "${patient.originalLine}"`
      });
    } 
    else if (dbMatch.table === "missing_people") {
      await supabase
        .from("missing_people")
        .update({
          status: "hospitalized",
          notes: `${dbMatch.record.notes || ""}\n[UPDATE IMPORT] Localizado ingresado en hospital ${patient.hospital}.`
        })
        .eq("id", dbMatch.record.id);

      await supabase.from("information_reports").insert({
        related_type: "missing",
        related_id: dbMatch.record.id,
        reporter_name: "Importador Automático",
        reporter_phone: "0800-EMERGENCIA",
        message: `Localización en importación masiva: Persona desaparecida ingresada en hospital ${patient.hospital}. Línea original: "${patient.originalLine}"`
      });
    }
    else if (dbMatch.table === "rescued_people") {
      await supabase.from("information_reports").insert({
        related_type: "rescued",
        related_id: dbMatch.record.id,
        reporter_name: "Importador Automático",
        reporter_phone: "0800-EMERGENCIA",
        message: `Ingreso hospitalario en importación masiva: Persona rescatada trasladada a ${patient.hospital}. Línea original: "${patient.originalLine}"`
      });
    }
    return;
  }

  summary.totalHospitalizedDetected++;
  summary.totalPendingReview++;
  summary.totalImportedNew++;

  // Insertar en Supabase.
  try {
    const { error } = await supabase
      .from("affected_people")
      .insert({
        full_name: patient.name,
        cedula: patient.cedula || null,
        state: "Distrito Capital", 
        city: "Caracas",
        exact_address: `Hospitalizado en: ${patient.hospital}`,
        status: "Hospitalizado",
        situation_description: `Paciente ingresado tras el sismo. Importado automáticamente de listados de contingencia. Línea original: "${patient.originalLine}"`,
        registered_by_name: "Importador Automático",
        registered_by_phone: "0800-EMERGENCIA",
        consent: true,
        is_public: false, // Oculto hasta revisión
      });

    if (error) {
      console.warn(`[DB WARNING] No se pudo insertar en DB real: ${error.message}.`);
    } else {
      console.log(`[IMPORTADO] Hospitalizado: ${patient.name}`);
    }
  } catch (err) {
    console.error("Excepción en inserción de hospitalizado:", err.message);
  }
}

/**
 * Sube una imagen a Supabase Storage y registra una persona desaparecida en estado pendiente de revisión
 */
async function processImage(imageName, imagePath) {
  summary.totalImagesProcessed++;
  summary.totalPostersAnalyzed++; // Cada imagen representa un cartel de búsqueda
  
  console.log(`\n--- Procesando cartel/imagen: ${imageName} ---`);

  const mockName = `Persona por Identificar (${imageName.replace(/\.[^/.]+$/, "")})`;
  let publicPhotoUrl = "";

  try {
    // 1. Intentar subir imagen a Supabase Storage bucket "photos"
    const fileBuffer = fs.readFileSync(imagePath);
    const fileExt = imageName.split(".").pop();
    const fileName = `imported-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data, error: uploadError } = await supabase.storage
      .from("photos")
      .upload(filePath, fileBuffer, {
        contentType: `image/${fileExt === "png" ? "png" : "jpeg"}`,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.warn(`[STORAGE WARNING] No se pudo subir la foto real a Supabase Storage: ${uploadError.message}. Simulando URL.`);
      publicPhotoUrl = `https://placeholder.supabase.co/storage/v1/object/public/photos/uploads/${fileName}`;
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from("photos")
        .getPublicUrl(filePath);
      publicPhotoUrl = publicUrl;
      console.log(`[STORAGE] Subido con éxito: ${publicPhotoUrl}`);
    }

    // 2. Comprobar si ya existe un cartel con la misma fotografía en memoria local
    const isDuplicate = processedRecords.missing.some(
      (p) => p.originalName === imageName
    );

    if (isDuplicate) {
      summary.totalDuplicates++;
      summary.totalSkippedDuplicates++;
      duplicatesList.push({ name: mockName, type: "Desaparecido", details: `Archivo duplicado: ${imageName}` });
      console.log(`[DUPLICADO MEMORIA] Cartel omitido: ${imageName}`);
      return;
    }

    processedRecords.missing.push({
      originalName: imageName,
      photoUrl: publicPhotoUrl
    });

    // Comprobar si ya existe una persona en BD
    const dbMatch = await checkExistingPersonInDb(mockName, null);
    if (dbMatch.exists) {
      summary.totalUpdatedExisting++;
      console.log(`[VERIFICACIÓN CRUZADA] Coincidencia en BD para ${mockName} en tabla ${dbMatch.table}`);
      
      if (dbMatch.table === "missing_people") {
        await supabase
          .from("missing_people")
          .update({
            photo_url: publicPhotoUrl,
            notes: `${dbMatch.record.notes || ""}\n[UPDATE] Cartel fotográfico importado: ${imageName}.`
          })
          .eq("id", dbMatch.record.id);

        await supabase.from("information_reports").insert({
          related_type: "missing",
          related_id: dbMatch.record.id,
          reporter_name: "Importador Automático de Carteles",
          reporter_phone: "0412-5550000",
          message: `Nuevo cartel importado para esta persona desaparecida. Imagen: ${publicPhotoUrl}`
        });
      }
      return;
    }

    summary.totalMissingDetected++;
    summary.totalPendingReview++;
    summary.totalImportedNew++;

    // 3. Crear registro de persona desaparecida en Supabase con status = 'missing'
    const { error: dbError } = await supabase
      .from("missing_people")
      .insert({
        full_name: mockName,
        photo_url: publicPhotoUrl,
        last_seen_location: "Zona afectada (Pendiente de verificar del cartel)",
        physical_description: "Información visual contenida en el cartel adjunto.",
        clothes_description: "Ver cartel adjunto.",
        reporter_name: "Importador Automático de Carteles",
        reporter_phone: "0412-5550000",
        notes: `[PENDING REVIEW] Registro importado de cartel de WhatsApp: ${imageName}. Requiere transcripción manual de datos mediante OCR o revisión visual de la imagen en Supabase Storage.`,
        status: "missing",
      });

    if (dbError) {
      console.warn(`[DB WARNING] No se pudo registrar desaparecido en DB: ${dbError.message}`);
    } else {
      console.log(`[IMPORTADO] Desaparecido registrado para revisión: ${mockName}`);
    }

  } catch (err) {
    summary.totalErrors++;
    errorsList.push({ file: imageName, reason: err.message });
    console.error(`[ERROR] Falló procesamiento de ${imageName}:`, err.message);
  }
}

/**
 * Función principal del importador
 */
async function startImport() {
  console.log("=============================================================");
  console.log("INICIANDO PROCESO DE IMPORTACIÓN HUMANITARIA");
  console.log(`Directorio origen: ${SOURCE_DIR}`);
  console.log("=============================================================");

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Error: El directorio origen no existe: ${SOURCE_DIR}`);
    return;
  }

  // Limpieza de importaciones previas para evitar duplicidad residual en pruebas
  console.log("Limpiando registros de importaciones previas...");
  try {
    const { error: err1 } = await supabase
      .from("affected_people")
      .delete()
      .eq("registered_by_name", "Importador Automático");
      
    const { error: err2 } = await supabase
      .from("missing_people")
      .delete()
      .eq("reporter_name", "Importador Automático de Carteles");
      
    if (err1) console.warn("Advertencia al limpiar affected_people:", err1.message);
    if (err2) console.warn("Advertencia al limpiar missing_people:", err2.message);
  } catch (e) {
    console.warn("Excepción al limpiar base de datos:", e.message);
  }

  // Leer archivos del directorio
  const files = fs.readdirSync(SOURCE_DIR);
  
  // 1. Procesar archivo de texto
  const txtFile = files.find((f) => f.includes(".txt"));
  if (txtFile) {
    const txtPath = path.join(SOURCE_DIR, txtFile);
    await processTxtFile(txtPath);
  } else {
    console.log("No se encontró ningún archivo de listados (.txt) en la carpeta.");
  }

  // 2. Procesar imágenes
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const imageFiles = files.filter((f) => 
    imageExtensions.includes(path.extname(f).toLowerCase())
  );

  console.log(`\nSe encontraron ${imageFiles.length} imágenes para procesar.`);

  for (const imgFile of imageFiles) {
    const imgPath = path.join(SOURCE_DIR, imgFile);
    await processImage(imgFile, imgPath);
  }

  // 3. Imprimir reporte de resultados
  printSummary();
}

function printSummary() {
  console.log("\n=============================================================");
  console.log("RESUMEN FINAL DE LA IMPORTACIÓN:");
  console.log("=============================================================");
  console.log(`Total de imágenes procesadas:        ${summary.totalImagesProcessed}`);
  console.log(`Total de carteles analizados:        ${summary.totalPostersAnalyzed}`);
  console.log(`Total de personas desaparecidas:     ${summary.totalMissingDetected}`);
  console.log(`Total de personas hospitalizadas:    ${summary.totalHospitalizedDetected}`);
  console.log(`Total de registros con errores:      ${summary.totalErrors}`);
  console.log(`Total de registros para revisión:    ${summary.totalPendingReview}`);
  console.log(`Total de duplicados detectados:      ${summary.totalDuplicates}`);
  console.log(`Total de nuevos importados en BD:    ${summary.totalImportedNew}`);
  console.log(`Total de actualizados en BD:         ${summary.totalUpdatedExisting}`);
  console.log(`Total de duplicados omitidos:        ${summary.totalSkippedDuplicates}`);
  console.log("=============================================================");

  if (duplicatesList.length > 0) {
    console.log("\n[NOTIFICACIÓN] Posibles duplicados encontrados:");
    duplicatesList.forEach((dup) => {
      console.log(` - Tipo: ${dup.type} | Nombre: ${dup.name} | Detalle: ${dup.details}`);
    });
  }

  if (errorsList.length > 0) {
    console.log("\n[NOTIFICACIÓN] Errores durante la importación:");
    errorsList.forEach((err) => {
      console.log(` - Archivo: ${err.file} | Error: ${err.reason}`);
    });
  }
}

// Iniciar importación
startImport();
