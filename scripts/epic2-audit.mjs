import { scoreOpportunity, buildDedupeKey } from "../packages/engines/src/scoring.ts";
import {
  createOpportunity,
  listOpportunities,
  importOpportunities,
} from "../packages/db/src/opportunities/repository.ts";
import { writeOpportunities } from "../packages/db/src/opportunities/store.ts";
import path from "path";

process.env.IMPACT_DATA_DIR = path.join(process.cwd(), "apps/agency/data");

async function main() {
  await writeOpportunities([]);

  const scored = scoreOpportunity({
    company_name: "Test Co",
    title: "RFP rebrand",
    signal_type: "rfp",
    source: "test",
    estimated_value: 120000,
    deadline: "2026-07-05",
  });

  console.log("SCORING", scored.lead_grade, scored.total_score, scored.next_action);

  const a = await createOpportunity({
    company_name: "Dedupe Test",
    title: "First",
    signal_type: "rfp",
    source: "test",
    company_website: "https://dedupe.com",
  });

  const b = await createOpportunity({
    company_name: "Dedupe Test",
    title: "Updated title",
    signal_type: "rfp",
    source: "test",
    company_website: "dedupe.com",
  });

  console.log("DEDUPE", a.duplicate, a.updated, b.duplicate, b.updated);
  console.log("COUNT", (await listOpportunities()).length);

  const key = buildDedupeKey("A", "b.com", null);
  console.log("KEY", key);

  const imp = await importOpportunities([
    {
      company_name: "Import Co",
      title: "Import 1",
      signal_type: "news",
      source: "csv",
    },
  ]);
  console.log("IMPORT", imp.created);

  console.log("AUDIT_OK");
}

main().catch((e) => {
  console.error("AUDIT_FAIL", e);
  process.exit(1);
});
