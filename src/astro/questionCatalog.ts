import type { QuestionCategory } from './types';

export interface QuestionTopicMeta {
  id: QuestionCategory;
  shortLabel: string;
  fullLabel: string;
  focusHouses: number[];
  focusHousesPlain: string;
  presets: string[];
}

export const QUESTION_TOPIC_CATALOG: QuestionTopicMeta[] = [
  {
    id: 'general_yes_no',
    shortLabel: 'Yes / No',
    fullLabel: 'General Yes / No Question',
    focusHouses: [1, 11],
    focusHousesPlain: '1st (Your Effort), 11th (Fulfilment of Wishes), 9th (Luck)',
    presets: [
      'Will this initiative or plan succeed smoothly?',
      'Is this the right time to take this major step?',
      'Will my pending wish or approval come through?',
      'Will this decision bring peace and good results?',
    ],
  },
  {
    id: 'career_job',
    shortLabel: 'Job & Career',
    fullLabel: 'Job, Career & Business',
    focusHouses: [10, 6, 2, 11],
    focusHousesPlain: '10th (Career Status), 6th (Work / Service), 2nd (Salary), 11th (Gains)',
    presets: [
      'Which career field should I choose?',
      'Will I get a new job offer soon?',
      'Should I do a job or start my own business?',
      'How much growth or stability is in my career?',
    ],
  },
  {
    id: 'promotion_transfer',
    shortLabel: 'Promotion / Switch',
    fullLabel: 'Job Change, Promotion or Transfer',
    focusHouses: [10, 11, 3, 6],
    focusHousesPlain: '10th (Position), 11th (Raise / Gain), 3rd & 12th (Role / Location Shift)',
    presets: [
      'Will I get promoted or receive a raise this cycle?',
      'Should I switch jobs for better growth right now?',
      'Will my requested job transfer be approved?',
      'Will higher authorities support my advancement?',
    ],
  },
  {
    id: 'marriage_relationship',
    shortLabel: 'Marriage & Love',
    fullLabel: 'Love, Marriage & Relationship',
    focusHouses: [7, 2, 11],
    focusHousesPlain: '7th (Partner & Union), 2nd (Family), 11th (Lasting Happiness)',
    presets: [
      'Will this marriage or relationship move forward happily?',
      'When is marriage likely to take place?',
      'Will an estranged partner reconnect or reconcile?',
      'Will both families agree smoothly to this match?',
    ],
  },
  {
    id: 'finance_loan',
    shortLabel: 'Money & Loan',
    fullLabel: 'Finance, Money & Loan',
    focusHouses: [2, 6, 11],
    focusHousesPlain: '2nd (Savings & Cash), 6th (Loans / Credit), 11th (Income & Recovery)',
    presets: [
      'Will my loan or funding request be approved?',
      'Will stuck money or pending payments return soon?',
      'Will my financial stability improve over coming months?',
      'Is this investment or partnership safe right now?',
    ],
  },
  {
    id: 'lost_stolen',
    shortLabel: 'Lost / Stolen',
    fullLabel: 'Lost Item or Stolen Property',
    focusHouses: [2, 4, 7, 11],
    focusHousesPlain: '2nd (Missing Value), 4th (Storage / Place), 7th (Person Involved), 11th (Recovery)',
    presets: [
      'Where is my lost item and will I get it back?',
      'Was this misplaced inside or taken by someone?',
      'Will lost cash, jewellery, or documents be recovered?',
      'Should I check nearby places or seek outside help?',
    ],
  },
  {
    id: 'medical_health',
    shortLabel: 'Health',
    fullLabel: 'Health & Medical Recovery',
    focusHouses: [1, 6, 10, 4],
    focusHousesPlain: '1st (Vitality), 6th (Illness / Healing), 4th (Treatment), 10th (Patient Strength)',
    presets: [
      'How is health recovery looking right now?',
      'Will the current treatment and doctor bring relief?',
      'Are symptoms temporary or needing long-term care?',
      'Will surgery or medical procedure go safely?',
    ],
  },
  {
    id: 'property_vehicle',
    shortLabel: 'Home / Vehicle',
    fullLabel: 'House, Land, Vehicle or Lease',
    focusHouses: [4, 11, 2],
    focusHousesPlain: '4th (Home / Land / Vehicle), 11th (Gain), 10th (Valuation & Deal)',
    presets: [
      'Will buying or renting this home go smoothly?',
      'Should I purchase this vehicle or property now?',
      'Will my property sell at a good price soon?',
      'Are there any hidden defects or paperwork risks?',
    ],
  },
  {
    id: 'legal_litigation',
    shortLabel: 'Court / Legal',
    fullLabel: 'Legal, Court & Disputes',
    focusHouses: [1, 6, 7, 11],
    focusHousesPlain: '1st (Your Side), 7th (Opponent), 6th (Dispute), 11th (Success / Settlement)',
    presets: [
      'Will the court case or legal dispute favour me?',
      'Should I settle out of court or keep contesting?',
      'Will my pending legal clearance or notice resolve soon?',
      'Who holds the stronger position right now?',
    ],
  },
  {
    id: 'travel_missing',
    shortLabel: 'Travel / Missing',
    fullLabel: 'Travel & Missing Person',
    focusHouses: [9, 3, 2, 11],
    focusHousesPlain: '9th (Long / Foreign Travel), 3rd (Short Trip), 2nd & 11th (Safe Return)',
    presets: [
      'Will my travel, visa, or abroad plan work out smoothly?',
      'Will the missing or distant person return safely?',
      'Is this the right time to start my journey?',
      'Will long-distance relocation bring good settlement?',
    ],
  },
  {
    id: 'pregnancy_children',
    shortLabel: 'Children & Family',
    fullLabel: 'Children & Pregnancy',
    focusHouses: [5, 2, 11],
    focusHousesPlain: '5th (Children / Creativity), 2nd (Family), 11th (Blessings)',
    presets: [
      'What are the right dates and best window to conceive?',
      'Will I have a son or daughter?',
      'What is the outlook for pregnancy and a healthy baby?',
      'When can good family news regarding children arrive?',
    ],
  },
  {
    id: 'education_exam',
    shortLabel: 'Exams & Study',
    fullLabel: 'Exams, Study & Papers',
    focusHouses: [4, 5, 9, 11],
    focusHousesPlain: '4th (Study & Results), 5th (Intellect & Papers), 9th (Higher Study), 11th (Success)',
    presets: [
      'Will I pass this upcoming exam?',
      'Which paper or subject will be easy or difficult?',
      'Will I get admission or qualify for this course?',
      'How can I focus better and clear tough subjects?',
    ],
  },
  {
    id: 'blind_mook',
    shortLabel: 'Guess My Query',
    fullLabel: 'Unspoken Question (Guess My Question)',
    focusHouses: [1],
    focusHousesPlain: '1st & Moon Sign (Reveals what is weighing on the mind)',
    presets: [
      'What topic or concern is strongly on my mind right now?',
      'Is my unspoken worry about money, home, or people?',
      'What hidden focus does this moment highlight for me?',
    ],
  },
];

export function getTopicMeta(category: QuestionCategory): QuestionTopicMeta {
  return QUESTION_TOPIC_CATALOG.find((c) => c.id === category) ?? QUESTION_TOPIC_CATALOG[0];
}

const KEYWORD_RULES: { category: QuestionCategory; patterns: RegExp[] }[] = [
  {
    category: 'lost_stolen',
    patterns: [/\b(lost|stolen|theft|thief|stole|misplaced|missing ring|missing wallet|missing phone|missing key|missing gold|cash lost|find my)\w*\b/i],
  },
  {
    category: 'marriage_relationship',
    patterns: [/\b(marr\w*|wedding|spouse|husband|wife|bride|groom|love\w*|relationship|girlfriend|boyfriend|partner|fiance|engagement|match|divorc\w*|reconcil\w*)\b/i],
  },
  {
    category: 'promotion_transfer',
    patterns: [/\b(promot\w*|increment\w*|appraisal\w*|transfer\w*|relocat\w*|switch job|change job|job change|leave current job|resign\w*)\b/i],
  },
  {
    category: 'education_exam',
    patterns: [/\b(exam\w*|paper\w*|subject\w*|pass\w*|fail\w*|study|studying|school|college|university|degree|admission\w*|test score|mark\w*|syllabus|result\w*)\b/i],
  },
  {
    category: 'career_job',
    patterns: [/\b(job\w*|career\w*|interview\w*|offer letter|workplace|boss|employment|hired|hire|business\w*|startup|company|profession|line of work|field)\b/i],
  },
  {
    category: 'finance_loan',
    patterns: [/\b(money|loan\w*|debt\w*|credit|mortgage|fund\w*|invest\w*|stock\w*|profit\w*|salary|payment\w*|stuck money|lend|lent|bank|finance\w*|wealth)\b/i],
  },
  {
    category: 'property_vehicle',
    patterns: [/\b(house|home|flat|apartment|land|plot|property|real estate|buy a car|vehicle|bike|rent\w*|lease|tenant|builder)\b/i],
  },
  {
    category: 'medical_health',
    patterns: [/\b(health|sick\w*|illness|disease|doctor|hospital|surgery|operation|pain|cure|recover\w*|medicine|treatment|diagnosis|fever)\b/i],
  },
  {
    category: 'legal_litigation',
    patterns: [/\b(court|legal|case|lawsuit\w*|judge|lawyer|dispute\w*|police|bail|verdict|hearing|notice|opponent|fight|litigation)\b/i],
  },
  {
    category: 'travel_missing',
    patterns: [/\b(travel\w*|trip|journey|flight|visa|passport|abroad|foreign|overseas|immigr\w*|missing person|runaway|return home)\b/i],
  },
  {
    category: 'pregnancy_children',
    patterns: [/\b(pregnan\w*|conceiv\w*|baby|child\w*|son|daughter|delivery|birth|fertility|ivf)\b/i],
  },
  {
    category: 'blind_mook',
    patterns: [/\b(unspoken|guess my|mook|what am i thinking|on my mind)\b/i],
  },
];

export function detectQuestionCategory(text: string): QuestionCategory | null {
  const trimmed = text.trim();
  if (trimmed.length < 3) return null;
  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.some((rx) => rx.test(trimmed))) {
      return rule.category;
    }
  }
  return null;
}

/**
 * Detects third-party questions (e.g. "Will my son get a job?") where the chart
 * should rotate to that person's house, while keeping "Will I have a son?" on House 1.
 */
export function detectAskingAboutHouse(text: string): 1 | 3 | 4 | 5 | 7 | 9 {
  const q = text.toLowerCase();
  if (/\bmy\s+(son|daughter|child|kid)\b/i.test(q) && !/\bhave a (son|daughter|child|baby)\b/i.test(q)) {
    return 5;
  }
  if (/\bmy\s+(spouse|husband|wife|partner)\b/i.test(q) && /\b(job|career|health|exam|travel|visa|case|promotion)\b/i.test(q)) {
    return 7;
  }
  if (/\bmy\s+(mother|mom|mum)\b/i.test(q)) return 4;
  if (/\bmy\s+(father|dad)\b/i.test(q)) return 9;
  if (/\bmy\s+(brother|sister|sibling)\b/i.test(q)) return 3;
  return 1;
}
