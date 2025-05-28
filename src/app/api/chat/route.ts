import { rateLimiter } from '@/lib/api/rate-limiter';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Define interfaces for the context data structures to avoid 'any'
interface AmazonCertification {
  name: string;
  // Add other properties if they exist and are used
}

interface WorkExperience {
  title: string;
  company: string;
  period: string;
  description: string;
  achievements: string[];
}

interface Education {
  degree: string;
  institution: string;
  period: string;
  description: string;
}

interface GeneralCertification {
  name: string;
  issuer: string;
  date: string;
  status: string;
}

interface FAQ {
  category: string;
  question: string;
  answer: string;
}

interface ChatHistoryMessage {
  role: string;
  content: string;
}

export async function POST(request: NextRequest) {
  let body = null;
  try {
    const identifier = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await rateLimiter.limit(identifier);

    if (!success) {
      return NextResponse.json(
        createErrorResponse('Too many requests', 'RATE_LIMIT_EXCEEDED'),
        { status: 429 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error(
        'Chat API Error: Missing GEMINI_API_KEY environment variable',
      );
      return NextResponse.json(
        createErrorResponse(
          'Chat service configuration error. API key is missing.',
          'MISSING_API_KEY',
        ),
        { status: 500 },
      );
    }

    // Validate the API key format
    if (!apiKey.startsWith('AIzaSyAP') || apiKey.length !== 39) {
      console.error('Chat API Error: Invalid GEMINI_API_KEY format');
      return NextResponse.json(
        createErrorResponse(
          'Chat service configuration error. Invalid API key format.',
          'INVALID_API_KEY_FORMAT',
        ),
        { status: 500 },
      );
    }

    body = await request.json();
    if (!body.message?.trim()) {
      return NextResponse.json(
        createErrorResponse('Message is required', 'MISSING_MESSAGE'),
        { status: 400 },
      );
    }
    const { message, history = [] } = body;

    // Load portfolio context
    const portfolioContextData = await import('@/data/chat-context.json');
    const portfolioContext = portfolioContextData.default[0];

    // Create a context-aware prompt that includes portfolio information
    const contextPrompt = `You are Wesley Quintero. Respond in the first person, using "I", "me", "my". You have access to the following information about yourself:

    Personal Information:
    - Name: ${portfolioContext.personalContext.personalInfo.name}
    - Email (Primary): ${portfolioContext.personalContext.personalInfo.email}
    - Location: ${portfolioContext.personalContext.personalInfo.location}
    - Family: My brother is ${portfolioContext.personalContext.personalInfo.familyInfo.sibling}, my mother is ${portfolioContext.personalContext.personalInfo.familyInfo.mother}, and my father is ${portfolioContext.personalContext.personalInfo.familyInfo.father}. My girlfriend is ${portfolioContext.personalContext.personalInfo.familyInfo.girlfriend}.
    - Phone: ${portfolioContext.personalContext.personalInfo.phone}
    - Role: ${portfolioContext.personalContext.professionalProfile.title}
    - Summary: ${portfolioContext.personalContext.professionalProfile.summary}
    - Core Competencies: ${portfolioContext.personalContext.professionalProfile.coreCompetencies.join(', ')}
    
    Technical Skills:
    - Proficiencies: ${portfolioContext.personalContext.skills.technicalProficiencies?.join(', ') || 'Not specified'}
    - Soft Skills: ${portfolioContext.personalContext.skills.soft.join(', ')}
    
    Amazon Web Services (AWS) Expertise:
    - My Amazon Specific Certifications (Conceptual): ${portfolioContext.personalContext.amazonExpertise.certifications?.map((c: AmazonCertification) => c.name).join(', ') || 'Not specified'}
    - Areas: ${portfolioContext.personalContext.amazonExpertise.areasOfExpertise.join(', ')}
    - Key Achievements: ${portfolioContext.personalContext.amazonExpertise.keyAchievements.join('; ')}
    
    Work Experience:
    ${portfolioContext.personalContext.workExperience
      .map(
        (
          exp: WorkExperience, // Type assertion might be needed if portfolioContext is not strictly typed: (exp as WorkExperience)
        ) =>
          `- ${exp.title} at ${exp.company} (${exp.period}): ${exp.description}. Achievements: ${exp.achievements.join(', ')}.`,
      )
      .join('\n    ')}

    Education:
    ${portfolioContext.personalContext.education
      .map(
        (
          edu: Education, // Type assertion might be needed: (edu as Education)
        ) =>
          `- ${edu.degree} from ${edu.institution} (${edu.period}). ${edu.description}`,
      )
      .join('\n    ')}

    Certifications:
    ${(portfolioContext.personalContext.certifications || [])
      .map(
        (
          cert: GeneralCertification, // Type assertion might be needed: (cert as GeneralCertification)
        ) =>
          `- ${cert.name} from ${cert.issuer} (Issued: ${cert.date}, Status: ${cert.status})`,
      )
      .join('\n    ')}

    Web App Information:
    - Project: ${portfolioContext.webappContext.projectOverview.name}
    - Description: ${portfolioContext.webappContext.projectOverview.description}
    
    Additional Resources:
    - Blog: ${portfolioContext.personalContext.personalInfo.socialLinks.blog.url} (Summary: ${portfolioContext.personalContext.personalInfo.socialLinks.blog.summary})
    - Amazon Tools Blog: ${portfolioContext.personalContext.personalInfo.socialLinks.amazonToolsBlog.url} (Summary: ${portfolioContext.personalContext.personalInfo.socialLinks.amazonToolsBlog.summary})
    - AI Implementation Blog: ${portfolioContext.personalContext.personalInfo.socialLinks.aiBlog.url} (Summary: ${portfolioContext.personalContext.personalInfo.socialLinks.aiBlog.summary})
    - E-commerce Tips Blog: ${portfolioContext.personalContext.personalInfo.socialLinks.ecommerceBlog.url} (Summary: ${portfolioContext.personalContext.personalInfo.socialLinks.ecommerceBlog.summary})

    Development Setup:
    - Hardware: ${portfolioContext.developmentSetup.hardware}
    - Connectivity: ${portfolioContext.developmentSetup.connectivity}
    - Audio/Video: ${portfolioContext.developmentSetup.audioVideo}
    - Power Backup: ${portfolioContext.developmentSetup.powerBackup}
    - Collaboration Tools: ${portfolioContext.developmentSetup.devToolsWorkflow.collaboration.join(', ')}
    - Development Tools: ${portfolioContext.developmentSetup.devToolsWorkflow.development.join(', ')}

    FAQs:
    ${portfolioContext.faqs.map((faq: FAQ) => `- Category: ${faq.category}, Question: ${faq.question}, Answer: ${faq.answer}`).join('\n')}

    Previous conversation context:
    ${(history as ChatHistoryMessage[]).map((msg: ChatHistoryMessage) => `${msg.role}: ${msg.content}`).join('\n')}
    
    Please provide accurate, personalized responses based on this information about yourself. If someone asks for your contact details, share them. If asked about your family, you can briefly mention their names if you feel it's appropriate for the conversation, but keep it concise and professional.
    
    Current user message: ${message}`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-001', // Using latest flash model
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.85, // Increased for more human-like, creative responses
        topP: 0.9, // Slightly increased for more diversity
        topK: 40,
      },
    });

    const chat = model.startChat();
    const contextPromptSize = contextPrompt.length;
    console.log(`Context prompt size: ${contextPromptSize}`);

    if (contextPromptSize > 15000) {
      console.warn(
        'Context prompt size exceeds 15000 characters. This may lead to errors.',
      );
    }

    const startTime = Date.now();
    const result = await chat.sendMessage(contextPrompt);
    const endTime = Date.now();
    const response = result.response;
    console.log(`Gemini API call duration: ${endTime - startTime}ms`);

    return NextResponse.json({
      response: response.text(),
    });
  } catch (error: unknown) {
    console.error('Chat API Error:', {
      error,
      message: (error as Error)?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      ...(body?.message && { lastMessage: body.message }),
    });
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat API Error Details:', {
      errorName: (error as Error)?.name,
      errorMessage: errorMessage,
      errorStack: (error as Error)?.stack,
      body: body,
    });
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
