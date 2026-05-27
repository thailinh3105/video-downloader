import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function POST(request: Request) {
  try {
    const { videoUrl } = await request.json();
    if (!videoUrl) return NextResponse.json({ success: false, error: "Thiếu link!" });

    // Gọi file ./yt-dlp vừa tải để quét thông tin video trả về dạng JSON
    const { stdout } = await execPromise(`./yt-dlp "${videoUrl}" --dump-json --skip-download`);
    const info = JSON.parse(stdout);

    // Đổi tổng số giây thành định dạng phút:giây để hiển thị
    const durationSec = info.duration ? parseInt(info.duration) : 0;
    const durationMin = `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')}`;

    return NextResponse.json({
      success: true,
      title: info.title,
      thumbnail: info.thumbnail,
      duration: durationMin,
      author: info.uploader || info.author || "Unknown",
    });
  } catch (error: any) {
    console.error("Lỗi Backend Analyze:", error);
    return NextResponse.json({ success: false, error: "Không thể phân tích video này!" }, { status: 500 });
  }
}