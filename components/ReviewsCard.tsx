import styles from './ReviewsCard.module.css';

export interface ReviewsCardProps {
  rating: number;
  reviewCount: number;
  profileUrl: string | null;
}

export default function ReviewsCard({ rating, reviewCount, profileUrl }: ReviewsCardProps) {
  const filledStars = Math.round(rating);
  return (
    <section id="reviews" className={styles.section}>
      <div className={styles.card}>
        <h2>What Our Clients Say</h2>
        <div className={styles.rating}>
          <span className={styles.score}>{rating.toFixed(1)}</span>
          <span className={styles.stars} aria-hidden="true">
            {'★'.repeat(filledStars)}
            {'☆'.repeat(5 - filledStars)}
          </span>
          <span className={styles.count}>({reviewCount}+ Google Reviews)</span>
        </div>
        {profileUrl ? (
          <a href={profileUrl} className={styles.btnGoogle}>
            View on Google
          </a>
        ) : (
          <span className={`${styles.btnGoogle} ${styles.btnDisabled}`} aria-disabled="true">
            Google reviews link coming soon
          </span>
        )}
      </div>
    </section>
  );
}
