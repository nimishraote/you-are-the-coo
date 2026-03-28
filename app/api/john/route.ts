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
        ? `You are John, Chief of Staff and Leadership Advisor inside a COO simulation game. Write a final leadership review for the player.

Rules:
- Speak directly to the player by first name naturally, but not more than twice.
- Be sharp, human, thoughtful, and executive.
- Sound like a seasoned operator, not a therapist, cheerleader, or consultant.
- Use concrete language tied to the player's actual pattern of choices.
- Mention strengths, blind spots, and the likely business impact of their operating style.
- Keep it to 6 lines total.
- Output plain text only with line breaks. No bullets, no markdown, no labels.`
        : `You are John, Chief of Staff and Leadership Advisor inside a COO simulation game. Write the interstitial guidance after the player makes a decision.

Rules:
- Speak directly to the player by first name naturally, but not more than twice.
- Be sharp, human, thoughtful, and executive.
- Sound like a seasoned operator, not a therapist, cheerleader, or consultant.
- React to the exact scenario, the exact choice, the current company state, and the pattern of prior choices.
- Avoid generic praise and empty leadership clichés.
- Cover immediate benefit, hidden cost, stakeholder reaction, leadership read, and likely next tension.
- Keep it to 7 lines total.
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
          { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
          { role: "user", content: [{ type: "input_text", text: userPrompt }] },
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

    const text =
      data?.output_text ||
      data?.output?.flatMap((item: any) => item?.content || []).find((c: any) => c?.type === "output_text")?.text ||
      "";

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
  const recentHistory = history.slice(-3);

  return `Player name: ${playerName}

Scenario subject: ${scenario?.subject}
Scenario sender: ${scenario?.sender}
Scenario memo: ${scenario?.memo}

Chosen option: ${choice?.label}
Immediate outcome synopsis: ${choice?.synopsis}
Choice effect: ${JSON.stringify(choice?.effect || {})}

Current scores after this choice:
- Revenue: ${scores?.revenue}
- Team morale: ${scores?.morale}
- Trust: ${scores?.trust}
- Speed: ${scores?.speed}
- Risk: ${scores?.risk}

Recent decision pattern:
${recentHistory
  .map(
    (item, index) =>
      `${index + 1}. ${item.subject} | Choice: ${item.choiceLabel} | Outcome: ${item.synopsis}`
  )
  .join("\n")}

Write John's response now.`;
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

Final outcome title: ${outcome?.title}
Outcome summary: ${outcome?.summary}
Outcome leadership readout: ${outcome?.readout}

Final company scores:
- Revenue: ${scores?.revenue}
- Team morale: ${scores?.morale}
- Trust: ${scores?.trust}
- Speed: ${scores?.speed}
- Risk: ${scores?.risk}

All choices made:
${history
  .map(
    (item, index) =>
      `${index + 1}. ${item.subject} | Choice: ${item.choiceLabel} | Outcome: ${item.synopsis}`
  )
  .join("\n")}

Write John's final leadership review now.`;
}
