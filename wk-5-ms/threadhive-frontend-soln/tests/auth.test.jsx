import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Login from '../src/pages/Auth/Login';
import Register from '../src/pages/Auth/Register';

describe('Auth Components', () => {
  describe('Login Component', () => {
    it('renders the login form fields', () => {
      render(<Login />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('logs email and password on submit', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      render(<Login />);
      await userEvent.type(screen.getByLabelText(/email/i), 'admin@gmail.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'admin123');
      await userEvent.click(screen.getByRole('button', { name: /login/i }));

      expect(logSpy).toHaveBeenCalledWith('Login Attempt:', {
        email: 'admin@gmail.com',
        password: 'admin123',
      });

      logSpy.mockRestore();
    });
  });

  describe('Register Component', () => {
    it('renders the register form fields', () => {
      render(<Register />);
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    it('logs the form data on submit', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      render(<Register />);
      await userEvent.type(screen.getByLabelText(/name/i), 'JohnDoe');
      await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /register/i }));

      expect(logSpy).toHaveBeenCalledWith('Register Attempt:', {
        name: 'JohnDoe',
        email: 'john@example.com',
        password: 'password123',
      });

      logSpy.mockRestore();
    });
  });
});