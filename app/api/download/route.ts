import { NextRequest, NextResponse } from "next/server";

// Extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl, format = "mp4" } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: "Missing URL" },
        { status: 400 }
      );
    }

    const youtubeId = extractYouTubeVideoId(videoUrl);
    
    // Xác định URL redirect dựa trên platform
    let redirectUrl: string;
    let serviceName: string;

    if (youtubeId) {
      // YouTube - sử dụng y2mate hoặc ssyoutube
      if (format === "mp3") {
        redirectUrl = `https://www.y2mate.com/youtube-mp3/${youtubeId}`;
      } else {
        redirectUrl = `https://www.y2mate.com/youtube/${youtubeId}`;
      }
      serviceName = "Y2Mate";
    } else if (videoUrl.includes("tiktok.com") || videoUrl.includes("douyin.com")) {
      // TikTok / Douyin
      redirectUrl = `https://snaptik.app`;
      serviceName = "SnapTik";
    } else if (videoUrl.includes("instagram.com")) {
      // Instagram
      redirectUrl = `https://snapinsta.app`;
      serviceName = "SnapInsta";
    } else if (videoUrl.includes("twitter.com") || videoUrl.includes("x.com")) {
      // Twitter / X
      redirectUrl = `https://twitsave.com/info?url=${encodeURIComponent(videoUrl)}`;
      serviceName = "TwitSave";
    } else if (videoUrl.includes("facebook.com") || videoUrl.includes("fb.watch")) {
      // Facebook
      redirectUrl = `https://snapsave.app`;
      serviceName = "SnapSave";
    } else {
      // Các platform khác - thử với savefrom
      redirectUrl = `https://en.savefrom.net/1-youtube-video-downloader-360/#url=${encodeURIComponent(videoUrl)}`;
      serviceName = "SaveFrom";
    }

    return NextResponse.json({
      success: true,
      redirect: true,
      url: redirectUrl,
      serviceName: serviceName,
      message: `Đang chuyển đến ${serviceName} để tải video...`
    });

  } catch (error) {
    console.error("[v0] DOWNLOAD ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : "Lỗi tải video";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
