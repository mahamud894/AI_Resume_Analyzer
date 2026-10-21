import {type FormEvent, useEffect, useState} from "react";
import {useNavigate, useSearchParams} from "react-router";
import {GoogleLogin, GoogleOAuthProvider} from "@react-oauth/google";
import {useAuthStore} from "~/lib/auth";
import {GOOGLE_CLIENT_ID} from "~/constants";

export const meta = () => ([
    { title: 'Resumind | Auth' },
    { name: 'description', content: 'Log into your account' },
])

type Mode = 'login' | 'signup';

const Auth = () => {
    const { isLoading, isAuthenticated, error, login, register, loginWithGoogle, clearError } = useAuthStore();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    // "/auth?mode=signup" (used by the landing page buttons) opens the sign-up form directly
    const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
    const [formError, setFormError] = useState('');

    // Only allow redirects inside our own app (prevents "open redirect" to other sites)
    const nextParam = searchParams.get('next') || '/dashboard';
    const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard';

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
        <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center !pt-0 px-4 py-8 sm:px-6">
            <div className="gradient-border shadow-lg w-full max-w-[700px]">
                <section className="flex flex-col gap-6 sm:gap-8 bg-white rounded-2xl p-5 sm:p-10">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
                        <h2>
                            {mode === 'login'
                                ? 'Log In to Continue Your Job Journey'
                                : 'Sign Up to Start Your Job Journey'}
                        </h2>
                    </div>

                    <form key={mode} onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
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

                    {/* Second way to log in. Hidden until VITE_GOOGLE_CLIENT_ID is set in frontend/.env */}
                    {GOOGLE_CLIENT_ID && (
                        <div className="flex flex-col items-center gap-4 w-full">
                            <div className="flex items-center gap-3 w-full text-sm text-gray-400" aria-hidden="true">
                                <span className="h-px flex-1 bg-gray-200" />or<span className="h-px flex-1 bg-gray-200" />
                            </div>
                            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} locale="en">
                                <GoogleLogin
                                    key={mode}
                                    text={mode === 'login' ? 'continue_with' : 'signup_with'}
                                    shape="pill"
                                    size="large"
                                    width="300"
                                    onSuccess={({ credential }) => {
                                        setFormError('');
                                        clearError();
                                        if (credential) loginWithGoogle(credential);
                                    }}
                                    onError={() => setFormError('Google sign-in did not complete. Please try again.')}
                                />
                            </GoogleOAuthProvider>
                        </div>
                    )}

                    <p className="text-center text-dark-200 flex flex-wrap items-center justify-center gap-x-1">
                        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        <button type="button" className="font-semibold text-gradient cursor-pointer min-h-11 px-1"
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
