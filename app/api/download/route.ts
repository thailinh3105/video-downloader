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

    console.log("[v0] Download request:", { videoUrl, format });

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: "Missing URL" },
        { status: 400 }
      );
    }

    const youtubeId = extractYouTubeVideoId(videoUrl);
    
    if (youtubeId) {
      // Sử dụng API từ ssyoutube/savefrom
      const apiUrl = `https://api.vevioz.com/api/button/${format === "mp3" ? "mp3" : "mp4"}/${youtubeId}`;
      
      console.log("[v0] Fetching from vevioz:", apiUrl);
      
      const apiResponse = await fetch(apiUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!apiResponse.ok) {
        console.log("[v0] Vevioz API failed, trying alternative...");
        
        // Fallback: trả về redirect URL cho user tự tải
        const redirectUrl = `https://www.y2mate.com/youtube/${youtubeId}`;
        return NextResponse.json({
          success: true,
          redirect: true,
          url: redirectUrl,
          message: "Vui lòng tải từ trang web bên ngoài"
        });
      }

      const html = await apiResponse.text();
      
      // Parse download link từ HTML response
      const linkMatch = html.match(/href="(https:\/\/[^"]+)"/);
      
      if (linkMatch && linkMatch[1]) {
        const downloadLink = linkMatch[1];
        console.log("[v0] Found download link:", downloadLink.substring(0, 50) + "...");
        
        // Fetch video và stream về client
        const videoResponse = await fetch(downloadLink, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        if (!videoResponse.ok) {
          // Nếu không fetch được, trả về link trực tiếp
          return NextResponse.json({
            success: true,
            redirect: true,
            url: downloadLink,
          });
        }

        const contentType = format === "mp3" ? "audio/mpeg" : "video/mp4";
        const extension = format === "mp3" ? "mp3" : "mp4";
        const filename = `youtube_${youtubeId}.${extension}`;

        return new Response(videoResponse.body, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      }
      
      // Không tìm thấy link, trả về redirect
      return NextResponse.json({
        success: true,
        redirect: true,
        url: `https://www.y2mate.com/youtube/${youtubeId}`,
        message: "Vui lòng tải từ trang web"
      });
    }

    // Cho các platform khác (TikTok, Instagram, etc.)
    // Trả về redirect tới snaptik hoặc savefrom
    let redirectUrl = "https://snaptik.app";
    
    if (videoUrl.includes("tiktok.com") || videoUrl.includes("douyin.com")) {
      redirectUrl = `https://snaptik.app?url=${encodeURIComponent(videoUrl)}`;
    } else if (videoUrl.includes("instagram.com")) {
      redirectUrl = `https://snapinsta.app?url=${encodeURIComponent(videoUrl)}`;
    } else if (videoUrl.includes("twitter.com") || videoUrl.includes("x.com")) {
      redirectUrl = `https://twitsave.com/info?url=${encodeURIComponent(videoUrl)}`;
    } else if (videoUrl.includes("facebook.com") || videoUrl.includes("fb.watch")) {
      redirectUrl = `https://snapsave.app?url=${encodeURIComponent(videoUrl)}`;
    }

    return NextResponse.json({
      success: true,
      redirect: true,
      url: redirectUrl,
      message: "Vui lòng tải từ trang web bên ngoài"
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
