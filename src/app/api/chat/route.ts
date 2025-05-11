import { rateLimiter } from '@/lib/api/rate-limiter';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  let body = null;
  try {
    const identifier = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await rateLimiter.limit(identifier);

    if (!success) {
      return new NextResponse('Too many requests', { status: 429 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error(
        'Chat API Error: Missing GEMINI_API_KEY environment variable',
      );
      return NextResponse.json(
        {
          error: 'Chat service configuration error. API key is missing.',
        },
        { status: 500 },
      );
    }

    body = await request.json();
    if (!body.message?.trim()) {
      return new NextResponse('Message is required', { status: 400 });
    }
    const { message, history = [] } = body;

    // Load portfolio context
    const portfolioContext = await import('@/data/chat-context.json');

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
    - My Amazon Specific Certifications (Conceptual): ${portfolioContext.personalContext.amazonExpertise.certifications?.map((c) => c.name).join(', ') || 'Not specified'}
    - Areas: ${portfolioContext.personalContext.amazonExpertise.areasOfExpertise.join(', ')}
    - Key Achievements: ${portfolioContext.personalContext.amazonExpertise.keyAchievements.join('; ')}
    
    Work Experience:
    ${portfolioContext.personalContext.workExperience
      .map(
        (exp) =>
          `- ${exp.title} at ${exp.company} (${exp.period}): ${exp.description}. Achievements: ${exp.achievements.join(', ')}.`,
      )
      .join('\n    ')}

    Education:
    ${portfolioContext.personalContext.education
      .map(
        (edu) =>
          `- ${edu.degree} from ${edu.institution} (${edu.period}). ${edu.description}`,
      )
      .join('\n    ')}

    Certifications:
    ${(portfolioContext.personalContext.certifications || [])
      .map(
        (cert) =>
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
    ${portfolioContext.faqs.map((faq) => `- Category: ${faq.category}, Question: ${faq.question}, Answer: ${faq.answer}`).join('\n')}

    Previous conversation context:
    ${history.map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`).join('\n')}
    
    Please provide accurate, personalized responses based on this information about yourself. If someone asks for your contact details, share them. If asked about your family, you can briefly mention their names if you feel it's appropriate for the conversation, but keep it concise and professional.
    
    Current user message: ${message}`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest', // Using latest flash model
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.85, // Increased for more human-like, creative responses
        topP: 0.9, // Slightly increased for more diversity
        topK: 40,
      },
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(contextPrompt);
    const response = result.response;

    return NextResponse.json({
      response: response.text(),
    });
  } catch (error) {
    console.error('Chat API Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      ...(body?.message && { lastMessage: body.message }),
    });
    return NextResponse.json(
      {
        error:
          'Our chat service is temporarily unavailable. Please try again later.',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
      },
      { status: 500 },
    );
  }
}
