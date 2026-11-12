import * as Astronomy from 'astronomy-engine';
import { NAKSHATRAS, SIGNS, WEEKDAY_NAMES } from './constants';
import type { CompleteHoraryAnalysis } from './horaryAnalyzer';
import { normalizeDeg } from './time';
import type { NineGrahaId, PlanetPosition, QuestionCategory } from './types';

export type QuestionFocusKind =
  | 'fertility_dates'
  | 'progeny_gender'
  | 'exam_paper_difficulty'
  | 'exam_pass_result'
  | 'career_which_field'
  | 'choice_comparison'
  | 'when_dates'
  | 'who_person'
  | 'how_much_many'
  | 'where_location'
  | 'how_why'
  | 'yes_no';

export interface FavourableDateWindow {
  dateRangeLabel: string;
  qualityLabel: 'Best Window' | 'Good Window';
  moonStarSummary: string;
  reasonPlain: string;
}

export interface TailoredChoiceItem {
  label: string;
  badge: string;
  tone: 'good' | 'warn' | 'info';
  detail: string;
}

export interface TailoredAnswerBundle {
  focusKind: QuestionFocusKind;
  customHeadline: string | null;
  directSummary: string;
  clearStories: { heading: string; answer: string }[];
  dateWindows: FavourableDateWindow[];
  choiceSection: {
    title: string;
    subtitle: string;
    items: TailoredChoiceItem[];
  } | null;
}

export function analyzeQuestionFocus(
  questionText: string,
  category: QuestionCategory
): QuestionFocusKind {
  const q = questionText.toLowerCase();

  if (
    category === 'pregnancy_children' &&
    /\b(date\w*|right time|best time|best day\w*|when to conceiv|fertile window|conceiv\w* window|right day\w*)\b/i.test(q)
  ) {
    return 'fertility_dates';
  }
  if (
    /\b(son|daughter|boy|girl|baby boy|baby girl|gender)\b/i.test(q)
  ) {
    return 'progeny_gender';
  }
  if (
    /\b(paper\w*|subject\w*|easy|difficult|tough|hardest|scoring|section\w*)\b/i.test(q) &&
    (category === 'education_exam' || /\b(exam|test|paper|subject|study)\b/i.test(q))
  ) {
    return 'exam_paper_difficulty';
  }
  if (
    category === 'education_exam' &&
    /\b(pass|clear|fail|qualif|rank|marks|result|admission|get in|succeed)\b/i.test(q)
  ) {
    return 'exam_pass_result';
  }
  if (
    /\b(which career|what career|which field|what field|which business|what business|which job|line of work|what profession|suit me|suits me)\b/i.test(q)
  ) {
    return 'career_which_field';
  }
  if (
    /\b(job or business|business or job|stay or leave|stay or switch|leave or stay|settle or fight|option a|or switch|which option|which one|better choice)\b/i.test(q)
  ) {
    return 'choice_comparison';
  }
  if (
    /\b(when\b|what date|which month|how soon|how long|by when|right time|best date|good days|timeframe)\b/i.test(q)
  ) {
    return 'when_dates';
  }
  if (/\b(where\b|which direction|which place|which room|spot)\b/i.test(q)) {
    return 'where_location';
  }
  if (/\b(who\b|whom\b|whose\b|which person|someone|stranger|thief|culprit)\b/i.test(q)) {
    return 'who_person';
  }
  if (/\b(how much|how many|count|amount|profit size|salary hike)\b/i.test(q)) {
    return 'how_much_many';
  }
  if (/\b(why\b|how can i|how to|what should i|reason for delay|what is blocking)\b/i.test(q)) {
    return 'how_why';
  }
  return 'yes_no';
}

const GOOD_NAK_INDICES = new Set([3, 4, 6, 7, 11, 12, 14, 16, 20, 21, 22, 25, 26]); // Rohini, Mrigashira, Punarvasu, Pushya, U.Phalguni, Hasta, Swati, Anuradha, U.Ashadha, Shravana, Dhanishta, U.Bhadra, Revati
const AVOID_TITHIS = new Set([4, 8, 9, 14, 29, 30, 19, 23, 24]);

function formatShortLocalDate(utcMs: number, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(utcMs));
  } catch {
    return new Date(utcMs).toISOString().slice(0, 10);
  }
}

function getLocalWeekdayIdx(utcMs: number, timeZone: string): number {
  try {
    const wd = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(new Date(utcMs));
    const idx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].findIndex((d) => wd.startsWith(d));
    return idx >= 0 ? idx : new Date(utcMs).getUTCDay();
  } catch {
    return new Date(utcMs).getUTCDay();
  }
}

/**
 * Scans the next 55 calendar days astronomically to find clean, supportive
 * lunar & house-aligned calendar windows (no placeholder dates).
 */
export function computeFavourableCalendarWindows(
  analysis: CompleteHoraryAnalysis,
  mode: 'fertility' | 'general_timing',
  maxWindows = 4
): FavourableDateWindow[] {
  const { chart } = analysis;
  const tz = chart.input.timeZone || 'Asia/Kolkata';
  const ascSign = chart.ascendantSignIndex;
  const ayan = chart.ayanamsaDeg;

  interface DayCandidate {
    utcMs: number;
    dateStr: string;
    score: number;
    nakName: string;
    isWaxing: boolean;
    moonHouse: number;
    weekday: string;
  }

  const goodDays: DayCandidate[] = [];

  for (let dayOffset = 1; dayOffset <= 55; dayOffset++) {
    const sampleMs = chart.utcMs + dayOffset * 86400_000;
    const t = new Astronomy.AstroTime(new Date(sampleMs));
    const sunSid = normalizeDeg(Astronomy.SunPosition(t).elon - ayan);
    const moonSid = normalizeDeg(Astronomy.EclipticGeoMoon(t).lon - ayan);
    const diff = normalizeDeg(moonSid - sunSid);
    const tithi = Math.floor(diff / 12) + 1;
    const isWaxing = tithi >= 2 && tithi <= 13;
    const nakIdx = Math.floor(moonSid / (360 / 27)) % 27;
    const moonSign = Math.floor(moonSid / 30) % 12;
    const moonHouse = ((moonSign - ascSign + 12) % 12) + 1;
    const wdIdx = getLocalWeekdayIdx(sampleMs, tz);
    const weekday = WEEKDAY_NAMES[wdIdx];

    if (AVOID_TITHIS.has(tithi)) continue;
    if ([6, 8, 12].includes(moonHouse)) continue;

    let score = 0;
    if (isWaxing) score += mode === 'fertility' ? 3 : 2;
    if (GOOD_NAK_INDICES.has(nakIdx)) score += 3;
    if (mode === 'fertility' && [1, 5, 9, 11, 2, 4, 7].includes(moonHouse)) score += 2;
    if (mode === 'general_timing' && [1, 2, 3, 9, 10, 11].includes(moonHouse)) score += 2;
    if (['Monday', 'Wednesday', 'Thursday', 'Friday'].includes(weekday)) score += 1;

    if (score >= 5) {
      goodDays.push({
        utcMs: sampleMs,
        dateStr: formatShortLocalDate(sampleMs, tz),
        score,
        nakName: NAKSHATRAS[nakIdx].name,
        isWaxing,
        moonHouse,
        weekday,
      });
    }
  }

  // Group adjacent qualifying days (within 2 days apart) into practical windows
  const windows: FavourableDateWindow[] = [];
  let group: DayCandidate[] = [];

  const flushGroup = () => {
    if (group.length === 0) return;
    const first = group[0];
    const last = group[group.length - 1];
    const avgScore = group.reduce((s, d) => s + d.score, 0) / group.length;
    const label = first.dateStr === last.dateStr ? first.dateStr : `${first.dateStr} – ${last.dateStr}`;
    const starList = Array.from(new Set(group.map((g) => g.nakName))).slice(0, 2).join(' / ');
    const bestPhase = group.some((g) => g.isWaxing) ? 'Bright waxing lunar phase' : 'Balanced gentle lunar days';
    const bestHouseHit = group.some((g) => [1, 5, 9, 10, 11].includes(g.moonHouse))
      ? 'with Moon passing supportive houses of growth and blessings'
      : 'on calm, steady weekdays';

    windows.push({
      dateRangeLabel: label,
      qualityLabel: avgScore >= 7 ? 'Best Window' : 'Good Window',
      moonStarSummary: `${starList} (${first.weekday}${last !== first ? ` to ${last.weekday}` : ''})`,
      reasonPlain: `${bestPhase} ${bestHouseHit}.`,
    });
    group = [];
  };

  for (const d of goodDays) {
    if (
      group.length === 0 ||
      d.utcMs - group[group.length - 1].utcMs <= 1.6 * 86400_000
    ) {
      if (group.length < 4) {
        group.push(d);
      } else {
        flushGroup();
        group.push(d);
      }
    } else {
      flushGroup();
      group.push(d);
    }
  }
  flushGroup();

  // Sort Best Windows first, keep chronological order among top selection
  const best = windows.filter((w) => w.qualityLabel === 'Best Window').slice(0, maxWindows);
  if (best.length >= Math.min(2, maxWindows)) return best;
  return windows.slice(0, maxWindows);
}

function scorePlanetVitality(p: PlanetPosition, fmSet: Set<NineGrahaId>): number {
  let s = 55;
  if (p.dignity === 'Exalted' || p.dignity === 'Moolatrikona') s += 26;
  else if (p.dignity === 'Own Sign') s += 20;
  else if (p.dignity === 'Great Friend' || p.dignity === 'Friend') s += 11;
  else if (p.dignity === 'Enemy') s -= 12;
  else if (p.dignity === 'Great Enemy' || p.dignity === 'Debilitated') s -= 24;

  if ([1, 4, 5, 9, 10, 11].includes(p.houseWholeSign)) s += 12;
  if ([6, 8, 12].includes(p.houseWholeSign)) s -= 15;
  if (p.isCombust) s -= 16;
  if (p.isRetrograde && p.id !== 'Rahu' && p.id !== 'Ketu') s -= 10;
  if (!fmSet.has(p.id)) s += 6;
  return Math.max(15, Math.min(96, s));
}

function evaluateExamSubjects(analysis: CompleteHoraryAnalysis): TailoredChoiceItem[] {
  const { chart, systemsApproach } = analysis;
  const fmSet = new Set(systemsApproach.functionalMalefics);
  const byId = new Map(chart.planets.map((p) => [p.id, p]));

  const scoreAvg = (ids: NineGrahaId[]) =>
    Math.round(ids.reduce((acc, id) => acc + scorePlanetVitality(byId.get(id)!, fmSet), 0) / ids.length);

  const clusters: { name: string; score: number; easyDesc: string; toughDesc: string }[] = [
    {
      name: 'Mathematics, Accounting, Logic & Coding Papers',
      score: scoreAvg(['Mercury', 'Ketu']),
      easyDesc: 'Clear analytical flow and faster problem-solving; good chance to score well.',
      toughDesc: 'Watch for silly calculation slips or tricky step problems under time pressure.',
    },
    {
      name: 'Languages, Writing, Commerce & Communication',
      score: scoreAvg(['Mercury', 'Moon']),
      easyDesc: 'Smooth expression and memory recall; essay and descriptive answers flow cleanly.',
      toughDesc: 'Stay organized and avoid losing marks from rushed or incomplete answers.',
    },
    {
      name: 'Science, Engineering, Mechanics & Practical Tests',
      score: scoreAvg(['Mars', 'Sun']),
      easyDesc: 'Good confidence on technical application and practical problem sets.',
      toughDesc: 'Expect tough technical or speed-intensive questions; drill formulas thoroughly.',
    },
    {
      name: 'Law, History, Ethics, Theory & General Studies',
      score: scoreAvg(['Jupiter', 'Saturn']),
      easyDesc: 'Strong conceptual grasp and patience for long theory or structured questions.',
      toughDesc: 'Lengthy syllabus or strict evaluation is likely — revise summaries carefully.',
    },
    {
      name: 'Biology, Chemistry & Medical / Life Sciences',
      score: scoreAvg(['Sun', 'Moon', 'Jupiter']),
      easyDesc: 'Steady recall for diagrams, processes, and concept-based questions.',
      toughDesc: 'Dense detail sections need repeated revision so nothing gets mixed up.',
    },
    {
      name: 'Arts, Design, Architecture & Visual Papers',
      score: scoreAvg(['Venus']),
      easyDesc: 'Creative clarity and presentation work strongly in your favour.',
      toughDesc: 'Keep time balanced so neat presentation does not delay finishing.',
    },
  ];

  const sorted = [...clusters].sort((a, b) => b.score - a.score);
  return sorted.map((c, idx) => {
    const isEasy = idx < 2 || c.score >= 68;
    const isTough = idx >= sorted.length - 2 && c.score < 62;
    return {
      label: c.name,
      badge: isEasy ? `Likely Easier (${c.score}%)` : isTough ? `Needs Extra Practice (${c.score}%)` : `Moderate (${c.score}%)`,
      tone: isEasy ? 'good' : isTough ? 'warn' : 'info',
      detail: isEasy ? c.easyDesc : c.toughDesc,
    };
  });
}

const CAREER_CLUSTER_BY_PLANET: Record<
  NineGrahaId,
  { field: string; why: string }
> = {
  Sun: {
    field: 'Administration, Government, Leadership, Management & Healthcare',
    why: 'Strong leadership, authority, and decision-making presence shine cleanly.',
  },
  Moon: {
    field: 'Hospitality, Healthcare/Caregiving, Food, Travel, Psychology & Public Roles',
    why: 'High people awareness, empathy, and public rapport support steady growth.',
  },
  Mars: {
    field: 'Engineering, Technical Hardware, Construction, Real Estate, Defence & Operations',
    why: 'Hands-on drive, precision, and willingness to tackle tough challenges stand out.',
  },
  Mercury: {
    field: 'Software, Data/Analytics, Finance, Commerce, Business Trade, Teaching & Media',
    why: 'Sharp communication, numbers, problem-solving, and commercial agility lead here.',
  },
  Jupiter: {
    field: 'Education, Law, Banking, Advisory/Consulting, Policy & Mentoring',
    why: 'Sound judgment, ethics, guidance skills, and trust carry strong long-term weight.',
  },
  Venus: {
    field: 'Design, Architecture, Luxury Retail, Beauty/Wellness, Creative Media & Hospitality',
    why: 'Taste, diplomacy, client charm, and creative presentation attract good income.',
  },
  Saturn: {
    field: 'Infrastructure, Manufacturing, Logistics, Legal Compliance, Agriculture & Long-Term Industry',
    why: 'Disciplined persistence and structured systems build durable career wealth.',
  },
  Rahu: {
    field: 'Modern Tech/AI, Digital Products, Aviation, Foreign Trade & Specialized Research',
    why: 'Forward-looking trend sense and non-traditional skill sets open faster doors.',
  },
  Ketu: {
    field: 'Deep Research, Auditing, Medical Lab/Technical Niche, Investigation & Specialized Craft',
    why: 'Focused detail work and independent expertise bring high value.',
  },
};

function evaluateCareerSuitability(analysis: CompleteHoraryAnalysis): {
  topFieldsHeadline: string;
  jobVsBusiness: string;
  items: TailoredChoiceItem[];
} {
  const { chart, kp, systemsApproach } = analysis;
  const fmSet = new Set(systemsApproach.functionalMalefics);
  const byId = new Map(chart.planets.map((p) => [p.id, p]));

  const scoreMap = new Map<NineGrahaId, number>();
  for (const p of chart.planets) {
    let sc = scorePlanetVitality(p, fmSet);
    if (p.houseWholeSign === 10) sc += 22;
    if (p.houseWholeSign === 1 || p.houseWholeSign === 11 || p.houseWholeSign === 6) sc += 12;
    if (kp.cleanRulingPlanets.includes(p.id)) sc += 8;
    const h10SignLord = SIGNS[(chart.ascendantSignIndex + 9) % 12].lord;
    if (p.id === h10SignLord) sc += 18;
    scoreMap.set(p.id, sc);
  }

  const ranked = [...scoreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const jobScore =
    scorePlanetVitality(byId.get(SIGNS[(chart.ascendantSignIndex + 5) % 12].lord)!, fmSet) +
    chart.planets.filter((p) => p.houseWholeSign === 6).length * 8;
  const bizScore =
    scorePlanetVitality(byId.get(SIGNS[(chart.ascendantSignIndex + 6) % 12].lord)!, fmSet) +
    scorePlanetVitality(byId.get('Mercury')!, fmSet) * 0.4 +
    chart.planets.filter((p) => p.houseWholeSign === 7 || p.houseWholeSign === 11).length * 7;

  const jobVsBusiness =
    bizScore - jobScore >= 10
      ? 'Independent business, consulting, or self-driven enterprise suits this phase better than strict routine employment.'
      : jobScore - bizScore >= 10
      ? 'A structured job, salaried career, or specialist role gives steadier growth and lower risk right now than solo business.'
      : 'Both stable employment and side/independent business work well — building skills in a steady role while testing independent income is ideal.';

  const items: TailoredChoiceItem[] = ranked.map(([planetId], idx) => {
    const info = CAREER_CLUSTER_BY_PLANET[planetId];
    return {
      label: info.field,
      badge: idx === 0 ? 'Best Match' : 'Strong Alternative',
      tone: idx === 0 ? 'good' : 'info',
      detail: info.why,
    };
  });

  items.push({
    label: 'Work Style: Job vs Own Business',
    badge: bizScore - jobScore >= 10 ? 'Business Favoured' : jobScore - bizScore >= 10 ? 'Job Favoured' : 'Balanced Fit',
    tone: 'info',
    detail: jobVsBusiness,
  });

  const topShort = CAREER_CLUSTER_BY_PLANET[ranked[0][0]].field.split(',')[0];
  return {
    topFieldsHeadline: `Best Career Fit: ${topShort} & Related Paths`,
    jobVsBusiness,
    items,
  };
}

function evaluateProgenyGender(analysis: CompleteHoraryAnalysis): {
  headline: string;
  explanation: string;
  items: TailoredChoiceItem[];
} {
  const { chart } = analysis;
  const byId = new Map(chart.planets.map((p) => [p.id, p]));
  const ascSign = SIGNS[chart.ascendantSignIndex];
  const h5Sign = SIGNS[(chart.ascendantSignIndex + 4) % 12];
  const l5Pos = byId.get(h5Sign.lord)!;
  const l5Sign = SIGNS[l5Pos.signIndex];
  const moonSign = SIGNS[byId.get('Moon')!.signIndex];
  const jupSign = SIGNS[byId.get('Jupiter')!.signIndex];

  const factors = [
    { label: '5th Child House Sign', odd: h5Sign.odd },
    { label: '5th Ruling Planet Sign', odd: l5Sign.odd },
    { label: 'Jupiter Blessing Sign', odd: jupSign.odd },
    { label: 'Moon Sign', odd: moonSign.odd },
    { label: 'Rising Sign', odd: ascSign.odd },
  ];

  const maleCount = factors.filter((f) => f.odd).length;
  const femaleCount = factors.length - maleCount;

  let headline = 'Balanced Indicators (Boy or Girl Possible)';
  let explanation =
    'Signs supporting a baby boy and a baby girl are evenly balanced right now. Focus primarily on health, calm preparation, and good conception timing.';

  if (maleCount >= 4) {
    headline = 'Clear Leaning Toward a Baby Boy';
    explanation =
      'Most child-related indicators sit in odd/masculine zodiac signs right now, leaning gently toward a son alongside steady overall family blessing.';
  } else if (maleCount === 3) {
    headline = 'Moderate Leaning Toward a Baby Boy';
    explanation =
      'A slight majority of child and vitality indicators lean toward a boy, though balanced feminine moon/ascendant factors keep outcomes open.';
  } else if (femaleCount >= 4) {
    headline = 'Clear Leaning Toward a Baby Girl';
    explanation =
      'Most child-related indicators sit in even/feminine zodiac signs right now, leaning gently toward a daughter with nurturing family energy.';
  } else if (femaleCount === 3) {
    headline = 'Moderate Leaning Toward a Baby Girl';
    explanation =
      'A slight majority of child indicators lean toward a girl, with good warmth and care surrounding the family.';
  }

  const beeja = chart.sphutas.find((s) => s.name === 'Beeja Sphuta');
  const kshetra = chart.sphutas.find((s) => s.name === 'Kshetra Sphuta');
  const beejaOdd = beeja ? SIGNS[beeja.signIndex].odd : true;
  const kshetraEven = kshetra ? !SIGNS[kshetra.signIndex].odd : true;

  const items: TailoredChoiceItem[] = [
    {
      label: 'Overall Tendency',
      badge: `${maleCount} Boy / ${femaleCount} Girl Cues`,
      tone: 'info',
      detail: explanation,
    },
    {
      label: 'Conception & Vitality Strength',
      badge: beejaOdd && kshetraEven ? 'Fertile & Supportive' : 'Needs Gentle Care',
      tone: beejaOdd && kshetraEven ? 'good' : 'warn',
      detail:
        beejaOdd && kshetraEven
          ? 'Both vitality and receptivity indicators align cleanly, supporting healthy conception.'
          : 'Routine health check-ups, nutrition, rest, and calm timing days will improve conception strength.',
    },
  ];

  return { headline, explanation, items };
}

export function buildTailoredAnswerBundle(
  analysis: CompleteHoraryAnalysis,
  plainTimeframe: string,
  bestDaysNote: string
): TailoredAnswerBundle {
  const { chart, kp, tajika, kerala, systemsApproach, domain, timing } = analysis;
  const qText = chart.input.questionText || '';
  const cat = chart.input.category;
  const focusKind = analyzeQuestionFocus(qText, cat);

  const primaryPosYoga = tajika.primaryYogas.find(
    (y) =>
      y.favourable &&
      (y.type.includes('Ithasala') ||
        y.type.includes('Kamboola') ||
        y.type.includes('Naktha') ||
        y.type.includes('Yamaya'))
  );
  const mediatorYoga = tajika.primaryYogas.find(
    (y) => y.type.includes('Naktha') || y.type.includes('Yamaya')
  );
  const hasDelay =
    kp.domainEvaluation.retroMatrixCase === 'Retrograde in Direct Star (Delayed)' ||
    kp.domainEvaluation.retroMatrixCase === 'Retrograde in Retrograde Star (Denial)' ||
    kp.domainEvaluation.retroMatrixCase === 'Direct in Retrograde Star (Failure)';

  const strongPromise = domain.unifiedScorePct >= 72;
  const moderatePromise = domain.unifiedScorePct >= 56;

  // Helpful plain human reason (NO jargon chains!)
  const whyPlain = strongPromise
    ? mediatorYoga
      ? 'Opportunities align smoothly, and support from an intermediary, colleague, or trusted contact helps bring things together.'
      : 'Both your own initiative and external circumstances point in the same constructive direction without major hidden blockers.'
    : moderatePromise
    ? hasDelay
      ? 'The end result has real potential, but slow movement or back-and-forth waiting means patience and steady follow-up are required.'
      : 'Good potential exists, though you will need practical effort, clear communication, and careful checking of details to lock in success.'
    : 'Obstacles, mismatched timing, or competing responsibilities are holding this back right now, so rushing would invite frustration.';

  const peoplePlain = mediatorYoga
    ? 'A helpful third person — such as a colleague, mutual friend, advisor, or family contact — plays a useful role in moving things forward.'
    : tajika.primaryYogas.some((y) => y.type.includes('Easarapha'))
    ? 'Someone involved may have recently pulled back or missed a step, so gentle re-communication is needed rather than pressure.'
    : 'Progress rests mainly on direct, clear communication between you and the main person or authority handling this matter.';

  // Build Calendar Windows when user asks When / Dates / Fertility / Exams / Travel / Marriage
  const needsDates =
    focusKind === 'fertility_dates' ||
    focusKind === 'when_dates' ||
    cat === 'pregnancy_children' ||
    cat === 'marriage_relationship' ||
    cat === 'education_exam' ||
    cat === 'travel_missing';

  const dateWindows = needsDates
    ? computeFavourableCalendarWindows(
        analysis,
        focusKind === 'fertility_dates' || cat === 'pregnancy_children'
          ? 'fertility'
          : 'general_timing',
        4
      )
    : [];

  // Specialised Tailored Modes
  if (focusKind === 'fertility_dates') {
    const winText =
      dateWindows.length > 0
        ? dateWindows.map((w) => w.dateRangeLabel).slice(0, 3).join(', ')
        : 'Upcoming bright lunar days on Mondays, Thursdays, or Fridays';
    const monthsEst = timing.pregnancyTimingNote
      ? `~${Math.max(1, Math.round(timing.pregnancyTimingNote.daysEstimateByNavamsa / 30))} month(s)`
      : plainTimeframe;

    return {
      focusKind,
      customHeadline:
        dateWindows.length > 0
          ? `Best Upcoming Dates to Conceive: ${dateWindows[0].dateRangeLabel}`
          : 'Best Time & Conception Outlook',
      directSummary: `The clearest upcoming windows over the next 8 weeks fall on: ${winText}. Overall fertility and family outlook is ${
        moderatePromise ? 'encouraging' : 'moderate — focus on rest, nutrition, and calm timing'
      } (${domain.unifiedScorePct}%), with a key milestone projected around ${monthsEst}.`,
      dateWindows,
      choiceSection: null,
      clearStories: [
        {
          heading: 'Recommended Dates & Best Days',
          answer: `Aim for calm, stress-free closeness during ${winText}, especially on ${bestDaysNote}. Avoid overtired evenings around New Moon or rushed days.`,
        },
        {
          heading: 'What Helps Conception Right Now',
          answer: whyPlain,
        },
        {
          heading: 'Physical Vitality & Preparation',
          answer:
            kerala.bhavaRuin.totalRuinPoints <= 4
              ? 'Vitality and receptivity factors are naturally supportive — keep routines peaceful and sleep steady.'
              : 'Mild stress or irregular routine can delay things; prioritize gentle nutrition, doctor check-ups, and calm rest.',
        },
        {
          heading: 'How Long Could Positive News Take?',
          answer: `Expect clear developments within ${monthsEst} (${plainTimeframe}), once health and timing rhythm line up.`,
        },
      ],
    };
  }

  if (focusKind === 'progeny_gender') {
    const gen = evaluateProgenyGender(analysis);
    const monthsEst = timing.pregnancyTimingNote
      ? `around ${Math.max(1, Math.round(timing.pregnancyTimingNote.daysEstimateByNavamsa / 30))} month(s)`
      : plainTimeframe;

    return {
      focusKind,
      customHeadline: gen.headline,
      directSummary: `${gen.explanation} Family blessing strength scores ${domain.unifiedScorePct}%, with supportive dates appearing around ${
        dateWindows[0]?.dateRangeLabel ?? bestDaysNote
      }.`,
      dateWindows,
      choiceSection: {
        title: 'Child Tendency & Health Breakdown',
        subtitle: 'Plain summary based on traditional child-house and vitality balance.',
        items: gen.items,
      },
      clearStories: [
        {
          heading: 'Direct Child Tendency Answer',
          answer: gen.explanation,
        },
        {
          heading: 'Overall Health & Blessing',
          answer: whyPlain,
        },
        {
          heading: 'Best Upcoming Dates & Timeframe',
          answer: `Good family dates fall around ${
            dateWindows.slice(0, 2).map((w) => w.dateRangeLabel).join(' and ') || bestDaysNote
          }. Key milestone momentum builds ${monthsEst}.`,
        },
        {
          heading: 'How to Support Smooth Results',
          answer: 'Keep maternal rest high, maintain regular medical care, and nurture peaceful harmony at home.',
        },
      ],
    };
  }

  if (focusKind === 'exam_paper_difficulty') {
    const subjects = evaluateExamSubjects(analysis);
    const easyNames = subjects
      .filter((s) => s.tone === 'good')
      .map((s) => s.label.split(',')[0])
      .slice(0, 2);
    const toughNames = subjects
      .filter((s) => s.tone === 'warn')
      .map((s) => s.label.split(',')[0])
      .slice(0, 2);

    return {
      focusKind,
      customHeadline: `Easier Papers: ${easyNames.join(' & ') || 'Concept Papers'} · Tougher: ${
        toughNames.join(' & ') || 'Strict Detail Sections'
      }`,
      directSummary: `Your strongest scoring advantage sits in ${
        easyNames.join(' and ') || 'core conceptual papers'
      }. Spend extra timed revision on ${
        toughNames.join(' and ') || 'dense memorization or tricky problem papers'
      }, where questions may feel stricter or more time-pressured. Overall exam result outlook is ${domain.unifiedScorePct}%.`,
      dateWindows,
      choiceSection: {
        title: 'Paper-by-Paper Difficulty Forecast',
        subtitle: 'Which subjects feel smoother versus where extra timed revision will save marks.',
        items: subjects,
      },
      clearStories: [
        {
          heading: 'Which Papers Will Feel Easy',
          answer: `Questions linked to ${
            easyNames.join(' and ') || 'your better-prepared topics'
          } flow cleanly with clearer recall and less confusion — aim for maximum marks here.`,
        },
        {
          heading: 'Which Papers May Feel Tough or Tricky',
          answer: `${
            toughNames.join(' and ') || 'Detailed technical or lengthy theory sections'
          } show pressure or tricky wording right now. Practice past timed mock papers and double-check every question before writing.`,
        },
        {
          heading: 'Overall Exam Result Outlook',
          answer: whyPlain,
        },
        {
          heading: 'Best Study & Revision Routine',
          answer: `Revising during calm morning hours and on ${bestDaysNote} improves retention and exam-hall speed.`,
        },
      ],
    };
  }

  if (focusKind === 'exam_pass_result') {
    const subjects = evaluateExamSubjects(analysis).slice(0, 4);
    const headline = strongPromise
      ? 'Yes — Strong Chance to Pass & Score Well'
      : moderatePromise
      ? 'Pass Likely — Stay Focused on Weak Sections'
      : 'Tough Test — Needs Extra Timed Revision Right Now';

    return {
      focusKind,
      customHeadline: headline,
      directSummary: `${whyPlain} Pay special attention to pacing yourself cleanly during the exam so easy marks are not lost under rush.`,
      dateWindows,
      choiceSection: {
        title: 'Subject Strength Check',
        subtitle: 'How different paper types are currently supported for your test.',
        items: subjects,
      },
      clearStories: [
        {
          heading: 'Will You Clear This Exam?',
          answer: `${headline}. ${whyPlain}`,
        },
        {
          heading: 'Where Marks Can Slip',
          answer: hasDelay
            ? 'Double-checking instructions, question numbers, and time limits is vital — rushed mistakes or a second-attempt hurdle can show up if unprepared.'
            : 'Keep study disciplined and avoid last-minute syllabus changes.',
        },
        {
          heading: 'When Will Clarity / Results Show?',
          answer: `Key progress develops ${plainTimeframe.toLowerCase()}, with strongest support on ${bestDaysNote}.`,
        },
        {
          heading: 'How to Maximize Your Score',
          answer: 'Solve stronger sections cleanly first, reserve 10 minutes to review calculations/answers, and rest properly before exam day.',
        },
      ],
    };
  }

  if (focusKind === 'career_which_field') {
    const careerEval = evaluateCareerSuitability(analysis);
    return {
      focusKind,
      customHeadline: careerEval.topFieldsHeadline,
      directSummary: `The chart points most clearly toward ${careerEval.items[0].label}. ${careerEval.jobVsBusiness} Overall career momentum scores ${domain.unifiedScorePct}%.`,
      dateWindows: [],
      choiceSection: {
        title: 'Best-Suited Career & Business Paths',
        subtitle: 'Ranked directions matching your current chart strengths and work environment.',
        items: careerEval.items,
      },
      clearStories: [
        {
          heading: 'Which Career Paths Fit Best Right Now',
          answer: `${careerEval.items[0].label} stands out strongest. ${careerEval.items[1]?.label ? `Secondary strong option: ${careerEval.items[1].label}.` : ''}`,
        },
        {
          heading: 'Should You Do a Job or Start a Business?',
          answer: careerEval.jobVsBusiness,
        },
        {
          heading: 'Why This Direction Works',
          answer: `${careerEval.items[0].detail} ${whyPlain}`,
        },
        {
          heading: 'Best Timing to Apply or Launch',
          answer: `Expect momentum ${plainTimeframe.toLowerCase()}. Aim interviews or launches around ${bestDaysNote}.`,
        },
      ],
    };
  }

  if (focusKind === 'choice_comparison') {
    const isStayBetter = tajika.allYogas.some((y) => y.type.includes('Easarapha')) || !strongPromise;
    return {
      focusKind,
      customHeadline: isStayBetter
        ? 'Lean Toward Caution / Stay Steady Before Switching'
        : 'Lean Toward Forward Move / New Opportunity',
      directSummary: isStayBetter
        ? `Right now, stability beats rushing into an unproven change (${domain.unifiedScorePct}%). Protect what you already have while verifying the new option thoroughly.`
        : `Moving forward with the new path or active decision is well supported (${domain.unifiedScorePct}%), provided terms are verified clearly in writing.`,
      dateWindows,
      choiceSection: {
        title: 'Side-by-Side Option Check',
        subtitle: 'Comparing keeping your current base vs taking the new step right now.',
        items: [
          {
            label: 'Staying / Current Path',
            badge: isStayBetter ? 'Safer Right Now' : 'Stable Base',
            tone: isStayBetter ? 'good' : 'info',
            detail: isStayBetter
              ? 'Offers lower downside while temporary obstacles clear.'
              : 'Familiar ground, though growth may feel slower if you stay unchanged.',
          },
          {
            label: 'New Move / Switch / Active Step',
            badge: !isStayBetter ? 'Favoured Move' : 'Needs Verification',
            tone: !isStayBetter ? 'good' : 'warn',
            detail: !isStayBetter
              ? 'External momentum and helpers support making this shift cleanly.'
              : 'Do not commit without written confirmation and clear backup.',
          },
        ],
      },
      clearStories: [
        {
          heading: 'Which Choice Looks Stronger',
          answer: isStayBetter
            ? 'Holding steady or verifying concrete terms first protects you from avoidable regret.'
            : 'Taking the constructive step forward works well when handled systematically.',
        },
        {
          heading: 'Why the Balance Points This Way',
          answer: whyPlain,
        },
        {
          heading: 'People Involved in This Decision',
          answer: peoplePlain,
        },
        {
          heading: 'When Will Things Settle',
          answer: `Clarity emerges ${plainTimeframe.toLowerCase()}; act on ${bestDaysNote}.`,
        },
      ],
    };
  }

  // Default Universal Tailored Questions (Yes/No, When/How Long, Who/Whom/Whose, Where, How Much/Many, Why/How)
  const leadHeadline =
    focusKind === 'when_dates'
      ? `Expected Timing: ${plainTimeframe}${dateWindows[0] ? ` (Next Good Dates: ${dateWindows[0].dateRangeLabel})` : ''}`
      : focusKind === 'where_location' && cat === 'lost_stolen'
      ? `Search Direction: ${domain.coraTheft.directionKpCardinal.split('(')[0].trim()} · ${domain.coraTheft.mobilityDistance.split('->')[0].trim()}`
      : focusKind === 'who_person' && cat === 'lost_stolen'
      ? domain.coraTheft.insideJobIndicator
        ? 'Likely Someone Familiar or Nearby Was Involved'
        : 'More Likely Misplaced or External Party'
      : focusKind === 'how_much_many'
      ? strongPromise
        ? 'Strong / Above-Average Gain Expected'
        : moderatePromise
        ? 'Steady / Moderate Amount Expected'
        : 'Modest / Tight Return Right Now'
      : null;

  const cleanStories: { heading: string; answer: string }[] = [
    {
      heading:
        focusKind === 'how_why'
          ? 'Why This Situation Looks Like This'
          : focusKind === 'who_person'
          ? 'Who Is Involved or Helping'
          : focusKind === 'when_dates'
          ? 'When Results Can Happen'
          : 'What Is Happening Right Now',
      answer:
        focusKind === 'who_person'
          ? `${peoplePlain} ${cat === 'lost_stolen' ? domain.coraTheft.culpritRelationCue.replace(/\(.*?\)/g, '') : ''}`
          : `${whyPlain} ${primaryPosYoga ? 'Momentum is gradually building toward a clearer resolution.' : ''}`,
    },
    {
      heading: 'How Fast & Best Upcoming Dates',
      answer: `${plainTimeframe}.${
        dateWindows.length > 0
          ? ` Good upcoming days include ${dateWindows.slice(0, 2).map((w) => w.dateRangeLabel).join(' and ')}.`
          : ` Best weekly rhythm falls on ${bestDaysNote}.`
      }`,
    },
    {
      heading: 'Role of Other People & Surroundings',
      answer: peoplePlain,
    },
    {
      heading: 'How You Should Handle This Next',
      answer: `${systemsApproach.planetProfiles.some((pr) => systemsApproach.primeDeterminant.primePlanets.includes(pr.planet) && pr.isWeak)
        ? 'Because key supporting factors face mild stress right now, follow a calm step-by-step plan and use the simple remedies listed below.'
        : 'Your personal effort carries real weight right now — act clearly during your strongest upcoming time window and keep facts documented.'}`,
    },
  ];

  return {
    focusKind,
    customHeadline: leadHeadline,
    directSummary: `${whyPlain} Overall outlook for this question is ${domain.unifiedScorePct}%, unfolding ${plainTimeframe.toLowerCase()}.`,
    clearStories: cleanStories,
    dateWindows,
    choiceSection: null,
  };
}
