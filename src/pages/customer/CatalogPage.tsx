import CategoryStrip from '../../components/product/CategoryStrip'
import ProductCard from '../../components/product/ProductCard'
import { getProductsForCategory } from '../../services/catalog-service'
import type { CategoryGroup } from '../../types/catalog'
import type { Product } from '../../types/product'

interface CatalogPageProps {
  activeCategory: string
  categories: CategoryGroup[]
  products: Product[]
  onSelectCategory: (category: string) => void
  onOpenProduct: (id: string) => void
}

/** Port của renderCatalog() gốc. */
export default function CatalogPage({ activeCategory, categories, products, onSelectCategory, onOpenProduct }: CatalogPageProps) {
  const list = getProductsForCategory(activeCategory, categories, products)

  return (
    <>
      <CategoryStrip active={activeCategory} categories={categories} onSelect={onSelectCategory} />
      <section className="wrap" style={{ paddingTop: '6px' }}>
        <div className="section-title reveal">
          <div>
            <h2>{activeCategory}</h2>
            <p>{list.length} sản phẩm</p>
          </div>
        </div>
        <div className="grid">
          {list.map((p) => (
            <ProductCard product={p} onOpen={onOpenProduct} key={p.id} />
          ))}
        </div>
      </section>
    </>
  )
}

