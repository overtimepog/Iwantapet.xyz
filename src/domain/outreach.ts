export type OutreachStatus = 'draft_created' | 'awaiting_approval' | 'approved' | 'sent';

export interface OutreachDraft {
  id: string;
  userId: string;
  petId: string;
  message: string;
  status: OutreachStatus;
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  simulated?: boolean;
}

export function createOutreachDraft(input: { userId: string; petId: string; message: string }): OutreachDraft {
  return {
    id: `draft-${input.userId}-${input.petId}-${Date.now()}`,
    userId: input.userId,
    petId: input.petId,
    message: input.message,
    status: 'awaiting_approval',
  };
}

export function approveDraft(draft: OutreachDraft, userId: string): OutreachDraft {
  if (draft.userId !== userId) throw new Error('Only the draft owner can approve outreach.');
  return { ...draft, status: 'approved', approvedBy: userId, approvedAt: new Date().toISOString() };
}

export function markDraftSent(draft: OutreachDraft, options: { simulated: boolean } = { simulated: true }): OutreachDraft {
  if (draft.status !== 'approved') throw new Error('Cannot contact anyone without explicit user approval.');
  return { ...draft, status: 'sent', simulated: options.simulated, sentAt: new Date().toISOString() };
}
