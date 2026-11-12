import React from 'react';
import { Compass, Plus, Sparkles, User } from 'lucide-react';
import { KP_249_TABLE, SIGNS } from '../astro/constants';
import type { CompleteHoraryAnalysis } from '../astro/horaryAnalyzer';
import {
  ASKING_ABOUT_OPTIONS,
  CASTING_METHOD_OPTIONS,
  QUESTION_TOPIC_CATALOG,
  SWARA_OPTIONS,
  SWARA_POSITION_OPTIONS,
  detectAskingAboutKey,
  detectQuestionCategory,
  getTopicMeta,
} from '../astro/questionCatalog';
import type {
  AskingAboutHouse,
  ChartCastingMode,
  QuestionCategory,
  SwaraNostril,
  SwaraPosition,
} from '../astro/types';
import type { CityResult } from '../data/citySearch';

export interface SessionQuestionItemBasic {
  id: string;
  questionText: string;
  category: QuestionCategory;
  askingAboutKey: string;
  askingAboutHouse: AskingAboutHouse;
  localDate: string;
  localTime: string;
  castingMode: ChartCastingMode;
  prashna108Number: number;
  kpNumber: number;
  arudhaSignIndex: number;
  ashtamangalaPiles: [number, number, number];
  pranaksharaGroup: 'A' | 'Ka' | 'Cha' | 'Ta' | 'Tha' | 'Pa' | 'Ya_Sa';
  swaraNostril: SwaraNostril;
  swaraPosition: SwaraPosition;
}

interface BasicDetailsPageProps {
  querentName: string;
  onChangeQuerentName: (name: string) => void;
  querentAge?: number;
  onChangeQuerentAge: (age?: number) => void;
  placeName: string;
  timeZone: string;
  cityRef: React.RefObject<HTMLDivElement | null>;
  cityQuery: string;
  cityDropdownOpen: boolean;
  cityLoadingOnline: boolean;
  cityResults: CityResult[];
  onFocusCity: () => void;
  onChangeCityQuery: (q: string) => void;
  onPickCity: (city: CityResult) => void;
  multiQuestionMode: 'rotate_chart' | 'independent';
  onChangeMultiQuestionMode: (m: 'rotate_chart' | 'independent') => void;
  questions: SessionQuestionItemBasic[];
  activeQuestion: SessionQuestionItemBasic;
  sessionSummaries: {
    id: string;
    order: number;
    questionText: string;
    categoryLabel: string;
    analysis: CompleteHoraryAnalysis;
  }[];
  onSelectQuestion: (id: string) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (id: string) => void;
  onUpdateActiveQuestion: (patch: Partial<SessionQuestionItemBasic>) => void;
  analysis: CompleteHoraryAnalysis;
  onGoToCalculations: () => void;
  onGoToGuide: () => void;
  onGoToPredictions: () => void;
}

export const BasicDetailsPage: React.FC<BasicDetailsPageProps> = ({
  querentName,
  onChangeQuerentName,
  querentAge,
  onChangeQuerentAge,
  placeName,
  cityRef,
  cityQuery,
  cityDropdownOpen,
  cityLoadingOnline,
  cityResults,
  onFocusCity,
  onChangeCityQuery,
  onPickCity,
  multiQuestionMode,
  onChangeMultiQuestionMode,
  questions,
  activeQuestion,
  sessionSummaries,
  onSelectQuestion,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateActiveQuestion,
  analysis,
  onGoToCalculations,
  onGoToGuide,
  onGoToPredictions,
}) => {
  const activeEntry =
    sessionSummaries.find((e) => e.id === activeQuestion.id) ?? sessionSummaries[0];
  const effectiveTimeSource =
    multiQuestionMode === 'rotate_chart' ? questions[0] : activeQuestion;
  const kpPreviewSlot =
    KP_249_TABLE[Math.max(1, Math.min(249, effectiveTimeSource.kpNumber || 1)) - 1];
  const activeTopicMeta = getTopicMeta(activeQuestion.category);
  const activePersonOpt =
    ASKING_ABOUT_OPTIONS.find((opt) => opt.key === activeQuestion.askingAboutKey) ??
    ASKING_ABOUT_OPTIONS[0];
  const activeMethodMeta =
    CASTING_METHOD_OPTIONS.find((m) => m.id === effectiveTimeSource.castingMode) ??
    CASTING_METHOD_OPTIONS[0];

  const n108 = Math.max(1, Math.min(108, effectiveTimeSource.prashna108Number || 78));
  const n108SignsElapsed = Math.floor((n108 - 1) / 9) % 12;
  const n108NavNum = ((n108 - 1) % 9) + 1;
  const n108LagnaSign = SIGNS[n108SignsElapsed];
  const n108NavSign = SIGNS[n108NavNum - 1];

  const { chart, domain } = analysis;
  const isTimeControlledByQ1 =
    multiQuestionMode === 'rotate_chart' && activeQuestion.id !== questions[0]?.id;

  const handleTopicPick = (catId: QuestionCategory) => {
    const meta = getTopicMeta(catId);
    const currentMeta = getTopicMeta(activeQuestion.category);
    const wasDefaultPreset =
      !activeQuestion.questionText.trim() ||
      currentMeta.presets.includes(activeQuestion.questionText);
    onUpdateActiveQuestion({
      category: catId,
      questionText: wasDefaultPreset ? meta.presets[0] : activeQuestion.questionText,
    });
  };

  const handleQuestionTextChange = (text: string) => {
    const detectedCat = detectQuestionCategory(text);
    const detectedKey = detectAskingAboutKey(text);
    const detectedPerson = ASKING_ABOUT_OPTIONS.find((o) => o.key === detectedKey);
    const patch: Partial<SessionQuestionItemBasic> = { questionText: text };
    if (detectedCat) patch.category = detectedCat;
    if (detectedPerson && detectedKey !== 'self') {
      patch.askingAboutKey = detectedPerson.key;
      patch.askingAboutHouse = detectedPerson.house;
    }
    onUpdateActiveQuestion(patch);
  };

  const handlePersonChange = (key: string) => {
    const opt = ASKING_ABOUT_OPTIONS.find((o) => o.key === key) ?? ASKING_ABOUT_OPTIONS[0];
    onUpdateActiveQuestion({
      askingAboutKey: opt.key,
      askingAboutHouse: opt.house,
    });
  };

  const horaBadgeClass =
    domain.horaAnalysis.tone === 'good'
      ? 'flag-tag good'
      : domain.horaAnalysis.tone === 'bad'
      ? 'flag-tag bad'
      : 'flag-tag warn';
  const swaraBadgeClass =
    domain.swaraAnalysis.tone === 'good'
      ? 'flag-tag good'
      : domain.swaraAnalysis.tone === 'bad'
      ? 'flag-tag bad'
      : domain.swaraAnalysis.tone === 'warn'
      ? 'flag-tag warn'
      : 'flag-tag muted';

  return (
    <div className="tab-stack">
      {/* Compact Session Strip for Q1..Q5 */}
      <div className="panel" style={{ padding: '12px 16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div className="session-q-tabs" role="tablist" aria-label="Consultation Questions">
            {sessionSummaries.map((entry) => {
              const qItem = questions.find((q) => q.id === entry.id)!;
              const meta = getTopicMeta(qItem.category);
              const isAct = entry.id === activeQuestion.id;
              return (
                <div
                  key={entry.id}
                  className={`session-q-pill ${isAct ? 'active' : ''}`}
                  onClick={() => onSelectQuestion(entry.id)}
                  role="tab"
                  aria-selected={isAct}
                >
                  <span>
                    Q{entry.order}: {meta.shortLabel} ({entry.analysis.domain.unifiedScorePct}%)
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      className="session-q-close"
                      aria-label={`Remove Question ${entry.order}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveQuestion(entry.id);
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}

            {questions.length < 5 && (
              <button type="button" className="session-q-add" onClick={onAddQuestion}>
                <Plus size={14} /> Ask Another Question
              </button>
            )}
          </div>

          {questions.length > 1 && (
            <label className="field" style={{ minWidth: 230 }}>
              <span>Multiple Questions Handling</span>
              <select
                value={multiQuestionMode}
                onChange={(e) =>
                  onChangeMultiQuestionMode(e.target.value as 'rotate_chart' | 'independent')
                }
              >
                <option value="rotate_chart">Rotate Same Chart (Sun / Moon / Jupiter)</option>
                <option value="independent">Use Separate Time for Each Question</option>
              </select>
            </label>
          )}
        </div>
      </div>

      {/* Main Two-Card Dropdown-First Setup */}
      <div className="two-col-grid">
        {/* Card 1: Querent, Method, Time/Place & Swara/Hora Inputs */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <span className="panel-eyebrow">Step 1 · Person, Timing, Method &amp; Signals</span>
            <h3 style={{ margin: 0 }}>Basic Details &amp; Chart Setup</h3>
          </div>

          <div className="clean-form-grid">
            <label className="field">
              <span>
                <User size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Name of Querent (Optional)
              </span>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={querentName}
                onChange={(e) => onChangeQuerentName(e.target.value)}
              />
            </label>

            <label className="field">
              <span>Asking About Whom?</span>
              <select
                aria-label="Asking About Whom"
                value={activeQuestion.askingAboutKey}
                onChange={(e) => handlePersonChange(e.target.value)}
              >
                {ASKING_ABOUT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Age (Optional)</span>
              <input
                type="number"
                min={1}
                max={107}
                placeholder="Years"
                value={querentAge ?? ''}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  onChangeQuerentAge(Number.isFinite(v) && v > 0 ? Math.min(107, v) : undefined);
                }}
              />
            </label>
          </div>

          <div className="clean-form-grid">
            <label className="field">
              <span>Date (Q{activeEntry?.order ?? 1})</span>
              <input
                type="date"
                value={effectiveTimeSource.localDate}
                disabled={isTimeControlledByQ1}
                onChange={(e) => onUpdateActiveQuestion({ localDate: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Time (Q{activeEntry?.order ?? 1})</span>
              <input
                type="time"
                step={1}
                value={effectiveTimeSource.localTime}
                disabled={isTimeControlledByQ1}
                onChange={(e) => onUpdateActiveQuestion({ localTime: e.target.value })}
              />
            </label>

            <div className="field" ref={cityRef}>
              <span>Place ({placeName})</span>
              <input
                type="text"
                value={cityDropdownOpen ? cityQuery : placeName}
                onFocus={onFocusCity}
                onChange={(e) => onChangeCityQuery(e.target.value)}
                placeholder="Type city name..."
                aria-label="Search city"
              />
              {cityDropdownOpen && (
                <div className="city-dropdown">
                  <div className="city-dropdown-head">
                    {cityLoadingOnline ? 'Searching global cities...' : 'Select location'}
                  </div>
                  {cityResults.map((c, idx) => (
                    <button
                      key={`${c.name}-${c.latitude}-${idx}`}
                      type="button"
                      className="city-option"
                      onClick={() => onPickCity(c)}
                    >
                      <strong>{c.name}</strong>
                      <span className="city-meta">
                        {[c.admin1, c.country].filter(Boolean).join(', ')} ({c.timeZone})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Calculation Method Dropdown + Conditional Input */}
          <div className="two-col-grid">
            <label className="field">
              <span>Chart Calculation Method (Dropdown)</span>
              <select
                aria-label="Chart Calculation Method"
                value={effectiveTimeSource.castingMode}
                disabled={isTimeControlledByQ1}
                onChange={(e) =>
                  onUpdateActiveQuestion({ castingMode: e.target.value as ChartCastingMode })
                }
              >
                {CASTING_METHOD_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>

            {effectiveTimeSource.castingMode === 'number_108' && (
              <label className="field">
                <span>Number (1–108)</span>
                <input
                  type="number"
                  min={1}
                  max={108}
                  value={effectiveTimeSource.prashna108Number}
                  disabled={isTimeControlledByQ1}
                  onChange={(e) =>
                    onUpdateActiveQuestion({
                      prashna108Number: Math.max(
                        1,
                        Math.min(108, parseInt(e.target.value, 10) || 1)
                      ),
                    })
                  }
                />
              </label>
            )}

            {effectiveTimeSource.castingMode === 'kp_horary' && (
              <label className="field">
                <span>KP Horary Number (1–249)</span>
                <input
                  type="number"
                  min={1}
                  max={249}
                  value={effectiveTimeSource.kpNumber}
                  disabled={isTimeControlledByQ1}
                  onChange={(e) =>
                    onUpdateActiveQuestion({
                      kpNumber: Math.max(1, Math.min(249, parseInt(e.target.value, 10) || 1)),
                    })
                  }
                />
              </label>
            )}

            {effectiveTimeSource.castingMode === 'arudha_override' && (
              <label className="field">
                <span>Pick Arudha Sign (1–12)</span>
                <select
                  value={effectiveTimeSource.arudhaSignIndex}
                  disabled={isTimeControlledByQ1}
                  onChange={(e) =>
                    onUpdateActiveQuestion({ arudhaSignIndex: parseInt(e.target.value, 10) || 0 })
                  }
                >
                  {SIGNS.map((s) => (
                    <option key={s.index} value={s.index}>
                      {s.index + 1}. {s.name} ({s.sanskrit} · Ruler {s.lord})
                    </option>
                  ))}
                </select>
              </label>
            )}

            {effectiveTimeSource.castingMode === 'ashtamangala' && (
              <div className="field">
                <span>Ashtamangala 3 Numbers (Left · Mid · Right)</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {[0, 1, 2].map((idx) => (
                    <input
                      key={idx}
                      type="number"
                      min={1}
                      max={108}
                      value={effectiveTimeSource.ashtamangalaPiles[idx]}
                      disabled={isTimeControlledByQ1}
                      onChange={(e) => {
                        const next: [number, number, number] = [...effectiveTimeSource.ashtamangalaPiles] as [number, number, number];
                        next[idx] = Math.max(1, Math.min(108, parseInt(e.target.value, 10) || 1));
                        onUpdateActiveQuestion({ ashtamangalaPiles: next });
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {effectiveTimeSource.castingMode === 'akshara_prashna' && (
              <label className="field">
                <span>First Syllable / Akshara Sound Group</span>
                <select
                  value={effectiveTimeSource.pranaksharaGroup}
                  disabled={isTimeControlledByQ1}
                  onChange={(e) =>
                    onUpdateActiveQuestion({
                      pranaksharaGroup: e.target.value as SessionQuestionItemBasic['pranaksharaGroup'],
                    })
                  }
                >
                  <option value="A">A / E / I / O / U (Vowels — Sun / Leo)</option>
                  <option value="Ka">Ka, Kha, Ga, Gha (Mars / Aries)</option>
                  <option value="Cha">Cha, Chha, Ja, Jha (Venus / Libra)</option>
                  <option value="Ta">Ta, Tha, Da, Dha (Mercury / Virgo)</option>
                  <option value="Tha">Ta/Tha/Da/Dha Soft (Jupiter / Sagittarius)</option>
                  <option value="Pa">Pa, Pha, Ba, Bha, Ma (Saturn / Capricorn)</option>
                  <option value="Ya_Sa">Ya, Ra, La, Va, Sha, Sa, Ha (Moon / Cancer)</option>
                </select>
              </label>
            )}

            {(effectiveTimeSource.castingMode === 'time_lagna' ||
              effectiveTimeSource.castingMode === 'hora_lagna' ||
              effectiveTimeSource.castingMode === 'mooka_prashna') && (
              <div className="info-badge" style={{ alignSelf: 'end', padding: '9px 10px' }}>
                <strong>{activeMethodMeta.shortTag}:</strong>{' '}
                {effectiveTimeSource.castingMode === 'hora_lagna'
                  ? `Hora Lagna in ${chart.horaLagnaSignName} · Active ${chart.panchanga.horaLord} Hora`
                  : effectiveTimeSource.castingMode === 'mooka_prashna'
                  ? `Auto Topic Focus: ${domain.mookBlind.natureOfQueryDhatuMoolaJeeva}`
                  : `Rising Sign: ${chart.ascendantSignName} · ${chart.panchanga.horaLord} Hora`}
              </div>
            )}
          </div>

          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              padding: '7px 10px',
              borderRadius: 8,
              background: 'var(--surface-alt)',
              border: '1px solid var(--border)',
            }}
          >
            <strong>Active Method Note:</strong> {activeMethodMeta.description}
            {effectiveTimeSource.castingMode === 'number_108' && (
              <span>
                {' '}
                (Result: <strong>{n108LagnaSign.name} Lagna</strong> ·{' '}
                <strong>{n108NavSign.name} Navamsa</strong>)
              </span>
            )}
            {effectiveTimeSource.castingMode === 'kp_horary' && kpPreviewSlot && (
              <span>
                {' '}
                (KP #{kpPreviewSlot.number}: <strong>{kpPreviewSlot.signName}</strong> · Star{' '}
                {kpPreviewSlot.starLord} / Sub {kpPreviewSlot.subLord})
              </span>
            )}
            {' · '}
            <span>{activePersonOpt.plainNote}</span>
          </div>

          {/* Nostril (Swara) & Querent Side Dropdowns */}
          <div className="two-col-grid">
            <label className="field">
              <span>Active Nostril — Swara (Optional)</span>
              <select
                aria-label="Active Nostril Swara"
                value={activeQuestion.swaraNostril}
                onChange={(e) =>
                  onUpdateActiveQuestion({ swaraNostril: e.target.value as SwaraNostril })
                }
              >
                {SWARA_OPTIONS.map((sw) => (
                  <option key={sw.id} value={sw.id}>
                    {sw.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Querent Position / Side (Optional)</span>
              <select
                aria-label="Querent Position Side"
                value={activeQuestion.swaraPosition}
                onChange={(e) =>
                  onUpdateActiveQuestion({ swaraPosition: e.target.value as SwaraPosition })
                }
              >
                {SWARA_POSITION_OPTIONS.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Card 2: Question Topic & Ready Questions (Dropdown-First) */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <span className="panel-eyebrow">Step 2 · Question Setup</span>
              <h3 style={{ margin: 0 }}>Topic &amp; Exact Question</h3>
            </div>
            <button
              type="button"
              className="btn-xs"
              onClick={() => {
                const detCat = detectQuestionCategory(activeQuestion.questionText);
                const detKey = detectAskingAboutKey(activeQuestion.questionText);
                const detPerson = ASKING_ABOUT_OPTIONS.find((o) => o.key === detKey);
                const patch: Partial<SessionQuestionItemBasic> = {};
                if (detCat) patch.category = detCat;
                if (detPerson) {
                  patch.askingAboutKey = detPerson.key;
                  patch.askingAboutHouse = detPerson.house;
                }
                if (Object.keys(patch).length > 0) onUpdateActiveQuestion(patch);
              }}
            >
              Auto-Detect Topic &amp; Person
            </button>
          </div>

          <div className="two-col-grid">
            <label className="field">
              <span>Choose Question Topic (Dropdown)</span>
              <select
                aria-label="Choose Question Topic"
                value={activeQuestion.category}
                onChange={(e) => handleTopicPick(e.target.value as QuestionCategory)}
              >
                {QUESTION_TOPIC_CATALOG.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.fullLabel}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Pick a Ready Question (Optional)</span>
              <select
                aria-label="Pick Ready Question"
                value={
                  activeTopicMeta.presets.includes(activeQuestion.questionText)
                    ? activeQuestion.questionText
                    : ''
                }
                onChange={(e) => {
                  if (e.target.value) {
                    handleQuestionTextChange(e.target.value);
                  }
                }}
              >
                <option value="">-- Select or type custom below --</option>
                {activeTopicMeta.presets.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>Question #{activeEntry?.order ?? 1} (Or Type Your Own Words)</span>
            <input
              type="text"
              value={activeQuestion.questionText}
              onChange={(e) => handleQuestionTextChange(e.target.value)}
              placeholder="e.g. Will my friend get a job? / Which paper will be easy?"
            />
          </label>

          {/* Instant Live Color Snapshot for Non-Astrologers */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              LIVE SIGNALS FOR CHOSEN METHOD ({activeMethodMeta.shortTag.toUpperCase()}):
            </div>
            <div className="sub-badges-row" style={{ marginTop: 0 }}>
              <span className="info-badge">
                <strong>Lagna:</strong> {chart.ascendantSignName} (H1)
              </span>
              <span className={horaBadgeClass}>
                Hora: {domain.horaAnalysis.horaLord} — {domain.horaAnalysis.badgeText}
              </span>
              <span className={swaraBadgeClass}>
                Nostril: {domain.swaraAnalysis.badgeText}
              </span>
              <span className="info-badge">
                Focus: {activeTopicMeta.shortLabel}
              </span>
            </div>
          </div>

          <div className="cta-bar-end" style={{ marginTop: 'auto' }}>
            <button type="button" className="btn-action" onClick={onGoToGuide}>
              3. Rashi &amp; Planet Guide
            </button>
            <button type="button" className="btn-action" onClick={onGoToCalculations}>
              <Compass size={15} /> 2. Chart &amp; Calculations →
            </button>
            <button
              type="button"
              className="seg-btn active"
              onClick={onGoToPredictions}
              style={{ padding: '9px 15px', borderRadius: 8 }}
            >
              <Sparkles size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />
              4. View Prediction →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
