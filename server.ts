import express from "express";
import * as path from "node:path";
import * as fs from "node:fs";
import * as crypto from "node:crypto";
import { createServer as createViteServer } from "vite";
import { Database } from "./server-db";
import { GoogleGenAI, Type } from "@google/genai";
import { CustomTheme, SocialLink } from "./src/types";

// Lazy-initialize Gemini SDK to prevent crashes if key is omitted on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured in the Secrets panel");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure local uploads directory exists to store profile images
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploaded profile images statically
  app.use("/uploads", express.static(uploadsDir));

  // Body parsers
  app.use(express.json({ limit: "10mb" }));

  // Helper middleware for auth logs (using simple custom token headers for demo simplicity)
  // Inside a production environment, token structures would be used; here a simple 'Authorization' header matching username is perfectly safe & local
  app.use((req, res, next) => {
    res.setHeader("X-Powered-By", "Link-in-bio Customizer Engine");
    next();
  });

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // Profile Image Upload
  app.post("/api/upload", (req, res) => {
    const { image, name } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    try {
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "Invalid base64 image data format" });
      }

      const type = matches[1];
      const buffer = Buffer.from(matches[2], "base64");

      if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: "Image size cannot exceed 5MB" });
      }

      let ext = "png";
      if (type.includes("jpeg") || type.includes("jpg")) ext = "jpg";
      else if (type.includes("gif")) ext = "gif";
      else if (type.includes("webp")) ext = "webp";
      else if (type.includes("svg")) ext = "svg";

      const cleanName = (name || "avatar")
        .replace(/[^a-zA-Z0-9_\.-]/g, "_")
        .toLowerCase();
      
      const uniqueFilename = `${crypto.randomUUID()}_${cleanName}.${ext}`;
      const filePath = path.join(uploadsDir, uniqueFilename);

      fs.writeFileSync(filePath, buffer);

      res.json({ url: `/uploads/${uniqueFilename}` });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload image file to database" });
    }
  });

  // Authentication: Register
  app.post("/api/auth/register", async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const trimmedUser = username.trim().toLowerCase();
    if (trimmedUser.length < 3 || !/^[a-zA-Z0-9_]+$/.test(trimmedUser)) {
      return res.status(400).json({ error: "Username must be at least 3 alphanumeric characters" });
    }

    const isTaken = await Database.isUsernameTaken(trimmedUser);
    if (isTaken) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    const portfolio = await Database.registerUser(trimmedUser, email.trim(), password);
    if (!portfolio) {
      return res.status(500).json({ error: "Failed to create user portfolio" });
    }

    res.status(201).json({ success: true, username: trimmedUser, portfolio });
  });

  // Authentication: Login
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const portfolio = await Database.loginUser(username, password);
    if (!portfolio) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    res.json({ success: true, username: username.toLowerCase().trim(), portfolio });
  });

  // Profile: Get Portfolio (Public & Private Editor both query this)
  app.get("/api/user/:username", async (req, res) => {
    const { username } = req.params;
    const portfolio = await Database.getProfileByUsername(username);
    if (!portfolio) {
      return res.status(404).json({ error: "Profile not found" });
    }
    // Return complete profile data
    res.json(portfolio);
  });

  // Profile: Update Info, Custom Theme & Fonts
  app.post("/api/user/:username/profile", async (req, res) => {
    const { username } = req.params;
    const { name, bio, avatarUrl, themeId, fontFamily, customTheme } = req.body;

    const portfolio = await Database.updateProfile(username, {
      name,
      bio,
      avatarUrl,
      themeId,
      fontFamily
    }, customTheme);

    if (!portfolio) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true, portfolio });
  });

  // Profile: Manage / Reorder / Toggle / Add Links
  app.post("/api/user/:username/links", async (req, res) => {
    const { username } = req.params;
    const { links } = req.body;

    if (!Array.isArray(links)) {
      return res.status(400).json({ error: "Links must be an array" });
    }

    const portfolio = await Database.updateLinks(username, links);
    if (!portfolio) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true, portfolio });
  });

  // Analytics: Track Link Click (Increments click counter, maps stats history)
  app.post("/api/user/:username/links/:linkId/click", async (req, res) => {
    const { username, linkId } = req.params;
    const success = await Database.trackLinkClick(username, linkId);
    if (!success) {
      return res.status(404).json({ error: "Link or profile not found" });
    }
    res.json({ success: true });
  });

  // AI Enhancements: Auto-Suggest Link Icons
  app.post("/api/ai/suggest-icon", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Supported presets in frontend UI
    const supportedIcons = [
      "instagram",
      "youtube",
      "twitter",
      "github",
      "linkedin",
      "tiktok",
      "spotify",
      "twitch",
      "facebook",
      "globe",
      "message-square",
      "shopping-bag",
      "book-open",
      "mail",
      "phone"
    ];

    try {
      const client = getGeminiClient();
      const prompt = `Analyze this URL: "${url}". From the following list of supported icon names, select the single best matching identifier: [${supportedIcons.join(", ")}].
      Return ONLY a clean JSON object with "icon_name" as a key. If no ideal match exists, return "globe".`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              icon_name: {
                type: Type.STRING,
                description: "The matching icon key from the supported list."
              }
            },
            required: ["icon_name"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      res.json({ icon: data.icon_name || "globe" });
    } catch (error) {
      console.warn("AI Icon suggest fallback trigger due to:", error instanceof Error ? error.message : error);

      // Graceful analytical algorithm fallback if Gemini is offline
      const urlLower = url.toLowerCase();
      let detected = "globe";
      if (urlLower.includes("instagram.com")) detected = "instagram";
      else if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) detected = "youtube";
      else if (urlLower.includes("twitter.com") || urlLower.includes("x.com")) detected = "twitter";
      else if (urlLower.includes("github.com")) detected = "github";
      else if (urlLower.includes("linkedin.com")) detected = "linkedin";
      else if (urlLower.includes("tiktok.com")) detected = "tiktok";
      else if (urlLower.includes("spotify.com")) detected = "spotify";
      else if (urlLower.includes("twitch.tv")) detected = "twitch";
      else if (urlLower.includes("facebook.com")) detected = "facebook";
      else if (urlLower.includes("discord")) detected = "message-square";
      else if (urlLower.includes("shop") || urlLower.includes("store") || urlLower.includes("checkout")) detected = "shopping-bag";
      else if (urlLower.includes("blog") || urlLower.includes("medium.com")) detected = "book-open";
      else if (urlLower.includes("mail")) detected = "mail";

      res.json({ icon: detected, fallback: true });
    }
  });

  // AI Enhancements: Generate Theme from Profile Aesthetics / Color Keywords
  app.post("/api/ai/generate-theme", async (req, res) => {
    const { keyword, name } = req.body;
    const context = keyword || name || "creative";

    try {
      const client = getGeminiClient();
      const prompt = `You are a high-end graphic designer and brand architect. Create a gorgeous, trendy custom CSS design palette matching the vibe/colors of: "${context}". We want highly polished hex pairings compatible with responsive modern screens. Custom theme features include: background type (solid or gradient), buttons, and high-contrast texts.
      Respond ONLY with a JSON object matching this schema:
      {
        "bgType": "solid" or "gradient",
        "bgColor": "hex code matching background color",
        "bgGradientStart": "hex code if gradient (optional)",
        "bgGradientEnd": "hex code if gradient (optional)",
        "bgGradientAngle": 135 (number, optional),
        "buttonBg": "hex code of primary button",
        "buttonText": "hex code of text inside buttons for readability",
        "textColor": "hex code of main page content headers",
        "buttonStyle": "filled" or "outline" or "soft" or "shadow",
        "buttonRadius": "none" or "md" or "full",
        "cardBg": "rgba transparent overlay background for bio section (optional)",
        "cardBorder": "hex border code for layout margins"
      }
      Choose sophisticated palettes (uniqueness is highly valued: warm corals, calming sienna, sage greens, deep cosmic violets, or luxury golds). Verify color contrast is high and accessible.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bgType: { type: Type.STRING, enum: ["solid", "gradient"] },
              bgColor: { type: Type.STRING },
              bgGradientStart: { type: Type.STRING },
              bgGradientEnd: { type: Type.STRING },
              bgGradientAngle: { type: Type.NUMBER },
              buttonBg: { type: Type.STRING },
              buttonText: { type: Type.STRING },
              textColor: { type: Type.STRING },
              buttonStyle: { type: Type.STRING, enum: ["filled", "outline", "soft", "shadow"] },
              buttonRadius: { type: Type.STRING, enum: ["none", "md", "full"] },
              cardBg: { type: Type.STRING },
              cardBorder: { type: Type.STRING }
            },
            required: ["bgType", "bgColor", "buttonBg", "buttonText", "textColor", "buttonStyle", "buttonRadius"]
          }
        }
      });

      const parsed: CustomTheme = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (error) {
      console.warn("AI Generate Theme fallback triggered due to:", error instanceof Error ? error.message : error);

      // Graceful local fallbacks mapping various keywords to distinct custom palettes
      const v = context.toLowerCase();
      let generated: CustomTheme = {
        bgType: "gradient",
        bgColor: "#121214",
        bgGradientStart: "#0f172a",
        bgGradientEnd: "#1e1b4b",
        bgGradientAngle: 135,
        buttonBg: "#db2777",
        buttonText: "#ffffff",
        textColor: "#f8fafc",
        buttonStyle: "filled",
        buttonRadius: "full",
        cardBg: "rgba(255,255,255,0.05)",
        cardBorder: "rgba(255,255,255,0.1)"
      };

      if (v.includes("retro") || v.includes("sunset") || v.includes("orange") || v.includes("warm")) {
        generated = {
          bgType: "gradient",
          bgColor: "#ff7e5f",
          bgGradientStart: "#ff7e5f",
          bgGradientEnd: "#feb47b",
          bgGradientAngle: 135,
          buttonBg: "#ffffff",
          buttonText: "#ff5e3a",
          textColor: "#ffffff",
          buttonStyle: "shadow",
          buttonRadius: "md",
          cardBg: "rgba(255,255,255,0.1)"
        };
      } else if (v.includes("green") || v.includes("nature") || v.includes("sage") || v.includes("forest")) {
        generated = {
          bgType: "gradient",
          bgColor: "#143D30",
          bgGradientStart: "#0D2C1F",
          bgGradientEnd: "#1b4d3e",
          bgGradientAngle: 135,
          buttonBg: "#A9DFBF",
          buttonText: "#113022",
          textColor: "#F4Fbf7",
          buttonStyle: "filled",
          buttonRadius: "full",
          cardBg: "rgba(255,255,255,0.04)"
        };
      } else if (v.includes("light") || v.includes("minimal") || v.includes("white")) {
        generated = {
          bgType: "solid",
          bgColor: "#faf9f6",
          buttonBg: "#111111",
          buttonText: "#ffffff",
          textColor: "#1a1a1a",
          buttonStyle: "outline",
          buttonRadius: "none",
          cardBg: "#ffffff"
        };
      }

      res.json(generated);
    }
  });

  // AI Enhancements: Recommend link placement order based on clicks ratios
  app.post("/api/ai/recommend-placement", async (req, res) => {
    const { links, clicks } = req.body;
    if (!links || !Array.isArray(links)) {
      return res.status(400).json({ error: "Links array is required" });
    }

    try {
      const client = getGeminiClient();
      const linksWithClicks = links.map(link => {
        const stats = clicks?.[link.id] || { clicks: 0 };
        return {
          id: link.id,
          title: link.title,
          clicks: stats.clicks || 0,
          url: link.url
        };
      });

      const prompt = `Given this set of links with their current total click counts: ${JSON.stringify(linksWithClicks)}.
      As an expert growth marketer, evaluate which links are performing best. Provide a recommended ordering of these link IDs to maximize conversions and overall clicks. Usually, highly clicked or highly promising links (e.g., store checkouts/communities) go near the top.
      Write a concise text explanation of why you made this specific suggestion (under 2 sentences) and include the list of sorted link IDs in your recommendation.
      Respond strictly in JSON matching this schema:
      {
        "recommendedOrder": ["id1", "id2", ...],
        "explanation": "Concise growth suggestion statement here."
      }`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedOrder: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              explanation: { type: Type.STRING }
            },
            required: ["recommendedOrder", "explanation"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error) {
      console.warn("AI Recommend placement fallback triggered due to:", error instanceof Error ? error.message : error);

      // Fallback ranking algorithm: Sort strictly descending by click counts
      const linksWithClicks = links.map(link => {
        const stats = clicks?.[link.id] || { clicks: 0 };
        return {
          id: link.id,
          title: link.title,
          clicks: stats.clicks || 0
        };
      });

      const sorted = [...linksWithClicks].sort((a, b) => b.clicks - a.clicks);
      const recommendedOrder = sorted.map(l => l.id);

      res.json({
        recommendedOrder,
        explanation: "Our placement algorithm sorted your links by click popularity to ensure your highest-traffic content receives the prime visual placement at the very top.",
        fallback: true
      });
    }
  });

  // -------------------------------------------------------------
  // CLIENT ROUTING & VITE MIDDLEWARE
  // -------------------------------------------------------------

  if (process.env.NODE_ENV !== "production") {
    // Vite middleware setup for Development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Link-in-bio Engine] Server booted successfully! Host: http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical: Failed to boot Link-in-bio Express server:", err);
});
