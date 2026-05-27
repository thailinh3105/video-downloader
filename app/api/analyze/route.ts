import { NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export async function POST(request: Request) {
  try {
    const { videoUrl } = await request.json();
    if (!videoUrl) {
      return NextResponse.json({ success: false, error: "Thiếu link!" });
    }

    // Kiểm tra URL có hợp lệ không
    if (!ytdl.validateURL(videoUrl)) {
      return NextResponse.json({ 
        success: false, 
        error: "Link video không hợp lệ! Vui lòng nhập link YouTube." 
      });
    }

    // Lấy thông tin video bằng ytdl-core
    const info = await ytdl.getInfo(videoUrl);
    const videoDetails = info.videoDetails;

    // Đổi tổng số giây thành định dạng phút:giây để hiển thị
    const durationSec = parseInt(videoDetails.lengthSeconds) || 0;
    const durationMin = `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')}`;

    // Lấy các format có sẵn
    const formats = info.formats
      .filter(f => f.hasVideo && f.hasAudio)
      .map(f => ({
        itag: f.itag,
        quality: f.qualityLabel || f.quality,
        container: f.container,
        hasAudio: f.hasAudio,
        hasVideo: f.hasVideo,
      }));

    return NextResponse.json({
      success: true,
      title: videoDetails.title,
      thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url || "",
      duration: durationMin,
      author: videoDetails.author?.name || "Unknown",
      formats: formats,
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
