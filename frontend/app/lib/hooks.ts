import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { fetchProtectedFile } from "~/lib/api";
import { useAuthStore } from "~/lib/auth";

// Route guard: sends logged-out visitors to /auth and brings them back afterwards.
// Returns true once the user is known to be logged in.
export function useRequireAuth() {
    const { isLoading, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate(`/auth?next=${encodeURIComponent(location.pathname)}`, { replace: true });
        }
    }, [isLoading, isAuthenticated, location.pathname]);

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
