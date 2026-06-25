/**
 * Importación masiva de pacientes hospitalizados desde Excel consolidado.
 * Fuente: PacientesConsolidados_Hospitales_Venezuela.xlsx
 * 337 pacientes de 5 hospitales:
 *   - Hospital Universitario de Caracas (59)
 *   - Cruz Roja (27)
 *   - Periférico de Catia (43)
 *   - Hospital Domingo Luciani (90)
 *   - Hospital Pérez Carreño (118)
 * 
 * Se usa la hoja maestra "BUSCAR PACIENTES" que consolida todos.
 * Se insertan en affected_people con status "Hospitalizado".
 */
global.WebSocket = class {};
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRole);

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeString(str) {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

async function run() {
  console.log("=== IMPORTACIÓN PACIENTES HOSPITALIZADOS ===\n");

  const csvPath = path.join(__dirname, "excel_sheet____BUSCAR_PACIENTES.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.split("\n").map(l => l.replace(/\r$/, "")).filter(l => l.trim());

  // Skip first 2 header rows (title + column header), data starts at line index 2
  const dataLines = lines.slice(2);
  console.log(`Líneas de datos encontradas: ${dataLines.length}`);

  // Parse all records
  const records = [];
  const seenNames = new Set(); // Track within-batch duplicates
  
  for (const line of dataLines) {
    const cols = parseCsvLine(line);
    if (cols.length < 3) continue;

    const num = cols[0];
    const hospital = cols[1];
    const fullName = cols[2];
    const age = cols[3] || "";
    const cedula = cols[4] || "";
    const phone = cols[5] || "";
    const address = cols[6] || "";
    const observations = cols[7] || "";

    if (!fullName || fullName === "APELLIDOS Y NOMBRES") continue;

    // Skip in-batch duplicates (same name + same hospital)
    const dedupeKey = normalizeString(fullName) + "|" + normalizeString(hospital);
    if (seenNames.has(dedupeKey)) {
      continue;
    }
    seenNames.add(dedupeKey);

    // Determine actual status based on observations
    let status = "Hospitalizado";
    const obsLower = (observations || "").toLowerCase();
    if (obsLower.includes("fallecid")) {
      status = "Fallecido";
    }

    // Parse age (handle invalid values like "150")
    let parsedAge = parseInt(age) || null;
    if (parsedAge && parsedAge > 120) parsedAge = null;

    records.push({
      full_name: fullName,
      cedula: cedula || null,
      phone: phone || null,
      state: hospital.includes("Catia") ? "Distrito Capital" : 
             hospital.includes("Luciani") ? "Miranda" : 
             hospital.includes("Cruz Roja") ? "Distrito Capital" : 
             "Distrito Capital",
      city: hospital.includes("Luciani") ? "Caracas (El Llanito)" : "Caracas",
      municipality: null,
      parish: null,
      exact_address: address || null,
      reference_point: hospital,
      status: status,
      situation_description: observations 
        ? `Paciente ingresado en ${hospital}. ${observations}. Edad: ${age || "N/D"}`
        : `Paciente ingresado en ${hospital}. Edad: ${age || "N/D"}`,
      registered_by_name: "Importador Consolidado Hospitales",
      registered_by_phone: "Sistema",
      consent: true,
      is_public: true,
    });
  }

  console.log(`Registros únicos a procesar (sin duplicados internos): ${records.length}`);

  // Check existing records in DB to avoid duplicates
  const { data: existing, error: fetchErr } = await supabase
    .from("affected_people")
    .select("full_name, cedula, reference_point")
    .eq("status", "Hospitalizado");

  if (fetchErr) {
    console.error("Error al consultar existentes:", fetchErr.message);
    return;
  }

  const existingKeys = new Set();
  if (existing) {
    for (const e of existing) {
      existingKeys.add(normalizeString(e.full_name) + "|" + normalizeString(e.reference_point || ""));
      if (e.cedula) {
        existingKeys.add("cedula:" + e.cedula.replace(/[^0-9]/g, ""));
      }
    }
  }
  console.log(`Registros hospitalizados ya existentes en BD: ${existing ? existing.length : 0}`);

  // Filter out records that already exist
  const toInsert = [];
  let duplicateCount = 0;
  for (const rec of records) {
    const key = normalizeString(rec.full_name) + "|" + normalizeString(rec.reference_point || "");
    const cedulaKey = rec.cedula ? "cedula:" + rec.cedula.replace(/[^0-9]/g, "") : null;
    
    if (existingKeys.has(key) || (cedulaKey && existingKeys.has(cedulaKey))) {
      duplicateCount++;
      continue;
    }
    toInsert.push(rec);
    existingKeys.add(key);
    if (cedulaKey) existingKeys.add(cedulaKey);
  }

  console.log(`\nDuplicados encontrados (ya en BD): ${duplicateCount}`);
  console.log(`Registros nuevos a insertar: ${toInsert.length}`);

  if (toInsert.length === 0) {
    console.log("\nNo hay registros nuevos para insertar. Base de datos ya actualizada.");
    return;
  }

  // Insert in batches of 50
  const BATCH_SIZE = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("affected_people").insert(batch);
    if (error) {
      console.error(`[ERROR] Batch ${Math.floor(i/BATCH_SIZE)+1}: ${error.message}`);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`[OK] Batch ${Math.floor(i/BATCH_SIZE)+1}: ${batch.length} insertados (${inserted}/${toInsert.length})`);
    }
  }

  console.log("\n=== RESUMEN FINAL ===");
  console.log(`Total en archivo Excel: ${dataLines.length} filas`);
  console.log(`Registros únicos procesados: ${records.length}`);
  console.log(`Ya existían en BD: ${duplicateCount}`);
  console.log(`Insertados exitosamente: ${inserted}`);
  console.log(`Errores: ${errors}`);

  // Verify final counts
  const { count: totalAffected } = await supabase
    .from("affected_people")
    .select("*", { count: "exact", head: true });
  const { count: totalHospitalized } = await supabase
    .from("affected_people")
    .select("*", { count: "exact", head: true })
    .eq("status", "Hospitalizado");

  console.log(`\nTotal afectados en BD: ${totalAffected}`);
  console.log(`Total hospitalizados en BD: ${totalHospitalized}`);
}

run();
