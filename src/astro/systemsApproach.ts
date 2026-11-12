import { NINE_GRAHAS, SA_FUNCTIONAL_MALEFICS, SA_MMP_BY_LAGNA, SIGNS } from './constants';
import { angularDiffDeg, formatDms, normalizeDeg } from './time';
import type { CastHoraryChart, NineGrahaId, PlanetPosition, QuestionCategory } from './types';

export interface SaHitDetail {
  sourcePlanet: NineGrahaId;
  sourceNature: 'FB' | 'FM';
  isMmp: boolean;
  aspectType: 'Conjunction' | '3rd Aspect' | '4th Aspect' | '5th Aspect' | '7th Aspect' | '8th Aspect' | '9th Aspect' | '10th Aspect';
  orbDeg: number;
  weightPct: number;
}

export interface SaPlanetProfile {
  planet: NineGrahaId;
  nature: 'FB' | 'FM';
  isMmp: boolean;
  saSignHouse: number;
  degInSign: number;
  ageState: 'Infancy' | 'Young/Adult' | 'Old Age';
  ageStrengthPct: number;
  isCombust: boolean;
  isDebilitated: boolean;
  isWeakInDusthana: boolean;
  isWeak: boolean;
  weaknessFlags: string[];
  hitsOnMepHouses: number[];
  fmAfflictionsReceived: SaHitDetail[];
  fbSupportsReceived: SaHitDetail[];
  netAfflictionPct: number;
}

export interface SaHouseMepStatus {
  house: number;
  signIndex: number;
  signName: string;
  lord: NineGrahaId;
  mepLongitude: number;
  mepDms: string;
  fmHits: SaHitDetail[];
  fbHits: SaHitDetail[];
  totalFmAfflictionPct: number;
  totalFbSupportPct: number;
  status: 'Afflicted' | 'Fortified' | 'Mixed' | 'Clean';
}

export interface SaPrimeDeterminantResult {
  category: QuestionCategory;
  primaryHouses: number[];
  naturalKarakas: NineGrahaId[];
  primePlanets: NineGrahaId[];
  notes: string;
}

export interface SaRemedialAdvice {
  kavachPlanets: { planet: NineGrahaId; reason: string }[];
  morningCharityPlanets: { planet: NineGrahaId; reason: string }[];
  sourceNote: string;
}

export interface BhriguNadiSummary {
  querentAge: number | null;
  nadiEntryNumber: number | null;
  formulaNote: string;
}

export interface SystemsApproachReport {
  mepDegInSign: number;
  mepDegFormatted: string;
  mmp: NineGrahaId;
  functionalMalefics: NineGrahaId[];
  functionalBenefics: NineGrahaId[];
  planetProfiles: SaPlanetProfile[];
  houseMepStatuses: SaHouseMepStatus[];
  primeDeterminant: SaPrimeDeterminantResult;
  missingPersonSeparationNote: string;
  remedies: SaRemedialAdvice;
  bhriguNadi: BhriguNadiSummary;
  saScorePct: number;
  saSummary: string;
}

export function calcSaOrbWeightPct(orbDeg: number): number {
  const d = Math.abs(orbDeg);
  if (d <= 1) return 100;
  if (d <= 2) return 80;
  if (d <= 3) return 60;
  if (d <= 4) return 40;
  if (d <= 5) return 20;
  return 0;
}

export function calcSaAgeStrength(degInSign: number): {
  state: 'Infancy' | 'Young/Adult' | 'Old Age';
  strengthPct: number;
} {
  const d = ((degInSign % 30) + 30) % 30;
  if (d < 5) {
    return { state: 'Infancy', strengthPct: Math.max(0, Math.round((d / 5) * 100)) };
  }
  if (d > 25) {
    return { state: 'Old Age', strengthPct: Math.max(0, Math.round(((30 - d) / 5) * 100)) };
  }
  return { state: 'Young/Adult', strengthPct: 100 };
}

function getSaAspectOffsets(planet: NineGrahaId): { housesForward: number; label: SaHitDetail['aspectType'] }[] {
  const aspects: { housesForward: number; label: SaHitDetail['aspectType'] }[] = [
    { housesForward: 0, label: 'Conjunction' },
    { housesForward: 6, label: '7th Aspect' },
  ];
  if (planet === 'Mars') {
    aspects.push({ housesForward: 3, label: '4th Aspect' }, { housesForward: 7, label: '8th Aspect' });
  } else if (planet === 'Jupiter') {
    aspects.push({ housesForward: 4, label: '5th Aspect' }, { housesForward: 8, label: '9th Aspect' });
  } else if (planet === 'Saturn') {
    aspects.push({ housesForward: 2, label: '3rd Aspect' }, { housesForward: 9, label: '10th Aspect' });
  } else if (planet === 'Rahu' || planet === 'Ketu') {
    // V.K. Choudhry L990-1035: Nodes aspect 5th, 7th, 9th & conjunction within 5 deg orb
    aspects.push({ housesForward: 4, label: '5th Aspect' }, { housesForward: 8, label: '9th Aspect' });
  }
  return aspects;
}

function findSaAspectHit(
  source: PlanetPosition,
  targetSidLon: number,
  functionalMalefics: NineGrahaId[],
  mmp: NineGrahaId
): SaHitDetail | null {
  const isFm = functionalMalefics.includes(source.id);
  const offsets = getSaAspectOffsets(source.id);
  let best: SaHitDetail | null = null;
  for (const asp of offsets) {
    const projectedLon = normalizeDeg(source.longitude + asp.housesForward * 30);
    const orbDeg = angularDiffDeg(projectedLon, targetSidLon);
    const weightPct = calcSaOrbWeightPct(orbDeg);
    if (weightPct > 0 && (!best || weightPct > best.weightPct)) {
      best = {
        sourcePlanet: source.id,
        sourceNature: isFm ? 'FM' : 'FB',
        isMmp: source.id === mmp,
        aspectType: asp.label,
        orbDeg: Number(orbDeg.toFixed(2)),
        weightPct,
      };
    }
  }
  return best;
}

const SA_PRIME_DETERMINANTS: Record<
  QuestionCategory,
  { houses: number[]; karakas: NineGrahaId[]; rationale: string }
> = {
  general_yes_no: { houses: [1, 9, 10, 11], karakas: ['Moon', 'Sun', 'Jupiter'], rationale: '1st MEP (self), 9th (fortune), 10th (action), 11th (gains)' },
  lost_stolen: { houses: [2, 4, 11, 7], karakas: ['Moon', 'Mercury'], rationale: '2nd/4th MEPs (valuables), 11th (recovery), 7th (other party)' },
  marriage_relationship: { houses: [7, 2, 11, 4], karakas: ['Venus', 'Jupiter'], rationale: '7th MEP (spouse/partnership), Venus (wife/harmony), Jupiter (husband/marital bliss)' },
  career_job: { houses: [10, 6, 2, 11], karakas: ['Sun', 'Saturn', 'Mercury'], rationale: '10th MEP (profession/authority), 6th (service), 2nd (income), Sun (status)' },
  promotion_transfer: { houses: [10, 3, 6, 11, 12], karakas: ['Sun', 'Jupiter'], rationale: '10th/11th MEPs (promotion), 3rd/12th (transfer/reassignment)' },
  finance_loan: { houses: [2, 6, 11, 7], karakas: ['Jupiter', 'Mercury', 'Venus'], rationale: '2nd/11th MEPs (wealth/cashflow), 6th (credit/debt), Jupiter/Mercury (commerce)' },
  property_vehicle: { houses: [4, 2, 11], karakas: ['Mars', 'Venus', 'Moon'], rationale: '4th MEP (property/home/vehicle), Mars (land), Venus (conveyance)' },
  medical_health: { houses: [1, 6, 8], karakas: ['Sun', 'Moon'], rationale: '1st MEP (vitality), 6th (acute recovery), 8th (chronicity), Sun/Moon (prana)' },
  legal_litigation: { houses: [6, 1, 10, 11], karakas: ['Mars', 'Sun'], rationale: '6th MEP (dispute/opponent), 1st/10th/11th (victory/tribunal favour)' },
  travel_missing: { houses: [1, 4, 9, 11, 12], karakas: ['Moon', 'Mercury'], rationale: '1st/4th MEP (safe return home), separating/applying orb vs MMP (L4158-4201)' },
  pregnancy_children: { houses: [5, 2, 9, 11], karakas: ['Jupiter'], rationale: '5th MEP (progeny), 9th (blessings), Jupiter (putrakaraka)' },
  education_exam: { houses: [4, 5, 9, 11], karakas: ['Mercury', 'Jupiter'], rationale: '4th/5th/9th MEPs (learning, intellect & higher study), Mercury & Jupiter' },
  blind_mook: { houses: [1, 4, 7, 10], karakas: ['Moon'], rationale: 'Ascendant & Kendra MEPs + strongest benefic/malefic affliction reveals unspoken worry' },
};

export function evaluateSystemsApproach(chart: CastHoraryChart): SystemsApproachReport {
  const lagnaIdx = chart.ascendantSignIndex;
  const mepDegInSign = Number((normalizeDeg(chart.ascendantSidereal) % 30).toFixed(4));
  const mepDegFormatted = formatDms(mepDegInSign);
  const functionalMalefics = [...(SA_FUNCTIONAL_MALEFICS[lagnaIdx] ?? ['Rahu', 'Ketu'])];
  const mmp: NineGrahaId = SA_MMP_BY_LAGNA[lagnaIdx] ?? 'Ketu';
  const functionalBenefics = NINE_GRAHAS.filter((p) => !functionalMalefics.includes(p));

  const pMap = new Map<NineGrahaId, PlanetPosition>();
  for (const p of chart.planets) pMap.set(p.id, p);

  // Build 12 House MEPs
  const houseMepStatuses: SaHouseMepStatus[] = Array.from({ length: 12 }, (_, idx) => {
    const house = idx + 1;
    const signIndex = (lagnaIdx + idx) % 12;
    const signInfo = SIGNS[signIndex];
    const mepLongitude = normalizeDeg(signIndex * 30 + mepDegInSign);
    const fmHits: SaHitDetail[] = [];
    const fbHits: SaHitDetail[] = [];

    for (const p of chart.planets) {
      const hit = findSaAspectHit(p, mepLongitude, functionalMalefics, mmp);
      if (hit) {
        if (hit.sourceNature === 'FM') fmHits.push(hit);
        else fbHits.push(hit);
      }
    }

    const totalFmAfflictionPct = fmHits.reduce((acc, h) => acc + h.weightPct, 0);
    const totalFbSupportPct = fbHits.reduce((acc, h) => acc + h.weightPct, 0);
    let status: SaHouseMepStatus['status'] = 'Clean';
    if (totalFmAfflictionPct > 0 && totalFbSupportPct > 0) status = 'Mixed';
    else if (totalFmAfflictionPct > 0) status = 'Afflicted';
    else if (totalFbSupportPct > 0) status = 'Fortified';

    return {
      house,
      signIndex,
      signName: signInfo.name,
      lord: signInfo.lord,
      mepLongitude,
      mepDms: `${signInfo.short} ${formatDms(mepDegInSign)}`,
      fmHits,
      fbHits,
      totalFmAfflictionPct,
      totalFbSupportPct,
      status,
    };
  });

  // Build 9 Graha Profiles
  const planetProfiles: SaPlanetProfile[] = chart.planets.map((p) => {
    const nature: 'FB' | 'FM' = functionalMalefics.includes(p.id) ? 'FM' : 'FB';
    const isMmp = p.id === mmp;
    const saSignHouse = ((p.signIndex - lagnaIdx + 12) % 12) + 1;
    const age = calcSaAgeStrength(p.degInSign);
    const isWeakInDusthana = [6, 8, 12].includes(saSignHouse);
    const isDebilitated = p.dignity === 'Debilitated';

    const fmAfflictionsReceived: SaHitDetail[] = [];
    const fbSupportsReceived: SaHitDetail[] = [];
    for (const other of chart.planets) {
      if (other.id === p.id) continue;
      const hit = findSaAspectHit(other, p.longitude, functionalMalefics, mmp);
      if (hit) {
        if (hit.sourceNature === 'FM') fmAfflictionsReceived.push(hit);
        else fbSupportsReceived.push(hit);
      }
    }

    const hitsOnMepHouses = houseMepStatuses
      .filter((hm) => [...hm.fmHits, ...hm.fbHits].some((h) => h.sourcePlanet === p.id))
      .map((hm) => hm.house);

    const weaknessFlags: string[] = [];
    if (age.state !== 'Young/Adult') weaknessFlags.push(`${age.state} (${age.strengthPct}%)`);
    if (p.isCombust) weaknessFlags.push('Combust');
    if (isDebilitated) weaknessFlags.push('Debilitated');
    if (isWeakInDusthana) weaknessFlags.push(`Dusthana ${saSignHouse}H`);
    if (fmAfflictionsReceived.length > 0) {
      weaknessFlags.push(`FM/MMP hit (${fmAfflictionsReceived.map((x) => `${x.sourcePlanet} ${x.weightPct}%`).join(', ')})`);
    }

    const netAfflictionPct = fmAfflictionsReceived.reduce((acc, h) => acc + h.weightPct, 0);
    const isWeak =
      age.strengthPct < 60 ||
      p.isCombust ||
      isDebilitated ||
      isWeakInDusthana ||
      netAfflictionPct >= 60;

    return {
      planet: p.id,
      nature,
      isMmp,
      saSignHouse,
      degInSign: Number(p.degInSign.toFixed(2)),
      ageState: age.state,
      ageStrengthPct: age.strengthPct,
      isCombust: p.isCombust,
      isDebilitated,
      isWeakInDusthana,
      isWeak,
      weaknessFlags,
      hitsOnMepHouses,
      fmAfflictionsReceived,
      fbSupportsReceived,
      netAfflictionPct,
    };
  });

  // Evaluate Prime Determinants for Query Category
  const catMeta = SA_PRIME_DETERMINANTS[chart.input.category] ?? SA_PRIME_DETERMINANTS.general_yes_no;
  const primaryHouses = catMeta.houses;
  const houseLords = primaryHouses.map((h) => {
    const signIdx = (lagnaIdx + h - 1) % 12;
    return SIGNS[signIdx].lord;
  });
  const primePlanets = Array.from(new Set<NineGrahaId>([...houseLords, ...catMeta.karakas]));
  const profileMap = new Map(planetProfiles.map((pr) => [pr.planet, pr]));

  let scoreSum = 0;
  let scoreWeight = 0;

  for (const h of primaryHouses) {
    const hm = houseMepStatuses[h - 1];
    const hScore = Math.max(5, Math.min(100, 75 - hm.totalFmAfflictionPct * 0.45 + hm.totalFbSupportPct * 0.25));
    const w = h === primaryHouses[0] ? 2 : 1;
    scoreSum += hScore * w;
    scoreWeight += w;
  }

  for (const pp of primePlanets) {
    const prof = profileMap.get(pp);
    if (!prof) continue;
    let pScore = prof.ageStrengthPct;
    if (prof.isCombust) pScore -= 25;
    if (prof.isDebilitated) pScore -= 25;
    if (prof.isWeakInDusthana) pScore -= 20;
    pScore -= Math.min(50, prof.netAfflictionPct * 0.4);
    pScore += Math.min(20, prof.fbSupportsReceived.reduce((s, f) => s + f.weightPct * 0.2, 0));
    pScore = Math.max(5, Math.min(100, pScore));
    const w = pp === houseLords[0] ? 2 : 1;
    scoreSum += pScore * w;
    scoreWeight += w;
  }

  const saScorePct = Math.round(scoreWeight > 0 ? scoreSum / scoreWeight : 65);

  // Missing Person Separating vs Applying Orb vs MMP (L4158-4201)
  const ascLord = SIGNS[lagnaIdx].lord;
  const ascLordPos = pMap.get(ascLord)!;
  const mmpPos = pMap.get(mmp)!;
  let missingPersonSeparationNote = `Primary Lagna Lord ${ascLord} vs MMP ${mmp}: no close conjunction/opposition orb.`;
  if (ascLord !== mmp) {
    const orbMmp = findSaAspectHit(mmpPos, ascLordPos.longitude, functionalMalefics, mmp);
    if (orbMmp) {
      const lagnaFastAhead = normalizeDeg(ascLordPos.longitude) % 30 > normalizeDeg(mmpPos.longitude) % 30;
      missingPersonSeparationNote = lagnaFastAhead
        ? `${ascLord} has already separated slightly (${orbMmp.orbDeg}°, ${orbMmp.weightPct}%) from MMP ${mmp} (${orbMmp.aspectType}) -> favours voluntary departure / waning crisis (Choudhry L4158-4201).`
        : `${ascLord} is applying toward MMP ${mmp} (${orbMmp.aspectType}, ${orbMmp.orbDeg}°, ${orbMmp.weightPct}%) -> indicates acute stress/external restraint needing propitiation.`;
    }
  } else {
    missingPersonSeparationNote = `Lagna Lord ${ascLord} itself acts as MMP for ${SIGNS[lagnaIdx].name} Lagna (avoid strengthening ${ascLord}; prioritize Moon & 4H/11H FBs).`;
  }

  // Chapter 8 Remedies: Kavach (weak FBs only) & Morning Charity (afflicting FMs/MMP only)
  const kavachPlanets = planetProfiles
    .filter((pr) => pr.nature === 'FB' && (pr.isWeak || primePlanets.includes(pr.planet)))
    .sort((a, b) => (b.isWeak ? 1 : 0) - (a.isWeak ? 1 : 0) || a.ageStrengthPct - b.ageStrengthPct)
    .slice(0, 3)
    .map((pr) => ({
      planet: pr.planet,
      reason:
        pr.weaknessFlags.length > 0
          ? `Weak Functional Benefic (${pr.weaknessFlags.join('; ')})`
          : `Prime Functional Benefic supporting houses (${pr.nature})`,
    }));

  const fmPriority = planetProfiles
    .filter((pr) => pr.nature === 'FM' && (pr.isMmp || pr.hitsOnMepHouses.length > 0))
    .sort((a, b) => (b.isMmp ? 1 : 0) - (a.isMmp ? 1 : 0) || b.hitsOnMepHouses.length - a.hitsOnMepHouses.length)
    .slice(0, 3);

  const morningCharityPlanets =
    fmPriority.length > 0
      ? fmPriority.map((pr) => ({
          planet: pr.planet,
          reason: `${pr.isMmp ? 'Most Malefic Planet (MMP)' : 'Functional Malefic'} hitting MEP houses [${pr.hitsOnMepHouses.join(', ') || 'Chart'}]`,
        }))
      : [{ planet: mmp, reason: `Primary MMP for ${SIGNS[lagnaIdx].name} Lagna (default morning propitiation)` }];

  // Bhrigu Prashna Nadi (107 - age)
  let bhriguNadi: BhriguNadiSummary;
  if (chart.input.querentAge !== undefined && Number.isFinite(chart.input.querentAge) && chart.input.querentAge >= 0) {
    const age = Math.min(106, Math.max(0, Math.floor(chart.input.querentAge)));
    const entry = 107 - age;
    bhriguNadi = {
      querentAge: age,
      nadiEntryNumber: entry,
      formulaNote: `Bhrigu Prashna Nadi (R.G. Rao L30-53): 107 - ${age} = Entry #${entry} (1..107 age-remainder series).`,
    };
  } else {
    bhriguNadi = {
      querentAge: null,
      nadiEntryNumber: null,
      formulaNote: 'Enter optional Querent Age (0..106) to compute R.G. Rao Bhrigu Prashna Nadi index (107 - age).',
    };
  }

  const weakPrimeList = primePlanets
    .map((p) => profileMap.get(p))
    .filter((p): p is SaPlanetProfile => Boolean(p && p.isWeak))
    .map((p) => `${p.planet} [${p.weaknessFlags.slice(0, 2).join(', ')}]`);

  const afflictedMepList = primaryHouses
    .map((h) => houseMepStatuses[h - 1])
    .filter((hm) => hm.totalFmAfflictionPct > 0)
    .map((hm) => `H${hm.house} (${hm.totalFmAfflictionPct}% FM)`);

  const saSummary = `${SIGNS[lagnaIdx].name} Lagna · MEP ${mepDegFormatted} · MMP ${mmp}. Prime houses [${primaryHouses.join(', ')}] score ${saScorePct}%.${
    afflictedMepList.length ? ` MEP affliction on ${afflictedMepList.join(', ')}.` : ' Target MEPs free of close FM orbs.'
  }${weakPrimeList.length ? ` Weak prime factors: ${weakPrimeList.join('; ')}.` : ''}`;

  return {
    mepDegInSign,
    mepDegFormatted,
    mmp,
    functionalMalefics,
    functionalBenefics,
    planetProfiles,
    houseMepStatuses,
    primeDeterminant: {
      category: chart.input.category,
      primaryHouses,
      naturalKarakas: catMeta.karakas,
      primePlanets,
      notes: catMeta.rationale,
    },
    missingPersonSeparationNote,
    remedies: {
      kavachPlanets,
      morningCharityPlanets,
      sourceNote: 'V.K. Choudhry Prasna Application Ch. 8 (L1578-1615): Strengthen FBs only via Kavach; propitiate FMs/MMP via morning charity only.',
    },
    bhriguNadi,
    saScorePct,
    saSummary,
  };
}
