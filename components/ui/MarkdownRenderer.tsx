/**
 * Markdownレンダリングコンポーネント
 * react-markdownを使用したコンテンツ表示
 */

'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { MARKDOWN_COMPONENTS } from '@/lib/constants/markdown-components';

interface MarkdownRendererProps {
  /** 表示するMarkdownコンテンツ */
  content: string;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * Markdownコンテンツをレンダリング
 * 
 * @example
 * ```tsx
 * <MarkdownRenderer content="# Hello World" />
 * ```
 */
export const MarkdownRenderer = React.memo<MarkdownRendererProps>(({ content, className }) => {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={MARKDOWN_COMPONENTS}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';