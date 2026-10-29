/** Рендер markdown + LaTeX (KaTeX) для ответов AI. */

import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

interface MarkdownViewProps {
  content: string
}

export function MarkdownView({ content }: MarkdownViewProps) {
  const normalizedContent = content
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$')

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert text-slate-800 dark:text-slate-100">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  )
}
