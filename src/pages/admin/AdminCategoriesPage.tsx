import { useState, type FormEvent } from 'react'
import type { CategoryGroup } from '../../types/catalog'
import type { Product } from '../../types/product'

interface AdminCategoriesPageProps {
  categories: CategoryGroup[]
  products: Product[]
  onRenameGroup: (groupIndex: number, name: string) => void
  onDeleteGroup: (groupIndex: number) => void
  onAddGroup: (name: string) => void
  onAddCategory: (groupIndex: number, name: string) => void
  onRenameCategory: (groupIndex: number, oldName: string, newName: string) => void
  onDeleteCategory: (groupIndex: number, name: string, moveProductsTo?: string) => void
}

function duplicateCategory(categories: CategoryGroup[], name: string, except?: string) {
  const normalizedName = name.trim().toLocaleLowerCase('vi')
  return categories.some((group) => group.items.some((item) => item !== except && item.trim().toLocaleLowerCase('vi') === normalizedName))
}

export default function AdminCategoriesPage({
  categories,
  products,
  onRenameGroup,
  onDeleteGroup,
  onAddGroup,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}: AdminCategoriesPageProps) {
  const [newGroup, setNewGroup] = useState('')
  const [newChildByGroup, setNewChildByGroup] = useState<Record<number, string>>({})
  const [groupNames, setGroupNames] = useState<Record<number, string>>({})
  const [childNames, setChildNames] = useState<Record<string, string>>({})
  const [moveTargets, setMoveTargets] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const handleAddGroup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = newGroup.trim()
    if (!name) return
    if (categories.some((group) => group.group.trim().toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi'))) {
      setError('Tên danh mục mẹ đã tồn tại.')
      return
    }
    onAddGroup(name)
    setNewGroup('')
    setError(null)
  }

  const handleAddChild = (event: FormEvent<HTMLFormElement>, groupIndex: number) => {
    event.preventDefault()
    const name = (newChildByGroup[groupIndex] ?? '').trim()
    if (!name) return
    if (duplicateCategory(categories, name)) {
      setError('Tên danh mục con đã tồn tại.')
      return
    }
    onAddCategory(groupIndex, name)
    setNewChildByGroup((current) => ({ ...current, [groupIndex]: '' }))
    setError(null)
  }

  const saveGroupName = (groupIndex: number) => {
    const name = (groupNames[groupIndex] ?? categories[groupIndex].group).trim()
    if (!name || name === categories[groupIndex].group) return
    if (categories.some((group, index) => index !== groupIndex && group.group.trim().toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi'))) {
      setError('Tên danh mục mẹ đã tồn tại.')
      setGroupNames((current) => ({ ...current, [groupIndex]: categories[groupIndex].group }))
      return
    }
    onRenameGroup(groupIndex, name)
    setError(null)
  }

  const saveChildName = (groupIndex: number, oldName: string) => {
    const key = `${groupIndex}:${oldName}`
    const name = (childNames[key] ?? oldName).trim()
    if (!name || name === oldName) return
    if (duplicateCategory(categories, name, oldName)) {
      setError('Tên danh mục con đã tồn tại.')
      setChildNames((current) => ({ ...current, [key]: oldName }))
      return
    }
    onRenameCategory(groupIndex, oldName, name)
    setChildNames((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
    setError(null)
  }

  return (
    <div className="admin-category-manager">
      <section className="panel">
        <div className="panel-head"><div><h3>Thêm danh mục mẹ</h3><p>{categories.length} nhóm danh mục</p></div></div>
        <form className="admin-category-add-form" onSubmit={handleAddGroup}>
          <input value={newGroup} onChange={(event) => setNewGroup(event.target.value)} placeholder="Ví dụ: Trang phục truyền thống" aria-label="Tên danh mục mẹ mới" required />
          <button type="submit" className="btn btn-primary">+ Thêm nhóm</button>
        </form>
        {error && <p className="admin-date-error" role="alert">{error}</p>}
      </section>

      {categories.map((group, groupIndex) => (
        <section className="panel admin-category-group" key={`${group.group}-${groupIndex}`}>
          <div className="panel-head admin-category-group-head">
            <label className="admin-category-group-name">
              <span>Danh mục mẹ</span>
              <input
                value={groupNames[groupIndex] ?? group.group}
                onChange={(event) => setGroupNames((current) => ({ ...current, [groupIndex]: event.target.value }))}
                onBlur={() => saveGroupName(groupIndex)}
                onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
                aria-label={`Tên danh mục mẹ ${group.group}`}
              />
            </label>
            <button type="button" className="admin-delete-button" disabled={group.items.length > 0} title={group.items.length > 0 ? 'Xóa danh mục con trước khi xóa nhóm' : 'Xóa nhóm'} onClick={() => onDeleteGroup(groupIndex)}>Xóa nhóm</button>
          </div>

          <div className="admin-category-list">
            {group.items.length > 0 && (
              <div className="admin-category-list-head" aria-hidden="true">
                <span>Tên danh mục con</span><span>Sản phẩm</span><span>Chuyển sản phẩm khi xóa</span><span />
              </div>
            )}
            {group.items.map((name) => {
              const productCount = products.filter((product) => product.category === name).length
              const key = `${groupIndex}:${name}`
              const moveTarget = moveTargets[key] ?? ''
              const possibleTargets = categories.flatMap((targetGroup) => targetGroup.items).filter((item) => item !== name)
              return (
                <div className="admin-category-row" key={name}>
                  <label className="admin-category-name">
                    <input
                      value={childNames[key] ?? name}
                      onChange={(event) => setChildNames((current) => ({ ...current, [key]: event.target.value }))}
                      onBlur={() => saveChildName(groupIndex, name)}
                      onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
                      aria-label={`Tên danh mục con ${name}`}
                    />
                  </label>
                  <span className={`admin-category-count${productCount > 0 ? ' has-products' : ''}`}>{productCount} SP</span>
                  {productCount > 0 && (
                    <div className="admin-category-reassign">
                      <select aria-label={`Chuyển sản phẩm của ${name} sang`} value={moveTarget} onChange={(event) => setMoveTargets((current) => ({ ...current, [key]: event.target.value }))}>
                        <option value="">Chọn danh mục đích</option>
                        {possibleTargets.map((target) => <option value={target} key={target}>{target}</option>)}
                      </select>
                    </div>
                  )}
                  {productCount === 0 && <span className="admin-category-no-reassign">Không cần chuyển</span>}
                  <button
                    type="button"
                    className="admin-delete-button"
                    disabled={productCount > 0 && !moveTarget}
                    title={productCount > 0 && !moveTarget ? 'Chọn danh mục đích trước khi xóa' : 'Xóa danh mục con'}
                    onClick={() => {
                      if (window.confirm(productCount ? `Chuyển ${productCount} sản phẩm sang “${moveTarget}” rồi xóa “${name}”?` : `Xóa danh mục “${name}”?`)) {
                        onDeleteCategory(groupIndex, name, moveTarget || undefined)
                      }
                    }}
                  >
                    Xóa
                  </button>
                </div>
              )
            })}
            {group.items.length === 0 && <p className="admin-empty admin-category-empty">Nhóm này chưa có danh mục con.</p>}
          </div>

          <form className="admin-category-add-form admin-category-add-child" onSubmit={(event) => handleAddChild(event, groupIndex)}>
            <input value={newChildByGroup[groupIndex] ?? ''} onChange={(event) => setNewChildByGroup((current) => ({ ...current, [groupIndex]: event.target.value }))} placeholder={`Thêm danh mục con vào ${group.group}`} aria-label={`Danh mục con mới trong ${group.group}`} required />
            <button type="submit" className="btn btn-ghost btn-sm">+ Thêm danh mục</button>
          </form>
        </section>
      ))}
    </div>
  )
}
