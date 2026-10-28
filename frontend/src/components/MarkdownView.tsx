/** Рендер markdown + LaTeX (KaTeX) для ответов AI. */

import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

interface MarkdownViewProps {
  content: string
}

export function MarkdownView({ content }: MarkdownViewProps) {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
