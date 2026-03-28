import { NextResponse } from "next/server";

type ScoreState = {
  revenue: number;
  morale: number;
  trust: number;
  speed: number;
  risk: number;
};

type DecisionLogItem = {
  scenarioId: number;
  subject: string;
  sender: string;
  choiceLabel: string;
  synopsis: string;
  scoresAfter: ScoreState;
};

type ScoreDelta = {
  revenue: number;
  morale: number;
  trust: number;
  speed: number;
  risk: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing." }, { status: 500 });
    }

    const mode = body?.mode;
    const playerName = String(body?.playerName || "Player").trim() || "Player";

    const systemPrompt =
      mode === "final"
        ? `You are John, Chief of Staff and Leadership Advisor inside a COO simulation game.

Write a final leadership review for the player.

Rules:
- Speak like a sharp, experienced operator.
- Sound grounded, specific, and human.
- Do not sound like a therapist, generic coach, or consultant.
- Use the player's first name naturally no more than once.
- Base the review on the actual choices made and the final score profile.
- Identify the player's operating style, strengths, blind spots, and likely business effect.
- Be concrete. Avoid vague statements.
- Do not use filler like "interesting", "nuanced", "complex", or "real leadership moment".
- Keep it to exactly 6 lines.
- Each line should be a full sentence.
- Output plain text only with line breaks. No bullets, no markdown, no labels.`
        : `You are John, Chief of Staff and Leadership Advisor inside a COO simulation game.

Write the advisor response immediately after the player makes a decision.

Rules:
- Speak like a sharp, experienced operator.
- Sound grounded, specific, and human.
- Do not sound like a therapist, generic coach, or consultant.
- Use the player's first name naturally no more than once.
- Explicitly mention the exact option the player chose.
- Explicitly mention what improved and what worsened.
- Explicitly mention at least 2 score dimensions if they changed.
- Include one likely stakeholder reaction.
- Include one likely next consequence.
- Only mention a broader pattern if the prior choices clearly support it.
- Avoid vague phrases like "I am watching your pattern" or "this was a real operating call".
- Avoid generic praise.
- Keep it to exactly 7 lines.
- Each line should be a full sentence.
- Output plain text only with line breaks. No bullets, no markdown, no labels.`;

    const userPrompt =
      mode === "final"
        ? buildFinalPrompt({
            playerName,
            history: body?.history || [],
            scores: body?.scores,
            outcome: body?.outcome,
          })
        : buildDecisionPrompt({
            playerName,
            scenario: body?.scenario,
            choice: body?.choice,
            scores: body?.scores,
            history: body?.history || [],
          });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: userPrompt }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "OpenAI request failed." },
        { status: response.status }
      );
    }

    const text = extractText(data);

    return NextResponse.json({ text });
  } catch (error) {
    console.error("John API error", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

function buildDecisionPrompt({
  playerName,
  scenario,
  choice,
  scores,
  history,
}: {
  playerName: string;
  scenario: any;
  choice: any;
  scores: ScoreState;
  history: DecisionLogItem[];
}) {
  const previousScores = history.length
    ? history[history.length - 1].scoresAfter
    : { revenue: 0, morale: 0, trust: 0, speed: 0, risk: 0 };

  const delta = getScoreDelta(previousScores, scores);
  const recentHistory = history.slice(-3);

  return `Player name: ${playerName}

Current scenario:
- Subject: ${scenario?.subject || ""}
- Sender: ${scenario?.sender || ""}
- Memo: ${scenario?.memo || ""}

Player choice:
- Label: ${choice?.label || ""}
- Synopsis: ${choice?.synopsis || ""}

Exact score change from this decision:
- Revenue: ${formatDelta(delta.revenue)}
- Team morale: ${formatDelta(delta.morale)}
- Trust: ${formatDelta(delta.trust)}
- Speed: ${formatDelta(delta.speed)}
- Risk: ${formatDelta(delta.risk)}

Current total scores after this decision:
- Revenue: ${scores?.revenue}
- Team morale: ${scores?.morale}
- Trust: ${scores?.trust}
- Speed: ${scores?.speed}
- Risk: ${scores?.risk}

Recent prior choices:
${recentHistory.length ? recentHistory.map(
  (item, index) =>
    `${index + 1}. Scenario: ${item.subject}. Choice: ${item.choiceLabel}. Outcome: ${item.synopsis}.`
).join("\n") : "No prior choices yet."}

Write exactly 7 lines.
Line 1: Name the exact choice the player made.
Line 2: Explain the clearest immediate upside.
Line 3: Explain the clearest immediate downside.
Line 4: Explain what the most important score changes mean.
Line 5: Name one likely stakeholder reaction.
Line 6: Name one likely next tension or consequence.
Line 7: Give a sharp closing read on the decision.

Be specific to this scenario.`;
}

function buildFinalPrompt({
  playerName,
  history,
  scores,
  outcome,
}: {
  playerName: string;
  history: DecisionLogItem[];
  scores: ScoreState;
  outcome: any;
}) {
  return `Player name: ${playerName}

Final outcome:
- Title: ${outcome?.title || ""}
- Summary: ${outcome?.summary || ""}
- Leadership readout: ${outcome?.readout || ""}

Final company scores:
- Revenue: ${scores?.revenue}
- Team morale: ${scores?.morale}
- Trust: ${scores?.trust}
- Speed: ${scores?.speed}
- Risk: ${scores?.risk}

All player choices:
${history.length ? history.map(
  (item, index) =>
    `${index + 1}. Scenario: ${item.subject}. Choice: ${item.choiceLabel}. Outcome: ${item.synopsis}.`
).join("\n") : "No choices recorded."}

Write exactly 6 lines.
Line 1: Summarize the player's operating style.
Line 2: Name the clearest strength.
Line 3: Name the second strength or stabilizing instinct.
Line 4: Name the clearest blind spot.
Line 5: Explain the likely business effect of this leadership style.
Line 6: End with a direct, sharp final read.

Be specific to the actual choices and scores.`;
}

function getScoreDelta(previous: ScoreState, current: ScoreState): ScoreDelta {
  return {
    revenue: (current?.revenue ?? 0) - (previous?.revenue ?? 0),
    morale: (current?.morale ?? 0) - (previous?.morale ?? 0),
    trust: (current?.trust ?? 0) - (previous?.trust ?? 0),
    speed: (current?.speed ?? 0) - (previous?.speed ?? 0),
    risk: (current?.risk ?? 0) - (previous?.risk ?? 0),
  };
}

function formatDelta(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `${value}`;
  return "0";
}

function extractText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const output = Array.isArray(data?.output) ? data.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const entry of content) {
      if (entry?.type === "output_text" && typeof entry?.text === "string" && entry.text.trim()) {
        return entry.text.trim();
      }
    }
  }

  return "";
}