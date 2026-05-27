import { NextResponse } from "next/server";

// Hàm extract video ID từ YouTube URL
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

// Hàm kiểm tra URL hợp lệ
function isValidVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validHosts = [
      'youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com',
      'tiktok.com', 'www.tiktok.com', 'vm.tiktok.com',
      'douyin.com', 'www.douyin.com',
      'instagram.com', 'www.instagram.com',
      'twitter.com', 'x.com',
      'facebook.com', 'www.facebook.com', 'fb.watch'
    ];
    return validHosts.some(host => urlObj.hostname.includes(host) || urlObj.hostname === host);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { videoUrl } = await request.json();
    
    if (!videoUrl) {
      return NextResponse.json({ success: false, error: "Thiếu link video!" });
    }

    if (!isValidVideoUrl(videoUrl)) {
      return NextResponse.json({ 
        success: false, 
        error: "Link không hợp lệ! Hỗ trợ: YouTube, TikTok, Instagram, Twitter/X, Facebook" 
      });
    }

    // Sử dụng Cobalt API để lấy thông tin video
    const cobaltResponse = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: videoUrl,
        videoQuality: "1080",
        filenameStyle: "pretty",
      }),
    });

    if (!cobaltResponse.ok) {
      console.error("Cobalt API error:", cobaltResponse.status);
      return NextResponse.json({ 
        success: false, 
        error: "Không thể phân tích video. Vui lòng thử lại sau." 
      }, { status: 500 });
    }

    const cobaltData = await cobaltResponse.json();
    
    if (cobaltData.status === "error") {
      return NextResponse.json({ 
        success: false, 
        error: cobaltData.error?.code || "Không thể phân tích video này!" 
      });
    }

    // Lấy thông tin từ YouTube oEmbed API nếu là YouTube video
    let title = "Video";
    let thumbnail = "";
    let author = "Unknown";
    
    const youtubeId = extractYouTubeVideoId(videoUrl);
    if (youtubeId) {
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`
        );
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          title = oembedData.title || "Video";
          author = oembedData.author_name || "Unknown";
          thumbnail = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
        }
      } catch (e) {
        console.error("oEmbed error:", e);
      }
    }

    // Trả về thông tin video
    return NextResponse.json({
      success: true,
      title: title,
      thumbnail: thumbnail,
      duration: "N/A",
      author: author,
      downloadUrl: cobaltData.url || null,
      picker: cobaltData.picker || null, // Cho trường hợp có nhiều lựa chọn
      status: cobaltData.status,
    });

  } catch (error: unknown) {
    console.error("Lỗi Backend Analyze:", error);
    const errorMessage = error instanceof Error ? error.message : "Không thể phân tích video này!";
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}
