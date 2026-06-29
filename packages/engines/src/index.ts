export { scoreOpportunity, buildDedupeKey, buildSignalIngestDedupeKey } from "./scoring";
export type { ScoringInput, ScoringResult } from "./scoring";
export {
  buildOutreachDraft,
  buildGmailComposeUrl,
} from "./outreach-draft";
export type { OutreachDraft, OutreachDraftInput } from "./outreach-draft";
export {
  generateResearch,
} from "./automation/research";
export {
  generateQualification,
} from "./automation/qualification";
export {
  generateCloserBrief,
} from "./automation/closer-brief";
export {
  generateProposal,
} from "./automation/proposal";
export {
  generateNurtureEnrollment,
  nurtureTouchContent,
} from "./automation/nurture";
export {
  generateTasksForOpportunity,
} from "./automation/tasks";
export {
  buildExecutiveBriefing,
  buildOutreachDraftForOpportunity,
  isTestOpportunity,
} from "./automation/briefing";
