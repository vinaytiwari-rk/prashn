import type {
  Kp249Slot,
  NakshatraInfo,
  NineGrahaId,
  QuestionCategory,
  RuleSettings,
  SevenPlanetId,
  SignInfo,
} from './types';
import { formatDms } from './time';

export const SEVEN_PLANETS: SevenPlanetId[] = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
];

export const NINE_GRAHAS: NineGrahaId[] = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
  'Rahu',
  'Ketu',
];

export const PLANET_SHORT: Record<NineGrahaId, string> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
};

export const VIMSHOTTARI_ORDER: NineGrahaId[] = [
  'Ketu',
  'Venus',
  'Sun',
  'Moon',
  'Mars',
  'Rahu',
  'Jupiter',
  'Saturn',
  'Mercury',
];

export const VIMSHOTTARI_YEARS: Record<NineGrahaId, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
};

// Prasna Tantra Ch IV L1263: slowest to fastest
export const TAJIKA_SPEED_ORDER: SevenPlanetId[] = [
  'Saturn',
  'Jupiter',
  'Mars',
  'Sun',
  'Venus',
  'Mercury',
  'Moon',
];

// Prasna Tantra Ch IV L1257-1258
export const DEEPTHAMSA_ORB_DEG: Record<SevenPlanetId, number> = {
  Sun: 15,
  Moon: 12,
  Mars: 8,
  Mercury: 7,
  Jupiter: 9,
  Venus: 7,
  Saturn: 9,
};

// Prasna Tantra Ch II & Ch I notes
export function getCombustionOrbDeg(planet: SevenPlanetId, settings: RuleSettings): number | null {
  switch (planet) {
    case 'Mars':
      return 12;
    case 'Mercury':
      return settings.mercuryCombustDeg;
    case 'Jupiter':
      return 9;
    case 'Venus':
      return 7;
    case 'Saturn':
      return 9;
    default:
      return null;
  }
}

export const SIGNS: SignInfo[] = [
  { index: 0, name: 'Aries', sanskrit: 'Mesha', short: 'Ari', lord: 'Mars', element: 'Fire', modality: 'Movable', udaya: 'Prishtodaya', odd: true, cakraDirection: 'East', cardinalDirection: 'East', bodyForm: 'Quadruped', fertility: 'Barren', plainMeaning: 'Fast action, initiative, change, fiery drive; hind-rising so pushes happen first behind the scenes.' },
  { index: 1, name: 'Taurus', sanskrit: 'Vrishabha', short: 'Tau', lord: 'Venus', element: 'Earth', modality: 'Fixed', udaya: 'Prishtodaya', odd: false, cakraDirection: 'East', cardinalDirection: 'South', bodyForm: 'Quadruped', fertility: 'Semi-Fruitful', plainMeaning: 'Stability, patience, money, comforts, steady hold; things stay as they are without sudden shifts.' },
  { index: 2, name: 'Gemini', sanskrit: 'Mithuna', short: 'Gem', lord: 'Mercury', element: 'Air', modality: 'Dual', udaya: 'Shirshodaya', odd: true, cakraDirection: 'Corner', cardinalDirection: 'West', bodyForm: 'Biped', fertility: 'Barren', plainMeaning: 'Communication, two options, paperwork, quick head-rising clarity; effort brings movement.' },
  { index: 3, name: 'Cancer', sanskrit: 'Karka', short: 'Can', lord: 'Moon', element: 'Water', modality: 'Movable', udaya: 'Prishtodaya', odd: false, cakraDirection: 'South', cardinalDirection: 'North', bodyForm: 'Watery / Creeping', fertility: 'Fruitful', plainMeaning: 'Emotions, home, family, nurturing, high fertility & change; adapts rapidly.' },
  { index: 4, name: 'Leo', sanskrit: 'Simha', short: 'Leo', lord: 'Sun', element: 'Fire', modality: 'Fixed', udaya: 'Shirshodaya', odd: true, cakraDirection: 'South', cardinalDirection: 'East', bodyForm: 'Quadruped', fertility: 'Barren', plainMeaning: 'Authority, pride, leadership, fixed determination, clear visible progress.' },
  { index: 5, name: 'Virgo', sanskrit: 'Kanya', short: 'Vir', lord: 'Mercury', element: 'Earth', modality: 'Dual', udaya: 'Shirshodaya', odd: false, cakraDirection: 'Corner', cardinalDirection: 'South', bodyForm: 'Biped', fertility: 'Barren', plainMeaning: 'Analysis, details, health routines, accounting, practical adjustments.' },
  { index: 6, name: 'Libra', sanskrit: 'Tula', short: 'Lib', lord: 'Venus', element: 'Air', modality: 'Movable', udaya: 'Shirshodaya', odd: true, cakraDirection: 'West', cardinalDirection: 'West', bodyForm: 'Biped', fertility: 'Semi-Fruitful', plainMeaning: 'Partnerships, agreements, trade, fair negotiation, smooth head-rising resolution.' },
  { index: 7, name: 'Scorpio', sanskrit: 'Vrishchika', short: 'Sco', lord: 'Mars', element: 'Water', modality: 'Fixed', udaya: 'Shirshodaya', odd: false, cakraDirection: 'West', cardinalDirection: 'North', bodyForm: 'Watery / Creeping', fertility: 'Fruitful', plainMeaning: 'Deep investigation, hidden matters, lasting hold, quiet strength & endurance.' },
  { index: 8, name: 'Sagittarius', sanskrit: 'Dhanu', short: 'Sag', lord: 'Jupiter', element: 'Fire', modality: 'Dual', udaya: 'Prishtodaya', odd: true, cakraDirection: 'Corner', cardinalDirection: 'East', bodyForm: 'Biped', fertility: 'Semi-Fruitful', plainMeaning: 'Higher wisdom, long travel, guidance, dual options requiring sustained effort.' },
  { index: 9, name: 'Capricorn', sanskrit: 'Makara', short: 'Cap', lord: 'Saturn', element: 'Earth', modality: 'Movable', udaya: 'Prishtodaya', odd: false, cakraDirection: 'North', cardinalDirection: 'South', bodyForm: 'Quadruped', fertility: 'Semi-Fruitful', plainMeaning: 'Hard work, slow steady change, career structure, practical duty.' },
  { index: 10, name: 'Aquarius', sanskrit: 'Kumbha', short: 'Aqu', lord: 'Saturn', element: 'Air', modality: 'Fixed', udaya: 'Shirshodaya', odd: true, cakraDirection: 'North', cardinalDirection: 'West', bodyForm: 'Biped', fertility: 'Semi-Fruitful', plainMeaning: 'Gains, networks, fixed intent, technology, visible clear outcome.' },
  { index: 11, name: 'Pisces', sanskrit: 'Meena', short: 'Pis', lord: 'Jupiter', element: 'Water', modality: 'Dual', udaya: 'Ubhayodaya', odd: false, cakraDirection: 'Corner', cardinalDirection: 'North', bodyForm: 'Watery / Creeping', fertility: 'Fruitful', plainMeaning: 'Compassion, spiritual peace, fruitful outcomes, foreign ties, flexible progress.' },
];

export const NAKSHATRA_NAMES = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
] as const;

const NAK_SPAN = 360 / 27;

export const NAKSHATRAS: NakshatraInfo[] = NAKSHATRA_NAMES.map((name, index) => ({
  index,
  name,
  lord: VIMSHOTTARI_ORDER[index % 9],
  startDeg: index * NAK_SPAN,
  endDeg: (index + 1) * NAK_SPAN,
}));

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const WEEKDAY_LORDS: SevenPlanetId[] = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
];

export const CHALDEAN_HORA_ORDER: SevenPlanetId[] = [
  'Saturn',
  'Jupiter',
  'Mars',
  'Sun',
  'Venus',
  'Mercury',
  'Moon',
];

// Prasna Marga L1680-2168 Gulikodaya Kala Start Ghatis (Sun..Sat)
export const GULIKODAYA_DAY_GHATIS = [26, 22, 18, 14, 10, 6, 2] as const;
export const GULIKODAYA_NIGHT_GHATIS = [10, 6, 2, 26, 22, 18, 14] as const;

export const EXALTATION_SIGN: Record<SevenPlanetId, number> = {
  Sun: 0, // Aries
  Moon: 1, // Taurus
  Mars: 9, // Capricorn
  Mercury: 5, // Virgo
  Jupiter: 3, // Cancer
  Venus: 11, // Pisces
  Saturn: 6, // Libra
};

export const DEBILITATION_SIGN: Record<SevenPlanetId, number> = {
  Sun: 6,
  Moon: 7,
  Mars: 3,
  Mercury: 11,
  Jupiter: 9,
  Venus: 5,
  Saturn: 0,
};

export const OWN_SIGNS: Record<SevenPlanetId, number[]> = {
  Sun: [4],
  Moon: [3],
  Mars: [0, 7],
  Mercury: [2, 5],
  Jupiter: [8, 11],
  Venus: [1, 6],
  Saturn: [9, 10],
};

// Moolatrikona boundaries [signIndex, minDeg, maxDeg]
export const MOOLATRIKONA: Record<SevenPlanetId, [number, number, number]> = {
  Sun: [4, 0, 20],
  Moon: [1, 3, 30],
  Mars: [0, 0, 12],
  Mercury: [5, 15, 20],
  Jupiter: [8, 0, 10],
  Venus: [6, 0, 15],
  Saturn: [10, 0, 20],
};

// Naisargika Maitri (Parashari & Adhipati Sutra base permanent friendship)
export const PERMANENT_FRIENDSHIP: Record<
  SevenPlanetId,
  { friends: SevenPlanetId[]; neutrals: SevenPlanetId[]; enemies: SevenPlanetId[] }
> = {
  Sun: { friends: ['Moon', 'Mars', 'Jupiter'], neutrals: ['Mercury'], enemies: ['Venus', 'Saturn'] },
  Moon: { friends: ['Sun', 'Mercury'], neutrals: ['Mars', 'Jupiter', 'Venus', 'Saturn'], enemies: [] },
  Mars: { friends: ['Sun', 'Moon', 'Jupiter'], neutrals: ['Venus', 'Saturn'], enemies: ['Mercury'] },
  Mercury: { friends: ['Sun', 'Venus'], neutrals: ['Mars', 'Jupiter', 'Saturn'], enemies: ['Moon'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], neutrals: ['Saturn'], enemies: ['Mercury', 'Venus'] },
  Venus: { friends: ['Mercury', 'Saturn'], neutrals: ['Mars', 'Jupiter'], enemies: ['Sun', 'Moon'] },
  Saturn: { friends: ['Mercury', 'Venus'], neutrals: ['Jupiter'], enemies: ['Sun', 'Moon', 'Mars'] },
};

export const ASHTAMANGALA_MAP: Record<
  number,
  {
    planet: NineGrahaId;
    nature: 'Auspicious (Odd)' | 'Inauspicious (Even)';
    summary: string;
  }
> = {
  1: { planet: 'Sun', nature: 'Auspicious (Odd)', summary: 'Soul, authority, father, royal favour, victory' },
  2: { planet: 'Mars', nature: 'Inauspicious (Even)', summary: 'Strife, cuts, fire, obstacles, impatience' },
  3: { planet: 'Jupiter', nature: 'Auspicious (Odd)', summary: 'Grace, dharma, wealth, children, relief' },
  4: { planet: 'Mercury', nature: 'Inauspicious (Even)', summary: 'Changeability, dual results, restlessness' },
  5: { planet: 'Venus', nature: 'Auspicious (Odd)', summary: 'Comfort, harmony, marriage, prosperity' },
  6: { planet: 'Saturn', nature: 'Inauspicious (Even)', summary: 'Delay, sorrow, chronic obstacle, karmic block' },
  7: { planet: 'Moon', nature: 'Auspicious (Odd)', summary: 'Peace of mind, mother, fluidity, nourishment' },
  8: { planet: 'Rahu', nature: 'Inauspicious (Even)', summary: 'Illusion, shadow affliction, unexpected blockade' },
};

export const QUESTION_CATEGORIES: {
  id: QuestionCategory;
  label: string;
  primaryHouse: number;
  kpPrimaryCusp: number;
  classicalFocus: string;
}[] = [
  { id: 'general_yes_no', label: 'General Yes / No Question', primaryHouse: 11, kpPrimaryCusp: 11, classicalFocus: '1L, 11L, Lagna, Moon' },
  { id: 'lost_stolen', label: 'Lost Item or Stolen Property', primaryHouse: 4, kpPrimaryCusp: 2, classicalFocus: '1L/Moon Owner, 7L Thief, 4L Item, 2 CSL' },
  { id: 'marriage_relationship', label: 'Love, Marriage & Relationship', primaryHouse: 7, kpPrimaryCusp: 7, classicalFocus: '1L, 7L, Venus, 2/7/11 vs 1/6/10' },
  { id: 'career_job', label: 'Job, Career & Business', primaryHouse: 10, kpPrimaryCusp: 6, classicalFocus: '1L, 10L, 6L, 2/6/10/11 vs 5/8/12' },
  { id: 'promotion_transfer', label: 'Job Change, Promotion or Transfer', primaryHouse: 10, kpPrimaryCusp: 10, classicalFocus: '1, 5, 6, 7, 10, 11, 12 + D-10 & 3/9/6/12' },
  { id: 'finance_loan', label: 'Finance, Money & Loan', primaryHouse: 11, kpPrimaryCusp: 6, classicalFocus: '2L, 6L, 11L, 2/6/11 vs 5/8/12' },
  { id: 'property_vehicle', label: 'House, Land, Vehicle or Lease', primaryHouse: 4, kpPrimaryCusp: 4, classicalFocus: '1 Buyer, 7 Seller, 10 Price, 4 Property, 11 Profit' },
  { id: 'medical_health', label: 'Health & Medical Recovery', primaryHouse: 6, kpPrimaryCusp: 6, classicalFocus: '1 Physician, 6/7 Disease, 10 Patient, 4 Treatment' },
  { id: 'legal_litigation', label: 'Legal, Court & Disputes', primaryHouse: 7, kpPrimaryCusp: 6, classicalFocus: '1L vs 7L, Open (7H) vs Secret (6H) Foes' },
  { id: 'travel_missing', label: 'Travel & Missing Person', primaryHouse: 9, kpPrimaryCusp: 9, classicalFocus: '9H/3H/2H Journey & Return indicators' },
  { id: 'pregnancy_children', label: 'Children & Pregnancy', primaryHouse: 5, kpPrimaryCusp: 5, classicalFocus: '5H, Beeja/Kshetra Sphuta, Navamsa timing' },
  { id: 'education_exam', label: 'Exams, Study & Papers', primaryHouse: 4, kpPrimaryCusp: 4, classicalFocus: '4H/5H/9H/11H, Mercury, Jupiter, CSL 4' },
  { id: 'blind_mook', label: 'Unspoken Question (Guess My Question)', primaryHouse: 1, kpPrimaryCusp: 1, classicalFocus: 'Dhatu/Moola/Jeeva Navamsa, Moon, Hora, Arudha' },
];

// Programmatically derive exact 249 KP Sub-Lord slots by splitting 27 x 13°20' Nakshatras
// into Vimshottari Mahadasha proportions and splitting across 30° sign boundaries.
function buildKp249Table(): Kp249Slot[] {
  const slots: Kp249Slot[] = [];
  let num = 1;
  const EPS = 1e-9;

  for (let nakIdx = 0; nakIdx < 27; nakIdx++) {
    const nak = NAKSHATRAS[nakIdx];
    const starStart = nak.startDeg;
    const starOrderOffset = VIMSHOTTARI_ORDER.indexOf(nak.lord);
    let cursor = starStart;

    for (let s = 0; s < 9; s++) {
      const subLord = VIMSHOTTARI_ORDER[(starOrderOffset + s) % 9];
      const subSpan = (VIMSHOTTARI_YEARS[subLord] / 120) * NAK_SPAN;
      const rawEnd = s === 8 ? nak.endDeg : cursor + subSpan;

      const startSign = Math.floor((cursor + EPS) / 30) % 12;
      const endSign = Math.floor((rawEnd - EPS) / 30) % 12;

      if (startSign !== endSign) {
        const boundary = (startSign + 1) * 30;
        const firstSign = SIGNS[startSign];
        slots.push({
          number: num++,
          startDeg: cursor,
          endDeg: boundary,
          spanDeg: boundary - cursor,
          signIndex: firstSign.index,
          signName: firstSign.name,
          signLord: firstSign.lord,
          nakshatraIndex: nak.index,
          nakshatraName: nak.name,
          starLord: nak.lord,
          subLord,
          dmsStart: `${firstSign.short} ${formatDms(cursor % 30)}`,
          dmsEnd: `${firstSign.short} 30°00'00"`,
        });
        const secondSign = SIGNS[endSign];
        slots.push({
          number: num++,
          startDeg: boundary,
          endDeg: rawEnd,
          spanDeg: rawEnd - boundary,
          signIndex: secondSign.index,
          signName: secondSign.name,
          signLord: secondSign.lord,
          nakshatraIndex: nak.index,
          nakshatraName: nak.name,
          starLord: nak.lord,
          subLord,
          dmsStart: `${secondSign.short} 00°00'00"`,
          dmsEnd: `${secondSign.short} ${formatDms(rawEnd % 30)}`,
        });
      } else {
        const sign = SIGNS[startSign];
        slots.push({
          number: num++,
          startDeg: cursor,
          endDeg: rawEnd,
          spanDeg: rawEnd - cursor,
          signIndex: sign.index,
          signName: sign.name,
          signLord: sign.lord,
          nakshatraIndex: nak.index,
          nakshatraName: nak.name,
          starLord: nak.lord,
          subLord,
          dmsStart: `${sign.short} ${formatDms(cursor % 30)}`,
          dmsEnd: `${sign.short} ${formatDms(rawEnd % 30)}`,
        });
      }

      cursor = rawEnd;
    }
  }

  return slots;
}

export const KP_249_TABLE: Kp249Slot[] = buildKp249Table();

// ============================================================================
// Batch 2 Additions: Prasna Marga App IV-VII, SA Horary (Choudhry), KP Reader V
// ============================================================================

export const CHANDRA_KRIYAS: readonly string[] = [
  'Displaced from position',
  'Do penance',
  'Enjoy with other women',
  'Steal',
  'Ride on an elephant',
  'Sit on a throne',
  'To be a king',
  'Kill the enemies',
  'To be a Commander',
  'To do good to others',
  'To be lifeless in everything',
  'To be wounded in the head',
  'To have hands and legs wounded',
  'To be imprisoned',
  'To be ruined',
  'To be a king',
  'To study Vedas',
  'To sleep',
  'To think about good stories',
  'To do good actions',
  'To be born of a noble family',
  'To get treasures',
  'To keep a balance in one\'s hand',
  'To annotate / write commentary',
  'To kill enemies',
  'To be sick',
  'To be defeated by enemies',
  'To leave one\'s native place',
  'To be a servant',
  'To be without money',
  'To be in a wrong place',
  'To be with a good minister',
  'To govern another\'s country or property',
  'To be with wife',
  'To be afraid of elephants',
  'To be timid in warfare',
  'To be timid in everything',
  'To remain hidden from view',
  'To give food freely',
  'To occupy a fiery spot',
  'To be hungry',
  'To eat food',
  'To travel',
  'To deal with flesh / bodily exertion',
  'To be wounded in war by arrows',
  'To marry',
  'To play balls / sport',
  'To gamble',
  'To be a king',
  'To be miserable',
  'To sit on a bed',
  'To be served by enemies',
  'To be with relatives',
  'To be engaged in meditation',
  'To be with wife',
  'To eat plentifully',
  'To drink milk',
  'To do good actions',
  'To have mental peace',
  'To enjoy',
];

export const CHANDRA_VELAS: readonly string[] = [
  'Headache',
  'Delight',
  'Worship of Devas',
  'Desire in happiness',
  'Disease in the eyes',
  'Enjoyment',
  'Stay with women',
  'High fever',
  'To put on ornaments',
  'To shed tears',
  'To drink poison',
  'To cohabit with women',
  'To have stomach complaints',
  'To play in water',
  'To laugh',
  'To paint',
  'Anger',
  'Play',
  'To drink ghee',
  'To sleep',
  'To sing',
  'Disease in the teeth',
  'To quarrel',
  'Journey',
  'To get mad',
  'To jump in water',
  'Opposition',
  'To do as one pleases',
  'Fear from hunger',
  'Education',
  'To amuse oneself',
  'To fight',
  'To do good action',
  'To do bad actions',
  'To do cruel actions',
  'Delight',
];

export const CHANDRA_AVASTHAS: readonly string[] = [
  'To go to a foreign place leaving one\'s profession',
  'To occupy a throne',
  'Loss of life',
  'Kingship',
  'To do actions befitting one\'s family',
  'Sickness',
  'To occupy a wrong place',
  'Fear',
  'Hunger',
  'To marry a woman',
  'To lie on a good bed',
  'To take good food',
];

// Prasna Marga Appendix VII: Nature of 36 Drekkanas (12 signs x 3 Drekkanas)
export const DREKKANA_NATURES: readonly [string, string, string][] = [
  ['Nara, Purusha, Ayudha, Krura', 'Sthira, Mriga, Saumya', 'Purusha, Ayudha, Misra'], // Aries
  ['Stree, Agni, Misra', 'Purusha, Mriga, Saumya', 'Purusha, Jalachara'], // Taurus
  ['Stree, Saumya', 'Purusha, Pakshi, Misra', 'Purusha, Ayudha, Jalachara'], // Gemini
  ['Purusha, Chatushpada, Jalachara', 'Stree, Sarpa, Krura', 'Purusha, Sarpa, Jalachara, Misra'], // Cancer
  ['Pakshi, Chatushpada, Nara, Krura', 'Nara, Ayudha, Misra, Raja', 'Purusha, Chatushpada, Ayudha, Krura'], // Leo
  ['Stree, Agni, Saumya', 'Purusha, Nara, Jalachara', 'Stree, Saumya'], // Virgo
  ['Purusha, Saumya', 'Pakshi, Purusha, Misra', 'Purusha, Chatushpada, Vana'], // Libra
  ['Stree, Sarpa, Krura', 'Stree, Sarpa, Krura', 'Chatushpada, Vana, Nara / Kurma Mukha, Krura'], // Scorpio
  ['Naramukha, Ayudha, Chatushpada, Misra', 'Stree, Saumya', 'Nara, Ayudha, Saumya'], // Sagittarius
  ['Nara, Nigala, Krura, Chatushpada', 'Stree, Saumya', 'Purusha, Aswamukha, Ayudha, Misra'], // Capricorn
  ['Pakshi, Nara, Krura', 'Stree, Vana, Saumya', 'Nara, Aushadha, Vana, Saumya'], // Aquarius
  ['Nara, Jala', 'Stree, Jhala', 'Purusha, Sarpa, Agni, Vana, Krura'], // Pisces
];

// Systems' Approach (V.K. Choudhry, Prasna Application L860-888)
// Functional Malefics per Lagna sign index (0=Aries .. 11=Pisces)
export const SA_FUNCTIONAL_MALEFICS: Record<number, NineGrahaId[]> = {
  0: ['Mercury', 'Rahu', 'Ketu'],
  1: ['Venus', 'Jupiter', 'Mars', 'Rahu', 'Ketu'],
  2: ['Rahu', 'Ketu'],
  3: ['Jupiter', 'Saturn', 'Rahu', 'Ketu'],
  4: ['Moon', 'Rahu', 'Ketu'],
  5: ['Saturn', 'Mars', 'Sun', 'Rahu', 'Ketu'],
  6: ['Mercury', 'Rahu', 'Ketu'],
  7: ['Mars', 'Venus', 'Rahu', 'Ketu'],
  8: ['Moon', 'Rahu', 'Ketu'],
  9: ['Sun', 'Jupiter', 'Rahu', 'Ketu'],
  10: ['Moon', 'Mercury', 'Rahu', 'Ketu'],
  11: ['Sun', 'Venus', 'Saturn', 'Rahu', 'Ketu'],
};

// Systems' Approach Most Malefic Planet (MMP) by Lagna (L990-1015)
export const SA_MMP_BY_LAGNA: Record<number, NineGrahaId> = {
  0: 'Ketu',
  1: 'Jupiter',
  2: 'Ketu',
  3: 'Saturn',
  4: 'Moon',
  5: 'Mars',
  6: 'Mercury',
  7: 'Venus',
  8: 'Moon',
  9: 'Sun',
  10: 'Mercury',
  11: 'Venus',
};

// K.S. Krishnamurti Reader V (L8629-8634, L7110-7119)
export const FRUITFUL_SIGNS_PRIMARY: readonly number[] = [3, 7, 11]; // Cancer, Scorpio, Pisces
export const FRUITFUL_SIGNS_SEMI: readonly number[] = [1, 6]; // Taurus, Libra
export const BARREN_SIGNS: readonly number[] = [0, 2, 4, 5]; // Aries, Gemini, Leo, Virgo
export const DUAL_SIGNS: readonly number[] = [2, 5, 8, 11]; // Gemini, Virgo, Sagittarius, Pisces

export const ELECTIONAL_KP_MUHURTA_RULES = {
  beneficialHouses: [1, 2, 3, 6, 10, 11] as readonly number[],
  adverseHouses: [8, 12] as readonly number[],
  source: 'K.S. Krishnamurti Reader V L13215-13261 ("Which Time Is Good?")',
};

export interface PlanetGuideEntry {
  id: NineGrahaId;
  nature: string;
  gender: 'Male' | 'Female' | 'Neutral';
  colour: string;
  direction: string;
  ageYears: string;
  timingScale: string;
  maranaHouse: number | null;
  doshaAndBody: string;
  governsPlain: string;
}

export const PLANET_GUIDE_TABLE: PlanetGuideEntry[] = [
  {
    id: 'Sun',
    nature: 'Natural Malefic (Royal / Firm)',
    gender: 'Male',
    colour: 'Deep Red / Copper',
    direction: 'East',
    ageYears: '50 yrs (Mature)',
    timingScale: '6 Months (Ayana)',
    maranaHouse: 12,
    doshaAndBody: 'Pitta · Bones & Heart',
    governsPlain: 'Father, authority, government, boss, leadership, vitality, gold, reputation.',
  },
  {
    id: 'Moon',
    nature: 'Benefic when bright (Waxing) / Weak when dark',
    gender: 'Female',
    colour: 'White / Silver',
    direction: 'North-West',
    ageYears: '70 yrs (Wise / Senior)',
    timingScale: 'Minutes / 48-min Muhurta',
    maranaHouse: 8,
    doshaAndBody: 'Vata · Mind, Blood & Fluids',
    governsPlain: 'Mother, mind & worry, liquids, travel, peace, silver, quick daily results.',
  },
  {
    id: 'Mars',
    nature: 'Natural Malefic (Fiery / Bold)',
    gender: 'Male',
    colour: 'Bright / Blood Red',
    direction: 'South',
    ageYears: '16 yrs (Youth / Active)',
    timingScale: '1 Day per step',
    maranaHouse: 7,
    doshaAndBody: 'Pitta · Marrow & Muscles',
    governsPlain: 'Siblings, courage, land, property, engineering, surgery, disputes, kitchen/fire.',
  },
  {
    id: 'Mercury',
    nature: 'Natural Benefic (Neutral if with malefics)',
    gender: 'Neutral',
    colour: 'Green',
    direction: 'North',
    ageYears: '20 yrs (Young Adult)',
    timingScale: '2-Month Seasons (Ritu)',
    maranaHouse: 7,
    doshaAndBody: 'Mixed · Speech & Skin',
    governsPlain: 'Business, trade, accounting, math, studies, exams, writing, software, relatives.',
  },
  {
    id: 'Jupiter',
    nature: 'Greatest Natural Benefic',
    gender: 'Male',
    colour: 'Golden / Yellow',
    direction: 'North-East',
    ageYears: '30 yrs (Prime Advisor)',
    timingScale: '1 Month per step',
    maranaHouse: 3,
    doshaAndBody: 'Kapha · Wisdom & Fat',
    governsPlain: 'Children, husband, elders, teachers, wealth, law, luck, faith, higher studies.',
  },
  {
    id: 'Venus',
    nature: 'Natural Benefic (Harmonious)',
    gender: 'Female',
    colour: 'White / Variegated / Blue',
    direction: 'South-East',
    ageYears: '7 yrs (Youthful Charm)',
    timingScale: '15 Days (Fortnight / Paksha)',
    maranaHouse: 6,
    doshaAndBody: 'Kapha · Vitality & Beauty',
    governsPlain: 'Marriage, wife/partner, vehicles, home comforts, arts, garments, joyful outcomes.',
  },
  {
    id: 'Saturn',
    nature: 'Natural Malefic (Slow / Disciplined)',
    gender: 'Neutral',
    colour: 'Black / Dark Blue',
    direction: 'West',
    ageYears: '100 yrs (Very Old)',
    timingScale: '1 Year per step',
    maranaHouse: 1,
    doshaAndBody: 'Vata · Nerves & Joints',
    governsPlain: 'Hard work, long service, manufacturing, oil/iron, delays that reward patience.',
  },
  {
    id: 'Rahu',
    nature: 'Natural Malefic (Unconventional)',
    gender: 'Female',
    colour: 'Smoky / Dark Grey',
    direction: 'South-West',
    ageYears: '100 yrs (Elder)',
    timingScale: '8 Months',
    maranaHouse: 9,
    doshaAndBody: 'Mystery / Sudden Shifts',
    governsPlain: 'Technology, electronics, research, foreign lands, sudden breakthroughs or confusion.',
  },
  {
    id: 'Ketu',
    nature: 'Natural Malefic (Detached / Spiritual)',
    gender: 'Neutral',
    colour: 'Variegated / Earthy',
    direction: 'North-East / Corner',
    ageYears: 'Ageless / Timeless',
    timingScale: '3 Months',
    maranaHouse: null,
    doshaAndBody: 'Hidden Causes & Intuition',
    governsPlain: 'Deep intuition, spiritual insight, sudden detachment, hidden roots, healing.',
  },
];

export interface HouseGuideEntry {
  house: number;
  title: string;
  governsPlain: string;
}

export const HOUSE_GUIDE_TABLE: HouseGuideEntry[] = [
  { house: 1, title: 'House 1 (Tanu / Lagna)', governsPlain: 'The questioner (you), health, body appearance, mindset, and whether the plan stands strong.' },
  { house: 2, title: 'House 2 (Dhana / Wealth)', governsPlain: 'Cash in hand, savings, family support, voice, valuables, and income from work.' },
  { house: 3, title: 'House 3 (Sahaja / Effort)', governsPlain: 'Siblings, neighbours, short trips, documents, signatures, communication, and courage.' },
  { house: 4, title: 'House 4 (Sukha / Home)', governsPlain: 'Home, mother, land, real estate, vehicles, basic schooling, peace of mind, and where lost things sit.' },
  { house: 5, title: 'House 5 (Putra / Creation)', governsPlain: 'Children, pregnancy, romance, creative talent, exam memory, and investments.' },
  { house: 6, title: 'House 6 (Ripu / Service)', governsPlain: 'Daily job/service, loans & debts, health recovery, pets, tenants, and rivals.' },
  { house: 7, title: 'House 7 (Kalatra / Union)', governsPlain: 'Spouse, marriage, business partners, trade deals, legal opponents, and returning travelers.' },
  { house: 8, title: 'House 8 (Ayus / Hidden)', governsPlain: 'Sudden obstacles, chronic stress, inheritance, insurance, shared/partner money, and deep change.' },
  { house: 9, title: 'House 9 (Bhagya / Fortune)', governsPlain: 'Good luck, father, teachers, higher education, court justice, temples, and long foreign trips.' },
  { house: 10, title: 'House 10 (Karma / Status)', governsPlain: 'Career rank, profession, authority, boss/government, public respect, and business success.' },
  { house: 11, title: 'House 11 (Labha / Gains)', governsPlain: 'Fulfilment of wishes, salary hikes, profits, elder siblings, friends, and certificates.' },
  { house: 12, title: 'House 12 (Vyaya / Release)', governsPlain: 'Expenses, losses, foreign settlement, hospitals, quiet rest, and letting go of situations.' },
];
