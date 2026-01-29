import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Privacy from '@/pages/Privacy';

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Privacy Page', () => {
  it('should render the privacy policy page', () => {
    renderWithRouter(<Privacy />);

    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('should display last updated date', () => {
    renderWithRouter(<Privacy />);

    expect(screen.getByText(/Last Updated:/)).toBeInTheDocument();
  });

  it('should have a back button', () => {
    renderWithRouter(<Privacy />);

    expect(screen.getByRole('link', { name: /back to paperflow/i })).toBeInTheDocument();
  });

  it('should display privacy highlights', () => {
    renderWithRouter(<Privacy />);

    expect(screen.getByText('No Document Access')).toBeInTheDocument();
    expect(screen.getByText('Local Processing')).toBeInTheDocument();
    expect(screen.getByText('Local Storage Only')).toBeInTheDocument();
    expect(screen.getByText('Easy Data Deletion')).toBeInTheDocument();
  });

  it('should explain privacy-first approach', () => {
    renderWithRouter(<Privacy />);

    expect(screen.getByText('Our Privacy-First Approach')).toBeInTheDocument();
    expect(screen.getByText(/Your documents never leave your device/)).toBeInTheDocument();
  });

  it('should list information not collected', () => {
    renderWithRouter(<Privacy />);

    expect(screen.getByText('Information We Do NOT Collect')).toBeInTheDocument();
    expect(screen.getByText(/Document Content/)).toBeInTheDocument();
  });

  it('should explain local storage usage', () => {
    renderWithRouter(<Privacy />);

    expect(screen.getByText('Local Storage')).toBeInTheDocument();
    expect(screen.getByText(/IndexedDB/)).toBeInTheDocument();
  });

  it('should have link to terms of service', () => {
    renderWithRouter(<Privacy />);

    expect(screen.getByRole('link', { name: /terms of service/i })).toBeInTheDocument();
  });

  it('should have link to GitHub', () => {
    renderWithRouter(<Privacy />);

    const githubLinks = screen.getAllByRole('link', { name: /github/i });
    expect(githubLinks.length).toBeGreaterThan(0);
  });

  it('should mention open source', () => {
    renderWithRouter(<Privacy />);

    expect(screen.getByText('Open Source')).toBeInTheDocument();
  });

  it('should explain user rights', () => {
    renderWithRouter(<Privacy />);

    expect(screen.getByText('Your Rights')).toBeInTheDocument();
    // Check for the bold "Access" and "Delete" labels within the rights section
    const accessElements = screen.getAllByText(/Access/);
    const deleteElements = screen.getAllByText(/Delete/);
    expect(accessElements.length).toBeGreaterThan(0);
    expect(deleteElements.length).toBeGreaterThan(0);
  });
});
