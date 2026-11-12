import * as Astronomy from 'astronomy-engine';
import {
  CHANDRA_AVASTHAS,
  CHANDRA_KRIYAS,
  CHANDRA_VELAS,
  CHALDEAN_HORA_ORDER,
  DEBILITATION_SIGN,
  DREKKANA_NATURES,
  EXALTATION_SIGN,
  getCombustionOrbDeg,
  GULIKODAYA_DAY_GHATIS,
  GULIKODAYA_NIGHT_GHATIS,
  KP_249_TABLE,
  MOOLATRIKONA,
  NAKSHATRAS,
  NINE_GRAHAS,
  OWN_SIGNS,
  PERMANENT_FRIENDSHIP,
  PLANET_SHORT,
  SIGNS,
  VIMSHOTTARI_ORDER,
  VIMSHOTTARI_YEARS,
  WEEKDAY_LORDS,
  WEEKDAY_NAMES,
} from './constants';
import {
  angularDiffDeg,
  formatDms,
  formatUtcInTimeZone,
  localDateTimeToUtc,
  normalizeDeg,
} from './time';
import type {
  AyanamsaId,
  CastHoraryChart,
  DignityState,
  HoraryQueryInput,
  HouseCusp,
  HouseSystem,
  Kp249Slot,
  NineGrahaId,
  NodeMode,
  HoraSlot,
  LunarMicroStateInfo,
  PanchangaInfo,
  PlanetPosition,
  SevenPlanetId,
  SpecialPointValue,
} from './types';

export type { NineGrahaId };
export type AllBodyId = NineGrahaId;

const J2000_AYANAMSA_MEAN: Record<Exclude<AyanamsaId, 'tropical' | 'true_chitra'>, number> = {
  lahiri: 23 + 51 / 60 + 25.5324 / 3600,
  kp: 23 + 45 / 60 + 14.3 / 3600,
  raman: 22 + 26 / 60 + 58.3 / 3600,
  fagan_bradley: 24 + 44 / 60 + 11.6 / 3600,
};

const SPICA_RA_J2000_DEG = (13 + 25 / 60 + 11.579 / 3600) * 15;
const SPICA_DEC_J2000_DEG = -(11 + 9 / 60 + 40.75 / 3600);
const SPICA_PM_RA_DEG_PER_YR = -42.35 / 3_600_000;
const SPICA_PM_DEC_DEG_PER_YR = -30.67 / 3_600_000;

function computeTrueChitraAyanamsa(time: Astronomy.AstroTime): number {
  const years = time.tt / 365.25;
  const ra = (SPICA_RA_J2000_DEG + years * SPICA_PM_RA_DEG_PER_YR) * Astronomy.DEG2RAD;
  const dec = (SPICA_DEC_J2000_DEG + years * SPICA_PM_DEC_DEG_PER_YR) * Astronomy.DEG2RAD;
  const eqj = new Astronomy.Vector(
    Math.cos(dec) * Math.cos(ra),
    Math.cos(dec) * Math.sin(ra),
    Math.sin(dec),
    time
  );
  const ect = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(time), eqj);
  const spicaLon = normalizeDeg(Math.atan2(ect.y, ect.x) * Astronomy.RAD2DEG);
  return normalizeDeg(spicaLon - 180);
}

export function computeAyanamsaDeg(time: Astronomy.AstroTime, ayanamsa: AyanamsaId): number {
  if (ayanamsa === 'tropical') return 0;
  if (ayanamsa === 'true_chitra') return computeTrueChitraAyanamsa(time);
  const T = time.tt / 36525.0;
  const precessionDeg = (5029.0966 * T + 1.11113 * T * T - 0.000006 * T * T * T) / 3600.0;
  const dpsiDeg = Astronomy.e_tilt(time).dpsi / 3600.0;
  return J2000_AYANAMSA_MEAN[ayanamsa] + precessionDeg + dpsiDeg;
}

function getTrueNodeTropical(time: Astronomy.AstroTime): number {
  const st = Astronomy.GeoMoonState(time);
  const h = new Astronomy.Vector(
    st.y * st.vz - st.z * st.vy,
    st.z * st.vx - st.x * st.vz,
    st.x * st.vy - st.y * st.vx,
    time
  );
  const hect = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(time), h);
  return normalizeDeg(Math.atan2(hect.x, -hect.y) * Astronomy.RAD2DEG);
}

function getMeanNodeTropical(time: Astronomy.AstroTime): number {
  const T = time.tt / 36525.0;
  const node =
    125.0445479 -
    1934.1362891 * T +
    0.0020754 * T * T +
    (T * T * T) / 467441.0 -
    (T * T * T * T) / 60616000.0;
  return normalizeDeg(node);
}

const BODY_MAP: Partial<Record<NineGrahaId, Astronomy.Body>> = {
  Sun: Astronomy.Body.Sun,
  Moon: Astronomy.Body.Moon,
  Mercury: Astronomy.Body.Mercury,
  Venus: Astronomy.Body.Venus,
  Mars: Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturn: Astronomy.Body.Saturn,
};

export function getTropicalPosition(
  id: NineGrahaId,
  time: Astronomy.AstroTime,
  nodeMode: NodeMode
): { lon: number; lat: number } {
  if (id === 'Sun') {
    const sun = Astronomy.SunPosition(time);
    return { lon: normalizeDeg(sun.elon), lat: sun.elat };
  }
  if (id === 'Moon') {
    const moon = Astronomy.EclipticGeoMoon(time);
    return { lon: normalizeDeg(moon.lon), lat: moon.lat };
  }
  if (id === 'Rahu') {
    const lon = nodeMode === 'true' ? getTrueNodeTropical(time) : getMeanNodeTropical(time);
    return { lon, lat: 0 };
  }
  if (id === 'Ketu') {
    const rahu = nodeMode === 'true' ? getTrueNodeTropical(time) : getMeanNodeTropical(time);
    return { lon: normalizeDeg(rahu + 180), lat: 0 };
  }
  const body = BODY_MAP[id]!;
  const vec = Astronomy.GeoVector(body, time, true);
  const ecl = Astronomy.Ecliptic(vec);
  return { lon: normalizeDeg(ecl.elon), lat: ecl.elat };
}

export function getTropicalSpeedDegPerDay(
  id: NineGrahaId,
  time: Astronomy.AstroTime,
  nodeMode: NodeMode
): number {
  const dt = id === 'Moon' ? 0.02 : 0.05;
  const p1 = getTropicalPosition(id, time.AddDays(-dt), nodeMode).lon;
  const p2 = getTropicalPosition(id, time.AddDays(dt), nodeMode).lon;
  let diff = p2 - p1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff / (2 * dt);
}

export function ascFromRamcTropical(ramcDeg: number, latitudeDeg: number, obliquityDeg: number): number {
  const th = ramcDeg * Astronomy.DEG2RAD;
  const eps = obliquityDeg * Astronomy.DEG2RAD;
  const safeLat = Math.max(-89.9, Math.min(89.9, latitudeDeg));
  const phi = safeLat * Astronomy.DEG2RAD;
  const ascY = Math.cos(th);
  const ascX = -(Math.sin(th) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));
  return normalizeDeg(Math.atan2(ascY, ascX) * Astronomy.RAD2DEG);
}

export function mcFromRamcTropical(ramcDeg: number, obliquityDeg: number): number {
  const th = ramcDeg * Astronomy.DEG2RAD;
  const eps = obliquityDeg * Astronomy.DEG2RAD;
  return normalizeDeg(Math.atan2(Math.sin(th), Math.cos(th) * Math.cos(eps)) * Astronomy.RAD2DEG);
}

export function solveRamcForAscendant(
  targetAscTropDeg: number,
  latitudeDeg: number,
  obliquityDeg: number
): number {
  const signedDiff = (ramc: number) => {
    let d = normalizeDeg(ascFromRamcTropical(ramc, latitudeDeg, obliquityDeg) - targetAscTropDeg);
    if (d > 180) d -= 360;
    return d;
  };

  let bestLo = 0;
  let bestHi = 2;
  let found = false;
  let prevVal = signedDiff(0);
  for (let deg = 2; deg <= 360; deg += 2) {
    const val = signedDiff(deg);
    if (Math.abs(prevVal) < 90 && Math.abs(val) < 90 && ((prevVal <= 0 && val >= 0) || (prevVal >= 0 && val <= 0))) {
      bestLo = deg - 2;
      bestHi = deg;
      found = true;
      break;
    }
    prevVal = val;
  }

  if (!found) return normalizeDeg(targetAscTropDeg - 90);

  let lo = bestLo;
  let hi = bestHi;
  let fLo = signedDiff(lo);
  for (let i = 0; i < 42; i++) {
    const mid = (lo + hi) / 2;
    const fMid = signedDiff(mid);
    if (Math.abs(fMid) < 1e-10) return normalizeDeg(mid);
    if ((fLo <= 0 && fMid <= 0) || (fLo >= 0 && fMid >= 0)) {
      lo = mid;
      fLo = fMid;
    } else {
      hi = mid;
    }
  }
  return normalizeDeg((lo + hi) / 2);
}

export function computePlacidusCuspsTropical(
  ramcDeg: number,
  latitudeDeg: number,
  obliquityDeg: number
): number[] {
  const eps = obliquityDeg * Astronomy.DEG2RAD;
  const safeLat = Math.max(-65, Math.min(65, latitudeDeg));
  const phi = safeLat * Astronomy.DEG2RAD;

  const raToLon = (raDeg: number) => {
    const r = raDeg * Astronomy.DEG2RAD;
    return normalizeDeg(Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(eps)) * Astronomy.RAD2DEG);
  };

  const placidus = (offset: number, factor: number) => {
    let x = ramcDeg + offset;
    for (let i = 0; i < 24; i++) {
      const lam = raToLon(x) * Astronomy.DEG2RAD;
      const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
      const sinAd = Math.max(-0.999, Math.min(0.999, Math.tan(phi) * Math.tan(dec)));
      const ad = Math.asin(sinAd) * Astronomy.RAD2DEG;
      x = ramcDeg + offset + factor * ad;
    }
    return raToLon(x);
  };

  const c10 = raToLon(ramcDeg);
  const c11 = placidus(30, 1 / 3);
  const c12 = placidus(60, 2 / 3);
  const c1 = ascFromRamcTropical(ramcDeg, latitudeDeg, obliquityDeg);
  const c2 = placidus(120, 2 / 3);
  const c3 = placidus(150, 1 / 3);

  return [
    c1,
    c2,
    c3,
    normalizeDeg(c10 + 180),
    normalizeDeg(c11 + 180),
    normalizeDeg(c12 + 180),
    normalizeDeg(c1 + 180),
    normalizeDeg(c2 + 180),
    normalizeDeg(c3 + 180),
    c10,
    c11,
    c12,
  ];
}

export function computeKpSubAndSsl(siderealLon: number): {
  nakshatraIndex: number;
  nakshatraName: string;
  pada: number;
  starLord: NineGrahaId;
  subLord: NineGrahaId;
  subSubLord: NineGrahaId;
} {
  const lon = normalizeDeg(siderealLon);
  const nakSpan = 360 / 27;
  const nakIndex = Math.floor(lon / nakSpan) % 27;
  const nakOffset = lon - nakIndex * nakSpan;
  const pada = (Math.floor(nakOffset / (nakSpan / 4)) % 4) + 1;
  const starLord = NAKSHATRAS[nakIndex].lord;
  const startIdx = VIMSHOTTARI_ORDER.indexOf(starLord);

  let acc = 0;
  let subLord: NineGrahaId = starLord;
  let subSubLord: NineGrahaId = starLord;

  for (let i = 0; i < 9; i++) {
    const candidateSub = VIMSHOTTARI_ORDER[(startIdx + i) % 9];
    const subSpan = (VIMSHOTTARI_YEARS[candidateSub] / 120) * nakSpan;
    if (nakOffset < acc + subSpan + 1e-10) {
      subLord = candidateSub;
      const subOffset = Math.max(0, nakOffset - acc);
      const sslStartIdx = VIMSHOTTARI_ORDER.indexOf(subLord);
      let sAcc = 0;
      for (let j = 0; j < 9; j++) {
        const candidateSsl = VIMSHOTTARI_ORDER[(sslStartIdx + j) % 9];
        const sslSpan = (VIMSHOTTARI_YEARS[candidateSsl] / 120) * subSpan;
        sAcc += sslSpan;
        if (subOffset < sAcc + 1e-10) {
          subSubLord = candidateSsl;
          break;
        }
      }
      break;
    }
    acc += subSpan;
  }

  return {
    nakshatraIndex: nakIndex,
    nakshatraName: NAKSHATRAS[nakIndex].name,
    pada,
    starLord,
    subLord,
    subSubLord,
  };
}

export function computeVargasForLongitude(siderealLon: number): {
  signIndex: number;
  navamsaSignIndex: number;
  drekkanaIndex: 1 | 2 | 3;
  drekkanaSignIndex: number;
  dashamsaSignIndex: number;
  dwadasamsaSignIndex: number;
  isVargottama: boolean;
} {
  const lon = normalizeDeg(siderealLon);
  const signIndex = Math.floor(lon / 30) % 12;
  const degInSign = lon % 30;
  const navamsaSignIndex = Math.floor(lon / (30 / 9)) % 12;
  const drekZero = Math.min(2, Math.floor(degInSign / 10));
  const drekkanaIndex = (drekZero + 1) as 1 | 2 | 3;
  const drekkanaSignIndex = (signIndex + drekZero * 4) % 12;

  const dasPart = Math.min(9, Math.floor(degInSign / 3));
  const oddSign = SIGNS[signIndex].odd;
  const dashamsaSignIndex = oddSign ? (signIndex + dasPart) % 12 : (signIndex + 8 + dasPart) % 12;

  const dwaPart = Math.min(11, Math.floor(degInSign / 2.5));
  const dwadasamsaSignIndex = (signIndex + dwaPart) % 12;

  return {
    signIndex,
    navamsaSignIndex,
    drekkanaIndex,
    drekkanaSignIndex,
    dashamsaSignIndex,
    dwadasamsaSignIndex,
    isVargottama: signIndex === navamsaSignIndex,
  };
}

export function computeHouseNumberFromCusps(lon: number, cusps: HouseCusp[]): number {
  const norm = normalizeDeg(lon);
  for (let i = 0; i < 12; i++) {
    const start = cusps[i].start;
    const end = cusps[(i + 1) % 12].start;
    const span = normalizeDeg(end - start);
    const offset = normalizeDeg(norm - start);
    if (offset < span + 1e-9) return cusps[i].house;
  }
  return 1;
}

function circularMidpoint(a: number, b: number): number {
  let diff = normalizeDeg(b - a);
  if (diff > 180) diff -= 360;
  return normalizeDeg(a + diff / 2);
}

export function buildCusps(
  system: HouseSystem,
  ascSidereal: number,
  mcSidereal: number,
  placidusCuspsSid: number[]
): HouseCusp[] {
  const ascSign = Math.floor(normalizeDeg(ascSidereal) / 30) % 12;

  if (system === 'placidus') {
    return placidusCuspsSid.map((start, idx) => {
      const signIndex = Math.floor(normalizeDeg(start) / 30) % 12;
      return {
        house: idx + 1,
        start: normalizeDeg(start),
        midpoint: normalizeDeg(start),
        signIndex,
        signName: SIGNS[signIndex].name,
        dms: `${SIGNS[signIndex].short} ${formatDms(normalizeDeg(start) % 30)}`,
        lord: SIGNS[signIndex].lord,
      };
    });
  }

  if (system === 'whole_sign') {
    return Array.from({ length: 12 }, (_, idx) => {
      const signIndex = (ascSign + idx) % 12;
      const start = signIndex * 30;
      return {
        house: idx + 1,
        start,
        midpoint: start + 15,
        signIndex,
        signName: SIGNS[signIndex].name,
        dms: `${SIGNS[signIndex].short} 00°00'00"`,
        lord: SIGNS[signIndex].lord,
      };
    });
  }

  if (system === 'equal') {
    return Array.from({ length: 12 }, (_, idx) => {
      const start = normalizeDeg(ascSidereal + idx * 30);
      const signIndex = Math.floor(start / 30) % 12;
      return {
        house: idx + 1,
        start,
        midpoint: normalizeDeg(start + 15),
        signIndex,
        signName: SIGNS[signIndex].name,
        dms: `${SIGNS[signIndex].short} ${formatDms(start % 30)}`,
        lord: SIGNS[signIndex].lord,
      };
    });
  }

  // Sripati Bhava Chalit
  const mids = new Array<number>(12).fill(0);
  const ic = normalizeDeg(mcSidereal + 180);
  const dsc = normalizeDeg(ascSidereal + 180);
  mids[0] = ascSidereal;
  mids[3] = ic;
  mids[6] = dsc;
  mids[9] = mcSidereal;
  const q1 = normalizeDeg(ic - ascSidereal);
  mids[1] = normalizeDeg(ascSidereal + q1 / 3);
  mids[2] = normalizeDeg(ascSidereal + (2 * q1) / 3);
  const q2 = normalizeDeg(dsc - ic);
  mids[4] = normalizeDeg(ic + q2 / 3);
  mids[5] = normalizeDeg(ic + (2 * q2) / 3);
  mids[7] = normalizeDeg(mids[1] + 180);
  mids[8] = normalizeDeg(mids[2] + 180);
  mids[10] = normalizeDeg(mids[4] + 180);
  mids[11] = normalizeDeg(mids[5] + 180);

  return mids.map((mid, idx) => {
    const start = circularMidpoint(mids[(idx + 11) % 12], mid);
    const signIndex = Math.floor(normalizeDeg(mid) / 30) % 12;
    return {
      house: idx + 1,
      start,
      midpoint: normalizeDeg(mid),
      signIndex,
      signName: SIGNS[signIndex].name,
      dms: `${SIGNS[signIndex].short} ${formatDms(normalizeDeg(mid) % 30)}`,
      lord: SIGNS[signIndex].lord,
    };
  });
}

function evaluateDignity(
  planetId: NineGrahaId,
  signIndex: number,
  degInSign: number,
  houseByPlanet: Map<NineGrahaId, number>
): DignityState {
  if (planetId === 'Rahu' || planetId === 'Ketu') {
    const own = planetId === 'Rahu' ? [10, 2] : [7, 11];
    const ex = planetId === 'Rahu' ? 1 : 7;
    const deb = planetId === 'Rahu' ? 7 : 1;
    if (signIndex === ex) return 'Exalted';
    if (signIndex === deb) return 'Debilitated';
    if (own.includes(signIndex)) return 'Own Sign';
    return 'Neutral';
  }

  if (EXALTATION_SIGN[planetId] === signIndex) return 'Exalted';
  if (DEBILITATION_SIGN[planetId] === signIndex) return 'Debilitated';
  const [mSign, mMin, mMax] = MOOLATRIKONA[planetId];
  if (signIndex === mSign && degInSign >= mMin && degInSign <= mMax) return 'Moolatrikona';
  if (OWN_SIGNS[planetId].includes(signIndex)) return 'Own Sign';

  const lord = SIGNS[signIndex].lord;
  const pHouse = houseByPlanet.get(planetId) ?? 1;
  const lHouse = houseByPlanet.get(lord) ?? 1;
  const diff = ((lHouse - pHouse + 12) % 12) + 1;
  const tempFriend = [2, 3, 4, 10, 11, 12].includes(diff);

  const perm = PERMANENT_FRIENDSHIP[planetId];
  const permScore = perm.friends.includes(lord) ? 1 : perm.enemies.includes(lord) ? -1 : 0;
  const total = permScore + (tempFriend ? 1 : -1);

  if (total >= 2) return 'Great Friend';
  if (total === 1) return 'Friend';
  if (total === 0) return 'Neutral';
  if (total === -1) return 'Enemy';
  return 'Great Enemy';
}

const TITHI_NAMES = [
  'Pratipada',
  'Dwitiya',
  'Tritiya',
  'Chaturthi',
  'Panchami',
  'Shashthi',
  'Saptami',
  'Ashtami',
  'Navami',
  'Dashami',
  'Ekadashi',
  'Dwadashi',
  'Trayodashi',
  'Chaturdashi',
  'Purnima',
  'Pratipada',
  'Dwitiya',
  'Tritiya',
  'Chaturthi',
  'Panchami',
  'Shashthi',
  'Saptami',
  'Ashtami',
  'Navami',
  'Dashami',
  'Ekadashi',
  'Dwadashi',
  'Trayodashi',
  'Chaturdashi',
  'Amavasya',
];

const YOGA_NAMES = [
  'Vishkambha',
  'Priti',
  'Ayushman',
  'Saubhagya',
  'Shobhana',
  'Atiganda',
  'Sukarma',
  'Dhriti',
  'Shula',
  'Ganda',
  'Vriddhi',
  'Dhruva',
  'Vyaghata',
  'Harshana',
  'Vajra',
  'Siddhi',
  'Vyatipata',
  'Variyana',
  'Parigha',
  'Shiva',
  'Siddha',
  'Sadhya',
  'Shubha',
  'Shukla',
  'Brahma',
  'Indra',
  'Vaidhriti',
];

const MOVABLE_KARANAS = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja', 'Vanija', 'Vishti (Bhadra)'];

function getKaranaInfo(halfTithiIdx: number): { name: string; fixed: boolean } {
  // 0..59 half-tithis (6° each): 0 = Kimstughna; 1..56 cycle Bava..Vishti; 57=Shakuni, 58=Chatushpada, 59=Naga
  if (halfTithiIdx === 0) return { name: 'Kimstughna', fixed: true };
  if (halfTithiIdx === 57) return { name: 'Shakuni', fixed: true };
  if (halfTithiIdx === 58) return { name: 'Chatushpada', fixed: true };
  if (halfTithiIdx === 59) return { name: 'Naga', fixed: true };
  return { name: MOVABLE_KARANAS[(halfTithiIdx - 1) % 7], fixed: false };
}

function getLocalWeekday(utcMs: number, timeZone: string): number {
  try {
    const wd = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(new Date(utcMs));
    const idx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].findIndex((d) => wd.startsWith(d));
    return idx >= 0 ? idx : new Date(utcMs).getUTCDay();
  } catch {
    return new Date(utcMs).getUTCDay();
  }
}

export function computeHoraryChart(input: HoraryQueryInput): CastHoraryChart {
  const { utcMs, offsetMinutes } = localDateTimeToUtc(
    input.localDate,
    input.localTime,
    input.timeZone,
    input.longitude
  );
  const time = new Astronomy.AstroTime(new Date(utcMs));
  const ayanamsaDeg = computeAyanamsaDeg(time, input.ayanamsa);
  const kpAyanamsaDeg = computeAyanamsaDeg(time, 'kp');
  const obliquityDeg = Astronomy.e_tilt(time).tobl;

  // Tropical planetary positions + speeds
  const tropMap = new Map<NineGrahaId, { lon: number; lat: number; speed: number }>();
  for (const id of NINE_GRAHAS) {
    const pos = getTropicalPosition(id, time, input.nodeMode);
    const speed = getTropicalSpeedDegPerDay(id, time, input.nodeMode);
    tropMap.set(id, { ...pos, speed });
  }

  // Natural Time Ascendant / RAMC
  const gmstHours = Astronomy.SiderealTime(time);
  const lmstHours = ((gmstHours + input.longitude / 15) % 24 + 24) % 24;
  const naturalRamc = lmstHours * 15;
  const naturalAscTrop = ascFromRamcTropical(naturalRamc, input.latitude, obliquityDeg);
  const naturalAscSid = normalizeDeg(naturalAscTrop - ayanamsaDeg);

  // Determine active Ascendant & RAMC based on castingMode
  let ascendantSidereal = naturalAscSid;
  let activeRamc = naturalRamc;
  let activeKpSlot: Kp249Slot | null = null;
  let effectiveAyanForHouses = ayanamsaDeg;
  let prashna108Info: CastHoraryChart['prashna108Info'] = undefined;

  if (input.castingMode === 'number_108') {
    const num108 = Math.max(1, Math.min(108, Math.round(input.prashna108Number ?? 78)));
    const signsElapsed = Math.floor((num108 - 1) / 9) % 12;
    const navamsaNumber = ((num108 - 1) % 9) + 1;
    const navamsaSignIndex = navamsaNumber - 1;
    const degInsideSign = (navamsaNumber - 1) * (30 / 9) + 30 / 18;
    ascendantSidereal = normalizeDeg(signsElapsed * 30 + degInsideSign);
    const targetAscTrop = normalizeDeg(ascendantSidereal + ayanamsaDeg);
    activeRamc = solveRamcForAscendant(targetAscTrop, input.latitude, obliquityDeg);
    prashna108Info = {
      number: num108,
      signsElapsed,
      lagnaSignIndex: signsElapsed,
      lagnaSignName: SIGNS[signsElapsed].name,
      navamsaNumber,
      navamsaSignIndex,
      navamsaSignName: SIGNS[navamsaSignIndex].name,
    };
  } else if (input.castingMode === 'kp_horary') {
    const num = Math.max(1, Math.min(249, Math.round(input.kpNumber || 1)));
    activeKpSlot = KP_249_TABLE[num - 1];
    ascendantSidereal = activeKpSlot.startDeg;
    const targetAscTrop = normalizeDeg(ascendantSidereal + kpAyanamsaDeg);
    activeRamc = solveRamcForAscendant(targetAscTrop, input.latitude, obliquityDeg);
    effectiveAyanForHouses = kpAyanamsaDeg;
  } else if (input.castingMode === 'arudha_override') {
    const arudhaSign = ((Math.round(input.arudhaSignIndex) % 12) + 12) % 12;
    const natDegInSign = naturalAscSid % 30;
    ascendantSidereal = arudhaSign * 30 + natDegInSign;
    const targetAscTrop = normalizeDeg(ascendantSidereal + ayanamsaDeg);
    activeRamc = solveRamcForAscendant(targetAscTrop, input.latitude, obliquityDeg);
  }

  const baseAscSignIdx = Math.floor(normalizeDeg(ascendantSidereal) / 30) % 12;
  const baseAscendantDms = `${SIGNS[baseAscSignIdx].short} ${formatDms(normalizeDeg(ascendantSidereal) % 30)}`;
  let rotatedReference: CastHoraryChart['rotatedReference'] = {
    isRotated: false,
    planet: null,
    reason: 'Question #1 uses the primary chart Ascendant (Lagna).',
    baseAscendantDms,
    kpLonDeg: null,
  };

  const sunSidLon = normalizeDeg(tropMap.get('Sun')!.lon - ayanamsaDeg);

  // Third-party rotation (e.g. "Will my son get a job?" -> rotate House 1 to 5th house)
  const thirdPartyHouse = input.askingAboutHouse ?? 1;
  if (
    thirdPartyHouse > 1 &&
    (input.queryIndexInSession === 1 || input.multiQuestionMode === 'independent')
  ) {
    const personMap: Record<number, string> = {
      3: 'Sibling / Younger Relative (House 3)',
      4: 'Mother / Home Matter (House 4)',
      5: 'Son / Daughter (House 5)',
      7: 'Spouse / Partner (House 7)',
      9: 'Father / Guru / Elder (House 9)',
      10: 'Boss / Organization (House 10)',
    };
    const rotDeg = normalizeDeg(ascendantSidereal + (thirdPartyHouse - 1) * 30);
    const kpRotLon = normalizeDeg(rotDeg + effectiveAyanForHouses - kpAyanamsaDeg);
    ascendantSidereal = rotDeg;
    const rotTargetTrop = normalizeDeg(ascendantSidereal + effectiveAyanForHouses);
    activeRamc = solveRamcForAscendant(rotTargetTrop, input.latitude, obliquityDeg);
    rotatedReference = {
      isRotated: true,
      planet: null,
      reason: `Chart rotated to ${personMap[thirdPartyHouse] ?? `House ${thirdPartyHouse}`} -> ${SIGNS[Math.floor(ascendantSidereal / 30) % 12].name} becomes House 1 for this person.`,
      baseAscendantDms,
      kpLonDeg: kpRotLon,
    };
  }

  if (input.queryIndexInSession > 1 && input.multiQuestionMode !== 'independent') {
    let rotPlanet: SevenPlanetId = 'Moon';
    if (input.queryIndexInSession === 2) {
      rotPlanet = 'Moon';
    } else if (input.queryIndexInSession === 3) {
      rotPlanet = 'Sun';
    } else if (input.queryIndexInSession === 4) {
      rotPlanet = 'Jupiter';
    } else if (input.queryIndexInSession === 5) {
      const baseHouseMap = new Map<NineGrahaId, number>();
      for (const id of NINE_GRAHAS) {
        const sLon = normalizeDeg(tropMap.get(id)!.lon - ayanamsaDeg);
        const sIdx = Math.floor(sLon / 30) % 12;
        baseHouseMap.set(id, ((sIdx - baseAscSignIdx + 12) % 12) + 1);
      }
      const dignityWeight: Record<DignityState, number> = {
        Exalted: 9,
        Moolatrikona: 8,
        'Own Sign': 7,
        'Great Friend': 6,
        Friend: 5,
        Neutral: 4,
        Enemy: 3,
        'Great Enemy': 2,
        Debilitated: 1,
      };
      const scoreCand = (cand: 'Mercury' | 'Venus') => {
        const raw = tropMap.get(cand)!;
        const sLon = normalizeDeg(raw.lon - ayanamsaDeg);
        const sIdx = Math.floor(sLon / 30) % 12;
        const dig = evaluateDignity(cand, sIdx, sLon % 30, baseHouseMap);
        const h = baseHouseMap.get(cand) ?? 1;
        const orb = getCombustionOrbDeg(cand, input.settings);
        const combust = orb !== null && angularDiffDeg(sLon, sunSidLon) <= orb;
        return (
          dignityWeight[dig] * 10 +
          ([1, 4, 7, 10, 5, 9].includes(h) ? 4 : 0) +
          (raw.speed >= 0 ? 2 : 0) +
          (!combust ? 5 : 0)
        );
      };
      rotPlanet = scoreCand('Venus') > scoreCand('Mercury') ? 'Venus' : 'Mercury';
    }

    const rotRawLon = tropMap.get(rotPlanet)!.lon;
    const rotatedKpLon = normalizeDeg(rotRawLon - kpAyanamsaDeg);
    ascendantSidereal = normalizeDeg(rotRawLon - effectiveAyanForHouses);
    const rotTargetTrop = normalizeDeg(ascendantSidereal + effectiveAyanForHouses);
    activeRamc = solveRamcForAscendant(rotTargetTrop, input.latitude, obliquityDeg);
    rotatedReference = {
      isRotated: true,
      planet: rotPlanet,
      reason: `Question #${input.queryIndexInSession}: House 1 shifted to ${rotPlanet} (${SIGNS[Math.floor(ascendantSidereal / 30) % 12].name}).`,
      baseAscendantDms,
      kpLonDeg: rotatedKpLon,
    };
  }

  const mcSidereal = normalizeDeg(
    mcFromRamcTropical(activeRamc, obliquityDeg) - effectiveAyanForHouses
  );
  const placidusTrop = computePlacidusCuspsTropical(activeRamc, input.latitude, obliquityDeg);
  const placidusSid = placidusTrop.map((c) => normalizeDeg(c - effectiveAyanForHouses));
  if (rotatedReference.isRotated) {
    placidusSid[0] = ascendantSidereal;
  } else if (input.castingMode === 'kp_horary' && activeKpSlot) {
    placidusSid[0] = activeKpSlot.startDeg;
  }

  const activeHouseSystem = input.castingMode === 'kp_horary' ? 'placidus' : input.houseSystem;
  const cusps = buildCusps(activeHouseSystem, ascendantSidereal, mcSidereal, placidusSid);

  const ascSignIdx = Math.floor(normalizeDeg(ascendantSidereal) / 30) % 12;
  const ascVargas = computeVargasForLongitude(ascendantSidereal);
  const ascKp = computeKpSubAndSsl(ascendantSidereal);
  const naturalAscSignIdx = Math.floor(normalizeDeg(naturalAscSid) / 30) % 12;
  const naturalAscKp = computeKpSubAndSsl(naturalAscSid);

  // Build planet positions
  const wholeSignHouseMap = new Map<NineGrahaId, number>();
  for (const id of NINE_GRAHAS) {
    const sidLon = normalizeDeg(tropMap.get(id)!.lon - ayanamsaDeg);
    const sIdx = Math.floor(sidLon / 30) % 12;
    wholeSignHouseMap.set(id, ((sIdx - ascSignIdx + 12) % 12) + 1);
  }

  const planets: PlanetPosition[] = NINE_GRAHAS.map((id) => {
    const raw = tropMap.get(id)!;
    const lon = normalizeDeg(raw.lon - ayanamsaDeg);
    const vargas = computeVargasForLongitude(lon);
    const kpSub = computeKpSubAndSsl(lon);
    const degInSign = lon % 30;
    const isRetrograde = id === 'Rahu' || id === 'Ketu' ? true : raw.speed < 0;

    let isCombust = false;
    let combustOrbDeg: number | undefined;
    if (id !== 'Sun' && id !== 'Moon' && id !== 'Rahu' && id !== 'Ketu') {
      const orb = getCombustionOrbDeg(id as SevenPlanetId, input.settings);
      const diff = angularDiffDeg(lon, sunSidLon);
      if (orb !== null && diff <= orb) {
        isCombust = true;
        combustOrbDeg = diff;
      }
    }

    return {
      id,
      short: PLANET_SHORT[id],
      longitude: lon,
      tropicalLongitude: raw.lon,
      latitude: raw.lat,
      speedDegPerDay: raw.speed,
      isRetrograde,
      isCombust,
      combustOrbDeg,
      signIndex: vargas.signIndex,
      signName: SIGNS[vargas.signIndex].name,
      degInSign,
      dmsInSign: formatDms(degInSign),
      houseWholeSign: wholeSignHouseMap.get(id)!,
      houseBhava: computeHouseNumberFromCusps(lon, cusps),
      nakshatraIndex: kpSub.nakshatraIndex,
      nakshatraName: kpSub.nakshatraName,
      pada: kpSub.pada,
      starLord: kpSub.starLord,
      subLord: kpSub.subLord,
      subSubLord: kpSub.subSubLord,
      dignity: evaluateDignity(id, vargas.signIndex, degInSign, wholeSignHouseMap),
      navamsaSignIndex: vargas.navamsaSignIndex,
      drekkanaIndex: vargas.drekkanaIndex,
      drekkanaSignIndex: vargas.drekkanaSignIndex,
      dashamsaSignIndex: vargas.dashamsaSignIndex,
      dwadasamsaSignIndex: vargas.dwadasamsaSignIndex,
      isVargottama: vargas.isVargottama,
    };
  });

  // Sunrise, Sunset, Hora, Gulika, Panchanga, Eclipse, Sankranti
  const observer = new Astronomy.Observer(input.latitude, input.longitude, 0);
  const searchBack = new Astronomy.AstroTime(new Date(utcMs - 36 * 3600_000));
  const rises: number[] = [];
  const sets: number[] = [];
  let rCursor = searchBack;
  for (let i = 0; i < 3; i++) {
    const r = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, rCursor, 2);
    if (!r) break;
    rises.push(r.date.getTime());
    rCursor = r.AddDays(0.1);
  }
  let sCursor = searchBack;
  for (let i = 0; i < 3; i++) {
    const s = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, sCursor, 2);
    if (!s) break;
    sets.push(s.date.getTime());
    sCursor = s.AddDays(0.1);
  }

  let sunriseMs = rises.filter((t) => t <= utcMs).pop() ?? utcMs - 6 * 3600_000;
  let nextSunriseMs = rises.find((t) => t > utcMs) ?? sunriseMs + 24 * 3600_000;
  let sunsetMs = sets.find((t) => t > sunriseMs && t < nextSunriseMs) ?? sunriseMs + 12 * 3600_000;
  const isDaytime = utcMs >= sunriseMs && utcMs < sunsetMs;

  const vedicWeekdayIndex = getLocalWeekday(sunriseMs, input.timeZone);
  const vedicWeekdayName = WEEKDAY_NAMES[vedicWeekdayIndex];
  const dayLord = WEEKDAY_LORDS[vedicWeekdayIndex];

  // Hora (24 planetary hours starting at sunrise with day lord)
  const dayStartIdx = CHALDEAN_HORA_ORDER.indexOf(dayLord);
  let horaOffset = 0;
  if (isDaytime) {
    const horaDur = Math.max(1, (sunsetMs - sunriseMs) / 12);
    horaOffset = Math.min(11, Math.floor((utcMs - sunriseMs) / horaDur));
  } else {
    const horaDur = Math.max(1, (nextSunriseMs - sunsetMs) / 12);
    horaOffset = 12 + Math.min(11, Math.floor((utcMs - sunsetMs) / horaDur));
  }
  const horaNumber = horaOffset + 1;
  const horaLord = CHALDEAN_HORA_ORDER[(dayStartIdx + horaOffset) % 7];
  const dayHoraDur = Math.max(1, (sunsetMs - sunriseMs) / 12);
  const nightHoraDur = Math.max(1, (nextSunriseMs - sunsetMs) / 12);
  const horaSchedule: HoraSlot[] = Array.from({ length: 24 }, (_, idx) => {
    const isDaySlot = idx < 12;
    const slotInHalf = isDaySlot ? idx : idx - 12;
    const baseMs = isDaySlot ? sunriseMs : sunsetMs;
    const durMs = isDaySlot ? dayHoraDur : nightHoraDur;
    const startUtcMs = baseMs + slotInHalf * durMs;
    const endUtcMs = baseMs + (slotInHalf + 1) * durMs;
    return {
      horaNumber: idx + 1,
      period: isDaySlot ? 'Day' : 'Night',
      lord: CHALDEAN_HORA_ORDER[(dayStartIdx + idx) % 7],
      startUtcMs,
      endUtcMs,
      startLocal: formatUtcInTimeZone(startUtcMs, input.timeZone),
      endLocal: formatUtcInTimeZone(endUtcMs, input.timeZone),
      isActive: idx + 1 === horaNumber,
    };
  });

  // Gulika & Mandi (Prasna Marga diurnal & nocturnal 30-ghati scale)
  const gulikaStartGhati = isDaytime
    ? GULIKODAYA_DAY_GHATIS[vedicWeekdayIndex]
    : GULIKODAYA_NIGHT_GHATIS[vedicWeekdayIndex];
  const gulikaMs = isDaytime
    ? sunriseMs + (gulikaStartGhati / 30) * (sunsetMs - sunriseMs)
    : sunsetMs + (gulikaStartGhati / 30) * (nextSunriseMs - sunsetMs);

  const gulikaTime = new Astronomy.AstroTime(new Date(gulikaMs));
  const gulikaGmst = Astronomy.SiderealTime(gulikaTime);
  const gulikaRamc = ((gulikaGmst + input.longitude / 15) % 24 + 24) % 24 * 15;
  const gulikaLon = normalizeDeg(
    ascFromRamcTropical(gulikaRamc, input.latitude, Astronomy.e_tilt(gulikaTime).tobl) -
      computeAyanamsaDeg(gulikaTime, input.ayanamsa)
  );
  // Mandi (mid-segment of Saturn's 1/8th division convention)
  const saturnPartEndGhati = gulikaStartGhati + 3.75;
  const mandiMs = isDaytime
    ? sunriseMs + (saturnPartEndGhati / 30) * (sunsetMs - sunriseMs)
    : sunsetMs + (saturnPartEndGhati / 30) * (nextSunriseMs - sunsetMs);
  const mandiTime = new Astronomy.AstroTime(new Date(mandiMs));
  const mandiRamc =
    (((Astronomy.SiderealTime(mandiTime) + input.longitude / 15) % 24 + 24) % 24) * 15;
  const mandiLon = normalizeDeg(
    ascFromRamcTropical(mandiRamc, input.latitude, Astronomy.e_tilt(mandiTime).tobl) -
      computeAyanamsaDeg(mandiTime, input.ayanamsa)
  );

  // Tithi, Karana, Yoga, Moon Nakshatra
  const moonSidLon = normalizeDeg(tropMap.get('Moon')!.lon - ayanamsaDeg);
  const sunMoonDiff = normalizeDeg(moonSidLon - sunSidLon);
  const tithiNumber = Math.floor(sunMoonDiff / 12) + 1;
  const halfTithiIdx = Math.floor(sunMoonDiff / 6) % 60;
  const karana = getKaranaInfo(halfTithiIdx);
  const yogaSum = normalizeDeg(sunSidLon + moonSidLon);
  const yogaNumber = Math.floor(yogaSum / (360 / 27)) + 1;
  const moonKp = computeKpSubAndSsl(moonSidLon);

  // Eclipse check (±3 days)
  let solarEclipseDaysDiff: number | null = null;
  let lunarEclipseDaysDiff: number | null = null;
  try {
    const sEc = Astronomy.SearchGlobalSolarEclipse(time.AddDays(-3.2));
    const sDiff = (sEc.peak.date.getTime() - utcMs) / 86400_000;
    if (Math.abs(sDiff) <= 3.0) solarEclipseDaysDiff = sDiff;
  } catch {
    solarEclipseDaysDiff = null;
  }
  try {
    const lEc = Astronomy.SearchLunarEclipse(time.AddDays(-3.2));
    const lDiff = (lEc.peak.date.getTime() - utcMs) / 86400_000;
    if (Math.abs(lDiff) <= 3.0) lunarEclipseDaysDiff = lDiff;
  } catch {
    lunarEclipseDaysDiff = null;
  }

  // Sankranti check (±16 ghatis = ±0.2667 days ≈ ±0.27° around 0° sign ingress)
  const sunDegInSign = sunSidLon % 30;
  const sunSpeed = Math.max(0.9, Math.abs(tropMap.get('Sun')!.speed));
  const degThreshold = sunSpeed * (16 / 60);
  const isNearSankranti = sunDegInSign <= degThreshold || 30 - sunDegInSign <= degThreshold;

  // Kerala Sphutas & Upagrahas (Prasna Marga & Prasna Tantra)
  const rahuSidLon = normalizeDeg(tropMap.get('Rahu')!.lon - ayanamsaDeg);
  const marsSidLon = planets.find((p) => p.id === 'Mars')!.longitude;
  const jupSidLon = planets.find((p) => p.id === 'Jupiter')!.longitude;
  const venSidLon = planets.find((p) => p.id === 'Venus')!.longitude;

  const makePoint = (name: string, rawLon: number, formula: string, source: string): SpecialPointValue => {
    const longitude = normalizeDeg(rawLon);
    const signIndex = Math.floor(longitude / 30) % 12;
    return {
      name,
      longitude,
      signIndex,
      signName: SIGNS[signIndex].name,
      dmsInSign: formatDms(longitude % 30),
      houseWholeSign: ((signIndex - ascSignIdx + 12) % 12) + 1,
      formula,
      source,
    };
  };

  const thrisphutaLon = normalizeDeg(ascendantSidereal + moonSidLon + gulikaLon);
  const chatusphutaLon = normalizeDeg(thrisphutaLon + sunSidLon);
  const panchasphutaLon = normalizeDeg(chatusphutaLon + rahuSidLon);

  const sphutas: SpecialPointValue[] = [
    makePoint('Thrisphuta', thrisphutaLon, 'Lagna + Moon + Gulika', 'Prasna Marga L4180-5832'),
    makePoint('Chatusphuta', chatusphutaLon, 'Thrisphuta + Sun', 'Prasna Marga L4180-5832'),
    makePoint('Panchasphuta', panchasphutaLon, 'Chatusphuta + Rahu', 'Prasna Marga L4180-5832'),
    makePoint('Pranasphuta', 5 * ascendantSidereal + gulikaLon, '5 × Lagna + Gulika', 'Prasna Marga L4180-5832'),
    makePoint('Dehasphuta', 8 * moonSidLon + gulikaLon, '8 × Moon + Gulika', 'Prasna Marga L4180-5832'),
    makePoint('Mrityusphuta', 7 * gulikaLon + sunSidLon, '7 × Gulika + Sun', 'Prasna Marga L4180-5832'),
    makePoint('Beeja Sphuta', sunSidLon + venSidLon + jupSidLon, 'Sun + Venus + Jupiter', 'Prasna Tantra Ch II H5'),
    makePoint('Kshetra Sphuta', moonSidLon + marsSidLon + jupSidLon, 'Moon + Mars + Jupiter', 'Prasna Tantra Ch II H5'),
  ];

  // Pancha Dosha Upagrahas (Prasna Marga L11604-11907)
  const dhuma = normalizeDeg(sunSidLon + 133 + 1 / 3);
  const vyatipata = normalizeDeg(360 - dhuma);
  const parivesha = normalizeDeg(180 + vyatipata);
  const indrachapa = normalizeDeg(360 - parivesha);
  const upaketu = normalizeDeg(indrachapa + 16 + 2 / 3); // Prasna Marga L11604-11907 notes Indrachapa + 17° (compute both cleanly, display standard 17° note)
  const kethuUpagraha = normalizeDeg(indrachapa + 17);

  const upagrahas: SpecialPointValue[] = [
    makePoint('Dhuma', sunSidLon + 133, 'Sun + 133°', 'Prasna Marga L11604-11907'),
    makePoint('Vyatipata', 360 - normalizeDeg(sunSidLon + 133), '360° - Dhuma', 'Prasna Marga L11604-11907'),
    makePoint('Parivesha', 180 + normalizeDeg(360 - normalizeDeg(sunSidLon + 133)), '180° + Vyatipata', 'Prasna Marga L11604-11907'),
    makePoint('Indrachapa', 360 - normalizeDeg(180 + normalizeDeg(360 - normalizeDeg(sunSidLon + 133))), '360° - Parivesha', 'Prasna Marga L11604-11907'),
    makePoint('Kethu (Upaketu)', kethuUpagraha, 'Indrachapa + 17°', 'Prasna Marga L11604-11907'),
  ];
  void upaketu;

  const queryPriorities: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: 'Query #1 -> Lagna (Primary Ascendant)',
    2: 'Query #2 -> Moon',
    3: 'Query #3 -> Sun',
    4: 'Query #4 -> Jupiter',
    5: 'Query #5 -> Stronger of Mercury / Venus',
  };

  const nakSpanDeg = 360 / 27;
  const degInMoonNak = ((moonSidLon % nakSpanDeg) + nakSpanDeg) % nakSpanDeg;
  const moonNakArcMin = Math.min(799.9999, Math.max(0, degInMoonNak * 60));
  const chandraKriyaIndex = Math.min(60, Math.floor((moonNakArcMin * 60) / 800) + 1);
  const chandraVelaIndex = Math.min(36, Math.floor((moonNakArcMin * 36) / 800) + 1);
  const chandraAvasthaIndex = Math.min(12, Math.floor((moonNakArcMin * 12) / 800) + 1);
  const ascDrekkanaIndex = Math.min(3, Math.floor((ascendantSidereal % 30) / 10) + 1);
  const lunarMicroStates: LunarMicroStateInfo = {
    moonNakArcMin: Number(moonNakArcMin.toFixed(2)),
    chandraKriyaIndex,
    chandraKriyaLabel: CHANDRA_KRIYAS[chandraKriyaIndex - 1],
    chandraVelaIndex,
    chandraVelaLabel: CHANDRA_VELAS[chandraVelaIndex - 1],
    chandraAvasthaIndex,
    chandraAvasthaLabel: CHANDRA_AVASTHAS[chandraAvasthaIndex - 1],
    ascDrekkanaIndex,
    ascDrekkanaNature: DREKKANA_NATURES[ascSignIdx][ascDrekkanaIndex - 1],
  };

  const panchanga: PanchangaInfo = {
    utcMs,
    offsetMinutes,
    localDisplay: formatUtcInTimeZone(utcMs, input.timeZone),
    sunriseLocal: formatUtcInTimeZone(sunriseMs, input.timeZone),
    sunsetLocal: formatUtcInTimeZone(sunsetMs, input.timeZone),
    sunriseUtcMs: sunriseMs,
    sunsetUtcMs: sunsetMs,
    isDaytime,
    vedicWeekdayIndex,
    vedicWeekdayName,
    dayLord,
    horaNumber,
    horaLord,
    tithiNumber,
    tithiName: TITHI_NAMES[tithiNumber - 1],
    paksha: tithiNumber <= 15 ? 'Shukla' : 'Krishna',
    karanaName: karana.name,
    karanaFixed: karana.fixed,
    yogaNumber,
    yogaName: YOGA_NAMES[yogaNumber - 1],
    moonNakshatraIndex: moonKp.nakshatraIndex,
    moonNakshatraName: moonKp.nakshatraName,
    moonNakshatraPada: moonKp.pada,
    solarEclipseDaysDiff,
    lunarEclipseDaysDiff,
    isNearSankranti,
    sunDegInSign,
    horaSchedule,
    lunarMicroStates,
  };

  return {
    input,
    utcMs,
    offsetMinutes,
    ayanamsaDeg,
    kpAyanamsaDeg,
    ascendantSidereal,
    ascendantSignIndex: ascSignIdx,
    ascendantSignName: SIGNS[ascSignIdx].name,
    ascendantDms: `${SIGNS[ascSignIdx].short} ${formatDms(ascendantSidereal % 30)}`,
    ascendantNakIndex: ascKp.nakshatraIndex,
    ascendantStarLord: ascKp.starLord,
    ascendantSubLord: ascKp.subLord,
    isAscVargottama: ascVargas.isVargottama,
    mcSidereal,
    activeKpSlot,
    cusps,
    planets,
    gulikaLon,
    mandiLon,
    gulikaStartGhati,
    sphutas,
    upagrahas,
    panchanga,
    effectiveQuerySignificator: queryPriorities[input.queryIndexInSession],
    naturalAscendantSidereal: naturalAscSid,
    naturalAscendantSignIndex: naturalAscSignIdx,
    naturalAscendantSignLord: SIGNS[naturalAscSignIdx].lord,
    naturalAscendantStarLord: naturalAscKp.starLord,
    naturalAscendantSubLord: naturalAscKp.subLord,
    rotatedReference,
    prashna108Info,
  };
}
