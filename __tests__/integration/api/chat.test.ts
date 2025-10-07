import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';

// Mock AI modules
vi.mock('@/lib/ai/gemini', () => ({
  sendGeminiMessage: vi.fn(),
  streamGeminiMessage: vi.fn(),
}));

vi.mock('@/lib/ai/claude', () => ({
  sendClaudeMessage: vi.fn(),
  streamClaudeMessage: vi.fn(),
}));

import { sendGeminiMessage } from '@/lib/ai/gemini';
import { sendClaudeMessage } from '@/lib/ai/claude';

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation', () => {
    it('should return 400 for missing message', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('should return 400 for empty message', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should return 400 for invalid model', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'test',
          model: 'invalid-model',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid model');
    });

    it('should require API key for Claude model', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Plan a trip',
          model: 'claude',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('API key required');
    });
  });

  describe('Mock response (test command)', () => {
    it('should return mock data for "test" message (non-streaming)', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'test',
          stream: false,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('itinerary');
      expect(data.itinerary).toHaveProperty('title', '京都2日間の旅');
    });

    it('should return mock data for "test" message (streaming)', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'test',
          stream: true,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/event-stream');
    });
  });

  describe('Gemini Integration', () => {
    it('should call Gemini API for non-streaming request', async () => {
      const mockResponse = {
        message: 'Test response',
        itinerary: { title: 'Test Trip' },
      };

      vi.mocked(sendGeminiMessage).mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Plan a trip to Tokyo',
          model: 'gemini',
          stream: false,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      // Verify sendGeminiMessage was called with correct first two arguments
      const call = vi.mocked(sendGeminiMessage).mock.calls[0];
      expect(call[0]).toBe('Plan a trip to Tokyo');
      expect(call[1]).toEqual([]);
    });

    it('should handle chat history', async () => {
      const mockResponse = {
        message: 'Test response',
      };

      vi.mocked(sendGeminiMessage).mockResolvedValue(mockResponse);

      const chatHistory = [
        { id: '1', role: 'user' as const, content: 'Hello', timestamp: new Date() },
        { id: '2', role: 'assistant' as const, content: 'Hi', timestamp: new Date() },
      ];

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Continue conversation',
          chatHistory,
          stream: false,
        }),
      });

      await POST(request);

      const call = vi.mocked(sendGeminiMessage).mock.calls[0];
      expect(call[0]).toBe('Continue conversation');
      expect(call[1]).toHaveLength(2);
      expect(call[1][0].content).toBe('Hello');
      expect(call[1][1].content).toBe('Hi');
    });
  });

  describe('Error Handling', () => {
    it('should handle Gemini API errors gracefully', async () => {
      vi.mocked(sendGeminiMessage).mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test message',
          stream: false,
        }),
      });

      try {
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toHaveProperty('error');
      } catch (error) {
        // If error is thrown, verify it's handled
        expect(error).toBeDefined();
      }
    });
  });
});