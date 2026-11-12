import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import {
  HOUSE_GUIDE_TABLE,
  PERMANENT_FRIENDSHIP,
  PLANET_GUIDE_TABLE,
  SIGNS,
} from '../astro/constants';
import type { CompleteHoraryAnalysis } from '../astro/horaryAnalyzer';
import { getTopicMeta } from '../astro/questionCatalog';
import type { PlanetPosition } from '../astro/types';

type GuideSection = 'signs' | 'planets' | 'houses' | 'hora_swara';
type StatusFilter = 'all' | 'good' | 'warn' | 'bad' | 'focus';

interface MeaningsGuidePageProps {
  analysis: CompleteHoraryAnalysis;
  onBackToCalculations?: () => void;
  onGoToPredictions?: () => void;
}

function toneBadgeClass(tone: 'good' | 'warn' | 'bad' | 'info'): string {
  if (tone === 'good') return 'flag-tag good';
  if (tone === 'bad') return 'flag-tag bad';
  if (tone === 'warn') return 'flag-tag warn';
  return 'flag-tag muted';
}

function toneWord(tone: 'good' | 'warn' | 'bad' | 'info'): string {
  if (tone === 'good') return 'Favourable';
  if (tone === 'bad') return 'Unfavourable';
  if (tone === 'warn') return 'Mixed / Effort';
  return 'Neutral';
}

export function evaluatePlanetMeaningTone(
  p: PlanetPosition,
  focusHouses: number[]
): { tone: 'good' | 'warn' | 'bad'; reason: string } {
  const isDusthana = [6, 8, 12].includes(p.houseWholeSign);
  const inFocus = focusHouses.includes(p.houseWholeSign);
  const strongDig = ['Exalted', 'Moolatrikona', 'Own Sign', 'Great Friend', 'Friend'].includes(p.dignity);
  const weakDig = ['Debilitated', 'Great Enemy', 'Enemy'].includes(p.dignity);

  if (p.isCombust || (weakDig && isDusthana)) {
    return {
      tone: 'bad',
      reason: p.isCombust
        ? `Combust near Sun (${p.combustOrbDeg?.toFixed(1)}°) in H${p.houseWholeSign} — weakened delivery.`
        : `${p.dignity} in challenging House ${p.houseWholeSign} — creates friction.`,
    };
  }
  if (inFocus && strongDig) {
    return {
      tone: 'good',
      reason: `Strong (${p.dignity}) directly in Focus House ${p.houseWholeSign} — actively helps outcome.`,
    };
  }
  if (strongDig && !isDusthana) {
    return {
      tone: 'good',
      reason: `${p.dignity} in supportive House ${p.houseWholeSign} — adds stability.`,
    };
  }
  if (isDusthana || weakDig) {
    return {
      tone: 'warn',
      reason: isDusthana
        ? `Placed in challenging House ${p.houseWholeSign} (${p.dignity}) — needs patience or effort.`
        : `${p.dignity} in House ${p.houseWholeSign} — mixed push requiring care.`,
    };
  }
  return {
    tone: inFocus ? 'good' : 'warn',
    reason: inFocus
      ? `Placed in Focus House ${p.houseWholeSign} (${p.dignity}) — directly connected to question.`
      : `${p.dignity} in House ${p.houseWholeSign} — steady neutral support.`,
  };
}

export const MeaningsGuidePage: React.FC<MeaningsGuidePageProps> = ({
  analysis,
  onBackToCalculations,
  onGoToPredictions,
}) => {
  const [section, setSection] = useState<GuideSection>('signs');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { chart, domain, classical } = analysis;
  const topicMeta = getTopicMeta(chart.input.category);
  const risingSignInfo = SIGNS[chart.ascendantSignIndex];
  const moonPos = chart.planets.find((p) => p.id === 'Moon');
  const moonSignInfo = moonPos ? SIGNS[moonPos.signIndex] : SIGNS[0];
  const lagnaLord = risingSignInfo.lord;

  const horaRows: {
    planet: (typeof PLANET_GUIDE_TABLE)[number]['id'];
    bestFor: string;
    avoidFor: string;
    isActive: boolean;
    tone: 'good' | 'warn' | 'bad';
    reason: string;
  }[] = PLANET_GUIDE_TABLE.filter((p) => p.id !== 'Rahu' && p.id !== 'Ketu').map((pl) => {
    const pId = pl.id as 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';
    const isActive = chart.panchanga.horaLord === pId;
    const friendToLagna =
      pId === lagnaLord || PERMANENT_FRIENDSHIP[pId].friends.includes(lagnaLord);
    const enemyToLagna = PERMANENT_FRIENDSHIP[pId].enemies.includes(lagnaLord);
    const pChart = chart.planets.find((x) => x.id === pId);
    const strong = pChart && ['Exalted', 'Moolatrikona', 'Own Sign', 'Great Friend', 'Friend'].includes(pChart.dignity) && !pChart.isCombust;

    let tone: 'good' | 'warn' | 'bad' = 'warn';
    if (isActive) {
      tone = domain.horaAnalysis.tone;
    } else if (friendToLagna && strong) {
      tone = 'good';
    } else if (enemyToLagna && pChart && [6, 8, 12].includes(pChart.houseWholeSign)) {
      tone = 'bad';
    }

    const horaSuitability: Record<string, { bestFor: string; avoidFor: string }> = {
      Sun: { bestFor: 'Government work, promotion, authority & father', avoidFor: 'Marriage harmony or soft negotiations' },
      Moon: { bestFor: 'Travel, mother, home peace, quick news & liquids', avoidFor: 'Rigid long-term disputes when Moon is weak' },
      Mars: { bestFor: 'Property, competition, court courage & technical repair', avoidFor: 'Marriage proposals, peaceful talks & calm requests' },
      Mercury: { bestFor: 'Exams, interviews, business deals, writing & accounts', avoidFor: 'Heavy emotional confrontation' },
      Jupiter: { bestFor: 'Marriage, children, wisdom, job growth & money approvals', avoidFor: 'Rarely unfavourable unless severely afflicted' },
      Venus: { bestFor: 'Love, marriage, vehicle, luxury, arts & finances', avoidFor: 'Harsh confrontation or legal attack' },
      Saturn: { bestFor: 'Routine job discipline, recovering lost items & old work', avoidFor: 'Quick urgent answers needing fast speed' },
    };

    return {
      planet: pl.id,
      bestFor: horaSuitability[pId]?.bestFor ?? pl.governsPlain,
      avoidFor: horaSuitability[pId]?.avoidFor ?? '-',
      isActive,
      tone,
      reason: isActive
        ? domain.horaAnalysis.plainMeaning
        : friendToLagna
        ? `Friendly to your Rising Ruler (${lagnaLord}) and placed in House ${pChart?.houseWholeSign ?? '-'}.`
        : `Mixed/neutral relation with Rising Ruler (${lagnaLord}) in House ${pChart?.houseWholeSign ?? '-'}.`,
    };
  });

  return (
    <div className="tab-stack">
      {(onBackToCalculations || onGoToPredictions) && (
        <div
          className="panel no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {onBackToCalculations && (
              <button type="button" className="btn-action" onClick={onBackToCalculations}>
                ← 2. Chart &amp; Calculations
              </button>
            )}
          </div>
          {onGoToPredictions && (
            <button
              type="button"
              className="seg-btn active"
              onClick={onGoToPredictions}
              style={{ padding: '8px 14px', borderRadius: 8 }}
            >
              4. View Prediction →
            </button>
          )}
        </div>
      )}

      {/* Header + Dropdown Controls */}
      <div className="panel">
        <div className="panel-header-inline">
          <BookOpen size={17} />
          <div>
            <h3 style={{ margin: 0 }}>Rashi, Planet, House, Hora &amp; Swara Guide</h3>
            <p className="panel-hint" style={{ margin: '2px 0 0' }}>
              Every item is colour-coded for <strong>your active chart</strong> so you immediately know what is Favourable, Mixed, or Unfavourable.
            </p>
          </div>
        </div>

        <div className="two-col-grid" style={{ marginTop: 12 }}>
          <label className="field">
            <span>Select Guide Category (Dropdown)</span>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as GuideSection)}
            >
              <option value="signs">12 Zodiac Signs (Rashis) — Nature, Direction &amp; Outcome</option>
              <option value="planets">9 Planets (Grahas) — Strength &amp; Meaning</option>
              <option value="houses">12 Houses (Bhavas) — Focus vs Challenging Houses</option>
              <option value="hora_swara">Hora Lords &amp; Nostril (Swara) Meanings</option>
            </select>
          </label>

          <label className="field">
            <span>Filter by Active Chart Meaning</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">Show All Items</option>
              <option value="focus">Active Focus / Highlighted Now</option>
              <option value="good">Favourable Only (Green)</option>
              <option value="warn">Mixed / Effort Needed (Amber)</option>
              <option value="bad">Unfavourable / Caution (Red)</option>
            </select>
          </label>
        </div>

        {/* Color Legend + Live Rising/Moon Snapshot */}
        <div className="sub-badges-row" style={{ marginTop: 12 }}>
          <span className="flag-tag good">Green = Favourable / Supportive</span>
          <span className="flag-tag warn">Amber = Mixed / Extra Effort</span>
          <span className="flag-tag bad">Red = Unfavourable / Needs Care</span>
        </div>

        <div className="two-col-grid" style={{ marginTop: 12 }}>
          <div className="info-badge" style={{ padding: '10px 12px' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.72 }}>
              Your Rising Sign (House 1) Right Now
            </span>
            <strong>
              {risingSignInfo.name} ({risingSignInfo.sanskrit}) — Ruler: {risingSignInfo.lord}
            </strong>
            <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
              <span className={toneBadgeClass(classical.lagnaTraits.udayaType === 'Shirshodaya' ? 'good' : classical.lagnaTraits.udayaType === 'Ubhayodaya' ? 'warn' : 'bad')}>
                {classical.lagnaTraits.udayaType === 'Shirshodaya' ? 'Favourable Head-Rising' : classical.lagnaTraits.udayaType === 'Ubhayodaya' ? 'Balanced Both-Ways' : 'Effort Hind-Rising'}
              </span>{' '}
              {risingSignInfo.plainMeaning}
            </div>
          </div>

          <div className="info-badge" style={{ padding: '10px 12px' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.72 }}>
              Your Moon, Hora &amp; Focus Houses Now
            </span>
            <strong>
              Moon in {moonSignInfo.name} (House {moonPos?.houseWholeSign ?? 1}) · Active {chart.panchanga.horaLord} Hora
            </strong>
            <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
              Focus Houses: <strong>{topicMeta.focusHousesPlain}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Table Content Driven by Dropdown */}
      <div className="panel">
        {section === 'signs' && (
          <div className="table-scroll">
            <table className="pro-table compact">
              <thead>
                <tr>
                  <th>Sign (Rashi)</th>
                  <th>Status in Chart</th>
                  <th>Ruler &amp; Direction</th>
                  <th>Nature &amp; Form</th>
                  <th>What It Means for Your Question</th>
                </tr>
              </thead>
              <tbody>
                {SIGNS.map((s) => {
                  const isActiveLagna = s.index === chart.ascendantSignIndex;
                  const isActiveMoon = s.index === moonPos?.signIndex;
                  const housePos = ((s.index - chart.ascendantSignIndex + 12) % 12) + 1;
                  const isFocusHouse = topicMeta.focusHouses.includes(housePos);
                  const isChallenging = [6, 8, 12].includes(housePos);

                  let tone: 'good' | 'warn' | 'bad' = 'warn';
                  if (s.udaya === 'Shirshodaya' && !isChallenging) tone = 'good';
                  else if (isChallenging || (s.udaya === 'Prishtodaya' && !isFocusHouse)) tone = 'bad';

                  if (statusFilter === 'focus' && !isActiveLagna && !isActiveMoon && !isFocusHouse) return null;
                  if (statusFilter === 'good' && tone !== 'good') return null;
                  if (statusFilter === 'warn' && tone !== 'warn') return null;
                  if (statusFilter === 'bad' && tone !== 'bad') return null;

                  return (
                    <tr key={s.index} className={isActiveLagna ? 'row-active' : ''}>
                      <td>
                        <strong>{s.index + 1}. {s.name}</strong> ({s.sanskrit})
                        <div style={{ fontSize: '0.74rem', opacity: 0.78 }}>
                          House {housePos} in this chart
                          {isActiveLagna && ' · ★ Rising Sign'}
                          {isActiveMoon && ' · ● Moon Here'}
                        </div>
                      </td>
                      <td>
                        <span className={toneBadgeClass(tone)}>{toneWord(tone)}</span>
                      </td>
                      <td>
                        <strong>{s.lord}</strong> · {s.cardinalDirection}
                        <div style={{ fontSize: '0.74rem', opacity: 0.78 }}>{s.fertility}</div>
                      </td>
                      <td>
                        {s.modality} · {s.element}
                        <div style={{ fontSize: '0.74rem', opacity: 0.78 }}>
                          {s.udaya === 'Shirshodaya' ? 'Head-Rising (+)' : s.udaya === 'Prishtodaya' ? 'Hind-Rising (Effort)' : 'Dual (+/-)'} · {s.odd ? 'Male' : 'Female'}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'normal', minWidth: 210 }}>{s.plainMeaning}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {section === 'planets' && (
          <div className="table-scroll">
            <table className="pro-table compact">
              <thead>
                <tr>
                  <th>Planet</th>
                  <th>Status in Chart</th>
                  <th>Current Placement &amp; Strength</th>
                  <th>Role, Direction &amp; Colour</th>
                  <th>What It Governs &amp; Live Meaning</th>
                </tr>
              </thead>
              <tbody>
                {PLANET_GUIDE_TABLE.map((pl) => {
                  const live = chart.planets.find((p) => p.id === pl.id)!;
                  const evalTone = evaluatePlanetMeaningTone(live, topicMeta.focusHouses);
                  const isFocus = topicMeta.focusHouses.includes(live.houseWholeSign) || live.id === chart.panchanga.horaLord;

                  if (statusFilter === 'focus' && !isFocus) return null;
                  if (statusFilter === 'good' && evalTone.tone !== 'good') return null;
                  if (statusFilter === 'warn' && evalTone.tone !== 'warn') return null;
                  if (statusFilter === 'bad' && evalTone.tone !== 'bad') return null;

                  return (
                    <tr key={pl.id} className={isFocus ? 'row-active' : ''}>
                      <td>
                        <strong>{pl.id}</strong> ({pl.gender})
                        <div style={{ fontSize: '0.74rem', opacity: 0.78 }}>
                          {pl.nature}
                          {live.id === chart.panchanga.horaLord && ' · Active Hora Lord'}
                        </div>
                      </td>
                      <td>
                        <span className={toneBadgeClass(evalTone.tone)}>{toneWord(evalTone.tone)}</span>
                      </td>
                      <td>
                        <strong>{live.signName} · H{live.houseWholeSign}</strong>
                        <div style={{ fontSize: '0.74rem', opacity: 0.78 }}>
                          {live.dignity}
                          {live.isRetrograde && live.id !== 'Rahu' && live.id !== 'Ketu' ? ' · Retrograde' : ''}
                          {live.isCombust ? ' · Combust' : ''}
                        </div>
                      </td>
                      <td>
                        {pl.direction} · {pl.colour}
                        <div style={{ fontSize: '0.74rem', opacity: 0.78 }}>
                          Age: {pl.ageYears} · Pace: {pl.timingScale}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'normal', minWidth: 220 }}>
                        <div><strong>Live:</strong> {evalTone.reason}</div>
                        <div style={{ fontSize: '0.76rem', opacity: 0.8, marginTop: 2 }}>{pl.governsPlain}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {section === 'houses' && (
          <div className="table-scroll">
            <table className="pro-table compact">
              <thead>
                <tr>
                  <th>House</th>
                  <th>Status for Question</th>
                  <th>Active Sign &amp; Ruler</th>
                  <th>Area of Life</th>
                  <th>Plain Meaning in Question</th>
                </tr>
              </thead>
              <tbody>
                {HOUSE_GUIDE_TABLE.map((h) => {
                  const isFocus = topicMeta.focusHouses.includes(h.house);
                  const signInHouse = SIGNS[(chart.ascendantSignIndex + h.house - 1) % 12];
                  const isChallenging = [6, 8, 12].includes(h.house);
                  const tone: 'good' | 'warn' | 'bad' = isFocus
                    ? 'good'
                    : isChallenging
                    ? 'bad'
                    : [1, 2, 4, 5, 7, 9, 10, 11].includes(h.house)
                    ? 'good'
                    : 'warn';

                  if (statusFilter === 'focus' && !isFocus) return null;
                  if (statusFilter === 'good' && tone !== 'good') return null;
                  if (statusFilter === 'warn' && tone !== 'warn') return null;
                  if (statusFilter === 'bad' && tone !== 'bad') return null;

                  return (
                    <tr key={h.house} className={isFocus ? 'row-active' : ''}>
                      <td>
                        <strong>House {h.house}</strong>
                        {isFocus && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>
                            ★ Primary Focus
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={toneBadgeClass(tone)}>
                          {isFocus ? 'Key Focus (+)' : isChallenging ? 'Obstacle House' : 'Supportive'}
                        </span>
                      </td>
                      <td>
                        <strong>{signInHouse.name}</strong>
                        <div style={{ fontSize: '0.74rem', opacity: 0.78 }}>Lord: {signInHouse.lord}</div>
                      </td>
                      <td><strong>{h.title}</strong></td>
                      <td style={{ whiteSpace: 'normal', minWidth: 210 }}>{h.governsPlain}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {section === 'hora_swara' && (
          <div className="tab-stack">
            <div className="table-scroll">
              <table className="pro-table compact">
                <thead>
                  <tr>
                    <th>Hora Lord</th>
                    <th>Status in This Chart</th>
                    <th>Best Suited Questions</th>
                    <th>Caution / Avoid For</th>
                    <th>Meaning Right Now</th>
                  </tr>
                </thead>
                <tbody>
                  {horaRows.map((row) => {
                    if (statusFilter === 'focus' && !row.isActive) return null;
                    if (statusFilter === 'good' && row.tone !== 'good') return null;
                    if (statusFilter === 'warn' && row.tone !== 'warn') return null;
                    if (statusFilter === 'bad' && row.tone !== 'bad') return null;

                    return (
                      <tr key={row.planet} className={row.isActive ? 'row-active' : ''}>
                        <td>
                          <strong>{row.planet} Hora</strong>
                          {row.isActive && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>
                              ★ Active Hora Now (#{chart.panchanga.horaNumber})
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={toneBadgeClass(row.tone)}>{toneWord(row.tone)}</span>
                        </td>
                        <td style={{ whiteSpace: 'normal' }}>{row.bestFor}</td>
                        <td style={{ whiteSpace: 'normal' }}>{row.avoidFor}</td>
                        <td style={{ whiteSpace: 'normal', minWidth: 200 }}>{row.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="table-scroll">
              <table className="pro-table compact">
                <thead>
                  <tr>
                    <th>Nostril (Swara)</th>
                    <th>Status Now</th>
                    <th>Nature &amp; Ruling Energy</th>
                    <th>Best Suited Work</th>
                    <th>What It Means</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      id: 'left_ida',
                      name: 'Left Nostril — Ida (Moon Swara)',
                      energy: 'Calm, cooling, steady & receptive',
                      work: 'Marriage, relationships, study/exams, childbirth, house purchase, joining work, travel, peaceful reconciliation.',
                      meaning: 'Supports smooth, gentle progress with low resistance when paired with calm planning.',
                    },
                    {
                      id: 'right_pingala',
                      name: 'Right Nostril — Pingala (Sun / Mars Swara)',
                      energy: 'Active, dynamic, bold & forceful',
                      work: 'Interviews, business negotiation, government work, court disputes, loans, competitive tasks, property assertion.',
                      meaning: 'Gives energy and decisive push in competitive or action-oriented matters; avoid impatience in soft matters.',
                    },
                    {
                      id: 'both_sushumna',
                      name: 'Both Nostrils Equally — Sushumna',
                      energy: 'Transitional / unsettled middle point',
                      work: 'Meditation & prayer only — pause material decisions briefly.',
                      meaning: 'Indicates an indecisive or shifting moment; wait until Left or Right nostril flows cleanly before final steps.',
                    },
                  ].map((sw) => {
                    const isActive = chart.input.swaraNostril === sw.id;
                    const swTone: 'good' | 'warn' | 'bad' =
                      isActive ? (domain.swaraAnalysis.tone === 'info' ? 'warn' : domain.swaraAnalysis.tone) : sw.id === 'both_sushumna' ? 'bad' : 'good';
                    return (
                      <tr key={sw.id} className={isActive ? 'row-active' : ''}>
                        <td>
                          <strong>{sw.name}</strong>
                          {isActive && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>
                              ★ Selected on Page 1
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={toneBadgeClass(swTone)}>
                            {isActive ? domain.swaraAnalysis.badgeText : toneWord(swTone)}
                          </span>
                        </td>
                        <td>{sw.energy}</td>
                        <td style={{ whiteSpace: 'normal' }}>{sw.work}</td>
                        <td style={{ whiteSpace: 'normal', minWidth: 200 }}>{sw.meaning}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
