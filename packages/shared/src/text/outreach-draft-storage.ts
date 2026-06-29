export interface StoredOutreachDraft {
  subject: string;
  body: string;
  contactEmail: string;
}

const START = "\n\n---OUTREACH-DRAFT---\n";
const END = "\n---END-OUTREACH-DRAFT---\n";

export function parseOutreachFromNotes(notes: string | null): {
  userNotes: string;
  draft: StoredOutreachDraft | null;
} {
  if (!notes?.trim()) {
    return { userNotes: "", draft: null };
  }

  const startIdx = notes.indexOf(START);
  if (startIdx === -1) {
    return { userNotes: notes.trim(), draft: null };
  }

  const userNotes = notes.slice(0, startIdx).trim();
  const endIdx = notes.indexOf(END, startIdx);
  const jsonBlock =
    endIdx === -1
      ? notes.slice(startIdx + START.length)
      : notes.slice(startIdx + START.length, endIdx);

  try {
    const parsed = JSON.parse(jsonBlock.trim()) as StoredOutreachDraft;
    if (parsed?.subject && parsed?.body) {
      return {
        userNotes,
        draft: {
          subject: parsed.subject,
          body: parsed.body,
          contactEmail: parsed.contactEmail ?? "",
        },
      };
    }
  } catch {
    // ignore malformed block
  }

  return { userNotes: notes.trim(), draft: null };
}

export function mergeOutreachIntoNotes(
  userNotes: string,
  draft: StoredOutreachDraft,
): string {
  const payload = JSON.stringify({
    subject: draft.subject,
    body: draft.body,
    contactEmail: draft.contactEmail ?? "",
  });
  const base = userNotes.trim();
  const block = `${START}${payload}${END}`;
  return base ? `${base}${block}` : block.trimStart();
}
