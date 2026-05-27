"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PlatformSelector } from "@/components/platform-selector";
import { VideoPreview } from "@/components/video-preview";

export type Platform = "youtube" | "tiktok" | "douyin";
export type Format = "mp4" | "mp3";
export type Resolution = "2160p" | "1440p" | "1080p" | "720p" | "480p" | "360p" | "audio";

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  author: string;
}

export function VideoDownloader() {
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [format, setFormat] = useState<Format>("mp4");
  const [resolution, setResolution] = useState<Resolution>("1080p");
  const [savePath, setSavePath] = useState("~/Downloads");
  const [isLoading, setIsLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

  const handleAnalyze = async () => {
    if (!url) return alert("Vui lòng dán link video vào đã nhé!");

    setIsLoading(true);
    try {
      // Gửi link video sang Backend để quét thông tin thật
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: url }),
      });

      const data = await response.json();

      if (data.success) {
        // Nhận dữ liệu thật từ Backend và hiển thị lên giao diện
        setVideoInfo({
          title: data.title,
          thumbnail: data.thumbnail,
          duration: data.duration || "N/A",
          author: data.author || "Unknown",
        });
      } else {
        alert("Không thể phân tích video: " + data.error);
      }
    } catch (error) {
      alert("Lỗi kết nối đến server backend!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo) return alert("Vui lòng bấm Phân tích video trước!");
    setIsLoading(true);

    try {
      // Gửi toàn bộ cấu hình (định dạng, độ phân giải) qua Backend để tải file về máy
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: url,
          format: format, 
          resolution: resolution,
          savePath: savePath
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Tải thành công! File đã được lưu vào thư mục: ${savePath}`);
      } else {
        alert("Tải thất bại: " + data.error);
      }
    } catch (error) {
      alert("Lỗi kết nối hệ thống khi tải video!");
    } finally {
      setIsLoading(false);
    }
  };

  const resolutions: { value: Resolution; label: string; badge?: string }[] = format === "mp4"
    ? [
      { value: "2160p", label: "4K (2160p)", badge: "Cao nhất" },
      { value: "1440p", label: "2K (1440p)" },
      { value: "1080p", label: "Full HD (1080p)", badge: "Phổ biến" },
      { value: "720p", label: "HD (720p)" },
      { value: "480p", label: "SD (480p)" },
      { value: "360p", label: "Thấp (360p)" },
    ]
    : [
      { value: "audio", label: "Chất lượng cao (320kbps)", badge: "Tốt nhất" },
    ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Video Downloader
        </h1>
        <p className="text-muted-foreground">
          Tải video từ YouTube, TikTok, Douyin dễ dàng
        </p>
      </div>

      {/* Platform Selection */}
      <PlatformSelector platform={platform} onPlatformChange={setPlatform} />

      {/* URL Input */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Dán link video vào đây..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
            <Button
              onClick={handleAnalyze}
              disabled={!url || isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner />
                  Đang xử lý...
                </span>
              ) : (
                "Phân tích"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Video Preview */}
      {videoInfo && (
        <VideoPreview
          videoInfo={videoInfo}
          platform={platform}
        />
      )}

      {/* Download Options */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Tùy chọn tải xuống</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-foreground">Định dạng</Label>
            <Tabs value={format} onValueChange={(v) => {
              setFormat(v as Format);
              if (v === "mp3") setResolution("audio");
              else setResolution("1080p");
            }}>
              <TabsList className="grid w-full grid-cols-2 bg-secondary">
                <TabsTrigger
                  value="mp4"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <VideoIcon className="w-4 h-4 mr-2" />
                  MP4 (Video)
                </TabsTrigger>
                <TabsTrigger
                  value="mp3"
                  className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <AudioIcon className="w-4 h-4 mr-2" />
                  MP3 (Âm thanh)
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Resolution Selection */}
          <div className="space-y-3">
            <Label className="text-foreground">
              {format === "mp4" ? "Độ phân giải" : "Chất lượng âm thanh"}
            </Label>
            <Select value={resolution} onValueChange={(v) => setResolution(v as Resolution)}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {resolutions.map((res) => (
                  <SelectItem
                    key={res.value}
                    value={res.value}
                    className="text-popover-foreground"
                  >
                    <span className="flex items-center gap-2">
                      {res.label}
                      {res.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {res.badge}
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Save Path */}
          <div className="space-y-3">
            <Label className="text-foreground">Thư mục lưu</Label>
            <div className="flex gap-3">
              <Input
                value={savePath}
                onChange={(e) => setSavePath(e.target.value)}
                className="flex-1 bg-input border-border text-foreground"
              />
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-secondary"
              >
                <FolderIcon className="w-4 h-4 mr-2" />
                Chọn
              </Button>
            </div>
          </div>

          {/* Download Button */}
          <Button
            onClick={handleDownload}
            disabled={!videoInfo || isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner />
                Đang tải xuống...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <DownloadIcon className="w-5 h-5" />
                Tải xuống {format.toUpperCase()}
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function AudioIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}
