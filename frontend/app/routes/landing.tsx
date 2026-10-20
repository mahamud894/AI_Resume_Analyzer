import { Link } from "react-router";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-800 font-sans">
      {/* ১. নেভিগেশন বার */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-10 h-10" /> {/* আপনার লোগো দিন */}
          <span className="text-xl font-bold text-gray-900">AI Resume Analyzer</span>
        </div>
        <div className="flex gap-4">
          <Link to="/auth" className="text-gray-600 font-medium hover:text-purple-600">Log In</Link>
          <Link to="/auth" className="bg-purple-600 text-white px-5 py-2 rounded-full font-medium hover:bg-purple-700 transition">Sign Up</Link>
        </div>
      </nav>

      {/* ২. হিরো সেকশন (Main Banner) */}
      <main className="max-w-5xl mx-auto text-center mt-20 px-6">
        <span className="bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-semibold">
          Powered by Google Gemini AI
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold mt-6 leading-tight text-gray-900">
          Land Your Dream Job with <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
            Smart AI Analysis
          </span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your resume, paste the job description, and get instant ATS scores, skill-gap analysis, and personalized suggestions to stand out.
        </p>
        
        <div className="mt-10 flex justify-center gap-4">
          <Link to="/auth" className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
            Analyze Your Resume Now
          </Link>
        </div>
      </main>

      {/* ৩. ফিচার সেকশন */}
      <section className="max-w-6xl mx-auto mt-24 px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded-xl text-2xl mb-4">🎯</div>
          <h3 className="text-xl font-bold mb-2">ATS Scoring</h3>
          <p className="text-gray-600">See exactly how applicant tracking systems rate your resume against specific job roles.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 flex items-center justify-center rounded-xl text-2xl mb-4">🧠</div>
          <h3 className="text-xl font-bold mb-2">Skill Gap Analysis</h3>
          <p className="text-gray-600">Identify missing skills and get actionable recommendations to improve your profile.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="w-12 h-12 bg-green-100 text-green-600 flex items-center justify-center rounded-xl text-2xl mb-4">⚡</div>
          <h3 className="text-xl font-bold mb-2">Instant Feedback</h3>
          <p className="text-gray-600">Get AI-driven suggestions on formatting, keywords, and achievements in seconds.</p>
        </div>
      </section>
    </div>
  );
}