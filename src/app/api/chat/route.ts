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
    // Updated to accept the new key prefix provided by the user.
    // The key should still be 39 characters long.
    if (!apiKey.startsWith('AIzaSyD') || apiKey.length !== 39) {
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
    console.log('Received history from frontend:', history);

    // Load portfolio context
    const portfolioContextData = await import('@/data/chat-context.json');
    const portfolioContext = portfolioContextData.default[0];

    const NOT_SPECIFIED = 'Not specified';

    // Define the system instruction with static portfolio information
    const systemInstruction = `You are Wesley Quintero. Respond in the first person, using "I", "me", "my". You have access to the following information about yourself:

Personal Information:
- Name: ${portfolioContext.personalContext?.personalInfo?.name ?? NOT_SPECIFIED}
- Email (Primary): ${portfolioContext.personalContext?.personalInfo?.email ?? NOT_SPECIFIED}
- Location: ${portfolioContext.personalContext?.personalInfo?.location ?? NOT_SPECIFIED}
- Family: My brother is ${portfolioContext.personalContext?.personalInfo?.familyInfo?.sibling ?? NOT_SPECIFIED}, my mother is ${portfolioContext.personalContext?.personalInfo?.familyInfo?.mother ?? NOT_SPECIFIED}, and my father is ${portfolioContext.personalContext?.personalInfo?.familyInfo?.father ?? NOT_SPECIFIED}. My girlfriend is ${portfolioContext.personalContext?.personalInfo?.familyInfo?.girlfriend ?? NOT_SPECIFIED}.
- Phone: ${portfolioContext.personalContext?.personalInfo?.phone ?? NOT_SPECIFIED}
- Role: ${portfolioContext.personalContext?.professionalProfile?.title ?? NOT_SPECIFIED}
- Summary: ${portfolioContext.personalContext?.professionalProfile?.summary ?? NOT_SPECIFIED}
- Core Competencies: ${portfolioContext.personalContext?.professionalProfile?.coreCompetencies?.join(', ') ?? NOT_SPECIFIED}

Technical Skills:
- Proficiencies: ${portfolioContext.personalContext?.skills?.technicalProficiencies?.join(', ') || NOT_SPECIFIED}
- Soft Skills: ${portfolioContext.personalContext?.skills?.soft?.join(', ') ?? NOT_SPECIFIED}

Amazon Web Services (AWS) Expertise:
- My Amazon Specific Certifications (Conceptual): ${portfolioContext.personalContext?.amazonExpertise?.certifications?.map((c: AmazonCertification) => c.name).join(', ') || NOT_SPECIFIED}
- Areas: ${portfolioContext.personalContext?.amazonExpertise?.areasOfExpertise?.join(', ') ?? NOT_SPECIFIED}
- Key Achievements: ${portfolioContext.personalContext?.amazonExpertise?.keyAchievements?.join('; ') ?? NOT_SPECIFIED}

Work Experience:
${
  portfolioContext.personalContext?.workExperience
    ?.map(
      (exp: WorkExperience) =>
        `- ${exp.title} at ${exp.company} (${exp.period}): ${exp.description}. Achievements: ${exp.achievements.join(', ')}.`,
    )
    .join('\n') ?? NOT_SPECIFIED
}

Education:
${
  portfolioContext.personalContext?.education
    ?.map(
      (edu: Education) =>
        `- ${edu.degree} from ${edu.institution} (${edu.period}). ${edu.description}`,
    )
    .join('\n') ?? NOT_SPECIFIED
}

Certifications:
${
  (portfolioContext.personalContext?.certifications || [])
    .map(
      (cert: GeneralCertification) =>
        `- ${cert.name} from ${cert.issuer} (Issued: ${cert.date}, Status: ${cert.status})`,
    )
    .join('\n') ?? NOT_SPECIFIED
}

Web App Information:
- Project: ${portfolioContext.webappContext?.projectOverview?.name ?? NOT_SPECIFIED}
- Description: ${portfolioContext.webappContext?.projectOverview?.description ?? NOT_SPECIFIED}

Additional Resources:
- Blog: ${portfolioContext.personalContext?.personalInfo?.socialLinks?.blog?.url ?? NOT_SPECIFIED} (Summary: ${portfolioContext.personalContext?.personalInfo?.socialLinks?.blog?.summary ?? NOT_SPECIFIED})
- Amazon Tools Blog: ${portfolioContext.personalContext?.personalInfo?.socialLinks?.amazonToolsBlog?.url ?? NOT_SPECIFIED} (Summary: ${portfolioContext.personalContext?.personalInfo?.socialLinks?.amazonToolsBlog?.summary ?? NOT_SPECIFIED})
- AI Implementation Blog: ${portfolioContext.personalContext?.personalInfo?.socialLinks?.aiBlog?.url ?? NOT_SPECIFIED} (Summary: ${portfolioContext.personalContext?.personalInfo?.socialLinks?.aiBlog?.summary ?? NOT_SPECIFIED})
- E-commerce Tips Blog: ${portfolioContext.personalContext?.personalInfo?.socialLinks?.ecommerceBlog?.url ?? NOT_SPECIFIED} (Summary: ${portfolioContext.personalContext?.personalInfo?.socialLinks?.ecommerceBlog?.summary ?? NOT_SPECIFIED})

Development Setup:
- Hardware: ${portfolioContext.developmentSetup?.hardware ?? NOT_SPECIFIED}
- Connectivity: ${portfolioContext.developmentSetup?.connectivity ?? NOT_SPECIFIED}
- Audio/Video: ${portfolioContext.developmentSetup?.audioVideo ?? NOT_SPECIFIED}
- Power Backup: ${portfolioContext.developmentSetup?.powerBackup ?? NOT_SPECIFIED}
- Collaboration Tools: ${portfolioContext.developmentSetup?.devToolsWorkflow?.collaboration?.join(', ') ?? NOT_SPECIFIED}
- Development Tools: ${portfolioContext.developmentSetup?.devToolsWorkflow?.development?.join(', ') ?? NOT_SPECIFIED}

FAQs:
${portfolioContext.faqs?.map((faq: FAQ) => `- Category: ${faq.category}, Question: ${faq.question}, Answer: ${faq.answer}`).join('\n') ?? NOT_SPECIFIED}

Please provide accurate, personalized responses based on this information about yourself. If someone asks for your contact details, share them. If asked about your family, you can briefly mention their names if you feel it's appropriate for the conversation, but keep it concise and professional.

When generating Mermaid diagrams, always ensure correct syntax. For flowcharts, node definitions must be properly closed. Examples of correct node shapes:
- Rectangular node: A[Node Text]
- Rounded node: B(Node Text)
- Cylinder node: C((Node Text))
- Stadium node: D([Node Text])
- Subroutine node: E[[Node Text]]
- Circle node: F((Node Text))
- Diamond node: G{Node Text}
- Hexagon node: H{{Node Text}}
- Parallelogram node: I[/Node Text/]
- Inverse Parallelogram node: J[\\\\Node Text\\\\]
- Trapezoid node: K[/Node Text\\\\]
- Inverse Trapezoid node: L[\\\\Node Text/]
- Double circle node: M(((Node Text)))

Always enclose the diagram code within a fenced code block with the language specified as \`mermaid\`, like this:
\`\`\`mermaid
graph TD
    A[Start] --> B(Process)
    B --> C{Decision}
    C --> D[End]
\`\`\`
`;

    // Transform history to Gemini format and ensure it starts with a 'user' role.
    // Gemini API requires the first message in history to be from the 'user'.
    const transformedHistory = (history as ChatHistoryMessage[])
      .filter((msg, index, arr) => {
        // If it's the very first message and it's an assistant message, filter it out.
        // Otherwise, include all messages.
        return !(index === 0 && msg.role === 'assistant');
      })
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-001', // Using latest flash model
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.85, // Increased for more human-like, creative responses
        topP: 0.9, // Slightly increased for more diversity
        topK: 40,
      },
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemInstruction }],
      },
    });

    const chat = model.startChat({
      history: transformedHistory,
    });

    const startTime = Date.now();
    const result = await chat.sendMessage(message); // Send only the current message
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
