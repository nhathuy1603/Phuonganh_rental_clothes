import { getReviews } from '../../services/catalog-service'
import GarmentIcon from '../common/GarmentIcon'

const STICKERS = ['✨', '💕', '👗', '🎀', '💫', '👍']

/** Port của renderReviews() gốc. */
export default function ReviewsSection() {
  const reviews = getReviews()
  return (
    <section className="wrap">
      <div className="section-title reveal">
        <div>
          <h2>💌 Khách hàng nói gì về Phương Anh</h2>
          <p>Những khoảnh khắc lung linh từ khách hàng đã thuê đồ tại shop</p>
        </div>
      </div>
      <div className="review-grid reveal">
        {reviews.map((r, i) => (
          <div className={`review-card tilt-${i % 3}`} key={r.name + i}>
            <span className="review-sticker">{STICKERS[i % STICKERS.length]}</span>
            <div className="review-photo" style={{ background: r.color + '20' }}>
              <GarmentIcon type={r.icon} colorHex={r.color} />
            </div>
            <div className="review-stars">
              {'★'.repeat(r.rating)}
              {'☆'.repeat(5 - r.rating)}
            </div>
            <p className="review-quote">&quot;{r.quote}&quot;</p>
            <div className="review-meta">
              <b>{r.name}</b>
              <span>đã thuê {r.item}</span>
            </div>
            <span className="review-badge">✓ Đã thuê tại Phương Anh</span>
          </div>
        ))}
      </div>
    </section>
  )
}
