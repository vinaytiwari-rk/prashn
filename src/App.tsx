import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ClipboardList,
  Clock,
  Compass,
  MapPin,
  Moon,
  Printer,
  Sliders,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { runCompleteHoraryAnalysis } from './astro/horaryAnalyzer';
import {
  QUESTION_TOPIC_CATALOG,
  getTopicMeta,
} from './astro/questionCatalog';
import { getNowLocalParts } from './astro/time';
import type {
  AyanamsaId,
  HoraryQueryInput,
  HouseSystem,
  QuestionCategory,
} from './astro/types';
import {
  BasicDetailsPage,
  type SessionQuestionItemBasic,
} from './components/BasicDetailsPage';
import { CalculationsPage } from './components/CalculationsPage';
import { PredictionsPage } from './components/PredictionsPage';
import {
  lookupTimezoneForCoords,
  searchCitiesGlobal,
  searchCityOnlineNominatim,
  searchCuratedCities,
  type CityResult,
} from './data/citySearch';

type AppPage = 'basic' | 'calculations' | 'predictions';

interface SharedConfig {
  querentName: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  placeName: string;
  ayanamsa: AyanamsaId;
  houseSystem: HouseSystem;
  nodeMode: 'true' | 'mean';
  querentAge?: number;
  multiQuestionMode: 'rotate_chart' | 'independent';
  settings: HoraryQueryInput['settings'];
}

function createInitialState(): {
  shared: SharedConfig;
  questions: SessionQuestionItemBasic[];
} {
  const defaultTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  const nowParts = getNowLocalParts(defaultTz);
  return {
    shared: {
      querentName: '',
      latitude: 28.6139,
      longitude: 77.209,
      timeZone: defaultTz,
      placeName: defaultTz === 'Asia/Kolkata' ? 'New Delhi, IN' : 'Query Location',
      ayanamsa: 'kp',
      houseSystem: 'placidus',
      nodeMode: 'true',
      multiQuestionMode: 'rotate_chart',
      settings: {
        mercuryCombustDeg: 8,
        diseaseHouse: 6,
        tajikaSquareWeightPct: 75,
        directionSystem: 'kp_cardinal',
        useHoraInRp: false,
        rpHoraryAscMode: 'horary_slot',
      },
    },
    questions: [
      {
        id: 'q-1',
        questionText: QUESTION_TOPIC_CATALOG[0].presets[0],
        category: 'general_yes_no',
        askingAboutHouse: 1,
        localDate: nowParts.localDate,
        localTime: nowParts.localTime,
        castingMode: 'time_lagna',
        prashna108Number: 78,
        kpNumber: 94,
      },
    ],
  };
}

export const App: React.FC = () => {
  const initial = useMemo(() => createInitialState(), []);
  const [shared, setShared] = useState<SharedConfig>(initial.shared);
  const [questions, setQuestions] = useState<SessionQuestionItemBasic[]>(initial.questions);
  const [activeId, setActiveId] = useState<string>(initial.questions[0].id);
  const [activePage, setActivePage] = useState<AppPage>('basic');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showSettings, setShowSettings] = useState(false);

  // City search dropdown
  const [cityQuery, setCityQuery] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [cityResults, setCityResults] = useState<CityResult[]>(() => searchCuratedCities('', 12));
  const [cityLoadingOnline, setCityLoadingOnline] = useState(false);
  const cityRef = useRef<HTMLDivElement | null>(null);
  const nextCounterRef = useRef(2);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(ev.target as Node)) {
        setCityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!cityDropdownOpen) return;
    let cancelled = false;
    setCityResults(searchCuratedCities(cityQuery, 15));

    void searchCitiesGlobal(cityQuery, 18).then((res) => {
      if (!cancelled) setCityResults(res);
    });

    if (cityQuery.trim().length < 3) {
      setCityLoadingOnline(false);
      return () => {
        cancelled = true;
      };
    }

    const ctrl = new AbortController();
    setCityLoadingOnline(true);
    const timer = window.setTimeout(() => {
      void searchCityOnlineNominatim(cityQuery, ctrl.signal)
        .then((online) => {
          if (cancelled || online.length === 0) return;
          setCityResults((prev) => {
            const seen = new Set(prev.map((p) => `${p.name.toLowerCase()}|${p.latitude.toFixed(2)}`));
            const extra = online.filter((o) => !seen.has(`${o.name.toLowerCase()}|${o.latitude.toFixed(2)}`));
            return [...prev, ...extra].slice(0, 20);
          });
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setCityLoadingOnline(false);
        });
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [cityQuery, cityDropdownOpen]);

  const activeQuestion = useMemo(
    () => questions.find((q) => q.id === activeId) ?? questions[0],
    [questions, activeId]
  );

  const sessionSummaries = useMemo(
    () =>
      questions.map((q, idx) => {
        const order = Math.min(5, idx + 1) as 1 | 2 | 3 | 4 | 5;
        const anchorTimeQuestion = shared.multiQuestionMode === 'rotate_chart' ? questions[0] : q;
        const queryInput: HoraryQueryInput = {
          querentName: shared.querentName,
          questionText: q.questionText,
          category: q.category,
          queryIndexInSession: order,
          multiQuestionMode: shared.multiQuestionMode,
          askingAboutHouse: q.askingAboutHouse,
          localDate: anchorTimeQuestion.localDate,
          localTime: anchorTimeQuestion.localTime,
          latitude: shared.latitude,
          longitude: shared.longitude,
          timeZone: shared.timeZone,
          placeName: shared.placeName,
          castingMode: anchorTimeQuestion.castingMode,
          prashna108Number: anchorTimeQuestion.prashna108Number,
          kpNumber: anchorTimeQuestion.kpNumber,
          arudhaSignIndex: 0,
          ayanamsa: shared.ayanamsa,
          houseSystem: shared.houseSystem,
          nodeMode: shared.nodeMode,
          swaraNostril: 'unknown',
          ashtamangalaPiles: [35, 37, 36],
          querentAge: shared.querentAge,
          settings: shared.settings,
        };
        return {
          id: q.id,
          order,
          questionText: q.questionText,
          categoryLabel: getTopicMeta(q.category).fullLabel,
          analysis: runCompleteHoraryAnalysis(queryInput),
        };
      }),
    [questions, shared]
  );

  const activeEntry =
    sessionSummaries.find((e) => e.id === activeQuestion.id) ?? sessionSummaries[0];
  const analysis = activeEntry.analysis;

  const updateShared = (patch: Partial<SharedConfig>) => {
    setShared((prev) => ({ ...prev, ...patch }));
  };

  const updateActiveQuestion = (patch: Partial<SessionQuestionItemBasic>) => {
    setQuestions((prev) =>
      prev.map((item, idx) => {
        const isTarget = item.id === activeQuestion.id;
        if (
          shared.multiQuestionMode === 'rotate_chart' &&
          idx === 0 &&
          ('localDate' in patch ||
            'localTime' in patch ||
            'castingMode' in patch ||
            'prashna108Number' in patch ||
            'kpNumber' in patch)
        ) {
          const timePatch: Partial<SessionQuestionItemBasic> = {};
          if (patch.localDate !== undefined) timePatch.localDate = patch.localDate;
          if (patch.localTime !== undefined) timePatch.localTime = patch.localTime;
          if (patch.castingMode !== undefined) timePatch.castingMode = patch.castingMode;
          if (patch.prashna108Number !== undefined) timePatch.prashna108Number = patch.prashna108Number;
          if (patch.kpNumber !== undefined) timePatch.kpNumber = patch.kpNumber;
          return isTarget ? { ...item, ...patch } : { ...item, ...timePatch };
        }
        return isTarget ? { ...item, ...patch } : item;
      })
    );
  };

  const handleAddQuestion = () => {
    if (questions.length >= 5) return;
    const nowParts = getNowLocalParts(shared.timeZone);
    const id = `q-${nextCounterRef.current++}`;
    const suggestedCat: QuestionCategory =
      questions.length === 1
        ? 'career_job'
        : questions.length === 2
        ? 'marriage_relationship'
        : questions.length === 3
        ? 'finance_loan'
        : 'medical_health';
    const meta = getTopicMeta(suggestedCat);
    const newItem: SessionQuestionItemBasic = {
      id,
      questionText: meta.presets[0],
      category: suggestedCat,
      askingAboutHouse: 1,
      localDate: nowParts.localDate,
      localTime: nowParts.localTime,
      castingMode: activeQuestion.castingMode,
      prashna108Number: ((activeQuestion.prashna108Number + 17) % 108) + 1,
      kpNumber: ((activeQuestion.kpNumber + 23) % 249) + 1,
    };
    setQuestions((prev) => [...prev, newItem]);
    setActiveId(id);
  };

  const handleRemoveQuestion = (id: string) => {
    if (questions.length <= 1) return;
    const next = questions.filter((q) => q.id !== id);
    setQuestions(next);
    if (activeId === id) {
      setActiveId(next[0].id);
    }
  };

  const handleCastNow = () => {
    const nowParts = getNowLocalParts(shared.timeZone);
    updateActiveQuestion({
      localDate: nowParts.localDate,
      localTime: nowParts.localTime,
    });
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const tz = await lookupTimezoneForCoords(lat, lon);
      const nowParts = getNowLocalParts(tz);
      updateShared({
        latitude: Number(lat.toFixed(4)),
        longitude: Number(lon.toFixed(4)),
        timeZone: tz,
        placeName: `GPS (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
      });
      updateActiveQuestion({
        localDate: nowParts.localDate,
        localTime: nowParts.localTime,
      });
    });
  };

  const navigateToPage = (page: AppPage) => {
    setShowSettings(false);
    setActivePage(page);
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="app-shell">
      {/* Clean Header */}
      <header className="top-bar no-print">
        <div className="brand-group">
          <div className="brand-mark">ॐ</div>
          <div>
            <div className="brand-title-row">
              <h1>Prashna Kundali</h1>
            </div>
            <p className="brand-sub">Horary Astrology · Basic Details, Chart Calculations, Predictions &amp; Remedies</p>
          </div>
        </div>

        <div className="top-actions">
          <button type="button" className="btn-action" onClick={handleCastNow} title="Reset to current time">
            <Clock size={15} /> Current Time
          </button>
          <button type="button" className="btn-action" onClick={handleUseGps} title="Detect current GPS location">
            <MapPin size={15} /> GPS
          </button>
          <button type="button" className="btn-action" onClick={() => window.print()}>
            <Printer size={15} /> Print PDF
          </button>
          <button type="button" className="btn-action" onClick={() => setShowSettings((v) => !v)}>
            <Sliders size={15} /> Settings
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            aria-label="Toggle Light/Dark theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      {/* Print Header */}
      <div className="print-only-header">
        <h2>Prashna Kundali — Horary Consultation Sheet</h2>
        <p>
          {shared.querentName.trim() ? `Querent: ${shared.querentName.trim()} | ` : ''}
          Question {activeEntry.order}: &quot;{activeQuestion.questionText}&quot; | Topic: {analysis.domain.categoryLabel} | Place: {shared.placeName} | Time: {analysis.chart.panchanga.localDisplay}
        </p>
      </div>

      {/* Simple 3-Page Navigation */}
      <nav className="workbench-tabs no-print" aria-label="Software Pages">
        {(
          [
            ['basic', '1. Basic Details & Meanings'],
            ['calculations', '2. Calculations & Chart'],
            ['predictions', '3. Predictions & Remedies'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`tab-btn ${activePage === key ? 'active' : ''}`}
            onClick={() => navigateToPage(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Compact Active Session Strip on Pages 2 & 3 so users can switch Q1..Q5 without leaving charts/predictions */}
      {activePage !== 'basic' && (
        <div
          className="panel no-print"
          style={{
            marginBottom: 14,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '0.88rem' }}>
            {shared.querentName.trim() && (
              <>
                <strong>{shared.querentName.trim()}</strong> ·{' '}
              </>
            )}
            <span>&quot;{activeQuestion.questionText}&quot;</span>{' '}
            <span style={{ opacity: 0.72 }}>
              ({shared.placeName} · {analysis.chart.panchanga.localDisplay})
            </span>
          </div>

          {sessionSummaries.length > 1 && (
            <div className="session-q-tabs" role="tablist" aria-label="Switch active question">
              {sessionSummaries.map((entry) => {
                const qItem = questions.find((q) => q.id === entry.id)!;
                const meta = getTopicMeta(qItem.category);
                const isAct = entry.id === activeQuestion.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    className={`session-q-pill ${isAct ? 'active' : ''}`}
                    onClick={() => setActiveId(entry.id)}
                  >
                    Q{entry.order}: {meta.shortLabel} ({entry.analysis.domain.unifiedScorePct}%)
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="workbench-body">
        {activePage === 'basic' ? (
          <BasicDetailsPage
            querentName={shared.querentName}
            onChangeQuerentName={(name) => updateShared({ querentName: name })}
            querentAge={shared.querentAge}
            onChangeQuerentAge={(age) => updateShared({ querentAge: age })}
            placeName={shared.placeName}
            timeZone={shared.timeZone}
            cityRef={cityRef}
            cityQuery={cityQuery}
            cityDropdownOpen={cityDropdownOpen}
            cityLoadingOnline={cityLoadingOnline}
            cityResults={cityResults}
            onFocusCity={() => {
              setCityQuery('');
              setCityDropdownOpen(true);
            }}
            onChangeCityQuery={(q) => {
              setCityQuery(q);
              setCityDropdownOpen(true);
            }}
            onPickCity={(c) => {
              updateShared({
                placeName: c.admin1 ? `${c.name}, ${c.admin1}, ${c.country}` : `${c.name}, ${c.country}`,
                latitude: c.latitude,
                longitude: c.longitude,
                timeZone: c.timeZone,
              });
              setCityDropdownOpen(false);
            }}
            multiQuestionMode={shared.multiQuestionMode}
            onChangeMultiQuestionMode={(m) => updateShared({ multiQuestionMode: m })}
            questions={questions}
            activeQuestion={activeQuestion}
            sessionSummaries={sessionSummaries}
            onSelectQuestion={(id) => setActiveId(id)}
            onAddQuestion={handleAddQuestion}
            onRemoveQuestion={handleRemoveQuestion}
            onUpdateActiveQuestion={updateActiveQuestion}
            analysis={analysis}
            onGoToCalculations={() => navigateToPage('calculations')}
            onGoToPredictions={() => navigateToPage('predictions')}
          />
        ) : activePage === 'calculations' ? (
          <CalculationsPage
            analysis={analysis}
            totalQuestions={questions.length}
            onBackToBasicDetails={() => navigateToPage('basic')}
            onGoToPredictions={() => navigateToPage('predictions')}
          />
        ) : (
          <PredictionsPage
            analysis={analysis}
            sessionSummaries={sessionSummaries}
            activeQuestionId={activeQuestion.id}
            onSelectQuestion={(id) => setActiveId(id)}
            onBackToBasicDetails={() => navigateToPage('basic')}
            onBackToCalculations={() => navigateToPage('calculations')}
          />
        )}
      </main>

      {/* Mobile App Bottom Navigation Menu */}
      <nav className="mobile-bottom-nav no-print" aria-label="Bottom Navigation">
        <button
          type="button"
          className={`mobile-nav-item ${activePage === 'basic' && !showSettings ? 'active' : ''}`}
          onClick={() => navigateToPage('basic')}
        >
          <span className="mobile-nav-icon-pill">
            <ClipboardList size={19} />
          </span>
          <span>Details</span>
        </button>
        <button
          type="button"
          className={`mobile-nav-item ${activePage === 'calculations' && !showSettings ? 'active' : ''}`}
          onClick={() => navigateToPage('calculations')}
        >
          <span className="mobile-nav-icon-pill">
            <Compass size={19} />
          </span>
          <span>Chart &amp; KP</span>
        </button>
        <button
          type="button"
          className={`mobile-nav-item ${activePage === 'predictions' && !showSettings ? 'active' : ''}`}
          onClick={() => navigateToPage('predictions')}
        >
          <span className="mobile-nav-icon-pill">
            <Sparkles size={19} />
          </span>
          <span>Predictions</span>
        </button>
        <button
          type="button"
          className={`mobile-nav-item ${showSettings ? 'active' : ''}`}
          onClick={() => setShowSettings((v) => !v)}
        >
          <span className="mobile-nav-icon-pill">
            <Sliders size={19} />
          </span>
          <span>Settings</span>
        </button>
      </nav>

      {/* Clean Settings Modal */}
      {showSettings && (
        <div className="modal-backdrop no-print" onClick={() => setShowSettings(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Calculation Options</h3>
              <button type="button" className="btn-icon" onClick={() => setShowSettings(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="settings-grid">
              <label className="field">
                <span>Zodiac / Ayanamsa</span>
                <select
                  value={shared.ayanamsa}
                  onChange={(e) => updateShared({ ayanamsa: e.target.value as AyanamsaId })}
                >
                  <option value="kp">KP New</option>
                  <option value="lahiri">Lahiri (Chitrapaksha)</option>
                  <option value="raman">Raman</option>
                  <option value="true_chitra">True Chitra</option>
                </select>
              </label>

              <label className="field">
                <span>House Division System</span>
                <select
                  value={shared.houseSystem}
                  onChange={(e) => updateShared({ houseSystem: e.target.value as HouseSystem })}
                >
                  <option value="placidus">Placidus (Standard)</option>
                  <option value="whole_sign">Whole Sign (Equal Rasi)</option>
                  <option value="sripati">Sripati</option>
                  <option value="equal">Equal 30°</option>
                </select>
              </label>

              <label className="field">
                <span>Manual Coordinates (Lat / Lon / Timezone)</span>
                <div className="coords-inline">
                  <input
                    type="number"
                    step="0.01"
                    value={shared.latitude}
                    onChange={(e) => updateShared({ latitude: parseFloat(e.target.value) || 0 })}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={shared.longitude}
                    onChange={(e) => updateShared({ longitude: parseFloat(e.target.value) || 0 })}
                  />
                  <input
                    type="text"
                    value={shared.timeZone}
                    onChange={(e) => updateShared({ timeZone: e.target.value })}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
