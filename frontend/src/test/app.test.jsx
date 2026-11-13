import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { AuthProvider } from '../context/AuthContext';

describe('Frontend UI & Component Unit Tests', () => {
  it('renders login form elements properly', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/LeaveFlow Portal/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@company.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('validates empty email and password submission on login', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('renders Badge component with correct status indicators', () => {
    const { rerender } = render(<Badge status="pending" />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();

    rerender(<Badge status="approved" />);
    expect(screen.getByText(/approved/i)).toBeInTheDocument();

    rerender(<Badge status="rejected" />);
    expect(screen.getByText(/rejected/i)).toBeInTheDocument();

    rerender(<Badge status="cancelled" />);
    expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
  });

  it('renders StatCard with title and numeric value', () => {
    render(
      <StatCard
        title="Total Allocated"
        value="24d"
        subtitle="Yearly Quota"
        color="blue"
      />
    );

    expect(screen.getByText(/Total Allocated/i)).toBeInTheDocument();
    expect(screen.getByText('24d')).toBeInTheDocument();
    expect(screen.getByText(/Yearly Quota/i)).toBeInTheDocument();
  });

  it('renders ConfirmDialog modal and handles callbacks', () => {
    const onConfirmMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        onClose={onCloseMock}
        onConfirm={onConfirmMock}
        title="Confirm Cancellation"
        message="Are you sure you want to cancel?"
        confirmText="Yes, Cancel"
        type="danger"
      />
    );

    expect(screen.getByText('Confirm Cancellation')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to cancel?')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Yes, Cancel/i });
    fireEvent.click(confirmBtn);
    expect(onConfirmMock).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: /^Cancel$/i });
    fireEvent.click(cancelBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
