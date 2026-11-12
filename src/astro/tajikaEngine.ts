import {
  DEEPTHAMSA_ORB_DEG,
  SEVEN_PLANETS,
  SIGNS,
  TAJIKA_SPEED_ORDER,
} from './constants';
import { angularDiffDeg } from './time';
import type { CastHoraryChart, PlanetPosition, SevenPlanetId } from './types';

export type TajikaAspectKind = '1/7 Conjunction/Opp' | '5/9 Trine' | '3/11 Sextile' | '4/10 Square';

export interface TajikaAspectInfo {
  planetA: SevenPlanetId;
  planetB: SevenPlanetId;
  houseDiff: number; // 1..12 relative sign offset from A to B
  aspectKind: TajikaAspectKind;
  polarity: 'Openly Friendly' | 'Secretly Friendly' | 'Unfriendly' | 'Secretly Hostile';
  strengthPct: number;
  degreeGap: number;
  maxCombinedOrb: number;
  withinCombinedOrb: boolean;
  withinGeneralOrb12: boolean;
}

export type TajikaYogaType =
  | 'Poorna Ithasala'
  | 'Ithasala (Applying)'
  | 'Conjunction (Present)'
  | 'Easarapha / Musaripha (Separating)'
  | 'Naktha (Fast Light Transfer)'
  | 'Yamaya (Slow Light Transfer)'
  | 'Kamboola (Moon Ithasala)';

export interface TajikaYogaEvent {
  type: TajikaYogaType;
  involvesPrimaryPair: boolean;
  planets: SevenPlanetId[];
  mediator?: SevenPlanetId;
  kamboolaGrade?: string;
  orbGapDeg: number;
  temporalMeaning: 'Past / Missed' | 'Present / Active' | 'Future / Impending';
  favourable: boolean;
  explanation: string;
  source: string;
}

export interface PlanetaryAvasthaRow {
  planet: SevenPlanetId;
  sign: string;
  degInSign: string;
  dignity: string;
  avastha:
    | 'Deeptha'
    | 'Swastha'
    | 'Muditha'
    | 'Suveerya'
    | 'Deena'
    | 'Nipeeditha'
    | 'Mushita'
    | 'Pariheena';
  isCombust: boolean;
  isRetrograde: boolean;
  score: number;
}

export interface TajikaReport {
  lagnaLord: SevenPlanetId;
  karyesha: SevenPlanetId;
  karyeshaHouse: number;
  speedRanking: { planet: SevenPlanetId; speedDegPerDay: number; classicalRank: number }[];
  pairwiseAspects: TajikaAspectInfo[];
  primaryYogas: TajikaYogaEvent[];
  allYogas: TajikaYogaEvent[];
  avasthas: PlanetaryAvasthaRow[];
  karyasiddhiTierPct: 25 | 50 | 75 | 100;
  verdictLabel: string;
  summary: string;
}

export function getTajikaAspectMeta(
  houseDiff: number,
  squareWeight: 75 | 45
): {
  kind: TajikaAspectKind;
  polarity: TajikaAspectInfo['polarity'];
  strengthPct: number;
} | null {
  if (houseDiff === 1 || houseDiff === 7) {
    return { kind: '1/7 Conjunction/Opp', polarity: 'Secretly Hostile', strengthPct: 100 };
  }
  if (houseDiff === 5 || houseDiff === 9) {
    return { kind: '5/9 Trine', polarity: 'Openly Friendly', strengthPct: 75 };
  }
  if (houseDiff === 3) {
    return { kind: '3/11 Sextile', polarity: 'Secretly Friendly', strengthPct: 40 };
  }
  if (houseDiff === 11) {
    return { kind: '3/11 Sextile', polarity: 'Secretly Friendly', strengthPct: 10 };
  }
  if (houseDiff === 4 || houseDiff === 10) {
    return { kind: '4/10 Square', polarity: 'Unfriendly', strengthPct: squareWeight };
  }
  return null;
}

function classicalSpeedRank(id: SevenPlanetId): number {
  return TAJIKA_SPEED_ORDER.indexOf(id); // 0=Saturn .. 6=Moon
}

function classifyDirectPairYoga(
  pA: PlanetPosition,
  pB: PlanetPosition,
  houseDiff: number
): {
  kind: 'poorna_ithasala' | 'ithasala' | 'conjunction' | 'easarapha' | null;
  orbGap: number;
  faster: PlanetPosition;
  slower: PlanetPosition;
} {
  const rankA = classicalSpeedRank(pA.id as SevenPlanetId);
  const rankB = classicalSpeedRank(pB.id as SevenPlanetId);
  const faster = rankA >= rankB ? pA : pB;
  const slower = rankA >= rankB ? pB : pA;

  const combinedOrb =
    (DEEPTHAMSA_ORB_DEG[faster.id as SevenPlanetId] +
      DEEPTHAMSA_ORB_DEG[slower.id as SevenPlanetId]) /
    2;

  const degDiffSigned = slower.degInSign - faster.degInSign; // >0 means faster behind slower in sign degrees
  const absGap = Math.abs(degDiffSigned);

  if (absGap > combinedOrb) {
    return { kind: null, orbGap: absGap, faster, slower };
  }

  if (houseDiff === 1 && angularDiffDeg(faster.longitude, slower.longitude) <= 0.5) {
    return { kind: 'conjunction', orbGap: absGap, faster, slower };
  }

  // Note retrograde reversal check vs classical direct speed
  const fasterAdvancingToward =
    !faster.isRetrograde ? degDiffSigned >= 0 : degDiffSigned <= 0;

  if (fasterAdvancingToward) {
    if (absGap <= 1.0) {
      return { kind: 'poorna_ithasala', orbGap: absGap, faster, slower };
    }
    return { kind: 'ithasala', orbGap: absGap, faster, slower };
  }

  if (absGap >= 1.0 || degDiffSigned < 0) {
    return { kind: 'easarapha', orbGap: absGap, faster, slower };
  }

  return { kind: null, orbGap: absGap, faster, slower };
}

function mapAvastha(p: PlanetPosition): PlanetaryAvasthaRow {
  let avastha: PlanetaryAvasthaRow['avastha'] = 'Muditha';
  let score = 60;

  if (p.dignity === 'Exalted') {
    avastha = 'Deeptha';
    score = 95;
  } else if (p.dignity === 'Own Sign' || p.dignity === 'Moolatrikona') {
    avastha = 'Swastha';
    score = 88;
  } else if (p.dignity === 'Great Friend' || p.dignity === 'Friend') {
    avastha = 'Muditha';
    score = 75;
  } else if (p.dignity === 'Neutral') {
    avastha = 'Suveerya';
    score = 62;
  } else if (p.dignity === 'Enemy' || p.dignity === 'Great Enemy') {
    avastha = 'Deena';
    score = 38;
  } else if (p.dignity === 'Debilitated') {
    avastha = 'Pariheena';
    score = 20;
  }

  if (p.isCombust) {
    avastha = 'Mushita';
    score = Math.max(12, score - 35);
  } else if (p.isRetrograde && p.id !== 'Sun' && p.id !== 'Moon') {
    score = Math.max(20, score - 8);
  }

  return {
    planet: p.id as SevenPlanetId,
    sign: p.signName,
    degInSign: p.dmsInSign,
    dignity: p.dignity,
    avastha,
    isCombust: p.isCombust,
    isRetrograde: p.isRetrograde,
    score,
  };
}

export function evaluateTajikaEngine(
  chart: CastHoraryChart,
  karyeshaHouse: number
): TajikaReport {
  const byId = new Map<SevenPlanetId, PlanetPosition>();
  for (const p of chart.planets) {
    if (SEVEN_PLANETS.includes(p.id as SevenPlanetId)) {
      byId.set(p.id as SevenPlanetId, p);
    }
  }

  const lagnaLord = SIGNS[chart.ascendantSignIndex].lord;
  const karyeshaSignIdx = (chart.ascendantSignIndex + karyeshaHouse - 1) % 12;
  const karyesha = SIGNS[karyeshaSignIdx].lord;
  const moon = byId.get('Moon')!;

  const pairwiseAspects: TajikaAspectInfo[] = [];
  const allYogas: TajikaYogaEvent[] = [];

  for (let i = 0; i < SEVEN_PLANETS.length; i++) {
    for (let j = i + 1; j < SEVEN_PLANETS.length; j++) {
      const a = byId.get(SEVEN_PLANETS[i])!;
      const b = byId.get(SEVEN_PLANETS[j])!;
      const diff = ((b.signIndex - a.signIndex + 12) % 12) + 1;
      const meta = getTajikaAspectMeta(diff, chart.input.settings.tajikaSquareWeightPct);
      if (!meta) continue;

      const degGap = Math.abs(a.degInSign - b.degInSign);
      const maxCombinedOrb =
        (DEEPTHAMSA_ORB_DEG[a.id as SevenPlanetId] +
          DEEPTHAMSA_ORB_DEG[b.id as SevenPlanetId]) /
        2;
      const withinCombinedOrb = degGap <= maxCombinedOrb;
      const withinGeneralOrb12 = degGap <= 12;

      pairwiseAspects.push({
        planetA: a.id as SevenPlanetId,
        planetB: b.id as SevenPlanetId,
        houseDiff: diff,
        aspectKind: meta.kind,
        polarity: meta.polarity,
        strengthPct: meta.strengthPct,
        degreeGap: degGap,
        maxCombinedOrb,
        withinCombinedOrb,
        withinGeneralOrb12,
      });

      const yogaRes = classifyDirectPairYoga(a, b, diff);
      const involvesPrimary =
        (a.id === lagnaLord && b.id === karyesha) || (b.id === lagnaLord && a.id === karyesha);

      if (yogaRes.kind === 'poorna_ithasala') {
        allYogas.push({
          type: 'Poorna Ithasala',
          involvesPrimaryPair: involvesPrimary,
          planets: [yogaRes.faster.id as SevenPlanetId, yogaRes.slower.id as SevenPlanetId],
          orbGapDeg: yogaRes.orbGap,
          temporalMeaning: 'Future / Impending',
          favourable: meta.polarity !== 'Unfriendly',
          explanation: `${yogaRes.faster.id} (${yogaRes.faster.degInSign.toFixed(2)}°) applies tightly within ${yogaRes.orbGap.toFixed(2)}° (≤1°) to ${yogaRes.slower.id} (${yogaRes.slower.degInSign.toFixed(2)}°) via ${meta.kind}.`,
          source: 'Prasna Tantra Ch IV L1260-1279',
        });
      } else if (yogaRes.kind === 'ithasala') {
        allYogas.push({
          type: 'Ithasala (Applying)',
          involvesPrimaryPair: involvesPrimary,
          planets: [yogaRes.faster.id as SevenPlanetId, yogaRes.slower.id as SevenPlanetId],
          orbGapDeg: yogaRes.orbGap,
          temporalMeaning: 'Future / Impending',
          favourable: meta.polarity !== 'Unfriendly',
          explanation: `${yogaRes.faster.id} (${yogaRes.faster.degInSign.toFixed(2)}°) applies to ${yogaRes.slower.id} (${yogaRes.slower.degInSign.toFixed(2)}°) within Deepthamsa orb (${yogaRes.orbGap.toFixed(2)}° gap).`,
          source: 'Prasna Tantra Ch IV L1260-1279',
        });
      } else if (yogaRes.kind === 'conjunction') {
        allYogas.push({
          type: 'Conjunction (Present)',
          involvesPrimaryPair: involvesPrimary,
          planets: [yogaRes.faster.id as SevenPlanetId, yogaRes.slower.id as SevenPlanetId],
          orbGapDeg: yogaRes.orbGap,
          temporalMeaning: 'Present / Active',
          favourable: true,
          explanation: `${yogaRes.faster.id} and ${yogaRes.slower.id} are tightly conjoined (${yogaRes.orbGap.toFixed(2)}°) — event is actively unfolding now.`,
          source: 'Prasna Tantra Ch II H1',
        });
      } else if (yogaRes.kind === 'easarapha') {
        allYogas.push({
          type: 'Easarapha / Musaripha (Separating)',
          involvesPrimaryPair: involvesPrimary,
          planets: [yogaRes.faster.id as SevenPlanetId, yogaRes.slower.id as SevenPlanetId],
          orbGapDeg: yogaRes.orbGap,
          temporalMeaning: 'Past / Missed',
          favourable: false,
          explanation: `Faster ${yogaRes.faster.id} (${yogaRes.faster.degInSign.toFixed(2)}°) has already moved ahead of ${yogaRes.slower.id} (${yogaRes.slower.degInSign.toFixed(2)}°) by ${yogaRes.orbGap.toFixed(2)}° — signifies past phase or missed opportunity.`,
          source: 'Prasna Tantra Ch IV L1260-1279',
        });
      }
    }
  }

  // Primary pair special checks: Same-lord, Direct, Naktha (fast mediator), Yamaya (slow mediator), Kamboola (Moon)
  const lagnaPos = byId.get(lagnaLord)!;
  const karyaPos = byId.get(karyesha)!;
  const sameSignLord = lagnaLord === karyesha;

  if (sameSignLord) {
    allYogas.unshift({
      type: 'Conjunction (Present)',
      involvesPrimaryPair: true,
      planets: [lagnaLord],
      orbGapDeg: 0,
      temporalMeaning: 'Present / Active',
      favourable: !lagnaPos.isCombust && lagnaPos.dignity !== 'Debilitated',
      explanation: `Single significator (${lagnaLord}) rules both Lagna and Bhava ${karyeshaHouse}; outcome follows ${lagnaLord}'s dignity (${lagnaPos.dignity}) and Avastha.`,
      source: 'Prasna Tantra Ch I-II',
    });
  }

  const directPrimaryYogas = allYogas.filter((y) => y.involvesPrimaryPair);
  const directIthasala = directPrimaryYogas.some(
    (y) => y.type === 'Ithasala (Applying)' || y.type === 'Poorna Ithasala'
  );

  // Check Naktha / Yamaya if no direct Ithasala between distinct LagnaLord & Karyesha
  if (!sameSignLord && !directIthasala) {
    for (const mId of SEVEN_PLANETS) {
      if (mId === lagnaLord || mId === karyesha) continue;
      const med = byId.get(mId)!;
      const d1 = ((lagnaPos.signIndex - med.signIndex + 12) % 12) + 1;
      const d2 = ((karyaPos.signIndex - med.signIndex + 12) % 12) + 1;
      const m1 = getTajikaAspectMeta(d1, chart.input.settings.tajikaSquareWeightPct);
      const m2 = getTajikaAspectMeta(d2, chart.input.settings.tajikaSquareWeightPct);
      if (!m1 || !m2) continue;

      const orb1 = Math.abs(med.degInSign - lagnaPos.degInSign) <= (DEEPTHAMSA_ORB_DEG[mId] + DEEPTHAMSA_ORB_DEG[lagnaLord]) / 2;
      const orb2 = Math.abs(med.degInSign - karyaPos.degInSign) <= (DEEPTHAMSA_ORB_DEG[mId] + DEEPTHAMSA_ORB_DEG[karyesha]) / 2;
      if (!orb1 || !orb2) continue;

      const mRank = classicalSpeedRank(mId);
      const lRank = classicalSpeedRank(lagnaLord);
      const kRank = classicalSpeedRank(karyesha);

      if (mRank > lRank && mRank > kRank) {
        allYogas.push({
          type: 'Naktha (Fast Light Transfer)',
          involvesPrimaryPair: true,
          planets: [lagnaLord, karyesha],
          mediator: mId,
          orbGapDeg: Math.max(Math.abs(med.degInSign - lagnaPos.degInSign), Math.abs(med.degInSign - karyaPos.degInSign)),
          temporalMeaning: 'Future / Impending',
          favourable: true,
          explanation: `No direct connection between ${lagnaLord} and ${karyesha}; faster mediator ${mId} transfers light between both — success arrives through a third person / intermediary.`,
          source: 'Prasna Tantra Ch IV L1260-1279',
        });
      } else if (mRank < lRank && mRank < kRank) {
        allYogas.push({
          type: 'Yamaya (Slow Light Transfer)',
          involvesPrimaryPair: true,
          planets: [lagnaLord, karyesha],
          mediator: mId,
          orbGapDeg: Math.max(Math.abs(med.degInSign - lagnaPos.degInSign), Math.abs(med.degInSign - karyaPos.degInSign)),
          temporalMeaning: 'Future / Impending',
          favourable: true,
          explanation: `Slower mediator ${mId} links ${lagnaLord} and ${karyesha} within orb — fruition via steady/senior authority after patience.`,
          source: 'Prasna Tantra Ch IV L1260-1279',
        });
      }
    }
  }

  // Kamboola: Moon in Ithasala with LagnaLord or Karyesha
  for (const sig of Array.from(new Set([lagnaLord, karyesha]))) {
    if (sig === 'Moon') continue;
    const target = byId.get(sig)!;
    const diff = ((target.signIndex - moon.signIndex + 12) % 12) + 1;
    const meta = getTajikaAspectMeta(diff, chart.input.settings.tajikaSquareWeightPct);
    if (!meta) continue;
    const res = classifyDirectPairYoga(moon, target, diff);
    if (res.kind === 'ithasala' || res.kind === 'poorna_ithasala') {
      const moonStrong =
        moon.dignity === 'Exalted' || moon.dignity === 'Own Sign' || moon.dignity === 'Moolatrikona';
      const targetStrong =
        target.dignity === 'Exalted' || target.dignity === 'Own Sign' || target.dignity === 'Moolatrikona';
      const moonOwnNav = moon.navamsaSignIndex === 3;
      const moonOwnDwa = moon.dwadasamsaSignIndex === 3;
      let grade = 'Adhama Kamboola';
      if (moonStrong && targetStrong) grade = 'Uttamottama Kamboola';
      else if (moonOwnNav && moonOwnDwa) grade = 'Madhyamottama (Moon Nav+Dwad) Kamboola';
      else if (moonStrong || targetStrong) grade = 'Uttama Kamboola';
      else if (!target.isCombust) grade = 'Madhyama Kamboola';

      allYogas.push({
        type: 'Kamboola (Moon Ithasala)',
        involvesPrimaryPair: true,
        planets: ['Moon', sig],
        kamboolaGrade: grade,
        orbGapDeg: res.orbGap,
        temporalMeaning: 'Future / Impending',
        favourable: meta.polarity !== 'Unfriendly',
        explanation: `Moon applies in Ithasala to ${sig} (${res.orbGap.toFixed(2)}° gap) -> ${grade}.`,
        source: 'Prasna Tantra Ch IV L1260-1279',
      });
    }
  }

  const avasthas = SEVEN_PLANETS.map((id) => mapAvastha(byId.get(id)!));
  const primaryYogas = allYogas.filter((y) => y.involvesPrimaryPair);

  // Compute Karyasiddhi Tier (25 / 50 / 75 / 100%)
  const lScore = avasthas.find((a) => a.planet === lagnaLord)!.score;
  const kScore = avasthas.find((a) => a.planet === karyesha)!.score;
  const avgDignity = (lScore + kScore) / 2;
  const hasGoodYoga = primaryYogas.some((y) => y.favourable && y.type !== 'Easarapha / Musaripha (Separating)');
  const onlyEasarapha = primaryYogas.length > 0 && primaryYogas.every((y) => y.type.startsWith('Easarapha'));

  let tier: 25 | 50 | 75 | 100 = 50;
  let verdictLabel = 'Moderate / Conditional (50%)';
  if (hasGoodYoga && avgDignity >= 75) {
    tier = 100;
    verdictLabel = 'Poorna Karyasiddhi (100%)';
  } else if (hasGoodYoga || avgDignity >= 65) {
    tier = 75;
    verdictLabel = 'Favourable Achievement (75%)';
  } else if (onlyEasarapha || avgDignity < 40) {
    tier = 25;
    verdictLabel = 'Minimal / Missed Opportunity (25%)';
  }

  const speedRanking = [...SEVEN_PLANETS]
    .sort((a, b) => classicalSpeedRank(b) - classicalSpeedRank(a))
    .map((planet) => ({
      planet,
      speedDegPerDay: byId.get(planet)!.speedDegPerDay,
      classicalRank: classicalSpeedRank(planet) + 1,
    }));

  const summary =
    primaryYogas.length > 0
      ? primaryYogas.map((y) => `${y.type}: ${y.explanation}`).join(' ')
      : `No active Tajika Ithasala, Naktha, Yamaya, or Kamboola yoga forms directly between Lagna Lord (${lagnaLord}) and ${karyeshaHouse}th Lord (${karyesha}). Strength relies on individual Avasthas (${lagnaLord}: ${avasthas.find((a) => a.planet === lagnaLord)?.avastha}, ${karyesha}: ${avasthas.find((a) => a.planet === karyesha)?.avastha}).`;

  return {
    lagnaLord,
    karyesha,
    karyeshaHouse,
    speedRanking,
    pairwiseAspects,
    primaryYogas,
    allYogas,
    avasthas,
    karyasiddhiTierPct: tier,
    verdictLabel,
    summary,
  };
}
