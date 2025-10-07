/**
 * ReactMarkdown用の共通コンポーネント設定
 * DRY原則に従い、Markdown表示の一貫性を保つ
 */

import React from 'react';
import type { Components } from 'react-markdown';

/**
 * Markdownコンポーネントのカスタム設定
 * MessageList、ItineraryPreviewなどで共通使用
 */
export const MARKDOWN_COMPONENTS: Components = {
  // リンク
  a: ({ node, ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 underline"
    />
  ),
  
  // 見出し
  h1: ({ node, ...props }) => (
    <h1 {...props} className="text-2xl font-bold mt-4 mb-2" />
  ),
  h2: ({ node, ...props }) => (
    <h2 {...props} className="text-xl font-bold mt-3 mb-2" />
  ),
  h3: ({ node, ...props }) => (
    <h3 {...props} className="text-lg font-bold mt-2 mb-1" />
  ),
  
  // リスト
  ul: ({ node, ...props }) => (
    <ul {...props} className="list-disc list-inside ml-4 my-2" />
  ),
  ol: ({ node, ...props }) => (
    <ol {...props} className="list-decimal list-inside ml-4 my-2" />
  ),
  li: ({ node, ...props }) => (
    <li {...props} className="my-1" />
  ),
  
  // テキスト
  p: ({ node, ...props }) => (
    <p {...props} className="my-2" />
  ),
  
  // コード
  code: ({ node, inline, ...props }: any) =>
    inline ? (
      <code
        {...props}
        className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-sm font-mono"
      />
    ) : (
      <code
        {...props}
        className="block bg-gray-800 text-gray-100 p-3 rounded my-2 overflow-x-auto text-sm font-mono"
      />
    ),
  pre: ({ node, ...props }) => (
    <pre {...props} className="my-2" />
  ),
  
  // 引用
  blockquote: ({ node, ...props }) => (
    <blockquote
      {...props}
      className="border-l-4 border-gray-400 pl-4 my-2 italic text-gray-600"
    />
  ),
  
  // テーブル
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-2">
      <table
        {...props}
        className="min-w-full border-collapse border border-gray-300"
      />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead {...props} className="bg-gray-200" />
  ),
  tbody: ({ node, ...props }) => (
    <tbody {...props} />
  ),
  tr: ({ node, ...props }) => (
    <tr {...props} className="border-b border-gray-300" />
  ),
  th: ({ node, ...props }) => (
    <th
      {...props}
      className="border border-gray-300 px-4 py-2 text-left font-semibold"
    />
  ),
  td: ({ node, ...props }) => (
    <td {...props} className="border border-gray-300 px-4 py-2" />
  ),
};