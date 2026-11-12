import { describe, expect, it } from 'vitest';
import { KP_249_TABLE } from '../constants';
import { runCompleteHoraryAnalysis } from '../horaryAnalyzer';
import { getTajikaAspectMeta } from '../tajikaEngine';
import type { HoraryQueryInput } from '../types';

function makeInput(overrides: Partial<HoraryQueryInput> = {}): HoraryQueryInput {
  return {
    questionText: 'Test consultation',
    category: 'general_yes_no',
    queryIndexInSession: 1,
    localDate: '2026-11-12',
    localTime: '14:15:00',
    latitude: 19.076,
    longitude: 72.8777,
    timeZone: 'Asia/Kolkata',
    placeName: 'Mumbai',
    castingMode: 'time_lagna',
    kpNumber: 1,
    arudhaSignIndex: 3, // Cancer
    ayanamsa: 'kp',
    houseSystem: 'placidus',
    nodeMode: 'true',
    swaraNostril: 'left_ida',
    settings: {
      mercuryCombustDeg: 8,
      diseaseHouse: 6,
      tajikaSquareWeightPct: 75,
      directionSystem: 'kp_cardinal',
    },
    ...overrides,
  };
}

describe('Tajika Aspects, Config Toggles & Multi-Mode Casting', () => {
  it('enforces exact Prasna Tantra Tajika aspect weights & square 75/45 toggle', () => {
    expect(getTajikaAspectMeta(5, 75)).toEqual({
      kind: '5/9 Trine',
      polarity: 'Openly Friendly',
      strengthPct: 75,
    });
    expect(getTajikaAspectMeta(9, 75)?.strengthPct).toBe(75);
    expect(getTajikaAspectMeta(3, 75)?.strengthPct).toBe(40);
    expect(getTajikaAspectMeta(11, 75)?.strengthPct).toBe(10);
    expect(getTajikaAspectMeta(4, 75)?.strengthPct).toBe(75);
    expect(getTajikaAspectMeta(4, 45)?.strengthPct).toBe(45);
    expect(getTajikaAspectMeta(7, 75)).toEqual({
      kind: '1/7 Conjunction/Opp',
      polarity: 'Secretly Hostile',
      strengthPct: 100,
    });
    expect(getTajikaAspectMeta(2, 75)).toBeNull();
    expect(getTajikaAspectMeta(6, 75)).toBeNull();
  });

  it('orders Lahiri, KP, and Raman ayanamsas cleanly', () => {
    const lahiri = runCompleteHoraryAnalysis(makeInput({ ayanamsa: 'lahiri' }));
    const kp = runCompleteHoraryAnalysis(makeInput({ ayanamsa: 'kp' }));
    const raman = runCompleteHoraryAnalysis(makeInput({ ayanamsa: 'raman' }));

    expect(lahiri.chart.ayanamsaDeg).toBeGreaterThan(kp.chart.ayanamsaDeg);
    expect(kp.chart.ayanamsaDeg).toBeGreaterThan(raman.chart.ayanamsaDeg);
    expect(lahiri.chart.ayanamsaDeg - kp.chart.ayanamsaDeg).toBeCloseTo(0.103, 2);
  });

  it('switches Ascendant sign reliably in Arudha Override & KP 249 boundary slots', () => {
    const arudha = runCompleteHoraryAnalysis(
      makeInput({ castingMode: 'arudha_override', arudhaSignIndex: 3 })
    );
    expect(arudha.chart.ascendantSignIndex).toBe(3);
    expect(arudha.chart.ascendantSignName).toBe('Cancer');

    const kp249 = runCompleteHoraryAnalysis(
      makeInput({ castingMode: 'kp_horary', kpNumber: 249 })
    );
    expect(kp249.chart.activeKpSlot?.number).toBe(249);
    expect(kp249.chart.ascendantSignName).toBe('Pisces');
    expect(kp249.chart.ascendantSidereal).toBeCloseTo(KP_249_TABLE[248].startDeg, 5);
  });

  it('applies diseaseHouse (6 vs 7) and Left Swara Thursday congruence', () => {
    const med6 = runCompleteHoraryAnalysis(
      makeInput({
        category: 'medical_health',
        localDate: '2026-11-12', // Thursday (post-sunrise 14:15)
        swaraNostril: 'left_ida',
        settings: {
          mercuryCombustDeg: 8,
          diseaseHouse: 6,
          tajikaSquareWeightPct: 75,
          directionSystem: 'kp_cardinal',
        },
      })
    );
    const med7 = runCompleteHoraryAnalysis(
      makeInput({
        category: 'medical_health',
        localDate: '2026-11-12',
        swaraNostril: 'left_ida',
        settings: {
          mercuryCombustDeg: 14,
          diseaseHouse: 7,
          tajikaSquareWeightPct: 45,
          directionSystem: 'classical_corner',
        },
      })
    );

    expect(med6.radicality.swaraAssessment.status).toBe('Auspicious');
    expect(med6.domain.medicalBadha.consultationRoles[1].house).toBe('6th House');
    expect(med7.domain.medicalBadha.consultationRoles[1].house).toBe('7th House');
  });
});
