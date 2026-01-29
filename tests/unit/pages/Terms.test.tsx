import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Terms from '@/pages/Terms';

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Terms Page', () => {
  it('should render the terms of service page', () => {
    renderWithRouter(<Terms />);

    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
  });

  it('should display last updated date', () => {
    renderWithRouter(<Terms />);

    expect(screen.getByText(/Last Updated:/)).toBeInTheDocument();
  });

  it('should have a back button', () => {
    renderWithRouter(<Terms />);

    expect(screen.getByRole('link', { name: /back to paperflow/i })).toBeInTheDocument();
  });

  it('should display key points', () => {
    renderWithRouter(<Terms />);

    expect(screen.getByText('Free to Use')).toBeInTheDocument();
    expect(screen.getByText('Open Source')).toBeInTheDocument();
    expect(screen.getByText('Use Responsibly')).toBeInTheDocument();
  });

  it('should explain agreement to terms', () => {
    renderWithRouter(<Terms />);

    expect(screen.getByText('Agreement to Terms')).toBeInTheDocument();
  });

  it('should describe the service', () => {
    renderWithRouter(<Terms />);

    expect(screen.getByText('Description of Service')).toBeInTheDocument();
    expect(screen.getByText(/View PDF documents/)).toBeInTheDocument();
  });

  it('should list acceptable use', () => {
    renderWithRouter(<Terms />);

    expect(screen.getByText('Acceptable Use')).toBeInTheDocument();
  });

  it('should list prohibited use', () => {
    renderWithRouter(<Terms />);

    expect(screen.getByText('Prohibited Use')).toBeInTheDocument();
  });

  it('should explain user responsibilities', () => {
    renderWithRouter(<Terms />);

    expect(screen.getByText('User Responsibilities')).toBeInTheDocument();
    expect(screen.getByText('Document Ownership')).toBeInTheDocument();
    expect(screen.getByText('Local Processing')).toBeInTheDocument();
  });

  it('should mention intellectual property', () => {
    renderWithRouter(<Terms />);

    expect(screen.getByText('Intellectual Property')).toBeInTheDocument();
    expect(screen.getByText('Open Source License')).toBeInTheDocument();
  });

  it('should include disclaimer of warranties', () => {
    renderWithRouter(<Terms />);

    expect(screen.getByText('Disclaimer of Warranties')).toBeInTheDocument();
  });

  it('should include limitation of liability', () => {
    renderWithRouter(<Terms />);

    expect(screen.getByText('Limitation of Liability')).toBeInTheDocument();
  });

  it('should have link to privacy policy', () => {
    renderWithRouter(<Terms />);

    expect(screen.getByRole('link', { name: /privacy policy/i })).toBeInTheDocument();
  });

  it('should have link to GitHub', () => {
    renderWithRouter(<Terms />);

    const githubLinks = screen.getAllByRole('link', { name: /github/i });
    expect(githubLinks.length).toBeGreaterThan(0);
  });

  it('should explain changes to service', () => {
    renderWithRouter(<Terms />);

    expect(screen.getByText('Changes to Service')).toBeInTheDocument();
  });
});
