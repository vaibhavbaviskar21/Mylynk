import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { DatabaseSchema, UserData, UserProfile, SocialLink, ClickStats, CustomTheme } from "./src/types";

const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to hash password using Node built-in crypto
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "link-in-bio-salt-1249").digest("hex");
}

const DEFAULT_LINKS = (userId: string): SocialLink[] => [
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
    // Seed 7 days of clicks
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      // Random click pattern: some links performed better
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

// Initialize DB with seed records if empty
function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error loading database file, resetting:", error);
  }

  // Schema Seed
  const demoHashed = hashPassword("demo123");
  const adminHashed = hashPassword("admin123");
  const initialSchema: DatabaseSchema = {
    users: {
      demo: demoHashed,
      admin: adminHashed,
    },
    userProfiles: {
      demo: {
        profile: DEFAULT_PROFILE("demo"),
        links: DEFAULT_LINKS("demo"),
        clicks: DEFAULT_CLICKS(),
      },
      admin: {
        profile: {
          id: "admin",
          username: "admin",
          name: "Alex Dev",
          bio: "Senior full stack designer & content architect. Writing about AI & clean UI layouts.",
          avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
          themeId: "forest",
          createdAt: new Date().toISOString(),
          fontFamily: "mono",
        },
        links: [
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
        ],
        clicks: {
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
        }
      }
    }
  };

  saveDatabase(initialSchema);
  return initialSchema;
}

function saveDatabase(db: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing to database file:", error);
  }
}

// Thread-safe / synchronous simple access patterns
export class Database {
  static getProfileByUsername(username: string): UserData | null {
    const db = loadDatabase();
    const cleanUsername = username.toLowerCase().trim();
    return db.userProfiles[cleanUsername] || null;
  }

  static isUsernameTaken(username: string): boolean {
    const db = loadDatabase();
    return !!db.users[username.toLowerCase().trim()];
  }

  static registerUser(username: string, email: string, passwordPlain: string): UserData | null {
    const db = loadDatabase();
    const cleanUsername = username.toLowerCase().trim();

    if (db.users[cleanUsername]) {
      return null;
    }

    // Save login credentials
    db.users[cleanUsername] = hashPassword(passwordPlain);

    // Initial Portfolio Setup
    const newPortfolio: UserData = {
      profile: {
        id: cleanUsername,
        username: cleanUsername,
        name: username.charAt(0).toUpperCase() + username.slice(1),
        bio: "Bio not set yet.",
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`,
        themeId: "cosmic",
        createdAt: new Date().toISOString(),
        fontFamily: "sans",
      },
      links: [],
      clicks: {},
    };

    db.userProfiles[cleanUsername] = newPortfolio;
    saveDatabase(db);
    return newPortfolio;
  }

  static loginUser(username: string, passwordPlain: string): UserData | null {
    const db = loadDatabase();
    const cleanUsername = username.toLowerCase().trim();

    if (!db.users[cleanUsername]) {
      return null;
    }

    const hashed = hashPassword(passwordPlain);
    if (db.users[cleanUsername] === hashed) {
      return db.userProfiles[cleanUsername] || null;
    }
    return null;
  }

  static updateProfile(username: string, updatedProfile: Partial<UserProfile>, customTheme?: CustomTheme): UserData | null {
    const db = loadDatabase();
    const cleanUsername = username.toLowerCase().trim();

    if (!db.userProfiles[cleanUsername]) return null;

    db.userProfiles[cleanUsername].profile = {
      ...db.userProfiles[cleanUsername].profile,
      ...updatedProfile,
    };

    if (customTheme !== undefined) {
      db.userProfiles[cleanUsername].profile.customTheme = customTheme;
    }

    saveDatabase(db);
    return db.userProfiles[cleanUsername];
  }

  static updateLinks(username: string, links: SocialLink[]): UserData | null {
    const db = loadDatabase();
    const cleanUsername = username.toLowerCase().trim();

    if (!db.userProfiles[cleanUsername]) return null;

    db.userProfiles[cleanUsername].links = links;

    // Filter clicks keys context if links were deleted
    const validLinkIds = new Set(links.map(l => l.id));
    const currentClicks = db.userProfiles[cleanUsername].clicks;
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

    db.userProfiles[cleanUsername].clicks = newClicks;
    saveDatabase(db);
    return db.userProfiles[cleanUsername];
  }

  static trackLinkClick(username: string, linkId: string): boolean {
    const db = loadDatabase();
    const cleanUsername = username.toLowerCase().trim();

    if (!db.userProfiles[cleanUsername]) return false;

    const portfolio = db.userProfiles[cleanUsername];
    const linkExists = portfolio.links.some(l => l.id === linkId);
    if (!linkExists) return false;

    if (!portfolio.clicks[linkId]) {
      portfolio.clicks[linkId] = {
        linkId,
        clicks: 0,
        dates: {}
      };
    }

    const linkClicks = portfolio.clicks[linkId];
    linkClicks.clicks += 1;

    const todayStr = new Date().toISOString().split("T")[0];
    linkClicks.dates[todayStr] = (linkClicks.dates[todayStr] || 0) + 1;

    saveDatabase(db);
    return true;
  }
}
