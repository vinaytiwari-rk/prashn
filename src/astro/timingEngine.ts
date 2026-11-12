import {
  NAKSHATRAS,
  VIMSHOTTARI_ORDER,
  VIMSHOTTARI_YEARS,
} from './constants';
import { formatUtcInTimeZone, normalizeDeg } from './time';
import type { CastHoraryChart, NineGrahaId } from './types';
import type { KpHoraryReport } from './kpHorary';
import type { TajikaReport } from './tajikaEngine';

export interface TimingWindowReport {
  hemisphereRate: {
    house: number;
    hemisphere: 'Visible (Houses 7–12 -> Fast / Days)' | 'Invisible (Houses 1–6 -> Late / Months)';
    summary: string;
  };
  kalapindaScale: {
    rulingPlanet: string;
    timeUnit: string;
    source: string;
  };
  tajikaOrbWindow: {
    activeYoga: string | null;
    orbGapDeg: number | null;
    estimatedDaysToExact: number | null;
    exactProjectedDate: string | null;
  };
  currentVimshottariDasha: {
    mahadasha: NineGrahaId;
    antardasha: NineGrahaId;
    pratyantardasha: NineGrahaId;
    mahaEndsLocal: string;
    antarEndsLocal: string;
  };
  upcomingPeriods: {
    mahadasha: NineGrahaId;
    antardasha: NineGrahaId;
    pratyantardasha: NineGrahaId;
    startLocal: string;
    endLocal: string;
    matchesCleanRp: boolean;
    signifiesFavourable: boolean;
    pratyHouses: number[];
  }[];
  kpTimingTrigger: string;
  pregnancyTimingNote?: {
    navamsasElapsedIn5L: number;
    daysEstimateByNavamsa: number;
    note: string;
  };
}

function getKalapindaUnit(planet: string): string {
  switch (planet) {
    case 'Sun':
    case 'Mars':
      return 'Days (Sun/Mars scale)';
    case 'Moon':
    case 'Venus':
      return 'Fortnights / 15-day cycles (Moon/Venus scale)';
    case 'Jupiter':
      return 'Months (Jupiter scale)';
    case 'Mercury':
      return 'Half-years / Seasons (Mercury scale)';
    case 'Saturn':
      return 'Years (Saturn scale)';
    default:
      return 'Months / Variable';
  }
}

export function evaluateTimingEngine(
  chart: CastHoraryChart,
  tajika: TajikaReport,
  kp: KpHoraryReport,
  primaryHouse: number
): TimingWindowReport {
  const karyeshaPos = chart.planets.find((p) => p.id === tajika.karyesha)!;
  const visible = karyeshaPos.houseWholeSign >= 7 && karyeshaPos.houseWholeSign <= 12;

  // Compute current Vimshottari Mahadasha / Antardasha / Pratyantardasha at query Moon longitude
  const moonLon = normalizeDeg(chart.planets.find((p) => p.id === 'Moon')!.longitude);
  const nakSpan = 360 / 27;
  const nakIdx = Math.floor(moonLon / nakSpan) % 27;
  const nakOffset = moonLon - nakIdx * nakSpan;
  const fracRemaining = 1 - nakOffset / nakSpan;

  const startLord = NAKSHATRAS[nakIdx].lord;
  const startYears = VIMSHOTTARI_YEARS[startLord];
  const yearsRemaining = fracRemaining * startYears;
  const yearsElapsedInFirstMaha = startYears - yearsRemaining;

  const MS_PER_YEAR = 365.24219 * 86400_000;
  // Find Antardasha inside current Mahadasha at t=0 of query
  const lordIdx = VIMSHOTTARI_ORDER.indexOf(startLord);
  let accAntarYears = 0;
  let antarLord: NineGrahaId = startLord;
  let antarDurationYears = 0;
  let elapsedInAntarYears = 0;

  for (let i = 0; i < 9; i++) {
    const cand = VIMSHOTTARI_ORDER[(lordIdx + i) % 9];
    const dur = (startYears * VIMSHOTTARI_YEARS[cand]) / 120;
    if (yearsElapsedInFirstMaha <= accAntarYears + dur + 1e-9) {
      antarLord = cand;
      antarDurationYears = dur;
      elapsedInAntarYears = yearsElapsedInFirstMaha - accAntarYears;
      break;
    }
    accAntarYears += dur;
  }

  const antarIdx = VIMSHOTTARI_ORDER.indexOf(antarLord);
  let accPratyYears = 0;
  let pratyLord: NineGrahaId = antarLord;
  let currentAntarStep = 0;
  let currentPratyStep = 0;
  for (let i = 0; i < 9; i++) {
    const cand = VIMSHOTTARI_ORDER[(lordIdx + i) % 9];
    if (cand === antarLord) {
      currentAntarStep = i;
      break;
    }
  }
  for (let j = 0; j < 9; j++) {
    const cand = VIMSHOTTARI_ORDER[(antarIdx + j) % 9];
    const dur = (antarDurationYears * VIMSHOTTARI_YEARS[cand]) / 120;
    if (elapsedInAntarYears <= accPratyYears + dur + 1e-9) {
      pratyLord = cand;
      currentPratyStep = j;
      break;
    }
    accPratyYears += dur;
  }

  // Generate 5 consecutive Pratyantardasha windows starting at current active period
  const upcomingPeriods: TimingWindowReport['upcomingPeriods'] = [];
  let cursorMs = chart.utcMs;
  let mIdx = lordIdx;
  let aStep = currentAntarStep;
  let pStep = currentPratyStep;
  const kpSignifyMap = new Map(kp.planets.map((pl) => [pl.planet, pl.signifiesHouses]));
  const favSet = new Set(kp.domainEvaluation.favourableHouses);
  const cleanRpSet = new Set(kp.cleanRulingPlanets);

  for (let w = 0; w < 5; w++) {
    const mLord = VIMSHOTTARI_ORDER[mIdx % 9];
    const mYears = VIMSHOTTARI_YEARS[mLord];
    const mRoot = VIMSHOTTARI_ORDER.indexOf(mLord);
    const aLord = VIMSHOTTARI_ORDER[(mRoot + aStep) % 9];
    const aYears = (mYears * VIMSHOTTARI_YEARS[aLord]) / 120;
    const aRoot = VIMSHOTTARI_ORDER.indexOf(aLord);
    const pLord = VIMSHOTTARI_ORDER[(aRoot + pStep) % 9];
    const pDurYears = (aYears * VIMSHOTTARI_YEARS[pLord]) / 120;

    let remMs = pDurYears * MS_PER_YEAR;
    if (w === 0) {
      const elapsedInPraty = Math.max(0, elapsedInAntarYears - accPratyYears);
      remMs = Math.max(60_000, (pDurYears - elapsedInPraty) * MS_PER_YEAR);
    }

    const windowEndMs = cursorMs + remMs;
    const pHouses = kpSignifyMap.get(pLord) ?? [];
    upcomingPeriods.push({
      mahadasha: mLord,
      antardasha: aLord,
      pratyantardasha: pLord,
      startLocal: formatUtcInTimeZone(cursorMs, chart.input.timeZone),
      endLocal: formatUtcInTimeZone(windowEndMs, chart.input.timeZone),
      matchesCleanRp: cleanRpSet.has(pLord),
      signifiesFavourable: pHouses.some((h) => favSet.has(h)),
      pratyHouses: pHouses,
    });

    cursorMs = windowEndMs;
    pStep += 1;
    if (pStep >= 9) {
      pStep = 0;
      aStep += 1;
      if (aStep >= 9) {
        aStep = 0;
        mIdx += 1;
      }
    }
  }

  const mahaEndsMs = chart.utcMs + yearsRemaining * MS_PER_YEAR;
  const antarEndsMs = chart.utcMs + (antarDurationYears - elapsedInAntarYears) * MS_PER_YEAR;

  // Tajika Applying Speed -> approximate days until exact aspect
  const ithasala = tajika.primaryYogas.find(
    (y) => y.type === 'Poorna Ithasala' || y.type === 'Ithasala (Applying)' || y.type === 'Kamboola (Moon Ithasala)'
  );
  let estimatedDaysToExact: number | null = null;
  let exactProjectedDate: string | null = null;
  if (ithasala && ithasala.planets.length >= 2) {
    const pFast = chart.planets.find((p) => p.id === ithasala.planets[0])!;
    const pSlow = chart.planets.find((p) => p.id === ithasala.planets[1])!;
    const relSpeed = Math.abs(pFast.speedDegPerDay - pSlow.speedDegPerDay);
    if (relSpeed > 0.01) {
      estimatedDaysToExact = ithasala.orbGapDeg / relSpeed;
      exactProjectedDate = formatUtcInTimeZone(
        chart.utcMs + estimatedDaysToExact * 86400_000,
        chart.input.timeZone
      );
    }
  }

  // Pregnancy Timing (Prasna Tantra Ch II H5: Navamsa = 3°20' -> 30 days)
  let pregnancyTimingNote: TimingWindowReport['pregnancyTimingNote'];
  if (chart.input.category === 'pregnancy_children') {
    const lord5 = chart.planets.find((p) => p.id === tajika.karyesha)!;
    const navamsasElapsed = Math.floor(lord5.degInSign / (30 / 9)) + 1;
    const daysEstimateByNavamsa = (9 - navamsasElapsed + 1) * 30;
    pregnancyTimingNote = {
      navamsasElapsedIn5L: navamsasElapsed,
      daysEstimateByNavamsa,
      note: `5th Lord (${lord5.id}) occupies Navamsa #${navamsasElapsed}/9 in ${lord5.signName} -> Remaining ${(9 - navamsasElapsed + 1)} Navamsas × 30 days ≈ ${daysEstimateByNavamsa} days (check Beeja/Kshetra Sphuta strength).`,
    };
  }

  const activeKalapindaPlanet =
    ithasala?.planets[0] ?? tajika.karyesha ?? chart.ascendantStarLord;

  return {
    hemisphereRate: {
      house: primaryHouse,
      hemisphere: visible
        ? 'Visible (Houses 7–12 -> Fast / Days)'
        : 'Invisible (Houses 1–6 -> Late / Months)',
      summary: `Karyesha ${tajika.karyesha} sits in House ${karyeshaPos.houseWholeSign} (${visible ? 'Visible upper hemisphere -> rapid turnaround' : 'Invisible lower hemisphere -> slower / progressive unfolding'}).`,
    },
    kalapindaScale: {
      rulingPlanet: activeKalapindaPlanet,
      timeUnit: getKalapindaUnit(activeKalapindaPlanet),
      source: 'Prasna Tantra Ch IV Kalapinda Table',
    },
    tajikaOrbWindow: {
      activeYoga: ithasala ? ithasala.type : null,
      orbGapDeg: ithasala ? ithasala.orbGapDeg : null,
      estimatedDaysToExact,
      exactProjectedDate,
    },
    currentVimshottariDasha: {
      mahadasha: startLord,
      antardasha: antarLord,
      pratyantardasha: pratyLord,
      mahaEndsLocal: formatUtcInTimeZone(mahaEndsMs, chart.input.timeZone),
      antarEndsLocal: formatUtcInTimeZone(antarEndsMs, chart.input.timeZone),
    },
    upcomingPeriods,
    kpTimingTrigger: `Look for transit conjunction of Sun, Moon & Ruling Planets (${kp.cleanRulingPlanets.join(', ') || 'check Retrograde RP filter'}) over the Dasha/Bhukti significators of [${kp.domainEvaluation.favourableHouses.join(', ')}].`,
    pregnancyTimingNote,
  };
}
