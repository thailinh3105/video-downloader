"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Platform } from "@/components/video-downloader";

interface VideoPreviewProps {
  videoInfo: {
    title: string;
    thumbnail: string;
    duration: string;
    author: string;
  };
  platform: Platform;
}

const platformColors: Record<Platform, string> = {
  youtube: "bg-red-600",
  tiktok: "bg-zinc-800",
  douyin: "bg-gradient-to-r from-cyan-500 to-pink-500",
};

const platformNames: Record<Platform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  douyin: "Douyin",
};

export function VideoPreview({ videoInfo, platform }: VideoPreviewProps) {
  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail */}
          <div className="relative w-full sm:w-64 h-48 sm:h-auto flex-shrink-0">
            <img
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {videoInfo.duration}
            </div>
            <Badge 
              className={`absolute top-2 left-2 ${platformColors[platform]} text-white border-0`}
            >
              {platformNames[platform]}
            </Badge>
          </div>

          {/* Info */}
          <div className="flex-1 p-4 flex flex-col justify-center">
            <h3 className="text-lg font-semibold text-foreground line-clamp-2 mb-2">
              {videoInfo.title}
            </h3>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              {videoInfo.author}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                <CheckIcon className="w-3 h-3 mr-1" />
                Video hợp lệ
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <ClockIcon className="w-3 h-3 mr-1" />
                {videoInfo.duration}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
