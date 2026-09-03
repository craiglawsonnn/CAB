import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BeforeAfterSection from '@/components/BeforeAfterSection';
import { siteConfig } from '@/content/site';

const copyProps = {
  heading: siteConfig.beforeAfter.heading,
  subtitle: siteConfig.beforeAfter.subtitle,
  viewMoreTemplate: siteConfig.beforeAfter.viewMoreTemplate,
  showFewerLabel: siteConfig.beforeAfter.showFewerLabel,
  beforeTagLabel: siteConfig.beforeAfter.beforeTagLabel,
  afterTagLabel: siteConfig.beforeAfter.afterTagLabel,
  ariaLabelPrefix: siteConfig.beforeAfter.ariaLabelPrefix,
};

describe('BeforeAfterSection', () => {
  it('renders one slider per pair', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfter.pairs} {...copyProps} />);
    expect(screen.getAllByRole('slider')).toHaveLength(siteConfig.beforeAfter.pairs.length);
  });

  it('sets the section id to portfolio', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfter.pairs} {...copyProps} />);
    expect(document.getElementById('portfolio')).not.toBeNull();
  });

  it('renders the configured heading and subtitle', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfter.pairs} {...copyProps} />);
    expect(screen.getByRole('heading', { name: copyProps.heading })).toBeInTheDocument();
    expect(screen.getByText(copyProps.subtitle)).toBeInTheDocument();
  });

  it('renders every pair caption', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfter.pairs} {...copyProps} />);
    for (const pair of siteConfig.beforeAfter.pairs) {
      expect(screen.getByText(pair.caption)).toBeInTheDocument();
    }
  });

  it('renders a view more button that expands the grid when there are more than three pairs', async () => {
    const user = userEvent.setup();
    render(<BeforeAfterSection pairs={siteConfig.beforeAfter.pairs} {...copyProps} />);
    const grid = screen.getAllByRole('slider')[0].closest('[class*="grid"]') as HTMLElement;

    expect(grid.className).not.toMatch(/expanded/);

    const remaining = siteConfig.beforeAfter.pairs.length - 3;
    const expectedLabel = copyProps.viewMoreTemplate.replace('{count}', String(remaining));
    const button = screen.getByRole('button', { name: expectedLabel });
    await user.click(button);

    expect(grid.className).toMatch(/expanded/);
    expect(screen.getByRole('button', { name: copyProps.showFewerLabel })).toBeInTheDocument();
  });

  it('does not render a view more button when there are three or fewer pairs', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfter.pairs.slice(0, 3)} {...copyProps} />);
    expect(
      screen.queryByRole('button', { name: copyProps.viewMoreTemplate.replace('{count}', '') })
    ).toBeNull();
  });
});
