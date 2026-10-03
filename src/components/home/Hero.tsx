import { preventAnd } from '../../utils/events'
import { getProducts, getCategoryTree } from '../../services/catalog-service'
import GarmentIcon from '../common/GarmentIcon'

interface HeroProps {
  onSelectCategory: (category: string) => void
}

/** Port của renderHero() gốc. */
export default function Hero({ onSelectCategory }: HeroProps) {
  const products = getProducts()
  const categoryTree = getCategoryTree()
  const heroColor = products[3]?.colorHex['Hồng pastel'] ?? '#E7C7CE'

  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div>
          <div className="eyebrow-plain">Thuê đồ dạ tiệc trong 1 phút</div>
          <h1>
            Diện đẹp cho
            <br />
            khoảnh khắc
            <br />
            quan trọng.
          </h1>
          <p>
            Phương Anh cho thuê váy dạ hội, áo dài, vest và phụ kiện được giặt là, kiểm tra kỹ trước mỗi lượt
            trao — chọn ngày lấy, ngày trả, còn lại để chúng tôi lo.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary" onClick={preventAnd(() => onSelectCategory('Tất cả'))}>
              Khám phá bộ sưu tập
            </button>
            <button className="btn btn-ghost" onClick={preventAnd(() => onSelectCategory('Váy dạ hội'))}>
              Xem váy dạ hội
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <b>{products.length}</b>
              <span>Mẫu trang phục</span>
            </div>
            <div className="hero-stat">
              <b>{categoryTree.length}</b>
              <span>Danh mục</span>
            </div>
            <div className="hero-stat">
              <b>30p</b>
              <span>Nhận đồ tại cửa hàng</span>
            </div>
          </div>
        </div>
        <div className="hero-art">
          <GarmentIcon type="dress" colorHex={heroColor} />
        </div>
      </div>
      <div className="hero-scroll-cue" aria-hidden="true">
        <span className="hero-scroll-mouse"><span /></span>
      </div>
    </section>
  )
}
