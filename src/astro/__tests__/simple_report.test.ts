import { describe, expect, it } from 'vitest';
import { QUESTION_CATEGORIES } from '../constants';
import { runCompleteHoraryAnalysis } from '../horaryAnalyzer';
import {
  QUESTION_TOPIC_CATALOG,
  detectAskingAboutHouse,
  detectQuestionCategory,
} from '../questionCatalog';
import { buildSimpleHoraryReport } from '../simpleReport';
import type { HoraryQueryInput } from '../types';

function makeSimpleInput(overrides: Partial<HoraryQueryInput> = {}): HoraryQueryInput {
  return {
    questionText: 'Will this work succeed cleanly?',
    category: 'general_yes_no',
    queryIndexInSession: 1,
    localDate: '2026-11-12',
    localTime: '11:00:00',
    latitude: 28.6139,
    longitude: 77.209,
    timeZone: 'Asia/Kolkata',
    placeName: 'New Delhi, IN',
    castingMode: 'time_lagna',
    kpNumber: 94,
    arudhaSignIndex: 0,
    ayanamsa: 'kp',
    houseSystem: 'placidus',
    nodeMode: 'true',
    swaraNostril: 'unknown',
    settings: {
      mercuryCombustDeg: 8,
      diseaseHouse: 6,
      tajikaSquareWeightPct: 75,
      directionSystem: 'kp_cardinal',
      useHoraInRp: false,
      rpHoraryAscMode: 'horary_slot',
    },
    ...overrides,
  };
}

describe('Plain-English SimpleHoraryReport Formatting', () => {
  it('produces clean non-jargon output with zero book/file/AI/deterministic references across all 12 categories', () => {
    const forbiddenPattern =
      /Prasna|Reader\s*V|Times\s*KP|Choudhry|R\.G\.\s*Rao|rppandey|astrosutras|shyamasundara|Zero\s*AI|Deterministic|No\s*AI|Stanza|prashna_rules_index|\.md\b/i;

    for (const cat of QUESTION_CATEGORIES) {
      const analysis = runCompleteHoraryAnalysis(makeSimpleInput({ category: cat.id, querentAge: 34 }));
      const report = buildSimpleHoraryReport(analysis);

      const serialized = JSON.stringify(report);
      expect(serialized).not.toMatch(forbiddenPattern);
      expect(report.pillars.length).toBe(4);
      expect(report.deepReading.length).toBe(4);
      expect(report.supportingPoints.length).toBeGreaterThanOrEqual(1);
      expect(report.cautionPoints.length).toBeGreaterThanOrEqual(1);
      expect(report.journeyFlow.length).toBe(3);
      expect(report.actionPlan.dos.length).toBeGreaterThanOrEqual(2);
      expect(report.actionPlan.donts.length).toBeGreaterThanOrEqual(2);
      expect(report.timingSummary.upcomingWindows.length).toBe(5);
      expect(report.findings.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('adapts predictions and answers specifically for unlimited user question types (progeny gender, conception dates, exam pass, easy vs hard papers, career choice)', () => {
    const sonReport = buildSimpleHoraryReport(
      runCompleteHoraryAnalysis(
        makeSimpleInput({
          category: 'pregnancy_children',
          questionText: 'Will I have a son?',
        })
      )
    );
    expect(sonReport.verdictHeadline).toMatch(/Boy|Girl|Balanced/i);
    expect(sonReport.choiceSection?.items.length).toBeGreaterThanOrEqual(2);

    const conceiveDatesReport = buildSimpleHoraryReport(
      runCompleteHoraryAnalysis(
        makeSimpleInput({
          category: 'pregnancy_children',
          questionText: 'What is the right time and dates to conceive?',
        })
      )
    );
    expect(conceiveDatesReport.verdictHeadline).toMatch(/Dates|Conceive|Conception/i);
    expect(conceiveDatesReport.dateWindows.length).toBeGreaterThanOrEqual(1);

    const examPassReport = buildSimpleHoraryReport(
      runCompleteHoraryAnalysis(
        makeSimpleInput({
          category: 'education_exam',
          questionText: 'Will I pass this upcoming exam?',
        })
      )
    );
    expect(examPassReport.verdictHeadline).toMatch(/Pass|Test/i);

    const paperDiffReport = buildSimpleHoraryReport(
      runCompleteHoraryAnalysis(
        makeSimpleInput({
          category: 'education_exam',
          questionText: 'Which paper will be easy or difficult?',
        })
      )
    );
    expect(paperDiffReport.verdictHeadline).toMatch(/Easier Papers/i);
    expect(paperDiffReport.choiceSection?.items.length).toBe(6);

    const whichCareerReport = buildSimpleHoraryReport(
      runCompleteHoraryAnalysis(
        makeSimpleInput({
          category: 'career_job',
          questionText: 'Which career should I make?',
        })
      )
    );
    expect(whichCareerReport.verdictHeadline).toMatch(/Best Career Fit/i);
    expect(whichCareerReport.choiceSection?.items.length).toBeGreaterThanOrEqual(4);
  });

  it('rotates chart House 1 across Q1..Q5 in Same Sitting mode and preserves independent moment when disabled', () => {
    const q1 = runCompleteHoraryAnalysis(makeSimpleInput({ queryIndexInSession: 1 }));
    const q2 = runCompleteHoraryAnalysis(makeSimpleInput({ queryIndexInSession: 2, multiQuestionMode: 'rotate_chart' }));
    const q3 = runCompleteHoraryAnalysis(makeSimpleInput({ queryIndexInSession: 3, multiQuestionMode: 'rotate_chart' }));
    const q4 = runCompleteHoraryAnalysis(makeSimpleInput({ queryIndexInSession: 4, multiQuestionMode: 'rotate_chart' }));
    const q5 = runCompleteHoraryAnalysis(makeSimpleInput({ queryIndexInSession: 5, multiQuestionMode: 'rotate_chart' }));
    const q2Independent = runCompleteHoraryAnalysis(
      makeSimpleInput({ queryIndexInSession: 2, multiQuestionMode: 'independent' })
    );

    expect(q1.chart.rotatedReference?.isRotated).toBe(false);
    expect(q2.chart.rotatedReference?.isRotated).toBe(true);
    expect(q2.chart.rotatedReference?.planet).toBe('Moon');
    expect(q2.chart.ascendantSignIndex).toBe(q1.chart.planets.find((p) => p.id === 'Moon')!.signIndex);
    expect(q2.kp.cusps[0].signIndex).toBe(q1.chart.planets.find((p) => p.id === 'Moon')!.signIndex);

    expect(q3.chart.rotatedReference?.planet).toBe('Sun');
    expect(q4.chart.rotatedReference?.planet).toBe('Jupiter');
    expect(['Mercury', 'Venus']).toContain(q5.chart.rotatedReference?.planet);

    expect(q2Independent.chart.rotatedReference?.isRotated).toBe(false);
    expect(q2Independent.chart.ascendantSignIndex).toBe(q1.chart.ascendantSignIndex);
  });

  it('provides zero-typing topic catalog and accurate deterministic category detection', () => {
    expect(QUESTION_TOPIC_CATALOG.length).toBe(13);
    for (const topic of QUESTION_TOPIC_CATALOG) {
      expect(topic.presets.length).toBeGreaterThanOrEqual(3);
    }

    expect(detectQuestionCategory('Will I win my court case against landlord?')).toBe('legal_litigation');
    expect(detectQuestionCategory('Where is my lost ring at home?')).toBe('lost_stolen');
    expect(detectQuestionCategory('Will I get promoted this year?')).toBe('promotion_transfer');
    expect(detectQuestionCategory('When will marriage happen?')).toBe('marriage_relationship');
    expect(detectQuestionCategory('Which paper will be easy or difficult in this exam?')).toBe('education_exam');
    expect(detectQuestionCategory('Which career should I make?')).toBe('career_job');
    expect(detectAskingAboutHouse('Will my son get a job?')).toBe(5);
    expect(detectAskingAboutHouse('Will I have a son?')).toBe(1);
  });

  it('computes Method 2 (1-108 Number), third-party rotation, and classical Prashna rules accurately', () => {
    // 78 / 9 -> quotient 8 (9th sign Sagittarius = index 8), remainder 6 (6th sign Virgo = index 5)
    const method2 = runCompleteHoraryAnalysis(
      makeSimpleInput({
        querentName: 'Amit Kumar',
        castingMode: 'number_108',
        prashna108Number: 78,
      })
    );
    expect(method2.chart.prashna108Info?.signsElapsed).toBe(8);
    expect(method2.chart.prashna108Info?.lagnaSignIndex).toBe(8);
    expect(method2.chart.prashna108Info?.lagnaSignName).toBe('Sagittarius');
    expect(method2.chart.prashna108Info?.navamsaNumber).toBe(6);
    expect(method2.chart.prashna108Info?.navamsaSignIndex).toBe(5);
    expect(method2.chart.prashna108Info?.navamsaSignName).toBe('Virgo');
    expect(method2.chart.ascendantSignIndex).toBe(8);

    // Third-party rotation (5th house becomes Lagna for "Will my son get a job?")
    const baseSelf = runCompleteHoraryAnalysis(makeSimpleInput({ askingAboutHouse: 1 }));
    const forSon = runCompleteHoraryAnalysis(
      makeSimpleInput({
        category: 'career_job',
        questionText: 'Will my son get a job?',
        askingAboutHouse: 5,
      })
    );
    expect(forSon.chart.rotatedReference?.isRotated).toBe(true);
    expect(forSon.chart.ascendantSignIndex).toBe((baseSelf.chart.ascendantSignIndex + 4) % 12);

    // Classical Prashna rules bundle checks
    expect([0, 25, 50, 75, 85, 100]).toContain(method2.classical.degreeOfSuccess.pct);
    expect(method2.classical.travelerCues.estimatedReturnMonths).toBeGreaterThanOrEqual(1);
    expect(method2.classical.timingFormula.lagnaToMoonDays).toBeGreaterThanOrEqual(1);

    const method2Report = buildSimpleHoraryReport(method2);
    expect(method2Report.chartContextNote).toContain('Prepared for Amit Kumar');
    expect(method2Report.chartContextNote).toContain('Sagittarius Lagna');
    expect(method2Report.chartContextNote).toContain('Virgo Navamsa');
  });

  it('supports friend, neighbour & relative rotation, all 8 calculation methods, Hora/Swara, and method-specific predictions without leaking references', () => {
    // Auto-detection of newly added relationships
    expect(detectAskingAboutHouse('Will my friend get this job?')).toBe(11);
    expect(detectAskingAboutHouse('Will my neighbour sell the house?')).toBe(3);
    expect(detectAskingAboutHouse('Will my mama recover soon?')).toBe(6);
    expect(detectAskingAboutHouse('Will my uncle return home?')).toBe(4);

    // Verify 11th house rotation for My Friend
    const selfChart = runCompleteHoraryAnalysis(makeSimpleInput({ askingAboutHouse: 1 }));
    const friendChart = runCompleteHoraryAnalysis(
      makeSimpleInput({
        askingAboutHouse: 11,
        askingAboutRole: 'My Friend (House 11)',
        questionText: 'Will my friend get this job?',
      })
    );
    expect(friendChart.chart.rotatedReference?.isRotated).toBe(true);
    expect(friendChart.chart.ascendantSignIndex).toBe((selfChart.chart.ascendantSignIndex + 10) % 12);

    // Verify Hora Lagna, Ashtamangala, Akshara, and Mooka Prashna modes + method-specific breakdown
    const horaRes = runCompleteHoraryAnalysis(makeSimpleInput({ castingMode: 'hora_lagna' }));
    expect(horaRes.chart.horaLagnaSignIndex).toBeGreaterThanOrEqual(0);
    expect(horaRes.chart.horaLagnaSignIndex).toBeLessThan(12);
    expect(horaRes.chart.ascendantSignIndex).toBe(horaRes.chart.horaLagnaSignIndex);
    expect(horaRes.chart.specialMethodInfo?.methodId).toBe('hora_lagna');

    const ashtaRes = runCompleteHoraryAnalysis(
      makeSimpleInput({ castingMode: 'ashtamangala', ashtamangalaPiles: [24, 19, 31] })
    );
    expect(ashtaRes.chart.specialMethodInfo?.methodId).toBe('ashtamangala');

    const aksharaRes = runCompleteHoraryAnalysis(
      makeSimpleInput({ castingMode: 'akshara_prashna', pranaksharaGroup: 'Cha' })
    );
    expect(aksharaRes.chart.specialMethodInfo?.methodId).toBe('akshara_prashna');

    const mookaRes = runCompleteHoraryAnalysis(makeSimpleInput({ castingMode: 'mooka_prashna' }));
    expect(mookaRes.chart.specialMethodInfo?.methodId).toBe('mooka_prashna');

    // Swara Nostril check: Ida Same Side vs Sushumna
    const idaCalm = runCompleteHoraryAnalysis(
      makeSimpleInput({
        category: 'marriage_relationship',
        swaraNostril: 'left_ida',
        swaraPosition: 'same_side',
      })
    );
    const sushumna = runCompleteHoraryAnalysis(
      makeSimpleInput({
        category: 'marriage_relationship',
        swaraNostril: 'both_sushumna',
        swaraPosition: 'unknown',
      })
    );
    expect(idaCalm.domain.swaraAnalysis.checked).toBe(true);
    expect(idaCalm.domain.swaraAnalysis.tone).toBe('good');
    expect(sushumna.domain.swaraAnalysis.tone).toBe('bad');

    // Verify method-specific breakdown & scores differ appropriately per chosen calculation method
    const rep = buildSimpleHoraryReport(idaCalm);
    expect(rep.methodSummary.layers.length).toBe(5);
    const kpOnlyRep = buildSimpleHoraryReport(
      runCompleteHoraryAnalysis(makeSimpleInput({ castingMode: 'kp_horary', kpNumber: 94 }))
    );
    expect(kpOnlyRep.methodSummary.methodLabel).toContain('KP Horary');
    expect(kpOnlyRep.methodSummary.layers[0].layerName).toContain('KP Horary');
    expect(kpOnlyRep.methodSummary.layers.length).toBe(4);
    expect(buildSimpleHoraryReport(horaRes).methodSummary.methodLabel).toContain('Hora Lagna');
    const joinedMethod = JSON.stringify(rep.methodSummary) + JSON.stringify(kpOnlyRep.methodSummary);
    expect(joinedMethod).not.toMatch(/pdf|page\s+\d|krishnamurti|raman|tajika\s+nilakanthi|prashna\s+marga|http|openai|gemini|determinis|nichod|sabhi/i);
  });
});
