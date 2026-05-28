import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Iwantapet MVP UI', () => {
  it('shows a premium landing page and starts the quiz from the CTA', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /find your perfect pet/i })).toBeInTheDocument();
    expect(screen.getByText(/quiz → local pets → ai match → contact shelter/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /find my perfect pet/i }));

    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
    expect(screen.getByText(/lifestyle questionnaire/i)).toBeInTheDocument();
  });

  it('supports Firebase email/password and Google sign-in entry points', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('completes questionnaire, shows matches, saves a pet, and enforces outreach approval before simulated send', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /find my perfect pet/i }));
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
