import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import type { CategoryGroup } from '../../types/catalog'
import type { Product, ProductVariant } from '../../types/product'
import ProductVisual from '../../components/common/ProductVisual'
import { availableNow } from '../../services/catalog-service'
import { money } from '../../utils/format'

interface AdminProductsPageProps {
  products: Product[]
  categories: CategoryGroup[]
  onCreate: (product: Omit<Product, 'id'>) => void
  onUpdate: (id: string, product: Omit<Product, 'id'>) => void
  onDelete: (id: string) => void
}

type ProductDraft = Omit<Product, 'id'>

const productIcons: Array<{ id: Product['icon']; label: string }> = [
  { id: 'dress', label: 'Váy / đầm' },
  { id: 'aodai', label: 'Áo dài' },
  { id: 'suit', label: 'Vest / suit' },
  { id: 'accessory', label: 'Phụ kiện' },
  { id: 'couple', label: 'Đồ đôi' },
]

const palette = ['#7A2233', '#22314F', '#5C8C82', '#B4863C', '#6B6660', '#8C2A2A', '#C9A85C', '#D9AFAE']

function emptyVariant(): ProductVariant {
  return { id: `variant-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`, size: '', color: '', total: 1, renting: 0, cleaning: 0, repair: 0 }
}

function emptyProduct(categories: CategoryGroup[]): ProductDraft {
  const category = categories.flatMap((group) => group.items)[0] ?? ''
  return {
    name: '',
    category,
    icon: 'dress',
    pricePerDay: 0,
    deposit: 0,
    depositNote: '',
    desc: '',
    colorHex: {},
    variants: [emptyVariant()],
    images: [],
    videoUrl: '',
  }
}

function productToDraft(product: Product): ProductDraft {
  return {
    name: product.name,
    category: product.category,
    icon: product.icon,
    pricePerDay: product.pricePerDay,
    deposit: product.deposit,
    depositNote: product.depositNote,
    desc: product.desc,
    colorHex: { ...product.colorHex },
    variants: product.variants.map((variant) => ({ ...variant })),
    images: [...product.images],
    videoUrl: product.videoUrl,
  }
}

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Không thể đọc ảnh đã chọn.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('File đã chọn không phải ảnh hợp lệ.'))
      image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Trình duyệt không hỗ trợ xử lý ảnh.'))
          return
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.84))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export default function AdminProductsPage({ products, categories, onCreate, onUpdate, onDelete }: AdminProductsPageProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Tất cả')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ProductDraft>(() => emptyProduct(categories))
  const [imageError, setImageError] = useState<string | null>(null)

  const categoryOptions = useMemo(() => [...new Set(categories.flatMap((group) => group.items))], [categories])
  const selectedProduct = products.find((product) => product.id === detailId)
  const filteredProducts = products.filter((product) => {
    if (categoryFilter !== 'Tất cả' && product.category !== categoryFilter) return false
    const query = search.trim().toLocaleLowerCase('vi')
    return !query || [product.name, product.category, ...product.variants.flatMap((variant) => [variant.size, variant.color])]
      .some((value) => value.toLocaleLowerCase('vi').includes(query))
  })
  const editingProduct = products.find((product) => product.id === editingId)

  const openCreate = () => {
    setDetailId(null)
    setEditingId(null)
    setDraft(emptyProduct(categories))
    setImageError(null)
    setFormOpen(true)
  }

  const openEdit = (product: Product) => {
    setDetailId(null)
    setEditingId(product.id)
    setDraft(productToDraft(product))
    setImageError(null)
    setFormOpen(true)
  }

  const updateDraft = <K extends keyof ProductDraft>(field: K, value: ProductDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const updateVariant = <K extends keyof ProductVariant>(variantId: string, field: K, value: ProductVariant[K]) => {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant) => variant.id === variantId ? { ...variant, [field]: value } : variant),
    }))
  }

  const updateVariantColor = (variant: ProductVariant, color: string) => {
    const oldColor = variant.color
    const colorHex = { ...draft.colorHex }
    const chosenHex = colorHex[oldColor] ?? palette[draft.variants.indexOf(variant) % palette.length]
    if (oldColor && oldColor !== color) delete colorHex[oldColor]
    if (color) colorHex[color] = chosenHex
    updateDraft('colorHex', colorHex)
    updateVariant(variant.id, 'color', color)
  }

  const handleImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return
    try {
      const images = await Promise.all(files.map(resizeImage))
      setDraft((current) => ({ ...current, images: [...current.images, ...images] }))
      setImageError(null)
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Không thể tải ảnh.')
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanName = draft.name.trim()
    const validVariants = draft.variants.filter((variant) => variant.size.trim() && variant.color.trim())
    if (!cleanName || validVariants.length === 0) return
    const colorHex = Object.fromEntries(validVariants.map((variant, index) => [
      variant.color,
      draft.colorHex[variant.color] ?? palette[index % palette.length],
    ]))
    const product: ProductDraft = {
      ...draft,
      name: cleanName,
      category: draft.category.trim(),
      desc: draft.desc.trim(),
      depositNote: draft.depositNote.trim(),
      videoUrl: draft.videoUrl.trim(),
      variants: validVariants,
      colorHex,
    }
    if (editingId) onUpdate(editingId, product)
    else onCreate(product)
    setFormOpen(false)
    setEditingId(null)
  }

  const handleDelete = (product: Product) => {
    if (window.confirm(`Xóa sản phẩm “${product.name}” khỏi catalog?`)) {
      onDelete(product.id)
      setDetailId(null)
    }
  }

  return (
    <div className="admin-products-page">
      <section className="panel">
        <div className="panel-head admin-booking-head">
          <div><h3>Catalog sản phẩm</h3><p>{filteredProducts.length} / {products.length} sản phẩm</p></div>
          <button type="button" className="btn btn-primary" onClick={openCreate}>+ Thêm sản phẩm</button>
        </div>
        <div className="admin-product-filters">
          <input className="admin-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên, danh mục, size hoặc màu..." aria-label="Tìm sản phẩm" />
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Lọc danh mục sản phẩm">
            <option>Tất cả</option>
            {categoryOptions.map((category) => <option key={category}>{category}</option>)}
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Biến thể</th><th>Có sẵn</th><th>Giá thuê / ngày</th><th>Video</th><th>Thao tác</th></tr></thead>
            <tbody>
              {filteredProducts.map((product) => {
                const stock = product.variants.reduce((total, variant) => total + variant.total, 0)
                const available = product.variants.reduce((total, variant) => total + availableNow(variant), 0)
                return (
                  <tr key={product.id}>
                    <td><div className="admin-product-row-name"><span className="admin-product-thumb"><ProductVisual product={product} /></span><b>{product.name}</b></div></td>
                    <td>{product.category}</td>
                    <td>{product.variants.length}</td>
                    <td><span className={`badge ${available ? 'badge-ok' : 'badge-low'}`}>{available} / {stock}</span></td>
                    <td>{money(product.pricePerDay)}</td>
                    <td>{product.videoUrl ? <a className="admin-text-button" href={product.videoUrl} target="_blank" rel="noopener noreferrer">Xem video ↗</a> : '—'}</td>
                    <td><div className="admin-product-actions"><button type="button" className="admin-icon-action" aria-label={`Xem chi tiết ${product.name}`} title="Xem chi tiết" onClick={() => setDetailId(product.id)}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg></button><button type="button" className="admin-text-button" onClick={() => openEdit(product)}>Sửa</button><button type="button" className="admin-delete-button" onClick={() => handleDelete(product)}>Xóa</button></div></td>
                  </tr>
                )
              })}
              {filteredProducts.length === 0 && <tr><td colSpan={7} className="admin-empty">Không tìm thấy sản phẩm phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {selectedProduct && (
        <div className="overlay admin-product-overlay" onClick={(event) => { if (event.target === event.currentTarget) setDetailId(null) }}>
          <section className="modal admin-product-detail-modal" role="dialog" aria-modal="true" aria-labelledby="admin-product-detail-title">
            <button type="button" className="modal-close" onClick={() => setDetailId(null)} aria-label="Đóng chi tiết sản phẩm">×</button>
            <header className="admin-product-detail-head"><div><span className="eyebrow-plain">Chi tiết sản phẩm · {selectedProduct.category}</span><h2 id="admin-product-detail-title">{selectedProduct.name}</h2></div></header>
            <div className="admin-product-detail-body">
              <div className="admin-product-detail-cover"><ProductVisual product={selectedProduct} /></div>
              <div className="admin-product-detail-info"><div><span>Giá thuê / ngày</span><b>{money(selectedProduct.pricePerDay)}</b></div><div><span>Tiền cọc</span><b>{money(selectedProduct.deposit)}</b></div><div><span>Loại sản phẩm</span><b>{productIcons.find((icon) => icon.id === selectedProduct.icon)?.label}</b></div></div>
              <p className="admin-product-description">{selectedProduct.desc || 'Chưa có mô tả sản phẩm.'}</p>
              {selectedProduct.depositNote && <p className="admin-product-deposit-note">{selectedProduct.depositNote}</p>}
              <section className="admin-product-variants"><h3>Tồn kho theo biến thể</h3><div className="table-scroll"><table><thead><tr><th>Size</th><th>Màu</th><th>Tổng</th><th>Đang thuê</th><th>Đang giặt</th><th>Đang sửa</th><th>Có sẵn</th></tr></thead><tbody>{selectedProduct.variants.map((variant) => <tr key={variant.id}><td>{variant.size}</td><td><span className="admin-product-color"><i style={{ background: selectedProduct.colorHex[variant.color] ?? '#999' }} />{variant.color}</span></td><td>{variant.total}</td><td>{variant.renting}</td><td>{variant.cleaning}</td><td>{variant.repair}</td><td>{availableNow(variant)}</td></tr>)}</tbody></table></div></section>
              {selectedProduct.images.length > 0 && <section className="admin-product-gallery"><h3>Ảnh sản phẩm ({selectedProduct.images.length})</h3><div>{selectedProduct.images.map((image, index) => <img src={image} alt={`${selectedProduct.name} ${index + 1}`} key={`${selectedProduct.id}-image-${index}`} />)}</div></section>}
              {selectedProduct.videoUrl && <a className="btn btn-ghost admin-product-video" href={selectedProduct.videoUrl} target="_blank" rel="noopener noreferrer">▶ Mở video sản phẩm</a>}
            </div>
            <footer className="admin-product-detail-actions"><button type="button" className="admin-delete-button" onClick={() => handleDelete(selectedProduct)}>Xóa sản phẩm</button><div><button type="button" className="btn btn-ghost" onClick={() => openEdit(selectedProduct)}>Sửa sản phẩm</button><button type="button" className="btn btn-primary" onClick={() => setDetailId(null)}>Đóng</button></div></footer>
          </section>
        </div>
      )}

      {formOpen && (
        <div className="overlay admin-product-overlay" onClick={(event) => { if (event.target === event.currentTarget) setFormOpen(false) }}>
          <section className="modal admin-product-form-modal" role="dialog" aria-modal="true" aria-labelledby="admin-product-form-title">
            <button type="button" className="modal-close" onClick={() => setFormOpen(false)} aria-label="Đóng form sản phẩm">×</button>
            <header className="admin-product-detail-head"><div><span className="eyebrow-plain">Catalog sản phẩm</span><h2 id="admin-product-form-title">{editingProduct ? `Sửa ${editingProduct.name}` : 'Thêm sản phẩm mới'}</h2></div></header>
            <form className="admin-product-form" onSubmit={handleSubmit}>
              <label>Tên sản phẩm<input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} required /></label>
              <label>Danh mục<select value={draft.category} onChange={(event) => updateDraft('category', event.target.value)} required>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>Kiểu minh họa<select value={draft.icon} onChange={(event) => updateDraft('icon', event.target.value as Product['icon'])}>{productIcons.map((icon) => <option value={icon.id} key={icon.id}>{icon.label}</option>)}</select></label>
              <label>Giá thuê / ngày<input type="number" min="0" step="1000" value={draft.pricePerDay} onChange={(event) => updateDraft('pricePerDay', Number(event.target.value))} required /></label>
              <label>Tiền cọc<input type="number" min="0" step="1000" value={draft.deposit} onChange={(event) => updateDraft('deposit', Number(event.target.value))} required /></label>
              <label className="admin-product-wide">Ghi chú tiền cọc<input value={draft.depositNote} onChange={(event) => updateDraft('depositNote', event.target.value)} placeholder="Điều kiện cọc hoặc giấy tờ cần giữ" /></label>
              <label className="admin-product-wide">Mô tả<textarea rows={3} value={draft.desc} onChange={(event) => updateDraft('desc', event.target.value)} /></label>
              <section className="admin-product-variant-editor admin-product-wide">
                <div className="admin-product-variant-head"><div><h3>Biến thể & tồn kho</h3><p>Quản lý size, màu, tổng số lượng và số lượng đang ở từng trạng thái.</p></div><button type="button" className="btn btn-ghost btn-sm" onClick={() => updateDraft('variants', [...draft.variants, emptyVariant()])}>+ Biến thể</button></div>
                <div className="admin-product-variant-list">
                  {draft.variants.map((variant, index) => (
                    <div className="admin-product-variant-row" key={variant.id}>
                      <label>Size<input value={variant.size} onChange={(event) => updateVariant(variant.id, 'size', event.target.value)} placeholder="M / 38" required /></label>
                      <label>Màu<input value={variant.color} onChange={(event) => updateVariantColor(variant, event.target.value)} placeholder="Đỏ rượu vang" required /></label>
                      <label>Màu đại diện<input aria-label={`Màu hiển thị cho biến thể ${index + 1}`} type="color" value={draft.colorHex[variant.color] ?? palette[index % palette.length]} onChange={(event) => updateDraft('colorHex', { ...draft.colorHex, [variant.color]: event.target.value })} /></label>
                      <label>Tổng<input type="number" min="0" step="1" value={variant.total} onChange={(event) => updateVariant(variant.id, 'total', Number(event.target.value))} required /></label>
                      <label>Đang thuê<input type="number" min="0" step="1" value={variant.renting} onChange={(event) => updateVariant(variant.id, 'renting', Number(event.target.value))} required /></label>
                      <label>Đang giặt<input type="number" min="0" step="1" value={variant.cleaning} onChange={(event) => updateVariant(variant.id, 'cleaning', Number(event.target.value))} required /></label>
                      <label>Đang sửa<input type="number" min="0" step="1" value={variant.repair} onChange={(event) => updateVariant(variant.id, 'repair', Number(event.target.value))} required /></label>
                      <button type="button" className="admin-delete-button admin-product-variant-remove" disabled={draft.variants.length <= 1} aria-label={`Xóa biến thể ${variant.size} ${variant.color}`} onClick={() => updateDraft('variants', draft.variants.filter((item) => item.id !== variant.id))}>Xóa</button>
                    </div>
                  ))}
                </div>
              </section>
              <section className="admin-product-media admin-product-wide">
                <div className="admin-product-variant-head"><div><h3>Ảnh sản phẩm</h3><p>Ảnh được thu gọn kích thước để xem trước nhanh.</p></div><label className="btn btn-ghost btn-sm admin-product-upload">+ Thêm ảnh<input type="file" accept="image/*" multiple onChange={handleImages} /></label></div>
                {imageError && <p className="admin-date-error" role="alert">{imageError}</p>}
                {draft.images.length > 0 ? <div className="admin-product-image-list">{draft.images.map((image, index) => <figure key={`${index}-${image.slice(0, 24)}`}><img src={image} alt={`Ảnh sản phẩm ${index + 1}`} /><button type="button" aria-label={`Xóa ảnh ${index + 1}`} onClick={() => updateDraft('images', draft.images.filter((_, imageIndex) => imageIndex !== index))}>×</button></figure>)}</div> : <p className="admin-product-no-images">Chưa có ảnh sản phẩm.</p>}
              </section>
              <label className="admin-product-wide">Video sản phẩm<input type="url" value={draft.videoUrl} onChange={(event) => updateDraft('videoUrl', event.target.value)} placeholder="https://youtube.com/... hoặc link video" /></label>
              <footer className="admin-product-form-actions"><button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>Hủy</button><button type="submit" className="btn btn-primary">{editingId ? 'Lưu sản phẩm' : 'Tạo sản phẩm'}</button></footer>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
