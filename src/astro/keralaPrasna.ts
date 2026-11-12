import {
  ASHTAMANGALA_MAP,
  NAKSHATRAS,
  PERMANENT_FRIENDSHIP,
  SIGNS,
  WEEKDAY_LORDS,
} from './constants';
import { normalizeDeg } from './time';
import type {
  CastHoraryChart,
  NineGrahaId,
  PlanetPosition,
  SevenPlanetId,
} from './types';

export interface AshtamangalaResult {
  enabled: boolean;
  piles: [number, number, number];
  remaindersMod8: [number, number, number];
  digits: {
    position: '1st (Past / Upper Body)' | '2nd (Present / Middle Body)' | '3rd (Future / Lower Body)';
    remainder: number;
    planet: NineGrahaId;
    nature: string;
    meaning: string;
  }[];
  oddCount: number;
  summary: string;
}

export interface TambulaResult {
  enabled: boolean;
  count: number;
  formulaValue: number; // 1..7
  planet: SevenPlanetId;
  tambulaSign: string;
  tambulaHouse: number;
  summary: string;
}

export interface PranaksharaResult {
  enabled: boolean;
  numberUsed: number;
  dikpalaIndex: number; // 1..8
  dikpalaName: string;
  prognosisMod3: 'Recover / Fulfilled (1)' | 'Difficult / No Recovery (2)' | 'Recover with Remedies (3)';
  vargaGroup: string | null;
  vargaLord: SevenPlanetId | null;
}

export interface FiveSutrasResult {
  samanya: string;
  amsaka: string;
  adhipati: string;
  nakshatraSutra: string;
  mahasutra: {
    activeSignMode: 'Solar Sign' | 'Lunar Sign';
    classification: 'Jeeva' | 'Roga' | 'Mrityu';
    temporalZone: 'Past (Houses 9–12)' | 'Present (Houses 1–4)' | 'Future (Houses 5–8)';
    summary: string;
  };
}

export interface BhavaRuinRow {
  pillar: 'Bhava (House Sign)' | 'Bhava Lord' | 'Karaka';
  entity: string;
  afflictions: string[];
  ruinPoints: number; // out of 7
}

export interface KeralaPrasnaReport {
  udayaAnalysis: {
    lagnaSign: string;
    udayaType: string;
    interpretation: string;
    cakraDirection: string;
    arudhaSign: string;
    arudhaSectorArcDeg: number;
  };
  veethiRasi: { signIndex: number; signName: string };
  chatraRasi: { signIndex: number; signName: string; formula: string };
  kundaRectification: {
    kundaLonDeg: number;
    kundaSignName: string;
    kundaNakshatra: string;
    note: string;
  };
  ashtamangala: AshtamangalaResult;
  tambula: TambulaResult;
  pranakshara: PranaksharaResult;
  fiveSutras: FiveSutrasResult;
  bhavaRuin: {
    queryHouse: number;
    karaka: SevenPlanetId;
    saturnInversionActive: boolean;
    totalRuinPoints: number; // out of 21
    rows: BhavaRuinRow[];
    verdict: string;
  };
  kendraPostures: {
    lagnaActivity: string;
    moonActivity: string;
    rainfallCue: string;
  };
}

const DIKPALA_NAMES: Record<number, string> = {
  1: 'Devendra (East)',
  2: 'Agni (South-East)',
  3: 'Yama (South)',
  4: 'Nirriti (South-West)',
  5: 'Varuna (West)',
  6: 'Vayu (North-West)',
  7: 'Kubera (North)',
  8: 'Siva / Ishana (North-East)',
};

const VARGA_GROUP_LORD: Record<string, SevenPlanetId> = {
  A: 'Sun',
  Ka: 'Mars',
  Cha: 'Venus',
  Ta: 'Mercury',
  Tha: 'Jupiter',
  Pa: 'Saturn',
  Ya_Sa: 'Moon',
};

const HOUSE_KARAKAS: Record<number, SevenPlanetId> = {
  1: 'Sun',
  2: 'Jupiter',
  3: 'Mars',
  4: 'Moon',
  5: 'Jupiter',
  6: 'Mars',
  7: 'Venus',
  8: 'Saturn',
  9: 'Jupiter',
  10: 'Mercury',
  11: 'Jupiter',
  12: 'Saturn',
};

function computeAdhipatiRelation(a: SevenPlanetId, b: SevenPlanetId, planets: PlanetPosition[]): string {
  if (a === b) return 'Same Planet (Swakshetra identity)';
  const pA = planets.find((p) => p.id === a)!;
  const pB = planets.find((p) => p.id === b)!;
  const diff = ((pB.houseWholeSign - pA.houseWholeSign + 12) % 12) + 1;
  const tempFriend = [2, 3, 4, 10, 11, 12].includes(diff);
  const perm = PERMANENT_FRIENDSHIP[a];
  const permVal = perm.friends.includes(b) ? 1 : perm.enemies.includes(b) ? -1 : 0;
  const sum = permVal + (tempFriend ? 1 : -1);
  if (sum >= 2) return 'Adhi Mitra (Great Friend)';
  if (sum === 1) return 'Mitra (Friend)';
  if (sum === 0) return 'Sama (Neutral)';
  if (sum === -1) return 'Satru (Enemy)';
  return 'Adhi Satru (Great Enemy)';
}

export function evaluateKeralaPrasna(
  chart: CastHoraryChart,
  queryHouse: number
): KeralaPrasnaReport {
  const byId = new Map<NineGrahaId, PlanetPosition>();
  for (const p of chart.planets) byId.set(p.id, p);

  const ascSign = SIGNS[chart.ascendantSignIndex];
  const arudhaSign = SIGNS[chart.input.arudhaSignIndex];
  const moon = byId.get('Moon')!;
  const sun = byId.get('Sun')!;

  // 1. Udaya & Cakra
  const udayaInterpretation =
    ascSign.udaya === 'Shirshodaya'
      ? 'Shirshodaya Lagna (rising by head) -> Fast progress, visible outcome, favourable by day, Yes / Findable.'
      : ascSign.udaya === 'Prishtodaya'
      ? 'Prishtodaya Lagna (rising by hinder parts) -> Delays, hidden obstacles, stronger by night, reverse turn.'
      : 'Ubhayodaya (Pisces) -> Dual nature, strong at twilight, mixed progression.';

  // 2. Veethi Rasi & Chatra Rasi (Prasna Marga L6255-6350)
  let veethiIdx = 0; // Aries
  if ([1, 2, 3, 4].includes(sun.signIndex)) veethiIdx = 0; // Tau, Gem, Can, Leo -> Aries
  else if ([7, 8, 9, 10].includes(sun.signIndex)) veethiIdx = 2; // Sco, Sag, Cap, Aqu -> Gemini
  else veethiIdx = 1; // Vir, Lib, Pis, Ari -> Taurus

  const arudhaToLagnaSteps = (chart.ascendantSignIndex - chart.input.arudhaSignIndex + 12) % 12;
  const chatraIdx = (veethiIdx + arudhaToLagnaSteps) % 12;

  // 3. Kunda Rectification (Prasna Marga L4180-5832)
  const kundaLon = normalizeDeg(chart.ascendantSidereal * 81);
  const kundaSignIdx = Math.floor(kundaLon / 30) % 12;
  const kundaNakIdx = Math.floor(kundaLon / (360 / 27)) % 27;

  // 4. Ashtamangala 108 Cowrie 3-Pile Mod 8
  const piles = chart.input.ashtamangalaPiles ?? [35, 37, 36];
  const r1 = piles[0] % 8 === 0 ? 8 : piles[0] % 8;
  const r2 = piles[1] % 8 === 0 ? 8 : piles[1] % 8;
  const r3 = piles[2] % 8 === 0 ? 8 : piles[2] % 8;
  const remainders: [number, number, number] = [r1, r2, r3];
  const posLabels: AshtamangalaResult['digits'][number]['position'][] = [
    '1st (Past / Upper Body)',
    '2nd (Present / Middle Body)',
    '3rd (Future / Lower Body)',
  ];
  const digits = remainders.map((rem, idx) => {
    const info = ASHTAMANGALA_MAP[rem];
    return {
      position: posLabels[idx],
      remainder: rem,
      planet: info.planet,
      nature: info.nature,
      meaning: info.summary,
    };
  });
  const oddCount = remainders.filter((r) => r % 2 === 1).length;

  // 5. Tambula Lagna ((2*N*5 + 1) % 7) -> 1=Sun..7=Saturn -> Planet's Sign
  const tEnabled = (chart.input.tambulaCount ?? 0) > 0;
  const tCount = Math.max(1, chart.input.tambulaCount ?? 5);
  const tRemRaw = ((2 * tCount * 5) + 1) % 7;
  const tVal = tRemRaw === 0 ? 7 : tRemRaw;
  const tPlanet = WEEKDAY_LORDS[tVal - 1];
  const tPlanetPos = byId.get(tPlanet)!;

  // 6. Pranakshara (Dikpala & Mod 3 & Varga Lord)
  const pEnabled = (chart.input.pranaksharaNumber ?? 0) > 0 || Boolean(chart.input.pranaksharaGroup);
  const pNum = Math.max(1, chart.input.pranaksharaNumber ?? (chart.ascendantNakIndex + 1));
  const dikRaw = (pNum * 5) % 8;
  const dikIdx = dikRaw === 0 ? 8 : dikRaw;
  const mod3Raw = pNum % 3;
  const mod3Val = mod3Raw === 0 ? 3 : mod3Raw;
  const prognosisMod3: PranaksharaResult['prognosisMod3'] =
    mod3Val === 1
      ? 'Recover / Fulfilled (1)'
      : mod3Val === 2
      ? 'Difficult / No Recovery (2)'
      : 'Recover with Remedies (3)';
  const vargaGroup = chart.input.pranaksharaGroup || null;
  const vargaLord = vargaGroup ? VARGA_GROUP_LORD[vargaGroup] ?? null : null;

  // 7. The Five Sutras
  const lagnaLord = ascSign.lord;
  const lagnaLordPos = byId.get(lagnaLord)!;
  const disPos = byId.get(SIGNS[lagnaLordPos.signIndex].lord)!;
  const adhipatiRel = computeAdhipatiRelation(lagnaLord, SIGNS[lagnaLordPos.signIndex].lord, chart.planets);

  const janmaIdx = chart.input.natalJanmaNakshatraIndex ?? chart.panchanga.moonNakshatraIndex;
  const udayaNakIdx = chart.ascendantNakIndex;
  const nakSutraMod = ((janmaIdx - udayaNakIdx + 27) % 3) + 1;

  // Mahasutra: Solar vs Lunar signs (Cancer, Leo, Aquarius/Scorpio notes; traditional odd vs even / solar Leo-Virgo-Libra-Sco-Sag-Cap vs Lunar)
  // Traditional Horary rule: Sun rules Aquarius..Cancer (Uttarayana solar half = 10..3) or Leo..Cap vs Aqu..Can. Use Sun-ruled Leo..Capricorn (4..9) as Solar, Moon-ruled Aquarius..Cancer (10..3) as Lunar
  const isSolarLagna = chart.ascendantSignIndex >= 4 && chart.ascendantSignIndex <= 9;
  const mahaClass: FiveSutrasResult['mahasutra']['classification'] =
    lagnaLordPos.dignity === 'Exalted' || lagnaLordPos.dignity === 'Own Sign' || !lagnaLordPos.isCombust
      ? 'Jeeva'
      : lagnaLordPos.isCombust || lagnaLordPos.dignity === 'Debilitated'
      ? 'Mrityu'
      : 'Roga';
  const temporalZone: FiveSutrasResult['mahasutra']['temporalZone'] =
    moon.houseWholeSign >= 9
      ? 'Past (Houses 9–12)'
      : moon.houseWholeSign <= 4
      ? 'Present (Houses 1–4)'
      : 'Future (Houses 5–8)';

  const fiveSutras: FiveSutrasResult = {
    samanya: `Udaya ${ascSign.name} (${ascSign.udaya}) paired with Moon in ${moon.signName} (${moon.houseWholeSign}H) sets general ease & flow.`,
    amsaka: `Lagna Navamsa falls in ${SIGNS[Math.floor(chart.ascendantSidereal / (30 / 9)) % 12].name}; Lagna Lord ${lagnaLord} occupies Navamsa ${SIGNS[lagnaLordPos.navamsaSignIndex].name}.`,
    adhipati: `Lagna Lord ${lagnaLord} sits in ${lagnaLordPos.signName} ruled by ${disPos.id}: 9-cell Adhipati relation is ${adhipatiRel}.`,
    nakshatraSutra: `(Janma #${janmaIdx + 1} − Udaya #${udayaNakIdx + 1} + 1) mod 3 -> Result ${nakSutraMod} (${nakSutraMod === 1 ? 'Active growth / initiative' : nakSutraMod === 2 ? 'Steady consolidation' : 'Resolution / completion'}).`,
    mahasutra: {
      activeSignMode: isSolarLagna ? 'Solar Sign' : 'Lunar Sign',
      classification: mahaClass,
      temporalZone,
      summary: `${isSolarLagna ? 'Solar' : 'Lunar'} half Lagna with vitality classification '${mahaClass}', Moon emphasizing ${temporalZone}.`,
    },
  };

  // 8. 21 Points of Bhava Ruin (7 factors across 3 pillars + Saturn Karaka Inversion)
  const targetSignIdx = (chart.ascendantSignIndex + queryHouse - 1) % 12;
  const targetLord = SIGNS[targetSignIdx].lord;
  const targetLordPos = byId.get(targetLord)!;
  const karaka = HOUSE_KARAKAS[queryHouse] ?? 'Jupiter';
  const karakaPos = byId.get(karaka)!;
  const saturnPos = byId.get('Saturn')!;

  const maleficIds: NineGrahaId[] = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];
  const evalSevenAfflictionsForHouse = (hNum: number, sIdx: number): string[] => {
    const aff: string[] = [];
    const lord = SIGNS[sIdx].lord;
    const occMalefics = chart.planets.filter((p) => p.houseWholeSign === hNum && maleficIds.includes(p.id));
    if (occMalefics.length > 0) aff.push(`Occupied by malefic(s): ${occMalefics.map((m) => m.id).join(', ')}`);
    const prevH = ((hNum + 10) % 12) + 1;
    const nextH = (hNum % 12) + 1;
    const malPrev = chart.planets.some((p) => p.houseWholeSign === prevH && maleficIds.includes(p.id));
    const malNext = chart.planets.some((p) => p.houseWholeSign === nextH && maleficIds.includes(p.id));
    if (malPrev && malNext) aff.push('Hemmed by malefics (Paapakartari)');
    const asp7Malefics = chart.planets.filter(
      (p) => ((hNum - p.houseWholeSign + 12) % 12) + 1 === 7 && maleficIds.includes(p.id)
    );
    if (asp7Malefics.length > 0) aff.push(`Opposed (7th) by ${asp7Malefics.map((m) => m.id).join(', ')}`);
    if ([6, 8, 12].includes(byId.get(lord)!.houseWholeSign)) aff.push(`House lord placed in Dusthana (${byId.get(lord)!.houseWholeSign}H)`);
    if (Math.floor(chart.gulikaLon / 30) % 12 === sIdx) aff.push('Occupied by Gulika');
    if (chart.upagrahas.some((u) => u.signIndex === sIdx)) aff.push('Touched by Upagraha Dosha');
    return aff;
  };

  const evalSevenAfflictionsForPlanet = (p: PlanetPosition, isSaturnKaraka = false): string[] => {
    const aff: string[] = [];
    if (p.isCombust) aff.push('Combust');
    if (p.dignity === 'Debilitated') aff.push('Debilitated');
    if (p.dignity === 'Enemy' || p.dignity === 'Great Enemy') aff.push(`Enemy Sign (${p.dignity})`);
    if (!isSaturnKaraka && [6, 8, 12].includes(p.houseWholeSign)) aff.push(`Placed in Dusthana (${p.houseWholeSign}H)`);
    if (isSaturnKaraka && [6, 8, 12].includes(p.houseWholeSign)) {
      aff.push(`Saturn Inversion Note: Placed in ${p.houseWholeSign}H (can mitigate ruin for 8th/12th significations)`);
    }
    const conjMalefics = chart.planets.filter(
      (o) => o.id !== p.id && o.houseWholeSign === p.houseWholeSign && maleficIds.includes(o.id)
    );
    if (conjMalefics.length > 0) aff.push(`Conjoined ${conjMalefics.map((m) => m.id).join(', ')}`);
    const navSign = SIGNS[p.navamsaSignIndex].name;
    if (navSign && p.dignity === 'Debilitated') aff.push('Weak Navamsa dignity');
    if (p.isRetrograde && p.id !== 'Sun' && p.id !== 'Moon') aff.push('Retrograde motion');
    return aff;
  };

  const houseAff = evalSevenAfflictionsForHouse(queryHouse, targetSignIdx);
  const lordAff = evalSevenAfflictionsForPlanet(targetLordPos, false);
  const saturnInversionActive = karaka === 'Saturn' || saturnPos.houseWholeSign === queryHouse;
  const karakaAff = evalSevenAfflictionsForPlanet(karakaPos, karaka === 'Saturn');

  const rows: BhavaRuinRow[] = [
    { pillar: 'Bhava (House Sign)', entity: `House ${queryHouse} (${SIGNS[targetSignIdx].name})`, afflictions: houseAff, ruinPoints: Math.min(7, houseAff.length) },
    { pillar: 'Bhava Lord', entity: `${targetLord} (${targetLordPos.houseWholeSign}H)`, afflictions: lordAff, ruinPoints: Math.min(7, lordAff.length) },
    { pillar: 'Karaka', entity: `${karaka} (${karakaPos.houseWholeSign}H)`, afflictions: karakaAff, ruinPoints: Math.min(7, karakaAff.length) },
  ];
  const totalRuinPoints = rows.reduce((s, r) => s + r.ruinPoints, 0);

  // Bhava Postures & Rainfall (Prasna Marga L10767-10866)
  const lagnaPosture =
    moon.houseWholeSign === 1
      ? 'Walking (1st Kendra)'
      : moon.houseWholeSign === 4
      ? 'Lying down (4th Kendra)'
      : moon.houseWholeSign === 7
      ? 'Sitting (7th Kendra)'
      : moon.houseWholeSign === 10
      ? 'Standing (10th Kendra)'
      : `Non-Kendra (${moon.houseWholeSign}H)`;

  return {
    udayaAnalysis: {
      lagnaSign: ascSign.name,
      udayaType: ascSign.udaya,
      interpretation: udayaInterpretation,
      cakraDirection: arudhaSign.cakraDirection,
      arudhaSign: arudhaSign.name,
      arudhaSectorArcDeg: arudhaSign.modality === 'Dual' ? 45 : 22.5,
    },
    veethiRasi: { signIndex: veethiIdx, signName: SIGNS[veethiIdx].name },
    chatraRasi: {
      signIndex: chatraIdx,
      signName: SIGNS[chatraIdx].name,
      formula: `Veethi (${SIGNS[veethiIdx].name}) + Arudha->Lagna (${arudhaToLagnaSteps} signs) = ${SIGNS[chatraIdx].name}`,
    },
    kundaRectification: {
      kundaLonDeg: kundaLon,
      kundaSignName: SIGNS[kundaSignIdx].name,
      kundaNakshatra: NAKSHATRAS[kundaNakIdx].name,
      note: 'Check Kunda (Lagna × 81 mod 360°) alignment with Janma/Anujanma (±10\' adjustment).',
    },
    ashtamangala: {
      enabled: Boolean(chart.input.ashtamangalaPiles),
      piles,
      remaindersMod8: remainders,
      digits,
      oddCount,
      summary: `Ashtamangala digits [${remainders.join(' · ')}] -> ${digits.map((d) => d.planet).join(', ')}. ${oddCount}/3 odd digits (${oddCount >= 2 ? 'Overall Auspicious' : 'Mixed / Obstacles requiring Daivahitam check'}).`,
    },
    tambula: {
      enabled: tEnabled,
      count: tCount,
      formulaValue: tVal,
      planet: tPlanet,
      tambulaSign: tPlanetPos.signName,
      tambulaHouse: tPlanetPos.houseWholeSign,
      summary: `((2 × ${tCount} × 5) + 1) % 7 = ${tVal} (${tPlanet}) -> Tambula Lagna falls in ${tPlanetPos.signName} (${tPlanetPos.houseWholeSign}H).`,
    },
    pranakshara: {
      enabled: pEnabled,
      numberUsed: pNum,
      dikpalaIndex: dikIdx,
      dikpalaName: DIKPALA_NAMES[dikIdx],
      prognosisMod3,
      vargaGroup,
      vargaLord,
    },
    fiveSutras,
    bhavaRuin: {
      queryHouse,
      karaka,
      saturnInversionActive,
      totalRuinPoints,
      rows,
      verdict:
        totalRuinPoints <= 3
          ? `Strong Bhava Protection (${totalRuinPoints}/21 ruin points)`
          : totalRuinPoints <= 7
          ? `Moderate Afflictions (${totalRuinPoints}/21 ruin points)`
          : `Heavy Bhava Ruin (${totalRuinPoints}/21 ruin points — obstacles likely)`,
    },
    kendraPostures: {
      lagnaActivity: lagnaPosture,
      moonActivity: `Moon in ${moon.houseWholeSign}H (${moon.signName})`,
      rainfallCue: 'Kendra Water Map: 4H=Underground, 7H=Rivers, 10H=Rainfall, 1H=All',
    },
  };
}
