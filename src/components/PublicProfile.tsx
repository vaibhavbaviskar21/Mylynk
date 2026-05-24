import React, { useState, useEffect } from "react";
import * as LucideImport from "lucide-react";
import { UserData } from "../types";
import LinkTreePreview from "./LinkTreePreview";

interface PublicProfileProps {
  username: string;
}

export default function PublicProfile({ username }: PublicProfileProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/user/${username}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`The profile @${username} does not exist yet.`);
          }
          throw new Error("Failed to load link-in-bio profile.");
        }

        const data: UserData = await res.json();
        setUserData(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  // Log link clicks to server-database
  const handleLinkClick = async (linkId: string) => {
    try {
      await fetch(`/api/user/${username}/links/${linkId}/click`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Failed to register analytics metrics:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center font-sans select-none">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-neutral-400 font-mono tracking-widest uppercase">
            Resolving @{username}...
          </p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-6 text-center select-none font-sans">
        <div className="max-w-md space-y-6 fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-red-950/20 border border-red-900/60 text-red-400">
            <LucideImport.AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-white leading-none">
              Profile Unavailable
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-sm mx-auto">
              {error || "The requested link-in-bio canvas could not be compiled on the database stack."}
            </p>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <a
              href="/"
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-[0_4px_12px_rgba(79,70,229,0.3)] flex items-center justify-center gap-1.5"
            >
              <LucideImport.Sparkle className="w-4 h-4 animate-spin-slow text-indigo-100" />
              <span>Claim @{username} on mylynk</span>
            </a>

            <a
              href="/"
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors font-mono uppercase tracking-wider"
            >
              Back to Workspace login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Display raw customized profile page
  return (
    <LinkTreePreview
      profile={userData.profile}
      links={userData.links}
      isMobileFrame={false}
      onLinkClick={handleLinkClick}
    />
  );
}
