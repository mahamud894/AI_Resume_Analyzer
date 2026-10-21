// Log in / Sign up card, used in two places:
//   - the popup on the landing page
//   - the /auth page (where protected pages send logged-out visitors)
// Same logic as before (validation, confirm password, Google sign-in, Zustand auth store);
// the look follows the landing-page popup style (white glass card, blue → purple button).
import { type FormEvent, useState } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useAuthStore } from "~/lib/auth";
import { GOOGLE_CLIENT_ID } from "~/constants";

export type AuthMode = "login" | "signup";

const inputClass =
    "w-full mt-1 !p-3 !bg-white/60 border border-slate-200 !rounded-lg !shadow-none text-slate-900 font-medium " +
    "placeholder:text-slate-400 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus-visible:!outline-none";
const labelClass = "text-sm font-semibold !text-slate-700";

export default function AuthCard({ initialMode = "login", onClose }: { initialMode?: AuthMode; onClose?: () => void }) {
    const { isLoading, error, login, register, loginWithGoogle, clearError } = useAuthStore();
    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [formError, setFormError] = useState("");
    const isLogin = mode === "login";

    const switchMode = () => {
        setMode(isLogin ? "signup" : "login");
        setFormError("");
        clearError();
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError("");
        clearError();

        const formData = new FormData(e.currentTarget);
        const username = String(formData.get("username") || "").trim();
        const email = String(formData.get("email") || "").trim();
        const password = String(formData.get("password") || "");
        const confirmPassword = String(formData.get("confirm-password") || "");

        if (!isLogin) {
            if (!/^[a-zA-Z0-9_.]{3,30}$/.test(username))
                return setFormError("Username must be 3-30 characters (letters, numbers, _ or .)");
            if (password.length < 6) return setFormError("Password must be at least 6 characters");
            if (password !== confirmPassword) return setFormError("Passwords do not match");
            await register(username, email, password);
        } else {
            await login(email, password);
        }
        // On success the auth store sets isAuthenticated; the page around this card does the redirect.
    };

    const message = formError || error;

    return (
        <div className="relative w-full max-w-md bg-white/90 backdrop-blur-xl border border-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            {onClose && (
                <button type="button" onClick={onClose} aria-label="Close"
                        className="absolute top-2 right-2 size-11 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-2xl font-bold cursor-pointer">
                    &times;
                </button>
            )}

            <div className="text-center mb-6 sm:mb-8">
                <h2 id="auth-title" className="!text-2xl font-bold !text-slate-900">
                    {isLogin ? "Welcome Back" : "Create an Account"}
                </h2>
                <p className="text-slate-500 text-sm mt-2">
                    {isLogin ? "Log in to continue your job journey" : "Sign up to start your job journey"}
                </p>
            </div>

            {message && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-100 text-center" role="alert">
                    {message}
                </div>
            )}

            <form key={mode} onSubmit={handleSubmit} className="!flex !flex-col !gap-4 !items-stretch">
                {!isLogin && (
                    <div>
                        <label htmlFor="username" className={labelClass}>Username</label>
                        <input type="text" name="username" id="username" placeholder="johndoe123" autoComplete="username"
                               required minLength={3} maxLength={30} className={inputClass} />
                    </div>
                )}
                <div>
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <input type="email" name="email" id="email" placeholder="you@example.com" autoComplete="email"
                           required className={inputClass} />
                </div>
                <div>
                    <label htmlFor="password" className={labelClass}>Password</label>
                    <input type="password" name="password" id="password" placeholder="••••••••"
                           autoComplete={isLogin ? "current-password" : "new-password"}
                           required minLength={isLogin ? undefined : 6} className={inputClass} />
                </div>
                {!isLogin && (
                    <div>
                        <label htmlFor="confirm-password" className={labelClass}>Confirm Password</label>
                        <input type="password" name="confirm-password" id="confirm-password" placeholder="••••••••"
                               autoComplete="new-password" required className={inputClass} />
                    </div>
                )}

                <button type="submit" disabled={isLoading}
                        className="w-full min-h-12 mt-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3.5 rounded-lg hover:from-blue-500 hover:to-purple-500 transition shadow-lg shadow-purple-500/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer">
                    {isLoading ? (isLogin ? "Signing you in..." : "Creating account...") : isLogin ? "Log In" : "Sign Up"}
                </button>
            </form>

            {/* Hidden until VITE_GOOGLE_CLIENT_ID is set */}
            {GOOGLE_CLIENT_ID && (
                <div className="flex flex-col items-center gap-4 w-full mt-5">
                    <div className="flex items-center gap-3 w-full text-sm text-slate-400" aria-hidden="true">
                        <span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" />
                    </div>
                    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} locale="en">
                        <GoogleLogin
                            key={mode}
                            text={isLogin ? "continue_with" : "signup_with"}
                            shape="pill"
                            size="large"
                            width="300"
                            onSuccess={({ credential }) => {
                                setFormError("");
                                clearError();
                                if (credential) loginWithGoogle(credential);
                            }}
                            onError={() => setFormError("Google sign-in did not complete. Please try again.")}
                        />
                    </GoogleOAuthProvider>
                </div>
            )}

            <p className="mt-6 text-center text-sm text-slate-500">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button type="button" onClick={switchMode}
                        className="font-bold text-purple-600 hover:underline cursor-pointer min-h-11 px-1">
                    {isLogin ? "Sign Up" : "Log In"}
                </button>
            </p>
        </div>
    );
}

// Decorative background shared with the landing-page popup: moving gradient, soft grid and colour blobs
export function AuthBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_60%,transparent_100%)] opacity-50" />
            <div className="auth-blob absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-300/30 rounded-full blur-[120px]" />
            <div className="auth-blob absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-300/30 rounded-full blur-[120px] [animation-delay:2s]" />
            <div className="auth-blob absolute bottom-[-10%] left-[20%] w-[60%] h-[50%] bg-pink-300/30 rounded-full blur-[120px] [animation-delay:4s]" />
        </div>
    );
}
