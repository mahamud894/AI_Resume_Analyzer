import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import InfoSections, {CallToAction, Footer} from "~/components/LandingSections";
import {Link} from "react-router";
import {useEffect, useState} from "react";
import {resumeApi} from "~/lib/api";
import {useRequireAuth} from "~/lib/hooks";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const isAuthenticated = useRequireAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    resumeApi.list()
        .then(({ resumes }) => setResumes(resumes))
        .catch((err) => setError(err.message))
        .finally(() => setLoadingResumes(false));
  }, [isAuthenticated]);

  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar />

    <section className="main-section">
      <div className="page-heading py-6 sm:py-12 lg:py-16">
        <h1>Track Your Applications & Resume Ratings</h1>
        {error ? (
            <h2 className="!text-red-600">{error}</h2>
        ) : !loadingResumes && resumes?.length === 0 ? (
            <h2>No resumes found. Upload your first resume to get feedback.</h2>
        ): (
          <h2>Review your submissions and check AI-powered feedback.</h2>
        )}
      </div>
      {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" alt="Loading your resumes" className="w-[160px] sm:w-[200px]" />
          </div>
      )}

      {!loadingResumes && resumes.length > 0 && (
        <div className="resumes-section">
          {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume}
                          onDeleted={(id) => setResumes((list) => list.filter((r) => r.id !== id))} />
          ))}
        </div>
      )}

      {!loadingResumes && !error && resumes?.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-4 sm:mt-10 gap-4 w-full">
            <Link to="/upload" className="primary-button sm:w-fit text-xl font-semibold px-8">
              Upload Resume
            </Link>
          </div>
      )}
    </section>

    {/* Same information as the landing page, below your resumes */}
    <InfoSections />
    <CallToAction
        title="Applying for another job?"
        text="Upload your resume with the new job description and get a fresh score, Europass CV and cover letter."
        action={
          <Link to="/upload" className="primary-button sm:w-fit px-10 text-lg font-semibold">
            Analyze a Resume
          </Link>
        }
    />
    <Footer />
  </main>
}
