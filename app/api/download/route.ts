import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

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

    // Validate URL
    if (!ytdl.validateURL(videoUrl)) {
      return NextResponse.json(
        { success: false, error: "Link video không hợp lệ!" },
        { status: 400 }
      );
    }

    // Lấy thông tin video
    const info = await ytdl.getInfo(videoUrl);
    const videoTitle = info.videoDetails.title.replace(/[^\w\s-]/g, "").trim();

    console.log("[v0] Video info retrieved:", videoTitle);

    // Chọn format phù hợp
    let chosenFormat;
    if (format === "mp3") {
      // Chọn audio quality cao nhất
      chosenFormat = ytdl.chooseFormat(info.formats, { 
        quality: "highestaudio",
        filter: "audioonly" 
      });
    } else {
      // Chọn video có cả audio và video
      chosenFormat = ytdl.chooseFormat(info.formats, { 
        quality: "highest",
        filter: (f) => f.hasVideo && f.hasAudio 
      });
    }

    console.log("[v0] Chosen format:", chosenFormat.itag, chosenFormat.qualityLabel);

    // Tạo stream và convert sang buffer
    const videoStream = ytdl.downloadFromInfo(info, { format: chosenFormat });
    
    // Collect stream chunks
    const chunks: Buffer[] = [];
    for await (const chunk of videoStream) {
      chunks.push(Buffer.from(chunk));
    }
    const videoBuffer = Buffer.concat(chunks);

    console.log("[v0] Download complete, size:", videoBuffer.length);

    // Xác định content type và filename
    const contentType = format === "mp3" ? "audio/mpeg" : "video/mp4";
    const extension = format === "mp3" ? "mp3" : "mp4";
    const filename = `${videoTitle}.${extension}`;

    // Trả file về frontend
    return new Response(videoBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": videoBuffer.length.toString(),
      },
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
