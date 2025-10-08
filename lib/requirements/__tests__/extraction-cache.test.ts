/**
 * extraction-cache のテスト
 */

import {
  extractInformationFromMessage,
  mergeExtractionCache,
} from '../extraction-cache';
import type { ChatMessage } from '@/types/chat';
import type { ExtractionCache } from '../../ai/conversation-manager';

describe('extractInformationFromMessage', () => {
  test('行き先と日数を抽出できる', () => {
    const message = '京都に3日間行きたいです';
    const chatHistory: ChatMessage[] = [];
    
    const extracted = extractInformationFromMessage(message, chatHistory);
    
    expect(extracted.destination).toBe('京都');
    expect(extracted.duration).toBe(3);
  });
  
  test('同行者情報を抽出できる', () => {
    const message = '彼女と二人で行きます';
    const chatHistory: ChatMessage[] = [];
    
    const extracted = extractInformationFromMessage(message, chatHistory);
    
    expect(extracted.travelers).toBeDefined();
    expect(extracted.travelers?.count).toBe(2);
    expect(extracted.travelers?.type).toBe('couple');
  });
  
  test('興味を抽出できる', () => {
    const message = '寺社巡りとグルメを楽しみたいです';
    const chatHistory: ChatMessage[] = [];
    
    const extracted = extractInformationFromMessage(message, chatHistory);
    
    expect(extracted.interests).toBeDefined();
    expect(extracted.interests).toContain('history');
    expect(extracted.interests).toContain('gourmet');
  });
  
  test('予算を抽出できる', () => {
    const message = '予算は5万円くらいです';
    const chatHistory: ChatMessage[] = [];
    
    const extracted = extractInformationFromMessage(message, chatHistory);
    
    expect(extracted.budget).toBe(50000);
  });
  
  test('ペースを抽出できる', () => {
    const message = 'のんびりした旅行がいいです';
    const chatHistory: ChatMessage[] = [];
    
    const extracted = extractInformationFromMessage(message, chatHistory);
    
    expect(extracted.pace).toBe('のんびり');
  });
});

describe('mergeExtractionCache', () => {
  test('既存のキャッシュと新規データをマージできる', () => {
    const existing: ExtractionCache = {
      destination: '京都',
      duration: 3,
      interests: ['history'],
    };
    
    const newData: Partial<ExtractionCache> = {
      travelers: { count: 2, type: 'couple' },
      interests: ['gourmet'],
    };
    
    const merged = mergeExtractionCache(existing, newData);
    
    expect(merged.destination).toBe('京都');
    expect(merged.duration).toBe(3);
    expect(merged.travelers).toEqual({ count: 2, type: 'couple' });
    expect(merged.interests).toContain('history');
    expect(merged.interests).toContain('gourmet');
  });
  
  test('配列の重複を除去する', () => {
    const existing: ExtractionCache = {
      interests: ['history', 'gourmet'],
    };
    
    const newData: Partial<ExtractionCache> = {
      interests: ['gourmet', 'nature'],
    };
    
    const merged = mergeExtractionCache(existing, newData);
    
    expect(merged.interests).toHaveLength(3);
    expect(merged.interests).toContain('history');
    expect(merged.interests).toContain('gourmet');
    expect(merged.interests).toContain('nature');
  });
});
