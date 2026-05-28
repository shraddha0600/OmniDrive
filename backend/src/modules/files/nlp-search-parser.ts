/**
 * OmniDrive AI Tag-Aware Natural Language Search Parser with Ollama Integration
 * 
 * Supports local LLM inference via Ollama using model `minimax-m2.5:cloud`.
 * Falls back to 0ms fast rule parser if Ollama is offline.
 */

export type ParsedNlpIntent = {
  categoryTag: 'Professional' | 'Personal' | 'Revision' | 'Financial' | 'Media' | 'Other' | 'All'
  keywords: string[]
  kind?: 'doc' | 'image' | 'video' | 'pdf' | 'archive'
  minSizeBytes?: number
  maxSizeBytes?: number
  startDate?: string
  endDate?: string
  explanation: string
  engineUsed: 'ollama:minimax-m2.5:cloud' | 'local-rule-parser'
}

/**
 * Tag-Aware System Prompt designed for LLM Inference
 */
export const NLP_SYSTEM_PROMPT = `
You are OmniDrive AI's Tag-Aware Search Intelligence Engine.

Your task is to parse a natural language query into a JSON object of database filters.

### CRITICAL GOAL: CATEGORY TAG PRUNING
Always identify the target \`categoryTag\` FIRST to narrow down the search space before evaluating keywords:
1. "Professional": Resumes, CVs, cover letters, portfolios, job applications, offer letters, NDAs, agreements, slide decks, specs, PRDs, MoM meeting notes, certificates.
2. "Personal": Recipes, meal/workout plans, medical/blood reports, prescriptions, passports, visas, rent agreements, travel itineraries, boarding passes, ID cards.
3. "Revision": Study notes, cheat sheets, lecture slides, midterms, exam prep, PYQs, question papers, formulas, homework, textbooks, DSA/coding prep, DBMS notes.
4. "Financial": Invoices, receipts, bills, tax returns, Form 16, bank statements, salary payslips, audits, expense claims, utility bills.
5. "Media": Photos, pictures, videos, clips, recordings, podcasts, audio tracks.
6. "Other": Archives (.zip), code files, generic unclassified documents.
7. "All": Only if the query spans multiple categories or is completely category-agnostic (e.g. "files uploaded yesterday").

### Output JSON Format strictly:
{
  "categoryTag": "Professional" | "Personal" | "Revision" | "Financial" | "Media" | "Other" | "All",
  "keywords": ["clean", "search", "terms"],
  "kind": "doc" | "image" | "video" | "pdf" | "archive" | null,
  "minSizeBytes": number | null,
  "maxSizeBytes": number | null,
  "startDate": "ISO String" | null,
  "endDate": "ISO String" | null,
  "explanation": "Brief explanation of how intent was derived"
}
`.trim()

function cleanJsonText(raw: string): string {
  return raw.replace(/```json/gi, '').replace(/```/g, '').trim()
}

const SYNONYMS: Record<string, string[]> = {
  dbms: ['dbms', 'database', 'sql', 'rdbms', 'tables'],
  dsa: ['dsa', 'data_structure', 'algorithm', 'leetcode', 'coding'],
  cv: ['cv', 'resume', 'curriculum', 'career', 'bio'],
  bill: ['bill', 'invoice', 'receipt', 'utility', 'payment'],
  tax: ['tax', 'itr', 'form16', 'w2', 'financial'],
  notes: ['notes', 'cheatsheet', 'lecture', 'revision', 'study']
}

/**
 * Fast Tag-Aware NLP Intent Extractor (Rule-based Fallback)
 */
export function parseNlpQueryFast(userQuery: string): ParsedNlpIntent {
  const query = userQuery.toLowerCase().trim()
  const rawKeywords: string[] = []

  let categoryTag: ParsedNlpIntent['categoryTag'] = 'All'
  let kind: ParsedNlpIntent['kind'] = undefined
  let minSizeBytes: number | undefined = undefined
  let maxSizeBytes: number | undefined = undefined
  let startDate: string | undefined = undefined
  let endDate: string | undefined = undefined
  const reasoningSteps: string[] = []

  // 1. Tag Intent Extraction
  if (/resume|cv|cover_letter|coverletter|portfolio|offer_letter|contract|nda|presentation|deck|roadmap|spec|prd|appraisal|certificate|meeting_notes|mom/i.test(query)) {
    categoryTag = 'Professional'
    reasoningSteps.push('Extracted tag "Professional" based on workplace/career keywords.')
  } else if (/recipe|food|workout|gym|health|medical|doctor|blood_report|prescription|passport|visa|rent|lease|itinerary|boarding_pass|flight|ticket|travel|aadhaar/i.test(query)) {
    categoryTag = 'Personal'
    reasoningSteps.push('Extracted tag "Personal" based on life/health/travel keywords.')
  } else if (/revision|notes|cheatsheet|lecture|exam|quiz|homework|assignment|syllabus|formula|dsa|dbms|database|gate|cat|jee|leetcode|study|paper/i.test(query)) {
    categoryTag = 'Revision'
    reasoningSteps.push('Extracted tag "Revision" based on academic/study keywords.')
  } else if (/invoice|receipt|bill|tax|itr|form16|payslip|salary|statement|bank|expense|financial|audit|balance_sheet|pnl|reimbursement/i.test(query)) {
    categoryTag = 'Financial'
    reasoningSteps.push('Extracted tag "Financial" based on payment/tax/account keywords.')
  } else if (/photo|image|pic|picture|screenshot|video|movie|clip|recording|podcast|song|music|audio/i.test(query)) {
    categoryTag = 'Media'
    reasoningSteps.push('Extracted tag "Media" based on audiovisual keywords.')
  } else {
    categoryTag = 'All'
    reasoningSteps.push('No specific category tag detected; querying across all files.')
  }

  // 2. Kind Extraction (Only set strict MIME type if explicit file format mentioned)
  if (/\bpdf\b/i.test(query)) { kind = 'pdf'; reasoningSteps.push('Filtered to PDF file type.') }
  else if (/\b(image|photo|pic|png|jpg|jpeg)\b/i.test(query)) { kind = 'image'; reasoningSteps.push('Filtered to Image file type.') }
  else if (/\b(video|mp4|mov|recording)\b/i.test(query)) { kind = 'video'; reasoningSteps.push('Filtered to Video file type.') }
  else if (/\b(word|docx|txt|slides|pptx)\b/i.test(query)) { kind = 'doc'; reasoningSteps.push('Filtered to Document file type.') }
  else if (/\b(zip|tar|archive|compressed)\b/i.test(query)) { kind = 'archive'; reasoningSteps.push('Filtered to Archive file type.') }

  // 3. Size Constraint Heuristics
  const sizeMbMatch = query.match(/(larger|greater|more|bigger|smaller|less) than ([0-9]+)\s*(mb|gb|kb)/i)
  if (sizeMbMatch) {
    const operator = sizeMbMatch[1].toLowerCase()
    const val = parseInt(sizeMbMatch[2], 10)
    const unit = sizeMbMatch[3].toLowerCase()
    const multiplier = unit === 'gb' ? 1024 * 1024 * 1024 : unit === 'mb' ? 1024 * 1024 : 1024
    const bytes = val * multiplier

    if (['larger', 'greater', 'more', 'bigger'].includes(operator)) {
      minSizeBytes = bytes
      reasoningSteps.push(`Filtered for files > ${val}${unit.toUpperCase()}`)
    } else {
      maxSizeBytes = bytes
      reasoningSteps.push(`Filtered for files < ${val}${unit.toUpperCase()}`)
    }
  }

  // 4. Date Heuristics
  const now = new Date()
  if (/last month|previous month/i.test(query)) {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    startDate = start.toISOString()
    endDate = end.toISOString()
    reasoningSteps.push('Constrained date range to last calendar month.')
  } else if (/last week|past week/i.test(query)) {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    startDate = start.toISOString()
    reasoningSteps.push('Constrained date range to past 7 days.')
  } else if (/today|yesterday/i.test(query)) {
    const start = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    startDate = start.toISOString()
    reasoningSteps.push('Constrained date range to past 48 hours.')
  }

  // 5. Clean Keywords & Synonyms Expansion
  const stopWords = new Set([
    'find', 'show', 'get', 'me', 'my', 'all', 'the', 'files', 'file', 'documents',
    'doc', 'pdfs', 'pdf', 'search', 'for', 'from', 'than', 'more', 'less', 'larger',
    'smaller', 'last', 'month', 'week', 'year', 'today', 'yesterday', 'can', 'you'
  ])

  const tokens = query.replace(/[^a-z0-9\s]/gi, '').split(/\s+/)
  for (const token of tokens) {
    if (token.length > 1 && !stopWords.has(token)) {
      rawKeywords.push(token)
      if (SYNONYMS[token]) {
        rawKeywords.push(...SYNONYMS[token])
      }
    }
  }

  const uniqueKeywords = Array.from(new Set(rawKeywords))

  return {
    categoryTag,
    keywords: uniqueKeywords,
    kind,
    minSizeBytes,
    maxSizeBytes,
    startDate,
    endDate,
    explanation: reasoningSteps.join(' '),
    engineUsed: 'local-rule-parser'
  }
}

import { env } from '../../config/env.js'

/**
 * Tag-Aware LLM Search Intent Extractor using Ollama (`minimax-m2.5:cloud`)
 */
export async function parseNlpQuery(userQuery: string): Promise<ParsedNlpIntent> {
  const ollamaUrl = env.OLLAMA_URL
  const modelName = env.OLLAMA_MODEL

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)

    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: NLP_SYSTEM_PROMPT },
          { role: 'user', content: userQuery }
        ],
        stream: false,
        format: 'json'
      })
    })

    clearTimeout(timeout)

    if (response.ok) {
      const data = await response.json() as { message?: { content?: string } }
      const content = data.message?.content
      if (content) {
        const cleaned = cleanJsonText(content)
        const parsed = JSON.parse(cleaned)
        const kw: string[] = Array.isArray(parsed.keywords) ? parsed.keywords : []
        
        // Expand synonyms in LLM keywords as well
        const expandedKw: string[] = []
        for (const k of kw) {
          const lower = k.toLowerCase().trim()
          if (lower) {
            expandedKw.push(lower)
            if (SYNONYMS[lower]) expandedKw.push(...SYNONYMS[lower])
          }
        }

        return {
          categoryTag: parsed.categoryTag || 'All',
          keywords: Array.from(new Set(expandedKw)),
          kind: parsed.kind || undefined,
          minSizeBytes: typeof parsed.minSizeBytes === 'number' ? parsed.minSizeBytes : undefined,
          maxSizeBytes: typeof parsed.maxSizeBytes === 'number' ? parsed.maxSizeBytes : undefined,
          startDate: parsed.startDate || undefined,
          endDate: parsed.endDate || undefined,
          explanation: parsed.explanation || 'Intent parsed via Ollama minimax-m2.5:cloud model.',
          engineUsed: 'ollama:minimax-m2.5:cloud'
        }
      }
    }
  } catch (err) {
    console.warn('[NLP Search] Ollama request timed out or unavailable. Using fast rule parser fallback.')
  }

  return parseNlpQueryFast(userQuery)
}
