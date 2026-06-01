// frontend/src/app/portfolio/PortfolioTable.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import PortfolioTable from './PortfolioTable';
import type { PortfolioEntry } from '@/lib/portfolio-grouping';

vi.mock('next/image', () => ({ default: (p: any) => <img alt={p.alt} src={typeof p.src === 'string' ? p.src : ''} /> }));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }));
// Isolate from Clerk/network — the accordion is tested elsewhere.
vi.mock('./../components/PurchaseAccordion', () => ({ default: () => <div data-testid="purchase-accordion" /> }));

const mk = (id: number, weaponType: string, marketPrice: number | null, name?: string): PortfolioEntry => ({
  amount: 1, avgPrice: 100, purchases: [{ id, amount: 1, buyPrice: 100, buyDate: '2026-01-01' }],
  skin: { id, name: name ?? `${weaponType} | S${id}`, marketHashName: '', slug: null, weaponSlug: null,
    imageUrl: null, marketPrice, rarity: 'Covert', weaponType, exterior: 'Field-Tested',
    priceChange24h: null, priceChange7d: null },
});

beforeEach(() => localStorage.clear());

describe('PortfolioTable', () => {
  it('shows the empty state when there are no skins', () => {
    render(<PortfolioTable skins={[]} watchlist={[]} onDataChange={() => {}} />);
    expect(screen.getByText(/No skins in your portfolio yet/i)).toBeInTheDocument();
  });

  it('renders one group per weapon with a subtotal, sorted by value', () => {
    render(<PortfolioTable skins={[mk(1, 'AK-47', 10), mk(2, 'AWP', 90)]} watchlist={[]} onDataChange={() => {}} />);
    // Group headers are the expanded buttons (chips have no aria-expanded; cards are collapsed).
    const headers = screen.getAllByRole('button', { expanded: true });
    expect(headers.length).toBeGreaterThanOrEqual(2);
    // AWP group header appears before AK-47 (higher value).
    expect(headers[0]).toHaveTextContent(/^AWP/);
    expect(headers[1]).toHaveTextContent(/^AK-47/);
  });

  it('routes no-price items into a collapsed "No market price" bucket', () => {
    render(<PortfolioTable skins={[mk(1, 'AK-47', 10), mk(2, 'AUG', null)]} watchlist={[]} onDataChange={() => {}} />);
    const bucket = screen.getByRole('button', { name: /No market price/i });
    expect(bucket).toHaveAttribute('aria-expanded', 'false');
    // AUG card hidden while collapsed
    expect(screen.queryByText('AUG | S2')).not.toBeInTheDocument();
  });

  it('clicking a card opens its purchase lots inline', () => {
    render(<PortfolioTable skins={[mk(1, 'AK-47', 10)]} watchlist={[]} onDataChange={() => {}} />);
    expect(screen.queryByTestId('purchase-accordion')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('AK-47 | S1'));
    expect(screen.getByTestId('purchase-accordion')).toBeInTheDocument();
  });

  it('weapon filter chip narrows to that weapon', () => {
    render(<PortfolioTable skins={[mk(1, 'AK-47', 10), mk(2, 'AWP', 90)]} watchlist={[]} onDataChange={() => {}} />);
    // The AK-47 chip carries its facet count ("AK-47 1"); group headers also include the subtotal.
    fireEvent.click(screen.getByRole('button', { name: 'AK-47 1' }));
    const headers = screen.getAllByRole('button', { expanded: true });
    expect(headers).toHaveLength(1);
    expect(headers[0]).toHaveTextContent(/^AK-47/);
    expect(headers[0]).not.toHaveTextContent(/AWP/);
  });

  it('search filters by name and shows the no-results state', () => {
    render(<PortfolioTable skins={[mk(1, 'AK-47', 10, 'AK-47 | Redline')]} watchlist={[]} onDataChange={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/Search skins/i), { target: { value: 'zzz' } });
    expect(screen.getByText(/No holdings for this filter/i)).toBeInTheDocument();
  });
});
