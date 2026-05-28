import { FormEvent, useMemo, useState } from 'react';
import { createMockAiProvider } from './domain/ai';
import { scorePetMatch } from './domain/matching';
import { approveDraft, createOutreachDraft, markDraftSent, type OutreachDraft } from './domain/outreach';
import { validateQuestionnaireResponse } from './domain/questionnaire';
import type { MatchResult, Pet, QuestionnaireResponse } from './domain/types';
import { logout as logoutFromAuth, signInWithEmail, signInWithGoogle, type AuthUser } from './firebaseAuth';
import { mockPets, organizations } from './mockPetData';
import './styles.css';

const ai = createMockAiProvider();
const TOTAL_QUIZ_STEPS = 4;

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

type View = 'landing' | 'auth' | 'quiz' | 'dashboard' | 'settings';
type QuestionnaireKey = keyof QuestionnaireResponse;

function scoreClass(score: number) {
  if (score >= 85) return 'excellent';
  if (score >= 65) return 'good';
  return 'low';
}

function optionLabel(value: string) {
  if (value === '') return 'None';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase());
}

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [email, setEmail] = useState('demo@iwantapet.xyz');
  const [password, setPassword] = useState('petlover123');
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireResponse>(initialQuestionnaire);
  const [quizStep, setQuizStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [savedPetIds, setSavedPetIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<OutreachDraft | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [aiExplanation, setAiExplanation] = useState<Record<string, string>>({});
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState('');
  const [error, setError] = useState('');

  const matches = useMemo(() => {
    return mockPets
      .map((pet) => ({ pet, match: scorePetMatch(questionnaire, pet) }))
      .filter(({ match }) => !match.filteredOut)
      .sort((a, b) => b.match.score - a.match.score);
  }, [questionnaire]);

  function openAuth(message = '') {
    setAuthPrompt(message);
    setView('auth');
  }

  function startQuiz() {
    setAccountMenuOpen(false);
    if (!user) {
      openAuth('Please sign in before taking the quiz so we can save your answers and matches.');
      return;
    }
    setError('');
    setQuizStep(1);
    setView('quiz');
  }

  async function handleEmailLogin(event: FormEvent) {
    event.preventDefault();
    const signedIn = await signInWithEmail(email, password);
    setUser(signedIn);
    setAuthPrompt('');
    setView('dashboard');
  }

  async function handleGoogleLogin() {
    const signedIn = await signInWithGoogle();
    setUser(signedIn);
    setAuthPrompt('');
    setView('dashboard');
  }

  async function handleLogout() {
    await logoutFromAuth();
    setUser(null);
    setSavedPetIds([]);
    setDraft(null);
    setDraftMessage('');
    setAiExplanation({});
    setAccountMenuOpen(false);
    openAuth('You have been logged out. Sign in again to continue.');
  }

  function openSettings() {
    setAccountMenuOpen(false);
    setView('settings');
  }

  function setQuestionnaireValue<K extends QuestionnaireKey>(key: K, value: QuestionnaireResponse[K]) {
    setQuestionnaire((current) => ({ ...current, [key]: value }));
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

  function singleChoice<K extends QuestionnaireKey>(key: K, label: string, values: string[]) {
    const rawValue = questionnaire[key];
    const currentValue = Array.isArray(rawValue) ? (rawValue[0] ?? '') : String(rawValue);
    return (
      <fieldset className="choice-group">
        <legend>{label}</legend>
        <div className="choice-grid">
          {values.map((value) => (
            <label className="choice-card" key={`${String(key)}-${value}`}>
              <input
                type="radio"
                name={String(key)}
                value={value}
                checked={currentValue === value}
                onChange={() => {
                  if (key === 'preferredSpecies') setQuestionnaireValue(key, [value] as QuestionnaireResponse[K]);
                  else if (key === 'allergies') setQuestionnaireValue(key, (value ? [value] : []) as QuestionnaireResponse[K]);
                  else if (key === 'monthlyBudget') setQuestionnaireValue(key, Number(value) as QuestionnaireResponse[K]);
                  else setQuestionnaireValue(key, value as QuestionnaireResponse[K]);
                }}
              />
              <span>{optionLabel(value)}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  function renderQuizStep() {
    if (quizStep === 1) {
      return (
        <>
          <h2>Home basics</h2>
          <label className="text-question">ZIP code<input value={questionnaire.zipCode} onChange={(e) => setQuestionnaireValue('zipCode', e.target.value)} /></label>
          {singleChoice('housingType', 'Housing type', ['apartment', 'house', 'townhome'])}
          {singleChoice('rentOrOwn', 'Do you rent or own?', ['rent', 'own'])}
          {singleChoice('landlordRestrictions', 'Pet restrictions', ['none', 'no large dogs', 'cats only', 'small pets only'])}
        </>
      );
    }
    if (quizStep === 2) {
      return (
        <>
          <h2>Household</h2>
          {singleChoice('allergies', 'Allergies', ['', 'dog_dander', 'cat_dander'])}
          {singleChoice('kidsInHome', 'Kids in home', ['none', 'young_kids', 'older_kids'])}
          {singleChoice('otherPets', 'Other pets', ['none', 'cat', 'dog', 'multiple'])}
          {singleChoice('petExperience', 'Pet experience', ['none', 'some', 'experienced'])}
        </>
      );
    }
    if (quizStep === 3) {
      return (
        <>
          <h2>Pet preferences</h2>
          {singleChoice('preferredSpecies', 'Preferred species', ['cat', 'dog', 'rabbit', 'bird'])}
          {singleChoice('preferredSize', 'Preferred size', ['small', 'medium', 'large', 'any'])}
          {singleChoice('energyLevel', 'Energy level', ['low', 'medium', 'high'])}
          {singleChoice('agePreference', 'Age preference', ['baby', 'young', 'adult', 'senior', 'any'])}
        </>
      );
    }
    return (
      <>
        <h2>Care fit</h2>
        {singleChoice('monthlyBudget', 'Monthly budget', ['75', '120', '200', '350'])}
        {singleChoice('schedule', 'Schedule', ['work_from_home', 'hybrid', 'office_full_time', 'travel_often'])}
        {singleChoice('groomingTolerance', 'Grooming tolerance', ['low', 'medium', 'high'])}
        {singleChoice('adoptionUrgency', 'Adoption urgency', ['this_week', 'this_month', 'just_researching'])}
      </>
    );
  }

  return (
    <main>
      <nav className="topbar" aria-label="Main navigation">
        <button className="brand" onClick={() => setView('landing')}>🐾 Iwantapet.xyz</button>
        <div className="nav-actions">
          {user ? (
            <div className="account-menu-wrap">
              <button
                className="user-pill account-trigger"
                aria-label={`${user.displayName} account menu`}
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                onClick={() => setAccountMenuOpen((open) => !open)}
              >
                {user.displayName} <span aria-hidden="true">⌄</span>
              </button>
              {accountMenuOpen && (
                <div className="account-menu" role="menu" aria-label="Account menu">
                  <button role="menuitem" onClick={openSettings}>Settings</button>
                  <button role="menuitem" onClick={handleLogout}>Log out</button>
                </div>
              )}
            </div>
          ) : <button className="ghost" onClick={() => openAuth()}>Account</button>}
          <button className="primary small" onClick={startQuiz}>Start quiz</button>
        </div>
      </nav>

      {view === 'landing' && (
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">AI adoption concierge</p>
            <h1>Find your perfect pet without getting overwhelmed.</h1>
            <p className="subtitle">Quiz → local pets → AI match → contact shelter. Iwantapet ranks adoptable pets around you and explains each fit in plain English.</p>
            <div className="hero-actions">
              <button className="primary" onClick={startQuiz}>Find my perfect pet</button>
              <button className="secondary" onClick={() => openAuth()}>Sign in</button>
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
          {authPrompt && <p className="notice" role="status">{authPrompt}</p>}
          <form onSubmit={handleEmailLogin} className="form-grid">
            <label>Email address<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></label>
            <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" /></label>
            <button className="primary" type="submit">Sign in with email</button>
          </form>
          <button className="google" onClick={handleGoogleLogin}>Continue with Google</button>
          <p className="muted">If Firebase env vars are absent, local demo auth is used so tests and development need no API key.</p>
        </section>
      )}

      {view === 'settings' && (
        <section className="panel auth-panel">
          <p className="eyebrow">Account settings</p>
          <h2>Settings</h2>
          <p className="muted">Profile, notification, and shelter-contact preferences will live here. Logout is available from the account menu.</p>
        </section>
      )}

      {view === 'quiz' && user && (
        <section className="panel quiz-panel">
          <p className="eyebrow">Friendly onboarding</p>
          <p className="step-indicator">Step {quizStep} of {TOTAL_QUIZ_STEPS}</p>
          {error && <p className="error" role="alert">{error}</p>}
          <form className="questionnaire paged-questionnaire" onSubmit={submitQuestionnaire}>
            {renderQuizStep()}
            <div className="quiz-controls full">
              <button className="secondary" type="button" disabled={quizStep === 1} onClick={() => setQuizStep((step) => Math.max(1, step - 1))}>Back</button>
              {quizStep < TOTAL_QUIZ_STEPS ? (
                <button className="primary" type="button" onClick={() => setQuizStep((step) => Math.min(TOTAL_QUIZ_STEPS, step + 1))}>Next</button>
              ) : (
                <button className="primary" type="submit">Show my matches</button>
              )}
            </div>
          </form>
        </section>
      )}

      {view === 'dashboard' && (
        <section className="dashboard">
          <div className="dashboard-header">
            <div><p className="eyebrow">Dashboard</p><h2>Your best local matches</h2></div>
            {!submitted && <button className="secondary" onClick={startQuiz}>Complete questionnaire</button>}
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
