/**
 * Utilidades de fecha y hora para enmarcar la zona horaria de Venezuela (America/Caracas).
 */

export function formatVenezuelaDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return "N/D";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/D";

  const formatter = new Intl.DateTimeFormat("es-VE", {
    timeZone: "America/Caracas",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  try {
    const parts = formatter.formatToParts(d);
    const partMap = parts.reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {} as Record<string, string>);

    const day = partMap.day;
    const month = partMap.month;
    const year = partMap.year;
    const hour = partMap.hour;
    const minute = partMap.minute;
    let dayPeriod = partMap.dayPeriod || "";

    dayPeriod = dayPeriod.toLowerCase().trim();
    if (dayPeriod.includes("a") || dayPeriod.includes("am")) {
      dayPeriod = "a.m.";
    } else if (dayPeriod.includes("p") || dayPeriod.includes("pm")) {
      dayPeriod = "p.m.";
    } else {
      dayPeriod = d.getHours() < 12 ? "a.m." : "p.m.";
    }

    return `${day}/${month}/${year}, ${hour}:${minute} ${dayPeriod} (hora Venezuela)`;
  } catch (err) {
    // Fallback simple si falla Intl
    return d.toLocaleString("es-VE", { timeZone: "America/Caracas" }) + " (hora Venezuela)";
  }
}
