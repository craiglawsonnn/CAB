import type { PricingItem, PricingPackage, QuoteService, StandaloneOption } from '@/content/site';
import styles from './PricingSection.module.css';

export interface PricingSectionProps {
  packages: PricingPackage[];
  standaloneOptions: StandaloneOption[];
  quoteServices: QuoteService[];
  items: PricingItem[];
}

export default function PricingSection({
  packages,
  standaloneOptions,
  quoteServices,
  items,
}: PricingSectionProps) {
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
              {pkg.tagline && <p className={styles.packageTagline}>{pkg.tagline}</p>}
              <h3>{pkg.name}</h3>
              <strong className={styles.packagePrice}>{pkg.price}</strong>
              <p className={styles.savingsNote}>{pkg.savingsNote}</p>
              <p className={styles.description}>{pkg.description}</p>
              {pkg.checklists.map((checklist) => (
                <div key={checklist.heading} className={styles.checklist}>
                  <h4 className={styles.checklistHeading}>{checklist.heading}</h4>
                  {checklist.note && <p className={styles.checklistNote}>{checklist.note}</p>}
                  <ul className={styles.featureList}>
                    {checklist.items.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className={styles.priceNote}>{pkg.pricingCaveat}</p>
              <a href="#contact" className={styles.ctaButton}>
                {pkg.ctaLabel}
              </a>
            </div>
          ))}
        </div>

        <h3 className={styles.standaloneHeading}>Only Need One?</h3>
        <p className={styles.subtitle}>You can book your interior or exterior service separately.</p>
        <ul className={styles.list}>
          {standaloneOptions.map((option) => (
            <li key={option.id}>
              {option.groupLabel && <p className={styles.groupLabel}>{option.groupLabel}</p>}
              <div className={styles.item}>
                <span>{option.name}</span>
                <strong className={styles.price}>{option.price}</strong>
              </div>
            </li>
          ))}
        </ul>

        <h3 className={styles.addonsHeading}>Correction &amp; Protection Services</h3>
        <p className={styles.subtitle}>Contact us for a personalized quote</p>
        <div className={styles.quoteServices}>
          {quoteServices.map((service) => (
            <div key={service.id} className={styles.quoteCard}>
              {service.tagline && <p className={styles.packageTagline}>{service.tagline}</p>}
              <h3>{service.name}</h3>
              <strong className={styles.packagePrice}>{service.startingPrice}</strong>
              <p className={styles.description}>{service.description}</p>
              <p className={styles.checklistNote}>Pricing varies depending on:</p>
              <ul className={styles.featureList}>
                {service.factors.map((factor) => (
                  <li key={factor}>{factor}</li>
                ))}
              </ul>
              <p className={styles.priceNote}>{service.note}</p>
              <a href="#contact" className={styles.ctaButton}>
                {service.ctaLabel}
              </a>
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
