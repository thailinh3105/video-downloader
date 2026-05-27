import { NextResponse } from "next/server";

// Danh sách Invidious instances hoạt động
const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de", 
  "https://invidious.jing.rocks",
  "https://yt.artemislena.eu",
  "https://invidious.privacyredirect.com",
];

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

// Thử lấy video info từ Invidious
async function getVideoFromInvidious(videoId: string) {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(8000), // 8s timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data, instance };
      }
    } catch (e) {
      console.log(`Invidious instance ${instance} failed:`, e);
      continue;
    }
  }
  return { success: false, data: null, instance: null };
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

    let title = "Video";
    let thumbnail = "";
    let author = "Unknown";
    let duration = "N/A";
    
    const youtubeId = extractYouTubeVideoId(videoUrl);
    
    if (youtubeId) {
      // Thử lấy thông tin từ Invidious API
      const result = await getVideoFromInvidious(youtubeId);
      
      if (result.success && result.data) {
        const videoData = result.data;
        title = videoData.title || "Video";
        author = videoData.author || "Unknown";
        thumbnail = videoData.videoThumbnails?.[0]?.url || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
        
        // Tính duration
        const durationSec = videoData.lengthSeconds || 0;
        duration = `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')}`;
        
        // Lấy các format có sẵn
        const formats = (videoData.formatStreams || []).map((f: { itag: number; qualityLabel: string; container: string }) => ({
          itag: f.itag,
          quality: f.qualityLabel,
          container: f.container,
        }));

        return NextResponse.json({
          success: true,
          title: title,
          thumbnail: thumbnail,
          duration: duration,
          author: author,
          formats: formats,
          downloadUrl: videoUrl,
        });
      }
      
      // Fallback: dùng oEmbed API nếu Invidious fail
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
        thumbnail = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
      }
    } else {
      // Cho các platform khác (TikTok, etc.)
      title = "Video từ " + new URL(videoUrl).hostname;
    }

    // Trả về thông tin video
    return NextResponse.json({
      success: true,
      title: title,
      thumbnail: thumbnail,
      duration: duration,
      author: author,
      downloadUrl: videoUrl,
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
