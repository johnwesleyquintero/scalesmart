import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

function buildPrompt({
  category,
  customCategory,
  request,
  context,
  parentTask,
  subtask,
  codeInput,
  aiModel,
  temperature,
  geminiApiKey,
}: {
  category: string;
  customCategory: string;
  request: string;
  context: string;
  parentTask: string;
  subtask: string;
  codeInput: string;
  aiModel?: string;
  temperature?: number;
  geminiApiKey?: string;
}): string {
  let prompt = `Category: ${category}\n`;
  if (category === 'custom' && customCategory) {
    prompt += `Custom Category: ${customCategory}\n`;
  }
  if (parentTask) {
    prompt += `Parent Task: ${parentTask}\n`;
  }
  if (subtask) {
    prompt += `Subtask: ${subtask}\n`;
  }
  if (context) {
    prompt += `Context: ${context}\n`;
  }
  prompt += `Request: ${request}\n`;
  if (codeInput) {
    prompt += `Code Input:\n\`\`\`\n${codeInput}\n\`\`\`\n`;
  }

  // Add AI settings if provided
  if (aiModel) {
    prompt += `AI Model: ${aiModel}\n`;
  }
  if (temperature !== undefined) {
    prompt += `Temperature: ${temperature}\n`;
  }

  return prompt;
}

export async function POST(req: Request) {
  try {
    const {
      category,
      customCategory,
      request,
      context,
      parentTask,
      subtask,
      codeInput,
      aiModel,
      temperature,
      geminiApiKey,
    } = await req.json();

    if (!request) {
      return NextResponse.json(
        { error: 'Request field is required' },
        { status: 400 },
      );
    }

    const prompt = buildPrompt({
      category,
      customCategory,
      request,
      context,
      parentTask,
      subtask,
      codeInput,
      aiModel,
      temperature,
      geminiApiKey,
    });

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 },
      );
    }

    // Use user-provided API key if available, otherwise fall back to environment variable
    const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('No Gemini API key provided.');
      return NextResponse.json(
        { error: 'Gemini API key not provided or configured' },
        { status: 500 },
      );
    }

    // Basic validation for Gemini API key format
    if (!apiKey.startsWith('AIza')) {
      console.error('Invalid Gemini API key format.');
      return NextResponse.json(
        {
          error: 'Invalid Gemini API key format. Keys should start with "AIza"',
        },
        { status: 400 },
      );
    }

    console.log('Gemini API key is available.');

    const genAI = new GoogleGenerativeAI(apiKey);

    const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.0-pro']; // Prioritize 2.5-flash, then 1.5-flash, then 1.0-pro
    let generatedText = '';
    let lastError: unknown = null;

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        generatedText = response.text();
        if (generatedText) {
          break; // Successfully generated content, exit loop
        }
      } catch (error) {
        lastError = error;
        console.error(
          `Failed to generate content with model ${modelName}:`,
          error,
        );
        // Continue to the next model
      }
    }

    if (generatedText) {
      return NextResponse.json({ generatedPrompt: generatedText });
    } else {
      console.error(
        'All Gemini models failed to generate AI prompt. Last error:',
        lastError,
      );
      const errorMessage =
        lastError instanceof Error
          ? lastError.message
          : 'Failed to generate AI prompt after multiple retries.';
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error(
      'Caught unexpected error in generate AI prompt route:',
      error,
    );
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred in the API route.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
