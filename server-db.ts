import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, setDoc, updateDoc, getDocFromServer } from "firebase/firestore";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { UserData, UserProfile, SocialLink, ClickStats, CustomTheme } from "./src/types";

// -------------------------------------------------------------
// FIREBASE INITIALIZATION & CONNECTION TEST
// -------------------------------------------------------------

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
if (!fs.existsSync(configPath)) {
  throw new Error("firebase-applet-config.json is missing! Run set_up_firebase tool first.");
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const app = initializeApp(firebaseConfig);

// REQUIRED CRITICAL LINE: Export db and auth configured correctly with long-polling to prevent gRPC streaming disconnect warnings on idle servers
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("[Firebase] Firestore Connection test succeeded!");
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.error("[Firebase] Connection Warning: Please check if internet/client is offline.");
    } else {
      console.log("[Firebase] Firestore initial connection test completed (uninitialized container warning ignored).");
    }
  }
}
testConnection();

// -------------------------------------------------------------
// ERROR HANDLER CONFORMING TO SKILL SPECIFICATION
// -------------------------------------------------------------

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, pathStr: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path: pathStr
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to hash passwords securely
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "link-in-bio-salt-1249").digest("hex");
}

// -------------------------------------------------------------
// SEED DEFAULT VALUES (LAZY-PERSISTED)
// -------------------------------------------------------------

const DEFAULT_LINKS = (username: string): SocialLink[] => [
  {
    id: "link-1",
    title: "My Portfolio Website",
    url: "https://example.com/portfolio",
    icon: "globe",
    active: true,
    order: 0,
  },
  {
    id: "link-2",
    title: "Subscribe on YouTube",
    url: "https://youtube.com/@creative_creator",
    icon: "youtube",
    active: true,
    order: 1,
  },
  {
    id: "link-3",
    title: "Follow on Instagram",
    url: "https://instagram.com/creative_creator",
    icon: "instagram",
    active: true,
    order: 2,
  },
  {
    id: "link-4",
    title: "View projects on GitHub",
    url: "https://github.com/creative_creator",
    icon: "github",
    active: true,
    order: 3,
  }
];

const DEFAULT_PROFILE = (username: string): UserProfile => ({
  id: username,
  username: username,
  name: `${username.charAt(0).toUpperCase() + username.slice(1)} Portfolio`,
  bio: "Welcome to my link-in-bio page! Creator, builder, and designer. Check out my content and projects below 🚀",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200",
  themeId: "cosmic",
  createdAt: new Date().toISOString(),
  fontFamily: "space",
});

const DEFAULT_CLICKS = (): { [linkId: string]: ClickStats } => {
  const stats: { [linkId: string]: ClickStats } = {};
  const today = new Date();
  const linkIds = ["link-1", "link-2", "link-3", "link-4"];

  linkIds.forEach((linkId, index) => {
    const dates: { [dateStr: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const baseClicks = (4 - index) * 5;
      dates[dateStr] = Math.max(0, Math.floor(Math.random() * 8) + baseClicks);
    }
    const totalClicks = Object.values(dates).reduce((a, b) => a + b, 0);

    stats[linkId] = {
      linkId,
      clicks: totalClicks,
      dates,
    };
  });

  return stats;
};

// Seed Demo & Admin if missing from Firestore DB
async function seedDefaultUserIfMissing(username: string, email: string, passwordPlain: string, customDesc: string, avatarUrl: string): Promise<void> {
  const cleanUsername = username.toLowerCase().trim();
  const pathStr = `users/${cleanUsername}`;
  try {
    const docRef = doc(db, "users", cleanUsername);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      console.log(`Seeding missing profile for user: ${cleanUsername}`);
      const hashed = hashPassword(passwordPlain);
      const profileInfo = DEFAULT_PROFILE(cleanUsername);
      profileInfo.name = username === "admin" ? "Alex Dev" : `${username.charAt(0).toUpperCase() + username.slice(1)} Portfolio`;
      profileInfo.bio = customDesc;
      profileInfo.avatarUrl = avatarUrl;
      profileInfo.themeId = username === "admin" ? "forest" : "cosmic";
      profileInfo.fontFamily = username === "admin" ? "mono" : "space";

      const userDataDoc = {
        username: cleanUsername,
        email: email,
        passwordHash: hashed,
        profile: profileInfo,
        links: username === "admin" ? [
          {
            id: "admin-l1",
            title: "Join my Discord community",
            url: "https://discord.gg/codecommunity",
            icon: "message-square",
            active: true,
            order: 0,
          },
          {
            id: "admin-l2",
            title: "My GitHub Projects",
            url: "https://github.com/developer-alex",
            icon: "github",
            active: true,
            order: 1,
          },
          {
            id: "admin-l3",
            title: "Hire me on LinkedIn",
            url: "https://linkedin.com/in/alexdev",
            icon: "linkedin",
            active: true,
            order: 2,
          }
        ] : DEFAULT_LINKS(cleanUsername),
        clicks: username === "admin" ? {
          "admin-l1": {
            linkId: "admin-l1",
            clicks: 120,
            dates: { "2026-05-20": 45, "2026-05-21": 50, "2026-05-22": 25 }
          },
          "admin-l2": {
            linkId: "admin-l2",
            clicks: 85,
            dates: { "2026-05-20": 30, "2026-05-21": 35, "2026-05-22": 20 }
          },
          "admin-l3": {
            linkId: "admin-l3",
            clicks: 45,
            dates: { "2026-05-20": 15, "2026-05-21": 20, "2026-05-22": 10 }
          }
        } : DEFAULT_CLICKS()
      };

      await setDoc(docRef, userDataDoc);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathStr);
  }
}

// -------------------------------------------------------------
// LIVE CLOUD FIRESTORE PERSISTENT OPERATIONS
// -------------------------------------------------------------

export class Database {
  
  // Lazy seed invocation on query load helper to ensure clean start
  private static async ensureBaseSeeds(): Promise<void> {
    await seedDefaultUserIfMissing(
      "demo", 
      "demo@mylynk.com", 
      "demo123", 
      "Welcome to my link-in-bio page! Creator, builder, and designer. Check out my content and projects below 🚀", 
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200"
    );
    await seedDefaultUserIfMissing(
      "admin", 
      "admin@mylynk.com", 
      "admin123", 
      "Senior full stack designer & content architect. Writing about AI & clean UI layouts.", 
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200"
    );
  }

  static async getProfileByUsername(username: string): Promise<UserData | null> {
    await Database.ensureBaseSeeds();
    const cleanUsername = username.toLowerCase().trim();
    const pathStr = `users/${cleanUsername}`;
    try {
      const docRef = doc(db, "users", cleanUsername);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return null;
      }
      const data = snap.data();
      return {
        profile: data.profile,
        links: data.links || [],
        clicks: data.clicks || {},
      } as UserData;
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, pathStr);
    }
  }

  static async isUsernameTaken(username: string): Promise<boolean> {
    await Database.ensureBaseSeeds();
    const cleanUsername = username.toLowerCase().trim();
    const pathStr = `users/${cleanUsername}`;
    try {
      const docRef = doc(db, "users", cleanUsername);
      const snap = await getDoc(docRef);
      return snap.exists();
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, pathStr);
    }
  }

  static async registerUser(username: string, email: string, passwordPlain: string): Promise<UserData | null> {
    await Database.ensureBaseSeeds();
    const cleanUsername = username.toLowerCase().trim();
    const pathStr = `users/${cleanUsername}`;

    try {
      const docRef = doc(db, "users", cleanUsername);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return null; // Username already taken
      }

      const hashed = hashPassword(passwordPlain);
      const initialProfile = DEFAULT_PROFILE(cleanUsername);
      initialProfile.name = username.charAt(0).toUpperCase() + username.slice(1);
      initialProfile.bio = "Bio not set yet.";
      initialProfile.avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`;

      const newPortfolio = {
        username: cleanUsername,
        email: email.trim(),
        passwordHash: hashed,
        profile: initialProfile,
        links: [],
        clicks: {},
      };

      await setDoc(docRef, newPortfolio);

      return {
        profile: initialProfile,
        links: [],
        clicks: {},
      } as UserData;
    } catch (error) {
      return handleFirestoreError(error, OperationType.WRITE, pathStr);
    }
  }

  static async loginUser(username: string, passwordPlain: string): Promise<UserData | null> {
    await Database.ensureBaseSeeds();
    const cleanUsername = username.toLowerCase().trim();
    const pathStr = `users/${cleanUsername}`;

    try {
      const docRef = doc(db, "users", cleanUsername);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return null;
      }

      const data = snap.data();
      const hashed = hashPassword(passwordPlain);
      if (data.passwordHash === hashed) {
        return {
          profile: data.profile,
          links: data.links || [],
          clicks: data.clicks || {},
        } as UserData;
      }
      return null;
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, pathStr);
    }
  }

  static async updateProfile(username: string, updatedProfile: Partial<UserProfile>, customTheme?: CustomTheme): Promise<UserData | null> {
    await Database.ensureBaseSeeds();
    const cleanUsername = username.toLowerCase().trim();
    const pathStr = `users/${cleanUsername}`;

    try {
      const docRef = doc(db, "users", cleanUsername);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;

      const data = snap.data();
      const currentProfileInfo = data.profile || {};
      
      const newProfile = {
        ...currentProfileInfo,
        ...updatedProfile,
      };

      if (customTheme !== undefined) {
        newProfile.customTheme = customTheme;
      }

      await updateDoc(docRef, { profile: newProfile });

      return {
        profile: newProfile,
        links: data.links || [],
        clicks: data.clicks || {},
      } as UserData;
    } catch (error) {
      return handleFirestoreError(error, OperationType.UPDATE, pathStr);
    }
  }

  static async updateLinks(username: string, links: SocialLink[]): Promise<UserData | null> {
    await Database.ensureBaseSeeds();
    const cleanUsername = username.toLowerCase().trim();
    const pathStr = `users/${cleanUsername}`;

    try {
      const docRef = doc(db, "users", cleanUsername);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;

      const data = snap.data();
      const currentClicks = data.clicks || {};
      const validLinkIds = new Set(links.map(l => l.id));
      const newClicks: { [id: string]: ClickStats } = {};

      validLinkIds.forEach(id => {
        if (currentClicks[id]) {
          newClicks[id] = currentClicks[id];
        } else {
          newClicks[id] = {
            linkId: id,
            clicks: 0,
            dates: {}
          };
        }
      });

      await updateDoc(docRef, { 
        links: links,
        clicks: newClicks
      });

      return {
        profile: data.profile,
        links: links,
        clicks: newClicks,
      } as UserData;
    } catch (error) {
      return handleFirestoreError(error, OperationType.UPDATE, pathStr);
    }
  }

  static async trackLinkClick(username: string, linkId: string): Promise<boolean> {
    await Database.ensureBaseSeeds();
    const cleanUsername = username.toLowerCase().trim();
    const pathStr = `users/${cleanUsername}`;

    try {
      const docRef = doc(db, "users", cleanUsername);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return false;

      const data = snap.data();
      const linksList: SocialLink[] = data.links || [];
      const linkExists = linksList.some(l => l.id === linkId);
      if (!linkExists) return false;

      const clicksMap = data.clicks || {};
      if (!clicksMap[linkId]) {
        clicksMap[linkId] = {
          linkId,
          clicks: 0,
          dates: {}
        };
      }

      const linkClicks = clicksMap[linkId];
      linkClicks.clicks += 1;

      const todayStr = new Date().toISOString().split("T")[0];
      linkClicks.dates[todayStr] = (linkClicks.dates[todayStr] || 0) + 1;

      await updateDoc(docRef, { clicks: clicksMap });
      return true;
    } catch (error) {
      return handleFirestoreError(error, OperationType.UPDATE, pathStr);
    }
  }
}
