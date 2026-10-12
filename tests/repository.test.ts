import { repository } from '@/lib/repository';
import { getSupabaseClient } from '@/lib/supabase/client';

jest.mock('@/lib/supabase/client', () => ({
  ...jest.requireActual('@/lib/supabase/client'),
  getSupabaseClient: jest.fn(() => null),
}));
const mockClient = jest.mocked(getSupabaseClient);
const demo = () => repository.signIn('demo@gymapp.io', 'demo1234');

beforeEach(() => { localStorage.clear(); mockClient.mockReturnValue(null); });
afterEach(() => jest.restoreAllMocks());

test('rejects an incorrect current password without changing credentials', async () => {
  await demo();
  expect(await repository.changePassword('wrong', 'new-password')).toMatchObject({ success: false, code: 'wrong_current' });
  expect((await demo()).user).not.toBeNull();
});

test('changes password persistently and rejects the old password', async () => {
  await demo();
  expect(await repository.changePassword('demo1234', 'new-password')).toMatchObject({ success: true });
  await repository.signOut();
  expect((await demo()).user).toBeNull();
  expect((await repository.signIn('demo@gymapp.io', 'new-password')).user).not.toBeNull();
});

test('rejects short passwords', async () => {
  await demo();
  expect(await repository.changePassword('demo1234', '123')).toMatchObject({ code: 'too_short' });
});

test('reports browser storage failure instead of claiming password changed', async () => {
  await demo();
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceeded'); });
  await expect(repository.changePassword('demo1234', 'new-password')).rejects.toThrow('Nie można zapisać');
});

test('deletes the last local account without recreating the demo fallback', async () => {
  await demo();
  await repository.deleteAccount();
  expect(await repository.getInitialUser()).toBeNull();
  expect((await demo()).user).toBeNull();
  expect(JSON.parse(localStorage.getItem('gp_accounts')!)).toEqual([]);
});

test('isolates local accounts and removes only the deleted account data', async () => {
  const first = (await demo()).user!;
  localStorage.setItem(`gp_workouts_${first.id}`, '[1]');
  await repository.signUp('second@example.com', 'second-password');
  await repository.confirmLocalAccount('second@example.com');
  const second = (await repository.signIn('second@example.com', 'second-password')).user!;
  expect(second.id).not.toBe(first.id);
  for (const base of ['gp_workouts', 'gp_routines', 'gp_custom_exercises', 'gp_exercise_notes', 'gp_exercise_overrides', 'gp_hidden_routines', 'gp_active_workout']) {
    localStorage.setItem(`${base}_${second.id}`, '[2]');
  }
  await repository.deleteAccount();
  expect(localStorage.getItem(`gp_workouts_${first.id}`)).toBe('[1]');
  expect(Object.keys(localStorage).some((key) => key.endsWith(second.id))).toBe(false);
  expect((await repository.signIn('second@example.com', 'second-password')).user).toBeNull();
  expect((await demo()).user).not.toBeNull();
});

test('migrates the legacy current account without losing its data identity', async () => {
  localStorage.setItem('gp_accounts', JSON.stringify([{ email: 'old@example.com', password: 'old-password', confirmed: true }]));
  localStorage.setItem('gp_user', JSON.stringify({ id: 'demo-user-id', email: 'old@example.com' }));
  expect(await repository.getInitialUser()).toEqual({ id: 'demo-user-id', email: 'old@example.com' });
});

test('reset changes credentials and consumes the reset marker', async () => {
  await demo();
  await repository.resetPassword('demo@gymapp.io');
  expect(await repository.setNewPassword('reset-password')).toMatchObject({ success: true });
  expect(await repository.setNewPassword('another-password')).toMatchObject({ code: 'invalid' });
  expect((await repository.signIn('demo@gymapp.io', 'reset-password')).user).not.toBeNull();
});

test('verifies cloud current password before updating it', async () => {
  const updateUser = jest.fn();
  const signInWithPassword = jest.fn().mockResolvedValue({ error: { message: 'Invalid credentials' } });
  mockClient.mockReturnValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { email: 'a@example.com' } } }), signInWithPassword, updateUser } } as any);
  expect(await repository.changePassword('wrong', 'new-password')).toMatchObject({ code: 'wrong_current' });
  expect(updateUser).not.toHaveBeenCalled();
});

test('keeps a valid recovery session usable after a password-policy rejection', async () => {
  mockClient.mockReturnValue({ auth: { updateUser: jest.fn().mockResolvedValue({ error: { message: 'Password should be different' } }) } } as any);
  expect(await repository.setNewPassword('same-password')).toEqual({ success: false, error: 'Password should be different' });
});

test('does not sign out or remove local data when cloud deletion fails', async () => {
  const signOut = jest.fn();
  mockClient.mockReturnValue({ auth: { getSession: jest.fn().mockResolvedValue({ data: { session: { access_token: 'token', user: { id: 'cloud-user' } } } }), signOut } } as any);
  global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Unavailable' }) });
  localStorage.setItem('gp_active_workout_cloud-user', 'draft');
  await expect(repository.deleteAccount()).rejects.toThrow('Unavailable');
  expect(signOut).not.toHaveBeenCalled();
  expect(localStorage.getItem('gp_active_workout_cloud-user')).toBe('draft');
});

test('updates the cloud password only after successful verification', async () => {
  const updateUser = jest.fn().mockResolvedValue({ error: null });
  const signInWithPassword = jest.fn().mockResolvedValue({ error: null });
  mockClient.mockReturnValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { email: 'a@example.com' } } }), signInWithPassword, updateUser } } as any);
  expect(await repository.changePassword('old-password', 'new-password')).toEqual({ success: true, error: null });
  expect(signInWithPassword).toHaveBeenCalledWith({ email: 'a@example.com', password: 'old-password' });
  expect(updateUser).toHaveBeenCalledWith({ password: 'new-password' });
  expect(signInWithPassword.mock.invocationCallOrder[0]).toBeLessThan(updateUser.mock.invocationCallOrder[0]);
});

test('clears the cloud session and owned draft only after successful deletion', async () => {
  const signOut = jest.fn().mockResolvedValue({ error: null });
  mockClient.mockReturnValue({ auth: { getSession: jest.fn().mockResolvedValue({ data: { session: { access_token: 'token', user: { id: 'cloud-user' } } } }), signOut } } as any);
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  localStorage.setItem('gp_active_workout_cloud-user', 'draft');
  localStorage.setItem('gp_active_workout_another-user', 'another draft');
  await repository.deleteAccount();
  expect(fetch).toHaveBeenCalledWith('/api/account', { method: 'DELETE', headers: { Authorization: 'Bearer token' } });
  expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(localStorage.getItem('gp_active_workout_cloud-user')).toBeNull();
  expect(localStorage.getItem('gp_active_workout_another-user')).toBe('another draft');
});
