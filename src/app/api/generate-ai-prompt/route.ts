import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

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
        createErrorResponse('Request field is required', 'VALIDATION_ERROR'),
        { status: 400 },
      );
    }

    const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        createErrorResponse(
          'Gemini API key is missing. Please provide one in settings or contact the administrator.',
          'CONFIG_ERROR',
        ),
        { status: 401 },
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
    });

    const genAI = new GoogleGenerativeAI(apiKey);

    // Use the requested model, or fall back to flash then pro
    const modelName = aiModel || 'gemini-1.5-flash';

    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: temperature ?? 0.7,
        },
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return NextResponse.json({ prompt: text });
    } catch (modelError) {
      // If the specific model fails, try a safe fallback
      if (modelName !== 'gemini-1.5-pro') {
        const fallbackModel = genAI.getGenerativeModel({
          model: 'gemini-1.5-pro',
        });
        const result = await fallbackModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return NextResponse.json({ prompt: text });
      }
      throw modelError;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
