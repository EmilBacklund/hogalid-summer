import { useState } from 'react';
import { COLORS } from '../../constants';

export function Card({ children, style = {}, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="overflow-hidden cursor-pointer"
      style={{
        background: hov ? COLORS.cardHover : COLORS.card,
        borderRadius: 18,
        padding: '18px 20px',
        border: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
