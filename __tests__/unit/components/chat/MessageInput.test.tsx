import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '@/components/chat/MessageInput';
import { useStore } from '@/lib/store/useStore';

// Mock the store
vi.mock('@/lib/store/useStore', () => ({
  useStore: vi.fn(),
}));

// Mock the API client
vi.mock('@/lib/utils/api-client', () => ({
  sendChatMessageStream: vi.fn(async function* () {
    yield { type: 'message', content: 'Test response' };
    yield { type: 'done' };
  }),
}));

describe('MessageInput', () => {
  const mockAddMessage = vi.fn();
  const mockSetLoading = vi.fn();
  const mockSetStreaming = vi.fn();
  const mockSetStreamingMessage = vi.fn();
  const mockAppendStreamingMessage = vi.fn();
  const mockSetItinerary = vi.fn();
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock store state
    vi.mocked(useStore).mockImplementation((selector: any) => {
      const state = {
        messages: [],
        isLoading: false,
        isStreaming: false,
        addMessage: mockAddMessage,
        setLoading: mockSetLoading,
        setStreaming: mockSetStreaming,
        setStreamingMessage: mockSetStreamingMessage,
        appendStreamingMessage: mockAppendStreamingMessage,
        currentItinerary: null,
        setItinerary: mockSetItinerary,
        selectedAI: 'gemini' as const,
        claudeApiKey: '',
        setError: mockSetError,
      };
      return selector(state);
    });
  });

  it('should render input field and send button', () => {
    render(<MessageInput />);
    
    expect(screen.getByPlaceholderText('メッセージを入力...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should update input value when typing', async () => {
    const user = userEvent.setup();
    render(<MessageInput />);
    
    const input = screen.getByPlaceholderText('メッセージを入力...');
    await user.type(input, 'Test message');
    
    expect(input).toHaveValue('Test message');
  });

  it('should submit message on form submit', async () => {
    const user = userEvent.setup();
    render(<MessageInput />);
    
    const input = screen.getByPlaceholderText('メッセージを入力...');
    await user.type(input, 'Hello');
    
    const form = input.closest('form');
    expect(form).toBeInTheDocument();
    
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(mockAddMessage).toHaveBeenCalled();
    });
  });

  it('should not submit when message is empty', async () => {
    render(<MessageInput />);
    
    const form = screen.getByPlaceholderText('メッセージを入力...').closest('form');
    
    if (form) {
      fireEvent.submit(form);
    }
    
    // Wait a bit to ensure addMessage is not called
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockAddMessage).not.toHaveBeenCalled();
  });

  it('should disable input and button when loading', () => {
    vi.mocked(useStore).mockImplementation((selector: any) => {
      const state = {
        messages: [],
        isLoading: true,
        isStreaming: false,
        addMessage: mockAddMessage,
        setLoading: mockSetLoading,
        setStreaming: mockSetStreaming,
        setStreamingMessage: mockSetStreamingMessage,
        appendStreamingMessage: mockAppendStreamingMessage,
        currentItinerary: null,
        setItinerary: mockSetItinerary,
        selectedAI: 'gemini' as const,
        claudeApiKey: '',
        setError: mockSetError,
      };
      return selector(state);
    });

    render(<MessageInput />);
    
    const input = screen.getByPlaceholderText('メッセージを入力...');
    const button = screen.getByRole('button');
    
    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('should disable input and button when streaming', () => {
    vi.mocked(useStore).mockImplementation((selector: any) => {
      const state = {
        messages: [],
        isLoading: false,
        isStreaming: true,
        addMessage: mockAddMessage,
        setLoading: mockSetLoading,
        setStreaming: mockSetStreaming,
        setStreamingMessage: mockSetStreamingMessage,
        appendStreamingMessage: mockAppendStreamingMessage,
        currentItinerary: null,
        setItinerary: mockSetItinerary,
        selectedAI: 'gemini' as const,
        claudeApiKey: '',
        setError: mockSetError,
      };
      return selector(state);
    });

    render(<MessageInput />);
    
    const input = screen.getByPlaceholderText('メッセージを入力...');
    const button = screen.getByRole('button');
    
    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('should clear input after successful submit', async () => {
    const user = userEvent.setup();
    render(<MessageInput />);
    
    const input = screen.getByPlaceholderText('メッセージを入力...') as HTMLInputElement;
    await user.type(input, 'Test message');
    
    const form = input.closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });
});