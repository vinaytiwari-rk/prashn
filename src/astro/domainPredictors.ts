import { KP_249_TABLE, PERMANENT_FRIENDSHIP, QUESTION_CATEGORIES, SIGNS } from './constants';
import { CASTING_METHOD_OPTIONS } from './questionCatalog';
import type { KeralaPrasnaReport } from './keralaPrasna';
import type { KpHoraryReport } from './kpHorary';
import type { RadicalityReport } from './radicality';
import { evaluateSystemsApproach, type SystemsApproachReport } from './systemsApproach';
import type { TajikaReport } from './tajikaEngine';
import type { TimingWindowReport } from './timingEngine';
import type {
  CastHoraryChart,
  NineGrahaId,
  PlanetPosition,
  SevenPlanetId,
} from './types';

export interface RuleCitationCard {
  system:
    | 'Classical (Prasna Tantra)'
    | 'Tajika'
    | 'KP Horary'
    | 'Kerala (Prasna Marga)'
    | "Systems' Approach (SA)"
    | 'Lunar Micro-States';
  title: string;
  favourable: boolean | 'neutral';
  detail: string;
  source: string;
}

export interface CoraTheftSpecialist {
  roles: { role: string; house: number; planet: string; placement: string }[];
  recoveryVerdict: string;
  insideJobIndicator: boolean;
  insideJobReasons: string[];
  culpritCount: number;
  culpritCountBasis: string;
  culpritAge: string;
  culpritGender: string;
  culpritRelationCue: string;
  modeOfTheftCues: string[];
  directionClassicalCorner: string;
  directionKpCardinal: string;
  mobilityDistance: string;
  hidingSpotDrekkana: string;
  hidingRoomBy4H: string[];
  suspectCheck: string;
}

export interface MedicalBadhaSpecialist {
  consultationRoles: { role: string; house: string; signAndLord: string }[];
  diseaseNature: string;
  affectedOrgans: string[];
  relapseRisk: string;
  deityBadhaAssociations: { planet: string; deity: string; context: string }[];
  pranaksharaRecoveryMod3: string;
}

export interface MookBlindSpecialist {
  natureOfQueryDhatuMoolaJeeva: 'Dhatu (Minerals / Wealth / Inanimate)' | 'Moola (Property / Plants / Immovables)' | 'Jeeva (Living Beings / Person / Health)';
  inferredHouseFocus: number;
  inferredTopicHint: string;
  horaClue: string;
  moonClue: string;
  navamsaClue: string;
}

export interface OtherDomainHighlights {
  title: string;
  rows: { label: string; value: string; source: string }[];
}

export interface MethodLayerItem {
  layerName: string;
  scorePct: number | null;
  tone: 'good' | 'warn' | 'bad' | 'info';
  badgeText: 'Favourable' | 'Mixed' | 'Unfavourable' | 'Not Checked';
  shortOutcome: string;
  plainMeaning: string;
}

export interface DomainAnalysisReport {
  categoryLabel: string;
  primaryHouse: number;
  activeMethodLabel: string;
  unifiedVerdict: 'Strong Yes' | 'Favourable with Effort / Delay' | 'Mixed / Conditional' | 'Unfavourable / Denial';
  unifiedScorePct: number; // 0..100
  threeSystemAlignment: {
    classicalKeralaVerdict: string;
    tajikaVerdict: string;
    kpVerdict: string;
    systemsApproachVerdict: string;
  };
  horaAnalysis: {
    horaLord: SevenPlanetId;
    horaNumber: number;
    horaLagnaSignName: string;
    horaScorePct: number;
    tone: 'good' | 'warn' | 'bad';
    badgeText: 'Favourable' | 'Mixed' | 'Unfavourable';
    plainMeaning: string;
    nextBestHoraNote: string;
  };
  swaraAnalysis: {
    checked: boolean;
    nostrilLabel: string;
    positionLabel: string;
    scorePct: number | null;
    tone: 'good' | 'warn' | 'bad' | 'info';
    badgeText: 'Favourable' | 'Mixed' | 'Unfavourable' | 'Not Checked';
    plainMeaning: string;
  };
  methodLayers: MethodLayerItem[];
  citations: RuleCitationCard[];
  coraTheft: CoraTheftSpecialist;
  medicalBadha: MedicalBadhaSpecialist;
  mookBlind: MookBlindSpecialist;
  domainHighlights: OtherDomainHighlights;
  botanicalFruition: {
    moonSeed: string;
    lagnaFlower: string;
    navamsaLagnaFruit: string;
    bhavaTaste: string;
  };
}

const MEDICAL_ORGAN_MAP: Record<number, string> = {
  1: 'Head, brain and nerve centres',
  2: 'Face, throat, neck, gullet (and right eye per Raman)',
  3: 'Shoulders, arms, chest, lungs, breath and nerves',
  4: 'Breast and stomach',
  5: 'Back, heart, liver and blood',
  6: 'Bowels, waist, intestines and liver',
  7: 'Kidneys',
  8: 'Rectum, sexual organs, spine / excretory system and bladder',
  9: 'Arterial system, thighs and hips',
  10: 'Knees, bones and joints',
  11: 'Ankles and breath',
  12: 'Feet, lymphatic system and eyes (2nd & 12th per Raman)',
};

const DEITY_CURSE_MAP: Record<NineGrahaId, string> = {
  Rahu: 'Pretas (restless ancestral / departed spirits)',
  Jupiter: 'Parents / Elders / Guru',
  Moon: 'Ambadevi / Maternal Goddess',
  Venus: 'Ambadevi / Devi of Prosperity',
  Sun: 'Devi / Supreme Solar Deity',
  Saturn: 'Family Deity (Kuladevata)',
  Mercury: 'Bhutas / Elemental Spirits',
  Mars: 'Sakini / Fierce Shrine Entity',
  Ketu: 'Karmic / Mystical Shrine Affliction (alongside Nodes)',
};

const THIEF_AGE_MAP: Record<SevenPlanetId, string> = {
  Venus: 'Youth / teenager (Stanza 106)',
  Mercury: 'Boy / very young person (Stanza 106)',
  Jupiter: 'Middle-aged person (Stanza 106)',
  Mars: 'Well-built young person (Stanza 106)',
  Saturn: 'Old man (Stanza 106)',
  Sun: 'Very old person (Stanza 106)',
  Moon: 'Young-to-mature fluctuating build',
};

const HIDING_ROOM_BY_PLANET: Record<SevenPlanetId, string> = {
  Saturn: 'Dirty / refuse corner, storage heap, dark nook (Stanzas 109–110)',
  Moon: 'Watery place, near a well, bathroom, or wash area (Stanzas 109–110)',
  Jupiter: 'Temple, prayer room, or sacred study corner (Stanzas 109–110)',
  Mars: 'Kitchen, furnace, hearth, or near fire/metal (Stanzas 109–110)',
  Sun: 'Principal seat / chair / royal spot of the owner (Stanzas 109–110)',
  Venus: 'Bed, bedroom, dressing table, or upholstery (Stanzas 109–110)',
  Mercury: 'Dining hall, library, study, treasury, or iron safe (Stanzas 109–110)',
};

const ELEMENT_ROOM_MAP: Record<string, string> = {
  Earth: 'Near the floor / ground level (Stanza 108)',
  Fire: 'Near kitchen, stove, furnace, or electrical heat (Stanza 108)',
  Air: 'Somewhere elevated / upper shelf / loft (Stanza 108)',
  Water: 'Near water source, sink, tank, or damp area (Stanza 108)',
};

export function synthesizeDomainReport(
  chart: CastHoraryChart,
  radicality: RadicalityReport,
  tajika: TajikaReport,
  kp: KpHoraryReport,
  kerala: KeralaPrasnaReport,
  timing: TimingWindowReport,
  systemsApproachArg?: SystemsApproachReport
): DomainAnalysisReport {
  const systemsApproach = systemsApproachArg ?? evaluateSystemsApproach(chart);
  const byId = new Map<NineGrahaId, PlanetPosition>();
  for (const p of chart.planets) byId.set(p.id, p);

  const catMeta = QUESTION_CATEGORIES.find((c) => c.id === chart.input.category)!;
  const primaryHouse = catMeta.primaryHouse;
  const moon = byId.get('Moon')!;
  const sun = byId.get('Sun')!;
  const lagnaSign = SIGNS[chart.ascendantSignIndex];
  const lagnaLord = lagnaSign.lord;
  const lagnaLordPos = byId.get(lagnaLord)!;

  // --- CORA / LOST PROPERTY / THEFT SPECIALIST ---
  const h7Sign = SIGNS[(chart.ascendantSignIndex + 6) % 12];
  const lord7 = h7Sign.lord;
  const lord7Pos = byId.get(lord7)!;
  const h2Sign = SIGNS[(chart.ascendantSignIndex + 1) % 12];
  const lord2 = h2Sign.lord;
  const lord2Pos = byId.get(lord2)!;
  const h4Sign = SIGNS[(chart.ascendantSignIndex + 3) % 12];
  const lord4 = h4Sign.lord;
  const lord4Pos = byId.get(lord4)!;
  const h8Sign = SIGNS[(chart.ascendantSignIndex + 7) % 12];
  const lord8 = h8Sign.lord;
  const lord8Pos = byId.get(lord8)!;
  const h10Sign = SIGNS[(chart.ascendantSignIndex + 9) % 12];
  const lord10 = h10Sign.lord;
  const lord10Pos = byId.get(lord10)!;

  const insideJobReasons: string[] = [];
  if (chart.isAscVargottama) {
    insideJobReasons.push('Vargottama Lagna -> strong insider / familiar person involvement (Cora Prasna case study).');
  }
  if (lagnaLordPos.houseWholeSign === 1 && lord7Pos.houseWholeSign === 1) {
    insideJobReasons.push('Both 1st Lord & 7th Lord occupy Lagna -> thief belongs to same household (Stanza 99).');
  }
  if ([12, 3].includes(lord7Pos.houseWholeSign)) {
    insideJobReasons.push(`7th Lord (${lord7}) in ${lord7Pos.houseWholeSign}H -> querent's own servant / attendant (Stanza 99).`);
  }
  if (sun.houseWholeSign === 1 || sun.houseWholeSign === 7 || moon.houseWholeSign === 1 || moon.houseWholeSign === 7) {
    insideJobReasons.push('Sun or Moon aspects/occupies Lagna -> household or close neighbor (Stanza 98).');
  }

  const ascNavSign = Math.floor(chart.ascendantSidereal / (30 / 9)) % 12;
  const nav8Sign = (ascNavSign + 7) % 12;
  const planetsInNav8 = chart.planets.filter((p) => p.navamsaSignIndex === nav8Sign);
  const culpritCount = Math.max(1, planetsInNav8.length);

  // Gender Stanza 113
  const femalePlanets: NineGrahaId[] = ['Moon', 'Venus', 'Mercury', 'Saturn'];
  const seventhMaleScore =
    (femalePlanets.includes(lord7) ? -1 : 1) +
    (h7Sign.odd ? 1 : -1) +
    (femalePlanets.includes(SIGNS[lord7Pos.signIndex].lord) ? -1 : 1);
  const culpritGender =
    seventhMaleScore >= 0
      ? `Male preponderance (7L ${lord7}, 7H ${h7Sign.name} ${h7Sign.odd ? 'Odd' : 'Even'}) — Stanza 113`
      : `Female preponderance (7L ${lord7} / feminine sign influence) — Stanza 113`;

  // Relation cue Stanzas 101-103
  let culpritRelationCue = '7th Lord not debilitated — check accomplices in 1st / 7th / 10th or household cues.';
  if (lord7Pos.dignity === 'Debilitated') {
    const debRelMap: Record<SevenPlanetId, string> = {
      Sun: 'Father of house-owner (Stanza 101)',
      Moon: 'Mother (Stanza 102)',
      Venus: 'Wife / female partner (Stanza 102)',
      Saturn: 'Son (Stanza 102)',
      Jupiter: 'Important elder member of house (Stanza 102)',
      Mars: 'Brother or son (Stanza 102)',
      Mercury: 'Relative or friend (Stanza 103)',
    };
    culpritRelationCue = `7th Lord (${lord7}) is Debilitated -> Classical match: ${debRelMap[lord7]} (verify Punyasaham affliction per Stanza 103).`;
  }

  // Mode of theft cues Stanza 105 (planets occupying/trining/opposing 7L sign)
  const modeCues: string[] = [];
  for (const cand of ['Jupiter', 'Mars', 'Venus', 'Mercury'] as SevenPlanetId[]) {
    const p = byId.get(cand)!;
    const diff = ((lord7Pos.signIndex - p.signIndex + 12) % 12) + 1;
    if ([1, 5, 7, 9].includes(diff)) {
      if (cand === 'Jupiter') modeCues.push('Jupiter influence on 7L -> Committed under public notice (Stanza 105)');
      if (cand === 'Mars') modeCues.push('Mars influence on 7L -> Hidden in a pit / buried / tool used (Stanza 105)');
      if (cand === 'Venus') modeCues.push('Venus influence on 7L -> Duplicate key or unlocked access (Stanza 105)');
      if (cand === 'Mercury') modeCues.push('Mercury influence on 7L -> Due to a guest / visitor (Stanza 105)');
    }
  }
  if (modeCues.length === 0) modeCues.push('No major Jupiter/Mars/Venus/Mercury Stanza 105 modifier on 7th Lord.');

  // Direction: Classical Corner (Stanzas 88-89) vs KP Cardinal
  const cornerDirMap = { Fire: 'South-East (SE)', Earth: 'South-West (SW)', Air: 'North-West (NW)', Water: 'North-East (NE)' };
  const directionClassicalCorner = `${cornerDirMap[lagnaSign.element]} (${lagnaSign.name} = ${lagnaSign.element}, Stanzas 88–89)`;
  const csl2Lost = kp.allCategoryEvaluations.find((e) => e.category === 'lost_stolen')?.lostItemDetails;
  const directionKpCardinal = csl2Lost
    ? `${csl2Lost.kpDirection} (KP 2nd CSL ${csl2Lost.signElement})`
    : `${cornerDirMap[lagnaSign.element]}`;

  // Drekkana Hiding Spot (Stanza 86) & Room by 4H (108-110)
  const ascDrek = (Math.floor((chart.ascendantSidereal % 30) / 10) + 1) as 1 | 2 | 3;
  const hidingSpotDrekkana =
    ascDrek === 1
      ? '1st Drekkana (0°–10°): Near the door / entrance (Stanza 86)'
      : ascDrek === 2
      ? '2nd Drekkana (10°–20°): Inside the house / interior premises (Stanza 86)'
      : '3rd Drekkana (20°–30°): Backyard / outer perimeter (Stanza 86)';

  const occupants4 = chart.planets
    .filter((p) => p.houseWholeSign === 4 && p.id !== 'Rahu' && p.id !== 'Ketu')
    .map((p) => `${p.id} in 4H -> ${HIDING_ROOM_BY_PLANET[p.id as SevenPlanetId]}`);
  const hidingRoomBy4H = [
    `4th House Element (${h4Sign.element}): ${ELEMENT_ROOM_MAP[h4Sign.element]}`,
    `4th Lord (${lord4}) -> ${HIDING_ROOM_BY_PLANET[lord4]}`,
    ...occupants4,
  ];

  // Suspect & Recovery check
  const moonYogas = tajika.allYogas.filter((y) => y.planets.includes('Moon'));
  const moonMaleficIthasala = moonYogas.some(
    (y) =>
      (y.type.includes('Ithasala') || y.type === 'Conjunction (Present)') &&
      y.planets.some((pl) => pl === 'Mars' || pl === 'Saturn' || pl === 'Sun')
  );
  const suspectCheck = moonMaleficIthasala
    ? 'Moon in Muthasila/Ithasala with Malefic -> Named suspect likely involved (Stanza 111).'
    : 'Moon not in Muthasila with a severe malefic (or favours benefics) -> Suspect may be innocent (Stanza 111).';

  const ith1_7 = tajika.allYogas.some(
    (y) => y.planets.includes(lagnaLord) && y.planets.includes(lord7) && y.type.includes('Ithasala')
  );
  const conj1_10 =
    lagnaLord === lord10 || lagnaLordPos.houseWholeSign === lord10Pos.houseWholeSign;
  let recoveryVerdict = kp.allCategoryEvaluations.find((e) => e.category === 'lost_stolen')?.verdict ?? 'Mixed';
  if (ith1_7) recoveryVerdict += ' • Classical Stanza 94: 1L–7L Ithasala -> Thief fears authorities and returns item.';
  else if (conj1_10) recoveryVerdict += ' • Classical Stanza 95: 1L+10L together -> Recoverable through authorities.';
  else if ([7, 8].includes(lord2Pos.houseWholeSign)) {
    recoveryVerdict += ` • Caution Stanza 96: 2L (${lord2}) sits in ${lord2Pos.houseWholeSign}H (hinders easy recovery).`;
  }

  const coraTheft: CoraTheftSpecialist = {
    roles: [
      { role: 'Owner / Querent', house: 1, planet: lagnaLord, placement: `${lagnaLord} in ${lagnaLordPos.houseWholeSign}H (${lagnaLordPos.signName})` },
      { role: 'Thief / Culprit', house: 7, planet: lord7, placement: `${lord7} in ${lord7Pos.houseWholeSign}H (${lord7Pos.signName})` },
      { role: 'Lost Property', house: 4, planet: lord4, placement: `${lord4} in ${lord4Pos.houseWholeSign}H (${lord4Pos.signName})` },
      { role: 'Thief\'s Gain / Wealth', house: 8, planet: lord8, placement: `${lord8} in ${lord8Pos.houseWholeSign}H` },
      { role: 'Police / Authorities', house: 10, planet: lord10, placement: `${lord10} in ${lord10Pos.houseWholeSign}H` },
    ],
    recoveryVerdict,
    insideJobIndicator: insideJobReasons.length > 0,
    insideJobReasons: insideJobReasons.length > 0 ? insideJobReasons : ['No direct insider Vargottama / 1L+7L-in-1H signature triggered.'],
    culpritCount,
    culpritCountBasis:
      planetsInNav8.length > 0
        ? `${planetsInNav8.length} planet(s) occupy Navamsa 8th house (${SIGNS[nav8Sign].name}): ${planetsInNav8.map((p) => p.id).join(', ')}.`
        : `0 planets in Navamsa 8th house (${SIGNS[nav8Sign].name}) -> Default single culprit or non-theft misplacement.`,
    culpritAge: THIEF_AGE_MAP[lord7],
    culpritGender,
    culpritRelationCue,
    modeOfTheftCues: modeCues,
    directionClassicalCorner,
    directionKpCardinal,
    mobilityDistance: csl2Lost?.mobilityNote ?? `${lagnaSign.modality} Lagna`,
    hidingSpotDrekkana,
    hidingRoomBy4H,
    suspectCheck,
  };

  // --- MEDICAL & DEITY BADHA SPECIALIST ---
  const diseaseHouseNum = chart.input.settings.diseaseHouse;
  const diseaseSign = SIGNS[(chart.ascendantSignIndex + diseaseHouseNum - 1) % 12];
  const diseaseLord = diseaseSign.lord;
  const diseaseLordPos = byId.get(diseaseLord)!;

  const affHouses = Array.from(
    new Set([lagnaLordPos.houseWholeSign, moon.houseWholeSign, diseaseLordPos.houseWholeSign, diseaseHouseNum])
  );
  const affectedOrgans = affHouses.map(
    (h) => `House ${h}: ${MEDICAL_ORGAN_MAP[h]}`
  );

  // Planets occupying or aspecting Disease House / 6th / 8th -> Deity Curse cues
  const afflictedPlanets = chart.planets.filter(
    (p) => [6, 7, 8, 12].includes(p.houseWholeSign) || p.isCombust || p.dignity === 'Debilitated'
  );
  const deityBadhaAssociations = afflictedPlanets.map((p) => ({
    planet: `${p.id} (${p.houseWholeSign}H, ${p.dignity})`,
    deity: DEITY_CURSE_MAP[p.id],
    context: 'Prasna Tantra Ch III Stanzas 56–67 / Kerala Badha indicator',
  }));

  const medicalBadha: MedicalBadhaSpecialist = {
    consultationRoles: [
      { role: 'Physician', house: '1st House', signAndLord: `${lagnaSign.name} (${lagnaLord})` },
      {
        role: `Disease (${chart.input.settings.diseaseHouse === 6 ? 'B.V. Raman 6th' : 'Classical 7th'})`,
        house: `${diseaseHouseNum}th House`,
        signAndLord: `${diseaseSign.name} (${diseaseLord} in ${diseaseLordPos.houseWholeSign}H)`,
      },
      { role: 'Patient', house: '10th House', signAndLord: `${h10Sign.name} (${lord10} in ${lord10Pos.houseWholeSign}H)` },
      { role: 'Treatment / Medicine', house: '4th House', signAndLord: `${h4Sign.name} (${lord4} in ${lord4Pos.houseWholeSign}H)` },
    ],
    diseaseNature:
      lagnaSign.modality === 'Fixed'
        ? 'Fixed Lagna -> Disease aligns with initial diagnosis (Ch II Notes).'
        : lagnaSign.modality === 'Dual'
        ? 'Common/Dual Lagna -> Condition may differ from suspected diagnosis.'
        : 'Movable Lagna -> Shifting symptoms; rapid change possible.',
    affectedOrgans,
    relapseRisk: diseaseLordPos.isRetrograde || lagnaLordPos.isRetrograde
      ? `Retrograde medical significator (${diseaseLordPos.isRetrograde ? diseaseLord : lagnaLord}) -> Watch for chronicity / relapse (Stanzas 53–55).`
      : 'Primary medical lords in direct motion — lower relapse risk.',
    deityBadhaAssociations,
    pranaksharaRecoveryMod3: kerala.pranakshara.prognosisMod3,
  };

  // --- BLIND QUESTION (MOOK PRASHNA) SPECIALIST ---
  const lagnaNavInSign = Math.floor((chart.ascendantSidereal % 30) / (30 / 9)) + 1; // 1..9
  const mod3Nav = ((lagnaNavInSign - 1) % 3) + 1; // odd sign: 1=Dhatu, 2=Moola, 3=Jeeva; even sign reversed
  let dhatuMoolaJeeva: MookBlindSpecialist['natureOfQueryDhatuMoolaJeeva'] = 'Jeeva (Living Beings / Person / Health)';
  if (lagnaSign.odd) {
    dhatuMoolaJeeva =
      mod3Nav === 1
        ? 'Dhatu (Minerals / Wealth / Inanimate)'
        : mod3Nav === 2
        ? 'Moola (Property / Plants / Immovables)'
        : 'Jeeva (Living Beings / Person / Health)';
  } else {
    dhatuMoolaJeeva =
      mod3Nav === 1
        ? 'Jeeva (Living Beings / Person / Health)'
        : mod3Nav === 2
        ? 'Moola (Property / Plants / Immovables)'
        : 'Dhatu (Minerals / Wealth / Inanimate)';
  }

  const inferredHouseFocus = moon.houseWholeSign;
  const HOUSE_TOPICS: Record<number, string> = {
    1: 'Self, Health, Reputation, Personal Beginning',
    2: 'Finance, Liquid Wealth, Family, Missing Value',
    3: 'Siblings, Short Trip, Documents, Contract, Communication',
    4: 'Home, Land, Mother, Vehicle, Property, Lease',
    5: 'Children, Pregnancy, Education, Speculation, Romance',
    6: 'Illness, Debt, Job/Service, Court Dispute, Enemies',
    7: 'Marriage, Partner, Business Deal, Returning Spouse, Thief',
    8: 'Hidden Crisis, Inheritance, Insurance, Chronic Worry',
    9: 'Long Travel, Legal Luck, Father, Guru, Higher Study',
    10: 'Career, Promotion, Authority, Government, Business Status',
    11: 'Gains, Fulfillment of Wishes, Bonus, Friendships',
    12: 'Expenses, Foreign Settlement, Loss, Hospitalization, Moksha',
  };

  const mookBlind: MookBlindSpecialist = {
    natureOfQueryDhatuMoolaJeeva: dhatuMoolaJeeva,
    inferredHouseFocus,
    inferredTopicHint: `Moon in ${inferredHouseFocus}H (${moon.signName}) points toward: ${HOUSE_TOPICS[inferredHouseFocus]}`,
    horaClue: `Active Hora Lord ${chart.panchanga.horaLord} sits in ${byId.get(chart.panchanga.horaLord)!.houseWholeSign}H (${HOUSE_TOPICS[byId.get(chart.panchanga.horaLord)!.houseWholeSign]})`,
    moonClue: `Moon Star Lord ${moon.starLord} occupies ${byId.get(moon.starLord)!.houseWholeSign}H; Dispositor ${SIGNS[moon.signIndex].lord} in ${byId.get(SIGNS[moon.signIndex].lord)!.houseWholeSign}H`,
    navamsaClue: `Lagna in Navamsa #${lagnaNavInSign} of ${lagnaSign.odd ? 'Odd' : 'Even'} Sign (${lagnaSign.name}) -> ${dhatuMoolaJeeva} (Ch IV Stanza 26)`,
  };

  // --- CATEGORY-SPECIFIC HIGHLIGHTS ---
  const domainRows: { label: string; value: string; source: string }[] = [];
  if (chart.input.category === 'marriage_relationship') {
    domainRows.push(
      { label: '7th CSL vs 2/7/11', value: `${kp.domainEvaluation.verdict} (${kp.domainEvaluation.scorePct}%)`, source: '03_rppandey_what_is_horary.md' },
      { label: 'Venus State (Ch II St.70-71)', value: `${byId.get('Venus')!.signName} (${byId.get('Venus')!.houseWholeSign}H, ${byId.get('Venus')!.isRetrograde ? 'Retrograde -> aids return' : 'Direct'}${byId.get('Venus')!.isCombust ? ', Combust -> obstacle' : ''})`, source: 'Prasna Tantra Ch II Stanzas 70-71' },
      { label: '1L vs 7L Synergy', value: `1L ${lagnaLord} (${lagnaLordPos.houseWholeSign}H) & 7L ${lord7} (${lord7Pos.houseWholeSign}H)`, source: 'Prasna Tantra Ch II Stanzas 62-69' }
    );
  } else if (chart.input.category === 'career_job' || chart.input.category === 'promotion_transfer') {
    const employerYogas = tajika.allYogas.filter(
      (y) =>
        (y.planets.includes(lagnaLord) && (y.planets.includes(SIGNS[(chart.ascendantSignIndex + 2) % 12].lord) || y.planets.includes(SIGNS[(chart.ascendantSignIndex + 8) % 12].lord)))
    );
    domainRows.push(
      { label: 'Career CSL Houses (2,6,10,11 vs 5,8,12)', value: kp.domainEvaluation.explanation, source: '03_rppandey & KP' },
      { label: 'Employer Change (3/9/6/12)', value: employerYogas.length > 0 ? employerYogas.map((e) => e.type).join(', ') : `1L ${lagnaLord} (${lagnaLordPos.isRetrograde ? 'Retrograde' : 'Direct'}) vs 3L/9L`, source: 'Prasna Tantra Ch II Stanzas 56-60' },
      { label: 'D-10 Dashamsa Check', value: `10L (${lord10}) falls in D-10 ${SIGNS[lord10Pos.dashamsaSignIndex].name}`, source: '05_astrosutras_profession_change.md' }
    );
  } else if (chart.input.category === 'property_vehicle' || chart.input.category === 'finance_loan') {
    const p11 = byId.get(SIGNS[(chart.ascendantSignIndex + 10) % 12].lord)!;
    const h2Slowest = chart.planets
      .filter((p) => p.id !== 'Rahu' && p.id !== 'Ketu' && p.houseWholeSign === 2)
      .map((p) => p.id);
    domainRows.push(
      { label: 'Transaction Roles (Ch II H4 & Ch III 183-185)', value: `Buyer=1L (${lagnaLord}), Seller=7L (${lord7}), Property=4L (${lord4}), Price=10L (${lord10}), Profit=11L (${p11.id} in ${p11.houseWholeSign}H)`, source: 'Prasna Tantra Ch II & III' },
      { label: 'KP Loan/Finance CSL (2,6,11 vs 5,8,12)', value: kp.domainEvaluation.explanation, source: '03_rppandey_what_is_horary.md' },
      { label: '2nd House Slower Planet Income Source', value: h2Slowest.length > 0 ? h2Slowest.join(', ') : `Derived from 2L (${lord2} in ${lord2Pos.houseWholeSign}H)`, source: 'Prasna Tantra Ch II H2' }
    );
  } else if (chart.input.category === 'legal_litigation') {
    domainRows.push(
      { label: 'Open (7H) vs Secret (6H) Enemies', value: `7L ${lord7} (${lord7Pos.dignity}, ${lord7Pos.houseWholeSign}H) vs 6L ${SIGNS[(chart.ascendantSignIndex + 5) % 12].lord} (${byId.get(SIGNS[(chart.ascendantSignIndex + 5) % 12].lord)!.dignity})`, source: 'Prasna Tantra Ch II H12' },
      { label: 'Superior vs Inferior & 1L vs 7L Strength', value: `1L ${lagnaLord} (${lagnaLordPos.dignity}) vs 7L ${lord7} (${lord7Pos.dignity})`, source: 'Prasna Tantra Ch II H8' }
    );
  } else {
    domainRows.push(
      { label: 'KP Sub-Lord Evaluation', value: kp.domainEvaluation.explanation, source: kp.domainEvaluation.source },
      { label: 'Tajika Primary Pair', value: tajika.summary, source: 'Prasna Tantra Ch II & IV' },
      { label: 'Kerala 21-Point Bhava Ruin', value: kerala.bhavaRuin.verdict, source: 'Prasna Marga L11015-11314' }
    );
  }

  if (chart.input.category === 'pregnancy_children') {
    const beeja = chart.sphutas.find((s) => s.name === 'Beeja Sphuta');
    const kshetra = chart.sphutas.find((s) => s.name === 'Kshetra Sphuta');
    const ascNavElapsed = Math.floor((chart.ascendantSidereal % 30) / (30 / 9)) + 1;
    domainRows.push(
      {
        label: 'Beeja & Kshetra Sphuta (Raman Prasnatantra L1428)',
        value: `Beeja: ${beeja ? `${beeja.signName} ${beeja.dmsInSign}` : '-'} (${beeja && SIGNS[beeja.signIndex].odd ? 'Odd/Fertile Male Seed' : 'Even/Restrained'}); Kshetra: ${kshetra ? `${kshetra.signName} ${kshetra.dmsInSign}` : '-'} (${kshetra && !SIGNS[kshetra.signIndex].odd ? 'Even/Receptive Female Field' : 'Odd/Restrained'})`,
        source: 'B.V. Raman Prasnatantra Ch II L1428',
      },
      {
        label: 'Lagna Navamsa Gestation Cue (L1434-1469)',
        value: `Ascendant in Navamsa #${ascNavElapsed}/9 (remaining Navamsas: ${9 - ascNavElapsed}); Venus sign offset from Lagna = ${((byId.get('Venus')!.signIndex - chart.ascendantSignIndex + 12) % 12) + 1} signs.`,
        source: 'Prasnatantra Stanzas 36-38',
      }
    );
  }

  if (chart.input.category === 'travel_missing') {
    domainRows.push({
      label: "Missing Person Separating/Applying Orb (SA)",
      value: systemsApproach.missingPersonSeparationNote,
      source: 'V.K. Choudhry Prasna Application L4158-4201',
    });
  }

  if (kp.domainEvaluation.readerVSpecialNotes.length > 0) {
    domainRows.push({
      label: 'Reader V & Times KP Signals',
      value: kp.domainEvaluation.readerVSpecialNotes.join(' '),
      source: 'K.S. Krishnamurti Reader V & The Times KP',
    });
  }

  const lms = chart.panchanga.lunarMicroStates;
  domainRows.push(
    {
      label: "Systems' Approach Prime Determinant",
      value: `${systemsApproach.saSummary} Prime: [${systemsApproach.primeDeterminant.primePlanets.join(', ')}].`,
      source: 'V.K. Choudhry Prasna Application Ch. 4-15',
    },
    {
      label: 'Lunar Micro-States & Ascendant Drekkana',
      value: `Chandra Kriya #${lms.chandraKriyaIndex}/60 ("${lms.chandraKriyaLabel}") · Vela #${lms.chandraVelaIndex}/36 ("${lms.chandraVelaLabel}") · Avastha #${lms.chandraAvasthaIndex}/12 ("${lms.chandraAvasthaLabel}") · Drekkana #${lms.ascDrekkanaIndex} (${lms.ascDrekkanaNature})`,
      source: 'Prasna Marga L6967-6977 & Appendix IV-VII',
    }
  );

  if (systemsApproach.bhriguNadi.nadiEntryNumber !== null) {
    domainRows.push({
      label: 'Bhrigu Prashna Nadi Age Index',
      value: systemsApproach.bhriguNadi.formulaNote,
      source: 'R.G. Rao Bhrigu Prashna Nadi L30-53',
    });
  }

  // --- CHOSEN METHOD-BASED PREDICTION SCORING ---
  const kpScore = kp.domainEvaluation.scorePct;
  const tajikaScore = tajika.karyasiddhiTierPct;
  const keralaScore = Math.max(
    15,
    Math.min(
      95,
      85 -
        kerala.bhavaRuin.totalRuinPoints * 5 +
        (lagnaSign.udaya === 'Shirshodaya' ? 8 : lagnaSign.udaya === 'Prishtodaya' ? -5 : 0) +
        (kerala.ashtamangala.enabled ? (kerala.ashtamangala.oddCount - 1.5) * 6 : 0)
    )
  );

  // Hora Lord & Hora Lagna Evaluation
  const horaLord = chart.panchanga.horaLord;
  const horaPos = byId.get(horaLord);
  const horaSuitableByCat: Record<string, SevenPlanetId[]> = {
    general_yes_no: ['Jupiter', 'Venus', 'Mercury', 'Moon', 'Sun'],
    career_job: ['Saturn', 'Mercury', 'Jupiter', 'Sun'],
    promotion_transfer: ['Sun', 'Jupiter', 'Mercury', 'Mars'],
    marriage_relationship: ['Venus', 'Jupiter', 'Moon'],
    finance_loan: ['Jupiter', 'Mercury', 'Venus', 'Moon'],
    lost_stolen: ['Moon', 'Mercury', 'Jupiter', 'Venus'],
    medical_health: ['Sun', 'Moon', 'Jupiter', 'Venus'],
    property_vehicle: ['Mars', 'Venus', 'Moon', 'Jupiter'],
    legal_litigation: ['Mars', 'Saturn', 'Sun', 'Jupiter'],
    travel_missing: ['Moon', 'Mercury', 'Jupiter', 'Venus'],
    pregnancy_children: ['Jupiter', 'Moon', 'Venus', 'Sun'],
    education_exam: ['Mercury', 'Jupiter', 'Venus', 'Moon'],
    blind_mook: ['Moon', 'Jupiter', 'Mercury', 'Venus'],
  };
  const topicPreferredHoras = horaSuitableByCat[chart.input.category] ?? ['Jupiter', 'Venus', 'Mercury'];
  const horaTopicMatch = topicPreferredHoras.includes(horaLord);
  const horaLagnaFriend = PERMANENT_FRIENDSHIP[horaLord].friends.includes(tajika.lagnaLord) || horaLord === tajika.lagnaLord;
  const horaKaryeshaFriend = PERMANENT_FRIENDSHIP[horaLord].friends.includes(tajika.karyesha) || horaLord === tajika.karyesha;
  const horaInGoodHouse = horaPos ? [1, 2, 4, 5, 7, 9, 10, 11].includes(horaPos.houseWholeSign) : false;
  const horaDignityGood = horaPos ? ['Exalted', 'Moolatrikona', 'Own Sign', 'Great Friend', 'Friend'].includes(horaPos.dignity) : false;
  const horaAfflicted = horaPos ? (horaPos.isCombust || ['Debilitated', 'Enemy', 'Great Enemy'].includes(horaPos.dignity) || [6, 8, 12].includes(horaPos.houseWholeSign)) : false;

  let horaScorePct = 52;
  if (horaTopicMatch) horaScorePct += 16;
  else horaScorePct -= 8;
  if (horaLagnaFriend) horaScorePct += 8;
  if (horaKaryeshaFriend) horaScorePct += 10;
  if (horaInGoodHouse) horaScorePct += 8;
  if (horaDignityGood) horaScorePct += 8;
  if (horaAfflicted) horaScorePct -= 16;
  horaScorePct = Math.max(18, Math.min(95, horaScorePct));

  const horaTone: 'good' | 'warn' | 'bad' = horaScorePct >= 66 ? 'good' : horaScorePct >= 46 ? 'warn' : 'bad';
  const horaBadge: 'Favourable' | 'Mixed' | 'Unfavourable' =
    horaTone === 'good' ? 'Favourable' : horaTone === 'warn' ? 'Mixed' : 'Unfavourable';
  const horaMeaning =
    horaTone === 'good'
      ? `Active ${horaLord} Hora (#${chart.panchanga.horaNumber}) naturally supports ${catMeta.label} and aligns well with the chart.`
      : horaTone === 'warn'
      ? `Active ${horaLord} Hora (#${chart.panchanga.horaNumber}) brings mixed energy — steady patience works better than rushing.`
      : `Active ${horaLord} Hora (#${chart.panchanga.horaNumber}) adds resistance or delay for ${catMeta.label}; acting in a friendlier Hora helps.`;

  const upcomingBestHora = chart.panchanga.horaSchedule.find(
    (slot) => slot.horaNumber > chart.panchanga.horaNumber && topicPreferredHoras.slice(0, 2).includes(slot.lord)
  ) ?? chart.panchanga.horaSchedule.find((slot) => topicPreferredHoras.slice(0, 2).includes(slot.lord));
  const nextBestHoraNote = upcomingBestHora
    ? `Next supportive window: ${upcomingBestHora.lord} Hora (${upcomingBestHora.startLocal.slice(-8)}–${upcomingBestHora.endLocal.slice(-8)})`
    : 'Choose Jupiter or Venus Hora on the same day for important action.';

  // Nostril / Swara Yoga Evaluation
  const nostril = chart.input.swaraNostril;
  const swaraPos = chart.input.swaraPosition ?? 'unknown';
  const calmTopics = new Set([
    'general_yes_no',
    'marriage_relationship',
    'pregnancy_children',
    'education_exam',
    'medical_health',
    'property_vehicle',
  ]);
  const swaraLabelMap: Record<string, string> = {
    unknown: 'Not Checked',
    left_ida: 'Left Nostril (Ida / Moon Swara)',
    right_pingala: 'Right Nostril (Pingala / Sun Swara)',
    both_sushumna: 'Both Nostrils Equally (Sushumna)',
  };
  const swaraPosLabelMap: Record<string, string> = {
    unknown: 'Not Checked',
    same_side: 'Same Side as Active Nostril',
    opposite_side: 'Opposite Side to Active Nostril',
    front: 'Seated Directly in Front',
  };

  let swaraScorePct: number | null = null;
  let swaraTone: 'good' | 'warn' | 'bad' | 'info' = 'info';
  let swaraBadge: 'Favourable' | 'Mixed' | 'Unfavourable' | 'Not Checked' = 'Not Checked';
  let swaraMeaning = 'Nostril (Swara) was not checked; prediction uses chart, KP, Tajika, and Hora signals.';

  if (nostril === 'left_ida') {
    const fitsTopic = calmTopics.has(chart.input.category);
    let score = fitsTopic ? 78 : 58;
    if (chart.panchanga.paksha === 'Shukla') score += 8;
    if (swaraPos === 'same_side') score += 10;
    else if (swaraPos === 'opposite_side') score -= 12;
    swaraScorePct = Math.max(25, Math.min(96, score));
    swaraTone = swaraScorePct >= 66 ? 'good' : 'warn';
    swaraBadge = swaraTone === 'good' ? 'Favourable' : 'Mixed';
    swaraMeaning = fitsTopic
      ? `Left Nostril (Ida / Moon) gives gentle, auspicious momentum for ${catMeta.label}${swaraPos === 'same_side' ? ' with full same-side support' : ''}.`
      : `Left Nostril (Ida) prefers peaceful steps; for ${catMeta.label}, steady diplomacy works better than force.`;
  } else if (nostril === 'right_pingala') {
    const fitsActionTopic = !calmTopics.has(chart.input.category);
    let score = fitsActionTopic ? 78 : 58;
    if (chart.panchanga.paksha === 'Krishna') score += 8;
    if (swaraPos === 'same_side') score += 10;
    else if (swaraPos === 'opposite_side') score -= 12;
    swaraScorePct = Math.max(25, Math.min(96, score));
    swaraTone = swaraScorePct >= 66 ? 'good' : 'warn';
    swaraBadge = swaraTone === 'good' ? 'Favourable' : 'Mixed';
    swaraMeaning = fitsActionTopic
      ? `Right Nostril (Pingala / Sun) gives active drive and winning momentum for ${catMeta.label}${swaraPos === 'same_side' ? ' with same-side support' : ''}.`
      : `Right Nostril (Pingala) brings intense drive; avoid haste or harsh words in ${catMeta.label}.`;
  } else if (nostril === 'both_sushumna') {
    swaraScorePct = 32;
    swaraTone = 'bad';
    swaraBadge = 'Unfavourable';
    swaraMeaning =
      'Both nostrils flowing equally (Sushumna) signals an unsettled moment — wait until Left or Right nostril flows clearly before taking final decisions.';
  }

  const radicalityPenalty = radicality.isRadical ? 0 : -12;
  const swaraAdjustment =
    swaraScorePct === null ? 0 : swaraScorePct >= 75 ? 4 : swaraScorePct <= 40 ? -6 : 0;

  const scorePlanetStrength = (pos?: PlanetPosition): number => {
    if (!pos) return 52;
    let s = 56;
    if ([1, 2, 4, 5, 7, 9, 10, 11].includes(pos.houseWholeSign)) s += 14;
    else if ([6, 8, 12].includes(pos.houseWholeSign)) s -= 14;
    else s -= 4;
    if (['Exalted', 'Moolatrikona', 'Own Sign', 'Great Friend', 'Friend'].includes(pos.dignity)) s += 14;
    else if (['Debilitated', 'Great Enemy', 'Enemy'].includes(pos.dignity)) s -= 14;
    if (pos.isCombust) s -= 12;
    else s += 4;
    return Math.max(18, Math.min(95, s));
  };

  const udayaScore = lagnaSign.udaya === 'Shirshodaya' ? 78 : lagnaSign.udaya === 'Ubhayodaya' ? 62 : 44;
  const lagnaLordStrength = Math.round(0.6 * scorePlanetStrength(byId.get(lagnaSign.lord)) + 0.4 * udayaScore);

  const navAscIdxForMethod =
    chart.prashna108Info?.navamsaSignIndex ?? Math.floor(chart.ascendantSidereal / (30 / 9)) % 12;
  const navLord = SIGNS[navAscIdxForMethod].lord;
  const navamsaStrength = scorePlanetStrength(byId.get(navLord));

  const aksharaMap: Record<string, SevenPlanetId> = {
    A: 'Sun',
    Ka: 'Mars',
    Cha: 'Venus',
    Ta: 'Mercury',
    Tha: 'Jupiter',
    Pa: 'Saturn',
    Ya_Sa: 'Moon',
  };
  const activeAksharaGroup = chart.input.pranaksharaGroup ?? 'A';
  const aksharaRuler = aksharaMap[activeAksharaGroup] ?? 'Sun';
  const aksharaRulerScore = scorePlanetStrength(byId.get(aksharaRuler));

  const moonBaseStrength = scorePlanetStrength(moon);
  const moonClarityScore = Math.max(
    18,
    Math.min(95, moonBaseStrength + (chart.panchanga.paksha === 'Shukla' ? 8 : -4))
  );

  const toTone = (s: number, hi = 66, mid = 48): { tone: 'good' | 'warn' | 'bad'; badge: 'Favourable' | 'Mixed' | 'Unfavourable' } =>
    s >= hi
      ? { tone: 'good', badge: 'Favourable' }
      : s >= mid
      ? { tone: 'warn', badge: 'Mixed' }
      : { tone: 'bad', badge: 'Unfavourable' };

  const activeCastingMeta = CASTING_METHOD_OPTIONS.find((m) => m.id === chart.input.castingMode);
  const activeMethodLabel = activeCastingMeta?.label ?? 'Question Time Lagna';
  const horaLagnaSign = SIGNS[chart.horaLagnaSignIndex ?? chart.ascendantSignIndex];
  const horaLagnaLordScore = scorePlanetStrength(byId.get(horaLagnaSign.lord));

  let methodBaseScore = 55;
  const methodLayers: MethodLayerItem[] = [];

  const horaLayerItem: MethodLayerItem = {
    layerName: `Hora Lord (${horaLord} #${chart.panchanga.horaNumber}) & Hora Lagna (${horaLagnaSign.name})`,
    scorePct: horaScorePct,
    tone: horaTone,
    badgeText: horaBadge,
    shortOutcome: `${horaLord} Hora · ${horaScorePct}%`,
    plainMeaning: `${horaMeaning} ${nextBestHoraNote}`,
  };
  const swaraLayerItem: MethodLayerItem = {
    layerName: 'Nostril (Swara Yoga)',
    scorePct: swaraScorePct,
    tone: swaraTone,
    badgeText: swaraBadge,
    shortOutcome: swaraLabelMap[nostril],
    plainMeaning: swaraMeaning,
  };

  switch (chart.input.castingMode) {
    case 'kp_horary': {
      methodBaseScore = 0.80 * kpScore + 0.20 * horaScorePct;
      const kpT = toTone(kpScore, 65, 46);
      const rpMatch = kp.cleanRulingPlanets.includes(kp.domainEvaluation.cuspSubLord) || kp.cleanRulingPlanets.length >= 3;
      const rpScore = rpMatch ? 78 : 54;
      const rpT = toTone(rpScore, 66, 48);
      methodLayers.push(
        {
          layerName: '1. Selected KP Horary Number & Sub-Lord',
          scorePct: kpScore,
          tone: kpT.tone,
          badgeText: kpT.badge,
          shortOutcome: `KP #${chart.input.kpNumber} -> Cusp ${kp.domainEvaluation.primaryCusp} Sub-Lord ${kp.domainEvaluation.cuspSubLord} (${kpScore}%)`,
          plainMeaning: kp.domainEvaluation.explanation,
        },
        {
          layerName: '2. KP Ruling Planets & Moment Alignment',
          scorePct: rpScore,
          tone: rpT.tone,
          badgeText: rpT.badge,
          shortOutcome: kp.cleanRulingPlanets.join(', ') || 'Direct trigger awaited',
          plainMeaning: rpMatch
            ? `Active Ruling Planets (${kp.cleanRulingPlanets.join(', ')}) confirm and time this KP Horary promise.`
            : 'Ruling Planets are partial; timing will activate when Moon or Transit touches the Cusp Sub-Lord star.',
        },
        horaLayerItem,
        swaraLayerItem
      );
      break;
    }
    case 'number_108': {
      methodBaseScore = 0.48 * navamsaStrength + 0.32 * tajikaScore + 0.20 * horaScorePct;
      const lagnaT = toTone(lagnaLordStrength);
      const navT = toTone(navamsaStrength);
      const tajT = toTone(Math.round(tajikaScore), 68, 48);
      methodLayers.push(
        {
          layerName: `1. Number ${chart.input.prashna108Number} -> Prasna Lagna (${lagnaSign.name})`,
          scorePct: lagnaLordStrength,
          tone: lagnaT.tone,
          badgeText: lagnaT.badge,
          shortOutcome: `${lagnaSign.name} Lagna (Lord ${lagnaSign.lord} · ${lagnaLordStrength}%)`,
          plainMeaning: `${chart.specialMethodInfo?.summary ?? ''}. ${lagnaSign.name} is ${lagnaSign.udaya} and its lord ${lagnaSign.lord} is in House ${byId.get(lagnaSign.lord)?.houseWholeSign ?? 1}.`,
        },
        {
          layerName: `2. Remainder -> Navamsa Lagna (${SIGNS[navAscIdxForMethod].name})`,
          scorePct: navamsaStrength,
          tone: navT.tone,
          badgeText: navT.badge,
          shortOutcome: `${SIGNS[navAscIdxForMethod].name} Navamsa (Lord ${navLord} · ${navamsaStrength}%)`,
          plainMeaning: `Remainder sets ${SIGNS[navAscIdxForMethod].name} as Navamsa Lagna; its lord ${navLord} sits in House ${byId.get(navLord)?.houseWholeSign ?? 1} (${byId.get(navLord)?.dignity ?? 'Neutral'}) showing the underlying outcome.`,
        },
        {
          layerName: '3. Lagna & Work-House Lord Connection (Tajika)',
          scorePct: Math.round(tajikaScore),
          tone: tajT.tone,
          badgeText: tajT.badge,
          shortOutcome: tajika.verdictLabel,
          plainMeaning: tajika.summary,
        },
        horaLayerItem,
        swaraLayerItem
      );
      break;
    }
    case 'hora_lagna': {
      methodBaseScore = 0.52 * horaScorePct + 0.28 * horaLagnaLordScore + 0.20 * tajikaScore;
      const hlT = toTone(horaLagnaLordScore);
      const tajT = toTone(Math.round(tajikaScore), 68, 48);
      methodLayers.push(
        horaLayerItem,
        {
          layerName: `2. Hora Lagna Ascendant (${horaLagnaSign.name})`,
          scorePct: horaLagnaLordScore,
          tone: hlT.tone,
          badgeText: hlT.badge,
          shortOutcome: `${horaLagnaSign.name} (Lord ${horaLagnaSign.lord} in H${byId.get(horaLagnaSign.lord)?.houseWholeSign ?? 1})`,
          plainMeaning: `${chart.specialMethodInfo?.summary ?? ''}. Hora Lagna lord ${horaLagnaSign.lord} holds ${byId.get(horaLagnaSign.lord)?.dignity ?? 'Neutral'} dignity (${horaLagnaLordScore}%).`,
        },
        {
          layerName: '3. Work-House Connection from Hora Lagna',
          scorePct: Math.round(tajikaScore),
          tone: tajT.tone,
          badgeText: tajT.badge,
          shortOutcome: tajika.verdictLabel,
          plainMeaning: tajika.summary,
        },
        swaraLayerItem
      );
      break;
    }
    case 'ashtamangala': {
      methodBaseScore = 0.65 * keralaScore + 0.20 * tajikaScore + 0.15 * horaScorePct;
      const kerT = toTone(Math.round(keralaScore), 66, 46);
      const tajT = toTone(Math.round(tajikaScore), 68, 48);
      const triadScore = Math.max(25, Math.min(92, 56 + (kerala.ashtamangala.oddCount - 1.5) * 14));
      const trT = toTone(Math.round(triadScore));
      methodLayers.push(
        {
          layerName: '1. Ashtamangala 3-Number Triad',
          scorePct: Math.round(triadScore),
          tone: trT.tone,
          badgeText: trT.badge,
          shortOutcome: `Triad ${kerala.ashtamangala.piles.join('-')} (${kerala.ashtamangala.oddCount}/3 odd)`,
          plainMeaning: chart.specialMethodInfo?.summary ?? kerala.ashtamangala.summary,
        },
        {
          layerName: '2. 21-Point Bhava Foundation & Sign Rising',
          scorePct: Math.round(keralaScore),
          tone: kerT.tone,
          badgeText: kerT.badge,
          shortOutcome: `${kerala.bhavaRuin.verdict} (${Math.round(keralaScore)}%)`,
          plainMeaning: kerala.udayaAnalysis.interpretation,
        },
        {
          layerName: '3. Question & Gain House Yoga',
          scorePct: Math.round(tajikaScore),
          tone: tajT.tone,
          badgeText: tajT.badge,
          shortOutcome: tajika.verdictLabel,
          plainMeaning: tajika.summary,
        },
        horaLayerItem,
        swaraLayerItem
      );
      break;
    }
    case 'arudha_override': {
      methodBaseScore = 0.50 * lagnaLordStrength + 0.35 * tajikaScore + 0.15 * horaScorePct;
      const lagT = toTone(lagnaLordStrength);
      const tajT = toTone(Math.round(tajikaScore), 68, 48);
      methodLayers.push(
        {
          layerName: `1. Chosen Arudha Rasi (${lagnaSign.name}) & Lord (${lagnaSign.lord})`,
          scorePct: lagnaLordStrength,
          tone: lagT.tone,
          badgeText: lagT.badge,
          shortOutcome: `${lagnaSign.name} (${lagnaSign.udaya}) · ${lagnaLordStrength}%`,
          plainMeaning: `${chart.specialMethodInfo?.summary ?? ''}. Lord ${lagnaSign.lord} in House ${byId.get(lagnaSign.lord)?.houseWholeSign ?? 1} shows how the Arudha seed unfolds.`,
        },
        {
          layerName: '2. Work-House Connection from Chosen Rasi',
          scorePct: Math.round(tajikaScore),
          tone: tajT.tone,
          badgeText: tajT.badge,
          shortOutcome: tajika.verdictLabel,
          plainMeaning: tajika.summary,
        },
        horaLayerItem,
        swaraLayerItem
      );
      break;
    }
    case 'mooka_prashna': {
      methodBaseScore = 0.45 * moonClarityScore + 0.35 * lagnaLordStrength + 0.20 * horaScorePct;
      const moonT = toTone(moonClarityScore);
      const lagT = toTone(lagnaLordStrength);
      methodLayers.push(
        {
          layerName: `1. Unspoken Topic Inference (${mookBlind.natureOfQueryDhatuMoolaJeeva})`,
          scorePct: moonClarityScore,
          tone: moonT.tone,
          badgeText: moonT.badge,
          shortOutcome: `House ${mookBlind.inferredHouseFocus} · ${moonClarityScore}%`,
          plainMeaning: `${chart.specialMethodInfo?.summary ?? ''} ${mookBlind.inferredTopicHint}`,
        },
        {
          layerName: `2. Moon & Rising Sign (${lagnaSign.name}) Clarity`,
          scorePct: lagnaLordStrength,
          tone: lagT.tone,
          badgeText: lagT.badge,
          shortOutcome: `Moon in H${moon.houseWholeSign} (${moon.dignity})`,
          plainMeaning: kerala.udayaAnalysis.interpretation,
        },
        horaLayerItem,
        swaraLayerItem
      );
      break;
    }
    case 'akshara_prashna': {
      methodBaseScore = 0.55 * aksharaRulerScore + 0.25 * lagnaLordStrength + 0.20 * horaScorePct;
      const akT = toTone(aksharaRulerScore);
      const lagT = toTone(lagnaLordStrength);
      methodLayers.push(
        {
          layerName: `1. First Syllable Group (${activeAksharaGroup} -> Ruler ${aksharaRuler})`,
          scorePct: aksharaRulerScore,
          tone: akT.tone,
          badgeText: akT.badge,
          shortOutcome: `${aksharaRuler} in ${byId.get(aksharaRuler)?.signName} H${byId.get(aksharaRuler)?.houseWholeSign} (${aksharaRulerScore}%)`,
          plainMeaning: `${chart.specialMethodInfo?.summary ?? ''} Syllable ruler ${aksharaRuler} sits in House ${byId.get(aksharaRuler)?.houseWholeSign ?? 1} (${byId.get(aksharaRuler)?.dignity ?? 'Neutral'}).`,
        },
        {
          layerName: `2. Cast Lagna (${lagnaSign.name}) & Work Alignment`,
          scorePct: lagnaLordStrength,
          tone: lagT.tone,
          badgeText: lagT.badge,
          shortOutcome: `${lagnaSign.name} (${lagnaSign.udaya})`,
          plainMeaning: tajika.summary,
        },
        horaLayerItem,
        swaraLayerItem
      );
      break;
    }
    case 'time_lagna':
    default: {
      methodBaseScore =
        0.48 * tajikaScore + 0.25 * lagnaLordStrength + 0.17 * keralaScore + 0.10 * horaScorePct + radicalityPenalty;
      const lagT = toTone(lagnaLordStrength);
      const tajT = toTone(Math.round(tajikaScore), 68, 48);
      const radScore = radicality.isRadical ? 80 : 40;
      const radT = toTone(radScore, 65, 45);
      methodLayers.push(
        {
          layerName: `1. Question Time Lagna (${lagnaSign.name} · ${lagnaSign.udaya})`,
          scorePct: lagnaLordStrength,
          tone: lagT.tone,
          badgeText: lagT.badge,
          shortOutcome: `${lagnaSign.name} (Lord ${lagnaSign.lord} · ${lagnaLordStrength}%)`,
          plainMeaning: `${lagnaSign.name} is ${lagnaSign.udaya === 'Shirshodaya' ? 'head-rising (smooth forward progress)' : lagnaSign.udaya === 'Prishtodaya' ? 'hind-rising (takes steady effort)' : 'dual-rising (adaptable progress)'}. Lord ${lagnaSign.lord} in House ${byId.get(lagnaSign.lord)?.houseWholeSign ?? 1}.`,
        },
        {
          layerName: '2. Lagna & Work-House Lord Connection (Tajika)',
          scorePct: Math.round(tajikaScore),
          tone: tajT.tone,
          badgeText: tajT.badge,
          shortOutcome: tajika.verdictLabel,
          plainMeaning: tajika.summary,
        },
        {
          layerName: '3. Chart Clarity & Foundation Check',
          scorePct: radScore,
          tone: radT.tone,
          badgeText: radT.badge,
          shortOutcome: radicality.isRadical ? `Clear Question (${radicality.sincerityScore}/100)` : 'Mind / Time Advisory Present',
          plainMeaning: radicality.isRadical
            ? 'Time Lagna passes clarity checks cleanly; answer can be relied upon directly.'
            : 'Some hesitation or late/early timing sign appears — double-check practical facts.',
        },
        horaLayerItem,
        swaraLayerItem
      );
      break;
    }
  }

  const unifiedScorePct = Math.round(
    Math.max(5, Math.min(98, methodBaseScore + swaraAdjustment))
  );

  let unifiedVerdict: DomainAnalysisReport['unifiedVerdict'] = 'Mixed / Conditional';
  if (unifiedScorePct >= 72) unifiedVerdict = 'Strong Yes';
  else if (unifiedScorePct >= 56) unifiedVerdict = 'Favourable with Effort / Delay';
  else if (unifiedScorePct < 42) unifiedVerdict = 'Unfavourable / Denial';

  const citations: RuleCitationCard[] = [
    {
      system: 'KP Horary',
      title: `Cusp ${kp.domainEvaluation.primaryCusp} Sub-Lord (${kp.domainEvaluation.cuspSubLord})`,
      favourable: kp.domainEvaluation.verdict === 'Strong Yes' || kp.domainEvaluation.verdict === 'Favourable with Delay',
      detail: kp.domainEvaluation.explanation,
      source: kp.domainEvaluation.source,
    },
    {
      system: 'Tajika',
      title: `Lagna Lord (${tajika.lagnaLord}) & Karyesha ${tajika.karyeshaHouse}L (${tajika.karyesha}) — ${tajika.verdictLabel}`,
      favourable: tajika.karyasiddhiTierPct >= 75,
      detail: tajika.summary,
      source: 'Prasna Tantra Ch II & IV',
    },
    {
      system: 'Kerala (Prasna Marga)',
      title: `21-Point Bhava Ruin (${kerala.bhavaRuin.totalRuinPoints}/21) & Udaya (${lagnaSign.udaya})`,
      favourable: kerala.bhavaRuin.totalRuinPoints <= 4,
      detail: `${kerala.bhavaRuin.verdict}. ${kerala.udayaAnalysis.interpretation}`,
      source: 'Prasna Marga L11015-11314 & Astrosutras Udaya',
    },
    {
      system: 'Classical (Prasna Tantra)',
      title: `Radicality (${radicality.sincerityScore}/100) & ${radicality.triggeredDoshaCount} Time-Doshas`,
      favourable: radicality.isRadical && radicality.triggeredDoshaCount <= 1,
      detail: `Timing Cue: ${timing.hemisphereRate.summary} Kalapinda unit: ${timing.kalapindaScale.timeUnit}.`,
      source: 'Prasna Tantra Ch I & Prasna Marga L1680-2168',
    },
    {
      system: "Systems' Approach (SA)",
      title: `MEP ${systemsApproach.mepDegFormatted} · MMP ${systemsApproach.mmp} (${systemsApproach.saScorePct}%)`,
      favourable: systemsApproach.saScorePct >= 65,
      detail: systemsApproach.saSummary,
      source: 'V.K. Choudhry Prasna Application (5° MEP & Functional Nature)',
    },
    {
      system: 'Lunar Micro-States',
      title: `Kriya #${lms.chandraKriyaIndex}/60 · Vela #${lms.chandraVelaIndex}/36 · Avastha #${lms.chandraAvasthaIndex}/12`,
      favourable: 'neutral',
      detail: `Moon Nakshatra arc ${lms.moonNakArcMin}' -> Kriya: ${lms.chandraKriyaLabel}; Vela: ${lms.chandraVelaLabel}; Avastha: ${lms.chandraAvasthaLabel}.`,
      source: 'Prasna Marga L6967-6977 & Appendix IV-VI',
    },
  ];

  // Botanical Fruition (Prasna Tantra Ch IV)
  const navAscIdx = Math.floor(chart.ascendantSidereal / (30 / 9)) % 12;
  const bhavaSign = SIGNS[(chart.ascendantSignIndex + primaryHouse - 1) % 12];

  return {
    categoryLabel: catMeta.label,
    primaryHouse,
    activeMethodLabel,
    unifiedVerdict,
    unifiedScorePct,
    threeSystemAlignment: {
      classicalKeralaVerdict: `${kerala.bhavaRuin.verdict} (${Math.round(keralaScore)}%)`,
      tajikaVerdict: tajika.verdictLabel,
      kpVerdict: `${kp.domainEvaluation.verdict} (${kpScore}%)`,
      systemsApproachVerdict: `${systemsApproach.saScorePct >= 65 ? 'Supportive' : systemsApproach.saScorePct >= 48 ? 'Afflicted / Mixed' : 'Weak / Afflicted'} (${systemsApproach.saScorePct}%)`,
    },
    horaAnalysis: {
      horaLord,
      horaNumber: chart.panchanga.horaNumber,
      horaLagnaSignName: chart.horaLagnaSignName,
      horaScorePct,
      tone: horaTone,
      badgeText: horaBadge,
      plainMeaning: horaMeaning,
      nextBestHoraNote,
    },
    swaraAnalysis: {
      checked: nostril !== 'unknown',
      nostrilLabel: swaraLabelMap[nostril],
      positionLabel: swaraPosLabelMap[swaraPos],
      scorePct: swaraScorePct,
      tone: swaraTone,
      badgeText: swaraBadge,
      plainMeaning: swaraMeaning,
    },
    methodLayers,
    citations,
    coraTheft,
    medicalBadha,
    mookBlind,
    domainHighlights: {
      title: `${catMeta.label} — Specific Rules`,
      rows: domainRows,
    },
    botanicalFruition: {
      moonSeed: `Moon in ${moon.signName} (${moon.houseWholeSign}H) — Initial impulse / Seed`,
      lagnaFlower: `Lagna in ${lagnaSign.name} (${lagnaSign.udaya}) — Present manifestation / Flower`,
      navamsaLagnaFruit: `Navamsa Lagna in ${SIGNS[navAscIdx].name} — Final fruition / Fruit`,
      bhavaTaste: `Bhava ${primaryHouse} (${bhavaSign.name}) — Experienced quality / Taste`,
    },
  };
}

export { KP_249_TABLE };
