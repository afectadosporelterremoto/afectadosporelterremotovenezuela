"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { normalizeString, cleanCedula, cleanPhone, getWordTokens } from "@/utils/normalize";

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
      console.warn("No se pudo obtener el balance oficial (es posible que la tabla no exista aún):", error.message);
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
}) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Acceso no autorizado." };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("official_balance")
      .insert({
        ...data,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      });

    if (error) return { error: error.message };

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

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("deceased_people")
      .insert({
        ...data,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      });

    if (error) return { error: error.message };

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

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("deceased_people")
      .update({
        ...data,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) return { error: error.message };

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

    revalidatePath("/fallecidos");
    revalidatePath("/admin/fallecidos");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
