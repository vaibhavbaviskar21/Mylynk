import React, { useState, useEffect } from "react";
import * as LucideImport from "lucide-react";
import { UserData } from "./types";
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import PublicProfile from "./components/PublicProfile";
import { MyLynkLogo } from "./components/MyLynkLogo";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [targetProfile, setTargetProfile] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // States for the interactive "actual preview" and live infographic simulator
  const [activeProtoTheme, setActiveProtoTheme] = useState("aurora");
  const [clickStats, setClickStats] = useState(1482);
  const [recentAction, setRecentAction] = useState<string | null>(null);
  const [triggeredNodeId, setTriggeredNodeId] = useState<string | null>(null);

  // Custom preview themes config mapping
  const PREVIEW_THEMES_MAPPING = [
    {
      id: "aurora",
      name: "Aurora Glow",
      bgStyle: "bg-gradient-to-tr from-indigo-950/90 via-purple-900/40 to-neutral-900 border border-indigo-500/20",
      cardStyle: "bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-[0_8px_32px_rgba(236,72,153,0.15)]",
      btnStyle: "bg-gradient-to-r from-pink-500/80 to-indigo-505/85 border border-pink-400/20 text-white rounded-2xl hover:scale-[1.04]",
      subStyle: "text-pink-300 font-semibold font-sans",
      tagline: "Custom background glow palettes with physics-based layouts",
      font: "font-sans",
    },
    {
      id: "cyber",
      name: "Cyber Spark",
      bgStyle: "bg-black border border-emerald-500/20",
      cardStyle: "bg-[#090d0b] border border-emerald-500/30 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.1)]",
      btnStyle: "bg-slate-950 border-2 border-emerald-400 text-emerald-400 rounded-none hover:translate-x-1 hover:bg-emerald-950/50",
      subStyle: "text-amber-400 font-mono text-xs",
      tagline: "High contrast terminal themes & pixel-sharp mono lists",
      font: "font-mono",
    },
    {
      id: "sage",
      name: "Forest Sage",
      bgStyle: "bg-[#f2eee3] border border-[#d6cfb8]",
      cardStyle: "bg-white border border-[#dde3dd] text-[#1c2a22] shadow-[0_12px_24px_rgba(28,42,34,0.06)]",
      btnStyle: "bg-[#1c2a22] text-[#f2eee3] rounded-full hover:shadow-lg hover:bg-[#283b30]",
      subStyle: "text-[#5a6f5e] font-serif italic text-xs",
      tagline: "Warm organic cozy palettes with elegant soft radius curves",
      font: "font-serif",
    },
    {
      id: "cosmic",
      name: "Cosmic Nebula",
      bgStyle: "bg-gradient-to-br from-slate-950 via-neutral-950 to-indigo-950 border border-cyan-500/20",
      cardStyle: "bg-indigo-950/40 backdrop-blur-xl border border-cyan-500/30 text-indigo-100 shadow-[0_4px_30px_rgba(6,182,212,0.2)]",
      btnStyle: "bg-cyan-950/40 border-2 border-cyan-400/80 text-cyan-300 rounded-xl hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]",
      subStyle: "text-cyan-400 font-semibold tracking-wider text-xs uppercase",
      tagline: "Interstellar dark glows with floating glossy elements",
      font: "font-sans",
    },
  ];

  // Resolve Routing configuration on mount
  useEffect(() => {
    const resolveRoutesAndSession = async () => {
      try {
        const path = window.location.pathname;
        let profileName: string | null = null;

        if (path && path !== "/") {
          const parts = path.split("/").filter(Boolean);
          if (parts[0] === "p" && parts[1]) {
            profileName = parts[1];
          } else if (parts[0] && !parts[0].includes(".") && parts[0] !== "api") {
            profileName = parts[0];
          }
        }

        if (profileName) {
          setTargetProfile(profileName);
          setLoadingSession(false);
          return;
        }

        // Try load session from storage
        const cachedUser = sessionStorage.getItem("bio_user");
        if (cachedUser) {
          const res = await fetch(`/api/user/${cachedUser}`);
          if (res.ok) {
            const data = await res.json();
            setSessionUser(cachedUser);
            setUserData(data);
          } else {
            sessionStorage.removeItem("bio_user");
          }
        }
      } catch (err) {
        console.error("Session resolve issue:", err);
      } finally {
        setLoadingSession(false);
      }
    };

    resolveRoutesAndSession();
  }, []);

  const handleLoginSuccess = (username: string, portfolio: UserData) => {
    sessionStorage.setItem("bio_user", username);
    setSessionUser(username);
    setUserData(portfolio);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("bio_user");
    setSessionUser(null);
    setUserData(null);
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center font-sans select-none">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-neutral-400 font-medium tracking-wide">
            Preparing your link canvas...
          </p>
        </div>
      </div>
    );
  }

  // If a public profile route is active, render the PublicProfile directly
  if (targetProfile) {
    return <PublicProfile username={targetProfile} />;
  }

  // If logged in, load the rich builder dashboard dashboard
  if (sessionUser && userData) {
    return (
      <Dashboard
        username={sessionUser}
        initialData={userData}
        onLogout={handleLogout}
      />
    );
  }

  // Unified landing page for unauthenticated visitors
  const selectedThemeConfig = PREVIEW_THEMES_MAPPING.find((t) => t.id === activeProtoTheme) || PREVIEW_THEMES_MAPPING[0];

  const handleSimulatedLinkClick = (nodeName: string) => {
    setClickStats((prev) => prev + 1);
    setTriggeredNodeId(nodeName);
    setRecentAction(`Clicked: "${nodeName}"`);
    setTimeout(() => {
      setTriggeredNodeId(null);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background ambient light shapes */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[40%] rounded-full bg-indigo-900/10 blur-[80px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[45%] h-[45%] rounded-full bg-pink-900/10 blur-[90px] pointer-events-none" />

      {/* Landing Header */}
      <header className="px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-neutral-900 sticky top-0 bg-neutral-950/85 backdrop-blur-md z-40 shrink-0">
        <div className="flex items-center gap-3 select-none">
          <MyLynkLogo className="w-9 h-9" />
          <div>
            <h1 className="text-base font-black text-white tracking-tight leading-none bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">mylynk</h1>
            <p className="text-[9px] text-indigo-400 font-mono mt-0.5 tracking-wider uppercase font-black">Workspace Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Action links removed */}
        </div>
      </header>

      {/* Landing Hero Split Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start py-8 md:py-14 relative z-10">
        
        {/* Left Side: Pitch and the ACTUAL interactive link preview infographic */}
        <div className="lg:col-span-7 space-y-10 selection:bg-neutral-800">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/45 border border-indigo-900/50 text-[10px] font-bold text-indigo-300 uppercase tracking-widest leading-none">
              <LucideImport.Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Next-Gen Link-in-Bio Canvas</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Connect everything. <br />
              Do it in <span className="bg-gradient-to-r from-indigo-400 via-pink-400 to-amber-300 bg-clip-text text-transparent font-black">one single link</span>.
            </h2>
            <p className="text-sm text-neutral-400 max-w-xl font-normal leading-relaxed">
              Build a personalized landing page that holds your portfolios, projects, and custom CTA triggers. Optimize conversion in seconds with live, responsive design selectors and server-grade click infographics.
            </p>
          </div>

          {/* Interactive Smartphone Link Preview Playground ("Actual preview of the link") */}
          <div className="p-6 rounded-3xl bg-neutral-900/40 border border-neutral-850 backdrop-blur-sm shadow-xl space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
                  <span>Interactive Link Playground</span>
                </h3>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Test-drive live layouts directly in this preview frame. Click on simulated channels to monitor live tracker events.
                </p>
              </div>

              {/* Theme controllers selector */}
              <div className="flex flex-wrap gap-1 bg-neutral-955 p-1 rounded-xl border border-neutral-800/80">
                {PREVIEW_THEMES_MAPPING.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setActiveProtoTheme(theme.id)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      activeProtoTheme === theme.id
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900"
                    }`}
                  >
                    {theme.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Smartphone and Live Analytics Infographic row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              
              {/* Smartphone Frame Mockup */}
              <div className="flex justify-center items-center">
                <div className={`w-full max-w-[2700px] sm:max-w-[260px] aspect-[9/18] rounded-[2rem] border-4 border-neutral-800 transition-all duration-500 relative flex flex-col p-3 shadow-2xl relative overflow-hidden group select-none ring-4 ring-neutral-900/50 ${selectedThemeConfig.bgStyle}`}>
                  
                  {/* Speaker mesh pill */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-neutral-800 rounded-full flex items-center justify-center z-10">
                    <div className="w-1.5 h-1.5 bg-neutral-950 rounded-full mr-2" />
                    <div className="w-5 h-0.5 bg-neutral-950 rounded-full" />
                  </div>

                  {/* Phone Header Inner Canvas profile */}
                  <div className="mt-8 flex flex-col items-center text-center space-y-2">
                    {/* Simulated Avatar holds a beautiful image placeholder */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full border-2 border-indigo-400/50 p-0.5 shadow-md bg-neutral-900 flex items-center justify-center font-bold text-white">
                        <MyLynkLogo className="w-10 h-10" />
                      </div>
                      <span className="absolute bottom-0 right-0 h-4.5 w-4.5 bg-indigo-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[8px] text-white">✓</span>
                    </div>

                    <div>
                      <h4 className={`text-xs font-bold font-sans transition-colors duration-300 ${activeProtoTheme === 'sage' ? 'text-[#1c2a22]' : 'text-white'}`}>
                        Alex Creative
                      </h4>
                      <p className={`text-[9px] font-mono mt-0.5 ${activeProtoTheme === 'sage' ? 'text-[#3f5f4f]' : 'text-indigo-400'}`}>
                        @alex_design
                      </p>
                    </div>

                    <p className={`text-[8.5px] max-w-[190px] mx-auto tracking-wide font-medium leading-relaxed ${activeProtoTheme === 'sage' ? 'text-neutral-600' : 'text-neutral-400'}`}>
                      Digital architect building minimalist web tools & visual assets.
                    </p>
                  </div>

                  {/* Scrollable list content nodes inside mockup */}
                  <div className="mt-4 space-y-2 flex-1 overflow-y-auto pr-0.5 no-scrollbar max-h-[175px]">
                    {[
                      { id: "portfolio", title: "✦ Work Portfolio '26", desc: "Design & Photo archive" },
                      { id: "youtube", title: "⚡ YouTube Masterclasses", desc: "Free development labs" },
                      { id: "prints", title: "🛍️ Print Drops Shop", desc: "Limited visual artworks" },
                      { id: "newsletter", title: "✉ Curated Inspiration", desc: "Weekly design thoughts" }
                    ].map((item) => {
                      const isTriggered = triggeredNodeId === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSimulatedLinkClick(item.title)}
                          className={`w-full text-left p-2 border transition-all duration-300 cursor-pointer text-xs flex items-center justify-between ${selectedThemeConfig.cardStyle} ${selectedThemeConfig.btnStyle} ${isTriggered ? "scale-[0.93] bg-indigo-500/10" : ""}`}
                        >
                          <div>
                            <p className="font-bold text-[9.5px] tracking-tight leading-tight">{item.title}</p>
                            <p className="text-[7.5px] opacity-70 mt-0.5 leading-none">{item.desc}</p>
                          </div>
                          <LucideImport.ArrowUpRight className="w-3 h-3 opacity-60" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Simulated footer inside phone */}
                  <div className="pt-2 text-center select-none text-[7px] mt-auto">
                    <span className={`opacity-60 uppercase font-bold tracking-widest ${activeProtoTheme === 'sage' ? 'text-neutral-600' : 'text-neutral-500'}`}>
                      Powered by mylynk
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Analytics Infographic Card on the landing page */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-850 flex flex-col justify-between flex-1 relative overflow-hidden">
                  
                  {/* Dynamic background trace */}
                  <div className="absolute -bottom-8 -right-8 w-16 h-16 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />

                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[8.5px] font-bold text-neutral-500 uppercase tracking-widest block">
                        Live Analytics Tracker
                      </span>
                      <h4 className="text-xs font-bold text-white mt-0.5 uppercase tracking-wider">
                        Workspace Performance
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-900-50 text-[9px] font-mono font-bold flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      ACTIVATED
                    </span>
                  </div>

                  {/* Big stats number */}
                  <div className="my-3 py-1.5 border-y border-neutral-900/80 flex items-baseline justify-between select-none">
                    <div>
                      <span className="text-xs text-neutral-500 block">Total Click Traffic</span>
                      <strong className="text-2xl font-black text-white font-mono tracking-tight tracking-widest leading-none">
                        {clickStats.toLocaleString()}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-neutral-500 block">Pulse Factor</span>
                      <span className="text-xs text-indigo-400 font-bold font-mono">+12.4%</span>
                    </div>
                  </div>

                  {/* Interactive Clicks Log notification banner */}
                  <div className="h-9 flex items-center justify-center rounded-xl bg-neutral-900/80 border border-neutral-850 px-2.5 overflow-hidden">
                    <AnimatePresence mode="wait">
                      {recentAction ? (
                        <motion.div
                          key={recentAction}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-[9px] text-white flex items-center gap-1.5 font-mono"
                        >
                          <LucideImport.Activity className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
                          <span>Event Captured: <strong>{recentAction}</strong></span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-[9px] text-neutral-500 flex items-center gap-1.5"
                        >
                          <LucideImport.MousePointerClick className="w-3.5 h-3.5 text-neutral-600 animate-bounce" />
                          <span>Tap any link inside Mockup to log action</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Histogram bars infographics */}
                  <div className="space-y-1.5 pt-3 border-t border-neutral-900/70">
                    <div className="flex justify-between items-center text-[8px] text-neutral-500">
                      <span>MONITOR PERFORMANCE</span>
                      <span>96% CONVERSION</span>
                    </div>
                    <div className="flex items-end justify-between gap-1.5 h-10 pt-1">
                      {[70, 85, 45, 90, 60, 110, 80, 130, 95].map((val, i) => {
                        // Increase height of last bars dynamically when clicked
                        const increase = triggeredNodeId ? Math.floor(Math.random() * 15) : 0;
                        const heightVal = Math.min(val + increase, 140);
                        return (
                          <div key={i} className="flex-1 bg-neutral-900 rounded-sm relative overflow-hidden h-full">
                            <motion.div
                              className={`absolute bottom-0 left-0 w-full rounded-sm ${
                                i === 7 ? "bg-indigo-500" : i === 8 ? "bg-pink-500" : "bg-neutral-800"
                              }`}
                              animate={{ height: `${(heightVal / 140) * 100}%` }}
                              transition={{ type: "spring", stiffness: 120, damping: 10 }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Micro bento highlights list */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-2xl">
                    <span className="text-[8px] text-neutral-500 block uppercase font-bold">Theme Response</span>
                    <p className="text-[10px] text-neutral-300 font-bold mt-1 line-clamp-1">{selectedThemeConfig.name}</p>
                    <p className="text-[8px] text-neutral-500 mt-0.5 line-clamp-1">{selectedThemeConfig.tagline}</p>
                  </div>
                  <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-2xl">
                    <span className="text-[8px] text-neutral-500 block uppercase font-bold">Workspace Status</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold mt-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      Secure Sync
                    </span>
                    <p className="text-[8px] text-neutral-500 mt-0.5 line-clamp-1">Offline state recovery active</p>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Core Feature Bento Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-neutral-900/20 border border-neutral-900 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-850 text-indigo-400 shrink-0">
                <LucideImport.Sliders className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Visual Customizer</h4>
                <p className="text-xs text-neutral-500 mt-1 font-medium leading-relaxed">
                  Design layouts, fonts, color palettes, and buttons with immediate interactive sandbox preview.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/20 border border-neutral-900 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-855 text-indigo-400 shrink-0">
                <LucideImport.Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Dynamic Brand QR</h4>
                <p className="text-xs text-neutral-500 mt-1 font-medium leading-relaxed">
                  Generate beautiful custom-branded poster stands to print or share alongside custom CTA slogans inside the QR matrix.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Floating login authorization module */}
        <div id="credentials-scroll-anchor" className="lg:col-span-5 flex justify-center lg:justify-end items-center sticky top-24 pt-4 lg:pt-0">
          <div className="w-full relative group">
            
            {/* Ambient neon backdrop ring */}
            <div className="absolute -inset-1 rounded-[2.2rem] bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-400 opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500 pointer-events-none" />
            
            <div className="relative">
              <LoginForm onSuccess={handleLoginSuccess} />
            </div>
          </div>
        </div>
      </main>

      {/* Landing Footer */}
      <footer className="border-t border-neutral-900/80 py-5 px-6 shrink-0 bg-neutral-950 select-none text-center sm:text-left relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-neutral-500 font-sans tracking-wide">
            &copy; {new Date().getFullYear()} mylynk. All rights reserved.
          </p>
          <div className="flex gap-4 text-[10px] text-neutral-400 font-sans">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span>&bull;</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            <span>&bull;</span>
            <span className="text-indigo-400 hover:underline cursor-pointer">Support Care</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
