import {
  evaluateClassicalPrashnaRules,
  type ClassicalPrashnaBundle,
} from './classicalPrashnaRules';
import { QUESTION_CATEGORIES } from './constants';
import { synthesizeDomainReport, type DomainAnalysisReport } from './domainPredictors';
import { computeHoraryChart } from './ephemeris';
import { evaluateKeralaPrasna, type KeralaPrasnaReport } from './keralaPrasna';
import { evaluateKpHorary, type KpHoraryReport } from './kpHorary';
import { evaluateRadicalityAndDoshas, type RadicalityReport } from './radicality';
import { evaluateSystemsApproach, type SystemsApproachReport } from './systemsApproach';
import { evaluateTajikaEngine, type TajikaReport } from './tajikaEngine';
import { evaluateTimingEngine, type TimingWindowReport } from './timingEngine';
import type { CastHoraryChart, HoraryQueryInput } from './types';

export interface CompleteHoraryAnalysis {
  chart: CastHoraryChart;
  radicality: RadicalityReport;
  tajika: TajikaReport;
  kp: KpHoraryReport;
  kerala: KeralaPrasnaReport;
  systemsApproach: SystemsApproachReport;
  classical: ClassicalPrashnaBundle;
  timing: TimingWindowReport;
  domain: DomainAnalysisReport;
}

export function runCompleteHoraryAnalysis(input: HoraryQueryInput): CompleteHoraryAnalysis {
  const cat = QUESTION_CATEGORIES.find((q) => q.id === input.category) ?? QUESTION_CATEGORIES[0];
  const chart = computeHoraryChart(input);
  const radicality = evaluateRadicalityAndDoshas(chart);
  const tajika = evaluateTajikaEngine(chart, cat.primaryHouse);
  const kp = evaluateKpHorary(chart);
  const kerala = evaluateKeralaPrasna(chart, cat.primaryHouse);
  const systemsApproach = evaluateSystemsApproach(chart);
  const classical = evaluateClassicalPrashnaRules(chart);
  const timing = evaluateTimingEngine(chart, tajika, kp, cat.primaryHouse);
  const domain = synthesizeDomainReport(chart, radicality, tajika, kp, kerala, timing, systemsApproach);

  return {
    chart,
    radicality,
    tajika,
    kp,
    kerala,
    systemsApproach,
    classical,
    timing,
    domain,
  };
}
