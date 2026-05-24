import React, { useState } from "react";
import * as LucideImport from "lucide-react";
import { UserProfile, SocialLink, CustomTheme } from "../types";
import { getEffectiveTheme, getFontClass } from "./ThemePresets";
import { motion, AnimatePresence } from "motion/react";

interface InteractiveLinkProps {
  key?: React.Key | string;
  link: SocialLink;
  buttonClassName: string;
  buttonStyle: any;
  onLinkClick?: (linkId: string) => void;
}

function InteractiveLink({
  link,
  buttonClassName,
  buttonStyle,
  onLinkClick,
}: InteractiveLinkProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTrigger = (e: React.MouseEvent) => {
    // Prevent default ripple layout conflict on buttons
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = {
      id: Date.now() + Math.random(),
      x,
      y,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Fast cleanup
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    if (onLinkClick) {
      onLinkClick(link.id);
    }

    if (link.isFolder) {
      setIsExpanded((prev) => !prev);
    }
  };

  // Strip transition duration & static active scale scales to prevent conflict with motion springs
  const cleanedClassName = buttonClassName
    .replace("hover:scale-[1.01]", "")
    .replace("active:scale-[0.99]", "")
    .replace("transition-all", "")
    .replace("duration-200", "");

  const activeSubLinks = (link.subLinks || []).filter((sub) => sub.active !== false);

  if (link.isFolder) {
    return (
      <div className="w-full flex flex-col" id={`public-folder-group-${link.id}`}>
        <motion.button
          onClick={handleTrigger}
          className={`${cleanedClassName} overflow-hidden text-left w-full outline-none focus:outline-none flex items-center justify-between group relative`}
          style={buttonStyle}
          whileHover={{
            scale: 1.02,
            translateY: -1,
            boxShadow: "0 8px 20px -5px rgba(0, 0, 0, 0.12)",
          }}
          whileTap={{
            scale: 0.98,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 20,
          }}
        >
          {/* Absolute Ripple Overlay Layer */}
          <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
            {ripples.map((ripple) => (
              <motion.span
                key={ripple.id}
                initial={{ scale: 0, opacity: 0.3 }}
                animate={{ scale: 3.5, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute bg-current rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  width: "60px",
                  height: "60px",
                  color: buttonStyle.color || "rgba(255,255,255,0.2)",
                  opacity: 0.15,
                }}
              />
            ))}
          </span>

          <span className="relative z-10 w-5 flex items-center justify-start shrink-0">
            {renderIcon(link.icon || "folder-open", "w-5 h-5")}
          </span>
          <span className="relative z-10 text-sm font-semibold truncate flex-1 block px-2 text-center select-none">
            {link.title}
          </span>
          <span className="relative z-10 w-5 flex justify-end shrink-0">
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center justify-center"
            >
              <LucideImport.ChevronDown className="w-4 h-4 opacity-70" />
            </motion.span>
          </span>
        </motion.button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 8 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden pl-4 pr-1 space-y-2 border-l-2 border-dashed"
              style={{ borderColor: `${buttonStyle.color || "#6366f1"}33` }}
            >
              {activeSubLinks.length === 0 ? (
                <div className="py-3 text-center text-[11px] opacity-65 italic font-medium tracking-wide">
                  Folder is currently empty
                </div>
              ) : (
                activeSubLinks.map((sub) => (
                  <motion.a
                    key={sub.id}
                    href={sub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (onLinkClick) {
                        onLinkClick(link.id);
                      }
                    }}
                    className={`${cleanedClassName} py-2.5 px-4 text-xs select-none flex items-center justify-between group relative`}
                    style={{
                      ...buttonStyle,
                      backgroundColor: `${buttonStyle.backgroundColor || "transparent"}1c`, // slightly transparent nested look
                      border: buttonStyle.border ? `1px solid ${buttonStyle.color}1e` : "none",
                      fontSize: "0.8rem",
                      paddingLeft: "1.25rem",
                      paddingRight: "1.25rem",
                    }}
                    whileHover={{
                      scale: 1.015,
                      x: 2,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                  >
                    <span className="w-4 flex items-center justify-start shrink-0 opacity-80">
                      {renderIcon(sub.icon, "w-4 h-4")}
                    </span>
                    <span className="text-center font-semibold flex-1 truncate px-2 select-none">
                      {sub.title}
                    </span>
                    <span className="w-4 flex justify-end shrink-0 opacity-55">
                      <LucideImport.ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </motion.a>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleTrigger}
      className={`${cleanedClassName} overflow-hidden`}
      style={buttonStyle}
      id={`public-link-${link.id}`}
      whileHover={{
        scale: 1.025,
        translateY: -2,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15)",
      }}
      whileTap={{
        scale: 0.96,
        translateY: 1,
        boxShadow: "0 2px 5px -1px rgba(0, 0, 0, 0.1), 0 1px 3px -1px rgba(0, 0, 0, 0.1)",
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
    >
      {/* Absolute Ripple Overlay Layer */}
      <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.4 }}
            animate={{ scale: 3.5, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute bg-current rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: "80px",
              height: "80px",
            }}
          />
        ))}
      </span>

      <span className="relative z-1 w-5 flex items-center justify-start shrink-0">
        {renderIcon(link.icon, "w-5 h-5")}
      </span>
      <span className="relative z-1 text-sm font-semibold truncate flex-1 block px-2 text-center select-none">
        {link.title}
      </span>
      <span className="relative z-1 w-5 flex justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0 shrink-0">
        <LucideImport.ArrowRight className="w-4 h-4" />
      </span>
    </motion.a>
  );
}

interface LinkTreePreviewProps {
  profile: UserProfile;
  links: SocialLink[];
  isMobileFrame?: boolean;
  onLinkClick?: (linkId: string) => void;
  previewUrl?: string;
}

// Map strings safely to Lucide icons
export function renderIcon(iconName: string, className = "w-5 h-5") {
  const name = iconName.toLowerCase().trim();
  switch (name) {
    case "instagram":
      return <LucideImport.Instagram className={className} />;
    case "youtube":
      return <LucideImport.Youtube className={className} />;
    case "twitter":
      return <LucideImport.Twitter className={className} />;
    case "github":
      return <LucideImport.Github className={className} />;
    case "linkedin":
      return <LucideImport.Linkedin className={className} />;
    case "twitch":
      return <LucideImport.Twitch className={className} />;
    case "facebook":
      return <LucideImport.Facebook className={className} />;
    case "message-square":
      return <LucideImport.MessageSquare className={className} />;
    case "shopping-bag":
      return <LucideImport.ShoppingBag className={className} />;
    case "book-open":
      return <LucideImport.BookOpen className={className} />;
    case "mail":
      return <LucideImport.Mail className={className} />;
    case "phone":
      return <LucideImport.Phone className={className} />;
    case "spotify":
    case "music":
      return <LucideImport.Music className={className} />;
    default:
      return <LucideImport.Globe className={className} />;
  }
}

export default function LinkTreePreview({
  profile,
  links,
  isMobileFrame = false,
  onLinkClick,
}: LinkTreePreviewProps) {
  const theme = getEffectiveTheme(profile.themeId, profile.customTheme);
  const fontClass = getFontClass(profile.fontFamily);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");

  const handleShareProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/p/${profile.username}`;
    
    if (navigator.share) {
      navigator.share({
        title: profile.name || `@${profile.username}`,
        text: profile.bio || `Check out my customized LinkTree page on mylynk!`,
        url: shareUrl,
      }).catch((err) => {
        console.log("Error sharing profile:", err);
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2000);
    }
  };

  // Filter out inactive links for rendering
  const activeLinks = [...links]
    .filter((l) => l.active)
    .sort((a, b) => a.order - b.order);

  // Background styling resolver
  const getBackgroundStyle = () => {
    if (theme.bgType === "gradient") {
      const angle = theme.bgGradientAngle ?? 135;
      const start = theme.bgGradientStart ?? "#090d16";
      const end = theme.bgGradientEnd ?? "#1e1136";
      return {
        background: `linear-gradient(${angle}deg, ${start}, ${end})`,
      };
    }
    return { backgroundColor: theme.bgColor };
  };

  // Button styling handler
  const getButtonStyle = () => {
    const radiusClass =
      theme.buttonRadius === "none"
        ? "rounded-none"
        : theme.buttonRadius === "md"
        ? "rounded-xl"
        : "rounded-full";

    let borderStyle = {};
    let shadowStyle = {};
    let bgStyle = { backgroundColor: theme.buttonBg, color: theme.buttonText };

    if (theme.buttonStyle === "outline") {
      bgStyle = { backgroundColor: "transparent", color: theme.buttonBg };
      borderStyle = { border: `2px solid ${theme.buttonBg}` };
    } else if (theme.buttonStyle === "soft") {
      // Soft translucent button background
      bgStyle = {
        backgroundColor: `${theme.buttonBg}1A`, // 10% opacity hex
        color: theme.buttonBg,
      };
    } else if (theme.buttonStyle === "shadow") {
      shadowStyle = {
        boxShadow: `4px 4px 0px 0px ${theme.textColor}`,
      };
      borderStyle = { border: `1px solid ${theme.textColor}` };
    }

    return {
      className: `relative w-full py-3 px-6 transition-all duration-200 cursor-pointer text-center font-medium flex items-center justify-between group hover:scale-[1.01] active:scale-[0.99] ${radiusClass}`,
      style: {
        ...bgStyle,
        ...borderStyle,
        ...shadowStyle,
      },
    };
  };

  const buttonConfig = getButtonStyle();

  const renderedContent = (
    <div
      className={`min-h-full w-full py-12 px-6 flex flex-col items-center select-none ${fontClass}`}
      style={{ color: theme.textColor }}
    >
      {/* Avatar details */}
      <div className="relative group flex flex-col items-center text-center max-w-sm mb-8">
        <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 border-2 shadow-sm" style={{ borderColor: theme.buttonBg }}>
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center font-bold text-xl uppercase">
              {profile.name.slice(0, 2)}
            </div>
          )}
        </div>
        <h1 className="text-xl font-bold tracking-tight mb-2 flex items-center gap-1.5 leading-none">
          {profile.name || `@${profile.username}`}
        </h1>
        {profile.bio && (
          <p className="text-sm opacity-90 leading-relaxed font-normal whitespace-pre-line px-2">
            {profile.bio}
          </p>
        )}
        <button
          onClick={handleShareProfile}
          className="mt-3 px-3 py-1.5 bg-neutral-900/40 hover:bg-neutral-900/80 transition-all rounded-full border border-neutral-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm select-none"
          style={{
            borderColor: theme.textColor + "2b",
            color: theme.textColor,
          }}
          id={`share-profile-btn-${profile.username}`}
        >
          {shareStatus === "copied" ? (
            <>
              <LucideImport.Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <LucideImport.Share2 className="w-3.5 h-3.5" />
              <span>Share Profile</span>
            </>
          )}
        </button>
      </div>

      {/* Social Links List */}
      <div className="w-full max-w-md space-y-4 flex-grow">
        {activeLinks.length === 0 ? (
          <div className="text-center py-10 opacity-70 border border-dashed rounded-2xl p-6 text-sm" style={{ borderColor: `${theme.textColor}33` }}>
            <LucideImport.Sparkles className="w-8 h-8 mx-auto mb-2 opacity-60" />
            <p className="font-semibold">Your Link Tree is empty</p>
            <p className="text-xs mt-1">Publish active links in your workspace dashboard.</p>
          </div>
        ) : (
          activeLinks.map((link) => (
            <InteractiveLink
              key={link.id}
              link={link}
              buttonClassName={buttonConfig.className}
              buttonStyle={buttonConfig.style}
              onLinkClick={onLinkClick}
            />
          ))
        )}
      </div>

      {/* Powered by label context */}
      <div className="mt-16 mb-20 flex flex-col items-center gap-2 select-none text-center">
        <div className="text-xs opacity-60 tracking-wider font-mono uppercase flex items-center gap-1.5 justify-center">
          <LucideImport.Sparkle className="w-3.5 h-3.5 text-indigo-400" />
          <a href="/" className="hover:text-indigo-400 hover:underline transition-colors cursor-pointer font-bold font-sans">
            Powered by mylynk
          </a>
        </div>
        <div className="text-[10px] opacity-45 font-mono tracking-widest uppercase flex items-center gap-1 justify-center">
          <span>Made with ❤️ by Vaibhav Baviskar</span>
        </div>
      </div>
    </div>
  );

  // Return wrapped or base component
  if (isMobileFrame) {
    return (
      <div className="relative w-[310px] h-[620px] rounded-[42px] border-[10px] border-neutral-900 bg-neutral-950 shadow-2xl overflow-hidden shrink-0 select-none">
        {/* Notch dynamic island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-5 bg-neutral-900 rounded-full z-20 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-neutral-800 rounded-full mr-12"></div>
          <div className="w-1.5 h-1.5 bg-indigo-950 rounded-full"></div>
        </div>

        {/* Home gesture bar */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-neutral-800 rounded-full z-20"></div>

        {/* Phone header metrics */}
        <div className="absolute top-0.5 inset-x-0 h-7 flex items-center justify-between px-6 z-10 text-[10px] font-mono text-white/80">
          <span>13:37</span>
          <div className="flex items-center gap-1">
            <LucideImport.Wifi className="w-3 h-3" />
            <span className="font-semibold text-[8px] bg-white/20 px-1 rounded">5G</span>
          </div>
        </div>

        {/* Inner frame content with scroll */}
        <div
          className="w-full h-full overflow-y-auto pt-8 pb-4 scrollbar-none"
          style={getBackgroundStyle()}
        >
          {renderedContent}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full transition-all duration-300 relative" style={getBackgroundStyle()}>
      {renderedContent}

      {/* Persistent floating pill badge at the bottom of the public profile page */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <a
          href="/"
          className="px-4 py-2 bg-neutral-900/90 backdrop-blur-md hover:bg-neutral-950 text-neutral-100 hover:text-white font-sans font-semibold text-xs rounded-full flex items-center gap-2.5 border border-neutral-800 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 active:scale-[0.96] hover:scale-[1.04] group cursor-pointer select-none"
        >
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
          </span>
          <span>Create your own <span className="text-indigo-400 font-extrabold tracking-tight">mylynk</span></span>
          <LucideImport.ArrowRight className="w-3 h-3 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
        </a>
      </div>
    </div>
  );
}
