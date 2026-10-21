// Shapes of the JSON returned by the backend API (see backend/README.md)

interface User {
    id: string;
    username: string;
    email: string;
    // false for accounts created with "Sign in with Google" that have not set a password yet
    hasPassword: boolean;
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
    // Present (not null) when a Europass version was generated from this analysis
    improved?: { id: string; analysisId: string; createdAt: string; afterFeedback?: Feedback | null; scoredAt?: string | null } | null;
}

// ---- "Improve My Resume" (Europass CV) ----
// Text fields may contain placeholders in square brackets, e.g. "[Add your phone number]"

type ImprovementCategory = "ATS" | "toneAndStyle" | "content" | "structure" | "skills";

interface ImprovementChange {
    section: string;
    category: ImprovementCategory;
    before: string;
    after: string;
    reason: string;
}

interface CefrLanguage {
    language: string;
    listening: string;
    reading: string;
    spokenProduction: string;
    spokenInteraction: string;
    writing: string;
}

interface EuropassCv {
    personalInfo: {
        fullName: string;
        email: string;
        phone: string;
        address: string;
        linkedin: string;
        github: string;
        website: string;
    };
    aboutMe: string;
    workExperience: {
        startDate: string;
        endDate: string; // may be "Current"
        jobTitle: string;
        employer: string;
        city: string;
        country: string;
        responsibilities: string[];
    }[];
    education: {
        startDate: string;
        endDate: string;
        qualification: string;
        institution: string;
        city: string;
        country: string;
        fieldOfStudy: string;
        grade: string;    // with scale, e.g. "GPA 4.67 / 5.00"
        eqfLevel: string; // European Qualifications Framework level "1"-"8", "" for short trainings
    }[];
    languageSkills: {
        motherTongue: string[];
        otherLanguages: CefrLanguage[];
    };
    digitalSkills: string[];
    projects: { name: string; description: string; technologies: string[]; link: string }[];
    certifications: { name: string; issuer: string; date: string }[];
    communicationSkills: string;
    organisationalSkills: string;
    volunteering: string[];
    references: string;
}

interface ImprovedResume {
    id: string;
    analysisId: string;
    resumeId: string;
    userId: string;
    europassCv: EuropassCv;          // the AI version (never changed by edits)
    editedCv?: EuropassCv | null;    // the user's saved inline edits; null/undefined = use europassCv
    editedAt?: string | null;
    changes: ImprovementChange[];
    // "Before / After": the improved CV scored again for the same job; null until scored
    afterFeedback?: Feedback | null;
    scoredAt?: string | null;
    createdAt: string;
    // Present when a cover letter was generated from this improved resume
    coverLetter?: { id: string; improvedResumeId: string; updatedAt: string } | null;
}

// ---- "Generate Cover Letter" (implements cover_letter_text from the original ERD) ----

type CoverLetterTone = "formal" | "modern";

interface CoverLetterInputs {
    hiringManagerName: string;
    companyAddress: string;
    jobSource: string;
    tone: CoverLetterTone;
}

interface CoverLetterContent {
    sender: { fullName: string; email: string; phone: string; address: string; linkedin: string };
    date: string; // e.g. "11 October 2026"
    recipient: { name: string; title: string; company: string; address: string };
    subject: string;
    salutation: string;
    opening: string;
    body: string[];
    closing: string;
    signOff: string;
    signatureName: string;
    wordCount: number;
    // "Why this letter works": resume facts matched to job requirements
    highlights: { jobRequirement: string; resumeEvidence: string; cvSection: string }[];
}

interface CoverLetter {
    id: string;
    improvedResumeId: string;
    analysisId: string;
    userId: string;
    inputs: CoverLetterInputs;
    letter: CoverLetterContent;
    editedText: string | null; // the user's own edited version (plain text)
    createdAt: string;
    updatedAt: string;
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
