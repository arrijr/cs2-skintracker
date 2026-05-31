import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportPreviewModal } from '../ImportPreviewModal';

// Mock the data hook so we drive preview()/importNow() behaviour directly —
// no Clerk, no network. This isolates the modal's rendering logic, which is
// the actual fix (the private-inventory guided card + retry).
const preview = vi.fn();
const importNow = vi.fn();
vi.mock('@/hooks/useSteamConnection', () => ({
  useSteamConnection: () => ({ preview, importNow }),
}));

const PRIVATE_ERR =
  'Steam inventory is private. Set inventory privacy to Public temporarily and retry.';

beforeEach(() => {
  preview.mockReset();
  importNow.mockReset();
});

describe('ImportPreviewModal — private-inventory guard', () => {
  it('renders the guided privacy card with a deep link to the user’s settings + retry', async () => {
    preview.mockRejectedValueOnce(new Error(PRIVATE_ERR));

    render(<ImportPreviewModal steamId="76561198120450919" onClose={() => {}} />);

    expect(await screen.findByText('Dein Steam-Inventar ist privat')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Steam-Privatsphäre öffnen/i });
    expect(link).toHaveAttribute(
      'href',
      'https://steamcommunity.com/profiles/76561198120450919/edit/settings',
    );
    expect(screen.getByRole('button', { name: /Erneut versuchen/i })).toBeInTheDocument();
  });

  it('retry re-invokes preview and shows the cost-basis step on success', async () => {
    preview
      .mockRejectedValueOnce(new Error(PRIVATE_ERR))
      .mockResolvedValueOnce({
        totals: { fetched: 12, matched: 5, skipped: 7 },
        matched: [],
        skipped: [],
      });

    render(<ImportPreviewModal steamId="123" onClose={() => {}} />);

    const retry = await screen.findByRole('button', { name: /Erneut versuchen/i });
    fireEvent.click(retry);

    expect(await screen.findByText(/How do you want to set cost basis/i)).toBeInTheDocument();
    expect(preview).toHaveBeenCalledTimes(2);
  });

  it('falls back to /my/edit/settings when no steamId is known', async () => {
    preview.mockRejectedValueOnce(new Error('inventory is private'));

    render(<ImportPreviewModal steamId={null} onClose={() => {}} />);

    const link = await screen.findByRole('link', { name: /Steam-Privatsphäre öffnen/i });
    expect(link).toHaveAttribute('href', 'https://steamcommunity.com/my/edit/settings');
  });

  it('shows plain error text (not the privacy card) for non-privacy failures', async () => {
    preview.mockRejectedValueOnce(new Error('Steam 502 after 3 attempts'));

    render(<ImportPreviewModal steamId="123" onClose={() => {}} />);

    expect(await screen.findByText('Steam 502 after 3 attempts')).toBeInTheDocument();
    expect(screen.queryByText('Dein Steam-Inventar ist privat')).not.toBeInTheDocument();
  });
});
