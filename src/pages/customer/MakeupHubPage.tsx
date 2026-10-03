import type { MakeupCategory } from '../../types/catalog'
import { money } from '../../utils/format'
import { preventAnd } from '../../utils/events'

interface MakeupHubPageProps {
  makeupCategories: MakeupCategory[]
  onOpenService: (id: string) => void
  onBack: () => void
}

export default function MakeupHubPage({ makeupCategories, onOpenService, onBack }: MakeupHubPageProps) {
  return (
    <section className="wrap" style={{ paddingTop: '34px', paddingBottom: '60px' }}>
      <div className="section-title reveal" style={{ marginBottom: '18px' }}>
        <div>
          <div className="eyebrow-plain">Dịch vụ trang điểm</div>
          <h2 style={{ margin: '6px 0 0' }}>Chọn dịch vụ phù hợp với dịp của bạn</h2>
        </div>
        <a href="#" className="link-btn" onClick={preventAnd(onBack)}>
          ← Quay lại
        </a>
      </div>

      <div className="makeup-service-grid">
        {makeupCategories.map((service) => (
          <article key={service.id} className="makeup-service-card reveal">
            <div className="makeup-service-figure">
              {service.images.length > 0 ? (
                <img src={service.images[0]} alt={service.name} />
              ) : (
                <span>{service.emoji}</span>
              )}
            </div>
            <div className="makeup-service-body">
              <div className="makeup-service-topline">
                <span className="makeup-service-emoji">{service.emoji}</span>
                <span className="makeup-service-price">Từ {money(service.priceFrom)}</span>
              </div>
              <h3>{service.name}</h3>
              <p>{service.tagline}</p>
              <ul>
                {service.highlights.slice(0, 2).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button type="button" className="btn btn-primary btn-block" onClick={() => onOpenService(service.id)}>
                Xem chi tiết
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
