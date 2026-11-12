export function normalizeDeg(deg: number): number {
  const m = deg % 360;
  return m < 0 ? m + 360 : m;
}

export function angularDiffDeg(a: number, b: number): number {
  let d = Math.abs(normalizeDeg(a) - normalizeDeg(b));
  if (d > 180) d = 360 - d;
  return d;
}

export function formatDms(deg: number, includeSeconds = true): string {
  const norm = normalizeDeg(deg);
  let d = Math.floor(norm);
  const remMin = (norm - d) * 60;
  let m = Math.floor(remMin);
  let s = Math.round((remMin - m) * 60);
  if (s >= 60) {
    s -= 60;
    m += 1;
  }
  if (m >= 60) {
    m -= 60;
    d += 1;
  }
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return includeSeconds ? `${dd}°${mm}'${ss}"` : `${dd}°${mm}'`;
}

export function formatOffsetString(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(Math.round(offsetMinutes));
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
}

function makeUtcMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number
): number {
  const d = new Date(0);
  d.setUTCFullYear(year, month - 1, day);
  d.setUTCHours(hour, minute, second, 0);
  return d.getTime();
}

function getZoneWallClockMs(utcMs: number, timeZone: string): number | null {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const parts = fmt.formatToParts(new Date(utcMs));
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== 'literal') {
        map[p.type] = parseInt(p.value, 10);
      }
    }
    if (map.hour === 24) map.hour = 0;
    return makeUtcMs(map.year, map.month, map.day, map.hour, map.minute, map.second);
  } catch {
    return null;
  }
}

export function localDateTimeToUtc(
  localDate: string,
  localTime: string,
  timeZone: string,
  fallbackLonDeg = 77.209
): { utcMs: number; offsetMinutes: number } {
  const [yStr, mStr, dStr] = localDate.split('-');
  const [hhStr = '12', mmStr = '0', ssStr = '0'] = localTime.split(':');

  const y = parseInt(yStr, 10) || 2026;
  const mo = parseInt(mStr, 10) || 1;
  const da = parseInt(dStr, 10) || 1;
  const hh = parseInt(hhStr, 10) || 0;
  const mm = parseInt(mmStr, 10) || 0;
  const ss = parseInt(ssStr, 10) || 0;

  const targetWallMs = makeUtcMs(y, mo, da, hh, mm, ss);

  // Support explicit "+05:30" or "-04:00" strings cleanly
  const offsetMatch = timeZone.trim().match(/^([+-])(\d{1,2}):?(\d{2})$/);
  if (offsetMatch) {
    const sign = offsetMatch[1] === '-' ? -1 : 1;
    const offMin = sign * (parseInt(offsetMatch[2], 10) * 60 + parseInt(offsetMatch[3], 10));
    return {
      utcMs: targetWallMs - offMin * 60_000,
      offsetMinutes: offMin,
    };
  }

  let guessUtc = targetWallMs;
  for (let i = 0; i < 4; i++) {
    const zoned = getZoneWallClockMs(guessUtc, timeZone);
    if (zoned === null) {
      const approxMin = Math.round((fallbackLonDeg / 15) * 2) * 30;
      return {
        utcMs: targetWallMs - approxMin * 60_000,
        offsetMinutes: approxMin,
      };
    }
    const diff = targetWallMs - zoned;
    if (diff === 0) break;
    guessUtc += diff;
  }

  const finalZoned = getZoneWallClockMs(guessUtc, timeZone);
  const offsetMinutes =
    finalZoned !== null ? Math.round((finalZoned - guessUtc) / 60_000) : 0;

  return { utcMs: guessUtc, offsetMinutes };
}

export function formatUtcInTimeZone(utcMs: number, timeZone: string): string {
  try {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    return fmt.format(new Date(utcMs));
  } catch {
    return new Date(utcMs).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  }
}

export function getNowLocalParts(timeZone: string): {
  localDate: string;
  localTime: string;
} {
  const now = new Date();
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const parts = fmt.formatToParts(now);
    const map: Record<string, string> = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = p.value;
    }
    const hour = map.hour === '24' ? '00' : map.hour;
    return {
      localDate: `${map.year}-${map.month}-${map.day}`,
      localTime: `${hour}:${map.minute}:${map.second}`,
    };
  } catch {
    const iso = now.toISOString();
    return {
      localDate: iso.slice(0, 10),
      localTime: iso.slice(11, 19),
    };
  }
}
