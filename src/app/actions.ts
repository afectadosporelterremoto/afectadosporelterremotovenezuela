"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { normalizeString, cleanCedula, cleanPhone, getWordTokens } from "@/utils/normalize";
import { headers } from "next/headers";

// Función auxiliar para validar administrador en Server Actions
async function verifyAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    // Consultar si está en la tabla admin_users
    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .single();
      
    if (error || !adminUser || adminUser.role !== "admin") {
      return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Comprueba si una persona ya existe en el sistema (búsqueda cruzada)
 */
export async function checkPersonExistingStatus(data: {
  fullName?: string;
  cedula?: string;
  phone?: string;
}) {
  try {
    const supabase = await createClient();
    const searchCedula = cleanCedula(data.cedula);
    const searchName = normalizeString(data.fullName);
    const searchPhone = cleanPhone(data.phone);

    if (!searchCedula && !searchName && !searchPhone) {
      return { exists: false };
    }

    // 1. Coincidencia exacta por cédula
    if (searchCedula) {
      const [{ data: affectedByCedula }, { data: missingByCedula }] = await Promise.all([
        supabase.from("affected_people").select("id, full_name, status, state, city, exact_address").eq("cedula", data.cedula).limit(5),
        supabase.from("missing_people").select("id, full_name, status, last_seen_location").eq("cedula", data.cedula).limit(5),
      ]);

      if (affectedByCedula && affectedByCedula.length > 0) {
        const record = affectedByCedula[0];
        const type = record.status === "Hospitalizado" ? "hospitalizado" : "afectado";
        return {
          exists: true,
          type,
          record: {
            id: record.id,
            full_name: record.full_name,
            status: record.status,
            location: `${record.city}, ${record.state}`,
            hospital: record.status === "Hospitalizado" ? record.exact_address : undefined,
          },
          confidence: "high",
          message: record.status === "Hospitalizado"
            ? `Esta persona ya aparece registrada como ingresada en el hospital: ${record.exact_address || "No especificado"}.`
            : "Esta persona ya aparece registrada como afectada en el sistema."
        };
      }

      if (missingByCedula && missingByCedula.length > 0) {
        const record = missingByCedula[0];
        const type = record.status === "hospitalized" ? "hospitalizado" : (record.status === "located" || record.status === "rescued" ? "rescatado" : "desaparecido");
        return {
          exists: true,
          type,
          record: {
            id: record.id,
            full_name: record.full_name,
            status: record.status,
            location: record.last_seen_location,
          },
          confidence: "high",
          message: record.status === "hospitalized"
            ? "Esta persona ya aparece registrada como hospitalizada."
            : (record.status === "located" || record.status === "rescued"
              ? "Esta persona ya aparece registrada como rescatada o localizada."
              : "Esta persona ya aparece registrada como desaparecida. Revisa el registro antes de crear uno nuevo.")
        };
      }
    }

    // 2. Coincidencia por nombre normalizado (en memoria sobre pool limitado de candidatos)
    const nameTokens = getWordTokens(data.fullName || "");
    let affectedQuery = supabase.from("affected_people").select("id, full_name, cedula, phone, status, state, city, exact_address");
    let missingQuery = supabase.from("missing_people").select("id, full_name, cedula, reporter_phone, status, last_seen_location");
    let rescuedQuery = supabase.from("rescued_people").select("id, full_name, description, rescued_location, hospital_or_shelter");

    const [{ data: affectedPeople }, { data: missingPeople }, { data: rescuedPeople }] = await Promise.all([
      affectedQuery.limit(500),
      missingQuery.limit(500),
      rescuedQuery.limit(500),
    ]);

    if (searchName) {
      if (affectedPeople) {
        for (const record of affectedPeople) {
          const normRecordName = normalizeString(record.full_name);
          if (normRecordName === searchName || (normRecordName.includes(searchName) && searchName.length > 8) || (searchName.includes(normRecordName) && normRecordName.length > 8)) {
            const type = record.status === "Hospitalizado" ? "hospitalizado" : "afectado";
            return {
              exists: true,
              type,
              record: {
                id: record.id,
                full_name: record.full_name,
                status: record.status,
                location: `${record.city}, ${record.state}`,
                hospital: record.status === "Hospitalizado" ? record.exact_address : undefined,
              },
              confidence: "high",
              message: record.status === "Hospitalizado"
                ? `Esta persona ya aparece registrada como ingresada en el hospital: ${record.exact_address || "No especificado"}.`
                : "Esta persona ya aparece registrada como afectada en el sistema."
            };
          }
        }
      }

      if (missingPeople) {
        for (const record of missingPeople) {
          const normRecordName = normalizeString(record.full_name);
          if (normRecordName.includes("persona por identificar")) continue;
          if (normRecordName === searchName || (normRecordName.includes(searchName) && searchName.length > 8) || (searchName.includes(normRecordName) && normRecordName.length > 8)) {
            const type = record.status === "hospitalized" ? "hospitalizado" : (record.status === "located" || record.status === "rescued" ? "rescatado" : "desaparecido");
            return {
              exists: true,
              type,
              record: {
                id: record.id,
                full_name: record.full_name,
                status: record.status,
                location: record.last_seen_location,
              },
              confidence: "high",
              message: record.status === "hospitalized"
                ? "Esta persona ya aparece registrada como hospitalizada."
                : (record.status === "located" || record.status === "rescued"
                  ? "Esta persona ya aparece registrada como rescatada o localizada."
                  : "Esta persona ya aparece registrada como desaparecida. Revisa el registro antes de crear uno nuevo.")
            };
          }
        }
      }

      if (rescuedPeople) {
        for (const record of rescuedPeople) {
          const normRecordName = normalizeString(record.full_name);
          if (normRecordName.includes("desconocido")) continue;
          if (normRecordName === searchName || (normRecordName.includes(searchName) && searchName.length > 8) || (searchName.includes(normRecordName) && normRecordName.length > 8)) {
            return {
              exists: true,
              type: "rescatado",
              record: {
                id: record.id,
                full_name: record.full_name,
                status: "Rescatado",
                location: record.rescued_location || record.hospital_or_shelter || "No especificada",
              },
              confidence: "high",
              message: "Esta persona ya aparece registrada como rescatada o localizada."
            };
          }
        }
      }
    }

    // 3. Coincidencia por teléfono como apoyo
    if (searchPhone) {
      if (affectedPeople) {
        const match = affectedPeople.find((p) => cleanPhone(p.phone) === searchPhone);
        if (match) {
          const type = match.status === "Hospitalizado" ? "hospitalizado" : "afectado";
          return {
            exists: true,
            type,
            record: {
              id: match.id,
              full_name: match.full_name,
              status: match.status,
              location: `${match.city}, ${match.state}`,
            },
            confidence: "medium",
            message: `Esta persona comparte el mismo teléfono con un registro de: ${match.full_name} (${match.status}).`
          };
        }
      }
      if (missingPeople) {
        const match = missingPeople.find((p) => cleanPhone(p.reporter_phone) === searchPhone);
        if (match) {
          return {
            exists: true,
            type: "desaparecido",
            record: {
              id: match.id,
              full_name: match.full_name,
              status: "Desaparecido",
            },
            confidence: "medium",
            message: `Esta persona comparte el mismo teléfono de contacto con la búsqueda de: ${match.full_name}.`
          };
        }
      }
    }

    return { exists: false };
  } catch (err: any) {
    console.error("Error in checkPersonExistingStatus:", err);
    return { exists: false, error: err.message };
  }
}

// ----------------------------------------------------
// ACCIONES PÚBLICAS (FORMULARIOS)
// ----------------------------------------------------

/**
 * Registra una persona afectada
 */
export async function registerAffectedPerson(data: {
  fullName: string;
  cedula?: string;
  phone?: string;
  state: string;
  city: string;
  municipality?: string;
  parish?: string;
  exactAddress?: string;
  referencePoint?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  situationDescription?: string;
  personPhotoUrl?: string;
  placePhotoUrl?: string;
  registeredByName: string;
  registeredByPhone: string;
  consent: boolean;
  websiteHoneypot?: string; // Honeypot antispam
  bypassDuplicateCheck?: boolean;
}) {
  // 1. Validar honeypot
  if (data.websiteHoneypot) {
    return { success: true, message: "Simulación exitosa (spam bloqueado)" };
  }

  // 2. Validaciones básicas en servidor
  if (!data.fullName.trim() || !data.state || !data.city || !data.status || !data.registeredByName.trim() || !data.registeredByPhone.trim() || !data.consent) {
    return { error: "Por favor complete todos los campos obligatorios y acepte el aviso de privacidad." };
  }

  // 3. Verificación de duplicados
  if (!data.bypassDuplicateCheck) {
    const check = await checkPersonExistingStatus({
      fullName: data.fullName,
      cedula: data.cedula,
      phone: data.phone,
    });
    if (check.exists) {
      return {
        error: "DUPLICATE_FOUND",
        message: check.message,
        type: check.type,
        record: check.record,
      };
    }
  }

  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("affected_people")
      .insert({
        full_name: data.fullName.trim(),
        cedula: data.cedula?.trim() || null,
        phone: data.phone?.trim() || null,
        state: data.state,
        city: data.city,
        municipality: data.municipality?.trim() || null,
        parish: data.parish?.trim() || null,
        exact_address: data.exactAddress?.trim() || null,
        reference_point: data.referencePoint?.trim() || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        status: data.status,
        situation_description: data.situationDescription?.trim() || null,
        person_photo_url: data.personPhotoUrl || null,
        place_photo_url: data.placePhotoUrl || null,
        registered_by_name: data.registeredByName.trim(),
        registered_by_phone: data.registeredByPhone.trim(),
        consent: data.consent,
        is_public: true,
      });

    if (error) {
      console.error("Error BD affected_people:", error.message);
      return { error: `Error de base de datos: ${error.message}` };
    }

    revalidatePath("/buscar");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Excepción en registrar afectado:", err);
    return { error: "Ocurrió un error inesperado al guardar el registro." };
  }
}

/**
 * Reporta una persona desaparecida
 */
export async function registerMissingPerson(data: {
  fullName: string;
  cedula?: string;
  approximateAge?: number;
  photoUrl?: string;
  lastSeenLocation: string;
  physicalDescription?: string;
  clothesDescription?: string;
  reporterName: string;
  reporterPhone: string;
  lastContactAt?: string;
  notes?: string;
  websiteHoneypot?: string;
  bypassDuplicateCheck?: boolean;
}) {
  if (data.websiteHoneypot) {
    return { success: true };
  }

  if (!data.fullName.trim() || !data.lastSeenLocation.trim() || !data.reporterName.trim() || !data.reporterPhone.trim()) {
    return { error: "Por favor complete los campos requeridos (nombre, última ubicación conocida y datos de contacto)." };
  }

  // Verificación de duplicados
  if (!data.bypassDuplicateCheck) {
    const check = await checkPersonExistingStatus({
      fullName: data.fullName,
      cedula: data.cedula,
      phone: data.reporterPhone,
    });
    if (check.exists) {
      return {
        error: "DUPLICATE_FOUND",
        message: check.message,
        type: check.type,
        record: check.record,
      };
    }
  }

  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("missing_people")
      .insert({
        full_name: data.fullName.trim(),
        cedula: data.cedula?.trim() || null,
        approximate_age: data.approximateAge || null,
        photo_url: data.photoUrl || null,
        last_seen_location: data.lastSeenLocation.trim(),
        physical_description: data.physicalDescription?.trim() || null,
        clothes_description: data.clothesDescription?.trim() || null,
        reporter_name: data.reporterName.trim(),
        reporter_phone: data.reporterPhone.trim(),
        last_contact_at: data.lastContactAt ? new Date(data.lastContactAt).toISOString() : null,
        notes: data.notes?.trim() || null,
        status: "missing",
      });

    if (error) {
      return { error: `Error de base de datos: ${error.message}` };
    }

    revalidatePath("/desaparecidos");
    return { success: true };
  } catch (err: any) {
    return { error: "Ocurrió un error inesperado." };
  }
}

/**
 * Registra una persona rescatada
 */
export async function registerRescuedPerson(data: {
  fullName?: string;
  photoUrl?: string;
  description?: string;
  rescuedLocation?: string;
  hospitalOrShelter?: string;
  healthStatus?: string;
  reportedByName?: string;
  reportedByPhone?: string;
  rescuedAt?: string;
  websiteHoneypot?: string;
  bypassDuplicateCheck?: boolean;
}) {
  if (data.websiteHoneypot) {
    return { success: true };
  }

  // Verificación de duplicados
  if (data.fullName && !data.bypassDuplicateCheck) {
    const check = await checkPersonExistingStatus({
      fullName: data.fullName,
      phone: data.reportedByPhone,
    });
    if (check.exists) {
      return {
        error: "DUPLICATE_FOUND",
        message: check.message,
        type: check.type,
        record: check.record,
      };
    }
  }

  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("rescued_people")
      .insert({
        full_name: data.fullName?.trim() || "Desconocido/a",
        photo_url: data.photoUrl || null,
        description: data.description?.trim() || null,
        rescued_location: data.rescuedLocation?.trim() || null,
        hospital_or_shelter: data.hospitalOrShelter?.trim() || null,
        health_status: data.healthStatus?.trim() || null,
        reported_by_name: data.reportedByName?.trim() || null,
        reported_by_phone: data.reportedByPhone?.trim() || null,
        rescued_at: data.rescuedAt ? new Date(data.rescuedAt).toISOString() : null,
      });

    if (error) {
      return { error: `Error de base de datos: ${error.message}` };
    }

    revalidatePath("/rescatados");
    return { success: true };
  } catch (err: any) {
    return { error: "Ocurrió un error inesperado." };
  }
}

/**
 * Registra una historia de afectado (queda en pendiente)
 */
export async function submitStory(data: {
  authorName?: string;
  isAnonymous: boolean;
  state?: string;
  city?: string;
  title: string;
  content: string;
  photoUrl?: string;
  websiteHoneypot?: string;
}) {
  if (data.websiteHoneypot) {
    return { success: true };
  }

  if (!data.title.trim() || !data.content.trim()) {
    return { error: "El título y el contenido son obligatorios." };
  }

  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("stories")
      .insert({
        author_name: data.isAnonymous ? "Anónimo" : data.authorName?.trim() || "Anónimo",
        is_anonymous: data.isAnonymous,
        state: data.state || null,
        city: data.city || null,
        title: data.title.trim(),
        content: data.content.trim(),
        photo_url: data.photoUrl || null,
        status: "pending", // Por defecto pendiente de moderación
      });

    if (error) {
      return { error: `Error de base de datos: ${error.message}` };
    }

    return { success: true };
  } catch (err: any) {
    return { error: "Ocurrió un error inesperado." };
  }
}

// ----------------------------------------------------
// ACCIONES ADMINISTRATIVAS (PROTEGIDAS)
// ----------------------------------------------------

/**
 * Actualiza el estado de una persona afectada
 */
export async function updateAffectedPersonStatus(id: string, newStatus: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Acceso no autorizado." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("affected_people")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/buscar");
    revalidatePath(`/buscar/${id}`);
    revalidatePath("/admin/afectados");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Elimina o modifica un registro de afectado
 */
export async function deleteAffectedPerson(id: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Acceso no autorizado." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("affected_people")
      .delete()
      .eq("id", id);

    if (error) return { error: error.message };

    await logAuditEvent("Eliminar duplicado", "affected_people", id);

    revalidatePath("/buscar");
    revalidatePath("/admin/afectados");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Modera una historia (Aprobar / Rechazar)
 */
export async function moderateStory(id: string, status: "approved" | "rejected" | "pending") {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Acceso no autorizado." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("stories")
      .update({ status })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/historias");
    revalidatePath("/admin/historias");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Agrega o edita un contacto de emergencia
 */
export async function manageEmergencyContact(data: {
  id?: string;
  state: string;
  city: string;
  institution: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  officialSource?: string;
  isActive: boolean;
}) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Acceso no autorizado." };

  try {
    const supabase = await createClient();
    
    const contactData = {
      state: data.state,
      city: data.city,
      institution: data.institution,
      phone: data.phone,
      whatsapp: data.whatsapp || null,
      address: data.address || null,
      official_source: data.officialSource || null,
      is_active: data.isActive,
      verified_at: new Date().toISOString(),
    };

    let error;

    if (data.id) {
      // Editar existente
      const { error: updateError } = await supabase
        .from("emergency_contacts")
        .update(contactData)
        .eq("id", data.id);
      error = updateError;
    } else {
      // Crear nuevo
      const { error: insertError } = await supabase
        .from("emergency_contacts")
        .insert(contactData);
      error = insertError;
    }

    if (error) return { error: error.message };

    revalidatePath("/emergencias");
    revalidatePath("/admin/emergencias");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Elimina un contacto de emergencia
 */
export async function deleteEmergencyContact(id: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Acceso no autorizado." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("emergency_contacts")
      .delete()
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/emergencias");
    revalidatePath("/admin/emergencias");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Modifica el estado de una persona desaparecida
 */
export async function updateMissingPersonStatus(id: string, newStatus: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Acceso no autorizado." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("missing_people")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/desaparecidos");
    revalidatePath("/admin/desaparecidos");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Elimina un reporte de desaparecidos
 */
export async function deleteMissingPerson(id: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Acceso no autorizado." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("missing_people")
      .delete()
      .eq("id", id);

    if (error) return { error: error.message };

    await logAuditEvent("Eliminar duplicado", "missing_people", id);

    revalidatePath("/desaparecidos");
    revalidatePath("/admin/desaparecidos");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Modifica la visibilidad pública de una persona afectada o hospitalizada
 */
export async function toggleAffectedPersonPublic(id: string, isPublic: boolean) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Acceso no autorizado." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("affected_people")
      .update({ is_public: isPublic })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/buscar");
    revalidatePath(`/buscar/${id}`);
    revalidatePath("/hospitalizados");
    revalidatePath("/admin/hospitalizados");
    revalidatePath("/admin/afectados");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Verifica si el usuario actual es administrador (para uso del lado del cliente)
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  return await verifyAdmin();
}

/**
 * Registra información adicional sobre un afectado o desaparecido existente
 */
export async function submitInformationReport(data: {
  relatedType: "affected" | "missing" | "rescued";
  relatedId: string;
  reporterName: string;
  reporterPhone: string;
  message: string;
  websiteHoneypot?: string;
}) {
  if (data.websiteHoneypot) {
    return { success: true };
  }

  if (!data.reporterName.trim() || !data.reporterPhone.trim() || !data.message.trim()) {
    return { error: "Por favor complete todos los campos requeridos." };
  }

  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("information_reports")
      .insert({
        related_type: data.relatedType,
        related_id: data.relatedId,
        reporter_name: data.reporterName.trim(),
        reporter_phone: data.reporterPhone.trim(),
        message: data.message.trim(),
      });

    if (error) {
      console.error("Error BD information_reports:", error.message);
      return { error: `Error de base de datos: ${error.message}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Excepción en reportar información adicional:", err);
    return { error: "Ocurrió un error inesperado al enviar la información." };
  }
}

/**
 * Obtiene el balance oficial del sismo más reciente
 */
export async function getOfficialBalance() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("official_balance")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("No se pudo obtener el balance oficial:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Excepción en getOfficialBalance:", err);
    return null;
  }
}

/**
 * Actualiza o inserta el balance oficial del sismo (admin-only)
 */
export async function updateOfficialBalance(data: {
  deceased_count: number;
  injured_count: number;
  missing_count: number;
  rescued_count: number;
  families_count: number;
  buildings_count: number;
  source?: string;
  internal_notes?: string;
  source_org?: string;
  source_bulletin?: string;
  source_report_number?: string;
  source_report_date?: string;
  source_report_time?: string;
  source_url?: string;
}) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Acceso no autorizado." };

  // Validaciones
  const numericFields = [
    { value: data.deceased_count, label: "Fallecidos" },
    { value: data.injured_count, label: "Heridos" },
    { value: data.missing_count, label: "Desaparecidos" },
    { value: data.rescued_count, label: "Rescatados" },
    { value: data.families_count, label: "Familias" },
    { value: data.buildings_count, label: "Edificaciones" }
  ];

  for (const field of numericFields) {
    if (field.value === undefined || field.value === null || String(field.value).trim() === "") {
      return { error: `El campo ${field.label} es obligatorio.` };
    }
    const num = Number(field.value);
    if (isNaN(num)) {
      return { error: `El campo ${field.label} debe ser un número válido.` };
    }
    if (num < 0) {
      return { error: `El campo ${field.label} no puede ser un número negativo.` };
    }
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get current latest balance for history comparison
    const latestBalance = await getOfficialBalance();

    const insertData = {
      deceased_count: data.deceased_count,
      injured_count: data.injured_count,
      missing_count: data.missing_count,
      rescued_count: data.rescued_count,
      families_count: data.families_count,
      buildings_count: data.buildings_count,
      source: data.source || null,
      internal_notes: data.internal_notes || null,
      source_org: data.source_org || null,
      source_bulletin: data.source_bulletin || null,
      source_report_number: data.source_report_number || null,
      source_report_date: data.source_report_date || null,
      source_report_time: data.source_report_time || null,
      source_url: data.source_url || null,
      updated_by: user?.id,
      updated_at: new Date().toISOString()
    };

    let insertedRecordId = null;
    const { data: inserted, error } = await supabase
      .from("official_balance")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      // Retry without new columns if they do not exist in schema yet
      const fallbackData = {
        deceased_count: data.deceased_count,
        injured_count: data.injured_count,
        missing_count: data.missing_count,
        rescued_count: data.rescued_count,
        families_count: data.families_count,
        buildings_count: data.buildings_count,
        source: data.source || data.source_org || null,
        internal_notes: data.internal_notes || null,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      };
      
      const { data: fallbackInserted, error: fallbackError } = await supabase
        .from("official_balance")
        .insert(fallbackData)
        .select("id")
        .single();

      if (fallbackError) return { error: fallbackError.message };
      insertedRecordId = fallbackInserted.id;
    } else {
      insertedRecordId = inserted.id;
    }

    // Compare and log changes to balance_history
    if (latestBalance && insertedRecordId) {
      const fields = [
        "deceased_count",
        "injured_count",
        "missing_count",
        "rescued_count",
        "families_count",
        "buildings_count",
        "source",
        "internal_notes",
        "source_org",
        "source_bulletin",
        "source_report_number",
        "source_report_date",
        "source_report_time",
        "source_url"
      ];

      let ipAddress = "127.0.0.1";
      try {
        const headerStore = await headers();
        ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip") || "127.0.0.1";
        if (ipAddress.includes(",")) {
          ipAddress = ipAddress.split(",")[0].trim();
        }
      } catch (e) {}

      const changesList = [];
      for (const f of fields) {
        const oldVal = (latestBalance as any)[f];
        const newVal = (insertData as any)[f];
        if (oldVal !== newVal && newVal !== undefined) {
          changesList.push({
            balance_id: insertedRecordId,
            changed_by: user?.id,
            changed_at: new Date().toISOString(),
            ip_address: ipAddress,
            field_name: f,
            old_value: oldVal !== null && oldVal !== undefined ? String(oldVal) : null,
            new_value: newVal !== null && newVal !== undefined ? String(newVal) : null,
            notes: "Actualización manual"
          });
        }
      }

      if (changesList.length > 0) {
        await supabase.from("balance_history").insert(changesList);
      }
    }

    await logAuditEvent("Actualizar balance", "official_balance", insertedRecordId, data);
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Obtiene la lista pública de fallecidos confirmados
 */
export async function getPublicDeceasedPeople(queryName?: string) {
  try {
    const supabase = await createClient();
    let q = supabase
      .from("deceased_people")
      .select("id, full_name, age, state, city, location, source_type, created_at, updated_at")
      .eq("is_public", true)
      .eq("verification_status", "confirmed");

    if (queryName) {
      q = q.ilike("full_name", `%${queryName}%`);
    }

    const { data, error } = await q.order("full_name", { ascending: true });
    if (error) {
      console.warn("No se pudo obtener la lista de fallecidos (es posible que la tabla no exista aún):", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Excepción en getPublicDeceasedPeople:", err);
    return [];
  }
}

/**
 * Obtiene la lista completa de fallecidos para administración (admin-only)
 */
export async function getAdminDeceasedPeople() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Acceso no autorizado.");

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("deceased_people")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return { error: error.message };
    return { data: data || [] };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Registra manualmente un fallecido (admin-only)
 */
export async function addDeceasedPerson(data: {
  full_name: string;
  cedula?: string;
  age?: number;
  state?: string;
  city?: string;
  location?: string;
  source_type?: string;
  source_name?: string;
  source_contact?: string;
  verification_status: "pending_review" | "confirmed" | "rejected" | "duplicate";
  is_public: boolean;
  notes?: string;
}) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Acceso no autorizado." };

  if (!data.full_name || !data.full_name.trim()) {
    return { error: "El nombre completo es obligatorio." };
  }

  const rawAge = data.age as any;
  if (rawAge !== undefined && rawAge !== null && rawAge !== "") {
    const numAge = Number(rawAge);
    if (isNaN(numAge)) {
      return { error: "La edad debe ser un número válido." };
    }
    if (numAge < 0) {
      return { error: "La edad no puede ser negativa." };
    }
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check for duplicates
    const normName = normalizeString(data.full_name);
    const { data: existing } = await supabase
      .from("deceased_people")
      .select("id, full_name");

    if (existing) {
      const isDuplicate = existing.some(p => normalizeString(p.full_name) === normName);
      if (isDuplicate) {
        return { error: "Ya existe un registro de fallecido con este nombre completo." };
      }
    }

    const { data: inserted, error } = await supabase
      .from("deceased_people")
      .insert({
        ...data,
        age: rawAge !== undefined && rawAge !== null && rawAge !== "" ? Number(rawAge) : null,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (error) return { error: error.message };

    if (inserted) {
      await logAuditEvent("Crear fallecido", "deceased_people", inserted.id, data);
    }

    revalidatePath("/fallecidos");
    revalidatePath("/admin/fallecidos");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Modifica un fallecido existente (admin-only)
 */
export async function updateDeceasedPerson(
  id: string,
  data: {
    full_name?: string;
    cedula?: string;
    age?: number;
    state?: string;
    city?: string;
    location?: string;
    source_type?: string;
    source_name?: string;
    source_contact?: string;
    verification_status?: "pending_review" | "confirmed" | "rejected" | "duplicate";
    is_public?: boolean;
    notes?: string;
  }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Acceso no autorizado." };

  if (data.full_name !== undefined && !data.full_name.trim()) {
    return { error: "El nombre completo es obligatorio si se especifica." };
  }

  const rawAge = data.age as any;
  if (rawAge !== undefined && rawAge !== null && rawAge !== "") {
    const numAge = Number(rawAge);
    if (isNaN(numAge)) {
      return { error: "La edad debe ser un número válido." };
    }
    if (numAge < 0) {
      return { error: "La edad no puede ser negativa." };
    }
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check duplicate name if full_name is changing
    if (data.full_name) {
      const normName = normalizeString(data.full_name);
      const { data: existing } = await supabase
        .from("deceased_people")
        .select("id, full_name");

      if (existing) {
        const isDuplicate = existing.some(p => p.id !== id && normalizeString(p.full_name) === normName);
        if (isDuplicate) {
          return { error: "Ya existe otro registro de fallecido con este nombre completo." };
        }
      }
    }

    const { error } = await supabase
      .from("deceased_people")
      .update({
        ...data,
        age: rawAge !== undefined && rawAge !== null && rawAge !== "" ? Number(rawAge) : undefined,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) return { error: error.message };

    if (data.is_public !== undefined) {
      if (data.is_public) {
        await logAuditEvent("Publicar fallecido", "deceased_people", id, data);
      } else {
        await logAuditEvent("Ocultar fallecido", "deceased_people", id, data);
      }
    } else {
      await logAuditEvent("Editar fallecido", "deceased_people", id, data);
    }

    revalidatePath("/fallecidos");
    revalidatePath("/admin/fallecidos");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Elimina permanentemente un fallecido (admin-only)
 */
export async function deleteDeceasedPerson(id: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Acceso no autorizado." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("deceased_people")
      .delete()
      .eq("id", id);

    if (error) return { error: error.message };

    await logAuditEvent("Eliminar fallecido", "deceased_people", id);

    revalidatePath("/fallecidos");
    revalidatePath("/admin/fallecidos");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Registra una acción administrativa en el registro de auditoría
 */
export async function logAuditEvent(
  action: string,
  targetTable?: string,
  targetId?: string,
  details?: any
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let ipAddress = "127.0.0.1";
    try {
      const headerStore = await headers();
      ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip") || "127.0.0.1";
      if (ipAddress.includes(",")) {
        ipAddress = ipAddress.split(",")[0].trim();
      }
    } catch (e) {}

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action,
      target_table: targetTable,
      target_id: targetId,
      details,
      ip_address: ipAddress,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error logging audit event:", err);
  }
}

/**
 * Obtiene el historial completo de cambios de balance (admin-only)
 */
export async function getOfficialBalanceHistory() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Acceso no autorizado.");

  try {
    const supabase = await createClient();
    const { data: history, error: histError } = await supabase
      .from("balance_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (histError) {
      console.warn("No se pudo obtener el historial de balance:", histError.message);
      return [];
    }

    if (!history || history.length === 0) return [];

    const { data: admins } = await supabase.from("admin_users").select("user_id, email");
    const adminMap = new Map((admins || []).map(a => [a.user_id, a.email]));

    return history.map(item => ({
      ...item,
      admin_email: adminMap.get(item.changed_by) || "Administrador del Sistema"
    }));
  } catch (err) {
    console.error("Excepción en getOfficialBalanceHistory:", err);
    return [];
  }
}

/**
 * Restaura el balance oficial al registro inmediatamente anterior (admin-only)
 */
export async function restoreLastBalance() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Acceso no autorizado." };

  try {
    const supabase = await createClient();
    
    // Get the second most recent balance from official_balance
    const { data: balances, error: balError } = await supabase
      .from("official_balance")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2);

    if (balError || !balances || balances.length < 2) {
      return { error: "No hay un balance anterior en el historial para restaurar." };
    }

    const previousBalance = balances[1]; // The second latest
    const latestBalance = balances[0]; // The current latest
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: inserted, error: insertError } = await supabase
      .from("official_balance")
      .insert({
        deceased_count: previousBalance.deceased_count,
        injured_count: previousBalance.injured_count,
        missing_count: previousBalance.missing_count,
        rescued_count: previousBalance.rescued_count,
        families_count: previousBalance.families_count,
        buildings_count: previousBalance.buildings_count,
        source: previousBalance.source,
        internal_notes: previousBalance.internal_notes,
        source_org: previousBalance.source_org || null,
        source_bulletin: previousBalance.source_bulletin || null,
        source_report_number: previousBalance.source_report_number || null,
        source_report_date: previousBalance.source_report_date || null,
        source_report_time: previousBalance.source_report_time || null,
        source_url: previousBalance.source_url || null,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (insertError) {
      // Fallback
      const { data: fallbackInserted, error: fallbackError } = await supabase
        .from("official_balance")
        .insert({
          deceased_count: previousBalance.deceased_count,
          injured_count: previousBalance.injured_count,
          missing_count: previousBalance.missing_count,
          rescued_count: previousBalance.rescued_count,
          families_count: previousBalance.families_count,
          buildings_count: previousBalance.buildings_count,
          source: previousBalance.source,
          internal_notes: previousBalance.internal_notes,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .select("id")
        .single();

      if (fallbackError) return { error: fallbackError.message };
      
      await logAuditEvent("Restaurar balance", "official_balance", fallbackInserted.id, { restored_from_id: previousBalance.id });
      revalidatePath("/");
      return { success: true };
    }

    const newId = inserted.id;

    // Compare fields and record in balance_history
    const fields = [
      "deceased_count",
      "injured_count",
      "missing_count",
      "rescued_count",
      "families_count",
      "buildings_count",
      "source",
      "internal_notes",
      "source_org",
      "source_bulletin",
      "source_report_number",
      "source_report_date",
      "source_report_time",
      "source_url"
    ];

    let ipAddress = "127.0.0.1";
    try {
      const headerStore = await headers();
      ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip") || "127.0.0.1";
      if (ipAddress.includes(",")) {
        ipAddress = ipAddress.split(",")[0].trim();
      }
    } catch (e) {}

    const changesList = [];
    for (const f of fields) {
      const oldVal = (latestBalance as any)[f];
      const newVal = (previousBalance as any)[f];
      if (oldVal !== newVal) {
        changesList.push({
          balance_id: newId,
          changed_by: user?.id,
          changed_at: new Date().toISOString(),
          ip_address: ipAddress,
          field_name: f,
          old_value: oldVal !== null && oldVal !== undefined ? String(oldVal) : null,
          new_value: newVal !== null && newVal !== undefined ? String(newVal) : null,
          notes: "Restauración automática de balance"
        });
      }
    }

    if (changesList.length > 0) {
      await supabase.from("balance_history").insert(changesList);
    }

    await logAuditEvent("Restaurar balance", "official_balance", newId, { restored_from_id: previousBalance.id });
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Obtiene el log de auditoría completo (admin-only)
 */
export async function getAuditLogs() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Acceso no autorizado.");

  try {
    const supabase = await createClient();
    const { data: logs, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.warn("No se pudo obtener el log de auditoría:", error.message);
      return [];
    }

    if (!logs || logs.length === 0) return [];

    const { data: admins } = await supabase.from("admin_users").select("user_id, email");
    const adminMap = new Map((admins || []).map(a => [a.user_id, a.email]));

    return logs.map(item => ({
      ...item,
      admin_email: adminMap.get(item.user_id) || "Administrador"
    }));
  } catch (err) {
    console.error("Excepción en getAuditLogs:", err);
    return [];
  }
}

// Auxiliar para parsing de CSV en preview/execute
function parseCsvLine(line: string) {
  const result: string[] = [];
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

/**
 * Previsualiza una importación masiva de datos (admin-only)
 */
export async function previewImport(formData: FormData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Acceso no autorizado." };

  try {
    const file = formData.get("file") as File | null;
    const images = formData.getAll("images") as File[];
    
    let hospitalizedReport = { toInsert: [] as any[], duplicates: [] as any[] };
    let missingReport = { toInsert: [] as any[], duplicates: [] as any[] };

    const supabase = await createClient();

    // 1. Procesar Excel/CSV o archivo TXT si se subió
    if (file && file.size > 0) {
      const fileText = await file.text();
      const lines = fileText.split("\n").map(l => l.replace(/\r$/, "")).filter(l => l.trim());

      if (file.name.endsWith(".txt")) {
        let currentHospital = "Desconocido";
        const seenNames = new Set<string>();

        const { data: existingAffected } = await supabase.from("affected_people").select("full_name");
        const { data: existingMissing } = await supabase.from("missing_people").select("full_name");
        
        const affectedMap = new Set((existingAffected || []).map(a => normalizeString(a.full_name)));
        const missingMap = new Set((existingMissing || []).map(m => normalizeString(m.full_name)));

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

          let name = "";
          let age: number | null = null;
          let location = "Caracas";
          let gender = "Desconocido";
          let cedula: string | null = null;

          if (currentHospital.includes("Domingo Luciani")) {
            const parts = line.split(/[–-]/);
            if (parts.length >= 2) {
              name = parts[0].trim();
              const ageMatch = parts[1].match(/(\d+)/);
              if (ageMatch) age = parseInt(ageMatch[1]);
              if (parts[2]) {
                const locPart = parts[2].trim();
                location = locPart.replace(/\((H|F)\).*/, "").trim();
                if (locPart.includes("(H)")) gender = "Masculino";
                if (locPart.includes("(F)")) gender = "Femenino";
              }
            }
          } else if (currentHospital.includes("Pérez Carreño")) {
            const parts = line.split(/[--:]/);
            if (parts.length >= 1) {
              name = parts[0].trim();
              if (parts[1]) {
                const detail = parts[1].trim();
                if (detail.includes("años")) {
                  const ageMatch = detail.match(/(\d+)/);
                  if (ageMatch) age = parseInt(ageMatch[1]);
                } else if (detail.match(/[\d.]+/)) {
                  cedula = detail.replace(/[^\d]/g, "");
                }
              }
            }
          }

          if (!name || name.toLowerCase().includes("difundan") || name.toLowerCase().includes("pacientes ingresados")) {
            continue;
          }

          const dedupeKey = normalizeString(name) + "|" + normalizeString(currentHospital);
          if (seenNames.has(dedupeKey)) continue;
          seenNames.add(dedupeKey);

          const norm = normalizeString(name);
          const patientRecord = {
            full_name: name,
            cedula,
            age,
            hospital: currentHospital,
            location,
            gender,
            originalLine: line
          };

          if (affectedMap.has(norm) || missingMap.has(norm)) {
            hospitalizedReport.duplicates.push(patientRecord);
          } else {
            hospitalizedReport.toInsert.push(patientRecord);
          }
        }
      } else {
        // Asumir CSV
        const seenNames = new Set<string>();
        const { data: existingAffected } = await supabase.from("affected_people").select("full_name, reference_point");
        const affectedMap = new Set((existingAffected || []).map(a => normalizeString(a.full_name) + "|" + normalizeString(a.reference_point || "")));

        // Skip first 2 header rows of CSV
        const dataLines = lines.slice(2);
        for (const line of dataLines) {
          const cols = parseCsvLine(line);
          if (cols.length < 3) continue;

          const hospital = cols[1];
          const fullName = cols[2];
          const age = cols[3] || "";
          const cedula = cols[4] || "";
          const phone = cols[5] || "";
          const address = cols[6] || "";
          const observations = cols[7] || "";

          if (!fullName || fullName === "APELLIDOS Y NOMBRES") continue;

          const dedupeKey = normalizeString(fullName) + "|" + normalizeString(hospital);
          if (seenNames.has(dedupeKey)) continue;
          seenNames.add(dedupeKey);

          let parsedAge = parseInt(age) || null;
          if (parsedAge && parsedAge > 120) parsedAge = null;

          const patientRecord = {
            full_name: fullName,
            cedula: cedula || null,
            phone: phone || null,
            hospital,
            age: parsedAge,
            address,
            observations
          };

          const keyInDb = normalizeString(fullName) + "|" + normalizeString(hospital);
          if (affectedMap.has(keyInDb)) {
            hospitalizedReport.duplicates.push(patientRecord);
          } else {
            hospitalizedReport.toInsert.push(patientRecord);
          }
        }
      }
    }

    // 2. Procesar imágenes si se subieron
    if (images && images.length > 0 && images[0].name) {
      const { data: existingMissing } = await supabase.from("missing_people").select("full_name");
      const missingMap = new Set((existingMissing || []).map(m => normalizeString(m.full_name)));

      for (const img of images) {
        if (!img.name) continue;
        const mockName = `Persona por Identificar (${img.name.replace(/\.[^/.]+$/, "")})`;
        const norm = normalizeString(mockName);

        const imgRecord = {
          name: mockName,
          filename: img.name,
          size: img.size
        };

        if (missingMap.has(norm)) {
          missingReport.duplicates.push(imgRecord);
        } else {
          missingReport.toInsert.push(imgRecord);
        }
      }
    }

    return {
      success: true,
      hospitalized: hospitalizedReport,
      missing: missingReport
    };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Ejecuta una importación masiva de datos y sube imágenes (admin-only)
 */
export async function executeImport(formData: FormData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Acceso no autorizado." };

  try {
    const file = formData.get("file") as File | null;
    const images = formData.getAll("images") as File[];

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let insertedHospitalizedCount = 0;
    let insertedMissingCount = 0;

    // 1. Procesar Excel/CSV o archivo TXT
    if (file && file.size > 0) {
      const fileText = await file.text();
      const lines = fileText.split("\n").map(l => l.replace(/\r$/, "")).filter(l => l.trim());

      if (file.name.endsWith(".txt")) {
        let currentHospital = "Desconocido";
        const seenNames = new Set<string>();

        const { data: existingAffected } = await supabase.from("affected_people").select("id, full_name");
        const { data: existingMissing } = await supabase.from("missing_people").select("id, full_name");
        
        const affectedMap = new Map((existingAffected || []).map(a => [normalizeString(a.full_name), a.id]));
        const missingMap = new Map((existingMissing || []).map(m => [normalizeString(m.full_name), m.id]));

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

          let name = "";
          let age: number | null = null;
          let location = "Caracas";
          let gender = "Desconocido";
          let cedula: string | null = null;

          if (currentHospital.includes("Domingo Luciani")) {
            const parts = line.split(/[–-]/);
            if (parts.length >= 2) {
              name = parts[0].trim();
              const ageMatch = parts[1].match(/(\d+)/);
              if (ageMatch) age = parseInt(ageMatch[1]);
              if (parts[2]) {
                const locPart = parts[2].trim();
                location = locPart.replace(/\((H|F)\).*/, "").trim();
                if (locPart.includes("(H)")) gender = "Masculino";
                if (locPart.includes("(F)")) gender = "Femenino";
              }
            }
          } else if (currentHospital.includes("Pérez Carreño")) {
            const parts = line.split(/[--:]/);
            if (parts.length >= 1) {
              name = parts[0].trim();
              if (parts[1]) {
                const detail = parts[1].trim();
                if (detail.includes("años")) {
                  const ageMatch = detail.match(/(\d+)/);
                  if (ageMatch) age = parseInt(ageMatch[1]);
                } else if (detail.match(/[\d.]+/)) {
                  cedula = detail.replace(/[^\d]/g, "");
                }
              }
            }
          }

          if (!name || name.toLowerCase().includes("difundan") || name.toLowerCase().includes("pacientes ingresados")) {
            continue;
          }

          const dedupeKey = normalizeString(name) + "|" + normalizeString(currentHospital);
          if (seenNames.has(dedupeKey)) continue;
          seenNames.add(dedupeKey);

          const norm = normalizeString(name);
          const existingAffectedId = affectedMap.get(norm);
          const existingMissingId = missingMap.get(norm);

          if (existingAffectedId) {
            await supabase
              .from("affected_people")
              .update({
                status: "Hospitalizado",
                exact_address: `Hospitalizado en: ${currentHospital}`,
                is_public: true,
                situation_description: `[UPDATE IMPORT] Reportado hospitalizado en: ${currentHospital}.`
              })
              .eq("id", existingAffectedId);
          } else {
            await supabase.from("affected_people").insert({
              full_name: name,
              cedula,
              state: "Distrito Capital",
              city: "Caracas",
              exact_address: `Hospitalizado en: ${currentHospital}`,
              status: "Hospitalizado",
              situation_description: `Paciente ingresado tras el sismo. Importado de listados. Línea original: "${line}"`,
              registered_by_name: "Importador Automático",
              registered_by_phone: "0800-EMERGENCIA",
              consent: true,
              is_public: true,
            });
            insertedHospitalizedCount++;
          }

          if (existingMissingId) {
            await supabase
              .from("missing_people")
              .update({
                status: "hospitalized",
                last_seen_location: `Hospitalizado en: ${currentHospital}`,
                notes: `[UPDATE IMPORT] Localizado en hospital ${currentHospital}.`
              })
              .eq("id", existingMissingId);
          } else {
            await supabase.from("missing_people").insert({
              full_name: name,
              cedula,
              approximate_age: age,
              last_seen_location: `Hospitalizado en: ${currentHospital}`,
              status: "hospitalized",
              reporter_name: "Importador Automático",
              reporter_phone: "0800-EMERGENCIA",
              notes: `[IMPORTADO] Paciente ingresado tras el sismo.`,
            });
          }
        }
      } else {
        // CSV
        const seenNames = new Set<string>();
        const { data: existingAffected } = await supabase.from("affected_people").select("full_name, reference_point");
        const affectedMap = new Set((existingAffected || []).map(a => normalizeString(a.full_name) + "|" + normalizeString(a.reference_point || "")));

        const dataLines = lines.slice(2);
        const recordsToInsert = [];

        for (const line of dataLines) {
          const cols = parseCsvLine(line);
          if (cols.length < 3) continue;

          const hospital = cols[1];
          const fullName = cols[2];
          const age = cols[3] || "";
          const cedula = cols[4] || "";
          const phone = cols[5] || "";
          const address = cols[6] || "";
          const observations = cols[7] || "";

          if (!fullName || fullName === "APELLIDOS Y NOMBRES") continue;

          const dedupeKey = normalizeString(fullName) + "|" + normalizeString(hospital);
          if (seenNames.has(dedupeKey)) continue;
          seenNames.add(dedupeKey);

          const keyInDb = normalizeString(fullName) + "|" + normalizeString(hospital);
          if (affectedMap.has(keyInDb)) continue; // Omitir duplicados

          let parsedAge = parseInt(age) || null;
          if (parsedAge && parsedAge > 120) parsedAge = null;

          recordsToInsert.push({
            full_name: fullName,
            cedula: cedula || null,
            phone: phone || null,
            state: hospital.includes("Catia") ? "Distrito Capital" : hospital.includes("Luciani") ? "Miranda" : "Distrito Capital",
            city: hospital.includes("Luciani") ? "Caracas (El Llanito)" : "Caracas",
            exact_address: address || null,
            reference_point: hospital,
            status: observations.toLowerCase().includes("fallecid") ? "Fallecido" : "Hospitalizado",
            situation_description: observations || `Paciente ingresado en ${hospital}`,
            registered_by_name: "Importador Consolidado Hospitales",
            registered_by_phone: "Sistema",
            consent: true,
            is_public: true,
          });
        }

        if (recordsToInsert.length > 0) {
          const BATCH_SIZE = 50;
          for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
            const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from("affected_people").insert(batch);
            if (!error) insertedHospitalizedCount += batch.length;
          }
        }
      }

      await logAuditEvent("Importar Excel", "affected_people", undefined, { count: insertedHospitalizedCount, filename: file.name });
    }

    // 2. Procesar imágenes si se subieron
    if (images && images.length > 0 && images[0].name) {
      const { data: existingMissing } = await supabase.from("missing_people").select("full_name");
      const missingMap = new Set((existingMissing || []).map(m => normalizeString(m.full_name)));

      for (const img of images) {
        if (!img.name || img.size === 0) continue;
        const mockName = `Persona por Identificar (${img.name.replace(/\.[^/.]+$/, "")})`;
        
        if (missingMap.has(normalizeString(mockName))) continue; // Skip duplicates

        const arrayBuffer = await img.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        const ext = img.name.split(".").pop() || "jpeg";
        const fileName = `missing-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const filePath = `uploads/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("photos")
          .upload(filePath, fileBuffer, {
            contentType: `image/${ext === "png" ? "png" : "jpeg"}`,
            cacheControl: "3600",
            upsert: false,
          });

        let publicPhotoUrl = "";
        if (uploadError) {
          publicPhotoUrl = `https://placeholder.supabase.co/storage/v1/object/public/photos/uploads/${fileName}`;
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from("photos")
            .getPublicUrl(filePath);
          publicPhotoUrl = publicUrl;
        }

        const { data: insertedMissing, error: missingError } = await supabase
          .from("missing_people")
          .insert({
            full_name: mockName,
            photo_url: publicPhotoUrl,
            last_seen_location: "Zona afectada (Pendiente de verificar del cartel)",
            physical_description: "Información visual contenida en el cartel adjunto.",
            clothes_description: "Ver cartel adjunto.",
            reporter_name: "Importador Automático Lote 2",
            reporter_phone: "0412-5550000",
            notes: `[IMPORTADO] Registro importado de cartel de WhatsApp: ${img.name}.`,
            status: "missing",
          })
          .select("id")
          .single();

        if (!missingError && insertedMissing) {
          insertedMissingCount++;
        }
      }

      await logAuditEvent("Importar imágenes", "missing_people", undefined, { count: insertedMissingCount });
    }

    revalidatePath("/buscar");
    revalidatePath("/hospitalizados");
    revalidatePath("/desaparecidos");
    revalidatePath("/");

    return {
      success: true,
      hospitalizedCount: insertedHospitalizedCount,
      missingCount: insertedMissingCount
    };
  } catch (err: any) {
    return { error: err.message };
  }
}

