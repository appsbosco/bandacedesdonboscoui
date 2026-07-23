import { useId, useMemo } from "react";
import PropTypes from "prop-types";

const VIEW_BOX = {
  width: 185.6,
  height: 181.8,
};

const LOGO_URL = "/images/torlogo.svg";

function createUnits(total) {
  if (total <= 0) return [];

  const columns = Math.min(20, total);
  const rows = Math.ceil(total / columns);
  const rowHeight = VIEW_BOX.height / rows;
  const units = [];

  for (let row = 0; row < rows; row += 1) {
    const rowStart = row * columns;
    const unitsInRow = Math.min(columns, total - rowStart);
    const columnWidth = VIEW_BOX.width / unitsInRow;

    for (let column = 0; column < unitsInRow; column += 1) {
      const index = rowStart + column;
      const x = column * columnWidth;
      const y = row * rowHeight;
      const centerX = x + columnWidth / 2;
      const centerY = y + rowHeight / 2;
      const focalX = VIEW_BOX.width * 0.52;
      const focalY = VIEW_BOX.height * 0.42;
      const normalizedX = (centerX - focalX) / VIEW_BOX.width;
      const normalizedY = (centerY - focalY) / VIEW_BOX.height;

      units.push({
        index,
        x,
        y,
        width: columnWidth,
        height: rowHeight,
        distance: Math.hypot(normalizedX, normalizedY * 1.08),
      });
    }
  }

  return units
    .sort((a, b) => a.distance - b.distance || a.index - b.index)
    .map((unit, revealOrder) => ({ ...unit, revealOrder }));
}

function UnitRect({ unit, inset = 0.34, children, ...props }) {
  return (
    <rect
      x={unit.x + inset}
      y={unit.y + inset}
      width={Math.max(unit.width - inset * 2, 0)}
      height={Math.max(unit.height - inset * 2, 0)}
      rx={Math.min(0.9, unit.width * 0.12, unit.height * 0.12)}
      {...props}
    >
      {children}
    </rect>
  );
}

UnitRect.propTypes = {
  unit: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
  inset: PropTypes.number,
  children: PropTypes.node,
};

export default function RoseParadeProgressMark({ total, funded, t }) {
  const reactId = useId().replace(/:/g, "");
  const fundedClipId = `${reactId}-funded-clip`;
  const logoMaskId = `${reactId}-logo-mask`;
  const pendingFilterId = `${reactId}-pending-filter`;
  const nextHaloId = `${reactId}-next-halo`;
  const titleId = `${reactId}-title`;
  const descriptionId = `${reactId}-description`;

  const units = useMemo(() => createUnits(total), [total]);
  const safeFunded = Math.min(Math.max(funded, 0), total);
  const fundedUnits = useMemo(
    () => units.filter((unit) => unit.revealOrder < safeFunded),
    [safeFunded, units]
  );
  const nextUnit = safeFunded < total ? units.find((unit) => unit.revealOrder === safeFunded) : null;

  return (
    <svg
      viewBox={`0 0 ${VIEW_BOX.width} ${VIEW_BOX.height}`}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
      className="h-auto w-full overflow-visible"
      preserveAspectRatio="xMidYMid meet"
    >
      <title id={titleId}>{t("donate.logoProgress.title")}</title>
      <desc id={descriptionId}>
        {t("donate.logoProgress.description", { funded: safeFunded, total })}
      </desc>

      <defs>
        <mask
          id={logoMaskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={VIEW_BOX.width}
          height={VIEW_BOX.height}
          style={{ maskType: "alpha" }}
        >
          <image
            href={LOGO_URL}
            x="0"
            y="0"
            width={VIEW_BOX.width}
            height={VIEW_BOX.height}
            preserveAspectRatio="xMidYMid meet"
          />
        </mask>

        <clipPath id={fundedClipId} clipPathUnits="userSpaceOnUse">
          {fundedUnits.map((unit) => (
            <UnitRect key={unit.index} unit={unit} />
          ))}
        </clipPath>

        <filter id={pendingFilterId} colorInterpolationFilters="sRGB">
          <feFlood floodColor="#e2e8f0" result="pendingColor" />
          <feComposite in="pendingColor" in2="SourceAlpha" operator="in" />
        </filter>

        <filter
          id={nextHaloId}
          x="-60%"
          y="-60%"
          width="220%"
          height="220%"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow dx="0" dy="0" stdDeviation="1.35" floodColor="#ed1c24" floodOpacity=".5" />
        </filter>
      </defs>

      <image
        href={LOGO_URL}
        x="0"
        y="0"
        width={VIEW_BOX.width}
        height={VIEW_BOX.height}
        preserveAspectRatio="xMidYMid meet"
        filter={`url(#${pendingFilterId})`}
        opacity=".72"
      />

      <image
        href={LOGO_URL}
        x="0"
        y="0"
        width={VIEW_BOX.width}
        height={VIEW_BOX.height}
        preserveAspectRatio="xMidYMid meet"
        clipPath={`url(#${fundedClipId})`}
        className="rose-progress-funded"
      />

      <g
        mask={`url(#${logoMaskId})`}
        fill="none"
        stroke="#f8fafc"
        strokeOpacity=".48"
        strokeWidth=".34"
        pointerEvents="none"
        aria-hidden="true"
      >
        {units.map((unit) => (
          <UnitRect key={unit.index} unit={unit} inset={0.17} />
        ))}
      </g>

      {nextUnit && (
        <g
          mask={`url(#${logoMaskId})`}
          fill="none"
          stroke="#ed1c24"
          strokeWidth=".9"
          filter={`url(#${nextHaloId})`}
          className="rose-progress-next"
          pointerEvents="none"
          aria-hidden="true"
        >
          <UnitRect unit={nextUnit} inset={0.42} />
        </g>
      )}

      <g mask={`url(#${logoMaskId})`} aria-hidden="true">
        {units.map((unit) => {
          const isFunded = unit.revealOrder < safeFunded;
          return (
            <UnitRect
              key={unit.index}
              unit={unit}
              inset={0.18}
              fill="transparent"
              stroke="transparent"
              strokeWidth=".65"
              pointerEvents="all"
              className="cursor-crosshair transition-colors duration-150 hover:fill-white/30 hover:stroke-slate-700 motion-reduce:transition-none"
            >
              <title>
                {t(
                  isFunded
                    ? "donate.logoProgress.unitFunded"
                    : "donate.logoProgress.unitPending",
                  {
                    number: unit.revealOrder + 1,
                    total,
                  }
                )}
              </title>
            </UnitRect>
          );
        })}
      </g>
    </svg>
  );
}

RoseParadeProgressMark.propTypes = {
  total: PropTypes.number.isRequired,
  funded: PropTypes.number.isRequired,
  t: PropTypes.func.isRequired,
};
