/**
 * ConversationManager のテスト
 */

import { ConversationManager } from '../conversation-manager';
import type { ChatMessage } from '@/types/chat';

describe('ConversationManager', () => {
  test('初期化時に質問キューが設定される', () => {
    const manager = new ConversationManager('collecting_detailed');
    const nextQuestion = manager.getNextQuestion();
    
    expect(nextQuestion).not.toBeNull();
    expect(nextQuestion?.category).toBe('travelers');
  });
  
  test('抽出情報を更新できる', () => {
    const manager = new ConversationManager('collecting_detailed');
    
    manager.updateCache({
      destination: '京都',
      duration: 3,
    });
    
    const hint = manager.getPromptHint();
    expect(hint.extractedInfo.destination).toBe('京都');
    expect(hint.extractedInfo.duration).toBe(3);
  });
  
  test('質問を質問済みとしてマークできる', () => {
    const manager = new ConversationManager('collecting_detailed');
    
    const firstQuestion = manager.getNextQuestion();
    expect(firstQuestion?.category).toBe('travelers');
    
    manager.markAsAsked('travelers');
    
    const secondQuestion = manager.getNextQuestion();
    expect(secondQuestion?.category).toBe('interests');
  });
  
  test('充足度を正しく計算する', () => {
    const manager = new ConversationManager('collecting_detailed', {
      destination: '京都',
      duration: 3,
      travelers: { count: 2, type: 'couple' },
      interests: ['寺社巡り', 'グルメ'],
    });
    
    const status = manager.calculateCompletionStatus();
    
    expect(status.requiredFilled).toBe(true);
    expect(status.optionalFilled).toBe(2); // travelers, interests
    expect(status.completionRate).toBeGreaterThan(0);
  });
  
  test('全質問完了を検出できる', () => {
    const manager = new ConversationManager('collecting_detailed');
    
    expect(manager.allQuestionsAsked()).toBe(false);
    
    // 全質問をマーク
    manager.markAsAsked('travelers');
    manager.markAsAsked('interests');
    manager.markAsAsked('specific_spots');
    manager.markAsAsked('budget');
    manager.markAsAsked('pace');
    manager.markAsAsked('meal_preferences');
    manager.markAsAsked('accommodation');
    
    expect(manager.allQuestionsAsked()).toBe(true);
  });
  
  test('チャット履歴から質問済みを推定できる', () => {
    const manager = new ConversationManager('collecting_detailed');
    
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '誰と行かれますか？',
        timestamp: new Date(),
      },
      {
        id: '2',
        role: 'user',
        content: '彼女と二人です',
        timestamp: new Date(),
      },
    ];
    
    manager.loadAskedQuestionsFromHistory(messages);
    
    const nextQuestion = manager.getNextQuestion();
    expect(nextQuestion?.category).not.toBe('travelers');
  });
});
