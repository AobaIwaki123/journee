import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AddressLink } from '../AddressLink';

describe('AddressLink', () => {
  // window.openのモック
  const mockWindowOpen = jest.fn();
  
  beforeEach(() => {
    // window.openをモック
    global.window.open = mockWindowOpen;
    mockWindowOpen.mockClear();
  });

  it('住所テキストとMapPinアイコンが表示される', () => {
    const address = '東京都渋谷区道玄坂1-2-3';
    render(<AddressLink address={address} />);
    
    // 住所テキストが表示される
    expect(screen.getByText(address)).toBeInTheDocument();
    
    // MapPinアイコンが表示される（SVG要素として）
    const link = screen.getByRole('link');
    const svg = link.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('Google Maps検索URLが正しく生成される', () => {
    const address = '京都府京都市東山区清水1-294';
    render(<AddressLink address={address} />);
    
    const link = screen.getByRole('link');
    const href = link.getAttribute('href');
    
    // URLの基本構造を確認
    expect(href).toContain('https://www.google.com/maps/search/');
    expect(href).toContain('api=1');
    expect(href).toContain('query=');
    
    // 住所がURLエンコードされていることを確認
    expect(href).toContain(encodeURIComponent(address));
  });

  it('特殊文字を含む住所が正しくエンコードされる', () => {
    const address = '東京都 & 渋谷区 #1-2-3';
    render(<AddressLink address={address} />);
    
    const link = screen.getByRole('link');
    const href = link.getAttribute('href');
    
    // 特殊文字がエンコードされている
    expect(href).toContain(encodeURIComponent(address));
    expect(href).not.toContain('&');
    expect(href).not.toContain('#');
  });

  it('target="_blank"とrel="noopener noreferrer"が設定されている', () => {
    const address = '大阪府大阪市北区梅田1-1-1';
    render(<AddressLink address={address} />);
    
    const link = screen.getByRole('link');
    
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('titleアトリビュートに適切なテキストが設定されている', () => {
    const address = '北海道札幌市中央区北1条西2丁目';
    render(<AddressLink address={address} />);
    
    const link = screen.getByRole('link');
    const title = link.getAttribute('title');
    
    expect(title).toContain('Google Maps');
    expect(title).toContain(address);
  });

  it('クリック時にwindow.openが呼ばれる', () => {
    const address = '福岡県福岡市博多区博多駅前1-1-1';
    render(<AddressLink address={address} />);
    
    const link = screen.getByRole('link');
    fireEvent.click(link);
    
    // window.openが呼ばれた
    expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    
    // 正しいURLで呼ばれた
    const calledUrl = mockWindowOpen.mock.calls[0][0];
    expect(calledUrl).toContain('google.com/maps/search');
    expect(calledUrl).toContain(encodeURIComponent(address));
    
    // セキュリティオプションが設定されている
    expect(mockWindowOpen.mock.calls[0][1]).toBe('_blank');
    expect(mockWindowOpen.mock.calls[0][2]).toBe('noopener,noreferrer');
  });

  it('カスタムclassNameが適用される', () => {
    const address = '沖縄県那覇市久茂地1-1-1';
    const customClass = 'custom-address-class';
    render(<AddressLink address={address} className={customClass} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveClass(customClass);
    
    // デフォルトのクラスも保持されている
    expect(link).toHaveClass('flex');
    expect(link).toHaveClass('items-center');
  });

  it('hover時にスタイルが変化する（CSSクラスを確認）', () => {
    const address = '愛知県名古屋市中村区名駅1-1-1';
    render(<AddressLink address={address} />);
    
    const link = screen.getByRole('link');
    
    // hoverスタイル用のクラスが含まれている
    expect(link.className).toContain('hover:text-blue-600');
    expect(link.className).toContain('hover:underline');
  });

  it('空の住所でもエラーなくレンダリングされる', () => {
    const address = '';
    render(<AddressLink address={address} />);
    
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    
    // 空の住所でもURLは生成される
    const href = link.getAttribute('href');
    expect(href).toContain('google.com/maps/search');
  });

  it('長い住所も正しく表示される（truncate処理）', () => {
    const longAddress = '東京都千代田区霞が関1-1-1 中央合同庁舎第1号館 1階 A号室';
    render(<AddressLink address={longAddress} />);
    
    const link = screen.getByRole('link');
    const addressSpan = link.querySelector('span');
    
    expect(addressSpan).toBeInTheDocument();
    expect(addressSpan).toHaveClass('truncate');
    expect(screen.getByText(longAddress)).toBeInTheDocument();
  });
});
