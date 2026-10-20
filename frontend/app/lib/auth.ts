// Global login state (Zustand). Replaces the old Puter auth store.
import { create } from "zustand";
import { ApiError, authApi, setUnauthorizedHandler, tokenStorage } from "~/lib/api";

interface AuthStore {
    user: User | null;
    isAuthenticated: boolean;
    // true until we know whether the saved token is still valid
    isLoading: boolean;
    error: string | null;
    // true after the user clicked Log Out / deleted the account (not when a session expired).
    // The route guard then sends them to /auth without ?next=, so the next login starts at home.
    signedOut: boolean;

    init: () => Promise<void>;
    login: (email: string, password: string) => Promise<boolean>;
    register: (username: string, email: string, password: string) => Promise<boolean>;
    loginWithGoogle: (credential: string) => Promise<boolean>;
    logout: (byUser?: boolean) => void;
    // Both throw on failure, so the account page can show the error next to its own form
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    deleteAccount: (confirmation: { password: string } | { confirmEmail: string }) => Promise<void>;
    clearError: () => void;
}

const errorMessage = (err: unknown) =>
    err instanceof ApiError || err instanceof Error ? err.message : "Something went wrong";

export const useAuthStore = create<AuthStore>((set, get) => {
    const startSession = (token: string, user: User) => {
        tokenStorage.set(token);
        set({ user, isAuthenticated: true, isLoading: false, error: null, signedOut: false });
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

    const logout = (byUser = true) => {
        tokenStorage.clear();
        set({ user: null, isAuthenticated: false, isLoading: false, signedOut: byUser });
    };

    // Any 401 from the API (expired token, deleted user) logs us out automatically.
    // signedOut stays false, so after logging in again the user returns to the page they were on.
    setUnauthorizedHandler(() => logout(false));

    return {
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        signedOut: false,

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
        loginWithGoogle: (credential) => authenticate(() => authApi.google(credential)),
        logout,
        changePassword: async (currentPassword, newPassword) => {
            const { token, user } = await authApi.changePassword(currentPassword, newPassword);
            startSession(token, user); // keep this device logged in with the new token
        },
        // The caller logs out afterwards (after leaving the protected page, so the route guard
        // does not add ?next=/account to the login URL)
        deleteAccount: async (confirmation) => {
            await authApi.deleteAccount(confirmation);
        },
        clearError: () => get().error && set({ error: null }),
    };
});
