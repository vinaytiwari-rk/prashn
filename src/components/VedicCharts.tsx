import React, { useEffect, useMemo, useState } from 'react';
import { SIGNS } from '../astro/constants';
import type { CompleteHoraryAnalysis } from '../astro/horaryAnalyzer';
import { getTopicMeta } from '../astro/questionCatalog';

type SecondaryChartMode = 'kp_bhava' | 'd9' | 'hora_lagna';

interface VedicChartsProps {
  analysis: CompleteHoraryAnalysis;
}

interface PlacedItem {
  label: string;
  title: string;
  isRetro?: boolean;
  isCombust?: boolean;
}

interface DiamondSvgProps {
  title: string;
  eyebrow: string;
  ascSignIdx: number;
  houseSigns: number[];
  byHouseItems: Map<number, PlacedItem[]>;
  focusHouses: number[];
  primaryFocusHouse: number;
  headerRight?: React.ReactNode;
}

const NORTH_CENTERS: Record<number, { x: number; y: number; signY: number }> = {
  1: { x: 200, y: 108, signY: 168 },
  2: { x: 105, y: 42, signY: 78 },
  3: { x: 46, y: 102, signY: 102 },
  4: { x: 105, y: 200, signY: 200 },
  5: { x: 46, y: 300, signY: 300 },
  6: { x: 105, y: 356, signY: 325 },
  7: { x: 200, y: 288, signY: 235 },
  8: { x: 295, y: 356, signY: 325 },
  9: { x: 354, y: 300, signY: 300 },
  10: { x: 295, y: 200, signY: 200 },
  11: { x: 354, y: 102, signY: 102 },
  12: { x: 295, y: 42, signY: 78 },
};

const HOUSE_POLYGONS: Record<number, string> = {
  1: '200,8 296,104 200,200 104,104',
  2: '8,8 200,8 104,104',
  3: '8,8 104,104 8,200',
  4: '104,104 200,200 104,296 8,200',
  5: '8,200 104,296 8,392',
  6: '8,392 104,296 200,392',
  7: '104,296 200,200 296,296 200,392',
  8: '200,392 296,296 392,392',
  9: '296,296 392,200 392,392',
  10: '200,200 296,104 392,200 296,296',
  11: '296,104 392,8 392,200',
  12: '200,8 392,8 296,104',
};

const DiamondChartCard: React.FC<DiamondSvgProps> = ({
  title,
  eyebrow,
  ascSignIdx,
  houseSigns,
  byHouseItems,
  focusHouses,
  primaryFocusHouse,
  headerRight,
}) => {
  const renderLines = (items: PlacedItem[], x: number, y: number, perRow = 2) => {
    const rows: PlacedItem[][] = [];
    for (let i = 0; i < items.length; i += perRow) {
      rows.push(items.slice(i, i + perRow));
    }
    const startY = y - ((rows.length - 1) * 14) / 2;
    return rows.map((row, rIdx) => (
      <text
        key={rIdx}
        x={x}
        y={startY + rIdx * 14}
        textAnchor="middle"
        dominantBaseline="central"
        className="chart-planet-text"
      >
        {row.map((it, i) => (
          <tspan
            key={it.label + i}
            className={
              it.isCombust ? 'chart-combust' : it.isRetro ? 'chart-retro' : ''
            }
          >
            {i > 0 ? ' ' : ''}
            {it.label}
          </tspan>
        ))}
      </text>
    ));
  };

  return (
    <div className="panel chart-panel">
      <div className="panel-header-row" style={{ marginBottom: 8 }}>
        <div>
          <span className="panel-eyebrow">{eyebrow}</span>
          <h3 className="panel-title">
            {title} · {SIGNS[ascSignIdx].name}
          </h3>
        </div>
        {headerRight}
      </div>

      <div className="chart-card">
        <svg
          viewBox="0 0 400 400"
          className="kundali-svg"
          role="img"
          aria-label={`${title} — North Indian Diamond Chart`}
        >
          <rect x="8" y="8" width="384" height="384" className="chart-frame" rx="4" />

          {houseSigns.map((_, hZero) => {
            const h = hZero + 1;
            if (!focusHouses.includes(h)) return null;
            const isPrimary = h === primaryFocusHouse;
            return (
              <polygon
                key={`hl-${h}`}
                points={HOUSE_POLYGONS[h]}
                fill={isPrimary ? 'rgba(217, 119, 6, 0.14)' : 'rgba(217, 119, 6, 0.05)'}
              />
            );
          })}

          <line x1="8" y1="8" x2="392" y2="392" className="chart-line" />
          <line x1="392" y1="8" x2="8" y2="392" className="chart-line" />
          <polygon points="200,8 392,200 200,392 8,200" className="chart-diamond" />

          {houseSigns.map((signIdx, hZero) => {
            const h = hZero + 1;
            const pos = NORTH_CENTERS[h];
            const items = byHouseItems.get(h) ?? [];
            const signOffsetX =
              h === 3 ? 24 : h === 11 ? -24 : h === 5 ? 24 : h === 9 ? -24 : h === 4 ? 38 : h === 10 ? -38 : 0;
            return (
              <g key={h}>
                <text
                  x={pos.x + signOffsetX}
                  y={pos.signY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="chart-sign-num"
                >
                  {signIdx + 1}
                </text>
                {renderLines(items, pos.x, pos.y, items.length > 4 ? 3 : 2)}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export const VedicCharts: React.FC<VedicChartsProps> = ({ analysis }) => {
  const { chart, kp } = analysis;
  const preferredSecondary: SecondaryChartMode =
    chart.input.castingMode === 'kp_horary'
      ? 'kp_bhava'
      : chart.input.castingMode === 'hora_lagna'
      ? 'hora_lagna'
      : 'd9';
  const [secondaryMode, setSecondaryMode] = useState<SecondaryChartMode>(preferredSecondary);

  useEffect(() => {
    setSecondaryMode(preferredSecondary);
  }, [preferredSecondary]);
  const topicMeta = getTopicMeta(chart.input.category);
  const primaryFocusHouse = topicMeta.focusHouses[0] ?? 1;

  const d1Data = useMemo(() => {
    const baseAsc = chart.ascendantSignIndex;
    const houseSigns = Array.from({ length: 12 }, (_, i) => (baseAsc + i) % 12);
    const byHouse = new Map<number, PlacedItem[]>();
    for (let i = 1; i <= 12; i++) byHouse.set(i, []);

    chart.planets.forEach((p) => {
      const h = ((p.signIndex - baseAsc + 12) % 12) + 1;
      byHouse.get(h)!.push({
        label: `${p.short}${p.isRetrograde && p.id !== 'Rahu' && p.id !== 'Ketu' ? '*' : ''}${p.isCombust ? '^' : ''}`,
        title: `${p.id} ${p.signName} ${p.dmsInSign} (${p.dignity})`,
        isRetro: p.isRetrograde && p.id !== 'Rahu' && p.id !== 'Ketu',
        isCombust: p.isCombust,
      });
    });

    return { ascSignIdx: baseAsc, houseSigns, byHouse };
  }, [chart]);

  const secondaryData = useMemo(() => {
    const byHouse = new Map<number, PlacedItem[]>();
    for (let i = 1; i <= 12; i++) byHouse.set(i, []);

    if (secondaryMode === 'kp_bhava') {
      const baseAsc = kp.cusps[0].signIndex;
      const houseSigns = kp.cusps.map((c) => c.signIndex);
      kp.planets.forEach((p) => {
        byHouse.get(p.kpHouse)!.push({
          label: `${p.planet.slice(0, 2)}${p.isTrueRetrograde && p.planet !== 'Rahu' && p.planet !== 'Ketu' ? '*' : ''}`,
          title: `${p.planet} in KP House ${p.kpHouse} (${p.signName} ${p.dmsInSign})`,
          isRetro: p.isTrueRetrograde && p.planet !== 'Rahu' && p.planet !== 'Ketu',
        });
      });
      return {
        ascSignIdx: baseAsc,
        houseSigns,
        byHouse,
        title: chart.input.castingMode === 'kp_horary' ? `KP Horary Chart (#${chart.input.kpNumber})` : 'KP Bhava Chart',
        eyebrow: `KP Placidus Cusps · Focus Cusp ${primaryFocusHouse}`,
      };
    }

    if (secondaryMode === 'hora_lagna') {
      const hlAsc = chart.horaLagnaSignIndex;
      const houseSigns = Array.from({ length: 12 }, (_, i) => (hlAsc + i) % 12);
      chart.planets.forEach((p) => {
        const h = ((p.signIndex - hlAsc + 12) % 12) + 1;
        byHouse.get(h)!.push({
          label: `${p.short}${p.isRetrograde && p.id !== 'Rahu' && p.id !== 'Ketu' ? '*' : ''}`,
          title: `${p.id} in Hora Lagna House ${h} (${p.signName})`,
          isRetro: p.isRetrograde && p.id !== 'Rahu' && p.id !== 'Ketu',
          isCombust: p.isCombust,
        });
      });
      return {
        ascSignIdx: hlAsc,
        houseSigns,
        byHouse,
        title: `Hora Lagna Chart (${chart.horaLagnaSignName})`,
        eyebrow: `Active Hora: ${chart.panchanga.horaLord} (#${chart.panchanga.horaNumber})`,
      };
    }

    const baseNavAsc = Math.floor(chart.ascendantSidereal / (30 / 9)) % 12;
    const houseSigns = Array.from({ length: 12 }, (_, i) => (baseNavAsc + i) % 12);
    chart.planets.forEach((p) => {
      const h = ((p.navamsaSignIndex - baseNavAsc + 12) % 12) + 1;
      byHouse.get(h)!.push({
        label: `${p.short}${p.isRetrograde && p.id !== 'Rahu' && p.id !== 'Ketu' ? '*' : ''}`,
        title: `${p.id} Navamsa (${SIGNS[p.navamsaSignIndex].name})`,
        isRetro: p.isRetrograde && p.id !== 'Rahu' && p.id !== 'Ketu',
      });
    });
    return {
      ascSignIdx: baseNavAsc,
      houseSigns,
      byHouse,
      title: 'Navamsa Strength Chart (D-9)',
      eyebrow: 'Inner Fruit & Planetary Strength',
    };
  }, [chart, kp, secondaryMode, primaryFocusHouse]);

  return (
    <div className="two-col-grid">
      <DiamondChartCard
        title={
          chart.rotatedReference?.isRotated
            ? `Rotated Prashna Rasi (${chart.rotatedReference.planet || 'House'} = H1)`
            : 'Prashna Rasi Chart (D-1)'
        }
        eyebrow={`North Indian Chart · Focus House ${primaryFocusHouse}`}
        ascSignIdx={d1Data.ascSignIdx}
        houseSigns={d1Data.houseSigns}
        byHouseItems={d1Data.byHouse}
        focusHouses={topicMeta.focusHouses}
        primaryFocusHouse={primaryFocusHouse}
        headerRight={<span className="info-badge">Retro * · Combust ^</span>}
      />

      <DiamondChartCard
        title={secondaryData.title}
        eyebrow={secondaryData.eyebrow}
        ascSignIdx={secondaryData.ascSignIdx}
        houseSigns={secondaryData.houseSigns}
        byHouseItems={secondaryData.byHouse}
        focusHouses={topicMeta.focusHouses}
        primaryFocusHouse={primaryFocusHouse}
        headerRight={
          <label className="field" style={{ minWidth: 155 }}>
            <select
              aria-label="Secondary chart view"
              value={secondaryMode}
              onChange={(e) => setSecondaryMode(e.target.value as SecondaryChartMode)}
              style={{ minHeight: 36, padding: '4px 8px', fontSize: '0.8rem' }}
            >
              <option value="kp_bhava">KP Bhava / Horary Chart</option>
              <option value="d9">Navamsa Strength (D-9)</option>
              <option value="hora_lagna">Hora Lagna Chart</option>
            </select>
          </label>
        }
      />
    </div>
  );
};
