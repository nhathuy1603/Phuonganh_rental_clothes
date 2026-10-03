import { getDifferentiators } from '../../services/catalog-service'

/** Port của renderDifferentiators() gốc. */
export default function DifferentiatorsSection() {
  const diffs = getDifferentiators()
  return (
    <section className="wrap">
      <div className="section-title reveal">
        <div>
          <h2>Vì sao chọn Phương Anh?</h2>
          <p>Những điều làm nên sự khác biệt so với các shop cho thuê khác</p>
        </div>
      </div>
      <div className="diff-grid reveal">
        {diffs.map((d) => (
          <div className="diff-card" key={d.title}>
            <div className="diff-icon">{d.icon}</div>
            <h4>{d.title}</h4>
            <p>{d.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
