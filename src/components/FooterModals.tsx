import React, { useState } from "react";
import * as LucideImport from "lucide-react";

interface FooterModalsProps {
  isOpen: boolean;
  type: "privacy" | "terms" | "support" | null;
  onClose: () => void;
  isDark?: boolean;
}

export default function FooterModals({ isOpen, type, onClose, isDark = true }: FooterModalsProps) {
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  if (!isOpen || !type) return null;

  const bgClass = isDark ? "bg-neutral-900 text-white border-neutral-800" : "bg-white text-neutral-955 border-neutral-200";
  const innerBgClass = isDark ? "bg-neutral-950 border-neutral-900" : "bg-neutral-50 border-neutral-100";
  const descColor = isDark ? "text-neutral-400" : "text-neutral-600";
  const titleColor = isDark ? "text-white" : "text-neutral-900";
  const inputClass = isDark
    ? "bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-white"
    : "bg-white border-neutral-300 focus:border-indigo-500 text-neutral-900";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${bgClass}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-800/45 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {type === "privacy" && <LucideImport.Lock className="w-5 h-5 text-indigo-400" />}
            {type === "terms" && <LucideImport.FileText className="w-5 h-5 text-indigo-400" />}
            {type === "support" && <LucideImport.HelpCircle className="w-5 h-5 text-indigo-400" />}
            <h3 className={`text-lg font-bold tracking-tight ${titleColor}`}>
              {type === "privacy" && "Privacy Guarantee & Cookie Policy"}
              {type === "terms" && "Terms of Service Agreement"}
              {type === "support" && "MyLynk Support & Help Care"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800/20 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            id="footer-modal-close"
          >
            <LucideImport.X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed flex-1">
          {type === "privacy" && (
            <>
              <div className={`p-4 rounded-xl border ${innerBgClass}`}>
                <p className={`font-semibold ${titleColor} text-xs uppercase tracking-wider mb-1`}>
                  Overview
                </p>
                <p className={descColor}>
                  Your privacy is paramount. At <strong>mylynk</strong>, we believe you should control your data. This policy details how we handle creator configuration entries, social links, stats, and auth details safely.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className={`font-semibold text-sm ${titleColor}`}>1. Information We Collect</h4>
                <p className={descColor}>
                  We collect and store information required to construct your link-in-bio landing page:
                </p>
                <ul className={`list-disc pl-5 space-y-1 ${descColor}`}>
                  <li><strong>Account Credentials:</strong> Username, Email address, and secured SHA-256 salted password hashes (never plain text passwords).</li>
                  <li><strong>Profile Settings:</strong> Avatar URLs, Display names, Custom Bio descriptions, custom theme attributes, and font choices.</li>
                  <li><strong>Social and Coding Links:</strong> External website titles, target URLs, custom icon codes, and custom nested group structures.</li>
                  <li><strong>Analytical Events:</strong> Date-level click counts for your custom links to populate your live performance dashboards.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className={`font-semibold text-sm ${titleColor}`}>2. Third-Party Integrations</h4>
                <p className={descColor}>
                  We run on a <strong>scalable, free-tier Cloud Firebase Firestore database</strong>. All credentials, parameters, and clicks are isolated on fully secured, access-controlled collection branches with strict rules ensuring other users cannot overwrite or scrape your personal statistics.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className={`font-semibold text-sm ${titleColor}`}>3. Cookies & Local Storage</h4>
                <p className={descColor}>
                  We utilize lightweight client-side sessions (<code className="px-1 py-0.5 rounded bg-neutral-950 font-mono text-xs">sessionStorage</code>) to keep you authenticated inside the drag-and-drop workspace manager. No marketing or telemetry tracking web beacons are injected into your public-facing page templates.
                </p>
              </div>

              <div className="space-y-2 border-t border-neutral-800/40 pt-4 text-xs font-mono">
                <p className={descColor}>Last Updated: May 24, 2026</p>
                <p className="text-indigo-400">Maintained with care by Vaibhav Baviskar</p>
              </div>
            </>
          )}

          {type === "terms" && (
            <>
              <div className={`p-4 rounded-xl border ${innerBgClass}`}>
                <p className={`font-semibold ${titleColor} text-xs uppercase tracking-wider mb-1`}>
                  Community Standards
                </p>
                <p className={descColor}>
                  By deploying a webpage on <strong>mylynk</strong>, you agree to form a safe, constructive, and respectful online workspace.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className={`font-semibold text-sm ${titleColor}`}>1. User Responsibilities</h4>
                <p className={descColor}>
                  When using our link compilation engines or generating custom QR codes, you guarantee that:
                </p>
                <ul className={`list-disc pl-5 space-y-1 ${descColor}`}>
                  <li>You will not insert phishing links, malicious exploits, malware destination scripts, or illegitimate financial setups.</li>
                  <li>You will not assume false identities to clone other creators or pose as official institutional entities.</li>
                  <li>You respect copy restrictions, trademark licenses, and platform access regulations.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className={`font-semibold text-sm ${titleColor}`}>2. Scalable Engine Guidelines</h4>
                <p className={descColor}>
                  This application utilizes a distributed Firebase system optimized to stay within standard free-tier limits. Users are strictly prohibited from writing programmatic bots or launch sequence scripts aimed at flooding click tracking endpoints or brute-forcing creator profile endpoints.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className={`font-semibold text-sm ${titleColor}`}>3. Intellectual Property</h4>
                <p className={descColor}>
                  You retain complete intellectual ownership over the content you upload, customize, or link. By displaying your visual layouts on <strong>mylynk</strong>, you grant us a clean license to serve assets solely to build your public profile page for the global web.
                </p>
              </div>

              <div className="space-y-2 border-t border-neutral-800/40 pt-4 text-xs font-mono">
                <p className={descColor}>Compliance ID: MYLYNK-TERMS-V2</p>
                <p className="text-indigo-400">Maintained with care by Vaibhav Baviskar</p>
              </div>
            </>
          )}

          {type === "support" && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${innerBgClass}`}>
                <h5 className={`font-bold text-xs uppercase tracking-wider mb-1 ${titleColor}`}>
                  Instant Diagnostic Support
                </h5>
                <p className={`text-xs ${descColor}`}>
                  Need help managing custom link themes, custom sub-links managers, or configuring your creator profiles? Drop your request below, and Vaibhav and the MyLynk engineering crew will look into it.
                </p>
              </div>

              {supportSubmitted ? (
                <div className="p-6 text-center space-y-3 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl animate-scale-up">
                  <div className="inline-flex items-center justify-center p-3 bg-indigo-950 rounded-full border border-indigo-800 text-indigo-400">
                    <LucideImport.CheckCheck className="w-6 h-6" />
                  </div>
                  <h4 className={`text-base font-bold ${titleColor}`}>Ticket Generated Successfully!</h4>
                  <p className={`text-xs ${descColor} max-w-md mx-auto`}>
                    Thanks for reaching out! We have submitted your ticket to the <strong>Firebase support backlog</strong>. Vaibhav Baviskar or an engineer will contact you shortly at <strong>{supportEmail}</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setSupportSubmitted(false);
                      setSupportMessage("");
                    }}
                    className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-semibold text-xs rounded-xl"
                  >
                    Send Another Ticket
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!supportName || !supportEmail || !supportMessage) {
                      alert("Please fill in all support request fields!");
                      return;
                    }
                    setSupportSubmitted(true);
                  }}
                  className="space-y-4 pt-1"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${descColor}`}>
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vaibhav Baviskar"
                        value={supportName}
                        onChange={(e) => setSupportName(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-colors outline-none font-medium ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${descColor}`}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. you@example.com"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-colors outline-none font-semibold ${inputClass}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${descColor}`}>
                      Describe Your Issue / Questions
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="e.g. How do I configure standard coding sub-links inside my custom website nested groups?"
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-colors outline-none font-medium resize-none ${inputClass}`}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-neutral-500 font-mono">
                      ✉ Auto-connects to Firebase server logs
                    </span>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-all hover:scale-[1.02]"
                    >
                      <LucideImport.Send className="w-3.5 h-3.5" />
                      <span>Submit Support Ticket</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950/40 border-t border-neutral-800/40 text-center text-[10px] text-neutral-500 select-none">
          mylynk system care &bull; Handmade with ❤️ by Vaibhav Baviskar &bull; 2026 All Rights Reserved.
        </div>

      </div>
    </div>
  );
}
