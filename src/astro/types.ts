export type SevenPlanetId = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';
export type NineGrahaId = SevenPlanetId | 'Rahu' | 'Ketu';

export type AyanamsaId = 'kp' | 'lahiri' | 'raman' | 'true_chitra' | 'fagan_bradley' | 'tropical';
export type HouseSystem = 'placidus' | 'whole_sign' | 'sripati' | 'equal';
export type NodeMode = 'true' | 'mean';
export type ChartCastingMode = 'time_lagna' | 'number_108' | 'kp_horary' | 'arudha_override';

export type QuestionCategory =
  | 'general_yes_no'
  | 'lost_stolen'
  | 'marriage_relationship'
  | 'career_job'
  | 'promotion_transfer'
  | 'finance_loan'
  | 'property_vehicle'
  | 'medical_health'
  | 'legal_litigation'
  | 'travel_missing'
  | 'pregnancy_children'
  | 'education_exam'
  | 'blind_mook';

export type SwaraNostril = 'unknown' | 'left_ida' | 'right_pingala';

export interface RuleSettings {
  mercuryCombustDeg: 8 | 14;
  diseaseHouse: 6 | 7;
  tajikaSquareWeightPct: 75 | 45;
  directionSystem: 'kp_cardinal' | 'classical_corner';
  useHoraInRp?: boolean;
  rpHoraryAscMode?: 'horary_slot' | 'moment_lagna';
}

export interface HoraryQueryInput {
  querentName?: string;
  questionText: string;
  category: QuestionCategory;
  queryIndexInSession: 1 | 2 | 3 | 4 | 5;
  multiQuestionMode?: 'rotate_chart' | 'independent';
  askingAboutHouse?: 1 | 3 | 4 | 5 | 7 | 9 | 10;
  localDate: string; // YYYY-MM-DD
  localTime: string; // HH:mm:ss
  latitude: number;
  longitude: number;
  timeZone: string;
  placeName: string;
  castingMode: ChartCastingMode;
  prashna108Number?: number; // 1..108 (Method 2: / 9 quotient + remainder Navamsa)
  kpNumber: number; // 1..249
  arudhaSignIndex: number; // 0..11
  ayanamsa: AyanamsaId;
  houseSystem: HouseSystem;
  nodeMode: NodeMode;
  swaraNostril: SwaraNostril;
  ashtamangalaPiles?: [number, number, number];
  tambulaCount?: number;
  pranaksharaNumber?: number;
  pranaksharaGroup?: 'A' | 'Ka' | 'Cha' | 'Ta' | 'Tha' | 'Pa' | 'Ya_Sa' | '';
  natalJanmaNakshatraIndex?: number; // 0..26
  natalJanmaSignIndex?: number; // 0..11
  querentAge?: number; // Optional completed years for Bhrigu Prashna Nadi (107 - age)
  settings: RuleSettings;
}

export type SignElement = 'Fire' | 'Earth' | 'Air' | 'Water';
export type SignModality = 'Movable' | 'Fixed' | 'Dual';
export type UdayaType = 'Shirshodaya' | 'Prishtodaya' | 'Ubhayodaya';

export interface SignInfo {
  index: number;
  name: string;
  sanskrit: string;
  short: string;
  lord: SevenPlanetId;
  element: SignElement;
  modality: SignModality;
  udaya: UdayaType;
  odd: boolean;
  cakraDirection: 'East' | 'South' | 'West' | 'North' | 'Corner';
  cardinalDirection: 'East' | 'South' | 'West' | 'North';
  bodyForm: 'Biped' | 'Quadruped' | 'Watery / Creeping';
  fertility: 'Fruitful' | 'Semi-Fruitful' | 'Barren';
  plainMeaning: string;
}

export interface NakshatraInfo {
  index: number;
  name: string;
  lord: NineGrahaId;
  startDeg: number;
  endDeg: number;
}

export interface Kp249Slot {
  number: number; // 1..249
  startDeg: number;
  endDeg: number;
  spanDeg: number;
  signIndex: number;
  signName: string;
  signLord: SevenPlanetId;
  nakshatraIndex: number;
  nakshatraName: string;
  starLord: NineGrahaId;
  subLord: NineGrahaId;
  dmsStart: string;
  dmsEnd: string;
}

export type DignityState =
  | 'Exalted'
  | 'Moolatrikona'
  | 'Own Sign'
  | 'Great Friend'
  | 'Friend'
  | 'Neutral'
  | 'Enemy'
  | 'Great Enemy'
  | 'Debilitated';

export interface PlanetPosition {
  id: NineGrahaId;
  short: string;
  longitude: number; // sidereal 0..360
  tropicalLongitude: number;
  latitude: number;
  speedDegPerDay: number;
  isRetrograde: boolean;
  isCombust: boolean;
  combustOrbDeg?: number;
  signIndex: number;
  signName: string;
  degInSign: number;
  dmsInSign: string;
  houseWholeSign: number;
  houseBhava: number;
  nakshatraIndex: number;
  nakshatraName: string;
  pada: number;
  starLord: NineGrahaId;
  subLord: NineGrahaId;
  subSubLord: NineGrahaId;
  dignity: DignityState;
  navamsaSignIndex: number;
  drekkanaIndex: 1 | 2 | 3;
  drekkanaSignIndex: number;
  dashamsaSignIndex: number;
  dwadasamsaSignIndex: number;
  isVargottama: boolean;
}

export interface HouseCusp {
  house: number; // 1..12
  start: number;
  midpoint: number;
  signIndex: number;
  signName: string;
  dms: string;
  lord: SevenPlanetId;
}

export interface SpecialPointValue {
  name: string;
  longitude: number;
  signIndex: number;
  signName: string;
  dmsInSign: string;
  houseWholeSign: number;
  formula: string;
  source: string;
}

export interface PanchangaInfo {
  utcMs: number;
  offsetMinutes: number;
  localDisplay: string;
  sunriseLocal: string;
  sunsetLocal: string;
  sunriseUtcMs: number;
  sunsetUtcMs: number;
  isDaytime: boolean;
  vedicWeekdayIndex: number; // 0=Sun..6=Sat (Sunrise-to-Sunrise)
  vedicWeekdayName: string;
  dayLord: SevenPlanetId;
  horaNumber: number; // 1..24
  horaLord: SevenPlanetId;
  tithiNumber: number; // 1..30
  tithiName: string;
  paksha: 'Shukla' | 'Krishna';
  karanaName: string;
  karanaFixed: boolean;
  yogaNumber: number; // 1..27
  yogaName: string;
  moonNakshatraIndex: number;
  moonNakshatraName: string;
  moonNakshatraPada: number;
  solarEclipseDaysDiff: number | null;
  lunarEclipseDaysDiff: number | null;
  isNearSankranti: boolean;
  sunDegInSign: number;
  horaSchedule: HoraSlot[];
  lunarMicroStates: LunarMicroStateInfo;
}

export interface HoraSlot {
  horaNumber: number; // 1..24
  period: 'Day' | 'Night';
  lord: SevenPlanetId;
  startUtcMs: number;
  endUtcMs: number;
  startLocal: string;
  endLocal: string;
  isActive: boolean;
}

export interface LunarMicroStateInfo {
  moonNakArcMin: number;
  chandraKriyaIndex: number; // 1..60
  chandraKriyaLabel: string;
  chandraVelaIndex: number; // 1..36
  chandraVelaLabel: string;
  chandraAvasthaIndex: number; // 1..12
  chandraAvasthaLabel: string;
  ascDrekkanaIndex: number; // 1..3
  ascDrekkanaNature: string;
}

export interface CastHoraryChart {
  input: HoraryQueryInput;
  utcMs: number;
  offsetMinutes: number;
  ayanamsaDeg: number;
  kpAyanamsaDeg: number;
  ascendantSidereal: number;
  ascendantSignIndex: number;
  ascendantSignName: string;
  ascendantDms: string;
  ascendantNakIndex: number;
  ascendantStarLord: NineGrahaId;
  ascendantSubLord: NineGrahaId;
  isAscVargottama: boolean;
  mcSidereal: number;
  activeKpSlot: Kp249Slot | null;
  cusps: HouseCusp[];
  planets: PlanetPosition[];
  gulikaLon: number;
  mandiLon: number;
  gulikaStartGhati: number;
  sphutas: SpecialPointValue[];
  upagrahas: SpecialPointValue[];
  panchanga: PanchangaInfo;
  effectiveQuerySignificator: string;
  naturalAscendantSidereal: number;
  naturalAscendantSignIndex: number;
  naturalAscendantSignLord: NineGrahaId;
  naturalAscendantStarLord: NineGrahaId;
  naturalAscendantSubLord: NineGrahaId;
  rotatedReference?: {
    isRotated: boolean;
    planet: SevenPlanetId | null;
    reason: string;
    baseAscendantDms: string;
    kpLonDeg: number | null;
  };
  prashna108Info?: {
    number: number; // 1..108
    signsElapsed: number; // 0..11 quotient
    lagnaSignIndex: number;
    lagnaSignName: string;
    navamsaNumber: number; // 1..9 remainder
    navamsaSignIndex: number; // 0..11 from Aries
    navamsaSignName: string;
  };
}
