import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SettingsView } from '@/components/settings/SettingsView';
import { getColors } from '@/lib/theme';
import { T } from '@/lib/i18n';
import { repository } from '@/lib/repository';

jest.mock('lucide-react', () => ({ ShieldAlert: () => null, Database: () => null, Palette: () => null, Globe: () => null, User: () => null, Lock: () => null }));

jest.mock('@/lib/repository', () => ({ repository: { isCloudConnected: () => false, changePassword: jest.fn() } }));
const t = T.pl;
function setup(onDeleteAccount = jest.fn().mockResolvedValue(undefined)) {
  render(<SettingsView user={{ id: 'user', email: 'user@example.com' }} theme="dark" setTheme={jest.fn()} lang="pl" setLang={jest.fn()} onDeleteAccount={onDeleteAccount} onResetLocalData={jest.fn()} C={getColors('dark')} t={t} />);
}
function fillPasswords() {
  fireEvent.click(screen.getByRole('button', { name: t.changePasswordBtn }));
  fireEvent.change(screen.getByLabelText(t.currentPassword), { target: { value: 'old-password' } });
  fireEvent.change(screen.getByLabelText(t.newPassword), { target: { value: 'new-password' } });
  fireEvent.change(screen.getByLabelText(t.confirmPassword), { target: { value: 'new-password' } });
}

test('keeps the same focused input while typing multiple characters', () => {
  setup();
  fireEvent.click(screen.getByRole('button', { name: t.changePasswordBtn }));
  const input = screen.getByLabelText(t.currentPassword);
  input.focus();
  for (const value of ['a', 'ab', 'abc']) {
    fireEvent.change(input, { target: { value } });
    expect(screen.getByLabelText(t.currentPassword)).toBe(input);
    expect(input).toHaveFocus();
    expect(input).toHaveValue(value);
  }
});

test('submits a password change and shows success', async () => {
  jest.mocked(repository.changePassword).mockResolvedValue({ success: true, error: null });
  setup(); fillPasswords();
  fireEvent.submit(screen.getByLabelText(t.currentPassword).closest('form')!);
  await waitFor(() => expect(screen.getByText(t.passwordChanged)).toBeInTheDocument());
  expect(repository.changePassword).toHaveBeenCalledWith('old-password', 'new-password');
});

test('shows translated wrong-password feedback', async () => {
  jest.mocked(repository.changePassword).mockResolvedValue({ success: false, error: 'wrong', code: 'wrong_current' });
  setup(); fillPasswords();
  fireEvent.click(screen.getByRole('button', { name: t.changePasswordBtn }));
  await waitFor(() => expect(screen.getByText(t.wrongCurrentPassword)).toBeInTheDocument());
});

test('requires DELETE and displays deletion failures with a retry available', async () => {
  const remove = jest.fn().mockRejectedValue(new Error('Server unavailable'));
  setup(remove);
  fireEvent.click(screen.getByRole('button', { name: t.deleteAccount }));
  const submit = screen.getByRole('button', { name: t.deleteConfirmBtn });
  expect(submit).toBeDisabled();
  fireEvent.change(screen.getByPlaceholderText('DELETE'), { target: { value: 'DELETE' } });
  fireEvent.click(submit);
  expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable');
  expect(submit).not.toBeDisabled();
  expect(remove).toHaveBeenCalledTimes(1);
});
