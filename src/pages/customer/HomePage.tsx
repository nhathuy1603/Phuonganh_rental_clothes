import Hero from '../../components/home/Hero'
import ReviewsSection from '../../components/home/ReviewsSection'
import DifferentiatorsSection from '../../components/home/DifferentiatorsSection'
import CategoryStrip from '../../components/product/CategoryStrip'
import ProductCard from '../../components/product/ProductCard'
import { preventAnd } from '../../utils/events'
import { getFeaturedProducts, mostRentedProducts } from '../../services/catalog-service'
import type { CategoryGroup } from '../../types/catalog'
import type { Product } from '../../types/product'

interface HomePageProps {
  categories: CategoryGroup[]
  products: Product[]
  onSelectCategory: (category: string) => void
  onOpenProduct: (id: string) => void
}

/** Port của renderCustomerHome() gốc. */
export default function HomePage({ categories, products, onSelectCategory, onOpenProduct }: HomePageProps) {
  const featured = getFeaturedProducts(products)
  const bestSellers = mostRentedProducts(6, products)

  return (
    <>
      <Hero onSelectCategory={onSelectCategory} />
      <CategoryStrip active="Tất cả" categories={categories} onSelect={onSelectCategory} />

      <section className="wrap">
        <div className="section-title reveal">
          <div>
            <h2>Sản phẩm nổi bật</h2>
            <p>Được cửa hàng chọn lọc theo mùa &amp; sự kiện</p>
          </div>
          <a href="#" className="link-btn" onClick={preventAnd(() => onSelectCategory('Tất cả'))}>
            Xem tất cả →
          </a>
        </div>
        <div className="grid">
          {featured.map((p) => (
            <ProductCard product={p} onOpen={onOpenProduct} key={p.id} />
          ))}
        </div>
      </section>

      {bestSellers.length > 0 && (
        <section className="wrap">
          <div className="section-title reveal">
            <div>
              <h2>🔥 Thuê nhiều nhất</h2>
              <p>Những mẫu được khách hàng lựa chọn nhiều nhất gần đây</p>
            </div>
          </div>
          <div className="grid">
            {bestSellers.map(({ p, count }) => (
              <ProductCard product={p} badge={`${count} lượt thuê`} onOpen={onOpenProduct} key={p.id} />
            ))}
          </div>
        </section>
      )}

      <ReviewsSection />
      <DifferentiatorsSection />
    </>
  )
}
