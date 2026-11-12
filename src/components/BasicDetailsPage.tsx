import React, { useState } from 'react';
import { BookOpen, Plus, User } from 'lucide-react';
import {
  HOUSE_GUIDE_TABLE,
  KP_249_TABLE,
  PLANET_GUIDE_TABLE,
  SIGNS,
} from '../astro/constants';
import type { CompleteHoraryAnalysis } from '../astro/horaryAnalyzer';
import {
  QUESTION_TOPIC_CATALOG,
  detectAskingAboutHouse,
  detectQuestionCategory,
  getTopicMeta,
} from '../astro/questionCatalog';
import type { QuestionCategory } from '../astro/types';
import type { CityResult } from '../data/citySearch';

export interface SessionQuestionItemBasic {
  id: string;
  questionText: string;
  category: QuestionCategory;
  askingAboutHouse: 1 | 3 | 4 | 5 | 7 | 9 | 10;
  localDate: string;
  localTime: string;
  castingMode: 'time_lagna' | 'number_108' | 'kp_horary';
  prashna108Number: number;
  kpNumber: number;
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
  onGoToPredictions,
}) => {
  const [guideTab, setGuideTab] = useState<'signs' | 'planets' | 'houses'>('signs');

  const activeEntry =
    sessionSummaries.find((e) => e.id === activeQuestion.id) ?? sessionSummaries[0];
  const effectiveTimeSource =
    multiQuestionMode === 'rotate_chart' ? questions[0] : activeQuestion;
  const kpPreviewSlot =
    KP_249_TABLE[Math.max(1, Math.min(249, effectiveTimeSource.kpNumber || 1)) - 1];
  const activeTopicMeta = getTopicMeta(activeQuestion.category);

  const n108 = Math.max(1, Math.min(108, effectiveTimeSource.prashna108Number || 78));
  const n108SignsElapsed = Math.floor((n108 - 1) / 9) % 12;
  const n108NavNum = ((n108 - 1) % 9) + 1;
  const n108LagnaSign = SIGNS[n108SignsElapsed];
  const n108NavSign = SIGNS[n108NavNum - 1];

  const { chart } = analysis;
  const risingSignInfo = SIGNS[chart.ascendantSignIndex];
  const moonPos = chart.planets.find((p) => p.id === 'Moon');
  const moonSignInfo = moonPos ? SIGNS[moonPos.signIndex] : SIGNS[0];
  const primaryLordGuide = PLANET_GUIDE_TABLE.find((p) => p.id === risingSignInfo.lord);

  const handleTopicPick = (catId: QuestionCategory) => {
    const meta = getTopicMeta(catId);
    const currentMeta = getTopicMeta(activeQuestion.category);
    const wasDefaultPreset =
      !activeQuestion.questionText.trim() ||
      currentMeta.presets.includes(activeQuestion.questionText);
    onUpdateActiveQuestion({
      category: catId,
      ...(wasDefaultPreset ? { questionText: meta.presets[0] } : {}),
    });
  };

  return (
    <div className="tab-stack">
      {/* Top 2-Card Clean Setup: Left = Querent & Timing | Right = Question Builder */}
      <div className="two-col-grid">
        {/* Card A: Querent, Time, Place & Calculation Method */}
        <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <span className="panel-eyebrow">Step 1 · Querent &amp; Timing</span>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Basic Details &amp; Chart Method</h2>
          </div>

          <div className="clean-form-grid">
            <label className="field">
              <span>
                <User size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Name of Querent
              </span>
              <input
                type="text"
                value={querentName}
                onChange={(e) => onChangeQuerentName(e.target.value)}
                placeholder="Enter name (Optional)"
              />
            </label>

            <label className="field">
              <span>Asking About Whom?</span>
              <select
                value={activeQuestion.askingAboutHouse}
                onChange={(e) =>
                  onUpdateActiveQuestion({
                    askingAboutHouse: Number(e.target.value) as 1 | 3 | 4 | 5 | 7 | 9 | 10,
                  })
                }
              >
                <option value={1}>Myself (House 1)</option>
                <option value={5}>My Son / Daughter (House 5)</option>
                <option value={7}>My Spouse / Partner (House 7)</option>
                <option value={9}>My Father / Elder (House 9)</option>
                <option value={4}>My Mother (House 4)</option>
                <option value={3}>My Brother / Sister (House 3)</option>
                <option value={10}>Boss / Workplace Lead (House 10)</option>
              </select>
            </label>

            <label className="field">
              <span>Age (Optional)</span>
              <input
                type="number"
                min={0}
                max={106}
                placeholder="Years"
                value={querentAge ?? ''}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  onChangeQuerentAge(
                    raw === '' ? undefined : Math.max(0, Math.min(106, parseInt(raw, 10) || 0))
                  );
                }}
              />
            </label>

            <label className="field">
              <span>
                Date {questions.length > 1 && multiQuestionMode === 'rotate_chart' ? '(Sitting)' : `(Q${activeEntry.order})`}
              </span>
              <input
                type="date"
                value={effectiveTimeSource.localDate}
                onChange={(e) => onUpdateActiveQuestion({ localDate: e.target.value })}
              />
            </label>

            <label className="field">
              <span>
                Time {questions.length > 1 && multiQuestionMode === 'rotate_chart' ? '(Sitting)' : `(Q${activeEntry.order})`}
              </span>
              <input
                type="time"
                step={1}
                value={effectiveTimeSource.localTime}
                onChange={(e) => onUpdateActiveQuestion({ localTime: e.target.value })}
              />
            </label>

            <div className="field field-city" ref={cityRef}>
              <span>Place</span>
              <input
                type="text"
                value={cityDropdownOpen ? cityQuery : placeName}
                onFocus={onFocusCity}
                onChange={(e) => onChangeCityQuery(e.target.value)}
                placeholder="Search any city..."
              />
              {cityDropdownOpen && (
                <div className="city-dropdown">
                  <div className="city-dropdown-head">
                    <span>{cityLoadingOnline ? 'Searching worldwide...' : 'Select city'}</span>
                  </div>
                  {cityResults.map((c, idx) => (
                    <button
                      key={`${c.name}-${idx}`}
                      type="button"
                      className="city-option"
                      onClick={() => onPickCity(c)}
                    >
                      <strong>{c.name}</strong> {c.admin1 ? `${c.admin1}, ` : ''}
                      {c.country}
                      <span className="city-meta">{c.timeZone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Clean Calculation Method Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4, borderTop: '1px dashed var(--border)' }}>
            <div className="field">
              <span>Chart Calculation Method</span>
              <div className="segmented-group">
                {(
                  [
                    ['time_lagna', 'Question Time'],
                    ['number_108', 'Number (1–108)'],
                    ['kp_horary', 'KP Horary (1–249)'],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    className={`seg-btn ${effectiveTimeSource.castingMode === mode ? 'active' : ''}`}
                    onClick={() => onUpdateActiveQuestion({ castingMode: mode })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {effectiveTimeSource.castingMode === 'number_108' && (
              <div className="method-inline-row">
                <label className="field" style={{ width: 120, flexShrink: 0 }}>
                  <span>Number (1–108)</span>
                  <input
                    type="number"
                    min={1}
                    max={108}
                    value={effectiveTimeSource.prashna108Number}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(108, parseInt(e.target.value, 10) || 1));
                      onUpdateActiveQuestion({ prashna108Number: val });
                    }}
                  />
                </label>
                <div className="info-badge" style={{ flex: 1, padding: '8px 10px' }}>
                  {n108} ÷ 9 → {n108SignsElapsed} elapsed → <strong>{n108LagnaSign.name} Lagna</strong> · Rem {n108NavNum} → <strong>{n108NavSign.name} Navamsa</strong>
                </div>
              </div>
            )}

            {effectiveTimeSource.castingMode === 'kp_horary' && (
              <div className="method-inline-row">
                <label className="field" style={{ width: 140, flexShrink: 0 }}>
                  <span>KP Number (1–249)</span>
                  <input
                    type="number"
                    min={1}
                    max={249}
                    value={effectiveTimeSource.kpNumber}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(249, parseInt(e.target.value, 10) || 1));
                      onUpdateActiveQuestion({ kpNumber: val });
                    }}
                  />
                </label>
                <div className="info-badge" style={{ flex: 1, padding: '8px 10px' }}>
                  <strong>{kpPreviewSlot.signName}</strong> ({kpPreviewSlot.dmsStart}) · Sign <strong>{kpPreviewSlot.signLord}</strong> / Star <strong>{kpPreviewSlot.starLord}</strong> / Sub <strong>{kpPreviewSlot.subLord}</strong>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Card B: Question Builder & Topic Selector */}
        <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel-header-row" style={{ marginBottom: 0 }}>
            <div>
              <span className="panel-eyebrow">Step 2 · Question Setup</span>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Select Topic &amp; Question</h2>
            </div>
            {questions.length < 5 && (
              <button type="button" className="session-q-add" onClick={onAddQuestion}>
                <Plus size={14} /> Add Question (Max 5)
              </button>
            )}
          </div>

          {/* Multi-Question Session Tabs (Only compact row when needed) */}
          <div className="session-bar">
            <div className="session-q-tabs" role="tablist" aria-label="Questions in session">
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
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onSelectQuestion(entry.id);
                    }}
                  >
                    <span>
                      Q{entry.order}: {meta.shortLabel}
                    </span>
                    <span style={{ opacity: 0.85, fontSize: '0.73rem' }}>
                      {entry.analysis.domain.unifiedScorePct}%
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
            </div>

            {questions.length > 1 && (
              <div className="segmented-group" role="group" aria-label="Multi-question chart mode">
                <button
                  type="button"
                  className={`seg-btn ${multiQuestionMode === 'rotate_chart' ? 'active' : ''}`}
                  onClick={() => onChangeMultiQuestionMode('rotate_chart')}
                >
                  Same Sitting (Auto-Rotate)
                </button>
                <button
                  type="button"
                  className={`seg-btn ${multiQuestionMode === 'independent' ? 'active' : ''}`}
                  onClick={() => onChangeMultiQuestionMode('independent')}
                >
                  Own Time / # per Q
                </button>
              </div>
            )}
          </div>

          {/* Topic Pills */}
          <div className="topic-pills-row" role="group" aria-label="Question topics">
            {QUESTION_TOPIC_CATALOG.map((topic) => (
              <button
                key={topic.id}
                type="button"
                className={`topic-pill ${activeQuestion.category === topic.id ? 'active' : ''}`}
                onClick={() => handleTopicPick(topic.id)}
              >
                {topic.shortLabel}
              </button>
            ))}
          </div>

          {/* Ready Questions */}
          <div className="preset-strip">
            <span className="preset-label">Quick Questions:</span>
            {activeTopicMeta.presets.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`preset-chip ${activeQuestion.questionText === preset ? 'active-preset' : ''}`}
                onClick={() =>
                  onUpdateActiveQuestion({
                    questionText: preset,
                    askingAboutHouse: detectAskingAboutHouse(preset),
                  })
                }
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Custom Question Box */}
          <label className="field">
            <span>Question #{activeEntry.order} (Or Type Custom Question)</span>
            <input
              type="text"
              value={activeQuestion.questionText}
              onChange={(e) => {
                const text = e.target.value;
                const detectedCat = detectQuestionCategory(text);
                const detectedPerson = detectAskingAboutHouse(text);
                onUpdateActiveQuestion({
                  questionText: text,
                  ...(detectedCat ? { category: detectedCat } : {}),
                  ...(text.trim().length > 4 ? { askingAboutHouse: detectedPerson } : {}),
                });
              }}
              placeholder="e.g. Will I have a son?, Best dates to conceive?, Will my son get a job?, Which paper is tough?"
            />
          </label>

          {/* Clean Action Bar */}
          <div className="cta-bar-end">
            <button
              type="button"
              className="seg-btn active"
              style={{ borderRadius: 8, height: 38, fontWeight: 700, padding: '0 16px' }}
              onClick={onGoToCalculations}
            >
              2. View Calculations &amp; KP Chart →
            </button>
            <button
              type="button"
              className="btn-action"
              style={{ height: 38, fontWeight: 700 }}
              onClick={onGoToPredictions}
            >
              3. View Predictions &amp; Remedies →
            </button>
          </div>
        </section>
      </div>

      {/* Reference Card: Which Sign (Rashi), Planet & House Means What */}
      <section className="panel">
        <div className="panel-header-row" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={17} />
            <div>
              <h3 style={{ margin: 0 }}>
                Which Sign (Rashi), Planet &amp; House Means What
              </h3>
              <p className="panel-hint" style={{ margin: 0 }}>
                Clear meaning guide for your current chart and for reading every sign, planet, and house.
              </p>
            </div>
          </div>

          <div className="segmented-group" role="tablist" aria-label="Reference meanings tabs">
            <button
              type="button"
              className={`seg-btn ${guideTab === 'signs' ? 'active' : ''}`}
              onClick={() => setGuideTab('signs')}
            >
              12 Signs (Rashis)
            </button>
            <button
              type="button"
              className={`seg-btn ${guideTab === 'planets' ? 'active' : ''}`}
              onClick={() => setGuideTab('planets')}
            >
              9 Planets (Grahas)
            </button>
            <button
              type="button"
              className={`seg-btn ${guideTab === 'houses' ? 'active' : ''}`}
              onClick={() => setGuideTab('houses')}
            >
              12 Houses (Bhavas)
            </button>
          </div>
        </div>

        {/* Active Highlights right now */}
        <div className="data-kv-grid" style={{ marginBottom: 12 }}>
          <div style={{ background: 'rgba(180, 120, 40, 0.08)', borderColor: 'rgba(180, 120, 40, 0.35)' }}>
            <span>Your Rising Sign (House 1) Right Now</span>
            <strong>
              {risingSignInfo.name} ({risingSignInfo.sanskrit}) — Ruler: {risingSignInfo.lord}
            </strong>
            <div style={{ fontSize: '0.8rem', marginTop: 3, opacity: 0.9 }}>
              {risingSignInfo.modality} · {risingSignInfo.udaya === 'Shirshodaya' ? 'Head-Rising (+)' : risingSignInfo.udaya === 'Prishtodaya' ? 'Hind-Rising (Effort)' : 'Dual-Rising (+/-)'} · {risingSignInfo.odd ? 'Male (Odd)' : 'Female (Even)'} · Dir: {risingSignInfo.cardinalDirection}.{' '}
              {risingSignInfo.plainMeaning}
            </div>
          </div>

          <div style={{ background: 'rgba(180, 120, 40, 0.08)', borderColor: 'rgba(180, 120, 40, 0.35)' }}>
            <span>Your Mind &amp; Focus Houses Right Now</span>
            <strong>
              Moon in {moonSignInfo.name} (House {moonPos?.houseWholeSign ?? 1})
            </strong>
            <div style={{ fontSize: '0.8rem', marginTop: 3, opacity: 0.9 }}>
              Focus houses: <strong>{activeTopicMeta.focusHousesPlain}</strong>. Main ruler ({risingSignInfo.lord}): {primaryLordGuide?.governsPlain}
            </div>
          </div>
        </div>

        <div className="table-scroll guide-table-scroll">
          {guideTab === 'signs' && (
            <table className="pro-table compact">
              <thead>
                <tr>
                  <th>Sign (Rashi)</th>
                  <th>Ruler</th>
                  <th>Nature &amp; Rising</th>
                  <th>Gender &amp; Form</th>
                  <th>Direction &amp; Fertility</th>
                  <th>What It Tells in an Answer</th>
                </tr>
              </thead>
              <tbody>
                {SIGNS.map((s) => {
                  const isActiveLagna = s.index === chart.ascendantSignIndex;
                  const isActiveMoon = s.index === moonPos?.signIndex;
                  return (
                    <tr key={s.index} className={isActiveLagna ? 'row-active' : ''}>
                      <td>
                        <strong>{s.index + 1}. {s.name}</strong> ({s.sanskrit})
                        {isActiveLagna && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>
                            ★ Rising Sign Now
                          </div>
                        )}
                        {isActiveMoon && (
                          <div style={{ fontSize: '0.72rem', opacity: 0.85, fontWeight: 600 }}>
                            ● Moon Here Now
                          </div>
                        )}
                      </td>
                      <td><strong>{s.lord}</strong></td>
                      <td>
                        {s.modality} · {s.element}
                        <div style={{ fontSize: '0.76rem', opacity: 0.78 }}>
                          {s.udaya === 'Shirshodaya' ? 'Head-Rising (+)' : s.udaya === 'Prishtodaya' ? 'Hind-Rising (Effort)' : 'Both Ways (+/-)'}
                        </div>
                      </td>
                      <td>
                        {s.odd ? 'Male (Odd)' : 'Female (Even)'}
                        <div style={{ fontSize: '0.76rem', opacity: 0.78 }}>{s.bodyForm}</div>
                      </td>
                      <td>
                        {s.cardinalDirection}
                        <div style={{ fontSize: '0.76rem', opacity: 0.78 }}>{s.fertility}</div>
                      </td>
                      <td style={{ whiteSpace: 'normal', minWidth: 220 }}>{s.plainMeaning}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {guideTab === 'planets' && (
            <table className="pro-table compact">
              <thead>
                <tr>
                  <th>Planet</th>
                  <th>Role &amp; Nature</th>
                  <th>Gender &amp; Age</th>
                  <th>Colour &amp; Direction</th>
                  <th>Timing Speed &amp; Stress House</th>
                  <th>What It Represents &amp; Governs</th>
                </tr>
              </thead>
              <tbody>
                {PLANET_GUIDE_TABLE.map((pl) => (
                  <tr key={pl.id}>
                    <td><strong>{pl.id}</strong></td>
                    <td>{pl.nature}</td>
                    <td>
                      {pl.gender}
                      <div style={{ fontSize: '0.76rem', opacity: 0.78 }}>{pl.ageYears}</div>
                    </td>
                    <td>
                      {pl.colour}
                      <div style={{ fontSize: '0.76rem', opacity: 0.78 }}>Dir: {pl.direction}</div>
                    </td>
                    <td>
                      <strong>{pl.timingScale}</strong>
                      <div style={{ fontSize: '0.76rem', opacity: 0.78 }}>
                        {pl.maranaHouse ? `Stress if in House ${pl.maranaHouse}` : 'No fixed stress house'}
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'normal', minWidth: 220 }}>
                      {pl.governsPlain}
                      <div style={{ fontSize: '0.76rem', opacity: 0.75 }}>{pl.doshaAndBody}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {guideTab === 'houses' && (
            <table className="pro-table compact">
              <thead>
                <tr>
                  <th>House</th>
                  <th>Life Areas Governed</th>
                </tr>
              </thead>
              <tbody>
                {HOUSE_GUIDE_TABLE.map((h) => {
                  const isFocus = activeTopicMeta.focusHouses.includes(h.house);
                  return (
                    <tr key={h.house} className={isFocus ? 'row-active' : ''}>
                      <td>
                        <strong>{h.title}</strong>
                        {isFocus && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>
                            ★ Focus for Your Question
                          </div>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'normal' }}>{h.governsPlain}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};
