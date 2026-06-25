/**
 * Utilidades para enmascarar datos sensibles de personas registradas
 * y proteger su privacidad de accesos públicos indeseados.
 */

/**
 * Enmascara la cédula de identidad venezolana.
 * Ejemplo: "V-12345678" -> "V-12.XXX.678"
 * Ejemplo: "12345678" -> "12.XXX.678"
 */
export function maskCedula(cedula: string | null | undefined): string {
  if (!cedula) return "No registrada";
  
  // Limpiar caracteres no alfanuméricos
  const clean = cedula.replace(/[\s.-]/g, "").toUpperCase();
  
  let type = "V";
  let numStr = clean;
  
  if (clean.startsWith("V") || clean.startsWith("E") || clean.startsWith("J") || clean.startsWith("G")) {
    type = clean[0];
    numStr = clean.slice(1);
  }
  
  if (numStr.length < 5) {
    return `${type}-${numStr.replace(/./g, "X")}`;
  }
  
  // Enmascarar dígitos del medio
  const prefix = numStr.slice(0, 2);
  const suffix = numStr.slice(-3);
  
  return `${type}-${prefix}.XXX.${suffix}`;
}

/**
 * Enmascara un número de teléfono.
 * Ejemplo: "04141234567" -> "0414-XXX-4567"
 * Ejemplo: "+584121234567" -> "+58-XXX-XXX-4567"
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "No registrado";
  
  // Limpiar caracteres
  const clean = phone.replace(/[\s()-]/g, "");
  
  if (clean.length < 7) {
    return phone.replace(/./g, "X");
  }
  
  if (clean.startsWith("+")) {
    // Caso internacional ej. +584121234567
    const countryCode = clean.slice(0, 3); // +58
    const rest = clean.slice(3);
    if (rest.length >= 7) {
      const area = rest.slice(0, 3); // 412
      const suffix = rest.slice(-4); // 4567
      return `${countryCode}-${area}-XXX-${suffix}`;
    }
  }
  
  // Caso local venezuela ej. 04141234567
  const area = clean.slice(0, 4); // 0414
  const suffix = clean.slice(-4); // 4567
  return `${area}-XXX-${suffix}`;
}

/**
 * Retorna un texto de protección para la dirección exacta.
 */
export function maskAddress(address: string | null | undefined, isAdmin: boolean = false): string {
  if (!address) return "No especificada";
  if (isAdmin) return address;
  return "Oculta por motivos de seguridad y privacidad.";
}
