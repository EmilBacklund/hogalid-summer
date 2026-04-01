import { COLORS } from '../../constants';

export function ProgressBar({ value, max = 100, color = COLORS.lime, height = 10 }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 99, height, overflow: "hidden", width: "100%" }}>
      <div style={{
        height: "100%", width: `${Math.min(100, value)}%`, background: color,
        borderRadius: 99, transition: "width 0.6s cubic-bezier(.4,2,.6,1)",
        boxShadow: `0 0 8px ${color}99`
      }} />
    </div>
  );
}
