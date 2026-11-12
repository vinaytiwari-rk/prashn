import { SEVEN_PLANETS, SIGNS } from './constants';
import type {
  CastHoraryChart,
  NineGrahaId,
  PlanetPosition,
  SevenPlanetId,
} from './types';

export interface ClassicalRuleSignal {
  key: string;
  label: string;
  favourable: boolean | 'neutral';
  detail: string;
}

export interface ClassicalPrashnaBundle {
  lagnaTraits: {
    udayaType: 'Shirshodaya' | 'Prishtodaya' | 'Ubhayodaya';
    udayaFavourable: boolean | 'neutral';
    bodyType: 'Biped' | 'Quadruped' | 'Watery / Creeping';
    genderSign: 'Male (Odd)' | 'Female (Even)';
    sunOrientation: 'Upward-Looking (Growth)' | 'Downward-Looking (Caution)' | 'Sideways-Looking (Mixed)';
    aspectsOnLagnaBenefics: NineGrahaId[];
    aspectsOnLagnaMalefics: NineGrahaId[];
    occupantsInLagna: NineGrahaId[];
    occupantsIn7th: NineGrahaId[];
  };
  degreeOfSuccess: {
    pct: 0 | 25 | 50 | 75 | 85 | 100;
    basis: string;
  };
  maranaKarakaAlerts: string[];
  disputeEdge: {
    querentScore: number;
    opponentScore: number;
    winner: 'Querent' | 'Opponent' | 'Long Balanced Contest';
    summary: string;
  };
  marriageCues: ClassicalRuleSignal[];
  illnessCues: ClassicalRuleSignal[];
  travelerCues: {
    signals: ClassicalRuleSignal[];
    strongestPlanet: SevenPlanetId;
    signsFromLagna: number;
    navamsaMultiplier: 1 | 2 | 3;
    navamsaModality: string;
    estimatedReturnMonths: number;
    returnSummary: string;
  };
  theftCues: {
    drekkanaSpot: string;
    insideOrOutsider: string;
    signals: ClassicalRuleSignal[];
  };
  careerCues: ClassicalRuleSignal[];
  dailyQueryNote: string | null;
  timingFormula: {
    lagnaToMoonDays: number;
    navamsaNumber: number;
    navamsaSignName: string;
    navamsaLord: SevenPlanetId;
    navamsaUnitLabel: string;
    navamsaEstimateSummary: string;
  };
}

const MARANA_KARAKA_HOUSE: Partial<Record<NineGrahaId, number>> = {
  Sun: 12,
  Moon: 8,
  Mars: 7,
  Mercury: 7,
  Jupiter: 3,
  Venus: 6,
  Saturn: 1,
  Rahu: 9,
};

function parashariAspectsHouse(fromHouse: number, planet: NineGrahaId, targetHouse: number): boolean {
  const diff = ((targetHouse - fromHouse + 12) % 12) + 1;
  if (diff === 7) return true;
  if (planet === 'Mars' && (diff === 4 || diff === 8)) return true;
  if (planet === 'Jupiter' && (diff === 5 || diff === 9)) return true;
  if (planet === 'Saturn' && (diff === 3 || diff === 10)) return true;
  return false;
}

function isFullMoonPhase(tithiNumber: number): boolean {
  // Shukla 11 (11) through Krishna 5 (20)
  return tithiNumber >= 11 && tithiNumber <= 20;
}

function isWaxingMoon(tithiNumber: number): boolean {
  return tithiNumber >= 4 && tithiNumber <= 20;
}

function isNaturalMaleficInChart(
  planet: PlanetPosition,
  allPlanets: PlanetPosition[],
  tithiNumber: number
): boolean {
  if (planet.id === 'Sun' || planet.id === 'Mars' || planet.id === 'Saturn' || planet.id === 'Rahu' || planet.id === 'Ketu') {
    return true;
  }
  if (planet.id === 'Moon') {
    return !isWaxingMoon(tithiNumber);
  }
  if (planet.id === 'Mercury') {
    return allPlanets.some(
      (other) =>
        other.id !== 'Mercury' &&
        other.houseWholeSign === planet.houseWholeSign &&
        ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'].includes(other.id)
    );
  }
  return false;
}

function planetStrengthScore(p: PlanetPosition): number {
  let score = 40;
  if (p.dignity === 'Exalted') score += 45;
  else if (p.dignity === 'Moolatrikona') score += 36;
  else if (p.dignity === 'Own Sign') score += 32;
  else if (p.dignity === 'Great Friend') score += 24;
  else if (p.dignity === 'Friend') score += 14;
  else if (p.dignity === 'Enemy') score -= 12;
  else if (p.dignity === 'Great Enemy') score -= 22;
  else if (p.dignity === 'Debilitated') score -= 35;

  if ([1, 4, 7, 10].includes(p.houseWholeSign)) score += 16;
  else if ([5, 9].includes(p.houseWholeSign)) score += 12;
  else if ([3, 11].includes(p.houseWholeSign)) score += 6;
  else if ([6, 8, 12].includes(p.houseWholeSign)) score -= 14;

  if (p.isVargottama) score += 10;
  if (p.isCombust) score -= 24;
  if (p.isRetrograde && p.id !== 'Rahu' && p.id !== 'Ketu') score += 6;
  return score;
}

function getNavamsaTimingScale(lord: SevenPlanetId, count: number): { unit: string; readable: string } {
  switch (lord) {
    case 'Sun':
      return {
        unit: '6 Months (Ayana) per unit',
        readable: `${count * 6} month${count * 6 > 1 ? 's' : ''} (${count} half-year cycle${count > 1 ? 's' : ''})`,
      };
    case 'Moon':
      return {
        unit: 'Minutes / Immediate hours',
        readable: `${count * 48} minutes (same day / very fast)`,
      };
    case 'Mars':
      return {
        unit: 'Days',
        readable: `${count} day${count > 1 ? 's' : ''}`,
      };
    case 'Mercury':
      return {
        unit: '2-Month Seasons',
        readable: `${count * 2} month${count * 2 > 1 ? 's' : ''} (${count} season${count > 1 ? 's' : ''})`,
      };
    case 'Jupiter':
      return {
        unit: 'Months',
        readable: `${count} month${count > 1 ? 's' : ''}`,
      };
    case 'Venus': {
      const days = count * 15;
      const months = (count / 2).toFixed(count % 2 === 0 ? 0 : 1);
      return {
        unit: 'Fortnights (15-day cycles)',
        readable: `${count} fortnight${count > 1 ? 's' : ''} (~${days} days / ${months} month${count > 2 ? 's' : ''})`,
      };
    }
    case 'Saturn':
      return {
        unit: 'Years',
        readable: `${count} year${count > 1 ? 's' : ''}`,
      };
  }
}

export function evaluateClassicalPrashnaRules(chart: CastHoraryChart): ClassicalPrashnaBundle {
  const byId = new Map<NineGrahaId, PlanetPosition>();
  for (const p of chart.planets) byId.set(p.id, p);

  const ascSign = SIGNS[chart.ascendantSignIndex];
  const ascLord = ascSign.lord;
  const ascDeg = chart.ascendantSidereal % 30;
  const tithi = chart.panchanga.tithiNumber;

  const moon = byId.get('Moon')!;
  const sun = byId.get('Sun')!;
  const mars = byId.get('Mars')!;
  const mercury = byId.get('Mercury')!;
  const jupiter = byId.get('Jupiter')!;
  const venus = byId.get('Venus')!;

  // 1. Body form with exact half-sign Sagittarius & Capricorn split
  let bodyType: ClassicalPrashnaBundle['lagnaTraits']['bodyType'] = ascSign.bodyForm;
  if (ascSign.index === 8) {
    bodyType = ascDeg < 15 ? 'Biped' : 'Quadruped';
  } else if (ascSign.index === 9) {
    bodyType = ascDeg < 15 ? 'Quadruped' : 'Watery / Creeping';
  }

  // 2. Orientation relative to Sun (4/8/12 Urdhwa, 1/5/9 Adho, 2/6/10 Tiryak)
  const houseDiffFromSun = ((chart.ascendantSignIndex - sun.signIndex + 12) % 12) + 1;
  let sunOrientation: ClassicalPrashnaBundle['lagnaTraits']['sunOrientation'] = 'Sideways-Looking (Mixed)';
  if ([4, 8, 12].includes(houseDiffFromSun)) {
    sunOrientation = 'Upward-Looking (Growth)';
  } else if ([1, 5, 9].includes(houseDiffFromSun)) {
    sunOrientation = 'Downward-Looking (Caution)';
  }

  // 3. Occupants & Aspects on 1st & 7th House
  const occ1 = chart.planets.filter((p) => p.houseWholeSign === 1);
  const occ7 = chart.planets.filter((p) => p.houseWholeSign === 7);

  const aspectsOnLagnaBenefics: NineGrahaId[] = [];
  const aspectsOnLagnaMalefics: NineGrahaId[] = [];
  for (const p of chart.planets) {
    if (p.houseWholeSign !== 1 && parashariAspectsHouse(p.houseWholeSign, p.id, 1)) {
      if (isNaturalMaleficInChart(p, chart.planets, tithi)) {
        aspectsOnLagnaMalefics.push(p.id);
      } else {
        aspectsOnLagnaBenefics.push(p.id);
      }
    }
  }

  const beneficsConnectedTo1H = Array.from(
    new Set([
      ...occ1.filter((p) => !isNaturalMaleficInChart(p, chart.planets, tithi)).map((p) => p.id),
      ...aspectsOnLagnaBenefics,
    ])
  );
  const maleficsConnectedTo1H = Array.from(
    new Set([
      ...occ1.filter((p) => isNaturalMaleficInChart(p, chart.planets, tithi)).map((p) => p.id),
      ...aspectsOnLagnaMalefics,
    ])
  );
  const maleficsIn7H = occ7.filter((p) => isNaturalMaleficInChart(p, chart.planets, tithi));
  const beneficsIn7H = occ7.filter((p) => !isNaturalMaleficInChart(p, chart.planets, tithi));

  const lordAspectingOrInLagna =
    byId.get(ascLord)!.houseWholeSign === 1 ||
    parashariAspectsHouse(byId.get(ascLord)!.houseWholeSign, ascLord, 1);

  // 4. Classical Degree of Success (0, 25, 50, 75, 85, 100%)
  const strongMaleficIn7 = maleficsIn7H.some((p) => !p.isCombust && p.dignity !== 'Debilitated');
  let degreePct: 0 | 25 | 50 | 75 | 85 | 100 = 25;
  let degreeBasis = 'Baseline Rising Sign influence only.';

  const hasJup = beneficsConnectedTo1H.includes('Jupiter');
  const hasVenOrMerc = beneficsConnectedTo1H.includes('Venus') || beneficsConnectedTo1H.includes('Mercury');
  const hasMoon = beneficsConnectedTo1H.includes('Moon');

  if (
    strongMaleficIn7 &&
    occ1.some((p) => !isNaturalMaleficInChart(p, chart.planets, tithi)) &&
    chart.input.category === 'legal_litigation'
  ) {
    degreePct = 0;
    degreeBasis = 'Benefic in House 1 facing a strong opposing force in House 7 favors the rival side.';
  } else if (lordAspectingOrInLagna && hasJup && hasVenOrMerc && hasMoon) {
    degreePct = 100;
    degreeBasis = `Rising Sign lord (${ascLord}) supports House 1 alongside Jupiter, Venus/Mercury, and bright Moon.`;
  } else if (lordAspectingOrInLagna && beneficsConnectedTo1H.length >= 2) {
    degreePct = 85;
    degreeBasis = `Rising Sign lord (${ascLord}) and two natural benefics (${beneficsConnectedTo1H.slice(0, 2).join(', ')}) strengthen House 1.`;
  } else if (lordAspectingOrInLagna && beneficsConnectedTo1H.length >= 1) {
    degreePct = 75;
    degreeBasis = `Rising Sign lord (${ascLord}) and benefic ${beneficsConnectedTo1H[0]} support House 1.`;
  } else if (lordAspectingOrInLagna) {
    degreePct = 50;
    degreeBasis = `Rising Sign lord (${ascLord}) directly occupies or aspects House 1.`;
  } else if (beneficsConnectedTo1H.length >= 1) {
    degreePct = 25;
    degreeBasis = `One benefic (${beneficsConnectedTo1H[0]}) supports House 1 without the Rising Sign lord's aspect.`;
  } else if (maleficsConnectedTo1H.length > 0 && strongMaleficIn7) {
    degreePct = 0;
    degreeBasis = 'Heavy resistance on House 1 and House 7 without benefic protection.';
  }

  // 5. Marana Karaka Sthana alerts
  const maranaKarakaAlerts: string[] = [];
  for (const p of chart.planets) {
    const mksHouse = MARANA_KARAKA_HOUSE[p.id];
    if (mksHouse && p.houseWholeSign === mksHouse) {
      maranaKarakaAlerts.push(
        `${p.id} sits in a stressful resting zone (House ${mksHouse}), softening its natural ease.`
      );
    }
  }

  // 6. Disputes, Litigation & Fights (Inverted 1st vs 7th malefic rule)
  const maleficsIn1H = occ1.filter((p) => isNaturalMaleficInChart(p, chart.planets, tithi));
  let qScore = 50;
  let oScore = 50;
  const disputeNotes: string[] = [];

  for (const m1 of maleficsIn1H) {
    if (m1.isCombust || m1.dignity === 'Debilitated') {
      oScore += 22;
      disputeNotes.push(`${m1.id} on your side (House 1) is weakened (${m1.isCombust ? 'combust' : 'debilitated'}), reducing leverage.`);
    } else {
      qScore += 26;
      disputeNotes.push(`${m1.id} in House 1 gives assertive strength and tactical upper hand to you.`);
    }
  }
  for (const m7 of maleficsIn7H) {
    if (m7.isCombust || m7.dignity === 'Debilitated') {
      qScore += 12;
      disputeNotes.push(`Opponent's assertive planet (${m7.id} in House 7) lacks real teeth.`);
    } else {
      oScore += 26;
      disputeNotes.push(`${m7.id} in House 7 gives strong pushback to the opposing side.`);
    }
  }
  if (maleficsIn1H.length > 0 && maleficsIn7H.length > 0) {
    const str1 = Math.max(...maleficsIn1H.map(planetStrengthScore));
    const str7 = Math.max(...maleficsIn7H.map(planetStrengthScore));
    if (str1 > str7) qScore += 14;
    else if (str7 > str1) oScore += 14;
    disputeNotes.push('Both sides hold assertive planets — expect a stretched contest where steadier stamina wins.');
  }
  if (beneficsIn7H.length > 0 && maleficsIn1H.length === 0) {
    qScore += 12;
    disputeNotes.push('Gentle planets on the opponent side make them more open to compromise or yielding.');
  }
  if (aspectsOnLagnaBenefics.length > 0) {
    qScore += 16;
    disputeNotes.push(`Protective aspect from ${aspectsOnLagnaBenefics.join(', ')} shields your position.`);
  }
  if (aspectsOnLagnaMalefics.length > 0) {
    oScore += 16;
    disputeNotes.push(`Direct pressure from ${aspectsOnLagnaMalefics.join(', ')} onto House 1 calls for careful preparation.`);
  }

  const disputeWinner =
    qScore - oScore >= 10 ? 'Querent' : oScore - qScore >= 10 ? 'Opponent' : 'Long Balanced Contest';

  // 7. Marriage Cues
  const marriageCues: ClassicalRuleSignal[] = [];
  if (moon.houseWholeSign === 7 && parashariAspectsHouse(jupiter.houseWholeSign, 'Jupiter', 7)) {
    marriageCues.push({
      key: 'moon_7_jup',
      label: 'Moon in House 7 Blessed by Jupiter',
      favourable: true,
      detail: 'Strong sign that marriage negotiations move ahead soon with elders’ blessings.',
    });
  }
  if (moon.houseWholeSign === 1 && parashariAspectsHouse(venus.houseWholeSign, 'Venus', 1)) {
    marriageCues.push({
      key: 'moon_1_venus_7',
      label: 'Moon in House 1 Connected with Venus',
      favourable: true,
      detail: 'Warm romantic/marital attraction speeds up engagement or union.',
    });
  }
  if (moon.houseWholeSign === 1 && aspectsOnLagnaMalefics.length > 0) {
    marriageCues.push({
      key: 'moon_1_mal',
      label: 'Moon in House 1 Under Pressure',
      favourable: false,
      detail: 'Marriage proposal may face hesitation, cold feet, or timing delays.',
    });
  }
  const has17Malefics = maleficsIn1H.length > 0 && maleficsIn7H.length > 0;
  const hasMars7AndSoft1 = mars.houseWholeSign === 7 && [moon.houseWholeSign, venus.houseWholeSign, mercury.houseWholeSign].includes(1);
  if (has17Malefics || hasMars7AndSoft1 || sun.houseWholeSign === 7) {
    marriageCues.push({
      key: 'marriage_harmony_care',
      label: 'Post-Marriage Health & Harmony Care',
      favourable: false,
      detail: 'Friction between the partner house and House 1 advises patience, compatibility checks, and peace remedies before committing.',
    });
  }

  // 8. Illness & Recovery Cues
  const illnessCues: ClassicalRuleSignal[] = [];
  const fullMoon = isFullMoonPhase(tithi);
  if (occ1.some((p) => !isNaturalMaleficInChart(p, chart.planets, tithi) && planetStrengthScore(p) >= 60)) {
    illnessCues.push({
      key: 'strong_benefic_1h',
      label: 'Strong Protective Planet in House 1',
      favourable: true,
      detail: 'Vitality recovers well and treatment responds positively.',
    });
  }
  if (moon.houseWholeSign === 1 && fullMoon && parashariAspectsHouse(jupiter.houseWholeSign, 'Jupiter', 1)) {
    illnessCues.push({
      key: 'full_moon_1h_jup',
      label: 'Bright Moon Blessed by Jupiter',
      favourable: true,
      detail: 'Prompt recovery and relief from symptoms is strongly supported.',
    });
  }
  if (
    (moon.houseWholeSign === 1 && maleficsIn7H.length > 0) ||
    (sun.houseWholeSign === 1 && moon.houseWholeSign === 7) ||
    (moon.houseWholeSign === 1 && sun.houseWholeSign === 7) ||
    ((moon.houseWholeSign === 1 || mercury.houseWholeSign === 1) && aspectsOnLagnaMalefics.length > 0)
  ) {
    illnessCues.push({
      key: 'illness_diligent_care',
      label: 'Stubborn Symptoms — Consistent Care Needed',
      favourable: false,
      detail: 'Close tension between vitality and recovery houses recommends prompt doctor follow-ups and supportive remedies.',
    });
  }

  // 9. Traveler Safe & Exact Return Months Formula
  const travSignals: ClassicalRuleSignal[] = [];
  if (maleficsIn1H.some((p) => !p.isCombust && p.dignity !== 'Debilitated')) {
    travSignals.push({
      key: 'trav_strong_mal_1',
      label: 'Firm Resilience in House 1',
      favourable: true,
      detail: 'Person is safe, independent, and not stuck against their will.',
    });
  }
  if (maleficsIn7H.length > 0) {
    travSignals.push({
      key: 'trav_mal_7',
      label: 'Roadblock in Travel Return House (7th)',
      favourable: false,
      detail: 'Travel restrictions, schedule blocks, or stressful delays may slow return.',
    });
  }
  const occ6 = chart.planets.filter((p) => p.houseWholeSign === 6);
  const occ8 = chart.planets.filter((p) => p.houseWholeSign === 8);
  if (occ6.length > 0 && occ8.length > 0) {
    const durdharaBenefics = [...occ6, ...occ8].every((p) => !isNaturalMaleficInChart(p, chart.planets, tithi));
    travSignals.push({
      key: 'durdhara_7th',
      label: 'Surrounded Return Path (6th & 8th Houses Active)',
      favourable: durdharaBenefics ? 'neutral' : false,
      detail: durdharaBenefics
        ? 'Delayed happily because friends, hosts, or pleasant commitments keep them occupied.'
        : 'Held up by practical hurdles, health tiredness, or uncooperative surroundings.',
    });
  }

  // Strongest planet among the 7 planets -> sign distance * navamsa modality multiplier
  let strongestPlanet: SevenPlanetId = 'Jupiter';
  let bestStrength = -999;
  for (const pid of SEVEN_PLANETS) {
    const p = byId.get(pid)!;
    const sc = planetStrengthScore(p);
    if (sc > bestStrength) {
      bestStrength = sc;
      strongestPlanet = pid;
    }
  }
  const strongestPos = byId.get(strongestPlanet)!;
  const signsFromLagna = strongestPos.houseWholeSign;
  const navSign = SIGNS[strongestPos.navamsaSignIndex];
  const navamsaMultiplier: 1 | 2 | 3 =
    navSign.modality === 'Movable' ? 1 : navSign.modality === 'Fixed' ? 2 : 3;
  const estimatedReturnMonths = signsFromLagna * navamsaMultiplier;

  // 10. Theft / Lost Article Rules
  const drekkanaSpot =
    chart.panchanga.lunarMicroStates.ascDrekkanaIndex === 1
      ? 'Main entrance, doorway, foyer, shoe/bag drop zone, or front gate'
      : chart.panchanga.lunarMicroStates.ascDrekkanaIndex === 2
      ? 'Inside main living rooms, central shelves, table drawers, or middle area of the home'
      : 'Backyard, rear storage, balcony, utility area, or back room';

  const insideOrOutsider =
    ascSign.modality === 'Fixed' && chart.isAscVargottama
      ? 'Very high chance the item is still inside or moved by a familiar household/known contact.'
      : ascSign.modality === 'Fixed'
      ? 'Item has likely not gone far from home or the original spot.'
      : ascSign.modality === 'Movable'
      ? 'Higher chance it moved outward or passed to an outsider.'
      : 'Mixed movement — check both nearby bags/vehicles and recent transit spots.';

  const theftSignals: ClassicalRuleSignal[] = [];
  if (
    ascSign.udaya === 'Shirshodaya' &&
    ((moon.houseWholeSign === 1 && fullMoon) || occ1.some((p) => !isNaturalMaleficInChart(p, chart.planets, tithi)))
  ) {
    theftSignals.push({
      key: 'theft_seersho_rec',
      label: 'Head-Rising Sign with Bright Support',
      favourable: true,
      detail: 'Lost or misplaced item looks strongly recoverable soon.',
    });
  }
  if (
    occ1.some((p) => !isNaturalMaleficInChart(p, chart.planets, tithi)) &&
    occ7.some((p) => !isNaturalMaleficInChart(p, chart.planets, tithi))
  ) {
    theftSignals.push({
      key: 'theft_1_7_ben',
      label: 'Gentle Planets in Both House 1 & House 7',
      favourable: true,
      detail: 'Clear sign of peaceful recovery or finding what went missing.',
    });
  }

  // 11. Career & Promotion Cues
  const careerCues: ClassicalRuleSignal[] = [];
  if (byId.get(ascLord)!.houseWholeSign === 1) {
    careerCues.push({
      key: 'own_lord_lagna',
      label: 'Rising Sign Lord Seated in House 1',
      favourable: true,
      detail: 'Strong indicator of gaining a job, promotion, or respected role.',
    });
  }
  if (ascSign.modality === 'Fixed' && beneficsConnectedTo1H.length > 0) {
    careerCues.push({
      key: 'fixed_ben_career',
      label: 'Fixed Sign with Supportive Planet',
      favourable: true,
      detail: 'Indicates steady employment and securing a desired position.',
    });
  }
  if (ascSign.udaya === 'Shirshodaya' && occ1.some((p) => !isNaturalMaleficInChart(p, chart.planets, tithi))) {
    careerCues.push({
      key: 'seersho_ben_career',
      label: 'Clear Forward Career Momentum',
      favourable: true,
      detail: 'Strongly favours landing the role or winning recognition.',
    });
  }
  if (venus.houseWholeSign === 7) {
    const withBen7 = beneficsIn7H.some((p) => p.id !== 'Venus');
    const withMal7 = maleficsIn7H.length > 0;
    careerCues.push({
      key: 'venus_7_job',
      label: 'Venus in Partnership / Offer House (7th)',
      favourable: true,
      detail: withBen7
        ? 'You secure the desired role smoothly and happily.'
        : withMal7
        ? 'You get the position after sharp competition and effort.'
        : 'Favours securing the job offer or work partnership.',
    });
  }

  // 12. Daily General Query
  const dailyQueryNote =
    moon.houseWholeSign === 1 || moon.houseWholeSign === 7
      ? 'Moon in the 1st or 7th house supports a pleasant, smoother day overall.'
      : null;

  // 13. Timing Rules: Lagna-to-Moon Days + Lagna Navamsa # * Navamsa Lord Unit
  const lagnaToMoonDays = ((moon.signIndex - chart.ascendantSignIndex + 12) % 12) + 1;
  const navamsaNumber = Math.min(9, Math.floor((chart.ascendantSidereal % 30) / (30 / 9)) + 1);
  // Astronomical Navamsa sign of Lagna (1..12 continuous padas from Aries 0°)
  const ascVargaNavSignIdx = Math.floor(chart.ascendantSidereal / (30 / 9)) % 12;
  const effectiveNavSign = chart.prashna108Info
    ? SIGNS[chart.prashna108Info.navamsaSignIndex]
    : SIGNS[ascVargaNavSignIdx];
  const navScale = getNavamsaTimingScale(effectiveNavSign.lord, navamsaNumber);

  return {
    lagnaTraits: {
      udayaType: ascSign.udaya,
      udayaFavourable: ascSign.udaya === 'Shirshodaya' ? true : ascSign.udaya === 'Prishtodaya' ? false : 'neutral',
      bodyType,
      genderSign: ascSign.odd ? 'Male (Odd)' : 'Female (Even)',
      sunOrientation,
      aspectsOnLagnaBenefics,
      aspectsOnLagnaMalefics,
      occupantsInLagna: occ1.map((p) => p.id),
      occupantsIn7th: occ7.map((p) => p.id),
    },
    degreeOfSuccess: {
      pct: degreePct,
      basis: degreeBasis,
    },
    maranaKarakaAlerts,
    disputeEdge: {
      querentScore: qScore,
      opponentScore: oScore,
      winner: disputeWinner,
      summary:
        disputeNotes.length > 0
          ? disputeNotes.slice(0, 2).join(' ')
          : 'Balanced contest with no extreme 1st/7th house imbalance.',
    },
    marriageCues,
    illnessCues,
    travelerCues: {
      signals: travSignals,
      strongestPlanet,
      signsFromLagna,
      navamsaMultiplier,
      navamsaModality: navSign.modality,
      estimatedReturnMonths,
      returnSummary: `Return cycle reads around ${estimatedReturnMonths} month${estimatedReturnMonths > 1 ? 's' : ''} (${signsFromLagna} sign steps weighted by ${navSign.modality.toLowerCase()} pace).`,
    },
    theftCues: {
      drekkanaSpot,
      insideOrOutsider,
      signals: theftSignals,
    },
    careerCues,
    dailyQueryNote,
    timingFormula: {
      lagnaToMoonDays,
      navamsaNumber,
      navamsaSignName: effectiveNavSign.name,
      navamsaLord: effectiveNavSign.lord,
      navamsaUnitLabel: navScale.unit,
      navamsaEstimateSummary: `Moon-step pace points near ${lagnaToMoonDays} day${lagnaToMoonDays > 1 ? 's' : ''}; deeper Lagna sub-division points toward ${navScale.readable}.`,
    },
  };
}
