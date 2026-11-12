import { NAKSHATRA_NAMES, SIGNS } from './constants';
import { angularDiffDeg } from './time';
import type { CastHoraryChart, NineGrahaId, PlanetPosition } from './types';

export interface SincerityFlag {
  id: string;
  triggered: boolean;
  severity: 'Critical Warning' | 'Caution' | 'Clear';
  title: string;
  detail: string;
  source: string;
}

export interface TimeDoshaItem {
  id: string;
  name: string;
  triggered: boolean;
  requiresNatalInput?: boolean;
  detail: string;
  source: string;
}

export interface RadicalityReport {
  isRadical: boolean;
  sincerityScore: number; // 0..100
  sincerityFlags: SincerityFlag[];
  triggeredDoshaCount: number;
  timeDoshas: TimeDoshaItem[];
  swaraAssessment: {
    status: 'Auspicious' | 'Inauspicious' | 'Not Entered';
    detail: string;
  };
  gandanthaDetail: string | null;
  fourteenItemsChecklist: { name: string; status: string }[];
}

const NATURAL_MALEFICS: NineGrahaId[] = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];

function parashariAspects(fromHouse: number, planetId: NineGrahaId, targetHouse: number): boolean {
  const diff = ((targetHouse - fromHouse + 12) % 12) + 1;
  if (diff === 7) return true;
  if (planetId === 'Mars' && (diff === 4 || diff === 8)) return true;
  if (planetId === 'Jupiter' && (diff === 5 || diff === 9)) return true;
  if (planetId === 'Saturn' && (diff === 3 || diff === 10)) return true;
  return false;
}

function getHouseDiff(a: number, b: number): number {
  return ((b - a + 12) % 12) + 1;
}

export function evaluateRadicalityAndDoshas(chart: CastHoraryChart): RadicalityReport {
  const byId = new Map<NineGrahaId, PlanetPosition>();
  for (const p of chart.planets) byId.set(p.id, p);

  const moon = byId.get('Moon')!;
  const saturn = byId.get('Saturn')!;
  const mercury = byId.get('Mercury')!;
  const mars = byId.get('Mars')!;
  const jupiter = byId.get('Jupiter')!;
  const sun = byId.get('Sun')!;

  const seventhSignLord = SIGNS[(chart.ascendantSignIndex + 6) % 12].lord;
  const lord7Pos = byId.get(seventhSignLord)!;

  // 1. Sincerity Flags (Prasna Tantra Ch I)
  const cond1 =
    moon.houseWholeSign === 1 &&
    [1, 4, 7, 10].includes(saturn.houseWholeSign) &&
    mercury.isCombust;

  const cond2 =
    moon.houseWholeSign === 1 &&
    parashariAspects(mars.houseWholeSign, 'Mars', 1) &&
    parashariAspects(mercury.houseWholeSign, 'Mercury', 1);

  const maleficsInLagna = chart.planets.filter(
    (p) => NATURAL_MALEFICS.includes(p.id) && p.houseWholeSign === 1
  );
  const cond3 = maleficsInLagna.length > 0;

  const jupSquare7L = [4, 10].includes(getHouseDiff(lord7Pos.houseWholeSign, jupiter.houseWholeSign));
  const mercSquare7L = [4, 10].includes(getHouseDiff(lord7Pos.houseWholeSign, mercury.houseWholeSign));
  const cond4 = jupSquare7L || mercSquare7L;

  const sincerityFlags: SincerityFlag[] = [
    {
      id: 'INSINCERE_MOON_SATURN_MERCURY',
      triggered: cond1,
      severity: cond1 ? 'Critical Warning' : 'Clear',
      title: 'Moon in Lagna + Saturn in Kendra + Mercury Combust',
      detail: cond1
        ? `Moon occupies 1H, Saturn in Kendra (${saturn.houseWholeSign}H), and Mercury is combust (${mercury.combustOrbDeg?.toFixed(1)}° <= ${chart.input.settings.mercuryCombustDeg}°). Indicates a tester or insincere querent.`
        : 'Condition absent — Moon/Saturn/Mercury combination does not signal deception.',
      source: 'Prasna Tantra Ch I',
    },
    {
      id: 'INSINCERE_MARS_MERCURY_MOON',
      triggered: cond2,
      severity: cond2 ? 'Critical Warning' : 'Clear',
      title: 'Mars & Mercury Aspecting Moon in Lagna',
      detail: cond2
        ? 'Moon in Lagna receives combined aspects from Mars and Mercury — querent attitude is insincere or deceptive.'
        : 'Condition absent.',
      source: 'Prasna Tantra Ch I',
    },
    {
      id: 'INSINCERE_MALEFIC_LAGNA',
      triggered: cond3,
      severity: cond3 ? 'Caution' : 'Clear',
      title: 'Natural Malefic Occupying Lagna',
      detail: cond3
        ? `Lagna occupied by ${maleficsInLagna.map((m) => m.id).join(', ')} — heavy mental agitation or affliction on query.`
        : 'Lagna is free of natural malefic occupation.',
      source: 'Prasna Tantra Ch I',
    },
    {
      id: 'INSINCERE_7L_SQUARE',
      triggered: cond4,
      severity: cond4 ? 'Caution' : 'Clear',
      title: 'Jupiter or Mercury Square to 7th Lord',
      detail: cond4
        ? `${jupSquare7L ? 'Jupiter' : 'Mercury'} is in a 4/10 square from 7th Lord (${seventhSignLord} in ${lord7Pos.houseWholeSign}H) — discordant querent-astrologer alignment.`
        : `7th Lord (${seventhSignLord}) is not squared by Jupiter or Mercury.`,
      source: 'Prasna Tantra Ch I',
    },
  ];

  // 2. 22 Time-Doshas (Prasna Marga L1680-2168)
  const p = chart.panchanga;
  const gandanthaArc = (() => {
    const check = (lon: number, label: string) => {
      const m = lon % 120;
      if (m <= 3 + 1 / 3) return `${label} at ${m.toFixed(2)}° post-water/fire junction`;
      if (m >= 116 + 2 / 3) return `${label} at ${(120 - m).toFixed(2)}° before junction`;
      return null;
    };
    return check(chart.ascendantSidereal, 'Lagna') || check(moon.longitude, 'Moon');
  })();

  const rikthaTriggered = [4, 8, 9, 14].includes(((p.tithiNumber - 1) % 15) + 1);
  const vishtiOrFixedKarana = p.karanaName.includes('Vishti') || p.karanaFixed;
  const vyatipataTriggered = p.yogaName === 'Vyatipata';
  const sunAspectLagna = sun.houseWholeSign === 1 || sun.houseWholeSign === 7;
  const eclipseTriggered =
    p.solarEclipseDaysDiff !== null || p.lunarEclipseDaysDiff !== null;
  const gulikaCloseToLagna = angularDiffDeg(chart.ascendantSidereal, chart.gulikaLon) <= 5;
  const sandhiTriggered =
    chart.ascendantSidereal % 30 <= 1 ||
    chart.ascendantSidereal % 30 >= 29 ||
    Math.abs(((moon.longitude - sun.longitude + 360) % 12) - 6) >= 5.6;

  const janmaNak = chart.input.natalJanmaNakshatraIndex;
  const taraOffset =
    janmaNak !== undefined ? ((p.moonNakshatraIndex - janmaNak + 27) % 27) % 9 + 1 : null;
  const vipatTriggered = taraOffset === 3;
  const pratyakTriggered = taraOffset === 5;
  const naidhanaTriggered = taraOffset === 7;

  const janmaSign = chart.input.natalJanmaSignIndex;
  const eigthLagnaTriggered =
    janmaSign !== undefined && ((chart.ascendantSignIndex - janmaSign + 12) % 12) + 1 === 8;
  const eighthMoonTriggered =
    janmaSign !== undefined && ((moon.signIndex - janmaSign + 12) % 12) + 1 === 8;

  const timeDoshas: TimeDoshaItem[] = [
    {
      id: 'GANDANTHA',
      name: 'Gandantha (Water–Fire Cusp 3°20\')',
      triggered: gandanthaArc !== null,
      detail: gandanthaArc ?? 'Neither Lagna nor Moon sits in a Gandantha junction.',
      source: 'Prasna Marga L1680-2168',
    },
    {
      id: 'RIKTHA_TITHI',
      name: 'Riktha Tithi (4, 8, 9, 14)',
      triggered: rikthaTriggered,
      detail: `Active Tithi: ${p.paksha} ${p.tithiName} (#${p.tithiNumber}).`,
      source: 'Prasna Marga L1680-2168',
    },
    {
      id: 'VISHTI_STHIRA_KARANA',
      name: 'Vishti (Bhadra) & 4 Sthira Karanas',
      triggered: vishtiOrFixedKarana,
      detail: `Active Karana: ${p.karanaName}${p.karanaFixed ? ' (Fixed/Sthira)' : ''}.`,
      source: 'Prasna Marga L1680-2168',
    },
    {
      id: 'SANDHI',
      name: 'Rasi / Tithi Sandhi Junctions',
      triggered: sandhiTriggered,
      detail: sandhiTriggered
        ? `Lagna or Tithi is at junction edge (${(chart.ascendantSidereal % 30).toFixed(2)}° in sign).`
        : 'Clear of Rasi & Tithi junction boundaries.',
      source: 'Prasna Marga L1680-2168',
    },
    {
      id: 'GULIKODAYA',
      name: 'Gulikodaya Proximity',
      triggered: gulikaCloseToLagna,
      detail: `Gulika at ${SIGNS[Math.floor(chart.gulikaLon / 30)].short} ${(chart.gulikaLon % 30).toFixed(2)}° (Start ${chart.gulikaStartGhati} gh).`,
      source: 'Prasna Marga L1680-2168',
    },
    {
      id: 'VYATIPATA',
      name: 'Vyatipata Nitya Yoga',
      triggered: vyatipataTriggered,
      detail: `Active Nitya Yoga: ${p.yogaName} (#${p.yogaNumber}).`,
      source: 'Prasna Marga L1680-2168',
    },
    {
      id: 'ECLIPSE_3D',
      name: 'Solar / Lunar Eclipse Window (±3 days)',
      triggered: eclipseTriggered,
      detail: eclipseTriggered
        ? `Eclipse within ±3 days (${p.solarEclipseDaysDiff !== null ? `Solar Δ ${p.solarEclipseDaysDiff.toFixed(2)}d` : ''} ${p.lunarEclipseDaysDiff !== null ? `Lunar Δ ${p.lunarEclipseDaysDiff.toFixed(2)}d` : ''}).`
        : 'No solar or lunar eclipse within ±3 days.',
      source: 'Prasna Marga L1680-2168',
    },
    {
      id: 'SUN_LAGNA_ASPECT',
      name: 'Sun Occupying or Aspecting Lagna (1H/7H)',
      triggered: sunAspectLagna,
      detail: `Sun is in ${sun.houseWholeSign}H (${sun.signName}).`,
      source: 'Prasna Marga L1680-2168',
    },
    {
      id: 'SANKRANTI',
      name: 'Sankranti Solar Ingress (±16 Ghatis)',
      triggered: p.isNearSankranti,
      detail: `Sun degree in sign: ${p.sunDegInSign.toFixed(2)}°${p.isNearSankranti ? ' (within Sankranti threshold)' : ''}.`,
      source: 'Prasna Marga L1680-2168',
    },
    {
      id: 'VIPAT_TARA',
      name: 'Vipat Tara (3rd Star from Janma)',
      triggered: vipatTriggered,
      requiresNatalInput: janmaNak === undefined,
      detail:
        janmaNak !== undefined
          ? `Janma Star: ${NAKSHATRA_NAMES[janmaNak]} -> Transit Star ${p.moonNakshatraName} (Tara #${taraOffset}).`
          : 'Enter Querent Janma Nakshatra in settings to test Vipat Tara.',
      source: 'Prasna Marga L1680-2168',
    },
    {
      id: 'PRATYAK_TARA',
      name: 'Pratyak Tara (5th Star from Janma)',
      triggered: pratyakTriggered,
      requiresNatalInput: janmaNak === undefined,
      detail:
        janmaNak !== undefined
          ? `Tara count #${taraOffset} from Janma.`
          : 'Enter Querent Janma Nakshatra in settings to test Pratyak Tara.',
      source: 'Prasna Marga L1680-2168',
    },
    {
      id: 'NAIDHANA_TARA',
      name: 'Naidhana Tara (7th Star from Janma)',
      triggered: naidhanaTriggered,
      requiresNatalInput: janmaNak === undefined,
      detail:
        janmaNak !== undefined
          ? `Tara count #${taraOffset} from Janma.`
          : 'Enter Querent Janma Nakshatra in settings to test Naidhana Tara.',
      source: 'Prasna Marga L1680-2168',
    },
    {
      id: 'EIGHTH_LAGNA',
      name: '8th Lagna from Natal Janma Rasi',
      triggered: eigthLagnaTriggered,
      requiresNatalInput: janmaSign === undefined,
      detail:
        janmaSign !== undefined
          ? `Prashna Lagna (${chart.ascendantSignName}) is ${((chart.ascendantSignIndex - janmaSign + 12) % 12) + 1}th from Natal Moon Rasi.`
          : 'Enter Querent Janma Rasi in settings to test 8th Lagna.',
      source: 'Prasna Marga L1680-2168',
    },
    {
      id: 'EIGHTH_MOON',
      name: '8th Moon (Chandrashtama) from Natal Rasi',
      triggered: eighthMoonTriggered,
      requiresNatalInput: janmaSign === undefined,
      detail:
        janmaSign !== undefined
          ? `Prashna Moon (${moon.signName}) is ${((moon.signIndex - janmaSign + 12) % 12) + 1}th from Natal Moon Rasi.`
          : 'Enter Querent Janma Rasi in settings to test 8th Moon.',
      source: 'Prasna Marga L1680-2168',
    },
  ];

  // Swara Assessment (Prasna Marga L2150-2168)
  const leftDays = ['Monday', 'Wednesday', 'Thursday', 'Friday'];
  const rightDays = ['Sunday', 'Tuesday', 'Saturday'];
  let swaraAssessment: RadicalityReport['swaraAssessment'] = {
    status: 'Not Entered',
    detail: `On ${p.vedicWeekdayName}, ${leftDays.includes(p.vedicWeekdayName) ? 'Left (Ida)' : 'Right (Pingala)'} nostril flow is classically auspicious.`,
  };
  if (chart.input.swaraNostril === 'left_ida') {
    const ok = leftDays.includes(p.vedicWeekdayName);
    swaraAssessment = {
      status: ok ? 'Auspicious' : 'Inauspicious',
      detail: `Left nostril active on ${p.vedicWeekdayName}: ${ok ? 'Concordant with Mon/Wed/Thu/Fri rule.' : 'Discordant — Left breath unfavourable on Sun/Tue/Sat.'}`,
    };
  } else if (chart.input.swaraNostril === 'right_pingala') {
    const ok = rightDays.includes(p.vedicWeekdayName);
    swaraAssessment = {
      status: ok ? 'Auspicious' : 'Inauspicious',
      detail: `Right nostril active on ${p.vedicWeekdayName}: ${ok ? 'Concordant with Sun/Tue/Sat rule.' : 'Discordant — Right breath unfavourable on Mon/Wed/Thu/Fri.'}`,
    };
  }

  const triggeredDoshaCount = timeDoshas.filter((d) => d.triggered).length;
  const criticalCount = (cond1 ? 1 : 0) + (cond2 ? 1 : 0);
  const cautionCount = (cond3 ? 1 : 0) + (cond4 ? 1 : 0);
  const sincerityScore = Math.max(
    10,
    100 - criticalCount * 35 - cautionCount * 12 - Math.min(30, triggeredDoshaCount * 5)
  );

  return {
    isRadical: criticalCount === 0,
    sincerityScore,
    sincerityFlags,
    triggeredDoshaCount,
    timeDoshas,
    swaraAssessment,
    gandanthaDetail: gandanthaArc,
    fourteenItemsChecklist: [
      { name: 'Samaya (Time)', status: `${p.localDisplay} (${p.isDaytime ? 'Day' : 'Night'}, Hora: ${p.horaLord})` },
      { name: 'Desa (Place)', status: `${chart.input.placeName} (${chart.input.latitude.toFixed(2)}, ${chart.input.longitude.toFixed(2)})` },
      { name: 'Swarayu (Breath)', status: swaraAssessment.detail },
      { name: 'Avastha (State)', status: `Lagna ${chart.ascendantSignName}, ${SIGNS[chart.ascendantSignIndex].udaya}` },
      { name: 'Arudha', status: `${SIGNS[chart.input.arudhaSignIndex].name} (${SIGNS[chart.input.arudhaSignIndex].cakraDirection})` },
      { name: 'Prasnakshara', status: chart.input.pranaksharaGroup ? `Group ${chart.input.pranaksharaGroup} (#${chart.input.pranaksharaNumber ?? '—'})` : 'Optional input' },
    ],
  };
}
