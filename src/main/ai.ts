import OpenAI from 'openai';
import { AIOutput, AIPreferences } from '../shared/types';

let openaiClient: OpenAI | null = null;
let currentPreferences: AIPreferences = {
  tone: 'neutral',
  verbosity: 'balanced',
  evidenceStrictness: 'standard',
};

export function initOpenAI(apiKey: string): void {
  if (apiKey) {
    openaiClient = new OpenAI({ apiKey });
  } else {
    openaiClient = null;
  }
}

export function updateAIPreferences(preferences: AIPreferences): void {
  currentPreferences = preferences;
}

function getClient(): OpenAI {
  if (!openaiClient) {
    throw new Error('OpenAI API key not configured. Please add your API key in settings.');
  }
  return openaiClient;
}

function buildSystemPrompt(): string {
  const { tone, verbosity, evidenceStrictness } = currentPreferences;

  // Base prompt
  let prompt = `You are a thoughtful journal assistant. Your role is to help users reflect on their journal entries.

IMPORTANT RULES:
- You are NOT a therapist. Never provide diagnosis, clinical language, or therapeutic advice.
- Focus on: summarizing, organizing, finding patterns in text, and asking reflective questions.`;

  // Add tone-specific instructions
  if (tone === 'neutral') {
    prompt += '\n- Maintain an objective, balanced perspective. Present information without emotional bias.';
  } else if (tone === 'analytical') {
    prompt += '\n- Use logical, structured analysis. Break down patterns, causes, and effects systematically.';
  } else if (tone === 'reflective') {
    prompt += '\n- Offer thoughtful, introspective guidance. Encourage deeper self-examination and meaning-making.';
  }

  // Add verbosity instructions
  if (verbosity === 'concise') {
    prompt += '\n- Be brief and to-the-point. Use short sentences and bullet points. Aim for clarity over detail.';
  } else if (verbosity === 'balanced') {
    prompt += '\n- Provide moderate detail. Balance brevity with thoroughness.';
  } else if (verbosity === 'detailed') {
    prompt += '\n- Provide comprehensive, thorough analysis. Explore nuances and multiple perspectives.';
  }

  // Add evidence strictness instructions
  if (evidenceStrictness === 'standard') {
    prompt += '\n- Balance direct evidence with synthesis. Use SHORT quotes (under 20 words) when relevant.';
  } else if (evidenceStrictness === 'strict') {
    prompt += '\n- ONLY use information directly from the journal. Every claim must be supported by a direct quote. Use SHORT quotes (under 20 words).';
  }

  return prompt;
}

async function callOpenAI(userPrompt: string, content: string): Promise<string> {
  const client = getClient();
  const systemPrompt = buildSystemPrompt();

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
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

export async function askYourJournal(
  question: string,
  entries: { date: string; content: string; path: string }[]
): Promise<AIOutput> {
  if (entries.length === 0) {
    return {
      type: 'ask',
      title: 'Answer',
      content: 'No entries found in the selected date range. Try expanding your search range.',
      confidence: 'N/A (insufficient data)',
      quotes: [],
    };
  }

  const contextContent = entries
    .map(e => `[Source: ${e.path}]\n## ${e.date}\n${e.content}`)
    .join('\n\n---\n\n');

  const prompt = `Answer the following question based ONLY on the provided journal excerpts.

STRICT REQUIREMENTS:
1. Only use information from the provided excerpts
2. If you cannot answer from the excerpts, say "I don't have enough evidence to answer this"
3. Provide 3-7 bullet points maximum
4. Include 1-5 SHORT direct quotes as evidence (in quotation marks with [Source: path] citation)
5. End with "Confidence: Low/Medium/High" based on evidence quality
6. Do NOT provide diagnosis, therapy advice, or medical suggestions
7. Be concise and grounded in the text

Question: ${question}`;

  const response = await callOpenAI(prompt, contextContent);
  const quotes = extractQuotesFromResponse(response);

  // Extract confidence from response
  const confidenceMatch = response.match(/Confidence:\s*(Low|Medium|High)/i);
  const confidence = confidenceMatch ? confidenceMatch[1] : estimateConfidence(response, contextContent.length);

  return {
    type: 'ask',
    title: 'Answer',
    content: response,
    confidence,
    quotes: quotes.length > 0 ? quotes : undefined,
  };
}

export async function generateMonthlySummary(
  entries: { date: string; content: string; path: string }[],
  month: string
): Promise<AIOutput> {
  if (entries.length === 0) {
    return {
      type: 'monthly',
      title: `Monthly Summary - ${month}`,
      content: `No entries found for ${month}.`,
      confidence: 'N/A',
      quotes: [],
    };
  }

  const contextContent = entries
    .map(e => `[Source: ${e.path}]\n## ${e.date}\n${e.content.slice(0, 600)}`)
    .join('\n\n---\n\n');

  const prompt = `Generate a monthly summary for ${month} based on ${entries.length} journal entries.

STRICT REQUIREMENTS:
1. No diagnosis, no therapy language, no medical advice
2. Summarize and organize only - stay grounded in the text
3. Use the format below
4. Include 2-5 SHORT direct quotes with [Source: path] citations
5. Only mention wins/challenges if explicitly stated
6. End with Confidence: Low/Medium/High

FORMAT:

## Overview
(3-6 bullets summarizing the month)

## Top Themes
(5-10 themes with frequency counts if possible)

## Wins & Progress
(Only if explicitly stated in entries)

## Challenges & Friction
(Only if explicitly stated in entries)

## Recurring Open Loops
(Unfinished items mentioned multiple times)

## Reflection Question
(One practical, non-therapy question for next month)

## Confidence
(Low/Medium/High based on entry count and evidence quality)`;

  const response = await callOpenAI(prompt, contextContent);
  const quotes = extractQuotesFromResponse(response);

  const confidenceMatch = response.match(/Confidence:\s*(Low|Medium|High)/i);
  const confidence = confidenceMatch ? confidenceMatch[1] : (entries.length >= 10 ? 'Medium' : 'Low (limited entries)');

  return {
    type: 'monthly',
    title: `Monthly Summary - ${month}`,
    content: response,
    confidence,
    quotes: quotes.length > 0 ? quotes : undefined,
  };
}
