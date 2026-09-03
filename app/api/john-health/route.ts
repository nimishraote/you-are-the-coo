import { NextResponse } from "next/server";
import { getVercelOidcToken } from "@vercel/oidc";

export async function GET() {
  try {
    const gatewayToken = process.env.AI_GATEWAY_API_KEY || (await getVercelOidcToken());
    if (!gatewayToken) {
      return NextResponse.json({ ok: false, error: "missing_gateway_auth" }, { status: 500 });
    }

    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gatewayToken}`,
      },
      body: JSON.stringify({
        model: "inclusionai/ling-3.0-tiny-free",
        max_tokens: 40,
        stream: false,
        messages: [{ role: "user", content: "Reply with exactly: JOHN_OK" }],
      }),
    });

    const data = await response.json().catch(() => ({}));
    const text = data?.choices?.[0]?.message?.content;
    return NextResponse.json(
      {
        ok: response.ok && typeof text === "string" && text.includes("JOHN_OK"),
        status: response.status,
        model: data?.model,
        text,
        error: data?.error?.message,
      },
      { status: response.ok ? 200 : response.status }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "health_check_failed" },
      { status: 500 }
    );
  }
}
