'use client';

import { useState } from 'react';
import type { BeforeAfterPair } from '@/content/site';
import BeforeAfterSlider from './BeforeAfterSlider';
import styles from './BeforeAfterSection.module.css';

export interface BeforeAfterSectionProps {
  pairs: BeforeAfterPair[];
}

const MOBILE_VISIBLE_COUNT = 3;

export default function BeforeAfterSection({ pairs }: BeforeAfterSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = pairs.length > MOBILE_VISIBLE_COUNT;

  return (
    <section id="portfolio" className={styles.section}>
      <div className={styles.inner}>
        <h2>Our Work: Before &amp; After</h2>
        <p className={styles.subtitle}>Drag the divider to see the transformation</p>
        <div className={`${styles.grid} ${expanded ? styles.expanded : ''}`}>
          {pairs.map((pair, index) => (
            <div
              key={pair.id}
              className={index >= MOBILE_VISIBLE_COUNT ? styles.extra : undefined}
            >
              <BeforeAfterSlider pair={pair} />
            </div>
          ))}
        </div>
        {hasMore && (
          <button
            type="button"
            className={styles.viewMoreButton}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? 'Show Fewer' : `View ${pairs.length - MOBILE_VISIBLE_COUNT} More`}
          </button>
        )}
      </div>
    </section>
  );
}
