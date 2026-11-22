import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { articleEditorialBlocks } from '@/blocks/EditorialBlocks'

const retainedFeatureKeys = new Set([
  'bold', 'italic', 'underline', 'strikethrough', 'inlineCode', 'paragraph', 'unorderedList',
  'orderedList', 'link', 'blockquote', 'horizontalRule',
])

export const articleLexicalEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures.filter((feature) => retainedFeatureKeys.has(feature.key)),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4', 'h5', 'h6'] }),
    UploadFeature({ enabledCollections: ['media'] }),
    BlocksFeature({ blocks: articleEditorialBlocks }),
    FixedToolbarFeature(),
  ],
})

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function children(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function articleEditorHasContent(value: unknown): boolean {
  let meaningful = false
  const visit = (input: unknown) => {
    if (meaningful) return
    if (Array.isArray(input)) {
      input.forEach(visit)
      return
    }
    if (!input || typeof input !== 'object') return
    const node = input as Record<string, unknown>
    if (node.type === 'text' && typeof node.text === 'string' && node.text.trim()) meaningful = true
    if (node.type === 'upload' || node.type === 'block') meaningful = true
    Object.values(node).forEach(visit)
  }
  visit(record(record(value).root).children)
  return meaningful
}

export function articleEditorPlainText(value: unknown): string {
  const parts: string[] = []
  const visit = (input: unknown) => {
    if (Array.isArray(input)) {
      input.forEach(visit)
      return
    }
    if (!input || typeof input !== 'object') return
    const node = input as Record<string, unknown>
    if (node.type === 'text' && typeof node.text === 'string') parts.push(node.text)
    if (node.type === 'upload') {
      const media = record(node.value)
      if (typeof media.alt === 'string') parts.push(media.alt)
    }
    if (node.type === 'block') {
      const fields = record(node.fields)
      for (const key of ['caption', 'title', 'description', 'label', 'code']) {
        if (typeof fields[key] === 'string') parts.push(fields[key] as string)
      }
      if (fields.blockType === 'editorialFAQ') {
        for (const item of children(fields.items)) {
          const faq = record(item)
          if (typeof faq.question === 'string') parts.push(faq.question)
          if (typeof faq.answer === 'string') parts.push(faq.answer)
        }
      }
      if (fields.blockType === 'editorialTable') {
        for (const row of children(fields.rows)) {
          for (const cell of children(record(row).cells)) {
            const value = record(cell).value
            if (typeof value === 'string') parts.push(value)
          }
        }
      }
    }
    visit(node.children)
  }
  visit(record(record(value).root).children)
  return parts.join(' ').replace(/\s+/gu, ' ').trim().slice(0, 100_000)
}
