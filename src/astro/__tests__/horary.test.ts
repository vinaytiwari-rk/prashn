import { describe, expect, it } from 'vitest';
import { KP_249_TABLE, SIGNS } from '../constants';
import { runCompleteHoraryAnalysis } from '../horaryAnalyzer';
import { normalizeDeg } from '../time';
import type { HoraryQueryInput } from '../types';

function makeBaseInput(overrides: Partial<HoraryQueryInput> = {}): HoraryQueryInput {
  return {
    questionText: 'Will this business venture succeed?',
    category: 'general_yes_no',
    queryIndexInSession: 1,
    localDate: '2026-11-12',
    localTime: '10:30:00',
    latitude: 28.6139,
    longitude: 77.209,
    timeZone: 'Asia/Kolkata',
    placeName: 'New Delhi, India',
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
    },
    ...overrides,
  };
}

describe('KP 249 Sub-Lord Table & Astronomical Invariants', () => {
  it('generates exactly 249 Sub-Lord slots covering 0° to 360° continuously', () => {
    expect(KP_249_TABLE.length).toBe(249);
    expect(KP_249_TABLE[0].number).toBe(1);
    expect(KP_249_TABLE[0].startDeg).toBeCloseTo(0, 6);
    expect(KP_249_TABLE[248].number).toBe(249);
    expect(KP_249_TABLE[248].endDeg).toBeCloseTo(360, 6);

    for (let i = 1; i < KP_249_TABLE.length; i++) {
      expect(KP_249_TABLE[i].startDeg).toBeCloseTo(KP_249_TABLE[i - 1].endDeg, 7);
      expect(KP_249_TABLE[i].spanDeg).toBeGreaterThan(0);
    }

    // Cross-verify Aryan Astrology article example: KP Horary #94 -> Leo
    const slot94 = KP_249_TABLE[93];
    expect(slot94.number).toBe(94);
    expect(slot94.signName).toBe('Leo');
  });

  it('solves KP Horary #94 Ascendant Cusp & Placidus Cusps accurately without NaNs', () => {
    const res = runCompleteHoraryAnalysis(
      makeBaseInput({ castingMode: 'kp_horary', kpNumber: 94, placeName: 'Zahirabad' })
    );
    expect(res.chart.activeKpSlot?.number).toBe(94);
    expect(res.chart.ascendantSignName).toBe('Leo');
    expect(res.chart.cusps[0].house).toBe(1);
    expect(res.chart.cusps[0].signName).toBe('Leo');

    // Check monotonic advancement around the 360° circle
    for (let i = 0; i < 12; i++) {
      const span = normalizeDeg(res.chart.cusps[(i + 1) % 12].start - res.chart.cusps[i].start);
      expect(span).toBeGreaterThan(10);
      expect(span).toBeLessThan(70);
    }
  });

  it('computes Placidus cusps cleanly across Northern & Southern latitudes', () => {
    for (const [place, lat, lon, tz] of [
      ['London', 51.5074, -0.1278, 'Europe/London'],
      ['Sydney', -33.8688, 151.2093, 'Australia/Sydney'],
      ['Quito', -0.1807, -78.4678, 'America/Guayaquil'],
    ] as const) {
      const res = runCompleteHoraryAnalysis(
        makeBaseInput({ placeName: place, latitude: lat, longitude: lon, timeZone: tz })
      );
      expect(Number.isFinite(res.chart.ascendantSidereal)).toBe(true);
      expect(res.chart.cusps.length).toBe(12);
      for (const c of res.chart.cusps) {
        expect(Number.isFinite(c.start)).toBe(true);
      }
    }
  });
});

describe('Classical, Kerala & Time-Dosha Formulas', () => {
  it('verifies Kerala Tambula, Ashtamangala mod 8 (0->8), Pranakshara & Sphutas', () => {
    const res = runCompleteHoraryAnalysis(
      makeBaseInput({
        ashtamangalaPiles: [32, 37, 39], // 32%8->8 (Rahu), 37%8=5 (Venus), 39%8=7 (Moon)
        tambulaCount: 5, // ((2*5*5)+1)%7 = 51%7 = 2 -> Moon
        pranaksharaNumber: 9, // (9*5)%8 = 45%8 = 5 (Varuna), 9%3 -> 3 (Remedies)
      })
    );

    expect(res.kerala.ashtamangala.remaindersMod8).toEqual([8, 5, 7]);
    expect(res.kerala.ashtamangala.digits.map((d) => d.planet)).toEqual([
      'Rahu',
      'Venus',
      'Moon',
    ]);
    expect(res.kerala.ashtamangala.oddCount).toBe(2);

    expect(res.kerala.tambula.formulaValue).toBe(2);
    expect(res.kerala.tambula.planet).toBe('Moon');

    expect(res.kerala.pranakshara.dikpalaIndex).toBe(5);
    expect(res.kerala.pranakshara.prognosisMod3).toBe('Recover with Remedies (3)');

    // Sphutas arithmetic identity check: Thrisphuta = Lagna + Moon + Gulika (mod 360)
    const moonLon = res.chart.planets.find((p) => p.id === 'Moon')!.longitude;
    const expectedThri = normalizeDeg(
      res.chart.ascendantSidereal + moonLon + res.chart.gulikaLon
    );
    const thri = res.chart.sphutas.find((s) => s.name === 'Thrisphuta')!;
    expect(thri.longitude).toBeCloseTo(expectedThri, 5);
  });

  it('detects real astronomical solar eclipse window (±3 days) & Vedic weekday before sunrise', () => {
    // April 8, 2024 Total Solar Eclipse (Mexico) -> within 1 day check
    const eclipseRes = runCompleteHoraryAnalysis(
      makeBaseInput({
        localDate: '2024-04-08',
        localTime: '12:15:00',
        latitude: 23.2494,
        longitude: -106.4111,
        timeZone: 'America/Mazatlan',
        placeName: 'Mazatlan',
      })
    );
    expect(eclipseRes.chart.panchanga.solarEclipseDaysDiff).not.toBeNull();
    expect(
      eclipseRes.radicality.timeDoshas.find((d) => d.id === 'ECLIPSE_3D')?.triggered
    ).toBe(true);

    // 02:30 AM Thursday civil time is still Wednesday (Mercury) in Vedic sunrise-to-sunrise calendar
    const preDawnRes = runCompleteHoraryAnalysis(
      makeBaseInput({
        localDate: '2026-11-12', // Thursday
        localTime: '02:30:00',
      })
    );
    expect(preDawnRes.chart.panchanga.vedicWeekdayName).toBe('Wednesday');
    expect(preDawnRes.chart.panchanga.dayLord).toBe('Mercury');
  });

  it('populates Cora Theft, Medical Badha, Mook Dhatu/Moola/Jeeva & Multi-System Verdict', () => {
    const res = runCompleteHoraryAnalysis(
      makeBaseInput({
        category: 'lost_stolen',
        questionText: 'Where is the stolen gold ring?',
      })
    );
    expect(res.domain.coraTheft.roles.length).toBe(5);
    expect(res.domain.medicalBadha.consultationRoles.length).toBe(4);
    expect(SIGNS[res.chart.ascendantSignIndex].name).toBe(res.chart.ascendantSignName);
    expect(res.domain.unifiedScorePct).toBeGreaterThanOrEqual(5);
    expect(res.domain.unifiedScorePct).toBeLessThanOrEqual(98);
    expect(res.kp.rulingPlanets.length).toBe(7);
  });
});
