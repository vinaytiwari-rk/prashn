import { SIGNS, WEEKDAY_LORDS, WEEKDAY_NAMES } from './constants';
import type { CompleteHoraryAnalysis } from './horaryAnalyzer';
import type { MethodLayerItem } from './domainPredictors';
import {
  buildTailoredAnswerBundle,
  type FavourableDateWindow,
  type TailoredChoiceItem,
} from './questionAnswerEngine';
import { getTopicMeta } from './questionCatalog';
import type { NineGrahaId, QuestionCategory } from './types';

export interface PlainFinding {
  label: string;
  value: string;
  tone: 'good' | 'warn' | 'bad' | 'info';
}

export interface NarrativeSection {
  title: string;
  paragraph: string;
}

export interface JourneyPhaseItem {
  phase: 'Root / Past' | 'Present Moment' | 'Expected Outcome';
  summary: string;
}

export interface RemedyActionItem {
  category: 'Charity / Donation' | 'Supporting Habit & Prayer' | 'Peace & Spiritual Care' | 'Good Timing';
  title: string;
  instruction: string;
  planet?: NineGrahaId;
}

export interface SimpleHoraryReport {
  verdictHeadline: string;
  verdictTone: 'good' | 'warn' | 'mixed' | 'bad';
  strengthPct: number;
  chartContextNote: string;
  summaryParagraph: string;
  clarityStatus: {
    clear: boolean;
    headline: string;
    detail: string;
  };
  pillars: {
    label: string;
    status: string;
    scorePct: number;
  }[];
  deepReading: NarrativeSection[];
  supportingPoints: string[];
  cautionPoints: string[];
  journeyFlow: JourneyPhaseItem[];
  dateWindows: FavourableDateWindow[];
  choiceSection: {
    title: string;
    subtitle: string;
    items: TailoredChoiceItem[];
  } | null;
  findings: PlainFinding[];
  actionPlan: {
    dos: string[];
    donts: string[];
  };
  timingSummary: {
    paceLabel: string;
    scaleLabel: string;
    projectedTurningPoint: string | null;
    runningPeriod: string;
    bestDaysNote: string;
    upcomingWindows: {
      periodLabel: string;
      startLocal: string;
      endLocal: string;
      supportLevel: 'Strong Support' | 'Moderate Support' | 'Neutral / Wait';
    }[];
  };
  kpPrediction: {
    verdictLabel: string;
    scorePct: number;
    primaryCusp: number;
    cuspSubLord: NineGrahaId;
    starLord: NineGrahaId;
    subSubLord: NineGrahaId;
    cslSelfHouses: number[];
    cslStarHouses: number[];
    matchedFavourable: number[];
    matchedUnfavourable: number[];
    retroRulePlain: string;
    cleanRulingPlanets: NineGrahaId[];
    summaryText: string;
    specialNotes: string[];
  };
  methodSummary: {
    methodLabel: string;
    layers: MethodLayerItem[];
    horaCard: {
      activeHoraLabel: string;
      horaLagnaLabel: string;
      scorePct: number;
      tone: 'good' | 'warn' | 'bad';
      badgeText: string;
      plainMeaning: string;
      nextBestHoraNote: string;
    };
    swaraCard: {
      checked: boolean;
      nostrilLabel: string;
      positionLabel: string;
      tone: 'good' | 'warn' | 'bad' | 'info';
      badgeText: string;
      plainMeaning: string;
    };
  };
  remediesSection: {
    required: boolean;
    headline: string;
    intro: string;
    items: RemedyActionItem[];
  };
}

/**
 * Strips classical stanza/PDF/article tags when surfacing domain descriptions
 * so non-astrologers see clean, readable guidance without source references.
 */
function stripReferenceTags(text: string): string {
  return text
    .replace(/,?\s*Stanzas?\s*\d+(?:[–-]\d+)?/gi, '')
    .replace(/\((?:[^)]*(?:Stanza|St\.|Ch\s*[IVX]+|L\d+|Reader\s*V|Times\s*KP|Choudhry|Raman|R\.G\.\s*Rao|Astrosutras|Prasna|Cora\s*Prasna|Case\s*Study|App(?:endix)?\s*[IVX]+)[^)]*)\)/gi, '')
    .replace(/\b(?:Reader\s*V|Times\s*KP|Prasna\s*Marga|Prasna\s*Tantra|Prasnatantra|Shatpanchasika|Astrosutras|V\.K\.\s*Choudhry|B\.V\.\s*Raman|R\.G\.\s*Rao|Kerala\s*Badha)\b[:\s-]*/gi, '')
    .replace(/\bL\d+(?:-\d+)?\b/g, '')
    .replace(/\bCh\s+[IVX]+\s*(?:Notes?)?\b/gi, '')
    .replace(/\b2x2 Matrix:\s*/gi, 'Motion Timing: ')
    .replace(/•\s*Classical\s*:?/gi, '• Additional Signal:')
    .replace(/•\s*Caution\s*:?/gi, '• Caution:')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim();
}

const HOUSE_MEANING_PLAIN: Record<number, string> = {
  1: 'Self & Personal Initiative (House 1)',
  2: 'Savings, Family & Liquid Value (House 2)',
  3: 'Communication, Short Travel & Effort (House 3)',
  4: 'Home, Peace, Property & Foundations (House 4)',
  5: 'Creativity, Children & Clear Thinking (House 5)',
  6: 'Work, Service, Health & Overcoming Obstacles (House 6)',
  7: 'Partner, Agreements & Public Dealings (House 7)',
  8: 'Hidden Risks, Delays & Sudden Changes (House 8)',
  9: 'Fortune, Higher Guidance & Long Journeys (House 9)',
  10: 'Career, Authority & Tangible Status (House 10)',
  11: 'Gains, Allies & Fulfilment of Desires (House 11)',
  12: 'Losses, Expenses, Rest & Letting Go (House 12)',
};

function describeHousesPlain(houses: number[]): string {
  const unique = Array.from(new Set(houses)).filter((h) => h >= 1 && h <= 12);
  if (unique.length === 0) return 'none directly triggered';
  return unique.map((h) => HOUSE_MEANING_PLAIN[h] ?? `House ${h}`).join('; ');
}

const CHARITY_BY_PLANET: Record<NineGrahaId, { title: string; instruction: string }> = {
  Sun: {
    title: 'Sunday Morning Water & Wheat Offering',
    instruction: 'Offer fresh water toward the morning Sun and share wheat, jaggery, or sweet oranges with those in need on Sunday.',
  },
  Moon: {
    title: 'Monday Peace & Milk/Rice Offering',
    instruction: 'Share white rice, milk, or cool drinking water calmly on Monday morning; spend 5 quiet minutes breathing slowly.',
  },
  Mars: {
    title: 'Tuesday Patience & Lentil Donation',
    instruction: 'Donate red lentils or warm sweet food to hardworking people on Tuesday morning; pause before reacting in anger.',
  },
  Mercury: {
    title: 'Wednesday Speech & Green Gram Donation',
    instruction: 'Feed green leafy greens to animals or donate whole green moong and stationery to students on Wednesday morning.',
  },
  Jupiter: {
    title: 'Thursday Gratitude & Yellow Grain Offering',
    instruction: 'Share yellow chana dal or bananas on Thursday morning and honour elders, teachers, or mentors.',
  },
  Venus: {
    title: 'Friday Harmony & White Sweet Offering',
    instruction: 'Share rice pudding, fruit, or clean light-coloured clothing gently on Friday morning.',
  },
  Saturn: {
    title: 'Saturday Service & Warm Meal Charity',
    instruction: 'Donate black sesame, mustard oil, or warm meals to elderly or needy workers on Saturday morning.',
  },
  Rahu: {
    title: 'Rahu Grounding Charity (Wednesday / Saturday)',
    instruction: 'Feed stray birds or dogs quietly in the morning and stick strictly to verified written facts before taking risks.',
  },
  Ketu: {
    title: 'Ketu Calmness Charity (Tuesday / Thursday)',
    instruction: 'Feed stray dogs or donate warm food quietly, and keep a steady, focused mind without jumping between plans.',
  },
};

const SUPPORT_BY_PLANET: Record<NineGrahaId, { title: string; instruction: string }> = {
  Sun: {
    title: 'Strengthen Supportive Sun',
    instruction: 'Spend 10 minutes in early morning sunlight and choose warm gold, saffron, or copper tones for important meetings.',
  },
  Moon: {
    title: 'Strengthen Supportive Moon',
    instruction: 'Stay well-hydrated, keep silver nearby, and choose peaceful white or cream colours during key discussions.',
  },
  Mars: {
    title: 'Strengthen Supportive Mars',
    instruction: 'Channel energy into brisk morning exercise and wear warm red/coral accents while keeping steady discipline.',
  },
  Mercury: {
    title: 'Strengthen Supportive Mercury',
    instruction: 'Put commitments clearly in writing and wear fresh green accents on Wednesday discussions or paperwork days.',
  },
  Jupiter: {
    title: 'Strengthen Supportive Jupiter',
    instruction: 'Wear yellow or saffron accents on Thursdays, practice daily gratitude, and consult trusted advisors.',
  },
  Venus: {
    title: 'Strengthen Supportive Venus',
    instruction: 'Keep your desk/home tidy and pleasant; wear crisp white or soft pastel shades on Fridays for smoother rapport.',
  },
  Saturn: {
    title: 'Strengthen Supportive Saturn',
    instruction: 'Follow disciplined daily routines, honour timelines patiently, and wear navy/dark blue on Saturdays.',
  },
  Rahu: {
    title: 'Balance Rahu Influence',
    instruction: 'Double-check every promise in writing and avoid impulsive shortcuts.',
  },
  Ketu: {
    title: 'Balance Ketu Influence',
    instruction: 'Focus on one concrete priority at a time rather than worrying over past outcomes.',
  },
};

const TIME_SCALE_PLAIN: Record<string, string> = {
  Sun: 'Usually quick — within days to a couple of weeks',
  Mars: 'Quick action — within days to a few weeks',
  Moon: 'Moderate pace — roughly 2 to 4 weeks',
  Venus: 'Smooth pace — roughly 2 to 6 weeks',
  Jupiter: 'Steady growth — within 1 to 3 months',
  Mercury: 'Medium timeframe — typically across a couple of months',
  Saturn: 'Slow & steady — gradually over several months',
};

const CATEGORY_ADVICE: Record<QuestionCategory, { dos: string[]; donts: string[] }> = {
  general_yes_no: {
    dos: ['Move step-by-step during your strongest upcoming supportive time window.', 'Keep agreements and next steps clear and written.'],
    donts: ['Do not rush big decisions during tired, anxious, or conflicted hours.', 'Avoid scattering energy across competing plans.'],
  },
  career_job: {
    dos: ['Follow up politely with mentors, recruiters, or decision-makers during positive morning hours.', 'Highlight measurable experience and stable commitment.'],
    donts: ['Do not resign from a stable role impulsively without a signed offer.', 'Avoid workplace gossip or unverified promises.'],
  },
  promotion_transfer: {
    dos: ['Document your recent contributions clearly before requesting review or relocation.', 'Engage senior supporters or managers constructively.'],
    donts: ['Avoid demanding immediate answers if authority figures seem distracted or delayed.', 'Do not overlook fine print in transfer terms.'],
  },
  marriage_relationship: {
    dos: ['Communicate calmly, involve respected family elders when ready, and watch consistency of actions.', 'Give hesitant partners breathing room during slow planetary phases.'],
    donts: ['Avoid forcing ultimatums out of impatience.', 'Do not hide key expectations about finances or family values.'],
  },
  finance_loan: {
    dos: ['Verify every interest rate, repayment clause, and collateral detail carefully.', 'Prioritize building a buffer before taking new commitments.'],
    donts: ['Avoid speculative shortcuts or lending money without written clarity.', 'Do not over-leverage on optimistic assumptions alone.'],
  },
  lost_stolen: {
    dos: ['Search systematically in the suggested direction, heights/levels, and room zones first.', 'Ask household members, colleagues, or recent visitors calmly without accusing prematurely.'],
    donts: ['Do not overlook cluttered shelves, bags, or inside furniture pockets.', 'Avoid delaying checks with building staff, drivers, or security cameras if recent.'],
  },
  medical_health: {
    dos: ['Follow prescribed medical testing and second-opinion advice if symptoms are shifting.', 'Maintain gentle rest, hydration, and clean daily routines.'],
    donts: ['Do not stop treatment abruptly the moment initial discomfort eases.', 'Avoid self-medicating or ignoring recurring warning signs.'],
  },
  property_vehicle: {
    dos: ['Inspect physical foundation/engine condition, water/electrical systems, and legal title independently.', 'Negotiate patiently rather than overpaying under urgency.'],
    donts: ['Do not transfer major advances without verified ownership documents.', 'Avoid ignoring structural, dampness, or hidden repair cues.'],
  },
  legal_litigation: {
    dos: ['Organize chronological evidence, dates, and official receipts cleanly.', 'Consider practical negotiated settlement if both sides face prolonged delay.'],
    donts: ['Avoid emotional courtroom reactions or informal verbal assurances.', 'Do not miss filing deadlines or minor procedural details.'],
  },
  travel_missing: {
    dos: ['Verify visas, bookings, documents, and contacts twice before departure.', 'For distant or separated loved ones, use calm mutual contacts to reopen communication.'],
    donts: ['Do not travel rushed during poor timing windows without backup plans.', 'Avoid escalating emotional pressure during sensitive check-ins.'],
  },
  pregnancy_children: {
    dos: ['Support physical vitality, peaceful rest, nutrition, and regular specialist guidance.', 'Nurture warm patience and family encouragement around the household.'],
    donts: ['Avoid exhausting stress or rigid timeline anxiety.', 'Do not skip routine health follow-ups.'],
  },
  education_exam: {
    dos: ['Give extra timed revision to harder or technical sections while locking down high-scoring strong topics.', 'Revise key notes calmly in early morning hours and verify instructions before starting each paper.'],
    donts: ['Avoid cramming brand-new difficult chapters in the final night.', 'Do not rush through easy questions and lose avoidable marks.'],
  },
  blind_mook: {
    dos: ['Address the primary life area highlighted most strongly right now before secondary worries.', 'Act during your cleanest daytime planetary hour.'],
    donts: ['Do not ignore recurring intuition if an unspoken matter keeps resurfacing.', 'Avoid juggling too many unspoken worries at once.'],
  },
};

export function buildSimpleHoraryReport(analysis: CompleteHoraryAnalysis): SimpleHoraryReport {
  const { chart, radicality, tajika, kp, kerala, systemsApproach, classical, timing, domain } = analysis;
  const topicMeta = getTopicMeta(chart.input.category);

  // 1. Plain Verdict
  let verdictHeadline = 'Mixed / Uncertain Outcome';
  let verdictTone: SimpleHoraryReport['verdictTone'] = 'mixed';
  if (domain.unifiedVerdict === 'Strong Yes') {
    verdictHeadline = 'Yes — Favourable Outlook';
    verdictTone = 'good';
  } else if (domain.unifiedVerdict === 'Favourable with Effort / Delay') {
    verdictHeadline = 'Yes — Expect Effort or Some Delay';
    verdictTone = 'warn';
  } else if (domain.unifiedVerdict === 'Unfavourable / Denial') {
    verdictHeadline = 'Difficult / Unlikely Right Now';
    verdictTone = 'bad';
  }

  // 2. Chart Basis Context Note (Multi-Question, Method 2 / 3 & Querent Name Transparency)
  const querentPrefix = chart.input.querentName?.trim()
    ? `Prepared for ${chart.input.querentName.trim()} · `
    : '';
  const chartContextNote = chart.rotatedReference?.isRotated
    ? `${querentPrefix}${chart.rotatedReference.reason} (Original sitting Ascendant was ${chart.rotatedReference.baseAscendantDms}.)`
    : chart.prashna108Info
    ? `${querentPrefix}Calculated from Number ${chart.prashna108Info.number} (${chart.prashna108Info.signsElapsed} signs elapsed → ${chart.prashna108Info.lagnaSignName} Lagna, Remainder ${chart.prashna108Info.navamsaNumber} → ${chart.prashna108Info.navamsaSignName} Navamsa) for ${topicMeta.fullLabel}.`
    : chart.input.castingMode === 'kp_horary' && chart.activeKpSlot
    ? `${querentPrefix}Calculated from KP Horary Number ${chart.activeKpSlot.number} (${chart.activeKpSlot.signName} rising) for ${topicMeta.fullLabel}.`
    : chart.specialMethodInfo
    ? `${querentPrefix}${chart.specialMethodInfo.summary} (${chart.ascendantSignName} rising) for ${topicMeta.fullLabel}.`
    : `${querentPrefix}Calculated for the question moment (${chart.ascendantSignName} rising) focusing on ${topicMeta.focusHousesPlain}.`;

  // 3. Question Clarity
  const clear = radicality.isRadical && radicality.triggeredDoshaCount <= 2;
  const clarityStatus = {
    clear,
    headline: clear
      ? 'Question Timing is Clear & Focused'
      : 'Timing Advisory: Uncertainty or Delays Indicated',
    detail: clear
      ? 'The planetary setup at the moment of asking is stable and well-aligned to give a reliable reading.'
      : 'Mixed timing influences or hurried conditions are present at the moment of query. Read carefully, avoid rushing decisions, and double-check facts.',
  };

  // 4. Key Method Drivers for Hero Chips (derived strictly from chosen calculation method)
  const pillars = domain.methodLayers.slice(0, 4).map((l) => ({
    label: l.layerName.replace(/^\d+\.\s*/, ''),
    status: l.badgeText === 'Not Checked' ? 'Not Checked' : l.badgeText,
    scorePct: l.scorePct ?? domain.unifiedScorePct,
  }));

  const visibleFast = timing.hemisphereRate.hemisphere.includes('Visible');
  const paceLabel = visibleFast ? 'Faster Turnaround (Days to Weeks)' : 'Gradual Development (Weeks to Months)';
  const baseScaleLabel = TIME_SCALE_PLAIN[timing.kalapindaScale.rulingPlanet] ?? 'Progressive timing across coming weeks';
  const scaleLabel = `${baseScaleLabel} · ${classical.timingFormula.navamsaEstimateSummary}`;
  const projectedTurningPoint =
    timing.tajikaOrbWindow.exactProjectedDate && timing.tajikaOrbWindow.estimatedDaysToExact !== null
      ? `${timing.tajikaOrbWindow.exactProjectedDate} (approx. ${Math.max(1, Math.round(timing.tajikaOrbWindow.estimatedDaysToExact))} days)`
      : null;

  const rpDays = kp.cleanRulingPlanets
    .map((p) => {
      const idx = WEEKDAY_LORDS.findIndex((wl) => wl === p);
      return idx >= 0 ? WEEKDAY_NAMES[idx] : null;
    })
    .filter((d): d is NonNullable<typeof d> => Boolean(d));
  const bestDaysNote =
    rpDays.length > 0
      ? `${Array.from(new Set(rpDays)).slice(0, 3).join(', ')} (strongest active days)`
      : `${chart.panchanga.vedicWeekdayName}`;

  const tailored = buildTailoredAnswerBundle(analysis, scaleLabel, bestDaysNote);
  if (tailored.customHeadline) {
    verdictHeadline = tailored.customHeadline;
  }

  // 5. Clear Plain-English Q&A & Supporting Points
  const retroDelayHint =
    kp.domainEvaluation.retroMatrixCase === 'Direct in Retrograde Star (Failure)'
      ? 'A key underlying factor is delayed right now, creating pauses unless patience and careful preparation are applied.'
      : kp.domainEvaluation.retroMatrixCase === 'Retrograde in Direct Star (Delayed)'
      ? 'Expect progress after a waiting phase or second attempt once initial delays settle.'
      : kp.domainEvaluation.retroMatrixCase === 'Retrograde in Retrograde Star (Denial)'
      ? 'Multiple slow factors indicate stronger resistance right now.'
      : 'Conditions support steady forward steps.';

  const weakPrimes = systemsApproach.planetProfiles
    .filter((pr) => systemsApproach.primeDeterminant.primePlanets.includes(pr.planet) && pr.isWeak)
    .map((pr) => pr.planet);

  const primaryPosYoga = tajika.primaryYogas.find(
    (y) =>
      y.favourable &&
      (y.type.includes('Ithasala') || y.type.includes('Kamboola') || y.type.includes('Naktha') || y.type.includes('Yamaya'))
  );
  const primaryNegYoga = tajika.primaryYogas.find((y) => !y.favourable || y.type.includes('Easarapha'));
  const mediatorYoga = tajika.primaryYogas.find((y) => y.type.includes('Naktha') || y.type.includes('Yamaya'));

  const momentumSentence = primaryPosYoga
    ? mediatorYoga
      ? 'A helpful third contact or intermediary can help bridge you and your goal smoothly.'
      : 'Situation momentum is moving in your favour toward a practical connection.'
    : primaryNegYoga
    ? 'There has been some hesitation or missed alignment, so calm follow-up works better than forcing things.'
    : 'Progress develops steadily step-by-step rather than overnight.';

  const summaryParagraph = tailored.directSummary;
  const cslPlanet = kp.domainEvaluation.cuspSubLord;
  const starPlanet = kp.domainEvaluation.starLordOfCsl;

  const deepReading: NarrativeSection[] = tailored.clearStories.map((s) => ({
    title: s.heading,
    paragraph: s.answer,
  }));

  // Supporting & Caution Bullet Lists (Plain Everyday Words)
  const supportingPoints: string[] = [];
  if (kp.domainEvaluation.matchedFavourable.length > 0) {
    supportingPoints.push(
      `Helpful life areas active right now: ${describeHousesPlain(kp.domainEvaluation.matchedFavourable)}.`
    );
  }
  if (primaryPosYoga) {
    supportingPoints.push(
      mediatorYoga
        ? 'An external contact, mentor, or well-wisher helps move this matter forward.'
        : 'Timing and initiative naturally line up toward completion.'
    );
  }
  if (kp.cleanRulingPlanets.length > 0) {
    supportingPoints.push(
      `Best active days of the week to push forward: ${bestDaysNote}.`
    );
  }
  if (kerala.bhavaRuin.totalRuinPoints <= 4) {
    supportingPoints.push('Overall foundation for this question is steady with low hidden friction.');
  }
  if (classical.degreeOfSuccess.pct >= 75) {
    supportingPoints.push(`Strong House 1 blessing (${classical.degreeOfSuccess.pct}%): ${classical.degreeOfSuccess.basis}`);
  }
  if (classical.lagnaTraits.udayaType === 'Shirshodaya') {
    supportingPoints.push(`${chart.ascendantSignName} rises visibly (head-first), supporting straightforward execution.`);
  }
  if (chart.input.category === 'general_yes_no' && classical.dailyQueryNote) {
    supportingPoints.push(classical.dailyQueryNote);
  }
  if (domain.horaAnalysis.tone === 'good') {
    supportingPoints.push(domain.horaAnalysis.plainMeaning);
  }
  if (domain.swaraAnalysis.checked && domain.swaraAnalysis.tone === 'good') {
    supportingPoints.push(domain.swaraAnalysis.plainMeaning);
  }
  if (supportingPoints.length === 0) {
    supportingPoints.push('Steady, organized follow-through builds gradual momentum over coming weeks.');
  }

  const cautionPoints: string[] = [];
  if (kp.domainEvaluation.matchedUnfavourable.length > 0) {
    cautionPoints.push(
      `Areas needing care: ${describeHousesPlain(kp.domainEvaluation.matchedUnfavourable)}.`
    );
  }
  if (kp.domainEvaluation.retroMatrixCase !== 'Direct in Direct Star') {
    cautionPoints.push(retroDelayHint);
  }
  if (domain.horaAnalysis.tone === 'bad') {
    cautionPoints.push(domain.horaAnalysis.plainMeaning);
  }
  if (domain.swaraAnalysis.checked && domain.swaraAnalysis.tone === 'bad') {
    cautionPoints.push(domain.swaraAnalysis.plainMeaning);
  }
  const weakNotes = systemsApproach.planetProfiles
    .filter((pr) => systemsApproach.primeDeterminant.primePlanets.includes(pr.planet) && pr.isWeak)
    .map((pr) => `${pr.planet} needs support`);
  if (weakNotes.length > 0) {
    cautionPoints.push(`Mild planetary stress present (${weakNotes.join(', ')}) — see the practical remedies below.`);
  }
  for (const mksAlert of classical.maranaKarakaAlerts.slice(0, 2)) {
    cautionPoints.push(mksAlert);
  }
  if (radicality.timeDoshas.some((d) => d.triggered)) {
    const firstDosha = radicality.timeDoshas.find((d) => d.triggered);
    if (firstDosha) {
      cautionPoints.push(
        `Caution around current timing (${stripReferenceTags(firstDosha.name)}) — verify facts calmly before acting.`
      );
    }
  }
  if (cautionPoints.length === 0) {
    cautionPoints.push('No heavy hidden blockages detected right now.');
  }

  // Plain Journey Flow (Past -> Present -> Expected Result)
  const maha = kerala.fiveSutras.mahasutra;
  const journeyFlow: JourneyPhaseItem[] = [
    {
      phase: 'Root / Past',
      summary: `Background context sits mostly in ${
        maha.temporalZone.includes('Past')
          ? 'earlier decisions or recent events leading up to today.'
          : maha.temporalZone.includes('Future')
          ? 'upcoming changes that are still forming.'
          : 'your present immediate circumstances.'
      }`,
    },
    {
      phase: 'Present Moment',
      summary: `${
        SIGNS[chart.ascendantSignIndex].udaya === 'Shirshodaya'
          ? 'Conditions allow visible forward steps right now.'
          : SIGNS[chart.ascendantSignIndex].udaya === 'Prishtodaya'
          ? 'Preparation happens quietly behind the scenes before results become visible.'
          : 'Mixed pace right now — stay adaptable as new details emerge.'
      }`,
    },
    {
      phase: 'Expected Outcome',
      summary: `End result reads as ${
        maha.classification === 'Jeeva'
          ? 'alive, workable, and promising with steady effort.'
          : maha.classification === 'Roga'
          ? 'needing careful adjustment and patience before settling cleanly.'
          : 'slow to change unless a fresh approach is adopted.'
      }`,
    },
  ];

  // 6. Rich Domain-Specific Findings
  const findings: PlainFinding[] = [];
  const cat = chart.input.category;
  const byId = new Map(chart.planets.map((p) => [p.id, p]));
  const venus = byId.get('Venus')!;
  const jupiter = byId.get('Jupiter')!;

  findings.push({
    label: 'Rising Sign Nature & Direct Strength',
    value: `${chart.ascendantSignName} (${classical.lagnaTraits.udayaType}, ${classical.lagnaTraits.genderSign}, ${classical.lagnaTraits.bodyType}, ${classical.lagnaTraits.sunOrientation}) · ${classical.degreeOfSuccess.pct}% (${classical.degreeOfSuccess.basis})`,
    tone: classical.degreeOfSuccess.pct >= 75 ? 'good' : classical.degreeOfSuccess.pct === 0 ? 'bad' : 'info',
  });

  if (cat === 'lost_stolen') {
    const c = domain.coraTheft;
    findings.push(
      {
        label: 'Recovery Outlook',
        value: stripReferenceTags(c.recoveryVerdict),
        tone: kp.domainEvaluation.verdict.includes('Denial') ? 'bad' : 'good',
      },
      {
        label: 'Where to Search (Direction)',
        value: `${stripReferenceTags(c.directionKpCardinal)} — also check ${stripReferenceTags(c.directionClassicalCorner)}`,
        tone: 'info',
      },
      {
        label: 'Distance & Premises Zone',
        value: `${stripReferenceTags(c.mobilityDistance)} · ${classical.theftCues.insideOrOutsider} · Priority search spot: ${classical.theftCues.drekkanaSpot}`,
        tone: 'info',
      },
      {
        label: 'Specific Places / Rooms to Check',
        value: c.hidingRoomBy4H.map(stripReferenceTags).join(' • '),
        tone: 'info',
      },
      {
        label: 'Misplaced vs Taken by Someone',
        value: c.insideJobIndicator
          ? `Higher chance a familiar person or indoor contact was involved: ${c.insideJobReasons.map(stripReferenceTags).join(' ')}`
          : 'Signals point more toward external misplacement or outside party than someone close inside.',
        tone: c.insideJobIndicator ? 'warn' : 'good',
      },
      {
        label: 'Person / Suspect Cues',
        value: `Count clue: ~${c.culpritCount} · Age range: ${stripReferenceTags(c.culpritAge)} · ${stripReferenceTags(c.culpritGender)}. ${stripReferenceTags(c.suspectCheck)}`,
        tone: 'info',
      },
      {
        label: 'How It Likely Happened',
        value: `${c.modeOfTheftCues.map(stripReferenceTags).join(' ')} (${stripReferenceTags(c.culpritRelationCue)})`,
        tone: 'info',
      }
    );
  } else if (cat === 'medical_health') {
    const m = domain.medicalBadha;
    findings.push(
      {
        label: 'Condition & Diagnosis Clarity',
        value: `${stripReferenceTags(m.diseaseNature)} (${stripReferenceTags(m.pranaksharaRecoveryMod3)})`,
        tone: 'info',
      },
      {
        label: 'Body Systems / Areas to Watch',
        value: m.affectedOrgans.map(stripReferenceTags).join(' • '),
        tone: 'warn',
      },
      {
        label: 'Recovery & Relapse Watch',
        value: stripReferenceTags(m.relapseRisk),
        tone: m.relapseRisk.toLowerCase().includes('lower') ? 'good' : 'warn',
      },
      {
        label: 'Doctor & Treatment Balance',
        value: m.consultationRoles.map((r) => `${stripReferenceTags(r.role)}: ${stripReferenceTags(r.signAndLord)}`).join(' · '),
        tone: 'info',
      }
    );
    for (const ic of classical.illnessCues) {
      findings.push({
        label: ic.label,
        value: ic.detail,
        tone: ic.favourable === true ? 'good' : ic.favourable === false ? 'warn' : 'info',
      });
    }
    if (m.deityBadhaAssociations.length > 0) {
      findings.push({
        label: 'Mental Peace & Ancestral / Spiritual Care',
        value: `Gentle household prayer or charity advised for: ${m.deityBadhaAssociations.slice(0, 3).map((d) => stripReferenceTags(d.deity)).join(', ')}.`,
        tone: 'warn',
      });
    }
  } else if (cat === 'blind_mook') {
    const mk = domain.mookBlind;
    const simpleSubject = mk.natureOfQueryDhatuMoolaJeeva.includes('Dhatu')
      ? 'Money, valuables, career assets, or material stability'
      : mk.natureOfQueryDhatuMoolaJeeva.includes('Moola')
      ? 'Home, land, property, roots, or family environment'
      : 'Health, personal relationships, loved ones, or living concerns';
    findings.push(
      {
        label: 'Primary Topic on Your Mind',
        value: stripReferenceTags(mk.inferredTopicHint),
        tone: 'info',
      },
      {
        label: 'Core Category of Concern',
        value: simpleSubject,
        tone: 'good',
      },
      {
        label: 'Hourly Focus Clue',
        value: stripReferenceTags(mk.horaClue),
        tone: 'info',
      },
      {
        label: 'Underlying Mind Indicator',
        value: `Moon’s star lord and house position reinforce focus around House ${mk.inferredHouseFocus}.`,
        tone: 'info',
      }
    );
  } else {
    findings.push(
      {
        label: 'What Strongly Supports You',
        value:
          kp.domainEvaluation.matchedFavourable.length > 0
            ? `${describeHousesPlain(kp.domainEvaluation.matchedFavourable)} — activated cleanly by ${cslPlanet} and ${starPlanet}.`
            : 'Limited direct house alignment right now — extra planning and patience are required.',
        tone: kp.domainEvaluation.matchedFavourable.length > 0 ? 'good' : 'warn',
      },
      {
        label: 'Main Obstacles / Friction',
        value:
          kp.domainEvaluation.matchedUnfavourable.length > 0
            ? `Watch for friction around ${describeHousesPlain(kp.domainEvaluation.matchedUnfavourable)}. ${retroDelayHint}`
            : 'No heavy hidden house blockers detected.',
        tone: kp.domainEvaluation.matchedUnfavourable.length > 0 ? 'warn' : 'good',
      },
      {
        label: 'Goal Connection & Third-Party Help',
        value: momentumSentence,
        tone: primaryPosYoga ? 'good' : primaryNegYoga ? 'warn' : 'info',
      }
    );

    if (cat === 'marriage_relationship') {
      findings.push(
        {
          label: 'Harmony & Mutual Affection',
          value: `Relationship planet Venus is in ${venus.signName} (House ${venus.houseWholeSign}, ${venus.dignity}${
            venus.isRetrograde ? ', moving backward — favours reconnection or rethinking past ties' : ', direct'
          }${venus.isCombust ? ', close to Sun — manage ego or family pressure' : ''}).`,
          tone: venus.isCombust ? 'warn' : 'good',
        },
        {
          label: 'Commitment & Maturity Indicator',
          value: `Jupiter occupies ${jupiter.signName} (House ${jupiter.houseWholeSign}, ${jupiter.dignity}), shaping long-term stability and family approval.`,
          tone: jupiter.dignity === 'Debilitated' ? 'warn' : 'info',
        }
      );
      for (const mc of classical.marriageCues) {
        findings.push({
          label: mc.label,
          value: mc.detail,
          tone: mc.favourable === true ? 'good' : mc.favourable === false ? 'warn' : 'info',
        });
      }
    }

    if (cat === 'legal_litigation') {
      findings.push({
        label: `Dispute Advantage (${classical.disputeEdge.winner})`,
        value: classical.disputeEdge.summary,
        tone:
          classical.disputeEdge.winner === 'Querent'
            ? 'good'
            : classical.disputeEdge.winner === 'Opponent'
            ? 'warn'
            : 'info',
      });
    }

    if (cat === 'career_job' || cat === 'promotion_transfer') {
      const sunP = byId.get('Sun')!;
      findings.push(
        {
          label: 'Authority & Management Support',
          value: `Sun sits in ${sunP.signName} (House ${sunP.houseWholeSign}, ${sunP.dignity}), indicating ${
            sunP.dignity === 'Debilitated' || [6, 8, 12].includes(sunP.houseWholeSign)
              ? 'seniors may need clearer proof of results before approving'
              : 'reasonable goodwill from leaders or decision-makers'
          }.`,
          tone: sunP.dignity === 'Debilitated' ? 'warn' : 'info',
        }
      );
      for (const cc of classical.careerCues) {
        findings.push({
          label: cc.label,
          value: cc.detail,
          tone: cc.favourable === true ? 'good' : 'warn',
        });
      }
    }

    if (cat === 'travel_missing') {
      findings.push(
        {
          label: 'Travel / Missing Person Separation Check',
          value: stripReferenceTags(systemsApproach.missingPersonSeparationNote),
          tone: systemsApproach.missingPersonSeparationNote.toLowerCase().includes('voluntary') ? 'info' : 'warn',
        },
        {
          label: 'Return Window Estimate',
          value: classical.travelerCues.returnSummary,
          tone: 'info',
        }
      );
      for (const tc of classical.travelerCues.signals) {
        findings.push({
          label: tc.label,
          value: tc.detail,
          tone: tc.favourable === true ? 'good' : tc.favourable === false ? 'warn' : 'info',
        });
      }
    }

    if (cat === 'pregnancy_children' && timing.pregnancyTimingNote) {
      findings.push({
        label: 'Vitality & Milestone Window',
        value: `Estimated progression points toward roughly ${Math.max(
          1,
          Math.round(timing.pregnancyTimingNote.daysEstimateByNavamsa / 30)
        )} month(s) (${timing.pregnancyTimingNote.daysEstimateByNavamsa} days) toward a key milestone.`,
        tone: 'info',
      });
    }

    if (cat === 'education_exam') {
      const mercP = byId.get('Mercury')!;
      findings.push({
        label: 'Focus, Memory & Writing Readiness',
        value: `Mental clarity stands at ${mercP.dignity} (${mercP.isCombust ? 'under mild pressure — avoid rushing answers' : mercP.isRetrograde ? 'double-check wording and steps carefully' : 'steady recall and analytical balance'}).`,
        tone: mercP.isCombust || mercP.dignity === 'Debilitated' ? 'warn' : 'good',
      });
    }

    for (const row of domain.domainHighlights.rows.slice(0, 3)) {
      const cleanedVal = stripReferenceTags(row.value);
      const cleanedLbl = stripReferenceTags(row.label);
      if (cleanedVal.length > 6 && !findings.some((f) => f.label === cleanedLbl)) {
        findings.push({
          label: cleanedLbl,
          value: cleanedVal,
          tone: 'info',
        });
      }
    }
  }

  if (kp.domainEvaluation.readerVSpecialNotes.length > 0) {
    const cleaned = kp.domainEvaluation.readerVSpecialNotes.map(stripReferenceTags).filter((s) => s.length > 4);
    if (cleaned.length > 0) {
      findings.push({
        label: 'Special Planetary Timing Signals',
        value: cleaned.join(' '),
        tone: 'info',
      });
    }
  }

  if (systemsApproach.bhriguNadi.nadiEntryNumber !== null) {
    findings.push({
      label: 'Personal Age Cycle Number',
      value: `Age Index #${systemsApproach.bhriguNadi.nadiEntryNumber} (calculated from age ${systemsApproach.bhriguNadi.querentAge}).`,
      tone: 'info',
    });
  }

  // 7. Timing Windows Reference
  const upcomingWindows = timing.upcomingPeriods.map((w) => ({
    periodLabel: `${w.mahadasha} → ${w.antardasha} → ${w.pratyantardasha}`,
    startLocal: w.startLocal,
    endLocal: w.endLocal,
    supportLevel: (w.matchesCleanRp && w.signifiesFavourable
      ? 'Strong Support'
      : w.signifiesFavourable
      ? 'Moderate Support'
      : 'Neutral / Wait') as 'Strong Support' | 'Moderate Support' | 'Neutral / Wait',
  }));

  // 8. Action Plan & Remedies
  const actionPlan = CATEGORY_ADVICE[cat] ?? CATEGORY_ADVICE.general_yes_no;

  const items: RemedyActionItem[] = [];
  const hasAfflictedTargetMep = systemsApproach.primeDeterminant.primaryHouses.some(
    (h) => systemsApproach.houseMepStatuses[h - 1]?.totalFmAfflictionPct > 0
  );
  const needsRemedy =
    domain.unifiedScorePct < 78 ||
    hasAfflictedTargetMep ||
    weakPrimes.length > 0 ||
    classical.maranaKarakaAlerts.length > 0 ||
    classical.marriageCues.some((c) => c.favourable === false) ||
    classical.illnessCues.some((c) => c.favourable === false) ||
    domain.medicalBadha.deityBadhaAssociations.length > 0 ||
    !clear;

  if (needsRemedy) {
    for (const ch of systemsApproach.remedies.morningCharityPlanets.slice(0, 2)) {
      const template = CHARITY_BY_PLANET[ch.planet];
      if (template) {
        items.push({
          category: 'Charity / Donation',
          title: template.title,
          instruction: template.instruction,
          planet: ch.planet,
        });
      }
    }

    for (const kv of systemsApproach.remedies.kavachPlanets.slice(0, 2)) {
      const template = SUPPORT_BY_PLANET[kv.planet];
      if (template) {
        items.push({
          category: 'Supporting Habit & Prayer',
          title: template.title,
          instruction: template.instruction,
          planet: kv.planet,
        });
      }
    }

    if (domain.medicalBadha.deityBadhaAssociations.length > 0) {
      const desc = domain.medicalBadha.deityBadhaAssociations
        .slice(0, 2)
        .map((d) => stripReferenceTags(d.deity))
        .join(', ');
      items.push({
        category: 'Peace & Spiritual Care',
        title: 'Home Prayer & Family Blessing',
        instruction: `Light a peaceful morning lamp and offer gentle prayers or charity toward: ${desc}.`,
      });
    }

    const firstStrong = upcomingWindows.find((u) => u.supportLevel === 'Strong Support') ?? upcomingWindows[0];
    items.push({
      category: 'Good Timing',
      title: `Act During Favourable ${chart.panchanga.horaLord} Planetary Hour`,
      instruction: firstStrong
        ? `Prioritize key steps on ${bestDaysNote} or during your supportive window (${firstStrong.startLocal} to ${firstStrong.endLocal}).`
        : `Prioritize key steps during active ${chart.panchanga.horaLord} hours.`,
    });
  }

  return {
    verdictHeadline,
    verdictTone,
    strengthPct: domain.unifiedScorePct,
    chartContextNote,
    summaryParagraph,
    clarityStatus,
    pillars,
    deepReading,
    supportingPoints,
    cautionPoints,
    journeyFlow,
    dateWindows: tailored.dateWindows,
    choiceSection: tailored.choiceSection,
    findings,
    actionPlan,
    timingSummary: {
      paceLabel,
      scaleLabel,
      projectedTurningPoint,
      runningPeriod: `${timing.currentVimshottariDasha.mahadasha} → ${timing.currentVimshottariDasha.antardasha} → ${timing.currentVimshottariDasha.pratyantardasha}`,
      bestDaysNote,
      upcomingWindows,
    },
    kpPrediction: {
      verdictLabel: kp.domainEvaluation.verdict,
      scorePct: kp.domainEvaluation.scorePct,
      primaryCusp: kp.domainEvaluation.primaryCusp,
      cuspSubLord: kp.domainEvaluation.cuspSubLord,
      starLord: kp.domainEvaluation.starLordOfCsl,
      subSubLord: kp.domainEvaluation.subLordOfCsl,
      cslSelfHouses: kp.domainEvaluation.cslSelfHouses,
      cslStarHouses: kp.domainEvaluation.cslStarHouses,
      matchedFavourable: kp.domainEvaluation.matchedFavourable,
      matchedUnfavourable: kp.domainEvaluation.matchedUnfavourable,
      retroRulePlain: stripReferenceTags(kp.domainEvaluation.retroMatrixCase),
      cleanRulingPlanets: kp.cleanRulingPlanets,
      summaryText: stripReferenceTags(kp.domainEvaluation.explanation),
      specialNotes: kp.domainEvaluation.readerVSpecialNotes
        .map(stripReferenceTags)
        .filter((s) => s.length > 4),
    },
    methodSummary: {
      methodLabel: domain.activeMethodLabel,
      layers: domain.methodLayers.map((layer) => ({
        ...layer,
        shortOutcome: stripReferenceTags(layer.shortOutcome),
        plainMeaning: stripReferenceTags(layer.plainMeaning),
      })),
      horaCard: {
        activeHoraLabel: `${domain.horaAnalysis.horaLord} Hora (#${domain.horaAnalysis.horaNumber} of 24)`,
        horaLagnaLabel: `${domain.horaAnalysis.horaLagnaSignName}`,
        scorePct: domain.horaAnalysis.horaScorePct,
        tone: domain.horaAnalysis.tone,
        badgeText: domain.horaAnalysis.badgeText,
        plainMeaning: stripReferenceTags(domain.horaAnalysis.plainMeaning),
        nextBestHoraNote: stripReferenceTags(domain.horaAnalysis.nextBestHoraNote),
      },
      swaraCard: {
        checked: domain.swaraAnalysis.checked,
        nostrilLabel: domain.swaraAnalysis.nostrilLabel,
        positionLabel: domain.swaraAnalysis.positionLabel,
        tone: domain.swaraAnalysis.tone,
        badgeText: domain.swaraAnalysis.badgeText,
        plainMeaning: stripReferenceTags(domain.swaraAnalysis.plainMeaning),
      },
    },
    remediesSection: {
      required: needsRemedy,
      headline: needsRemedy
        ? 'Recommended Remedies to Smooth Obstacles'
        : 'No Special Remedies Required',
      intro: needsRemedy
        ? 'Perform these simple, practical actions calmly and consistently to reduce friction and strengthen helpful timing.'
        : 'Your chart already holds steady planetary support for this question. Simply follow the practical steps above during an auspicious morning hour.',
      items,
    },
  };
}
