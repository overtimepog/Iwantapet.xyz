import { render, screen } from '@testing-library/react';
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

  it('shows the quiz as multiple-choice pages for signed-in users', async () => {
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
