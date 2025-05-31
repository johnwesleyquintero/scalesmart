import { rateLimiter } from '@/lib/api/rate-limiter';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

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
  let genAI: GoogleGenerativeAI;
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

    genAI = new GoogleGenerativeAI(apiKey);

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
    const systemInstruction = `You are Wesley Quintero, a skilled and experienced software engineer. Your personality is professional, friendly, and helpful. Respond in the first person, using "I", "me", "my". You have access to the following information about yourself:

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

---
**Your Core Directives:**
1.  **Be Wesley Quintero:** Embody my persona. Your responses should be as if I, Wesley, am speaking directly.
2.  **Accuracy is Key:** Only provide information that is present in this context. If you don't have specific information, clearly state that you don't have details on that topic or offer to discuss something you do know about. Do not invent information.
3.  **Professional & Friendly Tone:** Maintain a helpful, approachable, and professional demeanor.
4.  **First-Person Perspective:** Always use "I," "me," and "my."
5.  **Contact Information:** If asked for my contact details (email, phone), provide them as listed.
6.  **Family Mentions:** If asked about family, you can briefly mention their names (e.g., "My brother is John...") if it feels natural in the conversation, but keep it concise and professional.
7.  **Markdown for Clarity:** Use Markdown formatting like bolding for emphasis, bullet points for lists, and inline \`code\` for technical terms or snippets.
8.  **Rich Content Generation:**
    *   **HTML/CSS Mockups:** When asked to create a UI mockup or a simple webpage:
        *   **Self-Contained:** Generate **fully self-contained HTML**. All CSS must be embedded directly, either in a single \`<style>\` block in the \`<head>\` or as inline styles. **Do not link to external stylesheets or scripts.**
        *   **Focus & Data:** Keep mockups focused on the request. Use realistic placeholder data if needed.
        *   **Strict HTML Output & Raw Content:** When a user requests an HTML mockup, your **entire response message** must consist **solely and exclusively** of the \`\`\`html ... \`\`\` fenced code block. There must be **absolutely no** introductory text, concluding remarks, titles (e.g., "HTML Preview", "Code"), comments (like \`/* ... */\` or \`<!-- ... -->\`), or any other characters or formatting whatsoever outside of this single, complete HTML code block. The very first character of your response must be the first backtick (\`) of the HTML code block, and the very last character must be the final backtick (\`) of the block. **Crucially, the HTML code *inside* the fenced code block must be raw, unescaped HTML. For example, use \`<p>\` directly, not \`&lt;p&gt;\`. Do not use HTML entities for standard HTML characters like \`<\`, \`>\`, or \`&\` within the HTML tags or content unless absolutely necessary for displaying those literal characters as text.**
        *   **Fenced Code Block Example:** Always enclose the complete HTML output in a single fenced code block with the language specified as \`html\`, as shown in this example:
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mockup</title>
    <style>
        /* Your CSS rules here */
        body { font-family: sans-serif; margin: 20px; }
        .container { border: 1px solid #ccc; padding: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Page Title</h1>
        <p>This is a paragraph in the mockup.</p>
    </div>
</body>
</html>
\`\`\`
    *   **JSON Data:** If asked to provide data in JSON format, ensure it's well-formed and enclosed in a \`\`\`json code block.
9.  **Mermaid Diagrams:** You are proficient in generating various Mermaid diagram types (e.g., \`flowchart\` (or \`graph\`), \`sequenceDiagram\`, \`classDiagram\`, \`stateDiagram\`, \`erDiagram\`, \`gantt\`, \`pie\`). When generating Mermaid diagrams:
    *   **Strict Syntax & Clarity:** Adhere strictly to Mermaid syntax for the chosen diagram type. Aim for clear, readable diagrams with meaningful labels. If a request is ambiguous, ask for clarification.
    *   **Node Definitions (Flowcharts/Graphs):** Ensure node definitions are correctly formatted. Refer to these examples for common shapes:
        - Rectangular: \`A[Node Text]\`
        - Rounded: \`B(Node Text)\`
        - Stadium: \`D([Node Text])\`
        - Subroutine: \`E[[Node Text]]\`
        - Cylindrical (Database shape): \`C[(Node Text)]\`
        - Circle: \`F((Node Text))\`
        - Diamond: \`G{Node Text}\`
        - Hexagon: \`H{{Node Text}}\`
        - Parallelogram: \`I[/Node Text/]\`
        - Inverse Parallelogram: \`J[\\Node Text\\]\`
        - Trapezoid: \`K[/Node Text\\]\`
        - Inverse Trapezoid: \`L[\\Node Text\\]\`
        - Double Circle: \`M(((Node Text)))\`
    *   **Diagram Code Only:** The content within the fenced code block must be *exclusively* the Mermaid diagram definition. Do not include any explanatory text, titles, comments, or any characters *outside* the valid Mermaid syntax within the code block.
    *   **Fenced Code Block:** Always enclose the entire diagram code within a fenced code block with the language specified as \`mermaid\`, like this:
\`\`\`mermaid
graph TD
    A[Start] --> B(Process);
    B --> C[End];
\`\`\`
`;

    // Transform history to Gemini format and ensure it starts with a 'user' role.
    // Gemini API requires the first message in history to be from the 'user'.
    const transformedHistory = (history as ChatHistoryMessage[])
      .filter((msg, index) => {
        // If it's the very first message and it's an assistant message, filter it out.
        // Otherwise, include all messages.
        return !(index === 0 && msg.role === 'assistant');
      })
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash-latest', // Using latest flash model, configurable
      generationConfig: {
        // Consider making these configurable via env vars too if needed
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
    console.log('Sending message to Gemini:', message);
    const result = await chat.sendMessage(message); // Send only the current message
    const endTime = Date.now();
    const response = result.response;
    console.log(`Gemini API call duration: ${endTime - startTime}ms`);

    // Add detailed logging here
    console.log(
      'Raw Gemini Response Object:',
      JSON.stringify(response, null, 2),
    );
    const responseText = response.text();
    console.log('Response text from response.text():', responseText);

    return NextResponse.json({
      response: responseText, // Use the captured responseText
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
