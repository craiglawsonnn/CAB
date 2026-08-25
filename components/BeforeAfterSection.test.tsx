import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BeforeAfterSection from '@/components/BeforeAfterSection';
import { siteConfig } from '@/content/site';

describe('BeforeAfterSection', () => {
  it('renders one slider per pair', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfterPairs} />);
    expect(screen.getAllByRole('slider')).toHaveLength(siteConfig.beforeAfterPairs.length);
  });

  it('sets the section id to portfolio', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfterPairs} />);
    expect(document.getElementById('portfolio')).not.toBeNull();
  });

  it('renders every pair caption', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfterPairs} />);
    for (const pair of siteConfig.beforeAfterPairs) {
      expect(screen.getByText(pair.caption)).toBeInTheDocument();
    }
  });

  it('renders a view more button that expands the grid when there are more than three pairs', async () => {
    const user = userEvent.setup();
    render(<BeforeAfterSection pairs={siteConfig.beforeAfterPairs} />);
    const grid = screen.getAllByRole('slider')[0].closest('[class*="grid"]') as HTMLElement;

    expect(grid.className).not.toMatch(/expanded/);

    const button = screen.getByRole('button', { name: /view \d+ more/i });
    await user.click(button);

    expect(grid.className).toMatch(/expanded/);
    expect(screen.getByRole('button', { name: 'Show Fewer' })).toBeInTheDocument();
  });

  it('does not render a view more button when there are three or fewer pairs', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfterPairs.slice(0, 3)} />);
    expect(screen.queryByRole('button', { name: /view \d+ more/i })).toBeNull();
  });
});
