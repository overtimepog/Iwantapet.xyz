import { FormEvent, useMemo, useState } from 'react';
import { createMockAiProvider } from './domain/ai';
import { scorePetMatch } from './domain/matching';
import { approveDraft, createOutreachDraft, markDraftSent, type OutreachDraft } from './domain/outreach';
import { validateQuestionnaireResponse } from './domain/questionnaire';
import type { MatchResult, Pet, QuestionnaireResponse } from './domain/types';
import { signInWithEmail, signInWithGoogle, type AuthUser } from './firebaseAuth';
import { mockPets, organizations } from './mockPetData';
import './styles.css';

const ai = createMockAiProvider();

const initialQuestionnaire: QuestionnaireResponse = {
  zipCode: '16801',
  housingType: 'apartment',
  rentOrOwn: 'rent',
  landlordRestrictions: 'no large dogs',
  allergies: [],
  monthlyBudget: 120,
  schedule: 'hybrid',
  petExperience: 'some',
  kidsInHome: 'young_kids',
  otherPets: 'cat',
  preferredSpecies: ['cat', 'rabbit'],
  preferredSize: 'small',
  energyLevel: 'medium',
  agePreference: 'adult',
  groomingTolerance: 'medium',
  adoptionUrgency: 'this_month',
};

type View = 'landing' | 'auth' | 'quiz' | 'dashboard';

function scoreClass(score: number) {
  if (score >= 85) return 'excellent';
  if (score >= 65) return 'good';
  return 'low';
}

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [email, setEmail] = useState('demo@iwantapet.xyz');
  const [password, setPassword] = useState('petlover123');
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireResponse>(initialQuestionnaire);
  const [submitted, setSubmitted] = useState(false);
  const [savedPetIds, setSavedPetIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<OutreachDraft | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [aiExplanation, setAiExplanation] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const matches = useMemo(() => {
    return mockPets
      .map((pet) => ({ pet, match: scorePetMatch(questionnaire, pet) }))
      .filter(({ match }) => !match.filteredOut)
      .sort((a, b) => b.match.score - a.match.score);
  }, [questionnaire]);

  async function handleEmailLogin(event: FormEvent) {
    event.preventDefault();
    const signedIn = await signInWithEmail(email, password);
    setUser(signedIn);
    setView('dashboard');
  }

  async function handleGoogleLogin() {
    const signedIn = await signInWithGoogle();
    setUser(signedIn);
    setView('dashboard');
  }

  function submitQuestionnaire(event?: FormEvent) {
    event?.preventDefault();
    const result = validateQuestionnaireResponse(questionnaire);
    if (!result.valid) {
      setError(Object.values(result.errors)[0] ?? 'Please check the questionnaire.');
      return;
    }
    setError('');
    setSubmitted(true);
    setView('dashboard');
  }

  async function draftOutreach(pet: Pet, match: MatchResult) {
    const org = organizations.find((item) => item.id === pet.organizationId);
    const message = await ai.draftShelterMessage({ name: user?.displayName ?? 'Pet seeker' }, pet);
    const explanation = await ai.explainPetMatch(pet, match);
    setAiExplanation((current) => ({ ...current, [pet.id]: explanation }));
    const nextDraft = createOutreachDraft({ userId: user?.uid ?? 'local-demo', petId: pet.id, message: `${message}\n\nOrganization: ${org?.name ?? 'Shelter'}` });
    setDraft(nextDraft);
    setDraftMessage(nextDraft.message);
  }

  function approveCurrentDraft() {
    if (!draft) return;
    setDraft(approveDraft({ ...draft, message: draftMessage }, draft.userId));
  }

  function sendCurrentDraft() {
    if (!draft) return;
    setDraft(markDraftSent(draft, { simulated: true }));
  }

  return (
    <main>
      <nav className="topbar" aria-label="Main navigation">
        <button className="brand" onClick={() => setView('landing')}>🐾 Iwantapet.xyz</button>
        <div className="nav-actions">
          {user ? <span className="user-pill">{user.displayName}</span> : <button className="ghost" onClick={() => setView('auth')}>Account</button>}
          <button className="primary small" onClick={() => setView('quiz')}>Start quiz</button>
        </div>
      </nav>

      {view === 'landing' && (
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">AI adoption concierge</p>
            <h1>Find your perfect pet without getting overwhelmed.</h1>
            <p className="subtitle">Quiz → local pets → AI match → contact shelter. Iwantapet ranks adoptable pets around you and explains each fit in plain English.</p>
            <div className="hero-actions">
              <button className="primary" onClick={() => setView('quiz')}>Find my perfect pet</button>
              <button className="secondary" onClick={() => setView('auth')}>Sign in</button>
            </div>
            <div className="trust-row">
              <span>Safety-first outreach</span><span>Local shelter ready</span><span>No contact without approval</span>
            </div>
          </div>
          <div className="hero-card" aria-label="Sample pet match">
            <img src={mockPets[0].imageUrl} alt="Luna the cat" />
            <div><strong>96% match</strong><span>Luna · calm apartment cat</span></div>
          </div>
        </section>
      )}

      {view === 'auth' && (
        <section className="panel auth-panel">
          <p className="eyebrow">Firebase Auth</p>
          <h2>Sign in to save matches</h2>
          <form onSubmit={handleEmailLogin} className="form-grid">
            <label>Email address<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></label>
            <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" /></label>
            <button className="primary" type="submit">Sign in with email</button>
          </form>
          <button className="google" onClick={handleGoogleLogin}>Continue with Google</button>
          <p className="muted">If Firebase env vars are absent, local demo auth is used so tests and development need no API key.</p>
        </section>
      )}

      {view === 'quiz' && (
        <section className="panel">
          <p className="eyebrow">Friendly onboarding</p>
          <h2>Lifestyle questionnaire</h2>
          {error && <p className="error" role="alert">{error}</p>}
          <form className="questionnaire" onSubmit={submitQuestionnaire}>
            <label>ZIP code<input value={questionnaire.zipCode} onChange={(e) => setQuestionnaire({ ...questionnaire, zipCode: e.target.value })} /></label>
            <label>Housing type<select value={questionnaire.housingType} onChange={(e) => setQuestionnaire({ ...questionnaire, housingType: e.target.value })}><option>apartment</option><option>house</option><option>townhome</option></select></label>
            <label>Rent or own<select value={questionnaire.rentOrOwn} onChange={(e) => setQuestionnaire({ ...questionnaire, rentOrOwn: e.target.value })}><option>rent</option><option>own</option></select></label>
            <label>Landlord pet restrictions<input value={questionnaire.landlordRestrictions} onChange={(e) => setQuestionnaire({ ...questionnaire, landlordRestrictions: e.target.value })} /></label>
            <label>Allergies<select value={questionnaire.allergies[0] ?? ''} onChange={(e) => setQuestionnaire({ ...questionnaire, allergies: e.target.value ? [e.target.value] : [] })}><option value="">None</option><option value="dog_dander">Dog dander</option><option value="cat_dander">Cat dander</option></select></label>
            <label>Monthly budget<input type="number" value={questionnaire.monthlyBudget} onChange={(e) => setQuestionnaire({ ...questionnaire, monthlyBudget: Number(e.target.value) })} /></label>
            <label>Schedule<select value={questionnaire.schedule} onChange={(e) => setQuestionnaire({ ...questionnaire, schedule: e.target.value })}><option>hybrid</option><option>work_from_home</option><option>office_full_time</option><option>travel_often</option></select></label>
            <label>Pet experience<select value={questionnaire.petExperience} onChange={(e) => setQuestionnaire({ ...questionnaire, petExperience: e.target.value })}><option>none</option><option>some</option><option>experienced</option></select></label>
            <label>Kids in home<select value={questionnaire.kidsInHome} onChange={(e) => setQuestionnaire({ ...questionnaire, kidsInHome: e.target.value })}><option>none</option><option>young_kids</option><option>older_kids</option></select></label>
            <label>Other pets<select value={questionnaire.otherPets} onChange={(e) => setQuestionnaire({ ...questionnaire, otherPets: e.target.value })}><option>none</option><option>cat</option><option>dog</option><option>multiple</option></select></label>
            <label>Preferred species<select value={questionnaire.preferredSpecies[0]} onChange={(e) => setQuestionnaire({ ...questionnaire, preferredSpecies: [e.target.value as QuestionnaireResponse['preferredSpecies'][number]] })}><option value="cat">Cat</option><option value="dog">Dog</option><option value="rabbit">Rabbit</option><option value="bird">Bird</option></select></label>
            <label>Preferred size<select value={questionnaire.preferredSize} onChange={(e) => setQuestionnaire({ ...questionnaire, preferredSize: e.target.value as QuestionnaireResponse['preferredSize'] })}><option>small</option><option>medium</option><option>large</option><option>any</option></select></label>
            <label>Energy level<select value={questionnaire.energyLevel} onChange={(e) => setQuestionnaire({ ...questionnaire, energyLevel: e.target.value as QuestionnaireResponse['energyLevel'] })}><option>low</option><option>medium</option><option>high</option></select></label>
            <label>Age preference<select value={questionnaire.agePreference} onChange={(e) => setQuestionnaire({ ...questionnaire, agePreference: e.target.value as QuestionnaireResponse['agePreference'] })}><option>baby</option><option>young</option><option>adult</option><option>senior</option><option>any</option></select></label>
            <label>Grooming tolerance<select value={questionnaire.groomingTolerance} onChange={(e) => setQuestionnaire({ ...questionnaire, groomingTolerance: e.target.value as QuestionnaireResponse['groomingTolerance'] })}><option>low</option><option>medium</option><option>high</option></select></label>
            <label>Adoption urgency<select value={questionnaire.adoptionUrgency} onChange={(e) => setQuestionnaire({ ...questionnaire, adoptionUrgency: e.target.value })}><option>this_week</option><option>this_month</option><option>just_researching</option></select></label>
            <button className="primary full" type="submit">Show my matches</button>
          </form>
        </section>
      )}

      {view === 'dashboard' && (
        <section className="dashboard">
          <div className="dashboard-header">
            <div><p className="eyebrow">Dashboard</p><h2>Your best local matches</h2></div>
            {!submitted && <button className="secondary" onClick={() => setView('quiz')}>Complete questionnaire</button>}
          </div>
          {matches.length === 0 ? <div className="empty">No pets matched every hard filter. Try broadening species, allergies, or travel distance.</div> : (
            <div className="pet-grid">
              {matches.map(({ pet, match }) => {
                const org = organizations.find((item) => item.id === pet.organizationId);
                const saved = savedPetIds.includes(pet.id);
                return (
                  <article className="pet-card" key={pet.id}>
                    <img src={pet.imageUrl} alt={`${pet.name} the ${pet.species}`} />
                    <div className="pet-body">
                      <div className="pet-title"><h3>{pet.name}</h3><span className={`score ${scoreClass(match.score)}`}><b>{match.score}</b>/100 match score</span></div>
                      <p>{pet.breed} · {pet.age} · {pet.size} · {pet.distanceMiles} miles away</p>
                      <p>{pet.description}</p>
                      <ul>{match.reasons.slice(0, 4).map((reason) => <li key={reason}>{reason}</li>)}</ul>
                      {aiExplanation[pet.id] && <p className="ai-note">{aiExplanation[pet.id]}</p>}
                      <p className="muted">{org?.name} · {org?.city}, {org?.state}</p>
                      <div className="card-actions">
                        <button className="secondary" onClick={() => setSavedPetIds((ids) => saved ? ids : [...ids, pet.id])}>{saved ? 'Saved' : 'Save pet'}</button>
                        <button className="primary" onClick={() => draftOutreach(pet, match)}>Draft message</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {draft && (
            <aside className="draft-panel" aria-label="Outreach draft">
              <p className="eyebrow">Outreach assistant</p>
              <h3>{draft.status === 'sent' ? 'Sent simulated contact' : draft.status.replace('_', ' ')}</h3>
              <textarea value={draftMessage} onChange={(e) => setDraftMessage(e.target.value)} />
              <div className="card-actions">
                <button className="secondary" onClick={approveCurrentDraft} disabled={draft.status !== 'awaiting_approval'}>Approve draft</button>
                <button className="primary" onClick={sendCurrentDraft} disabled={draft.status !== 'approved'}>Send simulated contact</button>
              </div>
              <p className="muted">Guardrail: Iwantapet never submits forms, emails, or contacts shelters without explicit user approval. MVP sending is simulated and logged.</p>
            </aside>
          )}
        </section>
      )}
    </main>
  );
}
