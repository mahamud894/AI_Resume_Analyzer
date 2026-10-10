// Global login state (Zustand). Replaces the old Puter auth store.
import { create } from "zustand";
import { ApiError, authApi, setUnauthorizedHandler, tokenStorage } from "~/lib/api";

interface AuthStore {
    user: User | null;
    isAuthenticated: boolean;
    // true until we know whether the saved token is still valid
    isLoading: boolean;
    error: string | null;

    init: () => Promise<void>;
    login: (email: string, password: string) => Promise<boolean>;
    register: (username: string, email: string, password: string) => Promise<boolean>;
    logout: () => void;
    clearError: () => void;
}

const errorMessage = (err: unknown) =>
    err instanceof ApiError || err instanceof Error ? err.message : "Something went wrong";

export const useAuthStore = create<AuthStore>((set, get) => {
    const startSession = (token: string, user: User) => {
        tokenStorage.set(token);
        set({ user, isAuthenticated: true, isLoading: false, error: null });
    };

    const authenticate = async (call: () => ReturnType<typeof authApi.login>) => {
        set({ isLoading: true, error: null });
        try {
            const { token, user } = await call();
            startSession(token, user);
            return true;
        } catch (err) {
            set({ isLoading: false, error: errorMessage(err) });
            return false;
        }
    };

    const logout = () => {
        tokenStorage.clear();
        set({ user: null, isAuthenticated: false, isLoading: false });
    };

    // Any 401 from the API (expired token, deleted user) logs us out automatically
    setUnauthorizedHandler(logout);

    return {
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,

        // Runs once in the browser: restores the session from the saved token
        init: async () => {
            if (!tokenStorage.get()) return set({ isLoading: false });
            try {
                const { user } = await authApi.me();
                set({ user, isAuthenticated: true, isLoading: false });
            } catch (err) {
                if (err instanceof ApiError && err.status === 401) tokenStorage.clear();
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: err instanceof ApiError && err.status === 401 ? null : errorMessage(err),
                });
            }
        },
        login: (email, password) => authenticate(() => authApi.login(email, password)),
        register: (username, email, password) => authenticate(() => authApi.register(username, email, password)),
        logout,
        clearError: () => get().error && set({ error: null }),
    };
});
