// SVG arc gauge — no dependencies
export default function OEEGauge({ value = 0, label = "OEE", size = 120 }) {
  const pct = Math.min(100, Math.max(0, value));
  const r = 44;
  const cx = 60, cy = 60;
  const startAngle = -210;
  const sweep = 240;
  const toRad = (d) => (d * Math.PI) / 180;
  const arcPath = (start, end) => {
    const s = toRad(start), e = toRad(end);
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  const fillEnd = startAngle + (sweep * pct) / 100;
  const color = pct >= 85 ? "#22c55e" : pct >= 65 ? "#f59e0b" : "#ef4444";

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {/* Track */}
      <path d={arcPath(startAngle, startAngle + sweep)} fill="none" stroke="#374151" strokeWidth="10" strokeLinecap="round" />
      {/* Fill */}
      {pct > 0 && (
        <path d={arcPath(startAngle, fillEnd)} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
      )}
      {/* Value text */}
      <text x="60" y="58" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white">
        {pct.toFixed(1)}%
      </text>
      <text x="60" y="74" textAnchor="middle" fontSize="10" fill="#9ca3af">
        {label}
      </text>
    </svg>
  );
}
