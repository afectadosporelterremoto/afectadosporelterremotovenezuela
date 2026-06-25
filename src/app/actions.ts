"use server";

import { createClient, createAdminClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
}) {
  // 1. Validar honeypot
  if (data.websiteHoneypot) {
    return { success: true, message: "Simulación exitosa (spam bloqueado)" };
  }

  // 2. Validaciones básicas en servidor
  if (!data.fullName.trim() || !data.state || !data.city || !data.status || !data.registeredByName.trim() || !data.registeredByPhone.trim() || !data.consent) {
    return { error: "Por favor complete todos los campos obligatorios y acepte el aviso de privacidad." };
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
}) {
  if (data.websiteHoneypot) {
    return { success: true };
  }

  if (!data.fullName.trim() || !data.lastSeenLocation.trim() || !data.reporterName.trim() || !data.reporterPhone.trim()) {
    return { error: "Por favor complete los campos requeridos (nombre, última ubicación conocida y datos de contacto)." };
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
}) {
  if (data.websiteHoneypot) {
    return { success: true };
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
