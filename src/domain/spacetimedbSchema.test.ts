import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'spacetimedb/src/index.ts'), 'utf8');

describe('SpacetimeDB schema and reducers', () => {
  it('declares all MVP tables', () => {
    for (const tableName of [
      'users',
      'questionnaire_responses',
      'pets',
      'organizations',
      'matches',
      'saved_pets',
      'outreach_drafts',
      'agent_action_logs',
    ]) {
      expect(source).toContain(`${tableName}: table(`);
    }
  });

  it('declares reducers for profile, questionnaire, pets, matches, saves, outreach, and logs', () => {
    for (const reducerName of [
      'upsert_user_profile',
      'save_questionnaire',
      'upsert_pet',
      'generate_match_score',
      'save_pet',
      'unsave_pet',
      'create_outreach_draft',
      'log_agent_action',
      'mark_draft_approved',
      'mark_draft_sent',
      'seed_mock_pet_data',
    ]) {
      expect(source).toContain(`export const ${reducerName} = spacetimedb.reducer`);
    }
  });

  it('documents the no-contact-without-approval guardrail inside the reducer module', () => {
    expect(source).toContain('Cannot mark outreach sent without explicit user approval');
  });
});
