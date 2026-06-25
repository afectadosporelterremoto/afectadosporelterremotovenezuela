/**
 * Utilidades para normalizar textos y nombres para comparación de duplicados y búsquedas.
 */

export function normalizeString(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos / diacríticos
    .replace(/[^a-z0-9\s]/g, "") // Quitar caracteres especiales
    .replace(/\s+/g, " ") // Espacios múltiples a espacio simple
    .trim();
}

export function getWordTokens(name: string): string[] {
  const normalized = normalizeString(name);
  if (!normalized) return [];
  return normalized.split(" ").filter((word) => word.length > 2); // Palabras de más de 2 letras
}

export function cleanCedula(cedula: string | null | undefined): string {
  if (!cedula) return "";
  return cedula.replace(/[^0-9VEveJjGg]/g, "").toUpperCase();
}

export function cleanPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/[^0-9]/g, "");
}
