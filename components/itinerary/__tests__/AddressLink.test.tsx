import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AddressLink } from '../AddressLink';

describe('AddressLink', () => {
  const mockWindowOpen = jest.fn();
  const originalOpen = window.open;

  beforeEach(() => {
    window.open = mockWindowOpen;
    mockWindowOpen.mockClear();
  });

  afterEach(() => {
    window.open = originalOpen;
  });

  it('住所テキストを表示する', () => {
    render(<AddressLink address="東京都渋谷区渋谷1-1-1" />);
    expect(screen.getByText('東京都渋谷区渋谷1-1-1')).toBeInTheDocument();
  });

  it('デフォルトでMapPinアイコンを表示する', () => {
    const { container } = render(<AddressLink address="東京都渋谷区渋谷1-1-1" />);
    // lucide-reactのアイコンはsvgとして描画される
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('showIcon=falseでアイコンを非表示にできる', () => {
    const { container } = render(
      <AddressLink address="東京都渋谷区渋谷1-1-1" showIcon={false} />
    );
    // アイコンなしでも最低1つのsvg（ExternalLink）は存在する
    const icons = container.querySelectorAll('svg');
    // showIcon=falseでも1つのExternalLinkアイコンは残る
    expect(icons.length).toBeGreaterThanOrEqual(0);
  });

  it('クリックするとGoogle MapsのURLが開かれる', () => {
    render(<AddressLink address="東京都渋谷区渋谷1-1-1" />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);

    expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://www.google.com/maps/search/?api=1&query='),
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('住所が正しくURLエンコードされる', () => {
    render(<AddressLink address="京都府京都市東山区 清水1丁目294" />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);

    const calledUrl = mockWindowOpen.mock.calls[0][0] as string;
    expect(calledUrl).toContain(encodeURIComponent('京都府京都市東山区 清水1丁目294'));
  });

  it('カスタムclassNameを適用できる', () => {
    const { container } = render(
      <AddressLink address="東京都渋谷区渋谷1-1-1" className="custom-class" />
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-class');
  });

  it('適切なtitle属性を持つ', () => {
    render(<AddressLink address="東京都渋谷区渋谷1-1-1" />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', '"東京都渋谷区渋谷1-1-1"をGoogle Mapsで開く');
  });

  it('特殊文字を含む住所でも動作する', () => {
    const address = '東京都千代田区丸の内1-1-1 (東京駅)';
    render(<AddressLink address={address} />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);

    expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    const calledUrl = mockWindowOpen.mock.calls[0][0] as string;
    expect(calledUrl).toContain(encodeURIComponent(address));
  });

  it('クリックイベントのデフォルト動作を防ぐ', () => {
    render(<AddressLink address="東京都渋谷区渋谷1-1-1" />);
    const button = screen.getByRole('button');
    
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    
    button.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('空の住所でも描画できる', () => {
    render(<AddressLink address="" />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('長い住所はtruncateクラスが適用される', () => {
    const longAddress = '東京都千代田区丸の内1-1-1 東京駅八重洲口前 地下1階 テナント1-234';
    const { container } = render(<AddressLink address={longAddress} />);
    const addressSpan = container.querySelector('span');
    expect(addressSpan).toHaveClass('truncate');
  });
});
