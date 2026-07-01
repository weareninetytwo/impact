import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOutreachDraft } from "./outreach-draft";

const baseOpportunity = {
  company_name: "Acme Corp",
  title: "Website redesign RFP",
  signal_type: "website_redesign" as const,
  signal_summary:
    "Acme Corp is seeking proposals for a full website redesign and CMS migration.",
  source_url: "https://example.com/rfp",
  recommended_action: "Review and qualify",
};

describe("buildOutreachDraft deduplication", () => {
  it("does not repeat duplicate signal content from knowledge snippets", () => {
    const duplicate = baseOpportunity.signal_summary;
    const draft = buildOutreachDraft({
      opportunity: baseOpportunity,
      knowledgeSnippets: [
        duplicate,
        "Acme recently expanded into two new regional markets.",
      ],
      senderName: "Gino",
    });

    const knowledgePhrase = "recently expanded into two new regional markets";
    assert.match(draft.body, new RegExp(knowledgePhrase));
    const duplicateOccurrences = draft.body
      .toLowerCase()
      .split("acme corp is seeking proposals")
      .length - 1;
    assert.equal(duplicateOccurrences, 1);
  });

  it("keeps the first distinct relevant knowledge snippet", () => {
    const draft = buildOutreachDraft({
      opportunity: baseOpportunity,
      knowledgeSnippets: [
        "Their current site runs on a legacy Drupal stack.",
        "Marketing leadership posted about a Q3 rebrand.",
      ],
      senderName: "Gino",
    });

    assert.match(draft.body, /legacy Drupal stack/i);
    assert.doesNotMatch(draft.body, /Q3 rebrand/i);
  });

  it("handles empty or malformed notes without crashing", () => {
    assert.doesNotThrow(() =>
      buildOutreachDraft({
        opportunity: {
          ...baseOpportunity,
          signal_summary: null,
          title: "",
        },
        knowledgeSnippets: ["", "   ", "Valid supporting detail."],
        senderName: "Gino",
      }),
    );

    const draft = buildOutreachDraft({
      opportunity: {
        ...baseOpportunity,
        signal_summary: null,
        title: "",
      },
      knowledgeSnippets: ["Valid supporting detail."],
      senderName: "Gino",
    });

    assert.match(draft.body, /Valid supporting detail/);
    assert.match(draft.subject, /Acme Corp/);
  });
});
