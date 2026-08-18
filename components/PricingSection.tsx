import type { PricingItem } from '@/content/site';
import styles from './PricingSection.module.css';

export interface PricingSectionProps {
  items: PricingItem[];
  addonsImageSrc: string;
  pricesImageSrc: string;
  headlightImageSrc: string;
  detailsImageSrc: string;
}

export default function PricingSection({
  items,
  addonsImageSrc,
  pricesImageSrc,
  headlightImageSrc,
  detailsImageSrc,
}: PricingSectionProps) {
  return (
    <section id="services" className={styles.section}>
      <div className={styles.inner}>
        <h2>Add-On Services</h2>
        <p className={styles.subtitle}>Stack these onto any base package</p>
        <div className={styles.layout}>
          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.id} className={styles.item}>
                <span>
                  {item.name}
                  {item.detail && <small className={styles.detail}> ({item.detail})</small>}
                </span>
                <strong className={styles.price}>{item.price}</strong>
              </li>
            ))}
          </ul>
          <div className={styles.imageGrid}>
            <img src={addonsImageSrc} alt="Detailing add-on services" />
            <img src={pricesImageSrc} alt="Pricing reference sheet" />
            <img src={headlightImageSrc} alt="Headlight restoration before and after" />
            <img src={detailsImageSrc} alt="Detailing close-up" />
          </div>
        </div>
      </div>
    </section>
  );
}
