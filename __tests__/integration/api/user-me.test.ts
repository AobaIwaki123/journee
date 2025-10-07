import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/user/me/route';
import * as session from '@/lib/auth/session';

// Mock session module
vi.mock('@/lib/auth/session', () => ({
  getCurrentUser: vi.fn(),
}));

describe('GET /api/user/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user data when authenticated', async () => {
    const mockUser = {
      id: 'test-user-123',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
    };

    vi.mocked(session.getCurrentUser).mockResolvedValue(mockUser);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockUser);
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(session.getCurrentUser).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Unauthorized');
  });

  it('should handle session errors gracefully', async () => {
    vi.mocked(session.getCurrentUser).mockRejectedValue(
      new Error('Session error')
    );

    const response = await GET();

    expect(response.status).toBe(500);
  });
});