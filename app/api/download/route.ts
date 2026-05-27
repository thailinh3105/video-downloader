import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

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

    // YouTube - tải trực tiếp bằng ytdl-core
    const fullUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    
    // Validate URL
    if (!ytdl.validateURL(fullUrl)) {
      return NextResponse.json(
        { success: false, error: "Link YouTube không hợp lệ!" },
        { status: 400 }
      );
    }

    // Lấy thông tin video
    const info = await ytdl.getInfo(fullUrl, {
      requestOptions: {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
      }
    });
    
    const videoTitle = info.videoDetails.title.replace(/[^\w\s-]/g, "").trim() || "video";

    // Chọn format phù hợp
    let chosenFormat;
    if (format === "mp3") {
      chosenFormat = ytdl.chooseFormat(info.formats, { 
        quality: "highestaudio",
        filter: "audioonly" 
      });
    } else {
      // Chọn format có cả video và audio
      const formatsWithAudioVideo = info.formats.filter(f => f.hasVideo && f.hasAudio);
      if (formatsWithAudioVideo.length > 0) {
        // Sắp xếp theo chất lượng và chọn cao nhất
        formatsWithAudioVideo.sort((a, b) => (b.height || 0) - (a.height || 0));
        chosenFormat = formatsWithAudioVideo[0];
      } else {
        // Fallback: chọn format video tốt nhất
        chosenFormat = ytdl.chooseFormat(info.formats, { quality: "highest" });
      }
    }

    if (!chosenFormat || !chosenFormat.url) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy format phù hợp để tải!" },
        { status: 500 }
      );
    }

    // Fetch video từ URL trực tiếp
    const videoResponse = await fetch(chosenFormat.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Range": "bytes=0-", // Để hỗ trợ streaming
      }
    });

    if (!videoResponse.ok) {
      return NextResponse.json(
        { success: false, error: `Lỗi tải video: ${videoResponse.status}` },
        { status: 500 }
      );
    }

    // Xác định content type và filename
    const contentType = format === "mp3" ? "audio/mpeg" : (chosenFormat.mimeType?.split(";")[0] || "video/mp4");
    const extension = format === "mp3" ? "mp3" : (chosenFormat.container || "mp4");
    const filename = `${videoTitle}.${extension}`;

    // Stream response về client
    return new Response(videoResponse.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": chosenFormat.contentLength || videoResponse.headers.get("content-length") || "",
      },
    });

  } catch (error) {
    console.error("[v0] DOWNLOAD ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : "Lỗi tải video";
    
    // Nếu ytdl-core fail, fallback redirect
    return NextResponse.json({
      success: true,
      redirect: true,
      url: `https://yt1s.com/vi?q=${encodeURIComponent(String(error))}`,
      serviceName: "YT1s",
      message: `Không thể tải trực tiếp (${errorMessage}). Đang chuyển đến YT1s...`,
      fallback: true
    });
  }
}
