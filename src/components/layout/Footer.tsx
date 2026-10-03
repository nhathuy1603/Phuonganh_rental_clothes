/** Port nguyên văn của renderFooter() gốc (thuần tĩnh, không có tương tác). */
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div>
          <h3>Phương Anh</h3>
          <p>
            Cho thuê váy dạ hội, áo dài, vest &amp; phụ kiện cho mọi dịp trọng đại.
            <br />
            Uy tín — Sạch đẹp — Đúng hẹn.
          </p>
        </div>
        <div>
          <h3>Liên hệ</h3>
          <p>
            Hotline: 090 123 4567
            <br />
            12 Trần Phú, Hải Châu, Đà Nẵng
            <br />
            8:30 – 20:30 mỗi ngày
          </p>
        </div>
        <div>
          <h3>Chính sách</h3>
          <p>
            Chính sách thuê &amp; đặt cọc
            <br />
            Hướng dẫn thanh toán
            <br />
            Câu hỏi thường gặp
          </p>
        </div>
      </div>
      <div className="wrap foot-bottom">
        <span>© 2026 Phương Anh Rental. Trang minh hoạ giao diện.</span>
        <span>Thiết kế bởi Phương Anh Studio</span>
      </div>
    </footer>
  )
}
