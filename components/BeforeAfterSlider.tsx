'use client';

import { useCallback, useRef, useState } from 'react';
import type { BeforeAfterPair } from '@/content/site';
import { clampPercent, percentFromClientX } from '@/lib/sliderMath';
import styles from './BeforeAfterSlider.module.css';

export interface BeforeAfterSliderProps {
  pair: BeforeAfterPair;
}

export default function BeforeAfterSlider({ pair }: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [percent, setPercent] = useState(50);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPercent(percentFromClientX(clientX, rect));
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    updateFromClientX(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updateFromClientX(event.clientX);
  };

  const handlePointerUp = () => {
    draggingRef.current = false;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setPercent((p) => clampPercent(p - 5));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setPercent((p) => clampPercent(p + 5));
    }
  };

  return (
    <div className={styles.wrapper}>
      <div
        ref={containerRef}
        className={styles.container}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <img src={pair.afterSrc} alt={pair.afterAlt} className={styles.imageAfter} />
        <img
          src={pair.beforeSrc}
          alt={pair.beforeAlt}
          className={styles.imageBefore}
          style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
        />
        <span className={styles.tagBefore}>Before</span>
        <span className={styles.tagAfter}>After</span>
        <div
          className={styles.handle}
          style={{ left: `${percent}%` }}
          role="slider"
          aria-label={`Before and after comparison: ${pair.caption}`}
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        />
      </div>
      <p className={styles.caption}>{pair.caption}</p>
    </div>
  );
}
