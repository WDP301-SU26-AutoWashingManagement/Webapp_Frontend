import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">Auto<em>Wash</em></span>
        </div>
        <p className="footer-note">
          Hệ thống rửa xe thông minh với chương trình loyalty tích hợp.<br />
          <span>Không bao gồm thanh toán online & hoàn tiền.</span>
        </p>
        <div className="footer-copy">© 2025 AutoWash. Đồ án hệ thống thông tin.</div>
      </div>
    </footer>
  )
}
