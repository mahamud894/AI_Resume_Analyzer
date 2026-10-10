// Shapes of the JSON returned by the backend API (see backend/README.md)

interface User {
    id: string;
    username: string;
    email: string;
    createdAt: string;
}

interface Analysis {
    id: string;
    resumeId: string;
    userId: string;
    companyName?: string;
    jobTitle: string;
    jobDescription: string;
    feedback: Feedback;
    createdAt: string;
}

interface Resume {
    id: string;
    userId: string;
    originalName: string;
    fileSize: number;
    uploadDate: string;
    // Protected API paths — load them with fetchProtectedFile() (they need the JWT header)
    fileUrl: string;
    imageUrl: string | null;
    // Newest first
    analyses: Analysis[];
}

interface Feedback {
    overallScore: number;
    ATS: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
        }[];
    };
    toneAndStyle: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    content: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    structure: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    skills: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
}
