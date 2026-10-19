import {useEffect, useRef, useState} from "react";
import {Link, useNavigate} from "react-router";
import {useAuthStore} from "~/lib/auth";

const Navbar = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const navRef = useRef<HTMLElement>(null);

    const handleLogout = () => {
        setMenuOpen(false);
        logout();
        navigate('/auth');
    }

    // Mobile menu: close on outside click/tap and on Escape
    useEffect(() => {
        if (!menuOpen) return;
        const onPointerDown = (e: PointerEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [menuOpen]);

    return (
        <nav className="navbar" ref={navRef}>
            <Link to="/" className="flex items-center min-h-11">
                <p className="text-2xl font-bold text-gradient">RESUMIND</p>
            </Link>

            {/* Tablet and desktop: inline */}
            <div className="hidden md:flex flex-row items-center gap-4">
                {user && (
                    <span className="text-dark-200 max-w-50 truncate">Hi, {user.username}</span>
                )}
                <Link to="/upload" className="primary-button w-fit">
                    Upload Resume
                </Link>
                {user && (
                    <button onClick={handleLogout}
                            className="secondary-button">
                        Log Out
                    </button>
                )}
            </div>

            {/* Phone: hamburger button + dropdown */}
            <button type="button" className="md:hidden flex items-center justify-center size-11 -mr-2 rounded-full cursor-pointer hover:bg-gray-50"
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="mobile-menu"
                    onClick={() => setMenuOpen((open) => !open)}>
                <svg className="size-6" fill="none" stroke="#475467" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24" aria-hidden="true">
                    {menuOpen
                        ? <path d="M6 6l12 12M18 6L6 18" />
                        : <path d="M4 7h16M4 12h16M4 17h16" />}
                </svg>
            </button>

            {menuOpen && (
                <div id="mobile-menu"
                     className="md:hidden absolute right-0 top-full mt-2 z-30 w-full flex flex-col gap-3 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {user && (
                        <p className="text-dark-200 break-words">Hi, <b>{user.username}</b></p>
                    )}
                    <Link to="/upload" className="primary-button" onClick={() => setMenuOpen(false)}>
                        Upload Resume
                    </Link>
                    {user && (
                        <button onClick={handleLogout} className="secondary-button w-full">
                            Log Out
                        </button>
                    )}
                </div>
            )}
        </nav>
    )
}
export default Navbar
