import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
  try {
    // Nhận data từ frontend
    const body = await req.json();

    console.log("BODY:", body);

    const { videoUrl } = body;

    console.log("VIDEO URL:", videoUrl);

    // Check URL
    if (!videoUrl) {
      return NextResponse.json(
        {
          error: "Missing URL",
        },
        {
          status: 400,
        }
      );
    }

    // Tạo file tạm
    const outputPath = path.join(
      os.tmpdir(),
      `video-${Date.now()}.mp4`
    );

    console.log("OUTPUT:", outputPath);

    // Command yt-dlp
    const command = `yt-dlp -f mp4 -o "${outputPath}" "${videoUrl}"`;

    console.log("COMMAND:", command);

    // Tải video
    await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);

        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      });
    });

    // Check file tồn tại
    if (!fs.existsSync(outputPath)) {
      return NextResponse.json(
        {
          error: "Video file not found after download",
        },
        {
          status: 500,
        }
      );
    }

    // Đọc file video
    const videoBuffer = fs.readFileSync(outputPath);

    // Xóa file tạm
    fs.unlinkSync(outputPath);

    // Trả file về frontend
    return new Response(videoBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition":
          'attachment; filename="youtube-video.mp4"',
      },
    });
  } catch (error) {
    console.error("DOWNLOAD ERROR:", error);

    return NextResponse.json(
      {
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}