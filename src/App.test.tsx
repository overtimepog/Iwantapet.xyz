import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Iwantapet MVP UI', () => {
  it('shows a premium landing page and sends anonymous quiz starters to sign in first', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /find your perfect pet/i })).toBeInTheDocument();
    expect(screen.getByText(/quiz → local pets → ai match → contact shelter/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /find my perfect pet/i }));

    expect(screen.getByRole('heading', { name: /sign in to save matches/i })).toBeInTheDocument();
    expect(screen.getByText(/sign in before taking the quiz/i)).toBeInTheDocument();
  });

  it('supports Firebase email/password and Google sign-in entry points', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('opens an account dropdown from the signed-in user name with settings and logout options', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await userEvent.click(screen.getByRole('button', { name: /sign in with email/i }));

    expect(screen.queryByRole('menuitem', { name: /settings/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /log out/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /demo account menu/i }));

    expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /log out/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('menuitem', { name: /log out/i }));

    expect(screen.queryByRole('button', { name: /demo account menu/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /account/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /sign in to save matches/i })).toBeInTheDocument();
  });

  it('anchors the account dropdown directly under the username trigger', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles.css'), 'utf8');
    const accountMenuRule = css.match(/\.account-menu\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? '';

    expect(accountMenuRule).toContain('position: absolute');
    expect(accountMenuRule).toContain('top: calc(100% + .5rem)');
    expect(accountMenuRule).toContain('right: 0');
    expect(accountMenuRule).not.toContain('position: fixed');
  });

  it('keeps the account dropdown inside mobile viewports while staying attached to the username row', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles.css'), 'utf8');
    const mobileRule = css.match(/@media \(max-width: 760px\) \{[\s\S]*?\.account-menu\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? '';

    expect(mobileRule).toContain('left: 0');
    expect(mobileRule).toContain('right: auto');
  });

  it('shows the quiz as multiple-choice pages for signed-in users and supports None allergies', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await userEvent.click(screen.getByRole('button', { name: /sign in with email/i }));
    await userEvent.click(screen.getByRole('button', { name: /start quiz/i }));

    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /home basics/i })).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /apartment/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /household/i })).toBeInTheDocument();
    const allergies = within(screen.getByRole('group', { name: /allergies/i }));
    expect(allergies.getByRole('radio', { name: /^none$/i })).toBeChecked();

    await userEvent.click(allergies.getByRole('radio', { name: /dog dander/i }));
    expect(allergies.getByRole('radio', { name: /dog dander/i })).toBeChecked();

    await userEvent.click(allergies.getByRole('radio', { name: /^none$/i }));
    expect(allergies.getByRole('radio', { name: /^none$/i })).toBeChecked();
    expect(allergies.getByRole('radio', { name: /dog dander/i })).not.toBeChecked();
  });

  it('completes questionnaire, shows matches, saves a pet, and enforces outreach approval before simulated send', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await userEvent.click(screen.getByRole('button', { name: /sign in with email/i }));
    await userEvent.click(screen.getByRole('button', { name: /start quiz/i }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /show my matches/i }));

    expect(screen.getByText(/luna/i)).toBeInTheDocument();
    expect(screen.getByText(/match score/i)).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: /save pet/i })[0]);
    expect(screen.getByText(/saved/i)).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: /draft message/i })[0]);
    expect(screen.getByText(/awaiting approval/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send simulated contact/i })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /approve draft/i }));
    await userEvent.click(screen.getByRole('button', { name: /send simulated contact/i }));
    expect(screen.getByText(/sent simulated contact/i)).toBeInTheDocument();
  });
});
