import { NextResponse } from "next/server";
import { getVercelOidcToken } from "@vercel/oidc";

const CANDIDATES = [
  "poolside/laguna-s-2.1-free",
  "inclusionai/ling-3.0-tiny-free",
  "perplexity/sonar",
  "perplexity/sonar-pro",
  "google/gemini-2.5-flash",
] as const;

export async function GET() {
  try {
    const gatewayToken = process.env.AI_GATEWAY_API_KEY || (await getVercelOidcToken());
    if (!gatewayToken) {
      return NextResponse.json({ ok: false, error: "missing_gateway_auth" }, { status: 500 });
    }

    const attempts: Array<{ model: string; status: number; error?: string }> = [];

    for (const model of CANDIDATES) {
      const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${gatewayToken}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 40,
          stream: false,
          messages: [{ role: "user", content: "Reply with exactly: JOHN_OK" }],
        }),
      });

      const data = await response.json().catch(() => ({}));
      const text = data?.choices?.[0]?.message?.content;
      if (response.ok && typeof text === "string" && text.includes("JOHN_OK")) {
        return NextResponse.json({ ok: true, model: data?.model || model, text, attempts });
      }

      attempts.push({
        model,
        status: response.status,
        error: data?.error?.message || (typeof text === "string" ? `Unexpected response: ${text}` : "No response text"),
      });
    }

    return NextResponse.json({ ok: false, attempts }, { status: 503 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "health_check_failed" },
      { status: 500 }
    );
  }
}
