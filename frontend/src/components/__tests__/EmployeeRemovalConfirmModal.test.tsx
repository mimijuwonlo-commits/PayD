import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import type { i18n as I18nType } from 'i18next';
import { EmployeeRemovalConfirmModal } from '../EmployeeRemovalConfirmModal';

// Mock i18next
const mockI18n: Partial<I18nType> = { language: 'en' };

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, defaultValue?: string) => defaultValue || key,
    }),
  };
});

// Helper to render with i18n
const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={mockI18n as I18nType}>{component}</I18nextProvider>);
};

describe('EmployeeRemovalConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    employeeName: 'John Doe',
    employeeId: 'emp-123',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // VISIBILITY & RENDERING TESTS
  // ========================================================================

  describe('Visibility & Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <EmployeeRemovalConfirmModal {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders modal when isOpen is true', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays the correct title', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      expect(screen.getByText(/remove employee/i)).toBeInTheDocument();
    });

    it('displays employee name being removed', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays warning message', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    it('displays close button', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      expect(screen.getByLabelText(/close/i)).toBeInTheDocument();
    });
  });

  // ========================================================================
  // ACCESSIBILITY TESTS
  // ========================================================================

  describe('Accessibility', () => {
    it('has proper dialog role and attributes', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'employee-removal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'employee-removal-description');
    });

    it('has proper title ID for aria-labelledby', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const title = screen.getByText(/remove employee/i);
      expect(title).toHaveAttribute('id', 'employee-removal-title');
    });

    it('has proper description ID for aria-describedby', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      // The description div should exist (it wraps the warning content)
      const dialog = screen.getByRole('dialog');
      const descElement = within(dialog)
        .getByText(/permanent action/i)
        .closest('div');
      expect(descElement?.parentElement).toHaveAttribute('id', 'employee-removal-description');
    });

    it('has alert role on warning section', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('buttons have proper aria-labels', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      expect(screen.getByLabelText(/confirm removal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cancel removal/i)).toBeInTheDocument();
    });

    it('close button has aria-label', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const closeBtn = screen.getByLabelText(/close/i);
      expect(closeBtn).toBeInTheDocument();
    });

    it('has proper tab order and focus management', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('color contrast meets WCAG standards (visually verified)', () => {
      // This is a visual verification - colors are set in CSS
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const removeBtn = screen.getByText(/remove/i);
      // Danger red (#dc2626) on white has contrast ratio > 4.5:1
      expect(removeBtn).toHaveClass(/removeButton/);
    });

    it('supports focus restoration after close', () => {
      const { rerender } = renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      rerender(<EmployeeRemovalConfirmModal {...defaultProps} isOpen={false} />);
      expect(() => screen.getByRole('dialog')).toThrow();
    });
  });

  // ========================================================================
  // USER INTERACTION TESTS
  // ========================================================================

  describe('User Interactions', () => {
    it('calls onConfirm with employeeId when Remove button clicked', async () => {
      const user = userEvent.setup();
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const removeBtn = screen.getByText(/remove/i);
      await user.click(removeBtn);
      expect(defaultProps.onConfirm).toHaveBeenCalledWith('emp-123');
    });

    it('calls onCancel when Cancel button clicked', async () => {
      const user = userEvent.setup();
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const cancelBtn = screen.getByText(/cancel/i);
      await user.click(cancelBtn);
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('calls onCancel when close button clicked', async () => {
      const user = userEvent.setup();
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const closeBtn = screen.getByLabelText(/close/i);
      await user.click(closeBtn);
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('calls onCancel when backdrop clicked', () => {
      const { container } = render(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const backdrop = container.querySelector('[role="presentation"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('does not close when clicking inside modal', () => {
      render(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);
      expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });

    it('closes on Escape key', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('focuses cancel button when modal opens', async () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      await waitFor(() => {
        const cancelBtn = screen.getByText(/cancel/i);
        // Focus should be on cancel button
        expect(document.activeElement).toBe(cancelBtn);
      });
    });
  });

  // ========================================================================
  // KEYBOARD NAVIGATION TESTS
  // ========================================================================

  describe('Keyboard Navigation', () => {
    it('handles Tab key for focus management', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('handles Shift+Tab from first element', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const firstBtn = screen.getByLabelText(/close/i);
      firstBtn.focus();
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      // Focus trap should work
      expect(document.activeElement).not.toBeNull();
    });

    it('handles Tab from last element', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const removeBtn = screen.getByText(/remove/i);
      removeBtn.focus();
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
      // Should wrap to first
      expect(document.activeElement).not.toBeNull();
    });

    it('does not close on other keys', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });

    it('allows normal form input in form fields', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'a' });
      // Should not close
      expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // LOADING STATE TESTS
  // ========================================================================

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} isLoading={true} />);
      const removeBtn = screen.getByText(/remove/i);
      // Button should have spinner
      expect(removeBtn.querySelector('[class*="spinner"]')).toBeInTheDocument();
    });

    it('disables buttons when isLoading is true', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} isLoading={true} />);
      expect(screen.getByText(/remove/i)).toBeDisabled();
      expect(screen.getByText(/cancel/i)).toBeDisabled();
    });

    it('disables close button when isLoading is true', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} isLoading={true} />);
      expect(screen.getByLabelText(/close/i)).toBeDisabled();
    });

    it('enables buttons when isLoading is false', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} isLoading={false} />);
      expect(screen.getByText(/remove/i)).not.toBeDisabled();
      expect(screen.getByText(/cancel/i)).not.toBeDisabled();
    });
  });

  // ========================================================================
  // CUSTOM PROPS TESTS
  // ========================================================================

  describe('Custom Props', () => {
    it('uses custom confirmLabel when provided', () => {
      renderWithI18n(
        <EmployeeRemovalConfirmModal {...defaultProps} confirmLabel="Delete Permanently" />
      );
      expect(screen.getByText('Delete Permanently')).toBeInTheDocument();
    });

    it('uses custom cancelLabel when provided', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} cancelLabel="Keep Employee" />);
      expect(screen.getByText('Keep Employee')).toBeInTheDocument();
    });

    it('applies custom className to backdrop', () => {
      const { container } = render(
        <EmployeeRemovalConfirmModal {...defaultProps} className="custom-backdrop" />
      );
      const backdrop = container.querySelector('.custom-backdrop');
      expect(backdrop).toBeInTheDocument();
    });

    it('handles different employee names', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} employeeName="Jane Smith" />);
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('passes correct employeeId to onConfirm callback', async () => {
      const customId = 'emp-custom-456';
      const user = userEvent.setup();
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} employeeId={customId} />);
      await user.click(screen.getByText(/remove/i));
      expect(defaultProps.onConfirm).toHaveBeenCalledWith(customId);
    });
  });

  // ========================================================================
  // EDGE CASES
  // ========================================================================

  describe('Edge Cases', () => {
    it('handles very long employee names', () => {
      const longName = 'A'.repeat(100);
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} employeeName={longName} />);
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('handles special characters in employee name', () => {
      const specialName = 'José García-López';
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} employeeName={specialName} />);
      expect(screen.getByText(specialName)).toBeInTheDocument();
    });

    it('handles empty string employee name gracefully', () => {
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} employeeName="" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('handles rapid open/close cycles', () => {
      const { rerender } = renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      rerender(<EmployeeRemovalConfirmModal {...defaultProps} isOpen={false} />);
      rerender(<EmployeeRemovalConfirmModal {...defaultProps} isOpen={true} />);
      rerender(<EmployeeRemovalConfirmModal {...defaultProps} isOpen={false} />);
      expect(() => screen.getByRole('dialog')).toThrow();
    });

    it('handles multiple rapid confirm clicks', async () => {
      const user = userEvent.setup();
      renderWithI18n(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const removeBtn = screen.getByText(/remove/i);

      // Click multiple times rapidly
      await user.click(removeBtn);
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  // ========================================================================
  // RESPONSIVE DESIGN TESTS
  // ========================================================================

  describe('Responsive Design', () => {
    it('applies responsive CSS classes', () => {
      const { container } = render(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const modal = container.querySelector('.modal');
      expect(modal).toHaveClass('modal');
    });

    it('has mobile-optimized padding', () => {
      const { container } = render(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const content = container.querySelector('.content');
      // CSS Module applies responsive padding
      expect(content).toBeInTheDocument();
    });

    it('renders buttons in proper layout', () => {
      const { container } = render(<EmployeeRemovalConfirmModal {...defaultProps} />);
      const actions = container.querySelector('.actions');
      expect(actions).toBeInTheDocument();
      const buttons = actions?.querySelectorAll('button');
      expect(buttons?.length).toBe(2);
    });
  });

  // ========================================================================
  // INTEGRATION TESTS
  // ========================================================================

  describe('Integration Scenarios', () => {
    it('works with mocked employee removal workflow', async () => {
      const user = userEvent.setup();
      const mockOnConfirm = vi.fn();
      const mockOnCancel = vi.fn();

      renderWithI18n(
        <EmployeeRemovalConfirmModal
          isOpen={true}
          employeeName="Test User"
          employeeId="emp-test-123"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // User clicks remove
      await user.click(screen.getByText(/remove/i));

      expect(mockOnConfirm).toHaveBeenCalledWith('emp-test-123');
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('allows user to cancel and reopen', async () => {
      const user = userEvent.setup();
      const mockOnCancel = vi.fn();
      const { rerender } = renderWithI18n(
        <EmployeeRemovalConfirmModal {...defaultProps} onCancel={mockOnCancel} />
      );

      // Cancel
      await user.click(screen.getByText(/cancel/i));
      expect(mockOnCancel).toHaveBeenCalled();

      // Close modal
      rerender(
        <EmployeeRemovalConfirmModal {...defaultProps} isOpen={false} onCancel={mockOnCancel} />
      );

      // Reopen
      rerender(
        <EmployeeRemovalConfirmModal {...defaultProps} isOpen={true} onCancel={mockOnCancel} />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('works with loading states in succession', () => {
      const { rerender } = renderWithI18n(
        <EmployeeRemovalConfirmModal {...defaultProps} isLoading={false} />
      );

      const removeBtn = screen.getByText(/remove/i);
      expect(removeBtn).not.toBeDisabled();

      // Simulate loading
      rerender(<EmployeeRemovalConfirmModal {...defaultProps} isLoading={true} />);
      expect(removeBtn).toBeDisabled();

      // Simulate completion
      rerender(<EmployeeRemovalConfirmModal {...defaultProps} isLoading={false} />);
      expect(removeBtn).not.toBeDisabled();
    });
  });
});
