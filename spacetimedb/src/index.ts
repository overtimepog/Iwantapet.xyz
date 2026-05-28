import { schema, table, t, SenderError } from 'spacetimedb/server';

const spacetimedb = schema({
  users: table(
    { public: true },
    {
      id: t.u32().primaryKey().autoInc(),
      user_identity: t.identity(),
      firebase_uid: t.string(),
      email: t.string(),
      display_name: t.string(),
      photo_url: t.string(),
      zip_code: t.string(),
      created_at: t.timestamp(),
      updated_at: t.timestamp(),
    }
  ),
  questionnaire_responses: table(
    { public: true },
    {
      id: t.u32().primaryKey().autoInc(),
      questionnaire_user_identity: t.identity(),
      firebase_uid: t.string(),
      response_json: t.string(),
      zip_code: t.string(),
      preferred_species: t.string(),
      budget_cents: t.u32(),
      created_at: t.timestamp(),
      updated_at: t.timestamp(),
    }
  ),
  organizations: table(
    { public: true },
    {
      id: t.u32().primaryKey().autoInc(),
      external_id: t.string(),
      name: t.string(),
      org_type: t.string(),
      city: t.string(),
      state: t.string(),
      zip_code: t.string(),
      email: t.string(),
      phone: t.string(),
      website: t.string(),
      created_at: t.timestamp(),
      updated_at: t.timestamp(),
    }
  ),
  pets: table(
    { public: true },
    {
      id: t.u32().primaryKey().autoInc(),
      external_id: t.string(),
      organization_external_id: t.string(),
      name: t.string(),
      species: t.string(),
      breed: t.string(),
      age: t.string(),
      pet_size: t.string(),
      energy_level: t.string(),
      grooming_needs: t.string(),
      good_with_kids: t.u8(),
      good_with_dogs: t.u8(),
      good_with_cats: t.u8(),
      allergy_notes: t.string(),
      monthly_cost_cents: t.u32(),
      distance_miles: t.u32(),
      description: t.string(),
      image_url: t.string(),
      created_at: t.timestamp(),
      updated_at: t.timestamp(),
    }
  ),
  matches: table(
    { public: true },
    {
      id: t.u32().primaryKey().autoInc(),
      match_user_identity: t.identity(),
      pet_external_id: t.string(),
      score: t.u8(),
      reasons_json: t.string(),
      warnings_json: t.string(),
      filtered_out: t.u8(),
      created_at: t.timestamp(),
      updated_at: t.timestamp(),
    }
  ),
  saved_pets: table(
    { public: true },
    {
      id: t.u32().primaryKey().autoInc(),
      saved_user_identity: t.identity(),
      pet_external_id: t.string(),
      saved_at: t.timestamp(),
    }
  ),
  outreach_drafts: table(
    { public: true },
    {
      id: t.u32().primaryKey().autoInc(),
      draft_user_identity: t.identity(),
      pet_external_id: t.string(),
      organization_external_id: t.string(),
      message: t.string(),
      status: t.string(),
      approved_at: t.string(),
      sent_at: t.string(),
      simulated: t.u8(),
      created_at: t.timestamp(),
      updated_at: t.timestamp(),
    }
  ),
  agent_action_logs: table(
    { public: true },
    {
      id: t.u32().primaryKey().autoInc(),
      log_user_identity: t.identity(),
      action_type: t.string(),
      target_type: t.string(),
      target_id: t.string(),
      details_json: t.string(),
      created_at: t.timestamp(),
    }
  ),
});
export default spacetimedb;

type RowWithId = { id: number };

function findBy<T>(iterable: Iterable<T>, predicate: (row: T) => boolean): T | undefined {
  for (const row of iterable) if (predicate(row)) return row;
  return undefined;
}

function upsertById<T extends RowWithId>(accessor: { update: (row: T) => void }, row: T): void {
  accessor.update(row);
}

export const init = spacetimedb.init(_ctx => {
  // Seed rows through seed_mock_pet_data so client/dev flows stay deterministic.
});

export const onConnect = spacetimedb.clientConnected(ctx => {
  console.info(`Iwantapet client connected: ${ctx.sender.toHexString()}`);
});

export const onDisconnect = spacetimedb.clientDisconnected(ctx => {
  console.info(`Iwantapet client disconnected: ${ctx.sender.toHexString()}`);
});

export const upsert_user_profile = spacetimedb.reducer(
  { firebase_uid: t.string(), email: t.string(), display_name: t.string(), photo_url: t.string(), zip_code: t.string() },
  (ctx, { firebase_uid, email, display_name, photo_url, zip_code }) => {
    const existing = findBy(ctx.db.users.iter(), user => user.firebase_uid === firebase_uid || user.user_identity.toHexString() === ctx.sender.toHexString());
    if (existing) {
      upsertById(ctx.db.users.id, { ...existing, firebase_uid, email, display_name, photo_url, zip_code, updated_at: ctx.timestamp });
      return;
    }
    ctx.db.users.insert({ id: 0, user_identity: ctx.sender, firebase_uid, email, display_name, photo_url, zip_code, created_at: ctx.timestamp, updated_at: ctx.timestamp });
  }
);

export const save_questionnaire = spacetimedb.reducer(
  { firebase_uid: t.string(), response_json: t.string(), zip_code: t.string(), preferred_species: t.string(), budget_cents: t.u32() },
  (ctx, { firebase_uid, response_json, zip_code, preferred_species, budget_cents }) => {
    const existing = findBy(ctx.db.questionnaire_responses.iter(), row => row.firebase_uid === firebase_uid && row.questionnaire_user_identity.toHexString() === ctx.sender.toHexString());
    if (existing) {
      upsertById(ctx.db.questionnaire_responses.id, { ...existing, response_json, zip_code, preferred_species, budget_cents, updated_at: ctx.timestamp });
      return;
    }
    ctx.db.questionnaire_responses.insert({ id: 0, questionnaire_user_identity: ctx.sender, firebase_uid, response_json, zip_code, preferred_species, budget_cents, created_at: ctx.timestamp, updated_at: ctx.timestamp });
  }
);

export const upsert_pet = spacetimedb.reducer(
  {
    external_id: t.string(), organization_external_id: t.string(), name: t.string(), species: t.string(), breed: t.string(), age: t.string(), pet_size: t.string(), energy_level: t.string(), grooming_needs: t.string(), good_with_kids: t.u8(), good_with_dogs: t.u8(), good_with_cats: t.u8(), allergy_notes: t.string(), monthly_cost_cents: t.u32(), distance_miles: t.u32(), description: t.string(), image_url: t.string()
  },
  (ctx, pet) => {
    const existing = findBy(ctx.db.pets.iter(), row => row.external_id === pet.external_id);
    if (existing) {
      upsertById(ctx.db.pets.id, { ...existing, ...pet, updated_at: ctx.timestamp });
      return;
    }
    ctx.db.pets.insert({ id: 0, ...pet, created_at: ctx.timestamp, updated_at: ctx.timestamp });
  }
);

export const generate_match_score = spacetimedb.reducer(
  { pet_external_id: t.string(), score: t.u8(), reasons_json: t.string(), warnings_json: t.string(), filtered_out: t.u8() },
  (ctx, { pet_external_id, score, reasons_json, warnings_json, filtered_out }) => {
    const existing = findBy(ctx.db.matches.iter(), row => row.match_user_identity.toHexString() === ctx.sender.toHexString() && row.pet_external_id === pet_external_id);
    if (existing) {
      upsertById(ctx.db.matches.id, { ...existing, score, reasons_json, warnings_json, filtered_out, updated_at: ctx.timestamp });
      return;
    }
    ctx.db.matches.insert({ id: 0, match_user_identity: ctx.sender, pet_external_id, score, reasons_json, warnings_json, filtered_out, created_at: ctx.timestamp, updated_at: ctx.timestamp });
  }
);

export const save_pet = spacetimedb.reducer(
  { pet_external_id: t.string() },
  (ctx, { pet_external_id }) => {
    const existing = findBy(ctx.db.saved_pets.iter(), row => row.saved_user_identity.toHexString() === ctx.sender.toHexString() && row.pet_external_id === pet_external_id);
    if (!existing) ctx.db.saved_pets.insert({ id: 0, saved_user_identity: ctx.sender, pet_external_id, saved_at: ctx.timestamp });
  }
);

export const unsave_pet = spacetimedb.reducer(
  { pet_external_id: t.string() },
  (ctx, { pet_external_id }) => {
    const existing = findBy(ctx.db.saved_pets.iter(), row => row.saved_user_identity.toHexString() === ctx.sender.toHexString() && row.pet_external_id === pet_external_id);
    if (existing) ctx.db.saved_pets.id.delete(existing.id);
  }
);

export const create_outreach_draft = spacetimedb.reducer(
  { pet_external_id: t.string(), organization_external_id: t.string(), message: t.string() },
  (ctx, { pet_external_id, organization_external_id, message }) => {
    const row = ctx.db.outreach_drafts.insert({ id: 0, draft_user_identity: ctx.sender, pet_external_id, organization_external_id, message, status: 'awaiting_approval', approved_at: '', sent_at: '', simulated: 1, created_at: ctx.timestamp, updated_at: ctx.timestamp });
    ctx.db.agent_action_logs.insert({ id: 0, log_user_identity: ctx.sender, action_type: 'draft_created', target_type: 'outreach_draft', target_id: String(row.id), details_json: JSON.stringify({ pet_external_id }), created_at: ctx.timestamp });
  }
);

export const log_agent_action = spacetimedb.reducer(
  { action_type: t.string(), target_type: t.string(), target_id: t.string(), details_json: t.string() },
  (ctx, { action_type, target_type, target_id, details_json }) => {
    ctx.db.agent_action_logs.insert({ id: 0, log_user_identity: ctx.sender, action_type, target_type, target_id, details_json, created_at: ctx.timestamp });
  }
);

export const mark_draft_approved = spacetimedb.reducer(
  { draft_id: t.u32() },
  (ctx, { draft_id }) => {
    const draft = ctx.db.outreach_drafts.id.find(draft_id);
    if (!draft || draft.draft_user_identity.toHexString() !== ctx.sender.toHexString()) throw new SenderError('Draft not found.');
    ctx.db.outreach_drafts.id.update({ ...draft, status: 'approved', approved_at: ctx.timestamp.toDate().toISOString(), updated_at: ctx.timestamp });
    ctx.db.agent_action_logs.insert({ id: 0, log_user_identity: ctx.sender, action_type: 'draft_approved', target_type: 'outreach_draft', target_id: String(draft_id), details_json: '{}', created_at: ctx.timestamp });
  }
);

export const mark_draft_sent = spacetimedb.reducer(
  { draft_id: t.u32() },
  (ctx, { draft_id }) => {
    const draft = ctx.db.outreach_drafts.id.find(draft_id);
    if (!draft || draft.draft_user_identity.toHexString() !== ctx.sender.toHexString()) throw new SenderError('Draft not found.');
    if (draft.status !== 'approved') throw new SenderError('Cannot mark outreach sent without explicit user approval');
    ctx.db.outreach_drafts.id.update({ ...draft, status: 'sent', sent_at: ctx.timestamp.toDate().toISOString(), updated_at: ctx.timestamp });
    ctx.db.agent_action_logs.insert({ id: 0, log_user_identity: ctx.sender, action_type: 'simulated_send', target_type: 'outreach_draft', target_id: String(draft_id), details_json: JSON.stringify({ simulated: true }), created_at: ctx.timestamp });
  }
);

export const seed_mock_pet_data = spacetimedb.reducer(ctx => {
  const existing = findBy(ctx.db.organizations.iter(), org => org.external_id === 'org-happy-valley');
  if (!existing) {
    ctx.db.organizations.insert({ id: 0, external_id: 'org-happy-valley', name: 'Happy Valley Humane Society', org_type: 'shelter', city: 'State College', state: 'PA', zip_code: '16801', email: 'adoptions@example.org', phone: '814-555-0199', website: 'https://example.org/happy-valley', created_at: ctx.timestamp, updated_at: ctx.timestamp });
  }
  const seedPets = [
    ['pet-luna', 'Luna', 'cat', 'Domestic Shorthair', 'adult', 'small', 'medium', 'low', 1, 0, 1, 'low shedding', 6500, 8, 'Gentle lap cat who likes sunny windows.', '/pets/luna.jpg'],
    ['pet-maple', 'Maple', 'dog', 'Beagle Mix', 'young', 'medium', 'high', 'medium', 1, 1, 0, 'moderate shedding', 10500, 18, 'Cheerful walking buddy who loves puzzle toys.', '/pets/maple.jpg'],
    ['pet-mochi', 'Mochi', 'rabbit', 'Mini Rex', 'adult', 'small', 'low', 'medium', 1, 0, 0, 'hay and bedding sensitivity possible', 4500, 12, 'Quiet rabbit who enjoys calm routines.', '/pets/mochi.jpg'],
  ] as const;
  for (const pet of seedPets) {
    const [external_id, name, species, breed, age, pet_size, energy_level, grooming_needs, good_with_kids, good_with_dogs, good_with_cats, allergy_notes, monthly_cost_cents, distance_miles, description, image_url] = pet;
    const exists = findBy(ctx.db.pets.iter(), row => row.external_id === external_id);
    if (!exists) ctx.db.pets.insert({ id: 0, external_id, organization_external_id: 'org-happy-valley', name, species, breed, age, pet_size, energy_level, grooming_needs, good_with_kids, good_with_dogs, good_with_cats, allergy_notes, monthly_cost_cents, distance_miles, description, image_url, created_at: ctx.timestamp, updated_at: ctx.timestamp });
  }
});
