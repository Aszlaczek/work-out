/** @jest-environment node */
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DELETE } from '@/app/api/account/route';

jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));
const getUser = jest.fn();
const deleteUser = jest.fn();
const request = (token?: string) => new NextRequest('http://localhost/api/account', {
  method: 'DELETE', headers: token ? { authorization: `Bearer ${token}` } : {},
  body: JSON.stringify({ userId: 'somebody-else' }),
});

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-server-key';
  jest.mocked(createClient).mockReturnValue({ auth: { getUser, admin: { deleteUser } } } as any);
  getUser.mockResolvedValue({ data: { user: { id: 'verified-user' } }, error: null });
  deleteUser.mockResolvedValue({ error: null });
});

test('rejects missing authorization', async () => {
  expect((await DELETE(request())).status).toBe(401);
  expect(deleteUser).not.toHaveBeenCalled();
});

test('rejects expired or forged bearer tokens', async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid JWT' } });
  expect((await DELETE(request('invalid'))).status).toBe(401);
  expect(deleteUser).not.toHaveBeenCalled();
});

test('deletes only the verified caller, ignoring user IDs in the body', async () => {
  expect((await DELETE(request('valid'))).status).toBe(204);
  expect(getUser).toHaveBeenCalledWith('valid');
  expect(deleteUser).toHaveBeenCalledWith('verified-user');
});

test('fails visibly when the server key is missing', async () => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  expect((await DELETE(request('valid'))).status).toBe(503);
  expect(deleteUser).not.toHaveBeenCalled();
});

test('does not report success on an Auth deletion error', async () => {
  deleteUser.mockResolvedValue({ error: { message: 'database failure' } });
  expect((await DELETE(request('valid'))).status).toBe(500);
});

test('handles network failure without exposing infrastructure errors', async () => {
  getUser.mockRejectedValue(new Error('sensitive internal error'));
  const response = await DELETE(request('valid'));
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('sensitive');
});
