import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Try to fetch the headers of the URL
    try {
      const response = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      // Check for X-Frame-Options header
      const xFrameOptions = response.headers.get("X-Frame-Options");
      const contentSecurityPolicy = response.headers.get("Content-Security-Policy");

      // If X-Frame-Options is DENY or SAMEORIGIN, embedding is not allowed
      if (xFrameOptions && (xFrameOptions.toUpperCase() === "DENY" || xFrameOptions.toUpperCase() === "SAMEORIGIN")) {
        return NextResponse.json({ supported: false });
      }

      // Check Content-Security-Policy for frame-ancestors directive
      if (contentSecurityPolicy && contentSecurityPolicy.includes("frame-ancestors")) {
        // If frame-ancestors is restrictive, embedding is not allowed
        if (contentSecurityPolicy.includes("frame-ancestors 'none'") || 
            contentSecurityPolicy.includes("frame-ancestors 'self'")) {
          return NextResponse.json({ supported: false });
        }
      }

      // If no restrictive headers are found, assume embedding is allowed
      return NextResponse.json({ supported: true });
    } catch (error) {
      console.error("Error fetching URL headers:", error);
      
      // For security reasons, many streaming services block HEAD requests
      // In this case, we'll assume embedding is not supported
      return NextResponse.json({ supported: false });
    }
  } catch (error) {
    console.error("Error checking iframe support:", error);
    return NextResponse.json(
      { error: "Failed to check iframe support" },
      { status: 500 }
    );
  }
}
