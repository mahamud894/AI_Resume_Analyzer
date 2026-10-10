import {type FormEvent, useEffect, useState} from "react";
import {useNavigate, useSearchParams} from "react-router";
import {useAuthStore} from "~/lib/auth";

export const meta = () => ([
    { title: 'Resumind | Auth' },
    { name: 'description', content: 'Log into your account' },
])

type Mode = 'login' | 'signup';

const Auth = () => {
    const { isLoading, isAuthenticated, error, login, register, clearError } = useAuthStore();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [mode, setMode] = useState<Mode>('login');
    const [formError, setFormError] = useState('');

    // Only allow redirects inside our own app (prevents "open redirect" to other sites)
    const nextParam = searchParams.get('next') || '/';
    const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';

    useEffect(() => {
        if (isAuthenticated) navigate(next, { replace: true });
    }, [isAuthenticated, next])

    const switchMode = (newMode: Mode) => {
        setMode(newMode);
        setFormError('');
        clearError();
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError('');
        clearError();

        const formData = new FormData(e.currentTarget);
        const username = String(formData.get('username') || '').trim();
        const email = String(formData.get('email') || '').trim();
        const password = String(formData.get('password') || '');
        const confirmPassword = String(formData.get('confirm-password') || '');

        if (mode === 'signup') {
            if (!/^[a-zA-Z0-9_.]{3,30}$/.test(username))
                return setFormError('Username must be 3-30 characters (letters, numbers, _ or .)');
            if (password.length < 6) return setFormError('Password must be at least 6 characters');
            if (password !== confirmPassword) return setFormError('Passwords do not match');
            await register(username, email, password);
        } else {
            await login(email, password);
        }
    }

    const message = formError || error;

    return (
        <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center">
            <div className="gradient-border shadow-lg max-md:mx-4">
                <section className="flex flex-col gap-8 bg-white rounded-2xl p-10 max-sm:p-6">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
                        <h2>
                            {mode === 'login'
                                ? 'Log In to Continue Your Job Journey'
                                : 'Sign Up to Start Your Job Journey'}
                        </h2>
                    </div>

                    <form key={mode} onSubmit={handleSubmit} className="flex flex-col gap-4 w-[600px] max-md:w-full">
                        {mode === 'signup' && (
                            <div className="form-div">
                                <label htmlFor="username">Username</label>
                                <input type="text" name="username" id="username" placeholder="Username"
                                       autoComplete="username" required minLength={3} maxLength={30} />
                            </div>
                        )}
                        <div className="form-div">
                            <label htmlFor="email">Email</label>
                            <input type="email" name="email" id="email" placeholder="you@example.com"
                                   autoComplete="email" required />
                        </div>
                        <div className="form-div">
                            <label htmlFor="password">Password</label>
                            <input type="password" name="password" id="password" placeholder="Password"
                                   autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                   required minLength={mode === 'signup' ? 6 : undefined} />
                        </div>
                        {mode === 'signup' && (
                            <div className="form-div">
                                <label htmlFor="confirm-password">Confirm Password</label>
                                <input type="password" name="confirm-password" id="confirm-password"
                                       placeholder="Confirm Password" autoComplete="new-password" required />
                            </div>
                        )}

                        {message && (
                            <p className="w-full rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3" role="alert">
                                {message}
                            </p>
                        )}

                        <button type="submit" disabled={isLoading}
                                className={`auth-button w-full ${isLoading ? 'animate-pulse' : ''}`}>
                            <p>
                                {isLoading
                                    ? (mode === 'login' ? 'Signing you in...' : 'Creating account...')
                                    : (mode === 'login' ? 'Log In' : 'Sign Up')}
                            </p>
                        </button>
                    </form>

                    <p className="text-center text-dark-200">
                        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        <button type="button" className="font-semibold text-gradient cursor-pointer"
                                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
                            {mode === 'login' ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </section>
            </div>
        </main>
    )
}

export default Auth
