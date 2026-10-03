import type { CategoryGroup } from '../../types/catalog'
import { preventAnd } from '../../utils/events'

interface MegaPanelProps {
  categoryTree: CategoryGroup[]
  onClose: () => void
  onSelectCategory: (category: string) => void
}

/** Port của renderMegaPanel() gốc — dropdown danh mục sản phẩm (mẹ/con). */
export default function MegaPanel({ categoryTree, onClose, onSelectCategory }: MegaPanelProps) {
  return (
    <>
      <div className="mega-backdrop" onClick={onClose} />
      <div className="mega-panel">
        {categoryTree.map((g) => (
          <div className="mega-col" key={g.group}>
            <h4>
              <a href="#" onClick={preventAnd(() => onSelectCategory(g.group))}>
                {g.group}
              </a>
            </h4>
            {g.items.map((it) => (
              <a href="#" key={it} onClick={preventAnd(() => onSelectCategory(it))}>
                {it}
              </a>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
