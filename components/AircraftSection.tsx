import type { AircraftConfig } from '@/content/site';
import styles from './AircraftSection.module.css';

export interface AircraftSectionProps {
  content: AircraftConfig;
  instagramDmUrl: string | null;
  instagramPendingLabel: string;
  phoneDisplay: string;
  phoneHref: string;
}

export default function AircraftSection({
  content,
  instagramDmUrl,
  instagramPendingLabel,
  phoneDisplay,
  phoneHref,
}: AircraftSectionProps) {
  const [leadPhoto, secondPhoto, ...restPhotos] = content.photos;
  const onSitePhoto = restPhotos.find((photo) => photo.id === 'aircraft-on-site');
  const stripPhotos = restPhotos.filter((photo) => photo !== onSitePhoto);
  const { featured, customQuote, mobile } = content;

  return (
    <section id="aircraft" className={styles.section} aria-labelledby="aircraft-heading">
      <div className={styles.inner}>
        <div className={styles.intro}>
          <div className={styles.introCopy}>
            <p className={styles.eyebrow}>{content.eyebrow}</p>
            <h2 id="aircraft-heading" className={styles.heading}>
              {content.heading}
            </h2>
            {content.intro.map((paragraph) => (
              <p key={paragraph} className={styles.paragraph}>
                {paragraph}
              </p>
            ))}
            <ul className={styles.credentials} aria-label="Our aviation background">
              {content.credentials.map((credential) => (
                <li key={credential}>{credential}</li>
              ))}
            </ul>
          </div>

          {leadPhoto && secondPhoto && (
            <div className={styles.introPhotos}>
              <figure className={`${styles.photo} ${styles.photoTall}`}>
                <img src={leadPhoto.src} alt={leadPhoto.alt} loading="lazy" />
                <figcaption>{leadPhoto.caption}</figcaption>
              </figure>
              <figure className={`${styles.photo} ${styles.photoOffset}`}>
                <img src={secondPhoto.src} alt={secondPhoto.alt} loading="lazy" />
                <figcaption>{secondPhoto.caption}</figcaption>
              </figure>
            </div>
          )}
        </div>

        <blockquote className={styles.quote}>
          <p>{content.pullQuote}</p>
          <footer>{content.tagline}</footer>
        </blockquote>

        <h3 className={styles.packagesHeading}>{content.packagesHeading}</h3>
        <div className={styles.packages}>
          <article className={styles.ticket} aria-labelledby={`${featured.id}-name`}>
            <header className={styles.ticketHeader}>
              <h4 id={`${featured.id}-name`}>{featured.name}</h4>
              <strong className={styles.ticketPrice}>{featured.price}</strong>
            </header>
            <p className={styles.includesLabel}>{featured.includesLabel}</p>
            <ol className={styles.checklist}>
              {featured.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <p className={styles.note}>{featured.note}</p>
            <p className={styles.footnote}>{featured.footnote}</p>
          </article>

          <article className={styles.quoteCard} aria-labelledby="aircraft-custom-quote">
            <h4 id="aircraft-custom-quote">{customQuote.heading}</h4>
            <p>{customQuote.body}</p>
            <p className={styles.quoteCta}>{customQuote.cta}</p>
            <div className={styles.quoteActions}>
              {instagramDmUrl && (
                <a href={instagramDmUrl} className={styles.btnPrimary}>
                  {content.instagramButtonLabel}
                </a>
              )}
              <a href={phoneHref} className={styles.btnSecondary}>
                {content.callButtonPrefix}
                {phoneDisplay}
              </a>
            </div>
          </article>
        </div>

        {stripPhotos.length > 0 && (
          <div className={styles.strip}>
            {stripPhotos.map((photo) => (
              <figure key={photo.id} className={styles.photo}>
                <img src={photo.src} alt={photo.alt} loading="lazy" />
                <figcaption>{photo.caption}</figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className={styles.mobile}>
          {onSitePhoto && (
            <figure className={`${styles.photo} ${styles.mobilePhoto}`}>
              <img src={onSitePhoto.src} alt={onSitePhoto.alt} loading="lazy" />
            </figure>
          )}
          <div className={styles.mobileCopy}>
            <p className={styles.eyebrow}>{mobile.heading}</p>
            <h3 className={styles.mobileKicker}>{mobile.kicker}</h3>
            <p className={styles.paragraph}>{mobile.body}</p>
            <p className={styles.paragraph}>{mobile.cta}</p>
            <div className={styles.actions}>
              {instagramDmUrl ? (
                <a href={instagramDmUrl} className={styles.btnPrimary}>
                  {content.instagramButtonLabel}
                </a>
              ) : (
                <span className={`${styles.btnPrimary} ${styles.btnDisabled}`} aria-disabled="true">
                  {instagramPendingLabel}
                </span>
              )}
              <a href={phoneHref} className={styles.btnSecondary}>
                {content.callButtonPrefix}
                {phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
