import { describe, expect, it } from 'vitest';
import {
  CHANDRA_AVASTHAS,
  CHANDRA_KRIYAS,
  CHANDRA_VELAS,
  DREKKANA_NATURES,
  SA_FUNCTIONAL_MALEFICS,
  SA_MMP_BY_LAGNA,
} from '../constants';
import { runCompleteHoraryAnalysis } from '../horaryAnalyzer';
import { evaluateKpHorary } from '../kpHorary';
import { calcSaAgeStrength, calcSaOrbWeightPct } from '../systemsApproach';
import type { HoraryQueryInput } from '../types';

function makeBatch2Input(overrides: Partial<HoraryQueryInput> = {}): HoraryQueryInput {
  return {
    questionText: 'Will this new enterprise and career transition succeed?',
    category: 'career_job',
    queryIndexInSession: 1,
    localDate: '2026-11-12',
    localTime: '10:30:00',
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
    swaraNostril: 'left_ida',
    querentAge: 34,
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

describe('Batch 2 Engines: Systems Approach, KP Reader V, Lunar Micro-States, Hora & Bhrigu', () => {
  it('verifies V.K. Choudhry SA Functional Malefics, MMP across all 12 Lagnas & 5 deg orb weights', () => {
    expect(SA_FUNCTIONAL_MALEFICS[0]).toEqual(['Mercury', 'Rahu', 'Ketu']);
    expect(SA_FUNCTIONAL_MALEFICS[1]).toEqual(['Venus', 'Jupiter', 'Mars', 'Rahu', 'Ketu']);
    expect(SA_FUNCTIONAL_MALEFICS[3]).toEqual(['Jupiter', 'Saturn', 'Rahu', 'Ketu']);
    expect(SA_FUNCTIONAL_MALEFICS[5]).toEqual(['Saturn', 'Mars', 'Sun', 'Rahu', 'Ketu']);
    expect(SA_FUNCTIONAL_MALEFICS[11]).toEqual(['Sun', 'Venus', 'Saturn', 'Rahu', 'Ketu']);

    const expectedMmps = [
      'Ketu', 'Jupiter', 'Ketu', 'Saturn', 'Moon', 'Mars',
      'Mercury', 'Venus', 'Moon', 'Sun', 'Mercury', 'Venus',
    ];
    for (let lagna = 0; lagna < 12; lagna++) {
      expect(SA_MMP_BY_LAGNA[lagna]).toBe(expectedMmps[lagna]);

      const res = runCompleteHoraryAnalysis(
        makeBatch2Input({ castingMode: 'arudha_override', arudhaSignIndex: lagna })
      );
      const sa = res.systemsApproach;
      expect(sa.mmp).toBe(expectedMmps[lagna]);

      // Ch. 8 Kavach strictly targets Functional Benefics; Charity strictly targets Functional Malefics
      const fmSet = new Set(sa.functionalMalefics);
      for (const kv of sa.remedies.kavachPlanets) {
        expect(fmSet.has(kv.planet)).toBe(false);
      }
      for (const ch of sa.remedies.morningCharityPlanets) {
        expect(fmSet.has(ch.planet)).toBe(true);
      }
    }

    // Exact SA 5 deg MEP orb step intensity
    expect(calcSaOrbWeightPct(0.0)).toBe(100);
    expect(calcSaOrbWeightPct(1.0)).toBe(100);
    expect(calcSaOrbWeightPct(1.4)).toBe(80);
    expect(calcSaOrbWeightPct(2.0)).toBe(80);
    expect(calcSaOrbWeightPct(2.8)).toBe(60);
    expect(calcSaOrbWeightPct(3.5)).toBe(40);
    expect(calcSaOrbWeightPct(4.9)).toBe(20);
    expect(calcSaOrbWeightPct(5.01)).toBe(0);

    // Infancy (<5 deg) and Old Age (>25 deg) formulas
    expect(calcSaAgeStrength(1)).toEqual({ state: 'Infancy', strengthPct: 20 });
    expect(calcSaAgeStrength(4)).toEqual({ state: 'Infancy', strengthPct: 80 });
    expect(calcSaAgeStrength(15)).toEqual({ state: 'Young/Adult', strengthPct: 100 });
    expect(calcSaAgeStrength(26)).toEqual({ state: 'Old Age', strengthPct: 80 });
    expect(calcSaAgeStrength(29)).toEqual({ state: 'Old Age', strengthPct: 20 });
  });

  it('enforces KP Reader V 2x2 Retrograde Matrix, Untenanted flags, Hora RP & Moment Lagna toggles', () => {
    // March 20, 2025 -> Mercury & Venus retrograde in Pisces! Great real astronomical stress test
    const retroChartRes = runCompleteHoraryAnalysis(
      makeBatch2Input({
        localDate: '2025-03-20',
        localTime: '11:00:00',
        castingMode: 'kp_horary',
        kpNumber: 1,
      })
    );

    const anyTrueRetro = retroChartRes.kp.planets.some((p) => p.isTrueRetrograde);
    expect(anyTrueRetro).toBe(true);

    // Find a category whose CSL is Direct while its Star-Lord is Retrograde (if present on that chart)
    const directInRetro = retroChartRes.kp.allCategoryEvaluations.find(
      (ev) => !ev.cslRetrograde && ev.starOfCslRetrograde && ev.cuspSubLord !== 'Rahu' && ev.cuspSubLord !== 'Ketu'
    );
    if (directInRetro) {
      expect(directInRetro.retroMatrixCase).toBe('Direct in Retrograde Star (Failure)');
      expect(directInRetro.verdict).toBe('Denial / Unfavourable');
    }

    // Verify Direct-in-Retrograde-Star failure explicitly via controlled planet retro flag on cloned chart
    const base = runCompleteHoraryAnalysis(makeBatch2Input({ castingMode: 'kp_horary', kpNumber: 94 }));
    const csl = base.kp.domainEvaluation.cuspSubLord;
    const star = base.kp.domainEvaluation.starLordOfCsl;
    if (csl !== 'Rahu' && csl !== 'Ketu' && star !== 'Rahu' && star !== 'Ketu' && csl !== star) {
      const syntheticPlanets = base.chart.planets.map((p) =>
        p.id === csl
          ? { ...p, isRetrograde: false }
          : p.id === star
          ? { ...p, isRetrograde: true }
          : p
      );
      const forcedKp = evaluateKpHorary({ ...base.chart, planets: syntheticPlanets });
      const ev = forcedKp.domainEvaluation;
      expect(ev.retroMatrixCase).toBe('Direct in Retrograde Star (Failure)');
      expect(ev.verdict).toBe('Denial / Unfavourable');
    }

    // Verify Hora Lord RP & Moment Lagna RP toggles alter Ruling Planets labels cleanly
    const horaRes = runCompleteHoraryAnalysis(
      makeBatch2Input({
        castingMode: 'kp_horary',
        kpNumber: 120,
        settings: {
          mercuryCombustDeg: 8,
          diseaseHouse: 6,
          tajikaSquareWeightPct: 75,
          directionSystem: 'kp_cardinal',
          useHoraInRp: true,
          rpHoraryAscMode: 'moment_lagna',
        },
      })
    );
    expect(horaRes.kp.rulingPlanets[0].role).toContain('Hora Lord');
    expect(horaRes.kp.rulingPlanets[0].planet).toBe(horaRes.chart.panchanga.horaLord);
    expect(horaRes.kp.rulingPlanets[1].role).toContain('Moment Lagna');
    expect(horaRes.kp.rulingPlanets[1].planet).toBe(horaRes.chart.naturalAscendantSignLord);
    expect(horaRes.kp.electionalCheck.checks.length).toBe(4);
  });

  it('computes Prasna Marga Lunar Micro-States (60/36/12), 36 Drekkanas, 24-Hour Hora & Bhrigu Index', () => {
    expect(CHANDRA_KRIYAS.length).toBe(60);
    expect(CHANDRA_VELAS.length).toBe(36);
    expect(CHANDRA_AVASTHAS.length).toBe(12);
    expect(DREKKANA_NATURES.length).toBe(12);
    for (const row of DREKKANA_NATURES) {
      expect(row.length).toBe(3);
    }

    const res = runCompleteHoraryAnalysis(makeBatch2Input({ querentAge: 34 }));
    const lms = res.chart.panchanga.lunarMicroStates;
    expect(lms.moonNakArcMin).toBeGreaterThanOrEqual(0);
    expect(lms.moonNakArcMin).toBeLessThan(800);
    expect(lms.chandraKriyaIndex).toBeGreaterThanOrEqual(1);
    expect(lms.chandraKriyaIndex).toBeLessThanOrEqual(60);
    expect(lms.chandraVelaIndex).toBeGreaterThanOrEqual(1);
    expect(lms.chandraVelaIndex).toBeLessThanOrEqual(36);
    expect(lms.chandraAvasthaIndex).toBeGreaterThanOrEqual(1);
    expect(lms.chandraAvasthaIndex).toBeLessThanOrEqual(12);
    expect([1, 2, 3]).toContain(lms.ascDrekkanaIndex);
    expect(lms.ascDrekkanaNature.length).toBeGreaterThan(3);

    // 24-hour continuous Hora schedule
    const schedule = res.chart.panchanga.horaSchedule;
    expect(schedule.length).toBe(24);
    for (let i = 0; i < 23; i++) {
      expect(schedule[i].endUtcMs).toBe(schedule[i + 1].startUtcMs);
      expect(schedule[i].endUtcMs).toBeGreaterThan(schedule[i].startUtcMs);
    }
    const activeHoras = schedule.filter((s) => s.isActive);
    expect(activeHoras.length).toBe(1);
    expect(activeHoras[0].lord).toBe(res.chart.panchanga.horaLord);
    expect(activeHoras[0].horaNumber).toBe(res.chart.panchanga.horaNumber);

    // Bhrigu Prashna Nadi (107 - age)
    expect(res.systemsApproach.bhriguNadi.nadiEntryNumber).toBe(73);
    const infant = runCompleteHoraryAnalysis(makeBatch2Input({ querentAge: 0 }));
    expect(infant.systemsApproach.bhriguNadi.nadiEntryNumber).toBe(107);
    const elder = runCompleteHoraryAnalysis(makeBatch2Input({ querentAge: 106 }));
    expect(elder.systemsApproach.bhriguNadi.nadiEntryNumber).toBe(1);

    // Timing upcoming 5 Pratyantardasha windows
    expect(res.timing.upcomingPeriods.length).toBe(5);
  });
});
