import { Link } from "react-router";
import { useState } from "react";

export default function Landing() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  // টিম মেম্বারদের ডাটা
  const teamMembers = [
    { name: "Mahammad Hasan", role: "Team Leader / Frontend", img: "/images/team/mahamud.jpg" },
    { name: "Shanawaz Sakib", role: "Core System Integration", img: "/images/team/sakib.jpg", highlight: true },
    { name: "Ashikur Rahman Himel", role: "Database & QA", img: "/images/team/himel.jpg" },
    { name: "Rasel Ratul", role: "UI/UX Designer", img: "/images/team/ratul.jpg" }
  ];

  // স্মার্ট ফিচার কার্ডের ডাটা
  const features = [
    {
      title: "ATS Optimization",
      desc: "Instantly see how tracking systems read your resume and fix keyword gaps.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgClass: "bg-purple-50",
      textClass: "text-purple-600",
      ringClass: "ring-purple-100 group-hover:ring-purple-300",
      glowClass: "bg-purple-400",
      arrowClass: "text-purple-500",
      hoverBg: "from-purple-50/50"
    },
    {
      title: "Instant Feedback",
      desc: "Powered by Gemini AI to provide actionable advice on formatting and impact.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      bgClass: "bg-blue-50",
      textClass: "text-blue-600",
      ringClass: "ring-blue-100 group-hover:ring-blue-300",
      glowClass: "bg-blue-400",
      arrowClass: "text-blue-500",
      hoverBg: "from-blue-50/50"
    },
    {
      title: "AI Caching System",
      desc: "Lightning-fast responses. We cache analysis results securely for instant access.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      bgClass: "bg-pink-50",
      textClass: "text-pink-600",
      ringClass: "ring-pink-100 group-hover:ring-pink-300",
      glowClass: "bg-pink-400",
      arrowClass: "text-pink-500",
      hoverBg: "from-pink-50/50"
    }
  ];

  return (
    /* ⭐ নতুন স্মার্ট ব্যাকগ্রাউন্ড ⭐ */
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden font-sans text-slate-800 selection:bg-purple-200">
      
      {/* ১. হালকা টেক গ্রিড প্যাটার্ন (উপরের দিক থেকে নিচে ফেড হবে) */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_60%,transparent_100%)] opacity-70"></div>

      {/* ২. গ্লোয়িং মেশ গ্রেডিয়েন্ট (নীল, বেগুনি ও গোলাপি আলোর বলয়) */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-200/40 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-200/40 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[50%] bg-pink-200/30 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-extrabold text-slate-900 tracking-tight">AI Resume Analyzer</span>
          </div>
          
          <div className="hidden md:flex gap-6 items-center text-sm font-bold text-slate-500">
            <a href="#features" className="hover:text-purple-600 transition">Features</a>
            <a href="#team" className="hover:text-purple-600 transition">Team</a>
            <button onClick={() => { setIsAuthModalOpen(true); setIsLogin(true); }} className="hover:text-purple-600 transition">Log In</button>
            <button onClick={() => { setIsAuthModalOpen(true); setIsLogin(false); }} className="bg-slate-900 text-white px-5 py-2 rounded-full font-semibold hover:bg-slate-800 transition shadow-md hover:shadow-lg hover:-translate-y-0.5 transform">Sign Up</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto text-center pt-40 px-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 text-xs font-bold text-slate-600 mb-6 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
          Powered by Google Gemini AI
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          Beat the ATS. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500">
            Land the Interview.
          </span>
        </h1>
        
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 font-medium">
          Stop guessing why you're not getting hired. Upload your resume, paste the job description, and let our AI pinpoint exactly what needs to change.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button onClick={() => { setIsAuthModalOpen(true); setIsLogin(false); }} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3.5 rounded-full font-bold hover:from-blue-500 hover:to-purple-500 transition shadow-[0_8px_30px_rgb(124,58,237,0.3)] hover:shadow-[0_8px_30px_rgb(124,58,237,0.5)] transform hover:-translate-y-1">
            Analyze Your Resume
          </button>
          <button onClick={() => { setIsAuthModalOpen(true); setIsLogin(true); }} className="w-full sm:w-auto bg-white/80 backdrop-blur-md border border-slate-200 text-slate-700 px-8 py-3.5 rounded-full font-bold hover:bg-white transition shadow-sm hover:shadow-md transform hover:-translate-y-1">
            Sign In
          </button>
        </div>

        {/* Dashboard Mockup (Glassmorphism effect) */}
        <div className="mt-20 relative mx-auto max-w-4xl rounded-2xl border border-white/50 bg-white/70 backdrop-blur-2xl shadow-2xl shadow-slate-300/50 overflow-hidden ring-1 ring-slate-900/5">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/50 bg-white/40">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="ml-4 text-xs text-slate-500 font-mono font-semibold">ai-resume-analyzer/dashboard</span>
          </div>
          
          <div className="p-6 md:p-10 text-left grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 bg-white/60 rounded-xl p-6 border border-white/80 shadow-sm flex flex-col items-center justify-center">
              <h3 className="text-slate-500 text-sm font-bold mb-4 uppercase tracking-wide">ATS Score</h3>
              <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-purple-100">
                <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-dashed animate-[spin_10s_linear_infinite]"></div>
                <span className="text-4xl font-extrabold text-slate-800">94<span className="text-lg text-slate-400">/100</span></span>
              </div>
              <p className="text-green-600 text-sm mt-4 font-bold flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                Highly Matched
              </p>
            </div>
            
            <div className="col-span-2 bg-white/60 rounded-xl p-6 border border-white/80 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-slate-800 font-bold">Skill Analysis</h3>
                <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded">Gemini AI</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1 font-semibold"><span className="text-slate-600">React & TypeScript</span><span className="text-green-600">Matched</span></div>
                  <div className="w-full bg-slate-200/50 rounded-full h-2.5"><div className="bg-green-500 h-2.5 rounded-full w-[90%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1 font-semibold"><span className="text-slate-600">Node.js Backend</span><span className="text-green-600">Matched</span></div>
                  <div className="w-full bg-slate-200/50 rounded-full h-2.5"><div className="bg-green-500 h-2.5 rounded-full w-[85%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1 font-semibold"><span className="text-slate-600">Docker & CI/CD</span><span className="text-red-500">Missing</span></div>
                  <div className="w-full bg-slate-200/50 rounded-full h-2.5"><div className="bg-red-500 h-2.5 rounded-full w-[20%]"></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ⭐ Smart Features Section ⭐ */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto mt-32 px-6">
        <div className="relative w-full h-64 md:h-80 rounded-3xl overflow-hidden mb-12 border border-white/50 shadow-2xl">
          <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2000&auto=format&fit=crop" alt="AI Technology" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/70 to-transparent"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-3">Intelligent Features</h2>
            <p className="text-slate-700 text-lg font-medium max-w-2xl">Our Gemini AI engine analyzes your resume against real job descriptions.</p>
          </div>
        </div>

        {/* প্রিমিয়াম গ্লাস কার্ডস */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div 
              key={i} 
              className="relative bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-2 overflow-hidden"
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.hoverBg} to-transparent pointer-events-none`}></div>
              
              <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform duration-300 group-hover:scale-110 ${feature.bgClass} ${feature.textClass} ring-1 ${feature.ringClass}`}>
                {feature.icon}
                <div className={`absolute inset-0 rounded-2xl blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300 ${feature.glowClass}`}></div>
              </div>

              <h3 className="relative text-xl font-bold text-slate-900 mb-3 flex items-center justify-between">
                {feature.title}
                <span className={`opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ${feature.arrowClass}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </span>
              </h3>
              <p className="relative text-slate-500 text-sm leading-relaxed font-medium">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ⭐ Team Section (Real Photos) ⭐ */}
      <section id="team" className="relative z-10 max-w-6xl mx-auto mt-32 mb-20 px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Meet the Team</h2>
          <p className="text-slate-500 font-medium">NUBTK CSE 4204 - Team T05</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {teamMembers.map((member, i) => (
            <div 
              key={i} 
              className={`bg-white/70 backdrop-blur-lg border p-6 rounded-2xl flex flex-col items-center text-center shadow-sm hover:shadow-xl transition duration-300
              ${member.highlight ? 'border-purple-300 ring-2 ring-purple-100 transform -translate-y-2' : 'border-white/80'}`}
            >
              <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-white shadow-md bg-slate-100">
                <img 
                  src={member.img} 
                  alt={member.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerText = member.name.split(' ').map(n => n[0]).join('');
                    e.currentTarget.parentElement!.className += ' flex items-center justify-center text-xl font-bold text-slate-400';
                  }}
                />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{member.name}</h4>
              <p className="text-xs text-slate-500 font-semibold mt-1">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white/90 backdrop-blur-xl border border-white w-full max-w-md rounded-2xl shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-5 text-slate-400 hover:text-slate-700 text-2xl font-bold">&times;</button>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
              <p className="text-slate-500 text-sm mt-2">{isLogin ? 'Log in to continue your job journey' : 'Start your AI-powered job search today'}</p>
            </div>

            <form className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">Username</label>
                  <input type="text" placeholder="johndoe123" className="w-full mt-1 p-3 bg-white/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition font-medium" />
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <input type="email" placeholder="you@example.com" className="w-full mt-1 p-3 bg-white/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition font-medium" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <input type="password" placeholder="••••••••" className="w-full mt-1 p-3 bg-white/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition font-medium" />
              </div>
              
              <button type="button" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3.5 rounded-lg hover:from-blue-500 hover:to-purple-500 transition mt-4 shadow-lg shadow-purple-500/30 transform hover:-translate-y-0.5">
                {isLogin ? 'Log In' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-purple-600 hover:underline">
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}