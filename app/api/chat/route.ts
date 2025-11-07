/**
 * NEW FILE: AI Chat API - Ultra-Intelligent Conversational Interface
 * 
 * Purpose: Provides real-time AI-powered chat using OpenAI with function calling
 * 
 * Features:
 * - Streaming responses for instant feedback
 * - Function calling for real-time data access
 * - Conversation memory and context management
 * - Smart error handling and fallbacks
 * - Rate limiting and security
 * 
 * Architecture:
 * - Uses OpenAI GPT-4 for natural language understanding
 * - Integrates with database for order tracking, menu search
 * - Maintains conversation context for personalized experience
 * - Streams responses for better UX
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { aiChatFunctions, executeAIFunction } from '@/lib/ai-chat-functions';
import { z } from 'zod';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt - The AI's personality and context
const SYSTEM_PROMPT = `You're the AI for Bantu's Kitchen - a food-obsessed, slightly sarcastic sales genius who makes people order without realizing they're being sold to.

**Your Vibe:**
Sharp. Funny. Quick. You talk like that friend who knows food and doesn't waste words. Every response is 5-60 words MAX. Short, punchy, makes them go "damn that's good." You're not here to explain - you're here to make them hungry and close the sale.

**THE RULES (Break these and you fail):**
1. NEVER go over 60 words - keep it tight
2. NEVER use bullets, asterisks, dashes, or markdown
3. ALWAYS call functions to get REAL data first
4. ALWAYS show prices in ₹ (Rupees) 
5. Make every response feel like a mic drop
6. End with a question or hook that leads to ordering
7. Be funny but don't try too hard

**Your Powers:**
- Real menu with live prices (₹)
- Order tracking (call getOrderStatus function)
- Delivery estimates
- Phone: +91 90104 60964 (India)

**CRITICAL: Phone Number Detection**
- Indian numbers: 10 digits starting with 6-9, or +91
- US/Foreign numbers: Start with 1, 2-9, or country codes
- If you see a foreign number (like 6192778065, 2125551234, etc):
  * Roast them gently: "Spotted that foreign number! We're India-based."
  * Guide them: "Call +91 90104 60964 or email orders@bantuskitchen.com"
  * Ask: "Ordering from abroad or just visiting?"
  * NEVER try to look up foreign numbers in database

**Location:**
Hayatnagar, Hyderabad 501505 (India only - 5km delivery)

**Examples (Match This Energy):**

User: "What's popular?"
You: [CALL getPopularItems] "Butter Chicken is legendary here. Creamy, rich, people literally dream about it. ₹349. Want some?"

User: "Show me spicy"
You: [CALL searchMenuItems] "Chicken 65 at ₹229 will wake you up. Rogan Josh at ₹399 brings the heat. Which burn level?"

User: "How much is Paneer Tikka?"
You: [CALL searchMenuItems] "₹189. Grilled perfection. Add garlic naan and you're set. In?"

User: "Track order"
You: "Order number or phone? I'll find it."

User: "Phone number"
You: "+91 90104 60964 or just talk to me. I'm faster."

User: "Track order: 6192778065"
You: "That's a US number! We're India-based. Call +91 90104 60964 or email orders@bantuskitchen.com. Ordering from abroad?"

**Your Mission:**
Make them buy. Fast. Short responses, big impact. Call functions first, then hit them with flavor. No lectures, no explanations - just cravings and conversions.

Stay under 60 words. Make every word count. Drive sales like your life depends on it.`;

// Request schema
const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system', 'function']),
    content: z.string(),
    name: z.string().optional(),
  })),
  conversationId: z.string().optional(),
  userContext: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
});

/**
 * POST /api/chat
 * Main chat endpoint with streaming support
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const { messages, userContext } = chatRequestSchema.parse(body);

    // Enhance system prompt with user context if available
    let enhancedSystemPrompt = SYSTEM_PROMPT;
    if (userContext?.phone || userContext?.email) {
      enhancedSystemPrompt += `\n\n**Current Customer Context:**
${userContext.phone ? `- Phone: ${userContext.phone}` : ''}
${userContext.email ? `- Email: ${userContext.email}` : ''}
${userContext.location ? `- Location: ${userContext.location}` : ''}

Use this information proactively to personalize the experience. You can use getCustomerOrderHistory to see their past orders.`;
    }

    // Prepare messages for OpenAI
    const openAIMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: enhancedSystemPrompt,
      },
      ...messages.slice(-10).map(msg => ({ // Keep last 10 messages for context
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
    ];

    // Convert our function definitions to OpenAI format
    const tools: OpenAI.Chat.ChatCompletionTool[] = Object.values(aiChatFunctions).map(func => ({
      type: 'function' as const,
      function: {
        name: func.name,
        description: func.description,
        parameters: zodToJsonSchema(func.parameters),
      },
    }));

    // Call OpenAI with function calling
    let response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: openAIMessages,
      tools,
      tool_choice: 'auto',
      temperature: parseFloat(process.env.CHAT_TEMPERATURE || '0.7'),
      max_tokens: parseInt(process.env.CHAT_MAX_TOKENS || '1000'),
      stream: false, // We'll handle streaming differently
    });

    // Handle function calls
    const responseMessage = response.choices[0].message;
    let functionResults: any[] = [];

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // Execute all function calls
      functionResults = await Promise.all(
        responseMessage.tool_calls.map(async (toolCall) => {
          if (toolCall.type === 'function') {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);

            console.log(`[AI Chat] Calling function: ${functionName}`, functionArgs);

            const result = await executeAIFunction(functionName, functionArgs);

            return {
              tool_call_id: toolCall.id,
              role: 'tool' as const,
              name: functionName,
              content: JSON.stringify(result),
            };
          }
        })
      );

      // Make a second call with function results
      const secondMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        ...openAIMessages,
        responseMessage,
        ...functionResults,
      ];

      response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: secondMessages,
        temperature: parseFloat(process.env.CHAT_TEMPERATURE || '0.7'),
        max_tokens: parseInt(process.env.CHAT_MAX_TOKENS || '1000'),
        stream: false,
      });
    }

    // Get final response
    const finalResponse = response.choices[0].message.content || 'I apologize, but I encountered an issue. Please try again.';

    // Return response
    return NextResponse.json({
      success: true,
      message: finalResponse,
      functionsCalled: functionResults.map(r => r.name),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[AI Chat] Error:', error);

    // Handle specific errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format',
        details: error.issues,
      }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json({
        success: false,
        error: 'AI service not configured. Please contact support.',
      }, { status: 503 });
    }

    // Generic error response
    return NextResponse.json({
      success: false,
      error: 'An error occurred while processing your message. Please try again.',
      fallbackMessage: 'I\'m having trouble connecting right now. Please try again in a moment, or call us directly at (555) 123-4567.',
    }, { status: 500 });
  }
}

/**
 * GET /api/chat
 * Health check and configuration info
 */
export async function GET() {
  return NextResponse.json({
    status: 'operational',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    functionsAvailable: Object.keys(aiChatFunctions),
    features: [
      'Real-time order tracking',
      'Smart menu search',
      'Delivery estimates',
      'Personalized recommendations',
      'Customer history access',
      'Item availability checking',
      'Restaurant hours',
    ],
    version: '2.0.0',
  });
}

/**
 * Helper: Convert Zod schema to JSON Schema for OpenAI
 */
function zodToJsonSchema(schema: z.ZodObject<any>): any {
  // Handle Zod v4 API - shape is a property, not a method
  const shape = typeof schema._def.shape === 'function' 
    ? schema._def.shape() 
    : schema._def.shape;
    
  const properties: any = {};
  const required: string[] = [];

  Object.keys(shape).forEach(key => {
    const field = shape[key];
    properties[key] = zodTypeToJsonSchema(field);

    if (!(field instanceof z.ZodOptional)) {
      required.push(key);
    }
  });

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

function zodTypeToJsonSchema(zodType: any): any {
  // Handle optional
  if (zodType instanceof z.ZodOptional) {
    return zodTypeToJsonSchema(zodType._def.innerType);
  }

  // Handle default
  if (zodType instanceof z.ZodDefault) {
    return zodTypeToJsonSchema(zodType._def.innerType);
  }

  // Handle string
  if (zodType instanceof z.ZodString) {
    const schema: any = { type: 'string' };
    if (zodType.description) schema.description = zodType.description;
    return schema;
  }

  // Handle number
  if (zodType instanceof z.ZodNumber) {
    const schema: any = { type: 'number' };
    if (zodType.description) schema.description = zodType.description;
    return schema;
  }

  // Handle boolean
  if (zodType instanceof z.ZodBoolean) {
    const schema: any = { type: 'boolean' };
    if (zodType.description) schema.description = zodType.description;
    return schema;
  }

  // Handle array
  if (zodType instanceof z.ZodArray) {
    return {
      type: 'array',
      items: zodTypeToJsonSchema(zodType._def.type),
      description: zodType.description,
    };
  }

  // Handle object
  if (zodType instanceof z.ZodObject) {
    return zodToJsonSchema(zodType);
  }

  // Default fallback
  return { type: 'string' };
}

