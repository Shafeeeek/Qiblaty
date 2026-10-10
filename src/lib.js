import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from "adhan";

export const CITIES = [
  {
    id: "cairo",
    name: "القاهرة",
    country: "مصر",
    latitude: 30.0444,
    longitude: 31.2357,
    timezone: "Africa/Cairo",
  },
  {
    id: "alexandria",
    name: "الإسكندرية",
    country: "مصر",
    latitude: 31.2001,
    longitude: 29.9187,
    timezone: "Africa/Cairo",
  },
  {
    id: "makkah",
    name: "مكة المكرمة",
    country: "السعودية",
    latitude: 21.3891,
    longitude: 39.8579,
    timezone: "Asia/Riyadh",
  },
  {
    id: "madinah",
    name: "المدينة المنورة",
    country: "السعودية",
    latitude: 24.4672,
    longitude: 39.6024,
    timezone: "Asia/Riyadh",
  },
  {
    id: "riyadh",
    name: "الرياض",
    country: "السعودية",
    latitude: 24.7136,
    longitude: 46.6753,
    timezone: "Asia/Riyadh",
  },
  {
    id: "dubai",
    name: "دبي",
    country: "الإمارات",
    latitude: 25.2048,
    longitude: 55.2708,
    timezone: "Asia/Dubai",
  },
  {
    id: "doha",
    name: "الدوحة",
    country: "قطر",
    latitude: 25.2854,
    longitude: 51.531,
    timezone: "Asia/Qatar",
  },
  {
    id: "amman",
    name: "عمّان",
    country: "الأردن",
    latitude: 31.9539,
    longitude: 35.9106,
    timezone: "Asia/Amman",
  },
  {
    id: "istanbul",
    name: "إسطنبول",
    country: "تركيا",
    latitude: 41.0082,
    longitude: 28.9784,
    timezone: "Europe/Istanbul",
  },
  {
    id: "london",
    name: "لندن",
    country: "المملكة المتحدة",
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: "Europe/London",
  },
  {
    id: "newyork",
    name: "نيويورك",
    country: "الولايات المتحدة",
    latitude: 40.7128,
    longitude: -74.006,
    timezone: "America/New_York",
  },
  {
    id: "jakarta",
    name: "جاكرتا",
    country: "إندونيسيا",
    latitude: -6.2088,
    longitude: 106.8456,
    timezone: "Asia/Jakarta",
  },
];
export const METHODS = {
  Egyptian: "الهيئة المصرية للمساحة",
  MuslimWorldLeague: "رابطة العالم الإسلامي",
  UmmAlQura: "جامعة أم القرى",
  NorthAmerica: "أمريكا الشمالية (ISNA)",
};
export const PRAYERS = [
  { id: "fajr", name: "الفجر", english: "FAJR", icon: "sunrise" },
  { id: "sunrise", name: "الشروق", english: "SUNRISE", icon: "sun" },
  { id: "dhuhr", name: "الظهر", english: "DHUHR", icon: "sun" },
  { id: "asr", name: "العصر", english: "ASR", icon: "cloudSun" },
  { id: "maghrib", name: "المغرب", english: "MAGHRIB", icon: "sunset" },
  { id: "isha", name: "العشاء", english: "ISHA", icon: "moon" },
];
export const WORSHIP_PRAYERS = PRAYERS.filter((p) => p.id !== "sunrise");
export const EMPTY_LOG = {
  prayers: [],
  morning: false,
  evening: false,
  pages: 0,
};
export const number = (n) => new Intl.NumberFormat("ar-EG").format(n);
export function dateKey(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return ["year", "month", "day"]
    .map((type) => parts.find((p) => p.type === type).value)
    .join("-");
}
export function shiftDay(key, amount) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function scheduleFor(
  key,
  location,
  method = "Egyptian",
  madhab = "shafi",
) {
  const [y, m, d] = key.split("-").map(Number);
  const parameters = CalculationMethod[method]();
  parameters.madhab = madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  const times = new PrayerTimes(
    new Coordinates(location.latitude, location.longitude),
    new Date(y, m - 1, d),
    parameters,
  );
  return PRAYERS.map((prayer) => ({ ...prayer, date: times[prayer.id] }));
}
export function nextPrayer(now, today, tomorrow) {
  return [...today, ...tomorrow].find(
    (p) =>
      p.id !== "sunrise" && Number.isFinite(p.date.getTime()) && p.date > now,
  );
}
export function timeParts(date, timezone) {
  if (!date || !Number.isFinite(date.getTime()))
    return { time: "—", period: "" };
  const parts = new Intl.DateTimeFormat("ar-EG", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  return {
    time: parts
      .filter((p) => p.type !== "dayPeriod")
      .map((p) => p.value)
      .join("")
      .trim(),
    period: parts.find((p) => p.type === "dayPeriod")?.value,
  };
}
export function countdown(date, now) {
  const seconds = Math.max(0, Math.floor((date - now) / 1000));
  return [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ].map((n) => String(n).padStart(2, "0"));
}
export function qiblaFrom({ latitude, longitude }) {
  const rad = (n) => (n * Math.PI) / 180;
  const a = rad(latitude),
    b = rad(21.4225),
    delta = rad(39.8262 - longitude);
  const bearing =
    ((Math.atan2(
      Math.sin(delta) * Math.cos(b),
      Math.cos(a) * Math.sin(b) - Math.sin(a) * Math.cos(b) * Math.cos(delta),
    ) *
      180) /
      Math.PI +
      360) %
    360;
  const h =
    Math.sin((b - a) / 2) ** 2 +
    Math.cos(a) * Math.cos(b) * Math.sin(delta / 2) ** 2;
  return { bearing, distance: 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h))) };
}
export function validLocation(value) {
  if (
    !value ||
    typeof value.name !== "string" ||
    !Number.isFinite(value.latitude) ||
    !Number.isFinite(value.longitude) ||
    Math.abs(value.latitude) > 90 ||
    Math.abs(value.longitude) > 180
  )
    return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value.timezone });
    return typeof value.timezone === "string";
  } catch {
    return false;
  }
}
export function validLogs(value) {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.entries(value).every(
      ([key, log]) =>
        /^\d{4}-\d{2}-\d{2}$/.test(key) &&
        log &&
        Array.isArray(log.prayers) &&
        log.prayers.every((id) => WORSHIP_PRAYERS.some((p) => p.id === id)) &&
        Number.isInteger(log.pages) &&
        log.pages >= 0 &&
        typeof log.morning === "boolean" &&
        typeof log.evening === "boolean",
    )
  );
}
export function logScore(log = EMPTY_LOG) {
  return Math.round(
    (log.prayers.length / 5) * 70 +
      (Number(log.morning) + Number(log.evening)) * 10 +
      Math.min(log.pages / 5, 1) * 10,
  );
}
export function streakCount(logs, today) {
  let day = logs[today]?.prayers.length === 5 ? today : shiftDay(today, -1);
  let count = 0;
  while (logs[day]?.prayers.length === 5) {
    count++;
    day = shiftDay(day, -1);
  }
  return count;
}
