import { Link } from 'react-router-dom'
import './NavBar.css'

export default function NavBar() {
    return (
        <nav className="nav">
            <Link className="nav-logo" to="/">
                <span className="logo-text">AutoWash</span>
            </Link>

            <div className="nav-links">
                <Link to="/how">Cách hoạt động</Link>
                <Link to="/tiers">Hạng thành viên</Link>
                <Link to="/features">Tính năng</Link>
            </div>

            <Link className="nav-cta" to="/">Đăng ký ngay</Link>
        </nav>
    )
}
