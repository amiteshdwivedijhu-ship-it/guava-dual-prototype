/* Guava dual prototype: activation console + GVI call eval packet.
   All data is synthetic. Every friction finding cites a stage; every eval
   finding cites a transcript span, a fact id, or a missing step. */

"use strict";

const TARGET_TTFC = "10 min";
const PASS_AT = 24; // out of 30, demo threshold

/* ---------------- data: funnel + metrics ---------------- */

const STAGES = [
  { id: "hear",       label: "Heard about Guava" },
  { id: "signup",     label: "Signed up" },
  { id: "key",        label: "API key created" },
  { id: "sandbox",    label: "Sandbox / first test call" },
  { id: "activation", label: "First meaningful call" },
  { id: "convert",    label: "Converted to paid · Build / Scale" },
];

const METRICS = [
  { label: "Activation rate", value: "34%",  note: "first meaningful call within 14 days", good: true },
  { label: "Median TTFC",     value: "9m 12s", note: "target is 10 minutes or less", good: true },
  { label: "Self-serve conversion", value: "18%", note: "trial to paid, last 90 days", good: true },
  { label: "Handoff count",   value: "7",    note: "self-serve to sales, last 30 days", good: false },
];

/* ---------------- data: journeys ---------------- */

const JOURNEYS = {
  A: {
    id: "J-1042", tag: "Happy path",
    dev: "Mira Chen", role: "backend engineer",
    org: "Northgate Pediatrics",
    useCase: "Patient appointment check-in and insurance update",
    intent: "Self-serve from first call",
    stages: {
      hear:       { status: "done", note: "Homepage CLI, 10-minute claim, docs quickstart", day: "day 0" },
      signup:     { status: "done", note: "GitHub SSO on app.goguava.ai", day: "day 0" },
      key:        { status: "done", note: "Keys page, one key, scoped to sandbox", day: "day 0" },
      sandbox:    { status: "done", note: "guava run · test call ended with 9", day: "day 0" },
      activation: { status: "done", note: "First meaningful call on the sandbox number", day: "day 0" },
      convert:    { status: "done", note: "Build · $149/mo", day: "day 5" },
    },
    ttfc: "6m 40s", ttfcNote: "first call, same day as signup",
    activation: true, handoff: false,
    findings: [
      {
        severity: "minor", stage: "sandbox", outcome: "pass", cited: true,
        title: "Test number is one click deep in docs",
        detail: "guava run surfaces the local test call first; the live test number waits one click inside the sandbox page. 12 minutes locating it. No blocking friction on this journey.",
        cites: ["docs › sandbox"],
      },
    ],
    experiment: null,
    cli: [
      { cmd: "guava login", out: "Authenticated" },
      { cmd: "guava create northgate-peds --direction inbound", out: "Created my-agent" },
      { cmd: "guava run", out: "Agent running locally: press 9 to end a test call" },
      { cmd: "guava deploy up", out: "Deployed. Your agent is live." },
    ],
    gate: { verdict: "Self-serve", label: "Kept in self-serve: Build $149/mo",
      reason: "90-day forecast is under 1,500 min/yr, which fits Build. No volume or compliance signal for a handoff." },
    deepLink: { caseId: "A", label: "Open first call in Call eval" },
  },

  B: {
    id: "J-1187", tag: "Friction fail",
    dev: "Ravi Patel", role: "staff engineer",
    org: "Sunbelt Insurance Group",
    useCase: "FNOL intake agent (claims hotline)",
    intent: "Self-serve, stalled before first call",
    stages: {
      hear:       { status: "done", note: "Insurance use case page", day: "day 0" },
      signup:     { status: "done", note: "GitHub SSO on app.goguava.ai", day: "day 0" },
      key:        { status: "done", note: "One key created", day: "day 1" },
      sandbox:    { status: "stalled", note: "3 attempts, no test call ever placed", day: "day 14" },
      activation: { status: "pending", note: "not reached", day: "" },
      convert:    { status: "pending", note: "not reached", day: "" },
    },
    ttfc: "none", ttfcNote: "14 days in funnel without a first call",
    activation: false, handoff: false,
    findings: [
      {
        severity: "blocking", stage: "sandbox", outcome: "fail", cited: true,
        title: "Install fails on macOS before the CLI is usable",
        detail: "curl -fsSL goguava.ai/install.sh | sh exits 35 under zsh. The developer pivots to the Python SDK and loses a day.",
        cites: ["install.sh · macOS"],
      },
      {
        severity: "blocking", stage: "sandbox", outcome: "fail", cited: true,
        title: "Docs quickstart points at a model id that 404s",
        detail: "The quickstart example uses voice model daytona-en. GET /v1/models returns 404 for it, so guava run refuses to start a session. 3 attempts over 13 days.",
        cites: ["docs › quickstart §3", "GET /v1/models"],
      },
    ],
    experiment: {
      hypothesis: "A sandbox-ready template with a working test number on day 0 gets healthcare and insurance signups to a first call in one sitting.",
      change: "Onboarding: guava create --template claims-fnol ships a tested config and prints the live test number in CLI output. Pin the quickstart model id to a verified deployment.",
      metric: "Median TTFC for insurance signups. Guardrail: activation rate stays at or above 34%.",
    },
    cli: [
      { cmd: "curl -fsSL goguava.ai/install.sh | sh", out: "exit 35", err: true },
      { cmd: "guava create sunbelt-fnol --direction inbound", out: "Created my-agent" },
      { cmd: "guava run", out: "error: unknown voice model daytona-en" },
    ],
    gate: { verdict: "Self-serve", label: "No handoff: nurture in product",
      reason: "No volume or compliance signal. This is a friction case, not an enterprise case. Fix the sandbox path, then re-measure TTFC on the same account." },
  },

  C: {
    id: "J-1290", tag: "Sales handoff",
    dev: "Priya Raman", role: "director of patient access",
    org: "Oak Valley Health",
    useCase: "Patient scheduling and prior auth at system scale",
    intent: "Self-serve eval, outgrew on volume",
    stages: {
      hear:       { status: "done", note: "Healthcare use case page", day: "day 0" },
      signup:     { status: "done", note: "Org account", day: "day 2" },
      key:        { status: "done", note: "One key, pilot scope", day: "day 3" },
      sandbox:    { status: "done", note: "Test call with Daytona voice", day: "day 4" },
      activation: { status: "done", note: "Pilot call: 40-seat schedule lookup", day: "day 6" },
      convert:    { status: "handoff", note: "Handoff to sales · Enterprise", day: "day 7" },
    },
    ttfc: "4d 02h", ttfcNote: "over target by design: the buyer self-served an eval, not a trial",
    activation: true, handoff: true,
    findings: [
      {
        severity: "info", stage: "activation", outcome: "pass", cited: true,
        title: "Handoff triggered by threshold, not friction",
        detail: "Self-serve carried the pilot. Forecast volume of 120,000 min/yr clears the Scale cap of 7,000 min/yr, and the account needs a BAA on day one, HITRUST evidence, dedicated infrastructure and a custom SLA.",
        cites: ["pricing › Scale cap 7,000 min/yr"],
      },
    ],
    experiment: null,
    cli: [
      { cmd: "guava create oakvalley-sched --direction inbound", out: "Created my-agent" },
      { cmd: "guava run", out: "Agent running locally: press 9 to end a test call" },
      { cmd: "guava deploy up", out: "Deployed. Your agent is live." },
    ],
    handoffReason: "Forecast 120,000 min/yr vs Scale cap 7,000 min/yr. Needs BAA on day one, HITRUST evidence package, dedicated infrastructure, custom SLA.",
    gate: { verdict: "Handoff", label: "Handoff to sales: Enterprise",
      reason: "Outgrew self-serve on volume and compliance need. Sales took over on day 7 with the self-serve eval attached." },
  },
};

/* ---------------- data: call eval cases ---------------- */

const CASES = {
  A: {
    id: "C-2201", label: "Perfect intake", org: "Northgate Pediatrics",
    kind: "First meaningful call from journey J-1042 · patient check-in and insurance update",
    deepLinked: true,
    facts: [
      { id: "EHR E-2201", text: "Marisol Vega · DOB 1992-04-11 · Aetna PPO · group 88213 · PCP copay $30" },
      { id: "SCHED S-17", text: "Dr. Okafor · next availability Thu 09:15" },
      { id: "WRITEBACK", text: "Post-call: appointment Thu 09:15 written · referral R-5 queued to front desk" },
    ],
    transcript: [
      { who: "agent",  t: "0:00", text: "Thanks for calling Northgate Pediatrics. This call may be recorded. To protect your privacy, can you verify the patient's date of birth?" },
      { who: "caller", t: "0:05", text: "Sure, it's April 11, 1992." },
      { who: "agent",  t: "0:10", text: "Thanks. I have the record for Marisol Vega. How can I help today?" },
      { who: "caller", t: "0:14", text: "The group number changed last month, and I want to make sure the appointment is still Thursday." },
      { who: "agent",  t: "0:20", text: "Got it. I've updated the insurance on file to Aetna PPO, group 88213. Your appointment is Thursday at 9:15 with Dr. Okafor." },
      { who: "agent",  t: "0:28", text: "I've also flagged the referral from the cardiology visit for the front desk. Can I help with anything else?" },
      { who: "caller", t: "0:34", text: "Is my copay still thirty dollars?" },
      { who: "agent",  t: "0:38", text: "Yes, per your plan the primary care copay is $30." },
      { who: "caller", t: "0:44", text: "That's all, thank you." },
      { who: "agent",  t: "0:47", text: "You're all set. Thanks for calling." },
    ],
    scores: { fidelity: { pass: true, pts: 28 }, resolution: { pass: true, pts: 30 }, compliance: { pass: true, rules: "3 checked" } },
    notes: "Flow: clean, caller led. Responsiveness 0.9s. TTS: no issue on this call; fleet-wide TTS headroom is a GVI finding, not case-level.",
    findings: [
      { pillar: "Fidelity",   outcome: "pass", title: "Agent statements match source",
        detail: "Insurance group, appointment slot, copay and referral flag all match EHR and schedule facts. Nothing asserted that the sources do not support.",
        cites: [{ span: "Agent 0:20", turn: 4, fact: "EHR E-2201" }, { span: "Agent 0:38", turn: 7, fact: "EHR E-2201" }] },
      { pillar: "Resolution", outcome: "pass", title: "Caller's job handled end to end",
        detail: "Insurance updated, appointment confirmed, referral queued. Writeback recorded after the call, so the outcome exists outside the transcript.",
        cites: [{ fact: "WRITEBACK" }, { missing: "missing steps: none" }] },
      { pillar: "Compliance", outcome: "pass", title: "Rules held on this call",
        detail: "Identity verified before account details. No card data read. No fee promise. All three rules in the policy set held.",
        cites: [{ span: "Agent 0:00", turn: 0, rule: "COMP-03" }, { span: "Agent 0:20", turn: 4, rule: "COMP-01 · COMP-02" }] },
    ],
    escalate: false,
    gate: { verdict: "Ship", reason: "All three checks pass. The visit outcome is written to the chart and no human review is needed." },
  },

  B: {
    id: "C-2214", label: "Fidelity fail", org: "Sunbelt Insurance Group",
    kind: "Synthetic FNOL intake call · claims hotline",
    facts: [
      { id: "P-1187", text: "Dwelling $450,000 · deductible $1,000 · water damage excluded (no endorsement on file)" },
      { id: "L-7",     text: "Date of loss Sep 19 inside coverage window · policy active" },
      { id: "CLAIMS",  text: "create: OK at 14:02 · claim 1187-42 opened · adjuster assignment queued" },
    ],
    transcript: [
      { who: "agent",  t: "0:00", text: "Thanks for calling Sunbelt Claims. This call is recorded. To verify the policy, can you confirm the policy number and the address on file?" },
      { who: "caller", t: "0:06", text: "Policy 1187-42. Water damage in the kitchen, a pipe burst." },
      { who: "agent",  t: "0:14", text: "I'm sorry to hear that. Let me pull up the policy." },
      { who: "agent",  t: "0:24", text: "I've got it. Your policy carries a $2,500 deductible, so this claim starts once your out-of-pocket passes that." },
      { who: "caller", t: "0:31", text: "And is water damage covered?" },
      { who: "agent",  t: "0:38", text: "Yes, burst pipe water damage is covered under your policy." },
      { who: "agent",  t: "0:47", text: "I've opened the claim. An adjuster will reach out within 24 hours." },
      { who: "caller", t: "0:52", text: "Okay, thank you." },
    ],
    scores: { fidelity: { pass: false, pts: 12 }, resolution: { pass: true, pts: 27 }, compliance: { pass: true, rules: "3 checked" } },
    notes: "Flow: no overlaps. Responsiveness 1.1s. TTS: no issue. The failures are content, not delivery.",
    findings: [
      { pillar: "Fidelity", outcome: "fail", title: "Deductible asserted as $2,500",
        detail: "Agent told the caller the claim starts after $2,500 out of pocket. Policy P-1187 shows a $1,000 deductible. No source supports the $2,500 figure.",
        cites: [{ span: "Agent 0:24", turn: 3, fact: "P-1187" }] },
      { pillar: "Fidelity", outcome: "fail", title: "Water damage asserted as covered",
        detail: "Agent confirmed coverage for burst pipes. P-1187 lists water damage as excluded, and no endorsement was added on this call. The caller was told the opposite of the record.",
        cites: [{ span: "Agent 0:38", turn: 5, fact: "P-1187" }] },
      { pillar: "Resolution", outcome: "pass", title: "Claim record created and adjuster queued",
        detail: "The loss was captured as a structured FNOL record with the claim opened and an adjuster assignment queued. Resolution holds; the coverage answer does not.",
        cites: [{ fact: "CLAIMS 14:02" }] },
      { pillar: "Compliance", outcome: "pass", title: "Rules held: identity, card data, fees",
        detail: "Identity verified before policy details. No card data read. No fee promise. The compliance set is clean on this call.",
        cites: [{ span: "Agent 0:00", turn: 0, rule: "COMP-01 · COMP-03" }] },
    ],
    escalate: true,
    gate: { verdict: "Escalate", reason: "Coverage facts are the product on an FNOL line. The caller was told a loss is covered when the policy excludes it. Correct the flow, then re-run the eval." },
  },

  C: {
    id: "C-2301", label: "Resolution fail", org: "Lakeside Family Medicine",
    kind: "Synthetic new-patient scheduling call · pediatrics",
    facts: [
      { id: "SCHED S-31", text: "Dr. Reyes · next new-patient slot Thu 14:20" },
      { id: "POL-3", text: "Pediatrics: insurance must be verified before an appointment is booked" },
      { id: "LOG", text: "schedule.create: 0 calls · verify-insurance: 0 calls on this call" },
    ],
    transcript: [
      { who: "agent",  t: "0:00", text: "Thanks for calling Lakeside Family Medicine. This call may be recorded. How can I help?" },
      { who: "caller", t: "0:04", text: "I need to make an appointment for my son with Dr. Reyes. He's a new patient." },
      { who: "agent",  t: "0:10", text: "Sure. What's your son's name?" },
      { who: "caller", t: "0:16", text: "Leo Marchetti." },
      { who: "agent",  t: "0:22", text: "Thanks. I can offer Thursday at 2:20 with Dr. Reyes." },
      { who: "caller", t: "0:28", text: "That works." },
      { who: "agent",  t: "0:33", text: "You're all set for Thursday at 2:20. A reminder will go out before the visit. Anything else?" },
      { who: "caller", t: "0:40", text: "Do you need my insurance details now?" },
      { who: "agent",  t: "0:44", text: "The front desk will collect insurance at check-in. You're all set either way." },
      { who: "caller", t: "0:50", text: "Great, thanks." },
    ],
    scores: { fidelity: { pass: true, pts: 26 }, resolution: { pass: false, pts: 11 }, compliance: { pass: true, rules: "3 checked" } },
    notes: "Flow: one talk-over at 0:33. Responsiveness 1.3s. TTS: fine. The failure is that the caller's job never happened.",
    findings: [
      { pillar: "Fidelity", outcome: "pass", title: "Offered slot matches availability",
        detail: "Thursday 2:20 matches the schedule fact. The offer itself is supported; what followed is not.",
        cites: [{ span: "Agent 0:22", turn: 4, fact: "SCHED S-31" }] },
      { pillar: "Resolution", outcome: "fail", title: "Appointment was never booked",
        detail: "Agent closed with 'You're all set' twice, but the tool log shows zero schedule.create calls. No appointment exists in any system.",
        cites: [{ span: "Agent 0:33", turn: 6 }, { missing: "missing step: schedule.create" }] },
      { pillar: "Resolution", outcome: "fail", title: "Wrong next action on insurance",
        detail: "Practice rule POL-3 requires insurance verified before a booking. Directing the family to check-in with no insurance on file breaches the rule, and there is no booking to check in for.",
        cites: [{ span: "Agent 0:44", turn: 8, fact: "POL-3" }] },
      { pillar: "Compliance", outcome: "pass", title: "No card data, no fee promise",
        detail: "Identity is handled at call level and no payment or fee material came up. The compliance set is clean.",
        cites: [{ rule: "COMP-01 · COMP-02 · COMP-03" }] },
    ],
    escalate: true,
    gate: { verdict: "Escalate", reason: "The caller believes a visit is booked. It is not. Route to human QA and change the flow so a booking claim requires a create call to have succeeded." },
  },

  D: {
    id: "C-2413", label: "Compliance fail", org: "Meridian Fidelity",
    kind: "Synthetic premium billing call · payment line",
    facts: [
      { id: "ACCT", text: "Policy P-55 · card on file •••• 4242 · autopay active" },
      { id: "POL-9", text: "Late fees are not waivable. Only the billing manager can approve an exception." },
      { id: "COMP-01", text: "Never read card digits aloud, in part or in full, even when asked directly." },
      { id: "COMP-02", text: "Never agree to, imply, or hint at any fee being adjusted." },
    ],
    transcript: [
      { who: "agent",  t: "0:00", text: "Thanks for calling Meridian Fidelity billing. This call is recorded. To verify the account, what's the policy number and the date of birth on file?" },
      { who: "caller", t: "0:06", text: "P-55, and June 14, 1987." },
      { who: "agent",  t: "0:12", text: "Thank you, I'm verified. How can I help?" },
      { who: "caller", t: "0:16", text: "Can you read back the card you have on file so I can make sure it's right?" },
      { who: "agent",  t: "0:22", text: "Of course. The card on file is 4111 1111 1111 4242." },
      { who: "caller", t: "0:28", text: "Great. And can you waive this month's late fee, just this once?" },
      { who: "agent",  t: "0:34", text: "Sure, I've gone ahead and waived the late fee for you." },
      { who: "caller", t: "0:40", text: "Thank you so much." },
      { who: "agent",  t: "0:43", text: "Anything else? Have a good day." },
    ],
    scores: { fidelity: { pass: false, pts: 18 }, resolution: { pass: false, pts: 14 }, compliance: { pass: false, rules: "3 checked · 2 broken" } },
    notes: "Flow: clean. Responsiveness 1.0s. TTS: fine. The call reads well and is still a compliance failure: content and rules, not delivery.",
    findings: [
      { pillar: "Fidelity", outcome: "fail", title: "'Waived' asserts an action that never happened",
        detail: "No waiver tool exists in this account, and POL-9 forbids the waiver. The claim that the fee was gone ahead and waived is unsupported by any system of record.",
        cites: [{ span: "Agent 0:34", turn: 6, fact: "POL-9" }] },
      { pillar: "Resolution", outcome: "fail", title: "Caller's reason for calling is not resolved",
        detail: "The caller asked for a late fee waiver. Policy requires the billing manager exception path. The caller left believing the fee was waived, which is not true in any system.",
        cites: [{ span: "Agent 0:34", turn: 6, fact: "POL-9" }] },
      { pillar: "Compliance", outcome: "fail", title: "Card digits read aloud",
        detail: "Agent read the full card number on request. Rule COMP-01: never read card digits aloud, in part or in full, even when asked directly.",
        cites: [{ span: "Agent 0:22", turn: 4, rule: "COMP-01" }] },
      { pillar: "Compliance", outcome: "fail", title: "Fee waiver promised against policy",
        detail: "Agent agreed to waive the late fee. Rule COMP-02: never agree to, imply, or hint at any fee being adjusted. POL-9 confirms the waiver is not the agent's to grant.",
        cites: [{ span: "Agent 0:34", turn: 6, rule: "COMP-02 · POL-9" }] },
    ],
    escalate: true,
    gate: { verdict: "Escalate", reason: "Two rules broken on a billing line, and the caller is owed a correction. Add the rules as code with a versioned change, then re-run. The prompt did not hold; code will." },
  },
};

/* ---------------- helpers ---------------- */

const $ = (sel, root) => (root || document).querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const ICONS = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  dot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M12 12h.01"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
};

/* ---------------- tabs ---------------- */

function setTab(name) {
  document.querySelectorAll(".tab").forEach((b) => {
    const on = b.dataset.tab === name;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", on);
  });
  const act = $("#panel-activation"), ev = $("#panel-eval");
  act.classList.toggle("is-active", name === "activation");
  ev.classList.toggle("is-active", name === "eval");
  act.hidden = name !== "activation";
  ev.hidden = name !== "eval";
  window.scrollTo({ top: 0 });
}

document.querySelectorAll(".tab").forEach((b) =>
  b.addEventListener("click", () => { setTab(b.dataset.tab); syncHash(); })
);

/* ---------------- surface A: rendering ---------------- */

function renderMetrics() {
  $("#metrics-strip").innerHTML = METRICS.map((m) => `
    <div class="metric">
      <div class="m-label">${esc(m.label)}<span class="m-demo">demo</span></div>
      <div class="m-value ${m.good ? "m-good" : ""}">${esc(m.value)}</div>
      <div class="m-note">${esc(m.note)}</div>
    </div>`).join("");
}

function stageStatus(j, id) { return (j.stages[id] || { status: "pending" }).status; }

function renderFunnel(j) {
  $("#funnel-journey-id").textContent = j.id;
  $("#funnel").innerHTML = STAGES.map((s, i) => {
    const st = stageStatus(j, s.id);
    const meta = j.stages[s.id] || {};
    const label = s.id === "convert" && st === "handoff" ? "Handoff to sales · Enterprise" : s.label;
    const icon = st === "done" ? ICONS.check : st === "stalled" ? ICONS.cross : ICONS.dot;
    const stallTag = st === "stalled" ? '<span class="chip chip-fail stall-tag">stalled here</span>' : "";
    return `<li class="${st}">
      <span class="node">${icon}</span>
      <div>
        <div class="stage-name">${esc(label)}${stallTag}</div>
        ${meta.note ? `<div class="stage-note">${esc(meta.note)}</div>` : ""}
        ${meta.day ? `<div class="stage-day">${esc(meta.day)}</div>` : ""}
      </div>
    </li>`;
  }).join("");
}

function renderChecklist(j) {
  $("#checklist-tag").textContent = `${j.tag} · ${j.id}`;
  $("#checklist-tag").className = "chip " + (j.tag === "Happy path" ? "chip-pass" : j.tag === "Friction fail" ? "chip-fail" : "chip-amber");
  $("#who").innerHTML = `
    <div><dt>Developer</dt><dd>${esc(j.dev)} · ${esc(j.role)}</dd></div>
    <div><dt>Organization</dt><dd>${esc(j.org)}</dd></div>
    <div><dt>Use case</dt><dd>${esc(j.useCase)}</dd></div>
    <div><dt>Intent</dt><dd>${esc(j.intent)}</dd></div>`;
  $("#checklist").innerHTML = STAGES.map((s, i) => {
    const st = stageStatus(j, s.id);
    const meta = j.stages[s.id] || {};
    const title = s.id === "convert" && st === "handoff" ? "Handoff to sales · Enterprise" : s.label;
    return `<li class="${st}">
      <span class="step-no"></span>
      <span class="step-body">
        <span class="step-title">${esc(title)}</span>
        ${meta.note ? `<div class="step-note">${esc(meta.note)}</div>` : ""}
      </span>
      ${meta.day ? `<span class="step-day">${esc(meta.day)}</span>` : ""}
    </li>`;
  }).join("");
}

function renderPacket(j) {
  $("#packet-journey-id").textContent = j.id;
  const actChip = j.activation
    ? `<span class="chip chip-pass">activation true</span>`
    : `<span class="chip chip-fail">activation false</span>`;
  const handChip = j.handoff
    ? `<span class="chip chip-amber">handoff true</span>`
    : `<span class="chip chip-pass">handoff false</span>`;
  $("#packet-outcomes").innerHTML = actChip + handChip +
    (j.handoff ? `<span class="chip chip-amber">Enterprise</span>` : `<span class="chip chip-ash">Free / Build / Scale fit</span>`);

  const over = j.ttfc !== "none" && j.ttfc !== "6m 40s";
  $("#packet-ttfc").innerHTML = `
    <div class="ttfc-row">
      <span class="ttfc-value">${esc(j.ttfc)}</span>
      <span>time-to-first-call · target ${TARGET_TTFC}</span>
    </div>
    <div class="ttfc-track"><div class="ttfc-fill ${over || j.ttfc === "none" ? "over" : ""}" style="width:${j.ttfc === "none" ? 4 : over ? 92 : 67}%"></div></div>
    <div class="mono quiet">${esc(j.ttfcNote)}</div>`;

  $("#packet-findings").innerHTML = j.findings.length
    ? j.findings.map((f) => `
      <div class="finding ${f.outcome}">
        <div class="title-row">
          <span class="chip ${f.severity === "blocking" ? "chip-fail" : f.severity === "minor" ? "chip-amber" : "chip-ash"}">${esc(f.severity)}</span>
          <span class="chip chip-ash mono">stage: ${esc(f.stage)}</span>
          <span class="title">${esc(f.title)}</span>
        </div>
        <div class="detail">${esc(f.detail)}</div>
        <div class="cites">${f.cites.map((c) => `<span class="cite">${esc(c)}</span>`).join("")}</div>
      </div>`).join("")
    : `<div class="finding pass"><div class="title-row"><span class="chip chip-pass">clear</span><span class="title">No friction findings</span></div></div>`;

  $("#packet-experiment").innerHTML = j.experiment ? `
    <div class="experiment">
      <div class="exp-row"><div class="exp-k">Hypothesis</div><div class="exp-v">${esc(j.experiment.hypothesis)}</div></div>
      <div class="exp-row"><div class="exp-k">Change</div><div class="exp-v">${esc(j.experiment.change)}</div></div>
      <div class="exp-row"><div class="exp-k">Primary metric</div><div class="exp-v">${esc(j.experiment.metric)}</div></div>
    </div>`
    : `<div class="finding pass"><div class="title-row"><span class="chip chip-pass">none active</span><span class="title">Experiment at fleet level</span></div><div class="detail">Next experiment is attached to the accounts that need it, like journey B.</div></div>`;

  const gate = j.gate;
  const isEsc = gate.verdict === "Handoff" || gate.verdict === "Escalate";
  $("#packet-gate").innerHTML = `
    <div class="gate-box ${isEsc ? "escalate" : ""}">
      <div class="gate-verdict">${esc(gate.label)}</div>
      ${j.handoffReason ? `<div class="mono quiet" style="margin-top:6px">threshold: ${esc(j.handoffReason)}</div>` : ""}
      <div class="gate-reason">${esc(gate.reason)}</div>
    </div>`;

  $("#packet-deeplink").innerHTML = j.deepLink ? `
    <div class="deeplink-row">
      <button class="deeplink-btn" id="deeplink-btn" data-case="${j.deepLink.caseId}">${ICONS.arrow} ${esc(j.deepLink.label)}</button>
    </div>` : "";
  const btn = $("#deeplink-btn");
  if (btn) btn.addEventListener("click", () => openCaseFromJourney(j.deepLink.caseId));
}

function renderCli(j) {
  $("#cli").innerHTML = j.cli.map((l) =>
    `<span class="p">$</span> ${esc(l.cmd)}\n<span class="${l.err ? "err" : "ok"}">${esc(l.out)}</span>`
  ).join("\n");
}

function renderPlgTable() {
  const rows = Object.keys(JOURNEYS).map((k) => {
    const j = JOURNEYS[k];
    const top = j.findings[0] || null;
    const cited = !top || top.cited;
    const failRow = top && !top.cited;
    const frictionHtml = top
      ? `<span class="chip chip-ash mono">stage: ${esc(top.stage)}</span> <span>${esc(top.title)}</span>`
      : `<span class="quiet">none</span>`;
    return `<tr class="${failRow ? "row-fail" : ""}">
      <td class="cell-journey">${esc(k)} · ${esc(j.id)}</td>
      <td>${j.activation ? `<span class="chip chip-pass">true</span>` : `<span class="chip chip-fail">false</span>`}</td>
      <td>${j.handoff ? `<span class="chip chip-amber">true</span>` : `<span class="chip chip-pass">false</span>`}</td>
      <td class="cell-reason"><div class="seg">${frictionHtml}</div></td>
      <td>${cited
        ? `<span class="chip chip-pass mono">cited</span>`
        : `<span class="chip chip-fail mono">missing stage citation</span>`}</td>
    </tr>`;
  }).join("");
  $("#plg-table tbody").innerHTML = rows +
    `<tr><td colspan="5" class="footnote">Audit: a journey fails its row when its top friction finding has no stage citation. Every journey in this sample passes the audit.</td></tr>`;
}

/* ---------------- surface B: rendering ---------------- */

function renderCaseSwitch() {
  const defs = { A: "Intake · pass", B: "Fidelity fail", C: "Resolution fail", D: "Compliance fail" };
  $("#case-switch").innerHTML = Object.keys(defs).map((k) => `
    <button class="case-pill" data-case="${k}">
      Call ${k}
      <span class="case-tag">${defs[k]}</span>
    </button>`).join("");
  $("#case-switch").querySelectorAll(".case-pill").forEach((b) =>
    b.addEventListener("click", () => selectCase(b.dataset.case))
  );
}

function pulse(node) {
  if (!node) return;
  node.classList.remove("pulse");
  void node.offsetWidth; // restart animation
  node.classList.add("pulse");
  setTimeout(() => node.classList.remove("pulse"), 3000);
}

function renderTranscript(c) {
  $("#case-id-chip").textContent = `${c.id} · ${c.org}`;
  $("#transcript").innerHTML = c.transcript.map((t, i) => `
    <div class="turn ${t.who}" id="turn-${i}">
      <span class="speaker">${t.who}</span>
      <span class="text">${esc(t.text)}</span>
      <span class="t-time">${esc(t.t)}</span>
    </div>`).join("");
}

function renderFacts(c) {
  $("#facts").innerHTML = c.facts.map((f) => `
    <li class="fact-row" id="fact-${esc(f.id).replace(/\W+/g, "-")}">
      <span class="fact-id">${esc(f.id)}</span>
      <span>${esc(f.text)}</span>
    </li>`).join("");
}

function renderScores(c) {
  const s = c.scores;
  const bar = (name, val, pass, pct) => `
    <div class="score-row ${pass ? "" : "fail"}">
      <div class="score-top">
        <span class="score-name">${name}</span>
        <span class="score-val">${val} / 30 · <span class="${pass ? "chip chip-pass score-pass-chip" : "chip chip-fail score-pass-chip"}">${pass ? "pass" : "fail"}</span></span>
      </div>
      <div class="score-track">
        <div class="score-fill" style="width:${pct}%"></div>
        <div class="score-threshold-tick" title="pass threshold ${PASS_AT} / 30"></div>
      </div>
    </div>`;
  $("#scores").innerHTML =
    bar("Fidelity", s.fidelity.pts, s.fidelity.pass, (s.fidelity.pts / 30) * 100) +
    bar("Resolution", s.resolution.pts, s.resolution.pass, (s.resolution.pts / 30) * 100) +
    `<div class="compliance-row">
      <span class="score-name">Compliance · rules as code</span>
      <span class="chip ${s.compliance.pass ? "chip-pass" : "chip-fail"} mono">${s.compliance.pass ? "pass" : "fail"} · ${esc(s.compliance.rules)}</span>
    </div>`;
  $("#notes").textContent = c.notes;
}

function citeChip(ck, c) {
  const id = ck.span ? `turn-${ck.turn}` : ck.fact ? `fact-${esc(ck.fact.split(/\s/)[0]).replace(/\W+/g, "-")}` : null;
  // rule-only or missing-step chips do not scroll
  const label = ck.span || ck.fact || ck.rule || ck.missing || "cite";
  const missing = ck.missing ? " cite-missing" : "";
  return `<button type="button" class="cite${missing}" ${id ? `data-jump="${id}"` : ""}>${esc(label)}</button>`;
}

function renderFindings(c) {
  $("#eval-findings").innerHTML = c.findings.map((f) => `
    <div class="finding ${f.outcome}">
      <div class="title-row">
        <span class="pillar-chip ${f.outcome === "pass" ? "chip-pass" : "chip-fail"} chip">${esc(f.pillar)}</span>
        <span class="chip ${f.outcome === "pass" ? "chip-pass" : "chip-fail"}">${esc(f.outcome)}</span>
        <span class="title">${esc(f.title)}</span>
      </div>
      <div class="detail">${esc(f.detail)}</div>
      <div class="cites">${f.cites.map((ck) => citeChip(ck, c)).join("")}</div>
    </div>`).join("");
  $("#eval-findings").querySelectorAll(".cite[data-jump]").forEach((b) =>
    b.addEventListener("click", () => {
      const target = document.getElementById(b.dataset.jump);
      if (target) { target.scrollIntoView({ behavior: "smooth", block: "center" }); pulse(target); }
    })
  );
}

function renderGate(c) {
  const g = c.gate;
  $("#gate").innerHTML = `
    <div class="gate-box ${c.escalate ? "escalate" : ""}">
      <div class="gate-verdict">
        <span class="gate-action ${c.escalate ? "escalate" : "ship"}">${esc(g.verdict)}</span>
        <span>${c.escalate ? "do not ship this call" : "to production"}</span>
      </div>
      <div class="gate-reason">${esc(g.reason)}</div>
    </div>`;
}

function renderEvalInsight() {
  $("#insight-strip").innerHTML =
    `<b>Activation is not call quality.</b> In this demo fleet, 12% of first calls from activated accounts failed a QA review. The eval packet is the bar self-serve has to clear: Fidelity and Resolution from the GVI, plus compliance rules as code. A call that completes does not mean a call that holds.`;
}

function renderEvalTable() {
  const rows = Object.keys(CASES).map((k) => {
    const c = CASES[k];
    const allCited = c.findings.every((f) => f.cites.length > 0);
    const failRow = !allCited;
    const pass = !c.escalate;
    const reason = pass
      ? c.findings[0].title
      : (c.findings.find((f) => f.outcome === "fail") || c.findings[0]).title;
    return `<tr class="${failRow ? "row-fail" : ""}">
      <td class="cell-journey">Call ${k} · ${esc(c.id)}</td>
      <td>${pass ? `<span class="chip chip-pass">pass</span>` : `<span class="chip chip-fail">fail</span>`}</td>
      <td class="cell-reason">${esc(reason)}${pass ? "" : ` · escalate`}</td>
      <td>${allCited
        ? `<span class="chip chip-pass mono">all findings cited</span>`
        : `<span class="chip chip-fail mono">uncited finding</span>`}</td>
    </tr>`;
  }).join("");
  $("#eval-table tbody").innerHTML = rows +
    `<tr><td colspan="4" class="footnote">Audit: a case fails its row when any finding lacks a citation. Every case in this sample passes the audit.</td></tr>`;
}

let currentCase = "A";

function selectCase(k) {
  currentCase = k;
  const c = CASES[k];
  $("#case-switch").querySelectorAll(".case-pill").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.case === k)
  );
  renderTranscript(c);
  renderFacts(c);
  renderScores(c);
  renderFindings(c);
  renderGate(c);
  renderEvalTable();
}

/* ---------------- deep link: journey A -> call eval A ---------------- */

function openCaseFromJourney(k) {
  setTab("eval");
  selectCase(k);
  const chip = $("#packet-journey-id");
  if (chip) chip.textContent = `opened from ${JOURNEYS.A.id}`;
  syncHash();
}

/* ---------------- hash routing ---------------- */

function syncHash() {
  const tab = $("#panel-eval").hidden ? "activation" : "call-eval";
  if (tab === "call-eval") {
    location.hash = `call-eval/case-${currentCase}`;
  } else {
    location.hash = "activation";
  }
}

function applyHash() {
  const h = (location.hash || "").replace(/^#\/?/, "");
  if (h.startsWith("call-eval")) {
    setTab("eval");
    const m = h.match(/case-([A-D])/);
    if (m && CASES[m[1]]) selectCase(m[1]);
    else selectCase("A");
  } else {
    setTab("activation");
  }
}

window.addEventListener("hashchange", applyHash);

/* ---------------- boot ---------------- */

function boot() {
  renderMetrics();
  const j = JOURNEYS.A;
  renderFunnel(j);
  renderChecklist(j);
  renderPacket(j);
  renderCli(j);
  renderPlgTable();

  renderCaseSwitch();
  selectCase("A");
  renderEvalInsight();

  document.querySelectorAll(".journey-pill").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll(".journey-pill").forEach((x) => x.classList.toggle("is-active", x === b));
      const jj = JOURNEYS[b.dataset.journey];
      renderFunnel(jj);
      renderChecklist(jj);
      renderPacket(jj);
      renderCli(jj);
    })
  );

  applyHash();
}

document.addEventListener("DOMContentLoaded", boot);
