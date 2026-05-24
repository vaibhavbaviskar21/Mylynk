import React, { useState, useEffect } from "react";
import * as LucideImport from "lucide-react";
import { UserData, SocialLink, CustomTheme, UserProfile } from "../types";
import { THEME_PRESETS, getEffectiveTheme } from "./ThemePresets";
import LinkTreePreview, { renderIcon } from "./LinkTreePreview";
import { MyLynkLogo } from "./MyLynkLogo";

interface DashboardProps {
  username: string;
  initialData: UserData;
  onLogout: () => void;
}

export default function Dashboard({ username, initialData, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "links" | "analytics">("links");
  const [userData, setUserData] = useState<UserData>(initialData);

  // Profile Editor Form State
  const [name, setName] = useState(userData.profile.name);
  const [bio, setBio] = useState(userData.profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(userData.profile.avatarUrl);
  const [themeId, setThemeId] = useState(userData.profile.themeId);
  const [fontFamily, setFontFamily] = useState(userData.profile.fontFamily);

  // Custom Theme Editor State (if custom is chosen)
  const [customTheme, setCustomTheme] = useState<CustomTheme>(
    userData.profile.customTheme || {
      bgType: "gradient",
      bgColor: "#0f172a",
      bgGradientStart: "#090d16",
      bgGradientEnd: "#1e1136",
      bgGradientAngle: 135,
      buttonBg: "#db2777",
      buttonText: "#ffffff",
      textColor: "#f8fafc",
      buttonStyle: "filled",
      buttonRadius: "full",
      cardBg: "rgba(255, 255, 255, 0.04)",
      cardBorder: "rgba(255, 255, 255, 0.08)",
    }
  );

  // New Link states
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIcon, setNewIcon] = useState("globe");
  const [newIsFolder, setNewIsFolder] = useState(false);
  const [suggestingIcon, setSuggestingIcon] = useState(false);

  // AI Theme Generator State
  const [aiThemePrompt, setAiThemePrompt] = useState("");
  const [generatingTheme, setGeneratingTheme] = useState(false);

  // AI Link Recommendation State
  const [recommendingPlacement, setRecommendingPlacement] = useState(false);
  const [aiPlacementTip, setAiPlacementTip] = useState("");

  // Saved updates indicators
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Active hover day index in analytical SVG charts
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  // Sparkline display state
  const [expandedSparklineLinkId, setExpandedSparklineLinkId] = useState<string | null>(null);

  // QR Code customization states
  const [qrStyle, setQrStyle] = useState<"classic" | "dark-match" | "indigo" | "amber">("classic");
  const [qrSize, setQrSize] = useState<number>(200);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingQR, setDownloadingQR] = useState(false);

  // Branded QR Customization states
  const [qrCtaText, setQrCtaText] = useState("SCAN TO VISIT MY PORTFOLIO");
  const [showQrAvatar, setShowQrAvatar] = useState(true);
  const [showQrCenterLogo, setShowQrCenterLogo] = useState(true);
  const [qrCardTheme, setQrCardTheme] = useState<"light" | "dark" | "gradient" | "custom">("gradient");

  // Drag-and-drop file upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processAndUploadFile(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processAndUploadFile(files[0]);
    }
  };

  const processAndUploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size exceeds 5MB limit.");
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64data,
            name: file.name
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to upload");

        setAvatarUrl(data.url);
        setSaveSuccess("Profile image uploaded successfully! Save changes to apply.");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(err.message || "Error uploading image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Preset quick themes mapping triggers
  useEffect(() => {
    setName(userData.profile.name);
    setBio(userData.profile.bio);
    setAvatarUrl(userData.profile.avatarUrl);
    setThemeId(userData.profile.themeId);
    setFontFamily(userData.profile.fontFamily);
    if (userData.profile.customTheme) {
      setCustomTheme(userData.profile.customTheme);
    }
  }, [userData]);

  // Toast auto clearance
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // Sync profile edits with server
  const handleSaveProfile = async (
    overrideThemeId?: string,
    overrideCustomTheme?: CustomTheme
  ) => {
    setSavingProfile(true);
    try {
      const activeTheme = overrideThemeId || themeId;
      const activeCustom = overrideCustomTheme || customTheme;

      const res = await fetch(`/api/user/${username}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          avatarUrl: avatarUrl.trim(),
          themeId: activeTheme,
          fontFamily,
          customTheme: activeCustom,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");

      setUserData(data.portfolio);
      setSaveSuccess("Profile configurations updated!");
    } catch (err: any) {
      alert(err.message || "Error saving profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Sync links array updates with server
  const handleSaveLinks = async (updatedLinks: SocialLink[]) => {
    setSavingLinks(true);
    try {
      const res = await fetch(`/api/user/${username}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: updatedLinks }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync links");

      setUserData(data.portfolio);
      setSaveSuccess("Link tree synchronized successfully!");
    } catch (err: any) {
      alert(err.message || "Error saving link trees");
    } finally {
      setSavingLinks(false);
    }
  };

  // Auto-Suggest Icon trigger on URL input blur
  const handleUrlBlur = async () => {
    if (!newUrl || newUrl.trim().length < 5) return;
    setSuggestingIcon(true);
    try {
      const res = await fetch("/api/ai/suggest-icon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl }),
      });
      const data = await res.json();
      if (data.icon) {
        setNewIcon(data.icon);
      }
    } catch (err) {
      console.error("AI Icon suggestion err:", err);
    } finally {
      setSuggestingIcon(false);
    }
  };

  // Create a new link
  const handleAddLink = () => {
    if (!newTitle.trim()) return;
    if (!newIsFolder && !newUrl.trim()) return;

    // Validate and prepend http protocol if missing
    let targetUrl = newUrl.trim();
    if (!newIsFolder) {
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = `https://${targetUrl}`;
      }
    } else {
      targetUrl = "#";
    }

    const newLinkItem: SocialLink = {
      id: "link-" + Date.now(),
      title: newTitle.trim(),
      url: targetUrl,
      icon: newIsFolder ? "folder" : newIcon,
      active: true,
      order: userData.links.length,
      isFolder: newIsFolder,
      subLinks: [],
    };

    const newArray = [...userData.links, newLinkItem];
    setUserData({
      ...userData,
      links: newArray,
    });

    // Reset inputs
    setNewTitle("");
    setNewUrl("");
    setNewIcon("globe");
    setNewIsFolder(false);

    // Sync to backend DB direct
    handleSaveLinks(newArray);
  };

  // Convert link to folder / sublink group toggle
  const handleToggleIsFolder = (id: string) => {
    const updated = userData.links.map((l) =>
      l.id === id ? { ...l, isFolder: !l.isFolder, subLinks: l.subLinks || [] } : l
    );
    setUserData({ ...userData, links: updated });
    handleSaveLinks(updated);
  };

  // Add a nested sub-link inside a parent folder
  const handleAddSubLink = (linkId: string, title: string, url: string, icon: string) => {
    if (!title.trim() || !url.trim()) return;
    let targetSubUrl = url.trim();
    if (!/^https?:\/\//i.test(targetSubUrl)) {
      targetSubUrl = `https://${targetSubUrl}`;
    }

    const updated = userData.links.map((l) => {
      if (l.id === linkId) {
        const subList = l.subLinks || [];
        const newSub = {
          id: "sub-" + Date.now() + Math.random().toString(36).substr(2, 4),
          title: title.trim(),
          url: targetSubUrl,
          icon: icon,
          active: true,
        };
        return {
          ...l,
          isFolder: true, // safeguard to make sure parent is marked as a folder
          subLinks: [...subList, newSub],
        };
      }
      return l;
    });

    setUserData({ ...userData, links: updated });
    handleSaveLinks(updated);
  };

  // Toggle active status of a nested sub-link
  const handleToggleSubLinkActive = (linkId: string, subLinkId: string) => {
    const updated = userData.links.map((l) => {
      if (l.id === linkId) {
        const subList = (l.subLinks || []).map((sub) =>
          sub.id === subLinkId ? { ...sub, active: !sub.active } : sub
        );
        return { ...l, subLinks: subList };
      }
      return l;
    });
    setUserData({ ...userData, links: updated });
    handleSaveLinks(updated);
  };

  // Delete a nested sublink
  const handleDeleteSubLink = (linkId: string, subLinkId: string) => {
    const updated = userData.links.map((l) => {
      if (l.id === linkId) {
        const subList = (l.subLinks || []).filter((sub) => sub.id !== subLinkId);
        return { ...l, subLinks: subList };
      }
      return l;
    });
    setUserData({ ...userData, links: updated });
    handleSaveLinks(updated);
  };

  // Delete a link
  const handleDeleteLink = (id: string) => {
    const remaining = userData.links.filter((l) => l.id !== id);
    // Recalculate orders to preserve sequential flow integrity
    const reordered = remaining.map((l, index) => ({ ...l, order: index }));
    setUserData({ ...userData, links: reordered });
    handleSaveLinks(reordered);
  };

  // Toggle link active on/off state
  const handleToggleActive = (id: string) => {
    const updated = userData.links.map((l) =>
      l.id === id ? { ...l, active: !l.active } : l
    );
    setUserData({ ...userData, links: updated });
    handleSaveLinks(updated);
  };

  // Manual link order adjustments
  const handleShiftOrder = (index: number, direction: "up" | "down") => {
    const list = [...userData.links].sort((a, b) => a.order - b.order);
    const targetIdx = direction === "up" ? index - 1 : index + 1;

    if (targetIdx < 0 || targetIdx >= list.length) return;

    // Swap ordering numbers
    const tempOrder = list[index].order;
    list[index].order = list[targetIdx].order;
    list[targetIdx].order = tempOrder;

    const finalReordered = list.sort((a, b) => a.order - b.order);
    setUserData({ ...userData, links: finalReordered });
    handleSaveLinks(finalReordered);
  };

  // AI Aesthetic theme generator utilizing server Gemini API
  const handleAiThemeGenerator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiThemePrompt.trim()) return;

    setGeneratingTheme(true);
    try {
      const res = await fetch("/api/ai/generate-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: aiThemePrompt.trim(), name: name }),
      });
      const themeData = await res.json();

      setThemeId("custom");
      setCustomTheme(themeData);
      setAiThemePrompt("");

      // Automatically sync new generated design
      handleSaveProfile("custom", themeData);
    } catch (err) {
      alert("AI Theme Creator failed to construct colors. Fallback triggered.");
    } finally {
      setGeneratingTheme(false);
    }
  };

  // AI recommendations for link ordering optimized on analytics clicks metrics
  const handleRecommendPlacement = async () => {
    setRecommendingPlacement(true);
    setAiPlacementTip("");
    try {
      const res = await fetch("/api/ai/recommend-placement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: userData.links,
          clicks: userData.clicks,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      if (result.recommendedOrder && Array.isArray(result.recommendedOrder)) {
        // Construct the new order list mapped exactly from recommendations
        const orderedMap = new Map<string, number>();
        result.recommendedOrder.forEach((id: string, idx: number) => {
          orderedMap.set(id, idx);
        });

        // Remap links list orders
        const adjustedLinks = [...userData.links].map((link) => {
          const matchedIdx = orderedMap.get(link.id);
          return {
            ...link,
            order: matchedIdx !== undefined ? matchedIdx : link.order + 10,
          };
        });

        const unifiedLinks = adjustedLinks.sort((a, b) => a.order - b.order);

        // Update local state is instant
        setUserData({
          ...userData,
          links: unifiedLinks,
        });

        // Prompt visual feedback explanation
        setAiPlacementTip(result.explanation);

        // Auto persist reordered structure
        handleSaveLinks(unifiedLinks);
      }
    } catch (error) {
      alert("Analytics placement recommendation failed.");
    } finally {
      setRecommendingPlacement(false);
    }
  };

  // -------------------------------------------------------------
  // STATS & ANALYTICS HELPER CALCS
  // -------------------------------------------------------------
  const clickStatsArray = Object.values(userData.clicks) as any[];
  const totalAllTimeClicks = clickStatsArray.reduce(
    (sum, stat) => sum + (stat.clicks || 0),
    0
  );

  const getTopPerformingLinkName = () => {
    const list = Object.values(userData.clicks) as any[];
    if (list.length === 0) return "No data recorded";
    const topStat = [...list].sort((a, b) => b.clicks - a.clicks)[0];
    const correspondingLink = userData.links.find((l) => l.id === topStat?.linkId);
    return correspondingLink
      ? `"${correspondingLink.title}" (${topStat.clicks} clicks)`
      : "No clicks yet";
  };

  // Get active sorted links
  const sortedLinks = [...userData.links].sort((a, b) => a.order - b.order);

  // Generate 7-day unified clicks trends mapping
  const getDailyTrendData = () => {
    const days = 7;
    const today = new Date();
    const trendList: { label: string; clicks: number; fullDate: string }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const label = `${monthNames[d.getMonth()]} ${d.getDate()}`;

      // Sum clicks on that day across all link stats
      let daySum = 0;
      (Object.values(userData.clicks) as any[]).forEach((linkStat) => {
        if (linkStat.dates && linkStat.dates[dateStr]) {
          daySum += linkStat.dates[dateStr];
        }
      });

      trendList.push({
        label,
        clicks: daySum,
        fullDate: dateStr,
      });
    }
    return trendList;
  };

  const getSpecificLinkTrendData = (linkId: string) => {
    const days = 7;
    const today = new Date();
    const trendList: { label: string; clicks: number; fullDate: string }[] = [];
    const linkStat = userData.clicks[linkId];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const label = `${monthNames[d.getMonth()]} ${d.getDate()}`;

      let dayClicks = 0;
      if (linkStat && linkStat.dates && linkStat.dates[dateStr]) {
        dayClicks = linkStat.dates[dateStr];
      }

      trendList.push({
        label,
        clicks: dayClicks,
        fullDate: dateStr,
      });
    }
    return trendList;
  };

  const trends = getDailyTrendData();
  const maxTrendValue = Math.max(...trends.map((t) => t.clicks), 5);

  // QR Code URL calculation & handler utilities
  const shareUrl = `${window.location.origin}/${username}`;
  
  const getQrUrl = () => {
    let color = "000000";
    let bgcolor = "ffffff";
    if (qrStyle === "dark-match") {
      color = "ffffff";
      bgcolor = "171717";
    } else if (qrStyle === "indigo") {
      color = "4f46e5";
      bgcolor = "ffffff";
    } else if (qrStyle === "amber") {
      color = "d97706";
      bgcolor = "ffffff";
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(shareUrl)}&color=${color}&bgcolor=${bgcolor}&margin=12`;
  };
  
  const qrUrl = getQrUrl();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQR = async () => {
    setDownloadingQR(true);
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${username}-bio-qrcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(qrUrl, "_blank");
    } finally {
      setDownloadingQR(false);
    }
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const handleDownloadBrandedQR = async () => {
    setDownloadingQR(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 600; 
      canvas.height = 800; 
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw Background
      if (qrCardTheme === "light") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 600, 800);
      } else if (qrCardTheme === "dark") {
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, 600, 800);
      } else if (qrCardTheme === "gradient") {
        const grad = ctx.createLinearGradient(0, 0, 600, 800);
        grad.addColorStop(0, "#4f46e5"); 
        grad.addColorStop(1, "#1e1b4b"); 
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 800);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 600, 800);
        grad.addColorStop(0, customTheme.bgGradientStart || "#171717");
        grad.addColorStop(1, customTheme.bgGradientEnd || "#262626");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 800);
      }

      // Draw elegant inner frame bounds (Glassmorphic look)
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      if (qrCardTheme === "light") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
      }
      drawRoundedRect(ctx, 40, 40, 520, 720, 28);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      if (qrCardTheme === "light") {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
      }
      ctx.lineWidth = 1.5;
      ctx.stroke();

      let currentY = 110;

      // Draw circular avatar
      const hasAvatar = showQrAvatar && avatarUrl;
      let avatarLoaded = false;
      let avatarImg: HTMLImageElement | null = null;
      
      if (hasAvatar) {
        avatarImg = new Image();
        avatarImg.crossOrigin = "anonymous";
        avatarImg.src = avatarUrl.startsWith("/") ? `${window.location.origin}${avatarUrl}` : avatarUrl;
        await new Promise((resolve) => {
          avatarImg!.onload = () => {
            avatarLoaded = true;
            resolve(true);
          };
          avatarImg!.onerror = () => {
            avatarLoaded = false;
            resolve(false);
          };
        });
      }

      if (avatarLoaded && avatarImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(300, currentY, 48, 0, Math.PI * 2);
        ctx.fillStyle = qrCardTheme === "light" ? "#f1f5f9" : "#1e293b";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(300, currentY, 44, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImg, 256, currentY - 44, 88, 88);
        ctx.restore();
        currentY += 80;
      } else {
        ctx.save();
        ctx.beginPath();
        ctx.arc(300, currentY, 48, 0, Math.PI * 2);
        ctx.fillStyle = "#6366f1";
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const initials = (name || username || "U").substring(0, 2).toUpperCase();
        ctx.fillText(initials, 300, currentY);
        ctx.restore();
        currentY += 80;
      }

      // Brand Title text
      ctx.fillStyle = qrCardTheme === "light" ? "#0f172a" : "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText(name || username, 300, currentY);
      currentY += 32;

      // Username subtitle
      ctx.fillStyle = qrCardTheme === "light" ? "#64748b" : "#94a3b8";
      ctx.font = "600 15px monospace";
      ctx.fillText(`@${username}`, 300, currentY);
      currentY += 50;

      // Main QR Code
      const qrWebImg = new Image();
      qrWebImg.crossOrigin = "anonymous";
      qrWebImg.src = qrUrl;
      await new Promise((resolve) => {
        qrWebImg.onload = () => resolve(true);
        qrWebImg.onerror = () => resolve(false);
      });

      const qrSizeOnCard = 240;
      const qrX = 300 - qrSizeOnCard / 2;
      const qrY = currentY;

      // White box card for the QR code
      ctx.fillStyle = "#ffffff";
      drawRoundedRect(ctx, qrX - 16, qrY - 16, qrSizeOnCard + 32, qrSizeOnCard + 32, 20);
      ctx.fill();
      ctx.drawImage(qrWebImg, qrX, qrY, qrSizeOnCard, qrSizeOnCard);

      // Embedded branding circle inside the QR code center
      if (showQrCenterLogo) {
        const logoSize = 44;
        const logoX = 300 - logoSize / 2;
        const logoY = qrY + qrSizeOnCard / 2 - logoSize / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(300, qrY + qrSizeOnCard / 2, logoSize / 2 + 3, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        if (avatarLoaded && avatarImg) {
          ctx.beginPath();
          ctx.arc(300, qrY + qrSizeOnCard / 2, logoSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(avatarImg, logoX, logoY, logoSize, logoSize);
        } else {
          ctx.beginPath();
          ctx.arc(300, qrY + qrSizeOnCard / 2, logoSize / 2, 0, Math.PI * 2);
          ctx.fillStyle = "#4f46e5";
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 16px sans-serif";
          ctx.fillText("✨", 300, qrY + qrSizeOnCard / 2);
        }
        ctx.restore();
      }

      currentY += qrSizeOnCard + 65;

      // CTA subtitle text
      ctx.fillStyle = qrCardTheme === "light" ? "#475569" : "#cbd5e1";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(qrCtaText.toUpperCase(), 300, currentY);
      currentY += 24;

      // Share handle
      ctx.font = "500 12px monospace";
      ctx.fillStyle = qrCardTheme === "light" ? "#94a3b8" : "rgba(255, 255, 255, 0.4)";
      ctx.fillText(shareUrl.replace(/^https?:\/\//i, ""), 300, currentY);

      const dataUrl = canvas.toDataURL("image/png");
      const targetLink = document.createElement("a");
      targetLink.href = dataUrl;
      targetLink.download = `${username}-branded-card.png`;
      document.body.appendChild(targetLink);
      targetLink.click();
      document.body.removeChild(targetLink);
    } catch (e) {
      console.error(e);
      // Fallback
      await handleDownloadQR();
    } finally {
      setDownloadingQR(false);
    }
  };

  const handlePrintQR = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${username}'s Bio QR Code</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: white;
              color: black;
            }
            .card {
              text-align: center;
              border: 1px solid #eaeaea;
              padding: 40px;
              border-radius: 24px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            }
            img {
              width: 300px;
              height: 300px;
              margin-bottom: 24px;
            }
            h1 {
              font-size: 28px;
              font-weight: 800;
              margin: 0 0 4px 0;
              letter-spacing: -0.025em;
            }
            p {
              font-size: 15px;
              color: #4b5563;
              margin: 0;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="${qrUrl}" onload="window.print();" />
            <h1>@${username}</h1>
            <p>${shareUrl}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Custom theme background application for the editor
  const getCustomThemeHexStyle = () => {
    return {
      background:
        customTheme.bgType === "gradient"
          ? `linear-gradient(${customTheme.bgGradientAngle || 135}deg, ${
              customTheme.bgGradientStart || "#0f1730"
            }, ${customTheme.bgGradientEnd || "#1e1136"})`
          : customTheme.bgColor,
    };
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Toast notifications */}
      {saveSuccess && (
        <div className="fixed top-6 right-6 z-50 py-3.5 px-5 rounded-2xl bg-indigo-950 border border-indigo-800 text-indigo-200 text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-bounce">
          <LucideImport.Check className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Editor Main Navbar */}
      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white text-sm font-black shadow-[0_4px_8px_rgba(99,102,241,0.2)]">
            <MyLynkLogo className="w-6.5 h-6.5" />
          </div>
           <div>
            <h1 className="text-sm font-extrabold tracking-tight text-white leading-tight">mylynk</h1>
            <p className="text-[10px] text-neutral-400 font-sans tracking-wide leading-tight">
              Dashboard &bull; @{username}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <a
            href={`/p/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs border border-neutral-800 transition-colors"
          >
            <LucideImport.Eye className="w-3.5 h-3.5 text-neutral-400" />
            <span>View Public Page</span>
          </a>

          <button
            onClick={() => {
              const shareUrl = `${window.location.origin}/p/${username}`;
              if (navigator.share) {
                navigator.share({
                  title: name || `@${username}`,
                  text: bio || `Check out my customized LinkTree page on mylynk!`,
                  url: shareUrl,
                }).catch((err) => {
                  console.log("Error sharing profile:", err);
                });
              } else {
                navigator.clipboard.writeText(shareUrl);
                setSaveSuccess("Public profile link copied to clipboard!");
              }
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-950/80 text-indigo-400 font-semibold text-xs border border-indigo-900/60 transition-colors cursor-pointer select-none"
          >
            <LucideImport.Share2 className="w-3.5 h-3.5" />
            <span>Share Profile</span>
          </button>

          <button
            onClick={onLogout}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-950 transition-colors text-xs font-bold cursor-pointer flex items-center gap-1.5"
            id="dashboard-logout-button"
          >
            <LucideImport.LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Dual Column Layout (Workspace | Smart Live Mobile) */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Interactive Workspace Pane */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 flex flex-col justify-between max-w-4xl scrollbar-all">
          <div className="space-y-6">
            {/* Bento Tab Buttons Selector */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-900 rounded-2xl border border-neutral-800/80">
              <button
                onClick={() => setActiveTab("links")}
                className={`py-2 px-3 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "links"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"
                }`}
                id="tab-btn-links"
              >
                <LucideImport.Layout className="w-4 h-4 shrink-0" />
                <span>Links</span>
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-2 px-3 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "profile"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"
                }`}
                id="tab-btn-profile"
              >
                <LucideImport.Sliders className="w-4 h-4 shrink-0" />
                <span>Design</span>
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`py-2 px-3 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "analytics"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"
                }`}
                id="tab-btn-analytics"
              >
                <LucideImport.BarChart2 className="w-4 h-4 shrink-0" />
                <span>Analytics</span>
              </button>
            </div>

            {/* Rendered Tab content panel */}
            {activeTab === "links" && (
              <div className="space-y-6 fade-in">
                {/* AI sorting tip banner */}
                {aiPlacementTip && (
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-900 text-indigo-300 text-xs flex items-start gap-3">
                    <LucideImport.Sparkle className="w-5 h-5 cursor-pointer text-indigo-400 animate-pulse shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white mb-0.5">AI Sorted Your Links!</p>
                      <p className="leading-relaxed font-normal">{aiPlacementTip}</p>
                    </div>
                  </div>
                )}

                {/* Add dynamic new link section */}
                <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-850 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-neutral-850/60">
                    <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                      <LucideImport.Plus className="w-4 h-4 text-indigo-400" />
                      <span>Append New Link</span>
                    </h3>

                    {/* Standard vs Folder Segmented Toggle */}
                    <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-850/80 gap-1 select-none self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => { setNewIsFolder(false); }}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          !newIsFolder
                            ? "bg-indigo-600 text-white shadow"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        Standard URL
                      </button>
                      <button
                        type="button"
                        onClick={() => { setNewIsFolder(true); setNewUrl(""); }}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          newIsFolder
                            ? "bg-indigo-600 text-white shadow"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        <LucideImport.FolderKanban className="w-3.5 h-3.5" />
                        <span>Nested Website Group</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                        {newIsFolder ? "Folder Title" : "Link Display Title"}
                      </label>
                      <input
                        type="text"
                        placeholder={newIsFolder ? "e.g. Coding Profiles" : "e.g. My Creative Portfolio"}
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800/90 focus:border-indigo-500/80 text-sm focus:outline-none transition-colors placeholder:text-neutral-600 text-white font-medium"
                      />
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${newIsFolder ? "text-neutral-600" : "text-neutral-400"}`}>
                        Destination URL
                      </label>
                      {newIsFolder ? (
                        <div className="w-full px-4 py-2.5 rounded-xl bg-neutral-950/40 border border-neutral-850/40 text-sm text-neutral-500 font-medium italic flex items-center gap-1.5 select-none select-none">
                          <LucideImport.Folder className="w-3.5 h-3.5 text-indigo-400/60" />
                          <span>Group is container for child web entries</span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="e.g. github.com/username"
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          onBlur={handleUrlBlur}
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800/90 focus:border-indigo-500/80 text-sm focus:outline-none transition-colors placeholder:text-neutral-600 text-white font-semibold"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                    {/* Icon Selection Mapping with AI indicator */}
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                          Icon Style
                        </label>
                        <div className="flex items-center gap-2 bg-neutral-950 px-3 py-2 rounded-xl border border-neutral-800">
                          {suggestingIcon ? (
                            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            renderIcon(newIsFolder ? "folder-open" : newIcon, "w-5 h-5 text-indigo-400")
                          )}
                          <select
                            value={newIcon}
                            onChange={(e) => setNewIcon(e.target.value)}
                            disabled={newIsFolder}
                            className="bg-transparent text-xs text-white border-none focus:outline-none focus:ring-0 font-semibold font-mono disabled:opacity-40"
                          >
                            <option value="globe" className="bg-neutral-900">Website</option>
                            <option value="instagram" className="bg-neutral-900">Instagram</option>
                            <option value="youtube" className="bg-neutral-900">YouTube</option>
                            <option value="twitter" className="bg-neutral-900">Twitter / X</option>
                            <option value="github" className="bg-neutral-900">GitHub</option>
                            <option value="linkedin" className="bg-neutral-900">LinkedIn</option>
                            <option value="tiktok" className="bg-neutral-900">TikTok</option>
                            <option value="spotify" className="bg-neutral-900">Spotify</option>
                            <option value="twitch" className="bg-neutral-900">Twitch</option>
                            <option value="facebook" className="bg-neutral-900">Facebook</option>
                            <option value="message-square" className="bg-neutral-900">Discord</option>
                            <option value="shopping-bag" className="bg-neutral-900">Shop / Store</option>
                            <option value="book-open" className="bg-neutral-900">Blog / Book</option>
                            <option value="mail" className="bg-neutral-900">Email</option>
                            <option value="phone" className="bg-neutral-900">Phone</option>
                          </select>
                        </div>
                      </div>

                      {!newIsFolder && newUrl && !suggestingIcon && (
                        <span className="text-[10px] text-indigo-400 bg-indigo-950/40 px-2 py-1 rounded-md border border-indigo-900/60 flex items-center gap-1 mt-4 select-none font-semibold">
                          <LucideImport.Lightbulb className="w-3 h-3 text-indigo-300 animate-bounce" />
                          <span>AI guessed icon based on URL!</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={handleAddLink}
                      disabled={!newTitle.trim() || (!newIsFolder && !newUrl.trim()) || suggestingIcon}
                      className="indigo-hover px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold text-xs rounded-xl self-end flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      id="btn-add-new-link"
                    >
                      <LucideImport.Plus className="w-4 h-4" />
                      <span>Add to Tree</span>
                    </button>
                  </div>
                </div>

                {/* List of links with modifications */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest leading-none">
                      Your Published Links ({sortedLinks.length})
                    </h4>

                    {sortedLinks.length > 1 && (
                      <button
                        onClick={handleRecommendPlacement}
                        disabled={recommendingPlacement}
                        className="text-[10px] font-bold text-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/50 border border-indigo-900/80 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                        id="btn-ai-optimize-sorting"
                      >
                        {recommendingPlacement ? (
                          <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <LucideImport.Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        )}
                        <span>AI Sort Clicks Optimizer</span>
                      </button>
                    )}
                  </div>

                  {sortedLinks.length === 0 ? (
                    <div className="text-center py-12 rounded-3xl bg-neutral-900/50 border border-neutral-850 p-6">
                      <p className="text-sm font-semibold text-neutral-400">No links added yet.</p>
                      <p className="text-xs text-neutral-500 mt-1">Insert a title and url above to display content to your fans!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedLinks.map((link, idx) => {
                        const clickCount = userData.clicks[link.id]?.clicks || 0;
                        const isSparklineExpanded = expandedSparklineLinkId === link.id;
                        const specificTrends = getSpecificLinkTrendData(link.id);
                        const maxSpecificTrendValue = Math.max(...specificTrends.map((t) => t.clicks), 5);

                        return (
                          <div key={link.id} className="space-y-2 border border-neutral-850/40 rounded-2xl p-2 bg-neutral-900/20">
                            <div
                              className={`p-4 rounded-2xl bg-neutral-900 border transition-colors flex items-center justify-between gap-4 ${
                                link.active
                                  ? "border-neutral-800"
                                  : "border-neutral-850 opacity-60 bg-neutral-900/40"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Reordering indicators */}
                                <div className="flex flex-col gap-0.5 shrink-0 bg-neutral-950/80 p-1 rounded-lg border border-neutral-850">
                                  <button
                                    disabled={idx === 0}
                                    onClick={() => handleShiftOrder(idx, "up")}
                                    className="p-1 hover:text-white text-neutral-500 disabled:opacity-20 cursor-pointer"
                                  >
                                    <LucideImport.ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    disabled={idx === sortedLinks.length - 1}
                                    onClick={() => handleShiftOrder(idx, "down")}
                                    className="p-1 hover:text-white text-neutral-500 disabled:opacity-20 cursor-pointer"
                                  >
                                    <LucideImport.ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Static render values mapping */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    {renderIcon(link.isFolder ? "folder-open" : link.icon, "w-4 h-4 text-indigo-400 shrink-0")}
                                    <h5 className="text-sm font-semibold text-white truncate max-w-[180px] leading-none">
                                      {link.title}
                                    </h5>

                                    {/* Link Mode Switch Badge */}
                                    {link.isFolder ? (
                                      <button
                                        onClick={() => handleToggleIsFolder(link.id)}
                                        className="text-[9px] font-bold text-indigo-400 bg-indigo-950/40 hover:bg-indigo-950/80 border border-indigo-900/60 px-1.5 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer focus:outline-none"
                                        title="Click to convert this nested group back to standard single URL"
                                      >
                                        <LucideImport.FolderClosed className="w-3 h-3 text-indigo-400" />
                                        <span>Sublink Group</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleToggleIsFolder(link.id)}
                                        className="text-[9px] font-bold text-neutral-500 hover:text-indigo-400 bg-neutral-950 hover:bg-indigo-950/40 border border-neutral-800 hover:border-indigo-900 px-1.5 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer focus:outline-none"
                                        title="Click to convert this single link into an expandable nested group"
                                      >
                                        <LucideImport.Link className="w-3 h-3" />
                                        <span>Standard Link</span>
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-neutral-500 font-mono truncate max-w-sm select-none">
                                    {link.isFolder ? (
                                      <span className="text-indigo-400/80 font-semibold font-sans">
                                        📂 Group container: Holds {(link.subLinks || []).length} nested social or coding profiles
                                      </span>
                                    ) : (
                                      link.url
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Toggles, clicks counters, and deletes controls */}
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] font-mono font-bold bg-neutral-950 px-2 py-1 rounded-md border border-neutral-850 text-neutral-300 flex items-center gap-1 select-none">
                                  <strong>{clickCount}</strong>
                                  <span className="opacity-60 text-[9px] uppercase">Clicks</span>
                                </span>

                                <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
                                  {/* Toggle link analytics sparkline */}
                                  <button
                                    onClick={() => setExpandedSparklineLinkId(isSparklineExpanded ? null : link.id)}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                      isSparklineExpanded
                                        ? "bg-indigo-950 border-indigo-800 text-indigo-300"
                                        : "bg-neutral-950 text-neutral-500 hover:text-indigo-400 border-neutral-800 hover:border-indigo-950"
                                    }`}
                                    title="Toggle Link Traffic Analytics"
                                    id={`btn-toggle-link-sparkline-${link.id}`}
                                  >
                                    <LucideImport.LineChart className="w-4 h-4" />
                                  </button>

                                  {/* Toggle layout visibility */}
                                  <button
                                    onClick={() => handleToggleActive(link.id)}
                                    className={`text-xs px-2 py-1 rounded-md font-bold transition-all border cursor-pointer ${
                                      link.active
                                        ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/60 hover:bg-emerald-950/50"
                                        : "bg-neutral-950 text-neutral-500 border-neutral-800 hover:bg-neutral-900"
                                    }`}
                                  >
                                    {link.active ? "Active" : "Paused"}
                                  </button>

                                  {/* Delete single link */}
                                  <button
                                    onClick={() => handleDeleteLink(link.id)}
                                    className="p-1.5 rounded-lg bg-neutral-950 hover:bg-red-950/30 text-neutral-500 hover:text-red-400 border border-neutral-800 hover:border-red-950 transition-colors cursor-pointer"
                                  >
                                    <LucideImport.Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Collapsible Sparkline Panel */}
                            {isSparklineExpanded && (
                              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-850/80 space-y-3 select-none">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <LucideImport.Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                                    <div>
                                      <h6 className="text-[11px] font-bold text-white tracking-tight leading-none">
                                        Analytics Sparkline: {link.title}
                                      </h6>
                                      <p className="text-[9px] text-neutral-500 font-mono mt-0.5 uppercase tracking-wider block">
                                        Last 7 Days Traffic Insights
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                                    Total: <strong className="text-indigo-400">{clickCount}</strong> clicks
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                  {/* Sparkline SVG Chart */}
                                  <div className="md:col-span-3 h-14 relative bg-neutral-900/30 rounded-lg p-1 border border-neutral-905">
                                    <svg className="w-full h-full" viewBox="0 0 400 60" preserveAspectRatio="none">
                                      <defs>
                                        <linearGradient id={`sparkGrad-${link.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                                          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                                        </linearGradient>
                                      </defs>
                                      
                                      <line x1="0" y1="15" x2="400" y2="15" stroke="#1f1f1f" strokeWidth="0.5" strokeDasharray="2" />
                                      <line x1="0" y1="30" x2="400" y2="30" stroke="#1f1f1f" strokeWidth="0.5" strokeDasharray="2" />
                                      <line x1="0" y1="45" x2="400" y2="45" stroke="#1f1f1f" strokeWidth="0.5" strokeDasharray="2" />

                                      <path
                                        d={`
                                          M 0,55
                                          ${specificTrends
                                            .map((t, index) => {
                                              const x = (index / 6) * 400;
                                              const y = 50 - (t.clicks / maxSpecificTrendValue) * 40;
                                              return `L ${x},${y}`;
                                            })
                                            .join(" ")}
                                          L 400,55
                                          Z
                                        `}
                                        fill={`url(#sparkGrad-${link.id})`}
                                      />

                                      <path
                                        d={specificTrends
                                          .map((t, index) => {
                                            const x = (index / 6) * 400;
                                            const y = 50 - (t.clicks / maxSpecificTrendValue) * 40;
                                            return `${index === 0 ? "M" : "L"} ${x},${y}`;
                                          })
                                          .join(" ")}
                                        fill="none"
                                        stroke="#818cf8"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />

                                      {specificTrends.map((t, index) => {
                                        const x = (index / 6) * 400;
                                        const y = 50 - (t.clicks / maxSpecificTrendValue) * 40;
                                        return (
                                          <circle
                                            key={index}
                                            cx={x}
                                            cy={y}
                                            r="2.5"
                                            className="fill-indigo-400 stroke-neutral-900 stroke-[1]"
                                          />
                                        );
                                      })}
                                    </svg>
                                  </div>

                                  {/* Sidebar precise value counters */}
                                  <div className="grid grid-cols-7 md:grid-cols-1 gap-1 text-[9px] font-mono font-medium text-neutral-400">
                                    {specificTrends.map((t, index) => (
                                      <div key={index} className="flex md:flex-row flex-col items-center justify-between bg-neutral-900 border border-neutral-850 px-1.5 py-0.5 rounded gap-1">
                                        <span className="text-[8px] text-neutral-500 shrink-0">{t.label.split(" ").slice(-1)[0]}</span>
                                        <span className="font-bold text-indigo-300">{t.clicks}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="grid grid-cols-7 text-[8px] font-bold text-neutral-500 font-mono tracking-wider text-center pt-1 border-t border-neutral-900">
                                  {specificTrends.map((t, index) => (
                                    <span key={index}>{t.label}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Inline Sub-links manager */}
                            {link.isFolder && (
                              <div className="mt-2.5 p-4 rounded-xl bg-neutral-950 border border-neutral-850/85 space-y-3.5">
                                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                                  <div className="flex items-center gap-1.5">
                                    <LucideImport.FolderSync className="w-3.5 h-3.5 text-indigo-400" />
                                    <h6 className="text-[11px] font-bold text-white uppercase tracking-wider leading-none">
                                      Nested Links Manager (e.g. Coding Websites)
                                    </h6>
                                  </div>
                                  <span className="text-[10px] text-neutral-400 font-semibold font-mono bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                                    Total: {(link.subLinks || []).length} items
                                  </span>
                                </div>

                                {/* List of currently added sub-links with controls */}
                                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                                  {(link.subLinks || []).length === 0 ? (
                                    <p className="text-[11px] text-neutral-500 italic py-1.5 text-center">
                                      No sub-links in this group yet. Use the tool below to append items.
                                    </p>
                                  ) : (
                                    (link.subLinks || []).map((sub) => (
                                      <div
                                        key={sub.id}
                                        className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border text-xs bg-neutral-900/40 ${
                                          sub.active !== false ? "border-neutral-850" : "border-neutral-900/50 opacity-40"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          {renderIcon(sub.icon || "globe", "w-3.5 h-3.5 text-indigo-400 shrink-0")}
                                          <div className="min-w-0">
                                            <p className="font-bold text-white leading-tight truncate">{sub.title}</p>
                                            <p className="text-[9px] text-neutral-500 font-mono truncate max-w-[200px] mt-0.5">{sub.url}</p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          {/* Toggle active state */}
                                          <button
                                            onClick={() => handleToggleSubLinkActive(link.id, sub.id)}
                                            className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-all border cursor-pointer ${
                                              sub.active !== false
                                                ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/40 hover:bg-emerald-950/40"
                                                : "bg-neutral-950 text-neutral-500 border-neutral-800 hover:bg-neutral-900"
                                            }`}
                                          >
                                            {sub.active !== false ? "Active" : "Paused"}
                                          </button>

                                          {/* Delete sub link */}
                                          <button
                                            onClick={() => handleDeleteSubLink(link.id, sub.id)}
                                            className="p-1 hover:text-red-400 text-neutral-500 rounded transition-colors cursor-pointer"
                                            title="Remove Subentry"
                                          >
                                            <LucideImport.X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>

                                {/* Form appending subentry items */}
                                <div className="p-3 bg-neutral-900/50 border border-neutral-850/60 rounded-xl space-y-2.5">
                                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none">
                                    ＋ Add Website Sub-Entry
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      placeholder="Sub-link Title (e.g. My LeetCode)"
                                      id={`sub-title-input-${link.id}`}
                                      className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none font-medium"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Sub-link Destination URL"
                                      id={`sub-url-input-${link.id}`}
                                      className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none font-semibold"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between gap-3 pt-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Icon:</span>
                                      <select
                                        id={`sub-icon-select-${link.id}`}
                                        defaultValue="globe"
                                        className="bg-neutral-950 text-[10px] text-neutral-300 border border-neutral-800 rounded px-1.5 py-0.5 outline-none font-mono"
                                      >
                                        <option value="globe">Globe (Web)</option>
                                        <option value="github">GitHub</option>
                                        <option value="linkedin">LinkedIn</option>
                                        <option value="twitch">Twitch</option>
                                        <option value="youtube">YouTube</option>
                                        <option value="twitter">Twitter / X</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="message-square">Discord</option>
                                        <option value="book-open">Blog</option>
                                        <option value="mail">Mail</option>
                                      </select>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const titleEl = document.getElementById(`sub-title-input-${link.id}`) as HTMLInputElement;
                                        const urlEl = document.getElementById(`sub-url-input-${link.id}`) as HTMLInputElement;
                                        const iconEl = document.getElementById(`sub-icon-select-${link.id}`) as HTMLSelectElement;

                                        if (titleEl && urlEl && iconEl) {
                                          const tVal = titleEl.value;
                                          const uVal = urlEl.value;
                                          const iVal = iconEl.value;
                                          
                                          if (!tVal.trim() || !uVal.trim()) {
                                            alert("Please fill out both the sub-link title and URL.");
                                            return;
                                          }
                                          
                                          handleAddSubLink(link.id, tVal, uVal, iVal);
                                          
                                          titleEl.value = "";
                                          urlEl.value = "";
                                          iconEl.value = "globe";
                                        }
                                      }}
                                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 transition-all text-[10px] font-bold rounded-lg text-white flex items-center gap-1 cursor-pointer"
                                    >
                                      <LucideImport.Plus className="w-3 h-3" />
                                      <span>Append Link Group Sub-entry</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-6 fade-in">
                {/* Visual profile details cards */}
                <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-850 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                    <LucideImport.Sliders className="w-4.5 h-4.5 text-indigo-400" />
                    <span>Bio-Details Builder</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                          Brand Alias / Full Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Creator Nick"
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm focus:border-indigo-500/80 focus:outline-none text-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 font-sans">
                          Brief Biography
                        </label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Share a short bio! Tell your readers about your work, community, and schedules..."
                          rows={4}
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm focus:border-indigo-500/80 focus:outline-none text-white leading-relaxed font-normal"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col justify-between">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                          Avatar Profile URL
                        </label>
                        <input
                          type="text"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="Paste image web Address URL"
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm focus:border-indigo-500/80 focus:outline-none text-white font-mono text-xs mb-2"
                        />
                      </div>

                      {/* Drag & Drop File Upload */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={triggerFileInput}
                        className={`flex-1 min-h-[110px] p-4 rounded-xl border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 group select-none ${
                          isDragging
                            ? "border-indigo-500 bg-indigo-950/30 text-indigo-300"
                            : "border-neutral-800 bg-neutral-950 hover:bg-neutral-900/40 text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        {uploadingImage ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Uploading...</span>
                          </div>
                        ) : (
                          <>
                            <LucideImport.UploadCloud className="w-6 h-6 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-neutral-300">Drag & drop profile image here</p>
                              <p className="text-[10px] text-neutral-500 font-medium">or click to choose files (Max 5MB)</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fonts selector and save triggers */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="shrink-0">
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                        Typography Style
                      </label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value as any)}
                        className="bg-neutral-950 text-xs text-white border border-neutral-850 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-0 font-bold tracking-tight"
                      >
                        <option value="sans">Clean Modern (Sans)</option>
                        <option value="space">Futuristic Tech (Grotesk)</option>
                        <option value="serif">Classic Editorial (Serif)</option>
                        <option value="mono">Developer Retro (Mono)</option>
                        <option value="playfair">Elegant Playfair (Serif)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleSaveProfile()}
                      disabled={savingProfile}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {savingProfile ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <LucideImport.Check className="w-4 h-4" />
                      )}
                      <span>Save Info details</span>
                    </button>
                  </div>
                </div>

                {/* Theme presets palette selector */}
                <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-850 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold tracking-tight text-white flex items-center justify-between">
                    <span>Aesthetics & Theme Palette</span>
                    <span className="text-[10px] font-mono font-normal opacity-40 uppercase">Aesthetic Core</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {THEME_PRESETS.map((p) => {
                      const isSelected = themeId === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setThemeId(p.id);
                            handleSaveProfile(p.id);
                          }}
                          className={`p-3.5 rounded-2xl border text-left flex flex-col gap-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-950/20 shadow-md ring-1 ring-indigo-500/20"
                              : "border-neutral-800 bg-neutral-950 hover:bg-neutral-900/60"
                          }`}
                        >
                          <span className="text-xs font-bold text-white leading-none block">{p.name}</span>
                          <div className="flex gap-1">
                            <span className="w-4 h-4 rounded-full border border-neutral-800" style={{ backgroundColor: p.theme.bgColor }}></span>
                            <span className="w-4 h-4 rounded-full border border-neutral-850" style={{ backgroundColor: p.theme.buttonBg }}></span>
                            <span className="w-4 h-4 rounded-full border border-neutral-850 animate-pulse" style={{ backgroundColor: p.theme.textColor }}></span>
                          </div>
                        </button>
                      );
                    })}

                    {/* Custom options state */}
                    <button
                      onClick={() => {
                        setThemeId("custom");
                        handleSaveProfile("custom");
                      }}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col gap-2.5 transition-all cursor-pointer ${
                        themeId === "custom"
                          ? "border-indigo-500 bg-indigo-950/20 shadow-md ring-1 ring-indigo-500/20"
                          : "border-neutral-800 bg-neutral-950 hover:bg-neutral-900/60"
                      }`}
                    >
                      <span className="text-xs font-bold text-indigo-400 leading-none">✨ Custom Theme</span>
                      <div className="flex gap-1">
                        <span className="w-4 h-4 rounded-full border border-neutral-800" style={getCustomThemeHexStyle()}></span>
                        <span className="w-4 h-4 rounded-full border border-neutral-850" style={{ backgroundColor: customTheme.buttonBg }}></span>
                        <span className="w-4 h-4 rounded-full border border-neutral-850" style={{ backgroundColor: customTheme.textColor }}></span>
                      </div>
                    </button>
                  </div>

                  {/* Gemini Magic Auto aesthetic builder */}
                  <form onSubmit={handleAiThemeGenerator} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-850 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold select-none">
                        <LucideImport.Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                        <span>AI Brand Palette generator</span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500">Powered by Gemini 3.5</span>
                    </div>

                    <p className="text-[11px] text-neutral-400 font-normal leading-normal">
                      Input your favorite keywords, brand adjectives, or colors (e.g. "warm terracotta and ocean sage gradient with soft cards"). Gemini will extract and construct color schemes matching that mood perfectly!
                    </p>

                    <div className="flex gap-2.5">
                      <input
                        type="text"
                        placeholder="e.g. vintage retro cyber pink or warm autumn woods"
                        required
                        value={aiThemePrompt}
                        onChange={(e) => setAiThemePrompt(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-indigo-500/80 text-xs focus:outline-none text-white font-medium placeholder:text-neutral-600"
                        disabled={generatingTheme}
                      />
                      <button
                        type="submit"
                        disabled={generatingTheme || !aiThemePrompt.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 transition-colors cursor-pointer disabled:opacity-45"
                        id="btn-generate-ai-theme"
                      >
                        {generatingTheme ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span>Generate</span>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Manual Hex sliders if custom is active */}
                  {themeId === "custom" && (
                    <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-850 space-y-4 fade-in">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider select-none leading-none">
                        Micro-Color Palette Adjuster
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">
                            Background (solid)
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="color"
                              value={customTheme.bgColor}
                              onChange={(e) => {
                                const up = { ...customTheme, bgColor: e.target.value, bgType: "solid" as const };
                                setCustomTheme(up);
                                handleSaveProfile("custom", up);
                              }}
                              className="w-7 h-7 rounded overflow-hidden cursor-pointer shrink-0 border-0"
                            />
                            <input
                              type="text"
                              value={customTheme.bgColor}
                              onChange={(e) => {
                                const up = { ...customTheme, bgColor: e.target.value, bgType: "solid" as const };
                                setCustomTheme(up);
                                handleSaveProfile("custom", up);
                              }}
                              className="w-full bg-neutral-900 text-[10px] border border-neutral-800 rounded font-mono p-1 text-center text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">
                            Button Color
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="color"
                              value={customTheme.buttonBg}
                              onChange={(e) => {
                                const up = { ...customTheme, buttonBg: e.target.value };
                                setCustomTheme(up);
                                handleSaveProfile("custom", up);
                              }}
                              className="w-7 h-7 rounded overflow-hidden cursor-pointer shrink-0 border-0"
                            />
                            <input
                              type="text"
                              value={customTheme.buttonBg}
                              onChange={(e) => {
                                const up = { ...customTheme, buttonBg: e.target.value };
                                setCustomTheme(up);
                                handleSaveProfile("custom", up);
                              }}
                              className="w-full bg-neutral-900 text-[10px] border border-neutral-800 rounded font-mono p-1 text-center text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">
                            Text Accent Color
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="color"
                              value={customTheme.textColor}
                              onChange={(e) => {
                                const up = { ...customTheme, textColor: e.target.value };
                                setCustomTheme(up);
                                handleSaveProfile("custom", up);
                              }}
                              className="w-7 h-7 rounded overflow-hidden cursor-pointer shrink-0 border-0"
                            />
                            <input
                              type="text"
                              value={customTheme.textColor}
                              onChange={(e) => {
                                const up = { ...customTheme, textColor: e.target.value };
                                setCustomTheme(up);
                                handleSaveProfile("custom", up);
                              }}
                              className="w-full bg-neutral-900 text-[10px] border border-neutral-800 rounded font-mono p-1 text-center text-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {/* Button design options */}
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">
                            Button Shape Style
                          </label>
                          <div className="flex gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-850">
                            {(["filled", "outline", "soft", "shadow"] as const).map((style) => (
                              <button
                                key={style}
                                type="button"
                                onClick={() => {
                                  const up = { ...customTheme, buttonStyle: style };
                                  setCustomTheme(up);
                                  handleSaveProfile("custom", up);
                                }}
                                className={`flex-1 py-1 text-[9px] font-bold rounded capitalize cursor-pointer ${
                                  customTheme.buttonStyle === style
                                    ? "bg-neutral-800 text-white shadow-sm"
                                    : "text-neutral-500 hover:text-white"
                                }`}
                              >
                                {style}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">
                            Button Border Radius
                          </label>
                          <div className="flex gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-850">
                            {(["none", "md", "full"] as const).map((rad) => (
                              <button
                                key={rad}
                                type="button"
                                onClick={() => {
                                  const up = { ...customTheme, buttonRadius: rad };
                                  setCustomTheme(up);
                                  handleSaveProfile("custom", up);
                                }}
                                className={`flex-1 py-1 text-[9px] font-bold rounded capitalize cursor-pointer ${
                                  customTheme.buttonRadius === rad
                                    ? "bg-neutral-800 text-white shadow-sm"
                                    : "text-neutral-500 hover:text-white"
                                }`}
                              >
                                {rad === "none" ? "Sharp" : rad === "md" ? "Curve" : "Round"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-6 fade-in">
                {/* Visual stats cards bento grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Total Clicks */}
                  <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-850 select-none">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
                      All-time traffic
                    </span>
                    <h4 className="text-3xl font-black text-indigo-400 tracking-tight mt-1">
                      {totalAllTimeClicks}
                    </h4>
                    <p className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1">
                      <LucideImport.ArrowRight className="w-3.5 h-3.5 text-emerald-400 transform -rotate-45" />
                      <span>Total clicks logged to date</span>
                    </p>
                  </div>

                  {/* Top performing link */}
                  <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-850 select-none">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
                      Top performing Link
                    </span>
                    <h5 className="text-sm font-bold text-emerald-400 line-clamp-1 mt-2 tracking-tight">
                      {getTopPerformingLinkName()}
                    </h5>
                    <p className="text-[10px] text-neutral-400 mt-3 flex items-center gap-1">
                      <LucideImport.Sparkle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Peak click concentration link</span>
                    </p>
                  </div>

                  {/* Quick active link stats */}
                  <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-850 select-none">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
                      Interactive Coverage
                    </span>
                    <h4 className="text-3xl font-black text-indigo-400 tracking-tight mt-1">
                      {userData.links.filter((l) => l.active).length} / {userData.links.length}
                    </h4>
                    <p className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1 pt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Active modules live now</span>
                    </p>
                  </div>
                </div>

                {/* Visual stats and QR code grid split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  {/* Left Column: Customizable Interactive SVG Analytics Plot Trend */}
                  <div className="lg:col-span-7 p-6 rounded-3xl bg-neutral-900 border border-neutral-850 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between select-none">
                        <div>
                          <h3 className="text-sm font-bold tracking-tight text-white leading-none">
                            7-Day Link Conversion Click Trend
                          </h3>
                          <p className="text-[10px] text-neutral-500 mt-1 font-mono uppercase">
                            Cumulative day-by-day stats
                          </p>
                        </div>

                        {hoveredDayIndex !== null && (
                          <span className="text-xs font-mono font-bold bg-indigo-950 border border-indigo-800 text-indigo-300 px-2 py-1 rounded">
                            {trends[hoveredDayIndex].label}: <strong>{trends[hoveredDayIndex].clicks} clicks</strong>
                          </span>
                        )}
                      </div>

                      {/* SVG Chart Container */}
                      <div className="relative h-44 w-full flex items-end pt-4 select-none">
                        <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Render Grid y-lines */}
                          <line x1="0" y1="30" x2="500" y2="30" stroke="#262626" strokeWidth="1" strokeDasharray="3" />
                          <line x1="0" y1="60" x2="500" y2="60" stroke="#262626" strokeWidth="1" strokeDasharray="3" />
                          <line x1="0" y1="90" x2="500" y2="90" stroke="#262626" strokeWidth="1" strokeDasharray="3" />

                          {/* Closed path fill for Area gradient */}
                          <path
                            d={`
                              M 0,120
                              ${trends
                                .map((t, idx) => {
                                  const x = (idx / 6) * 500;
                                  const y = 110 - (t.clicks / maxTrendValue) * 90;
                                  return `L ${x},${y}`;
                                })
                                .join(" ")}
                              L 500,120
                              Z
                            `}
                            fill="url(#chartGrad)"
                          />

                          {/* Smooth Polyline Trend Curve */}
                          <path
                            d={trends
                              .map((t, idx) => {
                                const x = (idx / 6) * 500;
                                  const y = 110 - (t.clicks / maxTrendValue) * 90;
                                return `${idx === 0 ? "M" : "L"} ${x},${y}`;
                              })
                              .join(" ")}
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />

                          {/* Interactive Hover Markers */}
                          {trends.map((t, idx) => {
                            const x = (idx / 6) * 500;
                            const y = 110 - (t.clicks / maxTrendValue) * 90;
                            const isHovered = hoveredDayIndex === idx;

                            return (
                              <g key={idx}>
                                {/* Hover capture box helper */}
                                <rect
                                  x={x - 20}
                                  y="0"
                                  width="40"
                                  height="120"
                                  fill="transparent"
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredDayIndex(idx)}
                                  onMouseLeave={() => setHoveredDayIndex(null)}
                                />

                                {/* Circle dot marker */}
                                <circle
                                  cx={x}
                                  cy={y}
                                  r={isHovered ? 6 : 4}
                                  fill={isHovered ? "#db2777" : "#818cf8"}
                                  stroke="#0a0a0a"
                                  strokeWidth="1.5"
                                  pointerEvents="none"
                                />
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    </div>

                    {/* Trend dates label axis bar */}
                    <div className="grid grid-cols-7 pt-2 border-t border-neutral-800 text-[9px] font-bold text-neutral-500 font-mono tracking-wider text-center select-none shrink-0">
                      {trends.map((t, i) => (
                        <span
                          key={i}
                          className={hoveredDayIndex === i ? "text-indigo-400 font-black" : "opacity-80"}
                        >
                          {t.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Physical QR Sharing Suite */}
                  <div className="lg:col-span-5 p-6 rounded-3xl bg-neutral-900 border border-neutral-850 space-y-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-900/60">
                            <LucideImport.QrCode className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold tracking-tight text-white leading-none">
                              Profile QR Share
                            </h3>
                            <p className="text-[10px] text-neutral-500 mt-1 font-mono uppercase">
                              Bridge Physical Spaces
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Display QR image inside modern chassis container */}
                      <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 bg-neutral-950 p-4 rounded-2xl border border-neutral-850">
                        {/* Elegant Frame wrapper */}
                        <div className="relative w-32 h-32 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-inner group">
                          {downloadingQR ? (
                            <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : null}
                          <img
                            src={qrUrl}
                            alt={`QR code for profile @${username}`}
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Style and parameters customizer */}
                        <div className="flex-1 w-full space-y-3">
                          <div>
                            <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                              Contrast Preset theme
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {[
                                { id: "classic" as const, label: "Midnight" },
                                { id: "dark-match" as const, label: "Offblack" },
                                { id: "indigo" as const, label: "Indigo" },
                                { id: "amber" as const, label: "Amber" },
                              ].map((opt) => (
                                <button
                                  key={opt.id}
                                  onClick={() => setQrStyle(opt.id)}
                                  className={`py-1 bg-neutral-900 hover:bg-neutral-850 text-[10px] text-center font-bold rounded-lg border transition-all cursor-pointer ${
                                    qrStyle === opt.id
                                      ? "border-indigo-500 text-white bg-indigo-950/20"
                                      : "border-neutral-850 text-neutral-400 hover:text-white"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                              Sizing scale: {qrSize}px
                            </span>
                            <input
                              type="type"
                              className="hidden"
                              value={qrSize}
                              readOnly
                            />
                            <input
                              type="range"
                              min="150"
                              max="300"
                              step="50"
                              value={qrSize}
                              onChange={(e) => setQrSize(Number(e.target.value))}
                              className="w-full accent-indigo-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Advanced Branded Canvas Card Generator Panel */}
                      <div className="pt-2 border-t border-neutral-850 space-y-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          <LucideImport.Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Branded Stand Card Creator</span>
                        </div>

                        <div className="space-y-2 text-xs bg-neutral-950 p-3 rounded-2xl border border-neutral-855">
                          {/* Card Theme Picker */}
                          <div>
                            <label className="block text-[8.5px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                              Poster Theme / Backdrop Style
                            </label>
                            <div className="grid grid-cols-4 gap-1">
                              {[
                                { id: "gradient" as const, label: "Glow" },
                                { id: "dark" as const, label: "Midnight" },
                                { id: "light" as const, label: "Snow" },
                                { id: "custom" as const, label: "My Theme" },
                              ].map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setQrCardTheme(item.id)}
                                  className={`py-1 text-[9px] text-center font-bold rounded-md border transition-all cursor-pointer ${
                                    qrCardTheme === item.id
                                      ? "border-indigo-500 text-indigo-300 bg-indigo-950/20"
                                      : "border-neutral-850 text-neutral-500 hover:text-neutral-300 bg-neutral-900"
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* CTA Text Label */}
                          <div>
                            <label className="block text-[8.5px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                              Call-To-Action Slogan
                            </label>
                            <input
                              type="text"
                              maxLength={35}
                              value={qrCtaText}
                              onChange={(e) => setQrCtaText(e.target.value)}
                              placeholder="e.g. SCAN TO CONNECT"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[10.5px] focus:border-indigo-500/85 focus:outline-none text-white font-medium"
                            />
                          </div>

                          {/* Switches */}
                          <div className="flex items-center justify-between pt-1 pb-0.5 border-t border-neutral-900 text-[10px]">
                            <span className="font-medium text-neutral-400">Display header avatar image</span>
                            <button
                              type="button"
                              onClick={() => setShowQrAvatar(!showQrAvatar)}
                              className={`w-7 h-4 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                                showQrAvatar ? "bg-indigo-600" : "bg-neutral-805"
                              }`}
                            >
                              <span className={`w-3 h-3 bg-white rounded-full transition-transform ${showQrAvatar ? "translate-x-3" : "translate-x-0"}`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-medium text-neutral-400">Embed brand branding logo inside QR</span>
                            <button
                              type="button"
                              onClick={() => setShowQrCenterLogo(!showQrCenterLogo)}
                              className={`w-7 h-4 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                                showQrCenterLogo ? "bg-indigo-600" : "bg-neutral-805"
                              }`}
                            >
                              <span className={`w-3 h-3 bg-white rounded-full transition-transform ${showQrCenterLogo ? "translate-x-3" : "translate-x-0"}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Profile Link terminal copy */}
                    <div className="space-y-3.5">
                      <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-850 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <LucideImport.Link className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span className="text-xs text-neutral-300 font-mono font-medium truncate select-all">
                            {shareUrl}
                          </span>
                        </div>
                        <button
                          onClick={handleCopyLink}
                          className="p-1 px-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 rounded-lg text-emerald-400 text-[10px] font-bold tracking-tight transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          {copiedLink ? (
                            <>
                              <LucideImport.Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <LucideImport.Copy className="w-3.5 h-3.5 text-neutral-400" />
                              <span className="text-neutral-400 hover:text-neutral-200">Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Download and print controls layout */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleDownloadBrandedQR}
                          disabled={downloadingQR}
                          className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_4px_12px_rgba(79,70,229,0.25)] hover:shadow-[0_4px_20px_rgba(79,70,229,0.4)] disabled:opacity-50"
                        >
                          <LucideImport.Sparkles className="w-3.5 h-3.5 text-indigo-100" />
                          <span>Branded Poster</span>
                        </button>
                        <button
                          onClick={handleDownloadQR}
                          disabled={downloadingQR}
                          className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-bold text-xs rounded-xl border border-neutral-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <LucideImport.Download className="w-3.5 h-3.5" />
                          <span>Raw QR Only</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Humble credit line bounds */}
          <footer className="mt-12 text-[10px] text-neutral-500 font-sans text-center shrink-0 border-t border-neutral-900/40 pt-4 select-none">
            mylynk &copy; {new Date().getFullYear()} &bull; All systems active and secure.
          </footer>
        </div>

        {/* Right Smart Phone Chassis Vector preview */}
        <div className="hidden lg:flex w-[380px] border-l border-neutral-900 bg-neutral-950 flex-col items-center justify-center shrink-0 select-none relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/60 via-transparent to-transparent">
          <div className="absolute top-4 left-6 text-[10px] font-sans text-neutral-400 flex items-center gap-1.5 shadow-sm uppercase tracking-widest font-bold">
            <LucideImport.Layout className="w-3.5 h-3.5 text-indigo-500" />
            <span>Smart Live Preview</span>
          </div>

          <div className="scale-90 xl:scale-100 transition-all">
            <LinkTreePreview profile={userData.profile} links={userData.links} isMobileFrame={true} />
          </div>
        </div>
      </main>
    </div>
  );
}
