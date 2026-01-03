import OpenAI from 'openai';
import { AIOutput } from '../shared/types';

let openaiClient: OpenAI | null = null;

export function initOpenAI(apiKey: string): void {
  if (apiKey) {
    openaiClient = new OpenAI({ apiKey });
  } else {
    openaiClient = null;
  }
}

function getClient(): OpenAI {
  if (!openaiClient) {
    throw new Error('OpenAI API key not configured. Please add your API key in settings.');
  }
  return openaiClient;
}

const SYSTEM_PROMPT = `You are a thoughtful journal assistant. Your role is to help users reflect on their journal entries.

IMPORTANT RULES:
- You are NOT a therapist. Never provide diagnosis, clinical language, or therapeutic advice.
- Focus on: summarizing, organizing, finding patterns in text, and asking reflective questions.
- Be supportive but objective.
- Always be concise and actionable.
- When citing evidence, use SHORT direct quotes (under 20 words each).`;

async function callOpenAI(userPrompt: string, content: string): Promise<string> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `${userPrompt}\n\n---\n\nJOURNAL CONTENT:\n${content}` }
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content || 'No response generated.';
}

function extractQuotesFromResponse(response: string): string[] {
  // Try to extract quoted text from the response
  const quoteMatches = response.match(/"([^"]{10,100})"/g);
  if (quoteMatches) {
    return quoteMatches.slice(0, 3).map(q => q.replace(/"/g, ''));
  }
  return [];
}

function estimateConfidence(response: string, contentLength: number): string {
  if (contentLength < 100) return 'Low (limited content)';
  if (contentLength < 500) return 'Medium';
  return 'High';
}

export async function generateDailyReview(content: string): Promise<AIOutput> {
  const prompt = `Analyze this journal entry and provide a daily review with:

1. **Summary** (2-3 sentences capturing the essence)
2. **Key Themes** (bullet list of main topics/ideas)
3. **Mood Indicators** (overall emotional tone observed)
4. **Notable Moments** (anything that stands out)

Include 1-3 SHORT direct quotes as evidence (in quotation marks).`;

  const response = await callOpenAI(prompt, content);
  const quotes = extractQuotesFromResponse(response);

  return {
    type: 'daily-review',
    title: 'Daily Review',
    content: response,
    confidence: estimateConfidence(response, content.length),
    quotes: quotes.length > 0 ? quotes : undefined,
  };
}

export async function generateWeeklySummary(entries: { date: string; content: string }[]): Promise<AIOutput> {
  const combinedContent = entries
    .map(e => `## ${e.date}\n${e.content}`)
    .join('\n\n---\n\n');

  const prompt = `Analyze these ${entries.length} journal entries from the past week and provide:

1. **Week Overview** (brief summary of the week)
2. **Recurring Themes** (patterns across multiple days)
3. **Progress & Wins** (positive developments noted)
4. **Challenges** (difficulties or friction mentioned)
5. **Week-over-Week Patterns** (any notable trends)

Include 1-3 SHORT direct quotes as evidence (in quotation marks).`;

  const response = await callOpenAI(prompt, combinedContent);
  const quotes = extractQuotesFromResponse(response);

  return {
    type: 'weekly-summary',
    title: 'Weekly Summary',
    content: response,
    confidence: estimateConfidence(response, combinedContent.length),
    quotes: quotes.length > 0 ? quotes : undefined,
  };
}

export async function generateHighlights(content: string): Promise<AIOutput> {
  const prompt = `Extract highlights from this journal entry:

1. **Topics Mentioned** (main subjects discussed)
2. **Wins** (accomplishments, positive outcomes, things that went well)
3. **Friction Points** (challenges, frustrations, obstacles)
4. **Action Items** (ONLY if explicitly stated by the writer - do not invent tasks)

Be concise. Include 1-3 SHORT direct quotes as evidence (in quotation marks).`;

  const response = await callOpenAI(prompt, content);
  const quotes = extractQuotesFromResponse(response);

  return {
    type: 'highlights',
    title: 'Highlights',
    content: response,
    confidence: estimateConfidence(response, content.length),
    quotes: quotes.length > 0 ? quotes : undefined,
  };
}

export async function generateOpenLoops(entries: { date: string; content: string }[]): Promise<AIOutput> {
  const combinedContent = entries
    .map(e => `## ${e.date}\n${e.content}`)
    .join('\n\n---\n\n');

  const prompt = `Identify "open loops" (unresolved items) from these journal entries:

Look for:
- Questions left unanswered
- Tasks mentioned but not marked complete
- Decisions pending
- Follow-ups needed
- Things the writer said they would do but didn't mention completing

Format as a bullet list with the date each item was mentioned.
Only include items that appear genuinely unresolved.
If no clear open loops exist, say so.`;

  const response = await callOpenAI(prompt, combinedContent);

  return {
    type: 'open-loops',
    title: 'Open Loops',
    content: response,
    confidence: entries.length >= 3 ? 'Medium' : 'Low (limited entries)',
    quotes: [],
  };
}

export async function generateQuestion(entries: { date: string; content: string }[]): Promise<AIOutput> {
  const combinedContent = entries
    .map(e => `## ${e.date}\n${e.content}`)
    .join('\n\n---\n\n');

  const prompt = `Based on these recent journal entries, generate ONE thoughtful reflection question for the writer.

The question should:
- Be specific to what they've been writing about
- Encourage deeper reflection
- NOT be therapeutic or clinical
- Be open-ended (not yes/no)

Provide just the question, followed by a brief (1 sentence) explanation of why this question might be valuable based on their recent entries.`;

  const response = await callOpenAI(prompt, combinedContent);

  return {
    type: 'question',
    title: 'Question of the Day',
    content: response,
    confidence: 'N/A',
    quotes: [],
  };
}
