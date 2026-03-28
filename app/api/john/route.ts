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

type DecisionRating = "strong" | "middle" | "weak";

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
- Be clear, sharp, concrete, and direct.
- Use the player's first name no more than once, and never in line 1.
- Do not balance positives and negatives evenly by default.
- If the overall result is strong, say the player did well.
- If the overall result is mixed, say the player was uneven.
- If the overall result is weak, say the player underperformed.
- Keep it to exactly 5 lines.
- Each line must be a full sentence.
- Output plain text only with line breaks. No bullets, labels, or markdown.

Line guidance:
1. Direct verdict on overall performance.
2. Clearest reason the run was strong, mixed, or weak.
3. Biggest weakness or value left on the table.
4. Business effect of the player's leadership pattern.
5. Direct bottom-line read.`
        : `You are John, Chief of Staff and Leadership Advisor inside a COO simulation game.

React to one specific decision the player just made.

Rules:
- Sound like a senior operator.
- Be clear, sharp, concrete, and direct.
- Use the player's first name no more than once, and never in line 1.
- You will be told whether the choice was strong, middle, or weak. Lean clearly into that judgment.
- Do not balance positives and negatives evenly by default.
- Keep it to exactly 5 lines.
- Each line must be a full sentence.
- Output plain text only with line breaks. No bullets, labels, or markdown.

Phrasing rules:
- If rating is strong, line 1 should clearly say the player made the right or best call. The rest should mostly reinforce why it was correct, with only a light caution if needed.
- If rating is middle, line 1 should clearly say the move was defensible but not the best choice. The rest should explain what stronger move should have been made.
- If rating is weak, line 1 should clearly say the move was the wrong call. The rest should explain why and what should have been done instead.

Line guidance:
1. Direct verdict on the choice.
2. Why the choice was right, middle, or wrong in this memo.
3. Biggest business effect from the score movement.
4. Stakeholder reaction or immediate next consequence.
5. What to protect next if strong, what would have made it stronger if middle, or what should have been done instead if weak.

Do not start every answer the same way. Vary the wording naturally.`;

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
          });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        max_output_tokens: 190,
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
}: {
  playerName: string;
  scenario: any;
  choice: any;
  scores: ScoreState;
}) {
  const rating = getDecisionRating(scenario?.id, choice?.label || "");

  return `Player name: ${playerName}

Scenario id: ${scenario?.id || ""}
Scenario subject: ${scenario?.subject || ""}
Scenario sender: ${scenario?.sender || ""}
Scenario memo: ${scenario?.memo || ""}

Exact choice selected: ${choice?.label || ""}
Choice outcome summary: ${choice?.synopsis || ""}

Decision rating: ${rating}

Current total scores after this decision:
Revenue ${scores?.revenue}
Team morale ${scores?.morale}
Trust ${scores?.trust}
Speed ${scores?.speed}
Risk ${scores?.risk}

Judgment map for this game:
- Scenario 1: option 1 is strong, option 2 is middle, option 3 is weak.
- Scenario 2: option 3 is strong, option 2 is middle, option 1 is weak.
- Scenario 3: option 1 is strong, option 2 is middle, option 3 is weak.
- Scenario 4: option 1 is strong, option 3 is middle, option 2 is weak.
- Scenario 5: option 3 is strong, option 1 is middle, option 2 is weak.
- Scenario 6: option 3 is strong, option 2 is middle, option 1 is weak.
- Scenario 7: option 3 is strong, option 1 is middle, option 2 is weak.

Be decisive and align the tone to the rating.`;
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
  const overall = classifyOutcome(outcome?.title || "");

  return `Player name: ${playerName}

Outcome title: ${outcome?.title || ""}
Outcome label: ${outcome?.label || ""}
Outcome summary: ${outcome?.summary || ""}
Leadership readout: ${outcome?.readout || ""}

Overall verdict: ${overall}

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
          `${index + 1}. Scenario ${item.scenarioId} | ${item.choiceLabel} | ${item.synopsis}`
      )
      .join("\n")
  : "No choices recorded."}

Final review tone rules:
- If overall verdict is strong, clearly say the player did well overall.
- If overall verdict is mixed, clearly say the player was uneven overall.
- If overall verdict is weak, clearly say the player did poorly overall.
- Do not make the review sound neutral if the result was clearly good or bad.`;
}

function getDecisionRating(scenarioId: number, choiceLabel: string): DecisionRating {
  const normalized = choiceLabel.trim();

  const scenarioChoices: Record<number, { strong: string; middle: string; weak: string }> = {
    1: {
      strong: "Move all needed teams into incident mode and send a clear client update immediately",
      middle: "Let Product and Engineering stabilize first, while account teams hold clients for more details",
      weak: "Keep communications tightly limited until the problem is fully understood",
    },
    2: {
      strong: "Replace it with a narrower package tied to ROI, partial funding, and fast executive review",
      middle: "Reset the client expectation now and make clear the package was never approved",
      weak: "Honor the commitment this one time and work out the funding afterward",
    },
    3: {
      strong: "Take a portfolio approach: cancel the Singapore offsite, reduce discretionary spend, ask VPs for targeted cuts, and push for selective revenue offsets",
      middle: "Protect core growth bets and make only lighter cuts, counting on stronger commercial performance to close the gap",
      weak: "Centralize approvals and review all major spend yourself before anything new is committed",
    },
    4: {
      strong: "Address the company directly, explain the business logic, acknowledge the concerns, and make limited changes where justified",
      middle: "Soften or partially reverse the policy quickly to stabilize morale",
      weak: "Hold the line and ask managers to reinforce the policy calmly within their teams",
    },
    5: {
      strong: "Reduce scope, protect the most important deliverables, and reposition the work as a phased rollout",
      middle: "Step in directly, reset owners and milestones, and have a candid recovery conversation with the client",
      weak: "Let the account team manage the client while internal teams work the problem in the background",
    },
    6: {
      strong: "Form a temporary AI response team across Product, Sales, and Ops to protect pipeline and deliver a 60-day plan",
      middle: "Stay measured publicly, arm internal teams with stronger talking points, and quietly speed up the real roadmap",
      weak: "Launch a strong public response now with a clear narrative, selective demos, and a visible market signal",
    },
    7: {
      strong: "Narrow the launch scope, prioritize the most critical markets and materials, and delay the broader rollout",
      middle: "Appoint one clear launch lead now and force alignment on narrative, audience, and decision rights within a week",
      weak: "Keep ownership distributed, but run a tight operating cadence with daily reviews to drive alignment",
    },
  };

  const entry = scenarioChoices[scenarioId];
  if (!entry) return "middle";
  if (normalized === entry.strong) return "strong";
  if (normalized === entry.weak) return "weak";
  return "middle";
}

function classifyOutcome(title: string): "strong" | "mixed" | "weak" {
  if (title === "Elite Operator" || title === "Strong but Uneven") return "strong";
  if (title === "Holding It Together") return "mixed";
  return "weak";
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
