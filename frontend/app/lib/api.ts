// The ONLY place the frontend talks to the backend.
// Every request goes through `request()`, which adds the base URL, the JWT and error handling.

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const TOKEN_KEY = "resumind_token";

export const tokenStorage = {
    get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
    set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

// Called when the server says our token is no longer valid (set by the auth store).
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: () => void) => {
    onUnauthorized = handler;
};

type RequestOptions = {
    method?: "GET" | "POST" | "DELETE";
    json?: unknown;
    formData?: FormData;
};

async function send(path: string, { method = "GET", json, formData }: RequestOptions = {}) {
    const headers: Record<string, string> = {};
    const token = tokenStorage.get();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (json !== undefined) headers["Content-Type"] = "application/json";
    // (For FormData the browser sets the multipart Content-Type itself.)

    let res: Response;
    try {
        res = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: formData ?? (json !== undefined ? JSON.stringify(json) : undefined),
        });
    } catch {
        throw new ApiError(0, "Cannot reach the server. Is the backend running?");
    }

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 401 && token) onUnauthorized?.();
        throw new ApiError(res.status, body?.message || `Request failed (${res.status})`);
    }
    return res;
}

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
    const res = await send(path, options);
    return res.json() as Promise<T>;
}

// Downloads a protected file (PDF / image) and returns a temporary blob: URL for <img>/<a>.
// Remember to URL.revokeObjectURL() it when no longer needed.
export async function fetchProtectedFile(path: string): Promise<string> {
    const res = await send(path);
    return URL.createObjectURL(await res.blob());
}

type AuthResponse = { token: string; user: User };

export const authApi = {
    register: (username: string, email: string, password: string) =>
        request<AuthResponse>("/api/auth/register", { method: "POST", json: { username, email, password } }),
    login: (email: string, password: string) =>
        request<AuthResponse>("/api/auth/login", { method: "POST", json: { email, password } }),
    me: () => request<{ user: User }>("/api/auth/me"),
};

export const resumeApi = {
    upload: (pdf: File, image?: File | null) => {
        const formData = new FormData();
        formData.append("resume", pdf);
        if (image) formData.append("image", image);
        return request<{ resume: Resume }>("/api/resume/upload", { method: "POST", formData });
    },
    analyze: (data: { resumeId: string; companyName: string; jobTitle: string; jobDescription: string }) =>
        request<{ analysis: Analysis }>("/api/resume/analyze", { method: "POST", json: data }),
    list: () => request<{ resumes: Resume[] }>("/api/resume"),
    get: (id: string) => request<{ resume: Resume }>(`/api/resume/${id}`),
    remove: (id: string) => request<{ message: string; id: string }>(`/api/resume/${id}`, { method: "DELETE" }),
};
