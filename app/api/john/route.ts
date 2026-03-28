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

Your job is to write a sharp final review based only on the player's actual choices and score outcomes.

Hard rules:
- Sound like a senior operator, not a coach or consultant.
- Be direct, specific, and concrete.
- Use the player's first name no more than once.
- Refer to actual patterns in the choices. Do not invent.
- Mention real strengths, real weaknesses, and real business consequences.
- No vague filler.
- Do not use phrases like:
  "real operating call"
  "not a cosmetic one"
  "pattern behind your decisions"
  "pressure compounds fast"
  "second-order effect"
  "visible problem"
  "part of the real story"
  "how the company experiences your leadership"
- Keep it to exactly 5 lines.
- Each line must be meaningfully different.
- Output plain text only with line breaks. No bullets, no labels, no markdown.`
        : `You are John, Chief of Staff and Leadership Advisor inside a COO simulation game.

Your job is to react to one specific decision the player just made.

Hard rules:
- Sound like a senior operator, not a coach or consultant.
- Be direct, specific, and concrete.
- Use the player's first name no more than once.
- Mention the exact option chosen.
- Mention the actual score movements that matter most.
- Explain one upside and one downside tied to this exact scenario.
- Name one stakeholder who is likely to react and how.
- Name the next likely consequence.
- Do not give generic leadership commentary.
- Do not repeat stock phrases across scenarios.
- Do not use phrases like:
  "real operating call"
  "not a cosmetic one"
  "pattern behind your decisions"
  "pressure compounds fast"
  "second-order effect"
  "visible problem"
  "part of the real story"
  "how the company experiences your leadership"
- Keep it to exactly 5 lines.
- Each line must be meaningfully different.
- Output plain text only with line breaks. No bullets, no labels, no markdown.

Write like you are responding to this exact memo, not to leadership in general.`;

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
  const recentHistory = history.slice(-2);

  return `Player name: ${playerName}

Current scenario
Subject: ${scenario?.subject || ""}
Sender: ${scenario?.sender || ""}
Memo: ${scenario?.memo || ""}

Exact option selected
Label: ${choice?.label || ""}
Synopsis: ${choice?.synopsis || ""}

Score delta from this decision
Revenue: ${formatDelta(delta.revenue)}
Team morale: ${formatDelta(delta.morale)}
Trust: ${formatDelta(delta.trust)}
Speed: ${formatDelta(delta.speed)}
Risk: ${formatDelta(delta.risk)}

Current totals after this decision
Revenue: ${scores?.revenue}
Team morale: ${scores?.morale}
Trust: ${scores?.trust}
Speed: ${scores?.speed}
Risk: ${scores?.risk}

Recent prior choices
${recentHistory.length
  ? recentHistory
      .map(
        (item, index) =>
          `${index + 1}. ${item.subject} | ${item.choiceLabel} | ${item.synopsis}`
      )
      .join("\n")
  : "No prior choices."}

Write exactly 5 lines:
Line 1: State the exact choice and your immediate read.
Line 2: State the clearest upside tied to this memo.
Line 3: State the clearest downside tied to this memo.
Line 4: Explain the most important score changes in plain English.
Line 5: Name the stakeholder reaction or next consequence.

Make each line distinct and specific to this memo.`;
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

Final outcome
Title: ${outcome?.title || ""}
Summary: ${outcome?.summary || ""}
Leadership readout: ${outcome?.readout || ""}

Final company scores
Revenue: ${scores?.revenue}
Team morale: ${scores?.morale}
Trust: ${scores?.trust}
Speed: ${scores?.speed}
Risk: ${scores?.risk}

All player choices
${history.length
  ? history
      .map(
        (item, index) =>
          `${index + 1}. ${item.subject} | ${item.choiceLabel} | ${item.synopsis}`
      )
      .join("\n")
  : "No choices recorded."}

Write exactly 5 lines:
Line 1: Summarize the player's operating style based on actual choices.
Line 2: State the clearest strength.
Line 3: State the clearest weakness.
Line 4: Explain the likely business effect of this style.
Line 5: End with a direct final read.

Make each line concrete and tied to the actual game.`;
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