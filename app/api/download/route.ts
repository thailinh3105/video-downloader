import { NextRequest, NextResponse } from "next/server";

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

    // Sử dụng Cobalt API để lấy link tải
    const cobaltResponse = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: videoUrl,
        videoQuality: "1080",
        audioFormat: format === "mp3" ? "mp3" : "best",
        downloadMode: format === "mp3" ? "audio" : "auto",
        filenameStyle: "pretty",
      }),
    });

    if (!cobaltResponse.ok) {
      console.error("Cobalt API error:", cobaltResponse.status);
      return NextResponse.json(
        { success: false, error: "Lỗi kết nối API. Vui lòng thử lại." },
        { status: 500 }
      );
    }

    const cobaltData = await cobaltResponse.json();

    if (cobaltData.status === "error") {
      return NextResponse.json(
        { success: false, error: cobaltData.error?.code || "Không thể tải video!" },
        { status: 400 }
      );
    }

    // Nếu có link trực tiếp, redirect hoặc trả về
    if (cobaltData.status === "redirect" || cobaltData.status === "tunnel") {
      const downloadUrl = cobaltData.url;
      
      if (!downloadUrl) {
        return NextResponse.json(
          { success: false, error: "Không tìm thấy link tải!" },
          { status: 400 }
        );
      }

      // Fetch video từ URL và stream về client
      const videoResponse = await fetch(downloadUrl);
      
      if (!videoResponse.ok) {
        return NextResponse.json(
          { success: false, error: "Không thể tải file từ nguồn!" },
          { status: 500 }
        );
      }

      const contentType = videoResponse.headers.get("content-type") || "video/mp4";
      const contentLength = videoResponse.headers.get("content-length");
      
      // Tạo filename
      const extension = format === "mp3" ? "mp3" : "mp4";
      const filename = `video_${Date.now()}.${extension}`;

      // Stream response về client
      return new Response(videoResponse.body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
          ...(contentLength && { "Content-Length": contentLength }),
        },
      });
    }

    // Nếu có picker (nhiều lựa chọn), trả về danh sách
    if (cobaltData.status === "picker" && cobaltData.picker) {
      return NextResponse.json({
        success: true,
        status: "picker",
        picker: cobaltData.picker,
      });
    }

    return NextResponse.json(
      { success: false, error: "Định dạng response không hỗ trợ!" },
      { status: 400 }
    );

  } catch (error) {
    console.error("DOWNLOAD ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : "Lỗi tải video";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
