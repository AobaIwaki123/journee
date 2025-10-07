import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('should return health status with ok status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'ok');
  });

  it('should return service name', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('service', 'Journee API');
  });

  it('should return version', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('version');
    expect(data.version).toBe('1.0.0');
  });

  it('should return timestamp in ISO format', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('timestamp');
    expect(() => new Date(data.timestamp)).not.toThrow();
    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should return environment', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('environment');
    expect(['development', 'production', 'test']).toContain(data.environment);
  });

  it('should have correct response headers', async () => {
    const response = await GET();

    expect(response.headers.get('content-type')).toContain('application/json');
  });
});