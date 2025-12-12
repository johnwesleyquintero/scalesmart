import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

function getErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unknown error occurred';
  }
  
  const message = error.message;
  
  if (message.includes('403') || message.includes('PERMISSION_DENIED')) {
    return 'Gemini API permission denied. Please check your API key has proper permissions for the selected model.';
  }
  
  if (message.includes('404') || message.includes('not found')) {
    return 'Selected Gemini model not found. Please ensure the model is available in your region and API tier.';
  }
  
  return message;
}

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

    const models = ['gemini-2.5-flash']; // Use only working free tier Gemini model
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
        const errorMessage = getErrorMessage(error);
        console.error(`Failed to generate content with model ${modelName}:`, errorMessage);
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
      const errorMessage = lastError ? getErrorMessage(lastError) : 'Failed to generate AI prompt after multiple retries.';
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
