import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Header from '../../../src/components/Header/Header';

describe('Header Component', () => {
  it('renders the logo', () => {
    render(<Header onNavigate={vi.fn()} darkMode={false} onToggleDarkMode={vi.fn()} />);
    expect(screen.getByText('ThreadHive')).toBeInTheDocument();
  });

  it('shows login and register buttons when not authenticated', () => {
    render(<Header onNavigate={vi.fn()} darkMode={false} onToggleDarkMode={vi.fn()} />);
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('calls onNavigate with "login" when login button is clicked', async () => {
    const mockNavigate = vi.fn();
    render(<Header onNavigate={mockNavigate} darkMode={false} onToggleDarkMode={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(mockNavigate).toHaveBeenCalledWith('login');
  });

  it('calls onNavigate with "register" when register button is clicked', async () => {
    const mockNavigate = vi.fn();
    render(<Header onNavigate={mockNavigate} darkMode={false} onToggleDarkMode={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(mockNavigate).toHaveBeenCalledWith('register');
  });

  it('renders dark mode toggle button', () => {
    render(<Header onNavigate={vi.fn()} darkMode={false} onToggleDarkMode={vi.fn()} />);
    expect(screen.getByLabelText(/toggle dark mode/i)).toBeInTheDocument();
  });

  it('displays moon emoji when dark mode is off', () => {
    render(<Header onNavigate={vi.fn()} darkMode={false} onToggleDarkMode={vi.fn()} />);
    expect(screen.getByLabelText(/toggle dark mode/i)).toHaveTextContent('🌙');
  });

  it('displays sun emoji when dark mode is on', () => {
    render(<Header onNavigate={vi.fn()} darkMode={true} onToggleDarkMode={vi.fn()} />);
    expect(screen.getByLabelText(/toggle dark mode/i)).toHaveTextContent('☀️');
  });

  it('calls onToggleDarkMode when dark mode button is clicked', async () => {
    const mockToggle = vi.fn();
    render(<Header onNavigate={vi.fn()} darkMode={false} onToggleDarkMode={mockToggle} />);

    await userEvent.click(screen.getByLabelText(/toggle dark mode/i));
    expect(mockToggle).toHaveBeenCalled();
  });
});
