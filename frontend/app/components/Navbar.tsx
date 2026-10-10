import {Link, useNavigate} from "react-router";
import {useAuthStore} from "~/lib/auth";

const Navbar = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/auth');
    }

    return (
        <nav className="navbar">
            <Link to="/">
                <p className="text-2xl font-bold text-gradient">RESUMIND</p>
            </Link>
            <div className="flex flex-row items-center gap-4">
                {user && (
                    <span className="text-dark-200 max-sm:hidden">Hi, {user.username}</span>
                )}
                <Link to="/upload" className="primary-button w-fit">
                    Upload Resume
                </Link>
                {user && (
                    <button onClick={handleLogout}
                            className="rounded-full px-4 py-2 border border-gray-300 text-dark-200 cursor-pointer hover:bg-gray-50">
                        Log Out
                    </button>
                )}
            </div>
        </nav>
    )
}
export default Navbar
