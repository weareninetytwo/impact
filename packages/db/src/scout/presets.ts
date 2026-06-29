import type { ScoutPreset } from "@impact/shared";

export const SCOUT_SOURCE_PRESETS: ScoutPreset[] = [
  {
    preset_key: "nyscr",
    name: "NYSCR — NY public RFP search",
    source_type: "manual_query",
    url: "https://nyscr.ny.gov/",
    query: "website OR design OR branding OR RFP",
    description:
      "Manual NY State Contract Reporter search stub. Set query terms; Scout uses Google News RSS as a proxy until NYSCR API/scrape is wired.",
  },
  {
    preset_key: "sam_gov",
    name: "SAM.gov — federal opportunities",
    source_type: "stub",
    url: "https://sam.gov/content/opportunities",
    query: null,
    description:
      "Placeholder for SAM.gov API integration. Run returns guidance until Epic 4 federal feed is built.",
  },
  {
    preset_key: "google_news_expansion",
    name: "Google News — expansion signals",
    source_type: "rss",
    url: "https://news.google.com/rss/search?q=(%22new+location%22+OR+%22expansion%22+OR+%22opens+office%22)+(%22New+York%22+OR+NY)&hl=en-US&gl=US&ceid=US:en",
    query: null,
    description:
      "RSS feed for expansion / new location signals in NY. Edit URL query params to tune keywords.",
  },
  {
    preset_key: "apollo_manual",
    name: "Apollo — export / manual source",
    source_type: "stub",
    url: null,
    query: "Paste Apollo export CSV path or search URL in notes",
    description:
      "Placeholder for Apollo.io list exports. Upload via Import test or wire CSV ingest in a later epic.",
  },
];
