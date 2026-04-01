import { COLORS } from '../../constants';

export function Confetti({ active }) {
  if (!active) return null;
  const pieces = Array.from({ length: 32 }, (_, i) => i);
  const colors = [COLORS.yellow, COLORS.red, "#fff", COLORS.navy, COLORS.yellow, "#ff9f9f"];
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999, overflow: "hidden" }}>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(i => (
        <div key={i} style={{
          position: "absolute",
          left: `${(i * 37) % 100}%`,
          top: `-${10 + (i * 13) % 30}px`,
          width: (i % 3 === 0) ? 10 : 7,
          height: (i % 3 === 0) ? 10 : 14,
          borderRadius: i % 2 === 0 ? "50%" : 2,
          background: colors[i % colors.length],
          animation: `confettiFall ${1.5 + (i % 5) * 0.3}s ease-in ${(i % 7) * 0.1}s forwards`,
        }} />
      ))}
    </div>
  );
}
