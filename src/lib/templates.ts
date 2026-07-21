import type { Shape } from "./db/schema";

/**
 * Project templates for the "Add project" wizard — grouped by shape.
 * - linear   → prefills ordered stages (offsetDays = target-date offset from today).
 * - pipeline → sets shape; shows the flow + outcome breakdown as a preview (real counts
 *              come from the project's portal via reflect-up, so no fake local data).
 * - metric   → sets shape; tracks a value vs a goal (value comes from the portal).
 */

export type TemplateStage = { name: string; offsetDays: number };

export type ProjectTemplate = {
  key: string;
  name: string;
  description: string;
  shape: Shape;
  group: string;
  edtech?: boolean;
  stages?: TemplateStage[]; // linear
  flow?: string[]; // pipeline: the stages items move through (preview only)
  outcomes?: string[]; // pipeline: terminal breakdown segments (preview only)
  metric?: { label: string; unit: string }; // metric
};

export const TEMPLATE_GROUPS = ["Start blank", "Staged projects", "Pipelines & trackers", "Metrics & KPIs"] as const;

export const TEMPLATES: ProjectTemplate[] = [
  /* ————— Start blank (one per shape) ————— */
  {
    key: "blank",
    name: "Blank staged project",
    description: "A minimal three-stage scaffold. Rename, reorder, or delete anything.",
    shape: "linear",
    group: "Start blank",
    stages: [
      { name: "Plan", offsetDays: 14 },
      { name: "Build", offsetDays: 35 },
      { name: "Ship", offsetDays: 50 },
    ],
  },
  {
    key: "blank-pipeline",
    name: "Blank pipeline / tracker",
    description: "Many items flowing to outcomes. Status is a breakdown reported by its portal.",
    shape: "pipeline",
    group: "Start blank",
    flow: ["Stage 1", "Stage 2", "Stage 3"],
    outcomes: ["Done", "Rejected", "In progress"],
  },
  {
    key: "blank-metric",
    name: "Blank metric / KPI",
    description: "Track a single number against a goal, reported by its portal.",
    shape: "metric",
    group: "Start blank",
    metric: { label: "Value", unit: "" },
  },

  /* ————— Staged projects (linear) ————— */
  {
    key: "product-feature-launch",
    name: "Product / Feature launch",
    description: "Kickoff through launch and post-launch review.",
    shape: "linear",
    group: "Staged projects",
    stages: [
      { name: "Discovery & scope", offsetDays: 10 },
      { name: "Build & integration", offsetDays: 35 },
      { name: "Beta / QA", offsetDays: 49 },
      { name: "Go-to-market prep", offsetDays: 56 },
      { name: "Launch", offsetDays: 63 },
      { name: "Post-launch review", offsetDays: 77 },
    ],
  },
  {
    key: "curriculum-module",
    name: "Curriculum module (ADDIE)",
    description: "Author, review, and publish a learning module end to end.",
    shape: "linear",
    group: "Staged projects",
    edtech: true,
    stages: [
      { name: "Analysis / needs", offsetDays: 10 },
      { name: "Design / blueprint", offsetDays: 24 },
      { name: "Development / build", offsetDays: 52 },
      { name: "Pilot", offsetDays: 66 },
      { name: "Evaluation & revision", offsetDays: 80 },
    ],
  },
  {
    key: "cohort-launch",
    name: "New cohort / batch launch",
    description: "Stand up a new course cohort from readiness to kickoff.",
    shape: "linear",
    group: "Staged projects",
    edtech: true,
    stages: [
      { name: "Curriculum & schedule ready", offsetDays: 14 },
      { name: "Instructor staffing & training", offsetDays: 28 },
      { name: "Enrollment & marketing", offsetDays: 45 },
      { name: "Learner onboarding", offsetDays: 55 },
      { name: "Cohort kickoff", offsetDays: 60 },
    ],
  },
  {
    key: "marketing-campaign",
    name: "Marketing campaign",
    description: "Plan, produce, launch and measure a multi-channel campaign.",
    shape: "linear",
    group: "Staged projects",
    edtech: true,
    stages: [
      { name: "Strategy & brief", offsetDays: 7 },
      { name: "Creative production", offsetDays: 21 },
      { name: "QA & tracking setup", offsetDays: 28 },
      { name: "Launch", offsetDays: 35 },
      { name: "Optimize", offsetDays: 49 },
      { name: "Report & retro", offsetDays: 56 },
    ],
  },
  {
    key: "content-production",
    name: "Content production",
    description: "Move a content asset from idea to published.",
    shape: "linear",
    group: "Staged projects",
    edtech: true,
    stages: [
      { name: "Ideation & brief", offsetDays: 3 },
      { name: "Draft", offsetDays: 10 },
      { name: "Edit", offsetDays: 14 },
      { name: "Design", offsetDays: 18 },
      { name: "Approval", offsetDays: 21 },
      { name: "Publish & distribute", offsetDays: 24 },
    ],
  },
  {
    key: "hiring-a-role",
    name: "Hire a role",
    description: "Fill a single open role from JD to onboarding.",
    shape: "linear",
    group: "Staged projects",
    edtech: true,
    stages: [
      { name: "JD & approval", offsetDays: 3 },
      { name: "Sourcing", offsetDays: 14 },
      { name: "Screening", offsetDays: 24 },
      { name: "Interviews", offsetDays: 38 },
      { name: "Offer & negotiation", offsetDays: 45 },
      { name: "Onboarding", offsetDays: 60 },
    ],
  },
  {
    key: "client-onboarding",
    name: "Client / partner onboarding",
    description: "Onboard a new client or school partner to first value.",
    shape: "linear",
    group: "Staged projects",
    edtech: true,
    stages: [
      { name: "Kickoff & alignment", offsetDays: 3 },
      { name: "Data & access setup", offsetDays: 10 },
      { name: "Implementation", offsetDays: 21 },
      { name: "Training & validation", offsetDays: 28 },
      { name: "Go-live & handoff", offsetDays: 35 },
    ],
  },
  {
    key: "event-planning",
    name: "Event planning",
    description: "Run an event end to end (webinar, conference, community event).",
    shape: "linear",
    group: "Staged projects",
    edtech: true,
    stages: [
      { name: "Concept & budget", offsetDays: 7 },
      { name: "Venue & vendors", offsetDays: 30 },
      { name: "Promotion & registration", offsetDays: 60 },
      { name: "Final prep & run-of-show", offsetDays: 85 },
      { name: "Event day", offsetDays: 90 },
      { name: "Post-event wrap-up", offsetDays: 100 },
    ],
  },
  {
    key: "partnership-deal",
    name: "Partnership / deal",
    description: "Progress a BD partnership from outreach to activation.",
    shape: "linear",
    group: "Staged projects",
    edtech: true,
    stages: [
      { name: "Prospecting & outreach", offsetDays: 7 },
      { name: "Qualification & fit", offsetDays: 21 },
      { name: "Proposal & terms", offsetDays: 35 },
      { name: "Negotiation", offsetDays: 49 },
      { name: "Contract signed", offsetDays: 60 },
      { name: "Kickoff / activation", offsetDays: 75 },
    ],
  },
  {
    key: "website-revamp",
    name: "Website revamp",
    description: "Redesign a site from discovery to launch.",
    shape: "linear",
    group: "Staged projects",
    stages: [
      { name: "Discovery", offsetDays: 14 },
      { name: "IA & wireframes", offsetDays: 28 },
      { name: "Visual design", offsetDays: 49 },
      { name: "Development", offsetDays: 91 },
      { name: "QA & testing", offsetDays: 105 },
      { name: "Launch", offsetDays: 112 },
    ],
  },
  {
    key: "research-study",
    name: "Research study",
    description: "Run a user/market study from question to recommendations.",
    shape: "linear",
    group: "Staged projects",
    stages: [
      { name: "Define questions & plan", offsetDays: 7 },
      { name: "Recruit participants", offsetDays: 17 },
      { name: "Fieldwork", offsetDays: 31 },
      { name: "Analysis", offsetDays: 42 },
      { name: "Report & recommendations", offsetDays: 49 },
    ],
  },
  {
    key: "software-migration",
    name: "Software / data migration",
    description: "Migrate a system or dataset with a controlled cutover.",
    shape: "linear",
    group: "Staged projects",
    stages: [
      { name: "Assessment & planning", offsetDays: 14 },
      { name: "Design & mapping", offsetDays: 28 },
      { name: "Build & migrate", offsetDays: 56 },
      { name: "Testing & reconciliation", offsetDays: 70 },
      { name: "Cutover & go-live", offsetDays: 80 },
      { name: "Hypercare", offsetDays: 90 },
    ],
  },
  {
    key: "compliance-audit",
    name: "Compliance / audit",
    description: "Run a compliance or audit cycle to sign-off.",
    shape: "linear",
    group: "Staged projects",
    stages: [
      { name: "Scope & planning", offsetDays: 7 },
      { name: "Evidence collection", offsetDays: 28 },
      { name: "Fieldwork / testing", offsetDays: 45 },
      { name: "Findings & remediation", offsetDays: 65 },
      { name: "Report & sign-off", offsetDays: 80 },
    ],
  },
  {
    key: "fundraising-round",
    name: "Fundraising round",
    description: "Run a financing round from prep to close.",
    shape: "linear",
    group: "Staged projects",
    stages: [
      { name: "Prep & materials", offsetDays: 14 },
      { name: "Outreach / pipeline", offsetDays: 35 },
      { name: "Meetings & diligence", offsetDays: 63 },
      { name: "Term sheet & negotiation", offsetDays: 84 },
      { name: "Close", offsetDays: 105 },
    ],
  },

  /* ————— Pipelines & trackers ————— */
  {
    key: "tutor-recruitment",
    name: "Tutor / teacher recruitment",
    description: "Recruit and certify teachers, application through active roster.",
    shape: "pipeline",
    group: "Pipelines & trackers",
    edtech: true,
    flow: ["Applied", "Screening", "Subject test", "Demo class", "Certification", "Onboarded"],
    outcomes: ["Certified", "Rejected", "Dropped", "In progress"],
  },
  {
    key: "admissions-enrollment",
    name: "Admissions / enrollment funnel",
    description: "Move prospective students from inquiry to enrolled.",
    shape: "pipeline",
    group: "Pipelines & trackers",
    edtech: true,
    flow: ["Inquiry", "Applicant", "Admitted", "Deposit", "Enrolled"],
    outcomes: ["Enrolled", "Admitted (no deposit)", "Rejected", "In progress"],
  },
  {
    key: "student-trial-conversion",
    name: "Trial → paid conversion",
    description: "Track leads through a demo/trial class to paid enrollment.",
    shape: "pipeline",
    group: "Pipelines & trackers",
    edtech: true,
    flow: ["Lead", "Demo booked", "Demo attended", "Follow-up", "Enrolled"],
    outcomes: ["Enrolled", "Lost / no-show", "In progress"],
  },
  {
    key: "content-review",
    name: "Content / curriculum review",
    description: "Editorial workflow for content assets from draft to published.",
    shape: "pipeline",
    group: "Pipelines & trackers",
    edtech: true,
    flow: ["Draft", "Review", "Copyedit", "QA", "Approval", "Published"],
    outcomes: ["Published", "Archived", "In revision", "In progress"],
  },
  {
    key: "recruitment-hiring",
    name: "Recruitment / hiring pipeline",
    description: "Candidates flowing from application to hire across open roles.",
    shape: "pipeline",
    group: "Pipelines & trackers",
    flow: ["Applied", "Screening", "Interview", "Assessment", "Offer", "Hired"],
    outcomes: ["Hired", "Rejected", "Withdrawn", "In progress"],
  },
  {
    key: "employee-onboarding",
    name: "Employee onboarding tracker",
    description: "New hires from signed offer to fully productive.",
    shape: "pipeline",
    group: "Pipelines & trackers",
    edtech: true,
    flow: ["Offer accepted", "Pre-boarding", "Background check", "Paperwork", "Day one", "Onboarded"],
    outcomes: ["Onboarded", "Withdrew", "Failed check", "In progress"],
  },
  {
    key: "sales-deals",
    name: "Sales / deals pipeline",
    description: "Deal flow from lead to closed.",
    shape: "pipeline",
    group: "Pipelines & trackers",
    flow: ["Lead", "Qualified", "Discovery", "Proposal", "Negotiation", "Closed"],
    outcomes: ["Won", "Lost", "In progress"],
  },
  {
    key: "visa-immigration",
    name: "Visa / immigration tracker",
    description: "Visa applications through consular processing to a decision.",
    shape: "pipeline",
    group: "Pipelines & trackers",
    edtech: true,
    flow: ["Submission", "Biometrics", "Consulate interview", "Processing", "Decision"],
    outcomes: ["Granted", "Rejected", "In progress"],
  },
  {
    key: "procurement-approvals",
    name: "Procurement / approvals",
    description: "Purchase requests from requisition to delivery.",
    shape: "pipeline",
    group: "Pipelines & trackers",
    flow: ["Requisition", "Approval review", "PO issued", "Fulfillment", "Received"],
    outcomes: ["Fulfilled", "Rejected", "Cancelled", "In progress"],
  },
  {
    key: "grant-application-review",
    name: "Grant / application review",
    description: "Applications through review to an award decision.",
    shape: "pipeline",
    group: "Pipelines & trackers",
    edtech: true,
    flow: ["Submitted", "Eligibility", "Review", "Decision"],
    outcomes: ["Awarded", "Declined", "Ineligible", "In progress"],
  },
  {
    key: "support-ticket-queue",
    name: "Support / ticket queue",
    description: "Helpdesk tickets through their lifecycle.",
    shape: "pipeline",
    group: "Pipelines & trackers",
    flow: ["New", "Open", "Pending", "Solved", "Closed"],
    outcomes: ["Resolved", "Unresolved", "Open"],
  },

  /* ————— Metrics & KPIs ————— */
  { key: "revenue-target", name: "Revenue / MRR", description: "Track revenue against a target.", shape: "metric", group: "Metrics & KPIs", edtech: true, metric: { label: "MRR", unit: "₹" } },
  { key: "user-growth", name: "Active learners", description: "Monthly active users/learners vs goal.", shape: "metric", group: "Metrics & KPIs", edtech: true, metric: { label: "Active learners", unit: "" } },
  { key: "enrollment-target", name: "Enrollments", description: "New sign-ups against a monthly goal.", shape: "metric", group: "Metrics & KPIs", edtech: true, metric: { label: "Enrollments", unit: "" } },
  { key: "nps-csat", name: "NPS / CSAT", description: "Student/parent satisfaction vs target.", shape: "metric", group: "Metrics & KPIs", edtech: true, metric: { label: "NPS", unit: "" } },
  { key: "retention-rate", name: "Retention rate", description: "Renewal/completion rate vs target.", shape: "metric", group: "Metrics & KPIs", edtech: true, metric: { label: "Retention", unit: "%" } },
  { key: "course-completion", name: "Course completion", description: "% of learners completing vs target.", shape: "metric", group: "Metrics & KPIs", edtech: true, metric: { label: "Completion", unit: "%" } },
  { key: "hiring-headcount", name: "Hiring headcount", description: "Hires filled vs the headcount plan.", shape: "metric", group: "Metrics & KPIs", edtech: true, metric: { label: "Hires", unit: "" } },
  { key: "uptime-sla", name: "Uptime / SLA", description: "Platform uptime vs SLA.", shape: "metric", group: "Metrics & KPIs", metric: { label: "Uptime", unit: "%" } },
];

export function getTemplate(key: string): ProjectTemplate | undefined {
  return TEMPLATES.find((t) => t.key === key);
}
