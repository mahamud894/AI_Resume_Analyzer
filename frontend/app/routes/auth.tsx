import {useEffect} from "react";
import {Link, useNavigate, useSearchParams} from "react-router";
import AuthCard, {AuthBackground} from "~/components/AuthCard";
import {useAuthStore} from "~/lib/auth";

export const meta = () => ([
    { title: 'Resumind | Log In' },
    { name: 'description', content: 'Log into your account' },
])

const Auth = () => {
    const { isAuthenticated } = useAuthStore();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Only allow redirects inside our own app (prevents "open redirect" to other sites)
    const nextParam = searchParams.get('next') || '/dashboard';
    const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard';

    useEffect(() => {
        if (isAuthenticated) navigate(next, { replace: true });
    }, [isAuthenticated, next])

    return (
        <main className="auth-bg relative min-h-screen flex flex-col items-center justify-center gap-6 !pt-0 px-4 py-10 text-slate-800">
            <AuthBackground />
            <Link to="/" className="relative z-10 min-h-11 flex items-center">
                <span className="text-2xl font-bold text-gradient">RESUMIND</span>
            </Link>
            <div className="relative z-10 w-full flex justify-center">
                {/* "/auth?mode=signup" opens the sign-up form directly */}
                <AuthCard initialMode={searchParams.get('mode') === 'signup' ? 'signup' : 'login'} />
            </div>
        </main>
    )
}

export default Auth
