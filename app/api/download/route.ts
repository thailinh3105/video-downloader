import { NextRequest, NextResponse } from "next/server";

// Danh sách Invidious instances hoạt động
const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de", 
  "https://invidious.jing.rocks",
  "https://yt.artemislena.eu",
  "https://invidious.privacyredirect.com",
];

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

// Thử lấy video info từ Invidious
async function getVideoFromInvidious(videoId: string) {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(10000), // 10s timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data, instance };
      }
    } catch (e) {
      console.log(`[v0] Invidious instance ${instance} failed:`, e);
      continue;
    }
  }
  return { success: false, data: null, instance: null };
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
    
    // Nếu không phải YouTube, redirect ra ngoài
    if (!youtubeId) {
      let redirectUrl: string;
      let serviceName: string;
      
      if (videoUrl.includes("tiktok.com") || videoUrl.includes("douyin.com")) {
        redirectUrl = `https://ssstik.io/vi`;
        serviceName = "SssTik";
      } else if (videoUrl.includes("instagram.com")) {
        redirectUrl = `https://igdownloader.app/vi`;
        serviceName = "IGDownloader";
      } else if (videoUrl.includes("twitter.com") || videoUrl.includes("x.com")) {
        redirectUrl = `https://ssstwitter.com/vi?url=${encodeURIComponent(videoUrl)}`;
        serviceName = "SssTwitter";
      } else if (videoUrl.includes("facebook.com") || videoUrl.includes("fb.watch")) {
        redirectUrl = `https://fdown.net/vi/`;
        serviceName = "FDown";
      } else {
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
    }

    // YouTube - lấy thông tin từ Invidious API
    const result = await getVideoFromInvidious(youtubeId);
    
    if (!result.success || !result.data) {
      // Fallback: redirect đến YT1s
      return NextResponse.json({
        success: true,
        redirect: true,
        url: `https://yt1s.com/vi?q=${encodeURIComponent(videoUrl)}`,
        serviceName: "YT1s",
        message: "Không thể kết nối server. Đang chuyển đến YT1s..."
      });
    }

    const videoData = result.data;
    const videoTitle = (videoData.title || "video").replace(/[^\w\s-]/g, "").trim();

    // Chọn format phù hợp
    let downloadUrl: string | null = null;
    let contentType = "video/mp4";
    let extension = "mp4";

    if (format === "mp3") {
      // Tìm audio format tốt nhất
      const audioFormats = videoData.adaptiveFormats?.filter(
        (f: { type: string }) => f.type?.startsWith("audio/")
      ) || [];
      
      if (audioFormats.length > 0) {
        // Sắp xếp theo bitrate
        audioFormats.sort((a: { bitrate: number }, b: { bitrate: number }) => (b.bitrate || 0) - (a.bitrate || 0));
        downloadUrl = audioFormats[0].url;
        contentType = "audio/mpeg";
        extension = "mp3";
      }
    } else {
      // Tìm video format có cả audio tốt nhất (formatStreams)
      const videoFormats = videoData.formatStreams || [];
      
      if (videoFormats.length > 0) {
        // Ưu tiên 720p hoặc cao hơn
        const preferredFormat = videoFormats.find(
          (f: { qualityLabel: string }) => f.qualityLabel === "720p" || f.qualityLabel === "1080p"
        ) || videoFormats[0];
        
        downloadUrl = preferredFormat.url;
        contentType = preferredFormat.type?.split(";")[0] || "video/mp4";
        extension = preferredFormat.container || "mp4";
      }
    }

    if (!downloadUrl) {
      return NextResponse.json({
        success: true,
        redirect: true,
        url: `https://yt1s.com/vi?q=${encodeURIComponent(videoUrl)}`,
        serviceName: "YT1s",
        message: "Không tìm thấy format phù hợp. Đang chuyển đến YT1s..."
      });
    }

    // Fetch video và stream về client
    const videoResponse = await fetch(downloadUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Range": "bytes=0-",
      },
    });

    if (!videoResponse.ok) {
      return NextResponse.json({
        success: true,
        redirect: true,
        url: `https://yt1s.com/vi?q=${encodeURIComponent(videoUrl)}`,
        serviceName: "YT1s",
        message: "Lỗi tải video. Đang chuyển đến YT1s..."
      });
    }

    const filename = `${videoTitle}.${extension}`;

    // Stream response về client
    return new Response(videoResponse.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": videoResponse.headers.get("content-length") || "",
      },
    });

  } catch (error) {
    console.error("[v0] DOWNLOAD ERROR:", error);
    
    // Fallback redirect
    return NextResponse.json({
      success: true,
      redirect: true,
      url: `https://yt1s.com/vi`,
      serviceName: "YT1s",
      message: "Đã xảy ra lỗi. Đang chuyển đến YT1s..."
    });
  }
}
