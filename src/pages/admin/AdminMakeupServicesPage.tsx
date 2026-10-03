import { useState, type FormEvent } from 'react'
import type { MakeupCategory } from '../../types/catalog'

interface AdminMakeupServicesPageProps {
  services: MakeupCategory[]
  onCreate: (service: Omit<MakeupCategory, 'id'>) => Promise<void>
  onUpdate: (id: string, service: Omit<MakeupCategory, 'id'>) => Promise<void>
  onDelete: (id: string) => void
}

type MakeupServiceDraft = Omit<MakeupCategory, 'id'> & { highlightsText: string }

function serviceDraft(service?: MakeupCategory): MakeupServiceDraft {
  return {
    emoji: service?.emoji ?? '💄',
    name: service?.name ?? '',
    tagline: service?.tagline ?? '',
    desc: service?.desc ?? '',
    priceFrom: service?.priceFrom ?? 0,
    duration: service?.duration ?? '',
    highlights: service?.highlights ?? [],
    images: service?.images ?? [],
    highlightsText: service?.highlights.join('\n') ?? '',
  }
}

export default function AdminMakeupServicesPage({ services, onCreate, onUpdate, onDelete }: AdminMakeupServicesPageProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<MakeupServiceDraft>(() => serviceDraft())
  const [formOpen, setFormOpen] = useState(false)

  const openCreate = () => {
    setEditingId(null)
    setDraft(serviceDraft())
    setFormOpen(true)
  }

  const openEdit = (service: MakeupCategory) => {
    const { id: _id, ...values } = service
    setEditingId(service.id)
    setDraft({ ...values, highlightsText: service.highlights.join('\n') })
    setFormOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const { highlightsText, ...values } = draft
    const service = { ...values, highlights: highlightsText.split('\n').map((line) => line.trim()).filter(Boolean) }
    try {
      if (editingId) await onUpdate(editingId, service)
      else await onCreate(service)
      setFormOpen(false)
    } catch {
      // The app-level toast already reports the API error.
    }
  }

  const updateDraft = <K extends keyof MakeupServiceDraft>(field: K, value: MakeupServiceDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="admin-makeup-services">
      <section className="panel">
        <div className="panel-head admin-booking-head">
          <div><h3>Danh sách dịch vụ Makeup</h3><p>{services.length} dịch vụ. Thay đổi sẽ cập nhật trang khách hàng.</p></div>
          <button type="button" className="btn btn-primary makeup-book-btn" onClick={openCreate}>+ Thêm dịch vụ</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Dịch vụ</th><th>Giá từ</th><th>Thời lượng</th><th>Điểm nổi bật</th><th>Thao tác</th></tr></thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td><b>{service.emoji} {service.name}</b><small className="admin-table-sub">{service.tagline}</small></td>
                  <td>{service.priceFrom.toLocaleString('vi-VN')}đ</td>
                  <td>{service.duration}</td>
                  <td>{service.highlights.length}</td>
                  <td><div className="admin-row-actions"><button type="button" className="admin-text-button" onClick={() => openEdit(service)}>Sửa</button><button type="button" className="admin-delete-button" onClick={() => { if (window.confirm(`Xoá dịch vụ “${service.name}”? Các lịch cũ vẫn được giữ.`)) onDelete(service.id) }}>Xoá</button></div></td>
                </tr>
              ))}
              {services.length === 0 && <tr><td colSpan={5} className="admin-empty">Chưa có dịch vụ. Thêm dịch vụ để khách có thể đặt lịch.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {formOpen && (
        <div className="overlay admin-appointment-overlay" onClick={(event) => { if (event.target === event.currentTarget) setFormOpen(false) }}>
          <section className="modal admin-appointment-modal" role="dialog" aria-modal="true" aria-labelledby="admin-service-title">
            <button type="button" className="modal-close" onClick={() => setFormOpen(false)} aria-label="Đóng">×</button>
            <div className="admin-appointment-modal-head"><div className="eyebrow-plain">Quản lý dịch vụ</div><h2 id="admin-service-title">{editingId ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}</h2></div>
            <form className="admin-appointment-form" onSubmit={handleSubmit}>
              <label>Biểu tượng<input value={draft.emoji} onChange={(event) => updateDraft('emoji', event.target.value)} maxLength={8} required /></label>
              <label>Tên dịch vụ<input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} required /></label>
              <label className="admin-form-wide">Mô tả ngắn<input value={draft.tagline} onChange={(event) => updateDraft('tagline', event.target.value)} required /></label>
              <label>Giá từ (đồng)<input type="number" min="0" step="1000" value={draft.priceFrom} onChange={(event) => updateDraft('priceFrom', Number(event.target.value))} required /></label>
              <label>Thời lượng<input value={draft.duration} onChange={(event) => updateDraft('duration', event.target.value)} placeholder="60 - 90 phút" required /></label>
              <label className="admin-form-wide">Mô tả dịch vụ<textarea rows={4} value={draft.desc} onChange={(event) => updateDraft('desc', event.target.value)} required /></label>
              <label className="admin-form-wide">Điểm nổi bật (mỗi dòng một mục)<textarea rows={4} value={draft.highlightsText} onChange={(event) => updateDraft('highlightsText', event.target.value)} /></label>
              <div className="admin-appointment-actions"><button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>Huỷ</button><button type="submit" className="btn btn-primary makeup-book-btn">Lưu dịch vụ</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
