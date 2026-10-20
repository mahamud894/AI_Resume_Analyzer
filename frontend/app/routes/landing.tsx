import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "~/lib/auth"; // ⭐ মেইন প্রজেক্টের অথ স্টোর ইম্পোর্ট করা হলো

// ⭐ ১. টাইপিং অ্যানিমেশন কম্পোনেন্ট ⭐
function TypewriterText({ text, delay = 50, startDelay = 0, className = "" }: { text: string, delay?: number, startDelay?: number, className?: string }) {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(startTimer);
  }, [startDelay]);

  useEffect(() => {
    if (started && currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText((prevText) => prevText + text[currentIndex]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text, started]);

  return (
    <span className={className}>
      {currentText}
      {currentIndex < text.length && started && (
        <span className="border-r-4 border-purple-500 animate-pulse ml-1 inline-block h-[1em] align-middle"></span>
      )}
    </span>
  );
}

// ⭐ ২. মূল ল্যান্ডিং পেজ ⭐
export default function Landing() {
  const navigate = useNavigate();
  
  // ⭐ Zustand Auth Store থেকে ফাংশন ও স্টেট নেওয়া হলো ⭐
  const { login, register, isLoading, error, clearError } = useAuthStore();

  // মডাল স্টেট
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  
  // ফর্ম স্টেট
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  const teamMembers = [
    { name: "Mahammad Hasan", role: "Team Leader / Frontend", id: "11220320828", img: "/images/team/mahamud.jpg" },
    { name: "Shanawaz Sakib", role: "Core System Integration", id: "11220320916", img: "/images/team/sakib.jpg" },
    { name: "Ashikur Rahman Himel", role: "Database & QA", id: "11220320833", img: "/images/team/himel.jpg" },
    { name: "Rasel Ratul", role: "Backend Developer", id: "11220320827", img: "/images/team/ratul.jpg" }
  ];

  const features = [
    {
      title: "ATS Optimization",
      desc: "Instantly see how tracking systems read your resume and fix keyword gaps.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgClass: "bg-purple-50", textClass: "text-purple-600", ringClass: "ring-purple-100 group-hover:ring-purple-300", glowClass: "bg-purple-400", arrowClass: "text-purple-500", hoverBg: "from-purple-50/50"
    },
    {
      title: "Instant Feedback",
      desc: "Powered by Gemini AI to provide actionable advice on formatting and impact.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      bgClass: "bg-blue-50", textClass: "text-blue-600", ringClass: "ring-blue-100 group-hover:ring-blue-300", glowClass: "bg-blue-400", arrowClass: "text-blue-500", hoverBg: "from-blue-50/50"
    },
    {
      title: "AI Caching System",
      desc: "Lightning-fast responses. We cache analysis results securely for instant access.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      bgClass: "bg-pink-50", textClass: "text-pink-600", ringClass: "ring-pink-100 group-hover:ring-pink-300", glowClass: "bg-pink-400", arrowClass: "text-pink-500", hoverBg: "from-pink-50/50"
    }
  ];

  // ⭐ নতুন handleAuthSubmit (Zustand ব্যবহার করে) ⭐
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    clearError(); // আগের কোনো এরর থাকলে মুছে ফেলবে

    let success = false;
    
    // Zustand স্টোরের ফাংশন কল করা হচ্ছে
    if (isLogin) {
      success = await login(email, password);
    } else {
      success = await register(username, email, password);
    }

    // লগইন সফল হলে সরাসরি Upload পেজে চলে যাবে
    if (success) {
      navigate("/upload");
    }
  };

  // এরর মেসেজ (লোকাল ফর্ম এরর অথবা Zustand থেকে আসা এরর)
  const displayError = formError || error;

  return (
    <div className="min-h-screen animate-gradient-bg relative overflow-hidden font-sans text-slate-800 selection:bg-purple-200">
      
      <style>{`
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-bg {
          background: linear-gradient(-45deg, #f8fafc, #e0e7ff, #fae8ff, #f8fafc);
          background-size: 400% 400%;
          animation: gradientBG 15s ease infinite;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite alternate; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_60%,transparent_100%)] opacity-50"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-300/30 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none z-0 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-300/30 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none z-0 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[50%] bg-pink-300/30 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none z-0 animate-blob animation-delay-4000"></div>

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
            <button onClick={() => { setIsAuthModalOpen(true); setIsLogin(true); setFormError(""); clearError(); }} className="hover:text-purple-600 transition">Log In</button>
            <button onClick={() => { setIsAuthModalOpen(true); setIsLogin(false); setFormError(""); clearError(); }} className="bg-slate-900 text-white px-5 py-2 rounded-full font-semibold hover:bg-slate-800 transition shadow-md hover:shadow-lg hover:-translate-y-0.5 transform">Sign Up</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto text-center pt-48 md:pt-56 px-6 pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 text-xs font-bold text-slate-600 mb-8 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
          Powered by Google Gemini AI
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-8">
          <TypewriterText text="Beat the ATS." delay={60} startDelay={300} />
          <br />
          <TypewriterText 
            text="Land the Interview." 
            delay={60} 
            startDelay={1500} 
            className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500"
          />
        </h1>
        
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 font-medium">
          <TypewriterText 
            text="Stop guessing why you're not getting hired. Upload your resume, paste the job description, and let our AI pinpoint exactly what needs to change." 
            delay={15} 
            startDelay={3200} 
          />
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button onClick={() => { setIsAuthModalOpen(true); setIsLogin(false); setFormError(""); clearError(); }} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3.5 rounded-full font-bold hover:from-blue-500 hover:to-purple-500 transition shadow-[0_8px_30px_rgb(124,58,237,0.3)] hover:shadow-[0_8px_30px_rgb(124,58,237,0.5)] transform hover:-translate-y-1">
            Analyze Your Resume
          </button>
          <button onClick={() => { setIsAuthModalOpen(true); setIsLogin(true); setFormError(""); clearError(); }} className="w-full sm:w-auto bg-white/80 backdrop-blur-md border border-slate-200 text-slate-700 px-8 py-3.5 rounded-full font-bold hover:bg-white transition shadow-sm hover:shadow-md transform hover:-translate-y-1">
            Sign In
          </button>
        </div>

        {/* Dashboard Mockup */}
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

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto mt-20 px-6 scroll-mt-24">
        <div className="relative w-full h-64 md:h-80 rounded-3xl overflow-hidden mb-12 border border-white/50 shadow-xl group">
          <img src="https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2000&auto=format&fit=crop" alt="AI Technology" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f8fafc] via-[#f8fafc]/90 to-transparent"></div>
          
          <div className="absolute inset-0 flex flex-col justify-center items-start text-left px-8 md:px-16">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-2 bg-purple-100 px-3 py-1 rounded-full">Core Engine</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-3">Intelligent Features</h2>
            <p className="text-slate-600 text-base md:text-lg font-medium max-w-lg">Our Gemini AI engine analyzes your resume against real job descriptions to give you the ultimate edge.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="relative bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-2 overflow-hidden">
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
              <p className="relative text-slate-500 text-sm leading-relaxed font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="relative z-10 max-w-6xl mx-auto mt-32 mb-20 px-6 scroll-mt-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Team</span>
          </h2>
          <p className="text-slate-500 font-semibold tracking-wide uppercase text-sm">NUBTK CSE 4204 - Team T05</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {teamMembers.map((member, i) => (
            <div key={i} className="group relative bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-3xl flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_40px_rgba(168,85,247,0.15)] overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 via-transparent to-blue-100/0 group-hover:from-purple-100/60 group-hover:to-blue-100/60 transition-all duration-500 pointer-events-none"></div>
              <div className="relative z-10 transition-transform duration-500 group-hover:scale-105">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md relative">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerText = member.name.split(' ').map(n => n[0]).join(''); e.currentTarget.parentElement!.className += ' flex items-center justify-center text-xl font-bold text-slate-400'; }} />
                </div>
              </div>
              <div className="relative z-10 mt-5 flex flex-col items-center">
                <h4 className="font-extrabold text-slate-900 text-base tracking-tight group-hover:text-purple-700 transition-colors">{member.name}</h4>
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-slate-100 text-slate-600 border-slate-200">{member.role}</span>
                </div>
                <p className="text-xs text-slate-400 font-semibold mt-2">ID: {member.id}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Auth Modal with Zustand Logic */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white/90 backdrop-blur-xl border border-white w-full max-w-md rounded-2xl shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-5 text-slate-400 hover:text-slate-700 text-2xl font-bold">&times;</button>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
              <p className="text-slate-500 text-sm mt-2">{isLogin ? 'Log in to continue your job journey' : 'Start your AI-powered job search today'}</p>
            </div>

            {displayError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-100 text-center">
                {displayError}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleAuthSubmit}>
              {!isLogin && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">Username</label>
                  <input 
                    type="text" 
                    placeholder="johndoe123" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full mt-1 p-3 bg-white/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition font-medium" 
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <input 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full mt-1 p-3 bg-white/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition font-medium" 
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full mt-1 p-3 bg-white/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition font-medium" 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3.5 rounded-lg hover:from-blue-500 hover:to-purple-500 transition mt-4 shadow-lg shadow-purple-500/30 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : (isLogin ? 'Log In' : 'Sign Up')}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => { setIsLogin(!isLogin); setFormError(""); clearError(); }} className="font-bold text-purple-600 hover:underline">
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}