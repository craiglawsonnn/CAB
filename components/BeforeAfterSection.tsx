'use client';

import { useState } from 'react';
import type { BeforeAfterPair } from '@/content/site';
import BeforeAfterSlider from './BeforeAfterSlider';
import styles from './BeforeAfterSection.module.css';

export interface BeforeAfterSectionProps {
  pairs: BeforeAfterPair[];
  heading: string;
  subtitle: string;
  viewMoreTemplate: string;
  showFewerLabel: string;
  beforeTagLabel: string;
  afterTagLabel: string;
  ariaLabelPrefix: string;
}

const MOBILE_VISIBLE_COUNT = 3;

export default function BeforeAfterSection({
  pairs,
  heading,
  subtitle,
  viewMoreTemplate,
  showFewerLabel,
  beforeTagLabel,
  afterTagLabel,
  ariaLabelPrefix,
}: BeforeAfterSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = pairs.length > MOBILE_VISIBLE_COUNT;

  return (
    <section id="portfolio" className={styles.section}>
      <div className={styles.inner}>
        <h2>{heading}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={`${styles.grid} ${expanded ? styles.expanded : ''}`}>
          {pairs.map((pair, index) => (
            <div
              key={pair.id}
              className={index >= MOBILE_VISIBLE_COUNT ? styles.extra : undefined}
            >
              <BeforeAfterSlider
                pair={pair}
                beforeTagLabel={beforeTagLabel}
                afterTagLabel={afterTagLabel}
                ariaLabelPrefix={ariaLabelPrefix}
              />
            </div>
          ))}
        </div>
        {hasMore && (
          <button
            type="button"
            className={styles.viewMoreButton}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded
              ? showFewerLabel
              : viewMoreTemplate.replace('{count}', String(pairs.length - MOBILE_VISIBLE_COUNT))}
          </button>
        )}
      </div>
    </section>
  );
}
