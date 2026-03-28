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

Write a final review based on the player's actual choices, score profile, and outcome tier.

Rules:
- Sound like a senior operator.
- Be clear, sharp, and concrete.
- Use the player's first name no more than once.
- Start with a direct verdict on overall performance: strong, mixed, or weak.
- If the outcome tier is strong, say the player performed well and why.
- If the outcome tier is mixed, say the player was uneven and where they left value on the table.
- If the outcome tier is weak, say performance was weak and what needed to be done differently.
- Do not balance positives and negatives evenly by default. Lean toward the true result.
- Do not use vague leadership language.
- Keep it to exactly 5 lines.
- Each line must be a full sentence.
- Output plain text only with line breaks. No bullets, labels, or markdown.`
        : `You are John, Chief of Staff and Leadership Advisor inside a COO simulation game.

React to one specific decision the player just made.

Rules:
- Sound like a senior operator.
- Be clear, sharp, and concrete.
- Use the player's first name no more than once.
- You will be told whether the choice was strong, mixed, or weak. Lean clearly into that judgment.
- If the choice was strong, say it was the right call and why.
- If the choice was weak, say it was the wrong call and what should have been done instead.
- If the choice was mixed, say it was understandable but suboptimal.
- Mention the exact choice the player made.
- Mention the most important score movements caused by that choice.
- Mention one likely stakeholder reaction or immediate consequence.
- Do not force equal positives and negatives in every answer.
- Do not use vague leadership language.
- Keep it to exactly 5 lines.
- Each line must be a full sentence.
- Output plain text only with line breaks. No bullets, labels, or markdown.`;

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
        model: "gpt-4.1-mini",
        max_output_tokens: 170,
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
  const quality = classifyDecision(delta);

  return `Player name: ${playerName}

Scenario subject: ${scenario?.subject || ""}
Scenario sender: ${scenario?.sender || ""}
Scenario memo: ${scenario?.memo || ""}

Exact choice selected: ${choice?.label || ""}
Choice outcome summary: ${choice?.synopsis || ""}

Decision quality: ${quality.label}
Decision quality guidance:
${quality.guidance}

Score delta from this decision:
Revenue ${formatDelta(delta.revenue)}
Team morale ${formatDelta(delta.morale)}
Trust ${formatDelta(delta.trust)}
Speed ${formatDelta(delta.speed)}
Risk ${formatDelta(delta.risk)}

Current total scores:
Revenue ${scores?.revenue}
Team morale ${scores?.morale}
Trust ${scores?.trust}
Speed ${scores?.speed}
Risk ${scores?.risk}

Write exactly 5 lines:
Line 1: Give a direct verdict on the choice.
Line 2: Explain why it was right, mixed, or wrong in this memo.
Line 3: Explain the biggest business effect from the score movement.
Line 4: State what one stakeholder is likely to think or do next.
Line 5: If the choice was weak, say what should have been done instead. If the choice was strong, say what to protect next. If mixed, say what would have made it stronger.

Be decisive.`;
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
  const overall = classifyOutcome(outcome?.title || "", scores);

  return `Player name: ${playerName}

Outcome title: ${outcome?.title || ""}
Outcome label: ${outcome?.label || ""}
Outcome summary: ${outcome?.summary || ""}
Leadership readout: ${outcome?.readout || ""}

Overall verdict: ${overall.label}
Overall guidance:
${overall.guidance}

Final scores:
Revenue ${scores?.revenue}
Team morale ${scores?.morale}
Trust ${scores?.trust}
Speed ${scores?.speed}
Risk ${scores?.risk}

Player choices:
${history.length
  ? history
      .map(
        (item, index) =>
          `${index + 1}. ${item.subject} | ${item.choiceLabel} | ${item.synopsis}`
      )
      .join("\n")
  : "No choices recorded."}

Write exactly 5 lines:
Line 1: Give a direct overall verdict.
Line 2: State the clearest reason the player did well or poorly.
Line 3: State the biggest weakness or value left on the table.
Line 4: Explain the business effect of this leadership pattern.
Line 5: End with a direct bottom-line read.

Be decisive, not balanced by default.`;
}

function classifyDecision(delta: ScoreDelta) {
  const score =
    delta.revenue * 2 +
    delta.trust * 2 +
    delta.morale +
    delta.speed -
    delta.risk * 2;

  if (score >= 3) {
    return {
      label: "strong",
      guidance:
        "This was likely the right call. Lean positive. Make that clear. Do not spend equal time on negatives.",
    };
  }

  if (score <= -3) {
    return {
      label: "weak",
      guidance:
        "This was likely the wrong call. Be direct about that. Say what should have been done instead.",
    };
  }

  return {
    label: "mixed",
    guidance:
      "This was understandable but not optimal. Explain the tradeoff and what would have made it stronger.",
  };
}

function classifyOutcome(title: string, scores: ScoreState) {
  const normalized =
    title === "Elite Operator" || title === "Strong but Uneven"
      ? "strong"
      : title === "Holding It Together"
        ? "mixed"
        : "weak";

  if (normalized === "strong") {
    return {
      label: "strong",
      guidance:
        "The player did well overall. Say that clearly. Note the biggest strength first, then the main weakness.",
    };
  }

  if (normalized === "weak") {
    return {
      label: "weak",
      guidance:
        "The player performed poorly overall. Say that clearly. Explain what hurt results most.",
    };
  }

  return {
    label: "mixed",
    guidance:
      "The player was uneven overall. Say that clearly. Explain where they left value on the table.",
  };
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
