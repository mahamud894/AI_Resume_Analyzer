import { useEffect, useState } from "react";
import { Link } from "react-router";
import { resumeApi } from "~/lib/api";
import { useAuthStore } from "~/lib/auth";
import { useRequireAuth } from "~/lib/hooks";
import { formatSize } from "~/lib/utils";

export const meta = () => [
    { title: "Resumind | Wipe Data" },
    { name: "description", content: "Delete your uploaded resumes" },
];

// Developer/maintenance page: lists the user's resumes and deletes them through the API.
const WipeApp = () => {
    const isAuthenticated = useRequireAuth();
    const user = useAuthStore((state) => state.user);
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");

    const loadResumes = async () => {
        setIsLoading(true);
        try {
            const { resumes } = await resumeApi.list();
            setResumes(resumes);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load resumes");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) loadResumes();
    }, [isAuthenticated]);

    const handleDelete = async () => {
        if (!confirm(`Delete all ${resumes.length} resume(s) and their analyses? This cannot be undone.`)) return;
        setIsDeleting(true);
        setError("");
        // allSettled: one failure doesn't stop the others from being deleted
        const results = await Promise.allSettled(resumes.map((r) => resumeApi.remove(r.id)));
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed) setError(`${failed} resume(s) could not be deleted`);
        setIsDeleting(false);
        loadResumes();
    };

    if (!isAuthenticated || isLoading) {
        return <div className="p-10">Loading...</div>;
    }

    return (
        <main className="p-10 flex flex-col gap-4">
            <Link to="/" className="back-button w-fit">
                <img src="/icons/back.svg" alt="back" className="w-2.5 h-2.5" />
                <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
            </Link>
            <p>Authenticated as: <b>{user?.username}</b> ({user?.email})</p>
            <p>Existing resumes: {resumes.length}</p>
            <div className="flex flex-col gap-2">
                {resumes.map((resume) => (
                    <div key={resume.id} className="flex flex-row gap-4">
                        <p>{resume.originalName}</p>
                        <p className="text-gray-500">{formatSize(resume.fileSize)}</p>
                        <p className="text-gray-500">{resume.analyses.length} analysis(es)</p>
                    </div>
                ))}
            </div>
            {error && <p className="text-red-600">{error}</p>}
            <div>
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer disabled:opacity-50"
                    onClick={handleDelete}
                    disabled={isDeleting || resumes.length === 0}
                >
                    {isDeleting ? "Deleting..." : "Wipe App Data"}
                </button>
            </div>
        </main>
    );
};

export default WipeApp;
