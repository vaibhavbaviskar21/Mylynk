export interface CustomTheme {
  bgType: "solid" | "gradient" | "pattern";
  bgColor: string; // hex
  bgGradientStart?: string;
  bgGradientEnd?: string;
  bgGradientAngle?: number; // e.g., 135
  buttonBg: string; // hex
  buttonText: string; // hex
  textColor: string; // hex
  buttonStyle: "filled" | "outline" | "soft" | "shadow";
  buttonRadius: "none" | "md" | "full";
  cardBg?: string; // hex
  cardBorder?: string; // hex
}

export interface UserProfile {
  id: string; // e.g., user email or username
  username: string;
  name: string;
  bio: string;
  avatarUrl: string;
  themeId: string; // predefined themes, or "custom"
  customTheme?: CustomTheme;
  fontFamily: "sans" | "serif" | "mono" | "space" | "playfair";
  createdAt: string;
}

export interface SubLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  active: boolean;
}

export interface SocialLink {
  id: string;
  title: string;
  url: string;
  icon: string; // "instagram" | "youtube" | "twitter" | "github" | "linkedin" | etc.
  active: boolean;
  order: number;
  isFolder?: boolean;
  subLinks?: SubLink[];
}

export interface ClickStats {
  linkId: string;
  clicks: number;
  dates: { [dateStr: string]: number }; // e.g., "2026-05-22": 5
}

export interface UserData {
  profile: UserProfile;
  links: SocialLink[];
  clicks: { [linkId: string]: ClickStats };
}

export interface DatabaseSchema {
  users: { [username: string]: string }; // username -> hashed_password
  userProfiles: { [userId: string]: UserData }; // userId (or email) -> user's entire portfolio
}
