export interface NavItem {
  label: string;
  href: string;
  description: string;
}

/** Primary module navigation — see docs/modules.md */
export const MODULE_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    description: "Executive briefing and pipeline health",
  },
  {
    label: "Opportunities",
    href: "/opportunities",
    description: "Pipeline — signal to closed deal",
  },
  {
    label: "Knowledge",
    href: "/knowledge",
    description: "Proposals, SOPs, rates — grounded business context",
  },
  {
    label: "Signals",
    href: "/signals",
    description: "Buying signals ingestion and matching",
  },
  {
    label: "Companies",
    href: "/companies",
    description: "Company records and enrichment",
  },
  {
    label: "Contacts",
    href: "/contacts",
    description: "Decision-makers and contact intelligence",
  },
  {
    label: "Qualification",
    href: "/qualification",
    description: "Pre-vet prospects before human consultations",
  },
  {
    label: "Nurture",
    href: "/nurture",
    description: "Automated nurture sequences by grade",
  },
  {
    label: "Outreach",
    href: "/outreach",
    description: "Draft queue and message review",
  },
  {
    label: "Proposals",
    href: "/proposals",
    description: "Proposal generation and tracking",
  },
  {
    label: "Tasks",
    href: "/tasks",
    description: "Next actions for every opportunity",
  },
  {
    label: "Analytics",
    href: "/analytics",
    description: "Funnel metrics and grade distribution",
  },
  {
    label: "Settings",
    href: "/settings",
    description: "ICP, scoring, offers, and preferences",
  },
];

export const PRODUCT_TAGLINE =
  "AI eliminates wasted sales time. Humans close qualified opportunities.";
