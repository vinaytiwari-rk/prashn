import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, ShieldCheck, Sparkles, XCircle } from 'lucide-react';
import type { CompleteHoraryAnalysis } from '../astro/horaryAnalyzer';
import { buildSimpleHoraryReport } from '../astro/simpleReport';

export interface SessionSummaryEntry {
  id: string;
  order: number;
  questionText: string;
  categoryLabel: string;
  analysis: CompleteHoraryAnalysis;
}

interface PredictionsPageProps {
  analysis: CompleteHoraryAnalysis;
  sessionSummaries?: SessionSummaryEntry[];
  activeQuestionId?: string;
  onSelectQuestion?: (id: string) => void;
  onBackToBasicDetails?: () => void;
  onBackToCalculations?: () => void;
  onGoToGuide?: () => void;
}

export const PredictionsPage: React.FC<PredictionsPageProps> = ({
  analysis,
  sessionSummaries = [],
  activeQuestionId,
  onSelectQuestion,
  onBackToBasicDetails,
  onBackToCalculations,
  onGoToGuide,
}) => {
  const report = buildSimpleHoraryReport(analysis);
  const { chart, domain } = analysis;

  const badgeClass =
    report.verdictTone === 'good'
      ? 'verdict-strong'
      : report.verdictTone === 'warn'
      ? 'verdict-mod'
      : report.verdictTone === 'mixed'
      ? 'verdict-mixed'
      : 'verdict-no';

  const nichodToneClass = (tone: 'good' | 'warn' | 'bad' | 'info') =>
    tone === 'good' ? 'good' : tone === 'bad' ? 'bad' : tone === 'info' ? 'muted' : 'warn';

  return (
    <div className="tab-stack">
      {(onBackToCalculations || onBackToBasicDetails || onGoToGuide) && (
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {onBackToBasicDetails && (
              <button type="button" className="btn-action" onClick={onBackToBasicDetails}>
                ← 1. Basic Details
              </button>
            )}
            {onBackToCalculations && (
              <button type="button" className="btn-action" onClick={onBackToCalculations}>
                ← 2. Charts
              </button>
            )}
            {onGoToGuide && (
              <button type="button" className="btn-action" onClick={onGoToGuide}>
                ← 3. Guide
              </button>
            )}
          </div>
          <span className="info-badge">{report.chartContextNote}</span>
        </div>
      )}

      {/* Multi-Question Session Summary Comparison (Shown when user has 2+ questions) */}
      {sessionSummaries.length > 1 && (
        <div className="panel">
          <div className="panel-header-row" style={{ marginBottom: 10 }}>
            <div>
              <span className="panel-eyebrow">Multi-Question Consultation Overview</span>
              <h3 className="panel-title">All {sessionSummaries.length} Questions in This Session</h3>
            </div>
          </div>
          <div className="table-scroll">
            <table className="pro-table compact">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Question</th>
                  <th>Chart Basis (House 1)</th>
                  <th>Prediction Verdict</th>
                  <th>Outlook Score</th>
                </tr>
              </thead>
              <tbody>
                {sessionSummaries.map((entry) => {
                  const rep = buildSimpleHoraryReport(entry.analysis);
                  const isCurrent = entry.id === activeQuestionId;
                  return (
                    <tr
                      key={entry.id}
                      className={isCurrent ? 'row-active' : ''}
                      onClick={() => onSelectQuestion?.(entry.id)}
                      style={{ cursor: onSelectQuestion ? 'pointer' : 'default' }}
                    >
                      <td className="mono"><strong>Q{entry.order}</strong></td>
                      <td>
                        <strong>{entry.questionText || entry.categoryLabel}</strong>
                        <div style={{ fontSize: '0.78rem', opacity: 0.72 }}>{entry.categoryLabel}</div>
                      </td>
                      <td>
                        {entry.analysis.chart.rotatedReference?.isRotated
                          ? `${entry.analysis.chart.rotatedReference.planet} (${entry.analysis.chart.ascendantSignName})`
                          : `${entry.analysis.chart.ascendantSignName} (${entry.analysis.chart.panchanga.localDisplay.slice(-8)})`}
                      </td>
                      <td>
                        <span
                          className={`flag-tag ${
                            rep.verdictTone === 'good'
                              ? 'good'
                              : rep.verdictTone === 'bad'
                              ? 'bad'
                              : 'warn'
                          }`}
                        >
                          {rep.verdictHeadline}
                        </span>
                      </td>
                      <td className="mono"><strong>{rep.strengthPct}%</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Answer & Outlook Banner */}
      <div className="verdict-hero-grid">
        <div className={`panel verdict-main-card ${badgeClass}`}>
          <span className="panel-eyebrow">
            {sessionSummaries.length > 1
              ? `Question ${chart.input.queryIndexInSession} of ${sessionSummaries.length} · ${domain.categoryLabel}`
              : `Horary Answer · ${domain.categoryLabel}`}
          </span>
          <div className="verdict-top-row">
            <div>
              <h2 className="verdict-headline">{report.verdictHeadline}</h2>
              <p className="verdict-question">&quot;{chart.input.questionText || domain.categoryLabel}&quot;</p>
            </div>
            <div className="score-ring">
              <div className="score-number">{report.strengthPct}%</div>
              <div className="score-caption">Outlook Strength</div>
            </div>
          </div>
          <div className="score-bar-track">
            <div className="score-bar-fill" style={{ width: `${report.strengthPct}%` }} />
          </div>
          <p className="body-lead" style={{ marginTop: 10, marginBottom: 12 }}>
            {report.summaryParagraph}
          </p>
          <div className="three-pillars-row">
            {report.pillars.map((pil) => (
              <div key={pil.label} className="pillar-chip">
                <span className="pillar-name">{pil.label}</span>
                <strong>{pil.status} ({pil.scorePct}%)</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Timing Window Forecast */}
        <div className="panel timing-card">
          <div className="panel-header-inline">
            <Clock size={18} />
            <h3>When Can Results Manifest?</h3>
          </div>
          <div className="timing-rows">
            <div className="kv-row">
              <span>Expected Speed</span>
              <strong>{report.timingSummary.paceLabel}</strong>
            </div>
            <div className="kv-row">
              <span>General Timeframe</span>
              <strong>{report.timingSummary.scaleLabel}</strong>
            </div>
            {report.timingSummary.projectedTurningPoint && (
              <div className="kv-row">
                <span>Key Turning Point</span>
                <strong>{report.timingSummary.projectedTurningPoint}</strong>
              </div>
            )}
            <div className="kv-row">
              <span>Best Days to Act</span>
              <strong>{report.timingSummary.bestDaysNote}</strong>
            </div>
            <div className="kv-row">
              <span>Active Period</span>
              <strong>{report.timingSummary.runningPeriod}</strong>
            </div>
              <div className="kv-row">
                <span>Question Clarity Check</span>
                <strong>{report.clarityStatus.headline}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Chosen Method Prediction Breakdown */}
        <div className="panel highlight-specialist">
          <div className="panel-header-row" style={{ marginBottom: 10 }}>
            <div>
              <span className="panel-eyebrow">Selected Method · {report.methodSummary.methodLabel}</span>
              <h3 className="panel-title">Prediction Breakdown ({report.methodSummary.methodLabel})</h3>
              <p className="panel-hint" style={{ marginBottom: 0 }}>
                Calculated strictly using your chosen <strong>{report.methodSummary.methodLabel}</strong> method, with Hora and Nostril (Swara) timing factored in.
              </p>
            </div>
            <span className={`flag-tag ${report.verdictTone === 'good' ? 'good' : report.verdictTone === 'bad' ? 'bad' : 'warn'}`}>
              Method Outlook: {report.strengthPct}%
            </span>
          </div>

          <div className="nichod-grid">
            {report.methodSummary.layers.map((layer) => (
              <div key={layer.layerName} className={`nichod-card tone-${layer.tone}`}>
                <div className="nichod-card-head">
                  <strong>{layer.layerName}</strong>
                  <span className={`flag-tag ${nichodToneClass(layer.tone)}`}>
                    {layer.badgeText}
                    {layer.scorePct !== null ? ` (${layer.scorePct}%)` : ''}
                  </span>
                </div>
                <div className="nichod-short">{layer.shortOutcome}</div>
                <p className="nichod-meaning">{layer.plainMeaning}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hora Timing & Active Nostril (Swara) Advice */}
        <div className="two-col-grid">
          <div className="panel">
            <div className="panel-header-row" style={{ marginBottom: 8 }}>
              <div>
                <span className="panel-eyebrow">Hora Lord &amp; Hora Lagna Timing</span>
                <h3 className="panel-title">
                  {report.methodSummary.horaCard.activeHoraLabel} · {report.methodSummary.horaCard.horaLagnaLabel}
                </h3>
              </div>
              <span className={`flag-tag ${nichodToneClass(report.methodSummary.horaCard.tone)}`}>
                {report.methodSummary.horaCard.badgeText} ({report.methodSummary.horaCard.scorePct}%)
              </span>
            </div>
            <p className="body-lead" style={{ marginBottom: 8 }}>
              {report.methodSummary.horaCard.plainMeaning}
            </p>
            <div className="callout-neutral">
              <strong>Best Next Hora Window:</strong> {report.methodSummary.horaCard.nextBestHoraNote}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header-row" style={{ marginBottom: 8 }}>
              <div>
                <span className="panel-eyebrow">Swara Shastra (Active Nostril &amp; Side)</span>
                <h3 className="panel-title">
                  {report.methodSummary.swaraCard.nostrilLabel} · {report.methodSummary.swaraCard.positionLabel}
                </h3>
              </div>
              <span className={`flag-tag ${nichodToneClass(report.methodSummary.swaraCard.tone)}`}>
                {report.methodSummary.swaraCard.badgeText}
              </span>
            </div>
            <p className="body-lead" style={{ marginBottom: 0 }}>
              {report.methodSummary.swaraCard.plainMeaning}
            </p>
          </div>
        </div>

      {/* Question Clarity Notice if Advisory */}
      {!report.clarityStatus.clear && (
        <div className="radicality-banner radical-warn">
          <div className="radicality-left">
            <AlertTriangle size={20} />
            <div>
              <div className="radicality-title">{report.clarityStatus.headline}</div>
              <div className="radicality-sub">{report.clarityStatus.detail}</div>
            </div>
          </div>
        </div>
      )}

      {/* KP Horary Prediction & Sub-Lord Judgment */}
      <div className="panel">
        <div className="panel-header-row" style={{ marginBottom: 10 }}>
          <div>
            <span className="panel-eyebrow">KP Horary Prediction (Cusp {report.kpPrediction.primaryCusp} Sub-Lord)</span>
            <h3 style={{ margin: 0 }}>
              KP Judgment: {report.kpPrediction.verdictLabel} ({report.kpPrediction.scorePct}%)
            </h3>
          </div>
          <span
            className={`flag-tag ${
              report.kpPrediction.scorePct >= 70
                ? 'good'
                : report.kpPrediction.scorePct >= 45
                ? 'warn'
                : 'bad'
            }`}
          >
            Cusp {report.kpPrediction.primaryCusp} CSL: {report.kpPrediction.cuspSubLord}
          </span>
        </div>

        <p className="body-lead" style={{ marginBottom: 12 }}>
          {report.kpPrediction.summaryText}
        </p>

        <div className="data-kv-grid">
          <div>
            <span>Cusp {report.kpPrediction.primaryCusp} Sub-Lord &amp; Star Lord</span>
            <strong>
              {report.kpPrediction.cuspSubLord} in {report.kpPrediction.starLord} Star · {report.kpPrediction.subSubLord} Sub-Sub
            </strong>
          </div>
          <div>
            <span>Supporting vs Adverse KP Houses</span>
            <strong>
              Supports: {report.kpPrediction.matchedFavourable.join(', ') || 'None directly'} · Friction:{' '}
              {report.kpPrediction.matchedUnfavourable.join(', ') || 'None'}
            </strong>
          </div>
          <div>
            <span>KP Motion &amp; Delivery Rule</span>
            <strong>{report.kpPrediction.retroRulePlain}</strong>
          </div>
          <div>
            <span>Active Ruling Planets</span>
            <strong>{report.kpPrediction.cleanRulingPlanets.join(', ') || 'Direct transit awaited'}</strong>
          </div>
        </div>

        {report.kpPrediction.specialNotes.length > 0 && (
          <ul className="plain-bullet-list" style={{ marginTop: 10 }}>
            {report.kpPrediction.specialNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Specific Choice / Exam Paper / Career / Gender Comparison (If Applicable) */}
      {report.choiceSection && (
        <div className="panel highlight-specialist">
          <span className="panel-eyebrow">Direct Comparison</span>
          <h3 style={{ marginBottom: 4 }}>{report.choiceSection.title}</h3>
          <p className="panel-hint" style={{ marginBottom: 12 }}>
            {report.choiceSection.subtitle}
          </p>
          <div className="citations-grid">
            {report.choiceSection.items.map((item) => (
              <div key={item.label} className="panel citation-card">
                <div className="citation-header">
                  <span
                    className={`flag-tag ${
                      item.tone === 'good' ? 'good' : item.tone === 'warn' ? 'warn' : 'muted'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
                <h4 className="citation-title" style={{ marginTop: 6, marginBottom: 4 }}>
                  <span>{item.label}</span>
                </h4>
                <p className="citation-body">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specific Calendar Date Windows (Conception Dates, Exam/Action Dates, Timing Queries) */}
      {report.dateWindows.length > 0 && (
        <div className="panel">
          <span className="panel-eyebrow">Upcoming Calendar Dates</span>
          <h3 style={{ marginBottom: 6 }}>Best Upcoming Date Windows</h3>
          <p className="panel-hint" style={{ marginBottom: 10 }}>
            Calculated from upcoming lunar phases, stars, and supportive house movements over the next 8 weeks.
          </p>
          <div className="table-scroll">
            <table className="pro-table compact">
              <thead>
                <tr>
                  <th>Date Window</th>
                  <th>Quality</th>
                  <th>Days &amp; Lunar Star</th>
                  <th>Why This Window Helps</th>
                </tr>
              </thead>
              <tbody>
                {report.dateWindows.map((dw, idx) => (
                  <tr key={`${dw.dateRangeLabel}-${idx}`} className={idx === 0 ? 'row-active' : ''}>
                    <td className="mono"><strong>{dw.dateRangeLabel}</strong></td>
                    <td>
                      <span className={`flag-tag ${dw.qualityLabel === 'Best Window' ? 'good' : 'warn'}`}>
                        {dw.qualityLabel}
                      </span>
                    </td>
                    <td>{dw.moonStarSummary}</td>
                    <td>{dw.reasonPlain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clear Everyday Answer Cards */}
      <div className="panel">
        <span className="panel-eyebrow">Plain-English Answer Breakdown</span>
        <h3 style={{ marginBottom: 12 }}>Clear Reading for Your Question</h3>
        <div className="citations-grid">
          {report.deepReading.map((sec) => (
            <div key={sec.title} className="panel citation-card">
              <h4 className="citation-title" style={{ marginBottom: 6 }}>
                <span>{sec.title}</span>
              </h4>
              <p className="citation-body" style={{ lineHeight: 1.55 }}>{sec.paragraph}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Supporting Factors vs Obstacles + Past -> Present -> Future Journey */}
      <div className="two-col-grid">
        <div className="panel">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <CheckCircle2 size={18} color="#16a34a" /> What Is Working in Your Favour
          </h3>
          <ul className="plain-bullet-list">
            {report.supportingPoints.map((pt, idx) => (
              <li key={idx}>{pt}</li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={18} color="#d97706" /> Challenges &amp; Obstacles to Watch
          </h3>
          <ul className="plain-bullet-list">
            {report.cautionPoints.map((pt, idx) => (
              <li key={idx}>{pt}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Past -> Present -> Outcome Timeline */}
      <div className="panel">
        <h3>How This Situation Develops Over Time</h3>
        <div className="citations-grid" style={{ marginTop: 10 }}>
          {report.journeyFlow.map((step) => (
            <div key={step.phase} className="panel citation-card">
              <span className="system-tag" style={{ marginBottom: 6, display: 'inline-block' }}>
                {step.phase}
              </span>
              <p className="citation-body">{step.summary}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Specific Answer Findings */}
      <div className="panel">
        <h3>Detailed Question Insights &amp; Specific Signs</h3>
        <div className="data-kv-list">
          {report.findings.map((f) => (
            <div key={f.label} className="kv-line">
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {f.tone === 'good' ? (
                  <CheckCircle2 size={15} color="#16a34a" />
                ) : f.tone === 'warn' || f.tone === 'bad' ? (
                  <AlertTriangle size={15} color={f.tone === 'bad' ? '#dc2626' : '#d97706'} />
                ) : (
                  <Sparkles size={15} color="#2563eb" />
                )}
                {f.label}
              </span>
              <strong>{f.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Practical Do's & Don'ts */}
      <div className="two-col-grid">
        <div className="panel">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <ShieldCheck size={18} color="#16a34a" /> Recommended Next Steps (Do)
          </h3>
          <ul className="plain-bullet-list">
            {report.actionPlan.dos.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <XCircle size={18} color="#dc2626" /> What to Avoid Right Now (Don&apos;t)
          </h3>
          <ul className="plain-bullet-list">
            {report.actionPlan.donts.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Upcoming Timing Windows */}
      <div className="panel">
        <h3>Upcoming Supportive Time Windows</h3>
        <p className="panel-hint">
          Plan important calls, applications, meetings, or decisions inside the windows marked Strong Support or Moderate Support.
        </p>
        <div className="table-scroll">
          <table className="pro-table compact">
            <thead>
              <tr>
                <th>Time Cycle</th>
                <th>Starts</th>
                <th>Ends</th>
                <th>Support Level</th>
              </tr>
            </thead>
            <tbody>
              {report.timingSummary.upcomingWindows.map((w, idx) => (
                <tr key={`${w.periodLabel}-${idx}`} className={idx === 0 ? 'row-active' : ''}>
                  <td className="mono"><strong>{w.periodLabel}</strong></td>
                  <td className="mono">{w.startLocal}</td>
                  <td className="mono">{w.endLocal}</td>
                  <td>
                    <span
                      className={`flag-tag ${
                        w.supportLevel === 'Strong Support'
                          ? 'good'
                          : w.supportLevel === 'Moderate Support'
                          ? 'warn'
                          : 'muted'
                      }`}
                    >
                      {w.supportLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remedies Section (If Required) */}
      <div className="panel highlight-specialist">
        <div className="panel-header-row">
          <div>
            <span className="panel-eyebrow">Practical Guidance</span>
            <h3 className="panel-title">{report.remediesSection.headline}</h3>
          </div>
          <span className={`flag-tag ${report.remediesSection.required ? 'warn' : 'good'}`}>
            {report.remediesSection.required ? 'Remedies Recommended' : 'Optional / Strong Chart'}
          </span>
        </div>
        <p className="body-lead" style={{ marginBottom: 14 }}>
          {report.remediesSection.intro}
        </p>

        {report.remediesSection.items.length > 0 && (
          <div className="citations-grid">
            {report.remediesSection.items.map((item, idx) => (
              <div key={`${item.title}-${idx}`} className="panel citation-card">
                <div className="citation-header">
                  <span className="system-tag">{item.category}</span>
                  {item.planet && <span className="source-ref">{item.planet}</span>}
                </div>
                <h4 className="citation-title">
                  <span>{item.title}</span>
                </h4>
                <p className="citation-body">{item.instruction}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
