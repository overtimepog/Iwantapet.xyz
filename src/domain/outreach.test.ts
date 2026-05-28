import { describe, expect, it } from 'vitest';
import { approveDraft, createOutreachDraft, markDraftSent } from './outreach';

describe('outreach approval guardrails', () => {
  it('creates drafts in awaiting approval state and blocks sending before approval', () => {
    const draft = createOutreachDraft({ userId: 'u1', petId: 'p1', message: 'Hello shelter' });

    expect(draft.status).toBe('awaiting_approval');
    expect(() => markDraftSent(draft)).toThrow('explicit user approval');
  });

  it('allows simulated sending only after user approval', () => {
    const draft = createOutreachDraft({ userId: 'u1', petId: 'p1', message: 'Hello shelter' });
    const approved = approveDraft(draft, 'u1');
    const sent = markDraftSent(approved, { simulated: true });

    expect(approved.status).toBe('approved');
    expect(sent.status).toBe('sent');
    expect(sent.sentAt).toBeTruthy();
  });
});
