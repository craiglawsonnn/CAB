import styles from './ReviewsCard.module.css';

export interface ReviewsCardProps {
  rating: number;
  reviewCount: number;
  profileUrl: string | null;
  heading: string;
  countTemplate: string;
  viewButtonLabel: string;
  pendingLabel: string;
}

export default function ReviewsCard({
  rating,
  reviewCount,
  profileUrl,
  heading,
  countTemplate,
  viewButtonLabel,
  pendingLabel,
}: ReviewsCardProps) {
  const filledStars = Math.round(rating);
  return (
    <section id="reviews" className={styles.section}>
      <div className={styles.card}>
        <h2>{heading}</h2>
        <div className={styles.rating}>
          <span className={styles.score}>{rating.toFixed(1)}</span>
          <span className={styles.stars} aria-hidden="true">
            {'★'.repeat(filledStars)}
            {'☆'.repeat(5 - filledStars)}
          </span>
          <span className={styles.count}>{countTemplate.replace('{count}', String(reviewCount))}</span>
        </div>
        {profileUrl ? (
          <a href={profileUrl} className={styles.btnGoogle}>
            {viewButtonLabel}
          </a>
        ) : (
          <span className={`${styles.btnGoogle} ${styles.btnDisabled}`} aria-disabled="true">
            {pendingLabel}
          </span>
        )}
      </div>
    </section>
  );
}
