import type { PricingItem, PricingPackage } from '@/content/site';
import styles from './PricingSection.module.css';

export interface PricingSectionProps {
  packages: PricingPackage[];
  items: PricingItem[];
}

export default function PricingSection({ packages, items }: PricingSectionProps) {
  return (
    <section id="services" className={styles.section}>
      <div className={styles.inner}>
        <h2>Packages &amp; Pricing</h2>
        <p className={styles.subtitle}>Choose the level of care your car deserves</p>
        <div className={styles.packages}>
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`${styles.packageCard} ${pkg.highlight ? styles.packageHighlight : ''}`}
            >
              <h3>{pkg.name}</h3>
              <p className={styles.packageTagline}>{pkg.tagline}</p>
              {pkg.includesNote && <p className={styles.includesNote}>{pkg.includesNote}</p>}
              <ul className={styles.featureList}>
                {pkg.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <div className={styles.packageFooter}>
                <span className={styles.duration}>{pkg.duration}</span>
                <strong className={styles.packagePrice}>{pkg.price}</strong>
              </div>
              <p className={styles.priceNote}>{pkg.priceNote}</p>
            </div>
          ))}
        </div>

        <h3 className={styles.addonsHeading}>Add-On Services</h3>
        <p className={styles.subtitle}>Stack these onto any package</p>
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
      </div>
    </section>
  );
}
