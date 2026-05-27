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
      // YouTube - sử dụng yt1s.com (hoạt động ở VN)
      if (format === "mp3") {
        redirectUrl = `https://yt1s.com/vi/youtube-to-mp3?q=${encodeURIComponent(videoUrl)}`;
      } else {
        redirectUrl = `https://yt1s.com/vi?q=${encodeURIComponent(videoUrl)}`;
      }
      serviceName = "YT1s";
    } else if (videoUrl.includes("tiktok.com") || videoUrl.includes("douyin.com")) {
      // TikTok / Douyin
      redirectUrl = `https://ssstik.io/vi`;
      serviceName = "SssTik";
    } else if (videoUrl.includes("instagram.com")) {
      // Instagram
      redirectUrl = `https://igdownloader.app/vi`;
      serviceName = "IGDownloader";
    } else if (videoUrl.includes("twitter.com") || videoUrl.includes("x.com")) {
      // Twitter / X
      redirectUrl = `https://ssstwitter.com/vi?url=${encodeURIComponent(videoUrl)}`;
      serviceName = "SssTwitter";
    } else if (videoUrl.includes("facebook.com") || videoUrl.includes("fb.watch")) {
      // Facebook
      redirectUrl = `https://fdown.net/vi/`;
      serviceName = "FDown";
    } else {
      // Các platform khác
      redirectUrl = `https://yt1s.com/vi?q=${encodeURIComponent(videoUrl)}`;
      serviceName = "YT1s";
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
