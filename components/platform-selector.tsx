"use client";

import { cn } from "@/lib/utils";
import type { Platform } from "../components/video-downloader";

interface PlatformSelectorProps {
  platform: Platform;
  onPlatformChange: (platform: Platform) => void;
}

const platforms: { id: Platform; name: string; color: string; icon: React.ReactNode }[] = [
  {
    id: "youtube",
    name: "YouTube",
    color: "bg-red-600 hover:bg-red-700",
    icon: <YouTubeIcon className="w-5 h-5" />,
  },
  {
    id: "tiktok",
    name: "TikTok",
    color: "bg-black hover:bg-zinc-800 border border-zinc-700",
    icon: <TikTokIcon className="w-5 h-5" />,
  },
  {
    id: "douyin",
    name: "Douyin",
    color: "bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600",
    icon: <DouyinIcon className="w-5 h-5" />,
  },
];

export function PlatformSelector({ platform, onPlatformChange }: PlatformSelectorProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {platforms.map((p) => (
        <button
          key={p.id}
          onClick={() => onPlatformChange(p.id)}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-white transition-all",
            p.color,
            platform === p.id
              ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-105"
              : "opacity-60 hover:opacity-100"
          )}
        >
          {p.icon}
          {p.name}
        </button>
      ))}
    </div>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

function DouyinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  );
}
