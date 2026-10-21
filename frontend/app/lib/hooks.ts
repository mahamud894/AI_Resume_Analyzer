import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { fetchProtectedFile } from "~/lib/api";
import { useAuthStore } from "~/lib/auth";

// Route guard: sends visitors who are not logged in to /auth and brings them back afterwards;
// after a logout it goes to the landing page instead.
// Returns true once the user is known to be logged in.
export function useRequireAuth() {
    const { isLoading, isAuthenticated, signedOut } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            // Logged out on purpose → landing page. Not logged in yet → login, then back to this page.
            navigate(signedOut ? "/" : `/auth?next=${encodeURIComponent(location.pathname)}`, { replace: true });
        }
    }, [isLoading, isAuthenticated, signedOut, location.pathname]);

    return !isLoading && isAuthenticated;
}

// Loads a JWT-protected file (resume PDF or preview image) into a temporary blob: URL.
export function useProtectedFile(path: string | null | undefined) {
    const [url, setUrl] = useState("");

    useEffect(() => {
        if (!path) return;
        let objectUrl = "";
        let cancelled = false;

        fetchProtectedFile(path)
            .then((u) => {
                objectUrl = u;
                if (cancelled) URL.revokeObjectURL(u);
                else setUrl(u);
            })
            .catch((err) => console.error(`Failed to load ${path}:`, err));

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [path]);

    return url;
}
