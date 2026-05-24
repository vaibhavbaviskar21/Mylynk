import { CustomTheme } from "../types";

export interface ThemePreset {
  id: string;
  name: string;
  theme: CustomTheme;
  fontFamily: "sans" | "serif" | "mono" | "space" | "playfair";
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "cosmic",
    name: "Cosmic Twilight",
    fontFamily: "space",
    theme: {
      bgType: "gradient",
      bgColor: "#0f172a",
      bgGradientStart: "#090d16",
      bgGradientEnd: "#1e1136",
      bgGradientAngle: 135,
      buttonBg: "#db2777", // hot pink
      buttonText: "#ffffff",
      textColor: "#f8fafc",
      buttonStyle: "filled",
      buttonRadius: "full",
      cardBg: "rgba(255, 255, 255, 0.04)",
      cardBorder: "rgba(255, 255, 255, 0.08)",
    }
  },
  {
    id: "sunset",
    name: "Golden Sunset",
    fontFamily: "sans",
    theme: {
      bgType: "gradient",
      bgColor: "#ea580c",
      bgGradientStart: "#f43f5e",
      bgGradientEnd: "#eab308",
      bgGradientAngle: 135,
      buttonBg: "#ffffff",
      buttonText: "#be123c",
      textColor: "#ffffff",
      buttonStyle: "shadow",
      buttonRadius: "md",
      cardBg: "rgba(255, 255, 255, 0.15)",
      cardBorder: "rgba(250, 250, 250, 0.25)",
    }
  },
  {
    id: "forest",
    name: "Nordic Forest",
    fontFamily: "mono",
    theme: {
      bgType: "gradient",
      bgColor: "#065f46",
      bgGradientStart: "#064e3b",
      bgGradientEnd: "#0f766e",
      bgGradientAngle: 135,
      buttonBg: "#6ee7b7",
      buttonText: "#064e3b",
      textColor: "#ecfdf5",
      buttonStyle: "soft",
      buttonRadius: "full",
      cardBg: "rgba(255, 255, 255, 0.03)",
      cardBorder: "rgba(255, 255, 255, 0.08)",
    }
  },
  {
    id: "glass",
    name: "Frosted Glassmorphism",
    fontFamily: "sans",
    theme: {
      bgType: "gradient",
      bgColor: "#3b82f6",
      bgGradientStart: "#1d4ed8",
      bgGradientEnd: "#6366f1",
      bgGradientAngle: 45,
      buttonBg: "rgba(255, 255, 255, 0.16)",
      buttonText: "#ffffff",
      textColor: "#ffffff",
      buttonStyle: "outline",
      buttonRadius: "md",
      cardBg: "rgba(255, 255, 255, 0.25)",
      cardBorder: "rgba(255, 255, 255, 0.35)",
    }
  },
  {
    id: "minimal-light",
    name: "Gallery White",
    fontFamily: "serif",
    theme: {
      bgType: "solid",
      bgColor: "#fafafa",
      buttonBg: "#111111",
      buttonText: "#ffffff",
      textColor: "#171717",
      buttonStyle: "filled",
      buttonRadius: "none",
      cardBg: "#ffffff",
      cardBorder: "#e5e5e5",
    }
  },
  {
    id: "minimal-dark",
    name: "Studio Obsidian",
    fontFamily: "mono",
    theme: {
      bgType: "solid",
      bgColor: "#0a0a0a",
      buttonBg: "#ffffff",
      buttonText: "#0a0a0a",
      textColor: "#f5f5f5",
      buttonStyle: "filled",
      buttonRadius: "none",
      cardBg: "#171717",
      cardBorder: "#262626",
    }
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    fontFamily: "mono",
    theme: {
      bgType: "gradient",
      bgColor: "#0a0415",
      bgGradientStart: "#0a0415",
      bgGradientEnd: "#1d0030",
      bgGradientAngle: 180,
      buttonBg: "#facc15",
      buttonText: "#000000",
      textColor: "#38bdf8",
      buttonStyle: "outline",
      buttonRadius: "none",
      cardBg: "rgba(10, 4, 21, 0.6)",
      cardBorder: "#f43f5e",
    }
  },
  {
    id: "matcha",
    name: "Matcha Lavender",
    fontFamily: "sans",
    theme: {
      bgType: "gradient",
      bgColor: "#e8ede0",
      bgGradientStart: "#e8ede0",
      bgGradientEnd: "#d4ded0",
      bgGradientAngle: 135,
      buttonBg: "#8b5cf6",
      buttonText: "#ffffff",
      textColor: "#2b4c33",
      buttonStyle: "soft",
      buttonRadius: "full",
      cardBg: "rgba(255, 255, 255, 0.4)",
      cardBorder: "rgba(139, 92, 246, 0.15)",
    }
  },
  {
    id: "vintage",
    name: "Vintage Crimson",
    fontFamily: "playfair",
    theme: {
      bgType: "solid",
      bgColor: "#fcfaf2",
      buttonBg: "#991b1b",
      buttonText: "#fcfaf2",
      textColor: "#1f2937",
      buttonStyle: "filled",
      buttonRadius: "none",
      cardBg: "#f5f2e6",
      cardBorder: "rgba(153, 27, 27, 0.1)",
    }
  },
  {
    id: "royal",
    name: "Royal Gold",
    fontFamily: "serif",
    theme: {
      bgType: "gradient",
      bgColor: "#020617",
      bgGradientStart: "#030712",
      bgGradientEnd: "#111827",
      bgGradientAngle: 135,
      buttonBg: "#d97706",
      buttonText: "#ffffff",
      textColor: "#fef08a",
      buttonStyle: "shadow",
      buttonRadius: "md",
      cardBg: "rgba(17, 24, 39, 0.8)",
      cardBorder: "rgba(217, 119, 6, 0.2)",
    }
  },
  {
    id: "dream",
    name: "Cotton Candy",
    fontFamily: "space",
    theme: {
      bgType: "gradient",
      bgColor: "#fee2e2",
      bgGradientStart: "#fee2e2",
      bgGradientEnd: "#e0e7ff",
      bgGradientAngle: 135,
      buttonBg: "#ffffff",
      buttonText: "#4f46e5",
      textColor: "#1e1b4b",
      buttonStyle: "shadow",
      buttonRadius: "full",
      cardBg: "rgba(255, 255, 255, 0.4)",
      cardBorder: "rgba(255, 255, 255, 0.6)",
    }
  },
  {
    id: "brutalist",
    name: "Industrial Grey",
    fontFamily: "sans",
    theme: {
      bgType: "solid",
      bgColor: "#171717",
      buttonBg: "#f97316",
      buttonText: "#000000",
      textColor: "#ffffff",
      buttonStyle: "filled",
      buttonRadius: "none",
      cardBg: "#262626",
      cardBorder: "#f97316",
    }
  },
];

export function getEffectiveTheme(themeId: string, customTheme?: CustomTheme): CustomTheme {
  if (themeId === "custom" && customTheme) {
    return customTheme;
  }
  const preset = THEME_PRESETS.find(p => p.id === themeId);
  return preset ? preset.theme : THEME_PRESETS[0].theme;
}

export function getFontClass(fontFamily: string): string {
  switch (fontFamily) {
    case "serif":
      return "font-serif";
    case "mono":
      return "font-mono";
    case "space":
      return "font-space tracking-tight";
    case "playfair":
      return "font-serif tracking-wide";
    default:
      return "font-sans";
  }
}
