import { preventAnd } from '../../utils/events'
import { topCategoryChips } from '../../services/catalog-service'
import type { CategoryGroup } from '../../types/catalog'

interface CategoryStripProps {
  active: string
  categories: CategoryGroup[]
  onSelect: (category: string) => void
}

/** Port của renderCategoryStrip() gốc — dải chip danh mục mẹ ngang. */
export default function CategoryStrip({ active, categories, onSelect }: CategoryStripProps) {
  return (
    <section className="cat-strip">
      <div className="wrap">
        {topCategoryChips(categories).map((c) => (
          <button
            key={c}
            className={`cat-chip ${c === active ? 'active' : ''}`}
            onClick={preventAnd(() => onSelect(c))}
          >
            {c}
          </button>
        ))}
      </div>
    </section>
  )
}
