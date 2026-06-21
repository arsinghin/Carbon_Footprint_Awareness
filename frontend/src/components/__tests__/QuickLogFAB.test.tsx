import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import QuickLogFAB from '../QuickLogFAB';

const mockLogActivity = vi.fn();

vi.mock('../../context/AppContext.tsx', () => ({
  useApp: () => ({ logActivity: mockLogActivity }),
}));

describe('QuickLogFAB', () => {
  it('opens a dialog with labelled form controls when the user starts logging', () => {
    render(<QuickLogFAB />);

    fireEvent.click(screen.getByRole('button', { name: /quick log activity/i }));

    expect(screen.getByRole('dialog', { name: /log activity/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /log transit activity/i }));

    expect(screen.getByLabelText(/mode of transit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/distance/i)).toBeInTheDocument();
  });
});
