import type { MakeupCategory } from '../../types/catalog'
import { money } from '../../utils/format'
import { preventAnd } from '../../utils/events'

interface MakeupPanelProps {
  makeupCategories: MakeupCategory[]
  onClose: () => void
  onSelectService: (id: string) => void
  onSelectHub: () => void
}

/** Port của renderMakeupPanel() gốc — dropdown dịch vụ trang điểm. */
export default function MakeupPanel({
  makeupCategories,
  onClose,
  onSelectService,
  onSelectHub,
}: MakeupPanelProps) {
  return (
    <>
      <div className="mega-backdrop" onClick={onClose} />
      <div className="mega-panel makeup-panel">
        {makeupCategories.map((c) => (
          <a href="#" key={c.id} className="makeup-row" onClick={preventAnd(() => onSelectService(c.id))}>
            <span className="makeup-row-emoji">{c.emoji}</span>
            <span className="makeup-row-text">
              <b>{c.name}</b>
              <span>Từ {money(c.priceFrom)}</span>
            </span>
          </a>
        ))}
        <a href="#" className="makeup-row makeup-row-all" onClick={preventAnd(onSelectHub)}>
          <span className="makeup-row-emoji">✨</span>
          <span className="makeup-row-text">
            <b>Xem tất cả dịch vụ trang điểm</b>
            <span>Tổng quan &amp; bảng giá</span>
          </span>
        </a>
      </div>
    </>
  )
}
