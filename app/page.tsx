"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Volume2,
  VolumeX,
  ChevronRight,
  Building2,
  ShieldAlert,
  Coins,
  Users,
  Rocket,
  BrainCircuit,
  Briefcase,
  Trophy,
  Medal,
  ClipboardList,
  Archive,
} from "lucide-react";

const scenarios = [
  {
    id: 1,
    icon: ShieldAlert,
    sender: "Priya Nair, Chief Product Officer",
    subject: "Urgent: Reporting platform outage affecting major clients",
    time: "Monday, 8:14 AM",
    memo: `At 8:10 a.m. Eastern, Northstar Cloud’s core reporting platform went down for several large enterprise clients across Europe and North America. Customer support queues are already spiking. Account teams are asking what they should tell clients. Engineering is working the issue, but there is still no reliable estimate for full recovery.

Two major clients have already threatened escalation if service is not restored soon. Product wants time to confirm root cause before communicating broadly. Sales leadership wants a client-facing update now. Internal confidence is starting to wobble.`,
    choices: [
      {
        label:
          "Move all needed teams into incident mode and send a clear client update immediately",
        effect: { revenue: 0, morale: -1, trust: 2, speed: 1, risk: -1 },
        synopsis:
          "Clients are frustrated, but they appreciate the clarity. Recovery is painful, though trust holds better than expected.",
      },
      {
        label:
          "Let Product and Engineering stabilize first, while account teams hold clients for more details",
        effect: { revenue: -1, morale: 0, trust: -1, speed: 0, risk: 1 },
        synopsis:
          "The issue gets fixed, but client teams feel underinformed. Some internal leaders question whether the company moved fast enough.",
      },
      {
        label:
          "Keep communications tightly limited until the problem is fully understood",
        effect: { revenue: -2, morale: 0, trust: -2, speed: 1, risk: 2 },
        synopsis:
          "The outage is contained, but silence damages confidence. The problem becomes smaller technically than it becomes reputationally.",
      },
    ],
  },
  {
    id: 2,
    icon: Coins,
    sender: "Elena Brooks, Global Head of Sales",
    subject: "Immediate decision needed on renewal package",
    time: "Tuesday, 10:02 AM",
    memo: `A major global client is close to renewing a large annual deal. During late-stage negotiation, a senior sales lead verbally promised a sizable strategic incentive package to help close the renewal. The client now believes that package is committed.

Your team reviewed the details this morning. There is no approved budget behind the incentive, no formal Finance sign-off, and no alignment across the regions that would need to help fund it. Sales says pulling back now could put the deal at risk. Finance says approving it now would create a dangerous precedent.`,
    choices: [
      {
        label:
          "Honor the commitment this one time and work out the funding afterward",
        effect: { revenue: 2, morale: -1, trust: -2, speed: 1, risk: 2 },
        synopsis:
          "The deal gets signed, but other teams start asking why process matters if exceptions get rewarded at the top.",
      },
      {
        label:
          "Reset the client expectation now and make clear the package was never approved",
        effect: { revenue: -2, morale: 0, trust: 1, speed: -1, risk: -1 },
        synopsis:
          "The client is unhappy and the sales lead is furious, but Finance and Ops see the decision as disciplined and fair.",
      },
      {
        label:
          "Replace it with a narrower package tied to ROI, partial funding, and fast executive review",
        effect: { revenue: 1, morale: 0, trust: 1, speed: 0, risk: 0 },
        synopsis:
          "The client pushes back, but accepts the revised structure. You save most of the value without fully breaking the rules.",
      },
    ],
  },
  {
    id: 3,
    icon: Briefcase,
    sender: "Marcus Hill, CFO",
    subject: "Need budget action plan by Friday",
    time: "Wednesday, 6:40 PM",
    memo: `Finance has flagged that spending is running above plan in several areas. Revenue is still broadly in range, but margin pressure is building and leadership wants immediate action. You have been asked to return by Friday with a credible operating plan.

There is no obvious lever. A global offsite in Singapore is already planned. Travel and event costs are elevated. Some teams have invested heavily in growth programs and do not want to slow down. Cutting headcount would be disruptive and slow. The question is how to respond with discipline without damaging momentum.`,
    choices: [
      {
        label:
          "Take a portfolio approach: cancel the Singapore offsite, reduce discretionary spend, ask VPs for targeted cuts, and push for selective revenue offsets",
        effect: { revenue: 0, morale: -1, trust: 1, speed: 0, risk: -1 },
        synopsis:
          "The plan is seen as balanced and adult, though some leaders resent losing visible programs.",
      },
      {
        label:
          "Protect core growth bets and make only lighter cuts, counting on stronger commercial performance to close the gap",
        effect: { revenue: 0, morale: 0, trust: -2, speed: 1, risk: 2 },
        synopsis:
          "Teams feel protected, but Finance remains uneasy. Pressure does not disappear, it just moves forward.",
      },
      {
        label:
          "Centralize approvals and review all major spend yourself before anything new is committed",
        effect: { revenue: -1, morale: -1, trust: -1, speed: -2, risk: -1 },
        synopsis:
          "Spending tightens quickly, but decision-making slows. People start waiting for your approval on too many things.",
      },
    ],
  },
  {
    id: 4,
    icon: Users,
    sender: "Maya Chen, Chief People Officer",
    subject: "Employee reaction is escalating",
    time: "Thursday, 9:25 AM",
    memo: `Last week’s policy change was meant to improve cost discipline and consistency. Instead, it has triggered a wave of frustration across the company. Managers are hearing complaints from their teams. Internal channels are filling with criticism. A few respected leaders have quietly told you morale is dropping faster than senior leadership realizes.

Some executives think the reaction will fade if the company stays firm. Others think leadership underestimated the human impact and now needs to respond directly. If nothing is said, trust may erode. If leadership reverses course too quickly, it may look weak and unsteady.`,
    choices: [
      {
        label:
          "Address the company directly, explain the business logic, acknowledge the concerns, and make limited changes where justified",
        effect: { revenue: 0, morale: 1, trust: 2, speed: 0, risk: -1 },
        synopsis:
          "The response does not please everyone, but employees feel heard and the temperature drops.",
      },
      {
        label:
          "Hold the line and ask managers to reinforce the policy calmly within their teams",
        effect: { revenue: 0, morale: -2, trust: -2, speed: 1, risk: 1 },
        synopsis:
          "The noise quiets externally, but frustration lingers. Leaders start hearing that trust took a hit.",
      },
      {
        label:
          "Soften or partially reverse the policy quickly to stabilize morale",
        effect: { revenue: -1, morale: 2, trust: 0, speed: 1, risk: 1 },
        synopsis:
          "Morale improves quickly, but some executives begin questioning whether the company has the stomach to stick with hard decisions.",
      },
    ],
  },
  {
    id: 5,
    icon: Building2,
    sender: "Jonah Reed, SVP Global Accounts",
    subject: "Flagship client delivery is slipping",
    time: "Friday, 7:55 AM",
    memo: `A premium global project for one of Northstar Cloud’s largest clients is falling behind. The work involves multiple teams across regions and was sold as a high-visibility strategic program. Deadlines are now moving, execution quality is uneven, and internal owners are not aligned on what success actually looks like.

The client has started asking harder questions. The account team wants to steady the relationship quietly and avoid executive attention. Delivery teams say the original scope was unrealistic from the start. Leadership is worried because the client matters to both revenue and reputation.`,
    choices: [
      {
        label:
          "Step in directly, reset owners and milestones, and have a candid recovery conversation with the client",
        effect: { revenue: 0, morale: -1, trust: 1, speed: 0, risk: -1 },
        synopsis:
          "The client conversation is uncomfortable, but accountability sharpens and the project regains a path.",
      },
      {
        label:
          "Let the account team manage the client while internal teams work the problem in the background",
        effect: { revenue: -1, morale: 0, trust: -2, speed: 1, risk: 2 },
        synopsis:
          "The situation stays contained for a while, but confusion keeps spreading underneath the surface.",
      },
      {
        label:
          "Reduce scope, protect the most important deliverables, and reposition the work as a phased rollout",
        effect: { revenue: 1, morale: 0, trust: 1, speed: 1, risk: 0 },
        synopsis:
          "The client is not thrilled, but they accept a more realistic path. Internally, teams feel relieved to have clearer boundaries.",
      },
    ],
  },
  {
    id: 6,
    icon: BrainCircuit,
    sender: "Rahul Sethi, Chief Strategy Officer",
    subject: "Competitor launch is impacting live deals",
    time: "Monday, 11:18 AM",
    memo: `A direct competitor has launched a new AI product focused on planning, optimization, and decision support. It promises faster insights, automated recommendations, and tighter workflow integration across planning, reporting, and creative iteration.

Industry coverage has been strong. Several Northstar Cloud sales teams are already hearing questions from clients in active late-stage deals. A few opportunities are slowing because buyers want to better understand whether Northstar Cloud is now behind. The immediate revenue impact is still limited, but pipeline confidence is starting to weaken.`,
    choices: [
      {
        label:
          "Launch a strong public response now with a clear narrative, selective demos, and a visible market signal",
        effect: { revenue: 1, morale: 1, trust: -1, speed: 2, risk: 2 },
        synopsis:
          "The market sees movement, but some teams worry the company is getting ahead of what it can actually deliver.",
      },
      {
        label:
          "Stay measured publicly, arm internal teams with stronger talking points, and quietly speed up the real roadmap",
        effect: { revenue: 0, morale: 0, trust: 1, speed: 0, risk: -1 },
        synopsis:
          "Clients do not panic, but the response feels quiet. Internally, people debate whether caution looks too passive.",
      },
      {
        label:
          "Form a temporary AI response team across Product, Sales, and Ops to protect pipeline and deliver a 60-day plan",
        effect: { revenue: 1, morale: 1, trust: 1, speed: -1, risk: 0 },
        synopsis:
          "The company does not react loudly, but it starts moving with discipline. The pipeline gets a stronger defense and the real gaps become clearer.",
      },
    ],
  },
  {
    id: 7,
    icon: Rocket,
    sender: "Lena Torres, Chief Marketing Officer",
    subject: "Launch narrative is drifting across teams",
    time: "Tuesday, 4:06 PM",
    memo: `Northstar Cloud is six weeks away from a major global product launch. The product itself is progressing, but the launch story is drifting. Product is focused on features. Sales wants a bolder commercial message. Marketing is waiting for sharper positioning. Regional teams are asking how to localize the story. Operations is tracking dependencies, but no one has clearly taken ownership of the overall launch narrative.

Teams are already using different language to describe the product, the target customer, and the expected business impact. Internal decks do not match. Go-to-market materials are incomplete. Leadership is starting to ask who is actually driving this launch.`,
    choices: [
      {
        label:
          "Appoint one clear launch lead now and force alignment on narrative, audience, and decision rights within a week",
        effect: { revenue: 1, morale: -2, trust: 0, speed: 2, risk: -1 },
        synopsis:
          "Alignment comes fast, though not everyone likes how it happened. The launch starts to feel coherent.",
      },
      {
        label:
          "Keep ownership distributed, but run a tight operating cadence with daily reviews to drive alignment",
        effect: { revenue: 0, morale: 0, trust: -1, speed: 0, risk: 1 },
        synopsis:
          "The teams keep talking, but ambiguity lingers. Things move, though not with enough clarity.",
      },
      {
        label:
          "Narrow the launch scope, prioritize the most critical markets and materials, and delay the broader rollout",
        effect: { revenue: 0, morale: 1, trust: 2, speed: -1, risk: -2 },
        synopsis:
          "The launch becomes sharper and safer, but some leaders worry that the company is leaving momentum on the table.",
      },
    ],
  },
];

const initialScores = {
  revenue: 50,
  morale: 50,
  trust: 50,
  speed: 50,
  risk: 50,
};

type MetricKey = keyof typeof initialScores;

const metricMeta: { key: MetricKey; label: string }[] = [
  { key: "revenue", label: "Revenue" },
  { key: "morale", label: "Team morale" },
  { key: "trust", label: "Trust" },
  { key: "speed", label: "Speed" },
  { key: "risk", label: "Risk" },
];

type ScoreState = typeof initialScores;
type ScenarioChoice = (typeof scenarios)[number]["choices"][number];

type Outcome = {
  title: string;
  label: string;
  summary: string;
  readout: string;
  perkTitle: string;
  perk: string;
  tone: "elite" | "good" | "mixed" | "bad";
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

function shiftScore(base: number, delta: number, key: string) {
  const multiplier = key === "risk" ? -6 : 6;
  return clamp(base + delta * multiplier);
}

function getOutcome(scores: ScoreState): Outcome {
  const { revenue, morale, trust, speed, risk } = scores;
  const total = revenue + morale + trust + speed + (100 - risk);

  if (total >= 306 && revenue >= 54 && trust >= 56 && risk <= 46 && morale >= 46) {
    return {
      title: "Elite Operator",
      label: "Best outcome",
      summary:
        "You ran Northstar Cloud with strong judgment under pressure. Revenue held up, trust stayed intact, and the business looked more coherent by the end of the run. This is the strongest operating outcome in the game.",
      readout:
        "You created the strongest outcome in the game. Your choices suggest a COO who knows when to step in, when to stay disciplined, and how to protect both performance and trust at the same time.",
      perkTitle: "Board-level reward package",
      perk:
        "You receive 500 shares of NC, a leadership bonus, and a company-paid week in Hawaii. The board now uses phrases like strategic force multiplier when you walk into the room.",
      tone: "elite",
    };
  }

  if (total >= 276 && revenue >= 50 && trust >= 48 && risk <= 56) {
    return {
      title: "Strong but Uneven",
      label: "Good outcome",
      summary:
        "You made several strong calls and kept the company moving, but not without trade-offs. Northstar Cloud finished in a solid position, though some cracks in consistency, trust, or pace showed through.",
      readout:
        "You landed in a good place overall, but not cleanly. Your decision pattern shows a capable COO who can move the business forward, though some trade-offs weakened consistency along the way.",
      perkTitle: "Executive thank-you package",
      perk:
        "You get a healthy bonus, a glowing CEO shoutout at the all-hands, and first pick of the corner office with the better coffee machine nearby.",
      tone: "good",
    };
  }

  if (total >= 240) {
    return {
      title: "Holding It Together",
      label: "Mixed outcome",
      summary:
        "You avoided a full breakdown, but the company never fully found its rhythm. Some decisions stabilized the business while others left momentum or clarity on the table. Northstar Cloud ends this stretch intact, but not especially strong.",
      readout:
        "You kept the business from slipping too far, but the company never fully stabilized or accelerated. Your choices suggest a leader who managed pressure adequately, though without enough clarity or force to produce a stronger finish.",
      perkTitle: "Polite corporate outcome",
      perk:
        "You get a careful thank-you note, a performance review with the phrase steady hand, and a promise that bigger opportunities may come next cycle if momentum improves.",
      tone: "mixed",
    };
  }

  return {
    title: "Operating Breakdown",
    label: "Bad outcome",
    summary:
      "The trade-offs compounded in the wrong direction. Trust weakened, risk built up, and Northstar Cloud came out of the run looking less aligned, less controlled, and more fragile than it needed to be.",
    readout:
      "You landed in the weakest outcome. The pattern of choices suggests a COO who let too many issues compound, leaving the company less aligned and less resilient by the end of the run.",
    perkTitle: "Facilities update",
    perk:
      "Your office has been moved to the basement level, next to archived monitors and an unlabeled ethernet closet. You still have a desk, but morale would not describe it as premium.",
    tone: "bad",
  };
}

function getPerkTheme(tone: Outcome["tone"]) {
  if (tone === "elite") {
    return {
      icon: Trophy,
      wrapper:
        "border-[#D9B45B]/30 bg-[linear-gradient(135deg,rgba(217,180,91,0.18),rgba(15,143,107,0.12))]",
      iconWrap: "bg-[#D9B45B]/18 text-[#F2D48A] border border-[#D9B45B]/30",
      eyebrow: "text-[#F2D48A]",
      body: "text-[#F8EBC5]",
    };
  }

  if (tone === "good") {
    return {
      icon: Medal,
      wrapper:
        "border-[#7DBFA7]/30 bg-[linear-gradient(135deg,rgba(125,191,167,0.16),rgba(95,125,149,0.12))]",
      iconWrap: "bg-[#0F8F6B]/16 text-[#B8F0DC] border border-[#0F8F6B]/25",
      eyebrow: "text-[#B8F0DC]",
      body: "text-[#DFF6EE]",
    };
  }

  if (tone === "mixed") {
    return {
      icon: ClipboardList,
      wrapper:
        "border-[#8FA1B2]/28 bg-[linear-gradient(135deg,rgba(143,161,178,0.16),rgba(199,147,58,0.10))]",
      iconWrap: "bg-[#5F7D95]/16 text-[#D7E3EC] border border-[#5F7D95]/25",
      eyebrow: "text-[#D7E3EC]",
      body: "text-[#E4EBF0]",
    };
  }

  return {
    icon: Archive,
    wrapper:
      "border-[#B56666]/28 bg-[linear-gradient(135deg,rgba(182,102,102,0.18),rgba(80,28,28,0.14))]",
    iconWrap: "bg-[#C65A5A]/16 text-[#F3C1C1] border border-[#C65A5A]/25",
    eyebrow: "text-[#F3C1C1]",
    body: "text-[#F6D7D7]",
  };
}

function NorthstarLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? "gap-2" : "gap-2.5"}`}>
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-xl border border-[#0F8F6B]/35 bg-[#18211f] text-[#D8F4EB] shadow-[0_0_30px_rgba(15,143,107,0.12)] ${compact ? "h-9 w-10" : "h-11 w-12"}`}
      >
        <span
          className={`relative z-10 font-semibold italic tracking-[0.16em] ${compact ? "text-[11px]" : "text-[13px]"}`}
        >
          NC
        </span>
        <div className="absolute left-[-10%] top-[48%] h-[2px] w-[120%] -rotate-[22deg] bg-[#0F8F6B]/70" />
        <div className="absolute right-[8%] top-[18%] h-1.5 w-1.5 rounded-full bg-[#C7933A] shadow-[0_0_10px_rgba(199,147,58,0.5)]" />
      </div>
      <div>
        <div
          className={`font-semibold tracking-[0.16em] text-[#F4F7F8] ${compact ? "text-xs" : "text-sm"}`}
        >
          NORTHSTAR CLOUD
        </div>
        {!compact && (
          <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[#A7B2BA]">
            Operating intelligence for modern growth
          </div>
        )}
      </div>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const width = `${value}%`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-[#A7B2BA]">
        <span>{label}</span>
        <span className="text-[#F4F7F8]">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#5F7D95] via-[#0F8F6B] to-[#C7933A]"
          animate={{ width }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function COOGamePrototype() {
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(true);
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<ScoreState>(initialScores);
  const [selected, setSelected] = useState<ScenarioChoice | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const current = scenarios[step];
  const isComplete = step >= scenarios.length;
  const outcome = useMemo(() => getOutcome(scores), [scores]);
  const perkTheme = getPerkTheme(outcome.tone);
  const PerkIcon = perkTheme.icon;

  useEffect(() => {
    if (!started || muted) return;
    const audio = new Audio(
      "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8f6f7d8d4.mp3?filename=ambient-piano-logo-165357.mp3"
    );
    audio.volume = 0.08;
    audio.loop = true;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
    };
  }, [started, muted]);

  const applyChoice = (choice: ScenarioChoice) => {
    setSelected(choice);
    setScores((prev) => ({
      revenue: shiftScore(prev.revenue, choice.effect.revenue, "revenue"),
      morale: shiftScore(prev.morale, choice.effect.morale, "morale"),
      trust: shiftScore(prev.trust, choice.effect.trust, "trust"),
      speed: shiftScore(prev.speed, choice.effect.speed, "speed"),
      risk: shiftScore(prev.risk, choice.effect.risk, "risk"),
    }));
  };

  const next = () => {
    setSelected(null);
    setStep((s) => s + 1);
  };

  const restart = () => {
    setStarted(false);
    setStep(0);
    setSelected(null);
    setScores(initialScores);
    setShareCopied(false);
  };

  const handleShare = async () => {
    const shareText = `I just played You Are the COO at Northstar Cloud and got: ${outcome.title}.`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "You Are the COO",
          text: shareText,
          url: window.location.href,
        });
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 2200);
      }
    } catch (error) {
      console.error("Share failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#121417] text-[#F4F7F8]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,143,107,0.18),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(95,125,149,0.18),transparent_28%)]" />

      {!started ? (
        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10">
          <div className="flex items-center justify-between">
            <NorthstarLogo />
            <button
              onClick={() => setMuted((m) => !m)}
              className="rounded-full border border-white/10 bg-white/5 p-3 text-[#A7B2BA] transition hover:bg-white/10 hover:text-white"
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>

          <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-4 inline-flex items-center rounded-full border border-[#C7933A]/30 bg-[#C7933A]/10 px-4 py-1 text-xs uppercase tracking-[0.24em] text-[#C7933A]">
                Executive simulation
              </div>
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">
                You Are the <span className="text-[#0F8F6B]">COO</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#A7B2BA]">
                Run Northstar Cloud through pressure, trade-offs, and growth. Each
                decision shapes revenue, trust, morale, speed, and risk. Your outcome
                depends on how you lead.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setStarted(true)}
                  className="inline-flex items-center gap-3 rounded-2xl bg-[#0F8F6B] px-6 py-4 text-base font-medium text-white shadow-[0_10px_40px_rgba(15,143,107,0.35)] transition hover:scale-[1.01] hover:bg-[#119a74]"
                >
                  <Play className="h-5 w-5" />
                  Start Day 1
                </button>
                <div className="text-sm text-[#A7B2BA]">
                  7 decisions. One company. Multiple endings.
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
              <div className="rounded-[22px] border border-[#2f3a42] bg-[#D9D3C7] p-6 text-[#152028] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                <div className="mb-5 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[#5F7D95]">
                  <span>Northstar Cloud</span>
                  <span>Company brief</span>
                </div>
                <p className="text-sm leading-7 text-[#31404d]">
                  Northstar Cloud is a fast-growing global technology company serving
                  major brands and enterprises across 26 markets. The company helps
                  clients manage digital growth, automation, and customer intelligence.
                  It has scaled quickly, but pressure is rising across revenue, budgets,
                  client delivery, product positioning, and internal alignment.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Employees", "4,800"],
                    ["Markets", "26"],
                    ["Annual revenue", "$3.2B"],
                    ["Enterprise clients", "180"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-2xl border border-[#d5d0c6] bg-white/60 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-[#75818c]">
                        {k}
                      </div>
                      <div className="mt-2 text-2xl font-semibold text-[#1C2228]">
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative mx-auto min-h-screen max-w-7xl px-6 py-6">
          <div className="mb-6 flex items-center justify-between">
            <NorthstarLogo compact />
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#A7B2BA]">
                Scenario {Math.min(step + 1, scenarios.length)} / {scenarios.length}
              </div>
              <button
                onClick={() => setMuted((m) => !m)}
                className="rounded-full border border-white/10 bg-white/5 p-3 text-[#A7B2BA] transition hover:bg-white/10 hover:text-white"
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-5">
            {metricMeta.map((m) => (
              <MetricBar key={m.key} label={m.label} value={scores[m.key as keyof typeof scores]} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {!isComplete && !selected && (
              <motion.div
                key={`scenario-${current.id}`}
                initial={{ opacity: 0, y: 20, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.985 }}
                transition={{ duration: 0.28 }}
                className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]"
              >
                <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
                  <div className="border-b border-white/10 px-8 py-6">
                    <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-[#A7B2BA]">
                      <span>Incoming memo</span>
                      <span className="h-1 w-1 rounded-full bg-[#A7B2BA]/70" />
                      <span>{current.time}</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-white">{current.subject}</h2>
                    <p className="mt-3 text-sm text-[#A7B2BA]">From: {current.sender}</p>
                  </div>
                  <div className="bg-[#D7D0C3] px-8 py-8 text-[#162129]">
                    <div className="mb-6 flex items-center gap-4">
                      <div className="rounded-2xl bg-[#1B2229] p-3 text-[#F3EFE7]">
                        <current.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-[#75818c]">
                          Northstar Cloud internal
                        </div>
                        <div className="mt-1 text-sm text-[#4c5a66]">
                          Executive operating note
                        </div>
                      </div>
                    </div>
                    <div className="whitespace-pre-line text-[15px] leading-8 text-[#202b34]">
                      {current.memo}
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
                  <div className="mb-5 text-xs uppercase tracking-[0.22em] text-[#C7933A]">
                    Your decision
                  </div>
                  <div className="space-y-4">
                    {current.choices.map((choice, idx) => (
                      <button
                        key={idx}
                        onClick={() => applyChoice(choice)}
                        className="group w-full rounded-[24px] border border-white/10 bg-[#1B2229]/75 p-5 text-left transition hover:border-[#0F8F6B]/50 hover:bg-[#1d272f]"
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-xs font-medium text-[#A7B2BA] transition group-hover:bg-[#0F8F6B]/15 group-hover:text-[#F4F7F8]">
                            0{idx + 1}
                          </div>
                          <div className="text-sm leading-7 text-[#E8EEF0]">
                            {choice.label}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {!isComplete && selected && (
              <motion.div
                key={`consequence-${current.id}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl"
              >
                <div className="rounded-[26px] border border-[#2f3a42] bg-[#D7D0C3] p-8 text-[#162129]">
                  <div className="text-xs uppercase tracking-[0.22em] text-[#5F7D95]">
                    What happened next
                  </div>
                  <h3 className="mt-3 text-3xl font-semibold">Decision recorded</h3>
                  <p className="mt-5 text-[15px] leading-8 text-[#31404d]">{selected.synopsis}</p>

                  <div className="mt-8 grid gap-3 md:grid-cols-5">
                    {metricMeta.map((m) => {
                      const delta = selected.effect[m.key as keyof typeof selected.effect];
                      const positive = m.key === "risk" ? delta < 0 : delta > 0;
                      const neutral = delta === 0;

                      return (
                        <div key={m.key} className="rounded-2xl border border-[#d5d0c6] bg-white/60 p-4">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-[#75818c]">
                            {m.label}
                          </div>
                          <div
                            className={`mt-2 text-xl font-semibold ${
                              neutral
                                ? "text-[#1C2228]"
                                : positive
                                  ? "text-[#0F8F6B]"
                                  : "text-[#C65A5A]"
                            }`}
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={next}
                    className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-[#1B2229] px-6 py-4 text-sm font-medium text-white transition hover:bg-[#222b33]"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {isComplete && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.97, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="mx-auto max-w-6xl overflow-hidden rounded-[34px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
              >
                <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="relative overflow-hidden border-b border-white/10 bg-[linear-gradient(135deg,#14211e_0%,#1b2229_45%,#121417_100%)] p-10 lg:border-b-0 lg:border-r">
                    <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[#0F8F6B]/15 blur-3xl" />
                    <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[#C7933A]/10 blur-3xl" />

                    <div className="relative z-10">
                      <div className="text-xs uppercase tracking-[0.24em] text-[#C7933A]">
                        Final outcome
                      </div>
                      <div className="mt-5 inline-flex rounded-full border border-[#C7933A]/25 bg-[#C7933A]/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#E5C07B]">
                        {outcome.label}
                      </div>
                      <h2 className="mt-6 max-w-xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                        {outcome.title}
                      </h2>
                      <p className="mt-6 max-w-xl text-[16px] leading-8 text-[#A7B2BA]">
                        {outcome.summary}
                      </p>

                      <div className="mt-10 rounded-[24px] border border-white/10 bg-white/5 p-6">
                        <div className="text-xs uppercase tracking-[0.18em] text-[#A7B2BA]">
                          Leadership readout
                        </div>
                        <p className="mt-4 text-sm leading-7 text-[#E5EAED]">{outcome.readout}</p>
                      </div>

                      <div className={`mt-6 rounded-[24px] p-6 ${perkTheme.wrapper}`}>
                        <div className="flex items-start gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${perkTheme.iconWrap}`}>
                            <PerkIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className={`text-xs uppercase tracking-[0.18em] ${perkTheme.eyebrow}`}>
                              {outcome.perkTitle}
                            </div>
                            <p className={`mt-4 text-sm leading-7 ${perkTheme.body}`}>
                              {outcome.perk}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-10 flex flex-wrap gap-4">
                        <button
                          onClick={restart}
                          className="rounded-2xl bg-[#0F8F6B] px-6 py-4 text-sm font-medium text-white transition hover:bg-[#119a74]"
                        >
                          Play again
                        </button>
                        <button
                          onClick={handleShare}
                          className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-medium text-[#F4F7F8] transition hover:bg-white/10"
                        >
                          {shareCopied ? "Link copied" : "Share result"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#D7D0C3] p-8 text-[#162129]">
                    <div className="text-xs uppercase tracking-[0.22em] text-[#5F7D95]">
                      Company scorecard
                    </div>
                    <div className="mt-6 space-y-5">
                      {metricMeta.map((m) => (
                        <div key={m.key}>
                          <div className="mb-2 flex items-center justify-between text-sm text-[#45525d]">
                            <span>{m.label}</span>
                            <span className="font-semibold text-[#1C2228]">
                              {scores[m.key as keyof typeof scores]}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[#d9d4cb]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#5F7D95] via-[#0F8F6B] to-[#C7933A]"
                              style={{ width: `${scores[m.key as keyof typeof scores]}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-3">
                      {metricMeta.map((m) => (
                        <div key={`${m.key}-tile`} className="rounded-2xl border border-[#bfb6a7] bg-[#ece6da] p-4">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-[#75818c]">
                            {m.label}
                          </div>
                          <div className="mt-2 text-2xl font-semibold text-[#1C2228]">
                            {scores[m.key as keyof typeof scores]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}