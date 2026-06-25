/**
 * Script de importación de nuevas personas desaparecidas (lote 2)
 * Datos extraídos visualmente de carteles de búsqueda en WhatsApp
 * Fuente: C:\Users\jorge\Downloads\personas desaparecidas (17 imágenes nuevas)
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

const SOURCE_DIR = "C:\\Users\\jorge\\Downloads\\personas desaparecidas";

function normalizeString(str) {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

// Datos extraídos de las imágenes mediante análisis visual
const missingPersons = [
  {
    full_name: "Ramón Chavarría",
    cedula: "8.001.885",
    last_seen_location: "Caraballeda, Edificio Caraballeda Sol, frente del Hipocampo",
    reporter_phone: "0412-5331911",
    physical_description: "Hombre adulto mayor, cabello canoso, usa lentes",
    image: "WhatsApp Image 2026-06-25 at 11.35.27 PM.jpeg"
  },
  {
    full_name: "Hercilia Benavente",
    cedula: "5.095.079",
    last_seen_location: "Caraballeda, Edificio Caraballeda Sol, frente del Hipocampo",
    reporter_phone: "0412-5331911",
    physical_description: "Mujer adulta, cabello oscuro recogido, usa lentes",
    image: "WhatsApp Image 2026-06-25 at 11.35.27 PM.jpeg"
  },
  {
    full_name: "Annielys",
    cedula: null,
    last_seen_location: "La Guaira, Catia La Mar",
    reporter_phone: "0422-4546342",
    physical_description: "Joven, cabello oscuro",
    image: "WhatsApp Image 2026-06-25 at 11.35.27 PM (1).jpeg"
  },
  {
    full_name: "Oliannys Annesi",
    cedula: null,
    last_seen_location: "La Guaira, Catia La Mar",
    reporter_phone: "0412-8728579",
    physical_description: "Joven, cabello castaño",
    image: "WhatsApp Image 2026-06-25 at 11.35.27 PM (1).jpeg"
  },
  {
    full_name: "Yurbis Duran Becerra",
    cedula: null,
    last_seen_location: "La Guaira, Los Corales, Edificio Bahía Mar",
    reporter_phone: null,
    physical_description: "Mujer adulta, cabello largo canoso",
    image: "WhatsApp Image 2026-06-25 at 11.35.27 PM (2).jpeg"
  },
  {
    full_name: "Fiorella Ancheta Duran",
    cedula: null,
    last_seen_location: "La Guaira, Los Corales, Edificio Bahía Mar",
    reporter_phone: null,
    physical_description: "Joven, cabello oscuro, graduanda",
    image: "WhatsApp Image 2026-06-25 at 11.35.27 PM (2).jpeg"
  },
  {
    full_name: "Nathalia Ancheta Duran",
    cedula: null,
    last_seen_location: "La Guaira, Los Corales, Edificio Bahía Mar",
    reporter_phone: null,
    physical_description: "Joven, cabello rizado oscuro",
    image: "WhatsApp Image 2026-06-25 at 11.35.27 PM (2).jpeg"
  },
  {
    full_name: "Carlos Garrido",
    cedula: null,
    last_seen_location: "Edificio Costa Azul, Tanaguarenas, La Guaira",
    reporter_phone: "0414-1547599",
    physical_description: "Hombre adulto joven, cabello oscuro corto",
    image: "WhatsApp Image 2026-06-25 at 11.35.27 PM (3).jpeg"
  },
  {
    full_name: "Keila Andreina Torres",
    cedula: null,
    last_seen_location: "Edificio Costa Azul, Tanaguarenas, La Guaira",
    reporter_phone: "0412-9508326",
    physical_description: "Mujer adulta, cabello castaño, usa sombrero",
    image: "WhatsApp Image 2026-06-25 at 11.35.27 PM (3).jpeg"
  },
  {
    full_name: "Santiago Garrido Torres",
    cedula: null,
    last_seen_location: "Edificio Costa Azul, Tanaguarenas, La Guaira",
    reporter_phone: "0424-3771571",
    physical_description: "Niño pequeño",
    image: "WhatsApp Image 2026-06-25 at 11.35.27 PM (3).jpeg"
  },
  {
    full_name: "Siena Garrido Torres",
    cedula: null,
    last_seen_location: "Edificio Costa Azul, Tanaguarenas, La Guaira",
    reporter_phone: "0424-3771571",
    physical_description: "Bebé",
    image: "WhatsApp Image 2026-06-25 at 11.35.27 PM (3).jpeg"
  },
  {
    full_name: "Jorgelys Haydee Velázquez Coronado",
    cedula: "26.280.532",
    last_seen_location: "Residencia Oasis Beach, La Guaira",
    reporter_phone: "0414-4592673",
    physical_description: "Mujer joven, cabello oscuro largo, tez clara",
    image: "WhatsApp Image 2026-06-25 at 11.35.27 PM (4).jpeg"
  },
  {
    full_name: "Orlando González",
    cedula: null,
    last_seen_location: "Caribe, Playa Los Cocos, La Guaira",
    reporter_phone: "0414-8981159",
    physical_description: "Hombre adulto mayor, cabello canoso, usa camisa amarilla",
    approximate_age: 75,
    image: "WhatsApp Image 2026-06-25 at 11.35.27 PM (5).jpeg"
  },
  {
    full_name: "Julio Lacruz Rondón",
    cedula: null,
    last_seen_location: "Hotel Catimar, Maiquetía, La Guaira",
    reporter_phone: "0424-7713557",
    physical_description: "Hombre adulto, cabello oscuro, gorra negra",
    image: "WhatsApp Image 2026-06-25 at 11.35.27 PM (6).jpeg"
  },
  {
    full_name: "Ysmael Peña Pérez",
    cedula: "18.798.842",
    last_seen_location: "Hotel Catimar, Maiquetía, La Guaira",
    reporter_phone: "0424-7713557",
    physical_description: "Hombre joven, barba, cabello oscuro, usa lentes",
    image: "WhatsApp Image 2026-06-25 at 11.35.28 PM.jpeg"
  },
  {
    full_name: "Anlly Briceño",
    cedula: null,
    last_seen_location: "La Guaira, Residencia El Caribe",
    reporter_phone: "0416-3785716",
    physical_description: "Mujer joven, cabello oscuro, usa lentes",
    image: "WhatsApp Image 2026-06-25 at 11.35.28 PM (1).jpeg"
  },
  {
    full_name: "Naysha Blanco",
    cedula: null,
    last_seen_location: "La Guaira, Residencia El Caribe",
    reporter_phone: "0416-1314614",
    physical_description: "Joven, cabello oscuro lacio",
    image: "WhatsApp Image 2026-06-25 at 11.35.28 PM (1).jpeg"
  },
  {
    full_name: "Dr. Marcos Sanchez",
    cedula: null,
    last_seen_location: "La Guaira, Residencia El Caribe",
    reporter_phone: "0412-1234786",
    physical_description: "Hombre adulto, tez morena",
    image: "WhatsApp Image 2026-06-25 at 11.35.28 PM (1).jpeg"
  },
  {
    full_name: "Anlly Yusney Briceño Cruz",
    cedula: "20.617.303",
    last_seen_location: "La Guaira, Residencia El Caribe",
    reporter_phone: "0416-3785716",
    physical_description: "Mujer joven, fecha de nacimiento 20/01/1992, estado civil soltera",
    image: "WhatsApp Image 2026-06-25 at 11.35.28 PM (2).jpeg"
  },
  {
    full_name: "Lucas Gamez",
    cedula: null,
    last_seen_location: "La Guaira, Edificio Miramar, Av. La Costanera",
    reporter_phone: null,
    physical_description: "Niño, cabello castaño claro, aproximadamente 8 años",
    approximate_age: 8,
    image: "WhatsApp Image 2026-06-25 at 11.35.28 PM (3).jpeg"
  },
  {
    full_name: "Sebastian Guanipa Tirado",
    cedula: null,
    last_seen_location: "Edificio Costa Brava, Los Corales, La Guaira",
    reporter_phone: "0424-2006832",
    physical_description: "Niño, cabello oscuro, uniforme escolar",
    approximate_age: 10,
    image: "WhatsApp Image 2026-06-25 at 11.35.28 PM (4).jpeg"
  },
  {
    full_name: "Lilibeth",
    cedula: null,
    last_seen_location: "Edificio La Estrella, La Guaira",
    reporter_phone: null,
    physical_description: "Mujer adulta, cabello oscuro",
    image: "WhatsApp Image 2026-06-25 at 11.35.28 PM (5).jpeg"
  },
  {
    full_name: "José Ángel",
    cedula: null,
    last_seen_location: "Edificio La Estrella, La Guaira",
    reporter_phone: null,
    physical_description: "Joven, cabello oscuro corto",
    image: "WhatsApp Image 2026-06-25 at 11.35.28 PM (5).jpeg"
  },
  {
    full_name: "José Manuel Ortega Figueredo",
    cedula: "3.921.117",
    last_seen_location: "Macuto, El Cojo, La Guaira",
    reporter_phone: "(+507) 64656263",
    physical_description: "Hombre adulto mayor, 73 años, cabello canoso, delgado",
    approximate_age: 73,
    image: "WhatsApp Image 2026-06-25 at 11.35.28 PM (6).jpeg"
  },
  {
    full_name: "Luis José Guerrero Silva",
    cedula: "23.471.443",
    last_seen_location: "Hotel Santuario, La Llanada, La Guaira (deportado de EE.UU., llegó a Maiquetía)",
    reporter_phone: "0412-7635663",
    physical_description: "Hombre joven, gorra negra, barba",
    image: "WhatsApp Image 2026-06-25 at 11.35.28 PM (7).jpeg"
  },
  {
    full_name: "José Ramón Brito Calderón",
    cedula: null,
    last_seen_location: "Residencia Perlamar, Caribe, La Guaira",
    reporter_phone: "0412-0216873",
    physical_description: "Hombre de 60 años, alto, verrugas en la cara, diabético e hipertenso, problemas en las rodillas",
    approximate_age: 60,
    image: "WhatsApp Image 2026-06-25 at 11.35.28 PM (8).jpeg"
  },
  {
    full_name: "Maury Lozano",
    cedula: null,
    last_seen_location: "Marriott, Playa Grande, La Guaira",
    reporter_phone: "0416-9189407",
    physical_description: "Mujer joven, tez morena",
    image: "photo_5902455654205558606_y.jpg"
  },
  {
    full_name: "Victoria Franco",
    cedula: null,
    last_seen_location: "Marriott, Playa Grande, La Guaira",
    reporter_phone: "0416-9189407",
    physical_description: "Mujer adulta, cabello castaño con mechas, usa lentes",
    image: "photo_5902455654205558606_y.jpg"
  }
];

const summary = { inserted: 0, duplicates: 0, errors: 0, uploaded: 0 };

async function checkDuplicate(name, cedula) {
  const norm = normalizeString(name);
  
  // Check by cedula first
  if (cedula) {
    const cleanCedula = cedula.replace(/[^0-9]/g, "");
    const { data: byCedula } = await supabase
      .from("missing_people")
      .select("id, full_name")
      .ilike("cedula", `%${cleanCedula}%`)
      .limit(1);
    if (byCedula && byCedula.length > 0) return true;
  }

  // Check by normalized name
  if (norm && norm.length > 5) {
    const { data: byName } = await supabase
      .from("missing_people")
      .select("id, full_name")
      .ilike("full_name", `%${name}%`)
      .limit(5);
    if (byName) {
      for (const p of byName) {
        if (normalizeString(p.full_name) === norm) return true;
      }
    }
  }
  return false;
}

async function uploadImage(imageName) {
  const imagePath = path.join(SOURCE_DIR, imageName);
  if (!fs.existsSync(imagePath)) {
    console.warn(`[WARN] Imagen no encontrada: ${imagePath}`);
    return null;
  }
  
  const fileBuffer = fs.readFileSync(imagePath);
  const ext = imageName.split(".").pop();
  const fileName = `missing-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await supabase.storage
    .from("photos")
    .upload(filePath, fileBuffer, {
      contentType: `image/${ext === "png" ? "png" : "jpeg"}`,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.warn(`[STORAGE WARN] ${error.message}`);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(filePath);
  summary.uploaded++;
  return publicUrl;
}

async function run() {
  console.log("=== IMPORTACIÓN LOTE 2: Personas Desaparecidas ===");
  console.log(`Total de personas a procesar: ${missingPersons.length}`);

  // Track which images we've already uploaded (some share image)
  const uploadedImages = {};

  for (const person of missingPersons) {
    console.log(`\nProcesando: ${person.full_name}...`);

    // Merge Anlly Briceño with Anlly Yusney Briceño Cruz (same person, more data in cédula image)
    if (person.full_name === "Anlly Briceño") {
      // Skip - the more complete record "Anlly Yusney Briceño Cruz" with cédula will be used
      console.log(`  [SKIP] Se usará registro más completo con cédula`);
      continue;
    }

    // Check duplicate
    const isDup = await checkDuplicate(person.full_name, person.cedula);
    if (isDup) {
      summary.duplicates++;
      console.log(`  [DUPLICADO] Ya existe en BD`);
      continue;
    }

    // Upload image if not yet uploaded
    let photoUrl = null;
    if (person.image) {
      if (uploadedImages[person.image]) {
        photoUrl = uploadedImages[person.image];
      } else {
        photoUrl = await uploadImage(person.image);
        if (photoUrl) uploadedImages[person.image] = photoUrl;
      }
    }

    // Insert into missing_people
    const { error } = await supabase.from("missing_people").insert({
      full_name: person.full_name,
      cedula: person.cedula || null,
      approximate_age: person.approximate_age || null,
      photo_url: photoUrl,
      last_seen_location: person.last_seen_location,
      physical_description: person.physical_description || null,
      reporter_name: "Importador Automático Lote 2",
      reporter_phone: person.reporter_phone || "Sin número de contacto",
      notes: `[IMPORTADO] Datos extraídos de cartel de búsqueda de WhatsApp. Imagen: ${person.image}`,
      status: "missing",
    });

    if (error) {
      summary.errors++;
      console.log(`  [ERROR] ${error.message}`);
    } else {
      summary.inserted++;
      console.log(`  [OK] Insertado correctamente`);
    }
  }

  console.log("\n=== RESUMEN ===");
  console.log(`Insertados: ${summary.inserted}`);
  console.log(`Duplicados omitidos: ${summary.duplicates}`);
  console.log(`Errores: ${summary.errors}`);
  console.log(`Imágenes subidas: ${summary.uploaded}`);
}

run();
