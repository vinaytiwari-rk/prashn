import * as Astronomy from 'astronomy-engine';
import {
  BARREN_SIGNS,
  DUAL_SIGNS,
  ELECTIONAL_KP_MUHURTA_RULES,
  FRUITFUL_SIGNS_PRIMARY,
  FRUITFUL_SIGNS_SEMI,
  NINE_GRAHAS,
  QUESTION_CATEGORIES,
  SIGNS,
} from './constants';
import {
  ascFromRamcTropical,
  computeKpSubAndSsl,
  computePlacidusCuspsTropical,
  solveRamcForAscendant,
} from './ephemeris';
import { angularDiffDeg, formatDms, normalizeDeg } from './time';
import type {
  CastHoraryChart,
  NineGrahaId,
  QuestionCategory,
  SevenPlanetId,
} from './types';

export interface KpCuspRow {
  house: number;
  longitude: number;
  signIndex: number;
  signName: string;
  dmsInSign: string;
  signLord: SevenPlanetId;
  starLord: NineGrahaId;
  subLord: NineGrahaId;
  subSubLord: NineGrahaId;
}

export interface KpPlanetRow {
  planet: NineGrahaId;
  longitude: number;
  signName: string;
  dmsInSign: string;
  kpHouse: number;
  signLord: SevenPlanetId;
  starLord: NineGrahaId;
  subLord: NineGrahaId;
  subSubLord: NineGrahaId;
  isTrueRetrograde: boolean;
  isUntenanted: boolean;
  ownsHouses: number[];
  signifiesHouses: number[];
}

export interface KpHouseSignificatorRow {
  house: number;
  levelA: NineGrahaId[];
  levelB: NineGrahaId[];
  levelC: NineGrahaId[];
  levelD: NineGrahaId[];
  all: NineGrahaId[];
}

export interface KpRulingPlanetItem {
  role: string;
  planet: NineGrahaId;
  starLordOfPlanet: NineGrahaId;
  subLordOfPlanet: NineGrahaId;
  flaggedByRetrograde: boolean;
  retrogradeReason: string | null;
  isNodeAgent?: boolean;
  nodeAgentNote?: string | null;
}

export interface KpDomainRuleEvaluation {
  category: QuestionCategory;
  categoryLabel: string;
  primaryCusp: number;
  cuspSubLord: NineGrahaId;
  cslRetrograde: boolean;
  starLordOfCsl: NineGrahaId;
  starOfCslRetrograde: boolean;
  subLordOfCsl: NineGrahaId;
  subOfCslRetrograde: boolean;
  cslStarHouses: number[];
  cslSelfHouses: number[];
  cslSubHouses: number[];
  retroMatrixCase:
    | 'Direct in Direct Star'
    | 'Direct in Retrograde Star (Failure)'
    | 'Retrograde in Direct Star (Delayed)'
    | 'Retrograde in Retrograde Star (Denial)'
    | 'Node Exception';
  readerVSpecialNotes: string[];
  favourableHouses: number[];
  unfavourableHouses: number[];
  matchedFavourable: number[];
  matchedUnfavourable: number[];
  verdict: 'Strong Yes' | 'Favourable with Delay' | 'Mixed / Conditional' | 'Denial / Unfavourable';
  scorePct: number;
  lostItemDetails?: {
    kpDirection: string;
    signElement: string;
    mobilityNote: string;
    retrogradeNote: string;
  };
  explanation: string;
  source: string;
}

export interface KpElectionalMuhurtaCheck {
  isAuspicious: boolean;
  scorePct: number;
  checks: { label: string; planet: NineGrahaId; houses: number[]; favourable: boolean }[];
  summary: string;
  source: string;
}

export interface KpHoraryReport {
  kpAyanamsaDms: string;
  cusps: KpCuspRow[];
  planets: KpPlanetRow[];
  houseSignificators: KpHouseSignificatorRow[];
  rulingPlanets: KpRulingPlanetItem[];
  nodeProxyAgents: KpRulingPlanetItem[];
  cleanRulingPlanets: NineGrahaId[];
  nodeAgentsNote: string;
  electionalCheck: KpElectionalMuhurtaCheck;
  domainEvaluation: KpDomainRuleEvaluation;
  allCategoryEvaluations: KpDomainRuleEvaluation[];
}

const DOMAIN_HOUSE_MATRIX: Record<
  QuestionCategory,
  {
    cusp: number;
    fav: number[];
    unfav: number[];
    source: string;
  }
> = {
  general_yes_no: { cusp: 11, fav: [1, 2, 6, 10, 11], unfav: [5, 8, 12], source: 'KP CSL Rule (rppandey)' },
  lost_stolen: { cusp: 2, fav: [2, 11], unfav: [8, 12], source: '09_rppandey_lost_or_stolen_kp.md' },
  marriage_relationship: { cusp: 7, fav: [2, 7, 11], unfav: [1, 6, 10], source: '03_rppandey_what_is_horary.md' },
  career_job: { cusp: 6, fav: [2, 6, 10, 11], unfav: [5, 8, 12], source: '03_rppandey_what_is_horary.md' },
  promotion_transfer: { cusp: 10, fav: [2, 6, 10, 11], unfav: [5, 8, 12], source: '05_astrosutras_profession_change.md & KP' },
  finance_loan: { cusp: 6, fav: [2, 6, 11], unfav: [5, 8, 12], source: '03_rppandey_what_is_horary.md' },
  property_vehicle: { cusp: 4, fav: [4, 11, 12], unfav: [3, 5, 8], source: 'KP CSL Property Rule' },
  medical_health: { cusp: 6, fav: [1, 5, 11], unfav: [6, 8, 12], source: 'KP Medical CSL Rule' },
  legal_litigation: { cusp: 6, fav: [6, 11], unfav: [5, 8, 12], source: 'KP Litigation CSL Rule' },
  travel_missing: { cusp: 9, fav: [2, 9, 11], unfav: [8, 12], source: 'KP Travel / Return Rule' },
  pregnancy_children: { cusp: 5, fav: [2, 5, 11], unfav: [1, 4, 10], source: 'KP Progeny CSL Rule' },
  education_exam: { cusp: 4, fav: [4, 5, 9, 11], unfav: [3, 8, 12], source: 'KP Education & Exam CSL Rule' },
  blind_mook: { cusp: 1, fav: [1, 2, 11], unfav: [8, 12], source: 'KP Lagna CSL Rule' },
};

function findHouse(lon: number, cuspsSid: number[]): number {
  const n = normalizeDeg(lon);
  for (let i = 0; i < 12; i++) {
    const start = cuspsSid[i];
    const end = cuspsSid[(i + 1) % 12];
    const span = normalizeDeg(end - start);
    const offset = normalizeDeg(n - start);
    if (offset < span + 1e-9) return i + 1;
  }
  return 1;
}

export function evaluateKpHorary(chart: CastHoraryChart): KpHoraryReport {
  const time = new Astronomy.AstroTime(new Date(chart.utcMs));
  const kpAyan = chart.kpAyanamsaDeg;
  const obliquityDeg = Astronomy.e_tilt(time).tobl;

  const gmst = Astronomy.SiderealTime(time);
  const naturalRamc = ((gmst + chart.input.longitude / 15) % 24 + 24) % 24 * 15;
  let ramcForKp = naturalRamc;

  if (chart.rotatedReference?.isRotated && chart.rotatedReference.kpLonDeg !== null) {
    const targetAscTrop = normalizeDeg(chart.rotatedReference.kpLonDeg + kpAyan);
    ramcForKp = solveRamcForAscendant(targetAscTrop, chart.input.latitude, obliquityDeg);
  } else if (chart.input.castingMode === 'kp_horary' && chart.activeKpSlot) {
    const targetAscTrop = normalizeDeg(chart.activeKpSlot.startDeg + kpAyan);
    ramcForKp = solveRamcForAscendant(targetAscTrop, chart.input.latitude, obliquityDeg);
  } else if (chart.input.castingMode === 'arudha_override' || chart.input.castingMode === 'number_108') {
    const targetAscTrop = normalizeDeg(chart.ascendantSidereal + chart.ayanamsaDeg);
    ramcForKp = solveRamcForAscendant(targetAscTrop, chart.input.latitude, obliquityDeg);
  }

  const cuspsTrop = computePlacidusCuspsTropical(ramcForKp, chart.input.latitude, obliquityDeg);
  const cuspsSid = cuspsTrop.map((c) => normalizeDeg(c - kpAyan));
  if (chart.rotatedReference?.isRotated && chart.rotatedReference.kpLonDeg !== null) {
    cuspsSid[0] = chart.rotatedReference.kpLonDeg;
  } else if (chart.input.castingMode === 'kp_horary' && chart.activeKpSlot) {
    cuspsSid[0] = chart.activeKpSlot.startDeg;
  } else if (chart.input.castingMode === 'number_108') {
    cuspsSid[0] = normalizeDeg(chart.ascendantSidereal + chart.ayanamsaDeg - kpAyan);
  } else if (chart.input.castingMode === 'time_lagna') {
    cuspsSid[0] = normalizeDeg(
      ascFromRamcTropical(ramcForKp, chart.input.latitude, obliquityDeg) - kpAyan
    );
  }

  const cusps: KpCuspRow[] = cuspsSid.map((lon, idx) => {
    const signIndex = Math.floor(lon / 30) % 12;
    const sub = computeKpSubAndSsl(lon);
    return {
      house: idx + 1,
      longitude: lon,
      signIndex,
      signName: SIGNS[signIndex].name,
      dmsInSign: formatDms(lon % 30),
      signLord: SIGNS[signIndex].lord,
      starLord: sub.starLord,
      subLord: sub.subLord,
      subSubLord: sub.subSubLord,
    };
  });

  // Re-reference planets cleanly to KP Ayanamsa
  const planetKpLon = new Map<NineGrahaId, number>();
  const planetHouse = new Map<NineGrahaId, number>();
  const planetStar = new Map<NineGrahaId, NineGrahaId>();
  const planetSub = new Map<NineGrahaId, NineGrahaId>();
  const planetSsl = new Map<NineGrahaId, NineGrahaId>();
  const planetRetro = new Map<NineGrahaId, boolean>();
  const ownsHouses = new Map<NineGrahaId, number[]>();

  for (const g of NINE_GRAHAS) ownsHouses.set(g, []);
  for (const c of cusps) ownsHouses.get(c.signLord)!.push(c.house);

  for (const g of NINE_GRAHAS) {
    const body = chart.planets.find((p) => p.id === g)!;
    const lon = normalizeDeg(body.tropicalLongitude - kpAyan);
    const kpSub = computeKpSubAndSsl(lon);
    planetKpLon.set(g, lon);
    planetHouse.set(g, findHouse(lon, cuspsSid));
    planetStar.set(g, kpSub.starLord);
    planetSub.set(g, kpSub.subLord);
    planetSsl.set(g, kpSub.subSubLord);
    // Retrograde filter applies specifically to planets Mars/Mercury/Jupiter/Venus/Saturn
    planetRetro.set(g, g !== 'Rahu' && g !== 'Ketu' && body.isRetrograde);
  }

  // House Significators A / B / C / D
  const houseSignificators: KpHouseSignificatorRow[] = Array.from({ length: 12 }, (_, idx) => {
    const h = idx + 1;
    const occupants = NINE_GRAHAS.filter((g) => planetHouse.get(g) === h);
    const levelA = NINE_GRAHAS.filter((g) => occupants.includes(planetStar.get(g)!));
    const levelB = occupants;
    const cuspLord = cusps[idx].signLord;
    const levelC = NINE_GRAHAS.filter((g) => planetStar.get(g) === cuspLord);
    const levelD: NineGrahaId[] = [cuspLord];
    const all = Array.from(new Set([...levelA, ...levelB, ...levelC, ...levelD]));
    return { house: h, levelA, levelB, levelC, levelD, all };
  });

  const planetSignifiesMap = new Map<NineGrahaId, number[]>();
  for (const g of NINE_GRAHAS) {
    const houses = houseSignificators.filter((row) => row.all.includes(g)).map((row) => row.house);
    planetSignifiesMap.set(g, houses);
  }

  const untenantedMap = new Map<NineGrahaId, boolean>();
  for (const g of NINE_GRAHAS) {
    const hasTenant = NINE_GRAHAS.some((other) => other !== g && planetStar.get(other) === g);
    untenantedMap.set(g, !hasTenant);
  }

  const planets: KpPlanetRow[] = NINE_GRAHAS.map((g) => {
    const lon = planetKpLon.get(g)!;
    const signIndex = Math.floor(lon / 30) % 12;
    return {
      planet: g,
      longitude: lon,
      signName: SIGNS[signIndex].name,
      dmsInSign: formatDms(lon % 30),
      kpHouse: planetHouse.get(g)!,
      signLord: SIGNS[signIndex].lord,
      starLord: planetStar.get(g)!,
      subLord: planetSub.get(g)!,
      subSubLord: planetSsl.get(g)!,
      isTrueRetrograde: planetRetro.get(g)!,
      isUntenanted: untenantedMap.get(g) ?? false,
      ownsHouses: ownsHouses.get(g)!,
      signifiesHouses: planetSignifiesMap.get(g)!,
    };
  });

  // 7 Ruling Planets + Retrograde Filter + Hora & Moment Lagna toggles + Node Agents (Reader V L5478, Times L2359/L2545)
  const lagnaCusp = cusps[0];
  const moonKp = computeKpSubAndSsl(planetKpLon.get('Moon')!);
  const moonSignIdx = Math.floor(planetKpLon.get('Moon')! / 30) % 12;

  const useHoraRp = chart.input.settings.useHoraInRp ?? false;
  const useMomentLagnaRp = chart.input.settings.rpHoraryAscMode === 'moment_lagna';

  const rpAscSignLord = useMomentLagnaRp ? chart.naturalAscendantSignLord : lagnaCusp.signLord;
  const rpAscStarLord = useMomentLagnaRp ? chart.naturalAscendantStarLord : lagnaCusp.starLord;
  const rpAscSubLord = useMomentLagnaRp ? chart.naturalAscendantSubLord : lagnaCusp.subLord;
  const ascPrefix = useMomentLagnaRp ? 'Moment Lagna' : 'Lagna';

  const rawRpRoles: { role: string; planet: NineGrahaId }[] = [
    {
      role: useHoraRp ? 'Hora Lord (replaces Vara)' : 'Day Lord (Vara)',
      planet: useHoraRp ? chart.panchanga.horaLord : chart.panchanga.dayLord,
    },
    { role: `${ascPrefix} Sign Lord`, planet: rpAscSignLord },
    { role: `${ascPrefix} Star Lord`, planet: rpAscStarLord },
    { role: `${ascPrefix} Sub Lord`, planet: rpAscSubLord },
    { role: 'Moon Sign Lord', planet: SIGNS[moonSignIdx].lord },
    { role: 'Moon Star Lord', planet: moonKp.starLord },
    { role: 'Moon Sub Lord', planet: moonKp.subLord },
  ];

  const makeRpItem = (
    role: string,
    planet: NineGrahaId,
    isNodeAgent = false,
    nodeAgentNote: string | null = null
  ): KpRulingPlanetItem => {
    const starOfRp = planetStar.get(planet)!;
    const subOfRp = planetSub.get(planet)!;
    const starRetro = planetRetro.get(starOfRp) ?? false;
    const subRetro = planetRetro.get(subOfRp) ?? false;
    const flagged = starRetro || subRetro;
    const reasons: string[] = [];
    if (starRetro) reasons.push(`Star Lord ${starOfRp} is Retrograde`);
    if (subRetro) reasons.push(`Sub Lord ${subOfRp} is Retrograde`);
    return {
      role,
      planet,
      starLordOfPlanet: starOfRp,
      subLordOfPlanet: subOfRp,
      flaggedByRetrograde: flagged,
      retrogradeReason: reasons.length > 0 ? reasons.join('; ') : null,
      isNodeAgent,
      nodeAgentNote,
    };
  };

  const baseRulingPlanets: KpRulingPlanetItem[] = rawRpRoles.map((item) => makeRpItem(item.role, item.planet));
  const cleanBaseRpSet = new Set<NineGrahaId>(
    baseRulingPlanets.filter((r) => !r.flaggedByRetrograde).map((r) => r.planet)
  );

  // Determine Node RP Proxy Agents (Reader V L5478-5493, L10231-10236)
  const getNodeRepresentedPlanets = (nodeId: 'Rahu' | 'Ketu'): { planet: NineGrahaId; via: string }[] => {
    const nLon = planetKpLon.get(nodeId)!;
    const nSignIdx = Math.floor(nLon / 30) % 12;
    const nSignLord = SIGNS[nSignIdx].lord;
    const nStarLord = planetStar.get(nodeId)!;
    const out: { planet: NineGrahaId; via: string }[] = [
      { planet: nSignLord, via: 'Sign Lord' },
      { planet: nStarLord, via: 'Star Lord' },
    ];
    for (const p of NINE_GRAHAS) {
      if (p === 'Rahu' || p === 'Ketu') continue;
      const pLon = planetKpLon.get(p)!;
      if (angularDiffDeg(nLon, pLon) <= 12) {
        out.push({ planet: p, via: 'Conjoined (<12°)' });
      }
      // Aspect onto node
      const aspOffsets =
        p === 'Mars'
          ? [90, 180, 210]
          : p === 'Jupiter'
          ? [120, 180, 240]
          : p === 'Saturn'
          ? [60, 180, 270]
          : [180];
      if (aspOffsets.some((deg) => angularDiffDeg(normalizeDeg(pLon + deg), nLon) <= 8)) {
        out.push({ planet: p, via: 'Aspects Node' });
      }
    }
    return out;
  };

  const nodeProxyItems: KpRulingPlanetItem[] = [];
  const nodeNotes: string[] = [];
  for (const nodeId of ['Rahu', 'Ketu'] as const) {
    const reps = getNodeRepresentedPlanets(nodeId);
    const matchedRps = reps.filter((r) => cleanBaseRpSet.has(r.planet));
    if (matchedRps.length > 0 && !rawRpRoles.some((r) => r.planet === nodeId)) {
      const desc = Array.from(new Set(matchedRps.map((m) => `${m.planet} (${m.via})`))).join(', ');
      nodeNotes.push(`${nodeId} acts for ${desc}`);
      nodeProxyItems.push(makeRpItem(`${nodeId} (RP Agent)`, nodeId, true, desc));
    }
  }

  const rulingPlanets: KpRulingPlanetItem[] = baseRulingPlanets;

  const cleanRulingPlanets = Array.from(
    new Set(
      [...baseRulingPlanets, ...nodeProxyItems]
        .filter((r) => !r.flaggedByRetrograde)
        .map((r) => r.planet)
    )
  );
  const nodeAgentsNote =
    nodeNotes.length > 0
      ? `Reader V Node RP Proxy Rule: ${nodeNotes.join('; ')}.`
      : 'No extra Node RP proxy activation required (Nodes checked for sign/star/conjunction/aspect with clean RPs).';

  // Reader V Electional Muhurta Check ("Which Time Is Good?" L13215-13261)
  const electionalTargets: { label: string; planet: NineGrahaId }[] = [
    { label: 'Ascendant Sub-Lord', planet: cusps[0].subLord },
    { label: 'Moon Star Lord', planet: moonKp.starLord },
    { label: 'Moon Sub-Lord', planet: moonKp.subLord },
    { label: '11th Cusp Sub-Lord', planet: cusps[10].subLord },
  ];
  const electionalChecks = electionalTargets.map((t) => {
    const houses = planetSignifiesMap.get(t.planet) ?? [];
    const benMatches = houses.filter((h) => ELECTIONAL_KP_MUHURTA_RULES.beneficialHouses.includes(h));
    const advMatches = houses.filter((h) => ELECTIONAL_KP_MUHURTA_RULES.adverseHouses.includes(h));
    const favourable = benMatches.length > 0 && advMatches.length === 0;
    return { label: t.label, planet: t.planet, houses, favourable };
  });
  const favElecCount = electionalChecks.filter((c) => c.favourable).length;
  const elecScorePct = Math.round((favElecCount / electionalChecks.length) * 100);
  const electionalCheck: KpElectionalMuhurtaCheck = {
    isAuspicious: favElecCount >= 3,
    scorePct: elecScorePct,
    checks: electionalChecks,
    summary:
      favElecCount >= 3
        ? `Auspicious KP Electional Window (${favElecCount}/4 pillars in [1,2,3,6,10,11] free from 8/12) -> favourable for immediate start even without Panchanga Shuddhi.`
        : `Sub-optimal KP Electional Window (${favElecCount}/4 clean pillars in [1,2,3,6,10,11] free of 8/12) -> prefer waiting for next clean Moon/Lagna Sub.`,
    source: ELECTIONAL_KP_MUHURTA_RULES.source,
  };

  // Domain Evaluation Helper
  const evalCategory = (catId: QuestionCategory): KpDomainRuleEvaluation => {
    const meta = DOMAIN_HOUSE_MATRIX[catId];
    const catInfo = QUESTION_CATEGORIES.find((q) => q.id === catId)!;
    const cuspInfo = cusps[meta.cusp - 1];
    const csl = cuspInfo.subLord;
    const starOfCsl = planetStar.get(csl)!;
    const subOfCsl = planetSub.get(csl)!;
    const cslSelfHouses = planetSignifiesMap.get(csl)!;
    const cslStarHouses = planetSignifiesMap.get(starOfCsl)!;
    const cslSubHouses = planetSignifiesMap.get(subOfCsl)!;
    const isCslNode = csl === 'Rahu' || csl === 'Ketu';
    const cslRetro = planetRetro.get(csl) ?? false;
    const starRetro = planetRetro.get(starOfCsl) ?? false;
    const subRetro = planetRetro.get(subOfCsl) ?? false;

    const retroMatrixCase: KpDomainRuleEvaluation['retroMatrixCase'] = isCslNode
      ? 'Node Exception'
      : cslRetro && starRetro
      ? 'Retrograde in Retrograde Star (Denial)'
      : !cslRetro && starRetro
      ? 'Direct in Retrograde Star (Failure)'
      : cslRetro && !starRetro
      ? 'Retrograde in Direct Star (Delayed)'
      : 'Direct in Direct Star';

    // 3-Tier evaluation (Reader V L3902-3976): Planet -> Star -> Sub (deciding factor)
    const combined = Array.from(new Set([...cslStarHouses, ...cslSelfHouses, ...cslSubHouses]));
    const matchedFavourable = meta.fav.filter((h) => combined.includes(h));
    const matchedUnfavourable = meta.unfav.filter((h) => combined.includes(h));

    const favCount = matchedFavourable.length;
    const unfavCount = matchedUnfavourable.length;
    const starHasFav = meta.fav.some((h) => cslStarHouses.includes(h));
    const starHasUnfav = meta.unfav.some((h) => cslStarHouses.includes(h));
    const subFavCount = meta.fav.filter((h) => cslSubHouses.includes(h)).length;
    const subUnfavCount = meta.unfav.filter((h) => cslSubHouses.includes(h)).length;
    const subVeto = subUnfavCount > subFavCount;

    let verdict: KpDomainRuleEvaluation['verdict'] = 'Mixed / Conditional';
    let scorePct = 52;

    if (
      retroMatrixCase === 'Direct in Retrograde Star (Failure)' ||
      retroMatrixCase === 'Retrograde in Retrograde Star (Denial)'
    ) {
      verdict = 'Denial / Unfavourable';
      scorePct = retroMatrixCase === 'Retrograde in Retrograde Star (Denial)' ? 22 : 28;
    } else if (subVeto && unfavCount >= favCount) {
      verdict = 'Denial / Unfavourable';
      scorePct = Math.max(18, 36 - subUnfavCount * 5);
    } else if (starHasFav && favCount > unfavCount && !cslRetro && !subVeto) {
      verdict = 'Strong Yes';
      scorePct = Math.min(96, 74 + favCount * 5 + subFavCount * 3 - unfavCount * 5);
    } else if (
      favCount > unfavCount ||
      retroMatrixCase === 'Retrograde in Direct Star (Delayed)' ||
      (starHasFav && subVeto)
    ) {
      verdict = 'Favourable with Delay';
      scorePct = Math.max(46, 65 + favCount * 4 - unfavCount * 5 - (cslRetro ? 6 : 0) - (subVeto ? 5 : 0));
    } else if (unfavCount > favCount && starHasUnfav) {
      verdict = 'Denial / Unfavourable';
      scorePct = Math.max(12, 34 - unfavCount * 5);
    } else {
      verdict = 'Mixed / Conditional';
      scorePct = 50 + (favCount - unfavCount) * 5;
    }

    // Reader V & Times KP domain checks
    const readerVSpecialNotes: string[] = [];
    if (retroMatrixCase !== 'Direct in Direct Star') {
      readerVSpecialNotes.push(
        `Reader V 2x2 Matrix: ${retroMatrixCase}${
          retroMatrixCase === 'Direct in Retrograde Star (Failure)'
            ? ' -> No success while Star Lord remains retrograde (L6399)'
            : retroMatrixCase === 'Retrograde in Direct Star (Delayed)'
            ? ' -> Delayed until CSL stations direct past retrograde degree (L6402)'
            : ''
        }.`
      );
    }
    if (untenantedMap.get(csl)) {
      readerVSpecialNotes.push(`${csl} is UNTENANTED -> becomes self-strong prime significator (Reader V L10205).`);
    }
    if (planetHouse.get('Rahu') === 1) {
      const jupLon = planetKpLon.get('Jupiter')!;
      const rahuLon = planetKpLon.get('Rahu')!;
      const jupAspectsRahu = [120, 180, 240].some((d) => angularDiffDeg(normalizeDeg(jupLon + d), rahuLon) <= 8);
      readerVSpecialNotes.push(
        jupAspectsRahu
          ? 'Times KP L2941: Rahu in 1st is aspected by Jupiter (mitigated).'
          : 'Times KP L2941: Rahu in 1st clouds/spoils query clarity unless Jupiter aspects.'
      );
    }
    if (catId === 'marriage_relationship') {
      const cslSignIdx = Math.floor(planetKpLon.get(csl)! / 30) % 12;
      if (DUAL_SIGNS.includes(cslSignIdx) && combined.includes(9)) {
        readerVSpecialNotes.push('Reader V L7110: 7th CSL in Dual Sign + 9H connection indicates possibility of 2nd marriage / plural union.');
      }
    } else if (catId === 'pregnancy_children') {
      const c5Sign = cusps[4].signIndex;
      const signFruit = FRUITFUL_SIGNS_PRIMARY.includes(c5Sign)
        ? 'Primary Fruitful Sign'
        : FRUITFUL_SIGNS_SEMI.includes(c5Sign)
        ? 'Semi-Fruitful Sign'
        : BARREN_SIGNS.includes(c5Sign)
        ? 'Barren Sign'
        : 'Neutral Fertility Sign';
      readerVSpecialNotes.push(`Reader V L8629: 5th Cusp ${cusps[4].signName} is ${signFruit}.`);
      if (DUAL_SIGNS.includes(c5Sign) && (csl === 'Mercury' || csl === 'Jupiter' || starOfCsl === 'Mercury')) {
        readerVSpecialNotes.push('Reader V L8614: Dual 5th Cusp + Mercury/Jupiter link indicates Twins possibility.');
      }
    } else if (catId === 'promotion_transfer') {
      const hasTransfer = [3, 10, 12].every((h) => combined.includes(h));
      const hasPromotion = [2, 6, 10, 11].filter((h) => combined.includes(h)).length >= 3;
      if (hasTransfer) readerVSpecialNotes.push('Times KP: [3, 10, 12] Transfer combination active in 10th CSL chain.');
      if (hasPromotion) readerVSpecialNotes.push('Times KP: [2, 6, 10, 11] Promotion/Elevation combination strong.');
    } else if (catId === 'legal_litigation' || catId === 'travel_missing') {
      if ((planetHouse.get('Saturn') === 12 || planetHouse.get('Rahu') === 12) && [3, 8, 12].every((h) => combined.includes(h))) {
        readerVSpecialNotes.push('Times KP L4102: Saturn/Rahu in 12H with [3, 8, 12] -> high risk of confinement/sentence.');
      }
      if ([3, 9, 12].every((h) => combined.includes(h))) {
        readerVSpecialNotes.push('Times KP: [3, 9, 12] Overseas / Foreign Travel combination active.');
      }
    }

    let lostItemDetails: KpDomainRuleEvaluation['lostItemDetails'];
    if (catId === 'lost_stolen') {
      const cslSignIdx = Math.floor(planetKpLon.get(csl)! / 30) % 12;
      const signObj = SIGNS[cslSignIdx];
      const kpDirMap = { Fire: 'East', Earth: 'South', Air: 'West', Water: 'North' } as const;
      lostItemDetails = {
        kpDirection: kpDirMap[signObj.element],
        signElement: signObj.element,
        mobilityNote:
          signObj.modality === 'Movable'
            ? 'Movable sign -> Item likely moved away from original spot'
            : signObj.modality === 'Fixed'
            ? 'Fixed sign -> Item likely stationary / nearby'
            : 'Dual sign -> Nearby / transitional spot (inside storage or corridor)',
        retrogradeNote: cslRetro
          ? `2nd CSL (${csl}) is Retrograde -> Strong indication of eventual return after delay`
          : `2nd CSL (${csl}) is Direct`,
      };
    }

    const explanation =
      `Cusp ${meta.cusp} Sub-Lord is ${csl} (Star: ${starOfCsl}${starRetro ? ' [R]' : ''}, Sub: ${subOfCsl}${subRetro ? ' [R]' : ''}; Matrix: ${retroMatrixCase}). ` +
      `${starOfCsl} signifies [${cslStarHouses.join(', ') || 'None'}]; Sub ${subOfCsl} signifies [${cslSubHouses.join(', ') || 'None'}]; ${csl} signifies [${cslSelfHouses.join(', ') || 'None'}]. ` +
      `Matches Favourable [${matchedFavourable.join(', ') || 'None'}] vs Unfavourable [${matchedUnfavourable.join(', ') || 'None'}].`;

    return {
      category: catId,
      categoryLabel: catInfo.label,
      primaryCusp: meta.cusp,
      cuspSubLord: csl,
      cslRetrograde: cslRetro,
      starLordOfCsl: starOfCsl,
      starOfCslRetrograde: starRetro,
      subLordOfCsl: subOfCsl,
      subOfCslRetrograde: subRetro,
      cslStarHouses,
      cslSelfHouses,
      cslSubHouses,
      retroMatrixCase,
      readerVSpecialNotes,
      favourableHouses: meta.fav,
      unfavourableHouses: meta.unfav,
      matchedFavourable,
      matchedUnfavourable,
      verdict,
      scorePct,
      lostItemDetails,
      explanation,
      source: meta.source,
    };
  };

  const allCategoryEvaluations = QUESTION_CATEGORIES.map((q) => evalCategory(q.id));
  const domainEvaluation =
    allCategoryEvaluations.find((e) => e.category === chart.input.category) ??
    allCategoryEvaluations[0];

  return {
    kpAyanamsaDms: formatDms(kpAyan),
    cusps,
    planets,
    houseSignificators,
    rulingPlanets,
    nodeProxyAgents: nodeProxyItems,
    cleanRulingPlanets,
    nodeAgentsNote,
    electionalCheck,
    domainEvaluation,
    allCategoryEvaluations,
  };
}
