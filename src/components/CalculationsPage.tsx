import React from 'react';
import { Compass, Sparkles } from 'lucide-react';
import type { CompleteHoraryAnalysis } from '../astro/horaryAnalyzer';
import { CASTING_METHOD_OPTIONS, getTopicMeta } from '../astro/questionCatalog';
import { buildSimpleHoraryReport } from '../astro/simpleReport';
import { formatOffsetString } from '../astro/time';
import { evaluatePlanetMeaningTone } from './MeaningsGuidePage';
import { VedicCharts } from './VedicCharts';

interface CalculationsPageProps {
  analysis: CompleteHoraryAnalysis;
  totalQuestions?: number;
  onBackToBasicDetails?: () => void;
  onGoToGuide?: () => void;
  onGoToPredictions?: () => void;
}

export const CalculationsPage: React.FC<CalculationsPageProps> = ({
  analysis,
  totalQuestions = 1,
  onBackToBasicDetails,
  onGoToGuide,
  onGoToPredictions,
}) => {
  const { chart, kp, timing, classical } = analysis;
  const lms = chart.panchanga.lunarMicroStates;
  const topicMeta = getTopicMeta(chart.input.category);
  const kpEval = kp.domainEvaluation;
  const report = buildSimpleHoraryReport(analysis);
  const methodMeta = CASTING_METHOD_OPTIONS.find((m) => m.id === chart.input.castingMode);

  const toneBadgeClass = (tone: 'good' | 'warn' | 'bad' | 'info') =>
    tone === 'good' ? 'good' : tone === 'bad' ? 'bad' : tone === 'info' ? 'muted' : 'warn';
  const toneShortLabel = (tone: 'good' | 'warn' | 'bad') =>
    tone === 'good' ? 'Favourable' : tone === 'bad' ? 'Unfavourable' : 'Mixed / Effort';

  return (
    <div className="tab-stack">
      {(onGoToPredictions || onGoToGuide || onBackToBasicDetails) && (
        <div
          className="panel no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {onBackToBasicDetails && (
              <button type="button" className="btn-action" onClick={onBackToBasicDetails}>
                ← 1. Basic Details
              </button>
            )}
            <div>
              <strong>
                {totalQuestions > 1
                  ? `Question ${chart.input.queryIndexInSession} of ${totalQuestions} — Charts & Calculations`
                  : 'Prashna Rasi & KP Horary Charts Ready'}
              </strong>
              <span style={{ marginLeft: 10, opacity: 0.8, fontSize: '0.86rem' }}>
                {chart.rotatedReference?.isRotated
                  ? chart.rotatedReference.reason
                  : chart.specialMethodInfo
                  ? chart.specialMethodInfo.summary
                  : chart.prashna108Info
                  ? `Number ${chart.prashna108Info.number} → ${chart.prashna108Info.lagnaSignName} Lagna & ${chart.prashna108Info.navamsaSignName} Navamsa`
                  : chart.activeKpSlot
                  ? `KP Horary #${chart.activeKpSlot.number} (${chart.activeKpSlot.signName} · Sub-Lord ${chart.activeKpSlot.subLord})`
                  : 'Both Rasi (D-1) and KP Bhava charts highlight key houses in warm gold.'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {onGoToGuide && (
              <button type="button" className="btn-action" onClick={onGoToGuide}>
                3. Rashi &amp; Planet Guide
              </button>
            )}
            {onGoToPredictions && (
              <button
                type="button"
                className="seg-btn active"
                onClick={onGoToPredictions}
                style={{ padding: '8px 14px', borderRadius: 8 }}
              >
                4. Read Predictions &amp; Remedies →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Side-by-Side North Indian Rasi Chart (D-1) & KP Bhava Chart */}
      <VedicCharts analysis={analysis} />

      {/* Essential Chart & KP Summary */}
      <div className="panel">
        <div className="panel-header-inline">
          <Compass size={17} />
          <h3>Essential Chart &amp; KP Horary Summary</h3>
        </div>
        <div className="data-kv-grid">
          <div>
            <span>Question Time &amp; Place</span>
            <strong>
              {chart.panchanga.localDisplay} (UTC{formatOffsetString(chart.offsetMinutes)})
              <br />
              {chart.input.placeName}
            </strong>
          </div>
          <div>
            <span>Active House 1 (Lagna)</span>
            <strong>
              {chart.ascendantDms}
              {chart.rotatedReference?.isRotated
                ? chart.rotatedReference.planet
                  ? ` (Q#${chart.input.queryIndexInSession} via ${chart.rotatedReference.planet})`
                  : ` (Rotated Reference)`
                : chart.prashna108Info
                ? ` (Num ${chart.prashna108Info.number} → ${chart.prashna108Info.navamsaSignName} D-9)`
                : chart.input.castingMode === 'kp_horary'
                ? ` (KP #${chart.input.kpNumber})`
                : ' (Question Time Lagna)'}
            </strong>
          </div>
          <div>
            <span>Primary KP Query Cusp &amp; Sub-Lord</span>
            <strong>
              Cusp {kpEval.primaryCusp} → Sub-Lord {kpEval.cuspSubLord} (Star: {kpEval.starLordOfCsl})
            </strong>
          </div>
          <div>
            <span>Clean KP Ruling Planets</span>
            <strong>{kp.cleanRulingPlanets.join(', ') || 'Direct trigger awaited'}</strong>
          </div>
          <div>
            <span>Moon Sign &amp; Nakshatra</span>
            <strong>
              {chart.planets.find((p) => p.id === 'Moon')?.signName ?? '-'} ·{' '}
              {chart.panchanga.moonNakshatraName} (Pada {chart.panchanga.moonNakshatraPada})
            </strong>
          </div>
          <div>
            <span>Running Dasha Period</span>
            <strong>
              {timing.currentVimshottariDasha.mahadasha} →{' '}
              {timing.currentVimshottariDasha.antardasha} →{' '}
              {timing.currentVimshottariDasha.pratyantardasha}
            </strong>
          </div>
          <div>
            <span>Day Ruler, Active Hora &amp; Hora Lagna</span>
            <strong>
              {chart.panchanga.vedicWeekdayName} ({chart.panchanga.dayLord}) ·{' '}
              {report.methodSummary.horaCard.activeHoraLabel} · {chart.horaLagnaSignName ?? report.methodSummary.horaCard.horaLagnaLabel}{' '}
              <span className={`flag-tag ${toneBadgeClass(report.methodSummary.horaCard.tone)}`} style={{ marginLeft: 6 }}>
                {report.methodSummary.horaCard.badgeText}
              </span>
            </strong>
          </div>
          <div>
            <span>Calculation Method &amp; Nostril (Swara)</span>
            <strong>
              {methodMeta?.shortTag ?? chart.input.castingMode} · {report.methodSummary.swaraCard.nostrilLabel}{' '}
              <span className={`flag-tag ${toneBadgeClass(report.methodSummary.swaraCard.tone)}`} style={{ marginLeft: 6 }}>
                {report.methodSummary.swaraCard.badgeText}
              </span>
            </strong>
          </div>
          <div>
            <span>Rising Sign Traits &amp; Strength</span>
            <strong>
              {classical.lagnaTraits.udayaType} · {classical.lagnaTraits.genderSign} · {classical.degreeOfSuccess.pct}%
              <span
                className={`flag-tag ${
                  classical.degreeOfSuccess.pct >= 70 ? 'good' : classical.degreeOfSuccess.pct >= 45 ? 'warn' : 'bad'
                }`}
                style={{ marginLeft: 6 }}
              >
                {classical.degreeOfSuccess.pct >= 70
                  ? 'Favourable'
                  : classical.degreeOfSuccess.pct >= 45
                  ? 'Mixed'
                  : 'Unfavourable'}
              </span>
            </strong>
          </div>
          {chart.input.querentName?.trim() && (
            <div>
              <span>Querent Name &amp; Focus Houses</span>
              <strong>
                {chart.input.querentName.trim()} · {topicMeta.focusHousesPlain}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Unified Planetary Positions & KP Lords Table */}
      <div className="panel">
        <div className="panel-header-row" style={{ marginBottom: 8 }}>
          <div>
            <h3>Planetary Positions, KP Bhava Houses &amp; Sub-Lords</h3>
            <p className="panel-hint" style={{ marginBottom: 0 }}>
              Combined zodiac positions, Rasi vs KP cuspal houses, Sign / Star / Sub lords, KP house significations, and colour-coded chart meanings.
            </p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Planet</th>
                <th>Sign &amp; Degree</th>
                <th>Rasi / KP House</th>
                <th>Star / Sub / Sub-Sub Lord</th>
                <th>Signifies (KP Houses)</th>
                <th>Strength &amp; Motion</th>
                <th>Plain Chart Meaning</th>
              </tr>
            </thead>
            <tbody>
              {chart.planets.map((p) => {
                const kpRow = kp.planets.find((k) => k.planet === p.id);
                const planetMeaning = evaluatePlanetMeaningTone(p, topicMeta.focusHouses);
                return (
                  <tr key={p.id}>
                    <td><strong>{p.id}</strong></td>
                    <td className="mono">{p.signName} {p.dmsInSign}</td>
                    <td className="mono">
                      <strong>Rasi H{p.houseWholeSign}</strong> · KP H{kpRow?.kpHouse ?? p.houseWholeSign}
                      {topicMeta.focusHouses.includes(p.houseWholeSign) ? ' ★' : ''}
                    </td>
                    <td className="mono">{p.starLord} / <strong>{p.subLord}</strong> / {p.subSubLord}</td>
                    <td className="mono">{kpRow?.signifiesHouses.join(', ') || '—'}</td>
                    <td>
                      <span className={`pill pill-${p.dignity.toLowerCase().replace(/\s+/g, '-')}`}>
                        {p.dignity}
                      </span>{' '}
                      {p.isRetrograde && p.id !== 'Rahu' && p.id !== 'Ketu' && (
                        <span className="flag-tag warn">Retrograde</span>
                      )}
                      {p.isCombust && (
                        <span className="flag-tag bad">Combust ({p.combustOrbDeg?.toFixed(1)}°)</span>
                      )}
                      {p.isVargottama && <span className="flag-tag good">Vargottama</span>}
                    </td>
                    <td>
                      <span className={`flag-tag ${planetMeaning.tone}`} style={{ marginRight: 6 }}>
                        {toneShortLabel(planetMeaning.tone)}
                      </span>
                      <span style={{ fontSize: '0.82rem', opacity: 0.9 }}>{planetMeaning.reason}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* KP Horary House Cusps (1-12) & KP Significators */}
      <div className="two-col-grid">
        <div className="panel">
          <div className="panel-header-inline">
            <Sparkles size={17} />
            <h3>KP 12 House Cusps &amp; Sub-Lords</h3>
          </div>
          <div className="table-scroll">
            <table className="pro-table compact">
              <thead>
                <tr>
                  <th>Cusp</th>
                  <th>Sign &amp; Degree</th>
                  <th>Sign / Star / Sub</th>
                  <th>All Significators (A–D)</th>
                </tr>
              </thead>
              <tbody>
                {kp.cusps.map((c) => {
                  const sigRow = kp.houseSignificators.find((s) => s.house === c.house);
                  const isFocus = c.house === kpEval.primaryCusp;
                  return (
                    <tr key={c.house} className={isFocus ? 'row-active' : ''}>
                      <td className="mono">
                        <strong>C{c.house}</strong>
                        {isFocus ? ' ★' : ''}
                      </td>
                      <td className="mono">{c.signName} {c.dmsInSign}</td>
                      <td className="mono">
                        {c.signLord} / {c.starLord} / <strong>{c.subLord}</strong>
                      </td>
                      <td style={{ whiteSpace: 'normal', fontSize: '0.78rem' }}>
                        {sigRow?.all.join(', ') || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header-inline">
            <Sparkles size={17} />
            <h3>KP Ruling Planets &amp; Query Cusp Check</h3>
          </div>
          <div className="sub-badges-row" style={{ marginBottom: 10 }}>
            <span className="info-badge">
              <strong>KP Ayanamsa:</strong> {kp.kpAyanamsaDms}
            </span>
            <span className="info-badge">
              <strong>KP Verdict:</strong> {kpEval.verdict} ({kpEval.scorePct}%)
            </span>
            <span className="info-badge">
              <strong>Motion Rule:</strong> {kpEval.retroMatrixCase}
            </span>
          </div>

          <div className="table-scroll" style={{ marginBottom: 10 }}>
            <table className="pro-table compact">
              <thead>
                <tr>
                  <th>Ruling Factor</th>
                  <th>Planet</th>
                  <th>Star / Sub</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {kp.rulingPlanets.map((rp) => (
                  <tr key={rp.role}>
                    <td>{rp.role}</td>
                    <td><strong>{rp.planet}</strong></td>
                    <td className="mono">{rp.starLordOfPlanet} / {rp.subLordOfPlanet}</td>
                    <td>
                      {rp.flaggedByRetrograde ? (
                        <span className="flag-tag warn">Retrograde</span>
                      ) : (
                        <span className="flag-tag good">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="body-lead" style={{ margin: 0, fontSize: '0.86rem' }}>
            {kpEval.explanation}
          </p>
        </div>
      </div>

      {/* Collapsible Secondary Astronomical Drawer */}
      <details className="panel">
        <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.92rem' }}>
          Show Secondary Astronomical Tables (24-Hour Hora Schedule, Sphutas &amp; Moon Micro-States)
        </summary>
        <div className="tab-stack" style={{ marginTop: 14 }}>
          <div className="sub-badges-row">
            <span className="info-badge">
              <strong>Ayanamsa ({chart.input.ayanamsa.toUpperCase()}):</strong>{' '}
              {chart.ayanamsaDeg.toFixed(4)}°
            </span>
            <span className="info-badge">
              <strong>Tithi &amp; Daylight:</strong> {chart.panchanga.paksha} {chart.panchanga.tithiName} ({chart.panchanga.sunriseLocal.slice(-8)}–{chart.panchanga.sunsetLocal.slice(-8)})
            </span>
            <span className="info-badge">
              <strong>Moon Micro-States:</strong> Kriya {lms.chandraKriyaIndex}/60 · Vela{' '}
              {lms.chandraVelaIndex}/36 · Avastha {lms.chandraAvasthaIndex}/12
            </span>
          </div>

          <div className="two-col-grid">
            <div className="table-scroll">
              <table className="pro-table compact">
                <thead>
                  <tr>
                    <th>Special Point</th>
                    <th>Sign &amp; Degree</th>
                    <th>House</th>
                  </tr>
                </thead>
                <tbody>
                  {chart.sphutas.map((s) => (
                    <tr key={s.name}>
                      <td>{s.name}</td>
                      <td className="mono">{s.signName} {s.dmsInSign}</td>
                      <td className="mono">H{s.houseWholeSign}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-scroll kp-249-scroll">
              <table className="pro-table compact">
                <thead>
                  <tr>
                    <th>Hora #</th>
                    <th>Period</th>
                    <th>Ruler</th>
                    <th>Starts</th>
                    <th>Ends</th>
                    <th>Chart Suitability</th>
                  </tr>
                </thead>
                <tbody>
                  {chart.panchanga.horaSchedule.map((h) => {
                    const rulerPos = chart.planets.find((p) => p.id === h.lord);
                    const rulerMeaning = rulerPos
                      ? evaluatePlanetMeaningTone(rulerPos, topicMeta.focusHouses)
                      : { tone: 'warn' as const, reason: 'Neutral' };
                    return (
                      <tr key={h.horaNumber} className={h.isActive ? 'row-active' : ''}>
                        <td className="mono"><strong>#{h.horaNumber}</strong>{h.isActive ? ' (Now)' : ''}</td>
                        <td>{h.period}</td>
                        <td><strong>{h.lord}</strong></td>
                        <td className="mono">{h.startLocal.slice(-8)}</td>
                        <td className="mono">{h.endLocal.slice(-8)}</td>
                        <td>
                          <span className={`flag-tag ${rulerMeaning.tone}`}>
                            {toneShortLabel(rulerMeaning.tone)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};
