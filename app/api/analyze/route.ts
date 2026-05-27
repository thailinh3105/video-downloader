import { NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

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

    // Lấy thông tin từ YouTube oEmbed API nếu là YouTube video
    let title = "Video";
    let thumbnail = "";
    let author = "Unknown";
    let downloadUrl = "";
    
    const youtubeId = extractYouTubeVideoId(videoUrl);
    if (youtubeId) {
      const fullUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
      
      try {
        // Dùng ytdl-core để lấy thông tin chi tiết
        const info = await ytdl.getInfo(fullUrl, {
          requestOptions: {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            }
          }
        });
        
        const videoDetails = info.videoDetails;
        title = videoDetails.title || "Video";
        author = videoDetails.author?.name || "Unknown";
        thumbnail = videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
        
        // Tính duration
        const durationSec = parseInt(videoDetails.lengthSeconds) || 0;
        const durationMin = `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')}`;
        
        // Lấy các format có sẵn
        const formats = info.formats
          .filter(f => f.hasVideo && f.hasAudio)
          .map(f => ({
            itag: f.itag,
            quality: f.qualityLabel || f.quality,
            container: f.container,
          }));

        return NextResponse.json({
          success: true,
          title: title,
          thumbnail: thumbnail,
          duration: durationMin,
          author: author,
          formats: formats,
          downloadUrl: videoUrl,
        });
        
      } catch (ytdlError) {
        console.error("ytdl-core error, falling back to oEmbed:", ytdlError);
        
        // Fallback: dùng oEmbed API
        try {
          const oembedRes = await fetch(
            `https://www.youtube.com/oembed?url=${fullUrl}&format=json`
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
      
      downloadUrl = videoUrl;
    } else {
      // Cho các platform khác (TikTok, etc.)
      downloadUrl = videoUrl;
      title = "Video từ " + new URL(videoUrl).hostname;
    }

    // Trả về thông tin video
    return NextResponse.json({
      success: true,
      title: title,
      thumbnail: thumbnail,
      duration: "N/A",
      author: author,
      downloadUrl: downloadUrl,
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
