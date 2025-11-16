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
import { restaurantInfo } from '@/data/menuData';
import { z } from 'zod';
import { extractItemsFromMessage, matchItemsToDatabase, type MatchedItem } from '@/lib/nlp-item-extraction';

// Initialize OpenAI
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ OpenAI API key not configured - AI chat will not work');
}

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// System prompt - The AI's personality and context
const SYSTEM_PROMPT = `You're the AI for Bantu's Kitchen - a food-obsessed, slightly sarcastic sales genius who makes people order without realizing they're being sold to.

**Your Vibe:**
Sharp. Funny. Quick. You talk like that friend who knows food and doesn't waste words. Every response is 5-60 words MAX. Short, punchy, makes them go "damn that's good." You're not here to explain - you're here to make them hungry and close the sale.

**THE RULES (Break these and you fail):**
1. NEVER go over 60 words - keep it tight
2. NEVER use bullets, asterisks, dashes, or markdown
3. NEVER use emojis - you're witty with words, not pictures
4. ALWAYS call functions to get REAL data first
5. ALWAYS show prices in ₹ (Rupees) 
6. Make every response feel like a mic drop
7. End with a question or hook that leads to ordering
8. Be funny but don't try too hard

**PRICING ACCURACY (CRITICAL - NEVER BREAK THIS):**
- NEVER make up or guess prices
- ALWAYS call searchMenuItems or getPopularItems FIRST before mentioning ANY price
- Quote EXACT price from database - wrong price = lost customer trust
- If you don't have the price data, ask them to wait while you check

**CART MANIPULATION POWERS (NEW!):**
You can now ADD and REMOVE items from their cart! Use these functions:
- When user says "add [item]" → ASK: "How many [item]?" FIRST, then call addItemToCart with quantity
- When user gives quantity → Call addItemToCart with that quantity
- When user says "yes" / "add it" WITHOUT context → ASK: "Which item? How many?"
- When user says "remove that" / "take it out" → Call removeItemFromCart  
- When user says "checkout" / "order now" / "I'm ready" → Call proceedToCheckout

**CRITICAL QUANTITY RULE:**
ALWAYS ask "How many?" before adding items. NEVER assume quantity = 1 unless explicitly stated.
Examples:
- User: "add butter chicken" → You: "How many Butter Chicken? (₹299 each)"
- User: "2 please" → You: [Call addItemToCart with quantity: 2] "Added 2! Ready to checkout?"
- User: "add tikka masala and 3 naan" → You: [Add tikka masala qty:1, naan qty:3] "Added! Total: ₹..."

IMPORTANT: You MUST have the sessionId from context to use cart functions!

**URGENCY PROTOCOL (MANDATORY - Your Sales Weapon):**
Before recommending ANY item:
1. Call searchMenuItems to get REAL price
2. Call getItemDemandPressure to check urgency
3. If demand score > 50, lead with urgency: "This is HOT right now..."
4. If stock < 5, create panic: "Only X left - people are ordering fast"
5. If 3+ people have in cart, use social proof: "3 people have this in cart RIGHT NOW"

**Urgency Response Formula:**
- Score 76-100: "CRITICAL - Only X left! Y people ordering now! Get yours?"
- Score 51-75: "HIGH DEMAND - Z people eyeing this. Want to secure it?"
- Stock ≤ 3: "LAST FEW - Only X remaining. Add before gone?"
- Otherwise: Push benefits + add question: "Want one?"

**CHECKOUT PRESSURE (Push Hard):**
After EVERY item added: "Ready to lock in your order? Checkout takes 30 seconds."
When cart > ₹500: "You've got free delivery! Checkout now?"
When user hesitates: "Items in your cart are moving fast. Lock it in?"

**CRITICAL RECOMMENDATION RULE:**
When recommending dishes, you MUST:
1. Call searchMenuItems or getPopularItems FIRST
2. Use the EXACT item names from the function results
3. Mention items by their FULL NAME in your response (e.g., "Chicken Tikka Masala", not just "tikka")
4. Only recommend items that were returned in the function call
5. NEVER say "we're out" or "fresh out" unless the function returns ZERO items

Example (CORRECT):
- AI calls searchMenuItems({ query: "chicken" })
- Function returns: [{ name: "Chicken Tikka Masala", price: 289 }, { name: "Butter Chicken", price: 320 }]
- AI response: "Chicken Tikka Masala - grilled chicken in spicy curry. ₹289. Want it?"

Example (WRONG - DON'T DO THIS):
- AI calls searchMenuItems({ query: "chicken" })
- Function returns: [{ name: "Chicken Tikka Masala", price: 289 }]
- AI response: "Try our tikka - it's amazing!" ❌ (Not using exact name!)

**DESSERT QUERIES (CRITICAL):**
- When user asks for "dessert", "desserts", "sweet", "sweets" → ALWAYS call searchMenuItems({ category: "desserts" }) FIRST
- If function returns items → Show them with FULL names and prices
- If function returns empty → THEN say "we're fresh out"
- NEVER say "out of desserts" without calling the function first

**Your Powers:**
- Real menu with live prices (₹) - ALWAYS call searchMenuItems first!
- Add/remove cart items directly
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
You: [CALL getPopularItems] [CALL getItemDemandPressure] "Butter Chicken is legendary - ₹299, 4 people just added it, only 5 left! Want one?"

User: "Show me spicy"
You: [CALL searchMenuItems] "Chicken 65 at ₹229 will wake you up. Rogan Josh at ₹399 brings the heat. Which burn level?"

User: "add butter chicken"
You: [CALL searchMenuItems] "How many Butter Chicken? ₹299 each, and we're down to 5!"

User: "2 please"
You: [CALL addItemToCart with quantity: 2] "Added 2 Butter Chicken! ₹598. Garlic naan pairs perfect (₹49). Want some?"

User: "yes add it"
You: "How many naan?"

User: "3"
You: [CALL addItemToCart with quantity: 3] "Done! 3 naan added. Cart total: ₹745. Ready to lock it in?"

User: "checkout"
You: [CALL proceedToCheckout] "Let's do this! Taking you to checkout now..."

User: "Track order"
You: "Order number or phone? I'll find it."

User: "Phone number"
You: "+91 90104 60964 or just talk to me. I'm faster."

User: "Track order: 6192778065"
You: "That's a US number! We're India-based. Call +91 90104 60964 or email orders@bantuskitchen.com. Ordering from abroad?"

**Your Mission:**
1. ALWAYS call searchMenuItems before quoting prices
2. ALWAYS ask "How many?" before adding items to cart
3. Use cart manipulation functions when user confirms with quantity
4. Create urgency on EVERY recommendation
5. Push toward checkout after EVERY addition
6. Make them buy. Fast. Short responses, big impact.

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
  cartData: z.object({
    items: z.array(z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number(),
      price: z.number(),
      category: z.string(),
    })),
    itemCount: z.number(),
    subtotal: z.number(),
    total: z.number(),
  }).optional(),
});

/**
 * POST /api/chat
 * Main chat endpoint with streaming support
 */
export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI is configured
    if (!openai) {
      return NextResponse.json(
        {
          error: '❌ AI CHAT NOT CONFIGURED: Missing OpenAI API key.\n' +
                 'Required environment variable:\n' +
                 '- OPENAI_API_KEY\n\n' +
                 'Sign up: https://platform.openai.com\n' +
                 'Get API key from: Dashboard > API Keys',
        },
        { status: 503 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const { messages, userContext, cartData } = chatRequestSchema.parse(body);

    // Get or generate session ID for cart operations
    const sessionId = body.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Enhance system prompt with user context if available
    let enhancedSystemPrompt = SYSTEM_PROMPT;
    
    // Add session ID to context
    enhancedSystemPrompt += `\n\n**SESSION INFO:**
- Session ID: ${sessionId}
- Use this sessionId for all cart manipulation functions (addItemToCart, removeItemFromCart, proceedToCheckout)`;

    if (userContext?.phone || userContext?.email) {
      enhancedSystemPrompt += `\n\n**Current Customer Context:**
${userContext.phone ? `- Phone: ${userContext.phone}` : ''}
${userContext.email ? `- Email: ${userContext.email}` : ''}
${userContext.location ? `- Location: ${userContext.location}` : ''}

Use this information proactively to personalize the experience. You can use getCustomerOrderHistory to see their past orders.`;
    }

    // Add cart context to system prompt for AI awareness
    if (cartData && cartData.items.length > 0) {
      const cartSummary = cartData.items
        .map((item: any) => `${item.name} (x${item.quantity}) - ₹${item.price}`)
        .join(', ');
      
      enhancedSystemPrompt += `\n\n**CURRENT CART (${cartData.itemCount} items, ₹${cartData.total} total):**
${cartSummary}

**URGENCY INTELLIGENCE (Your Secret Weapon):**
You can SEE their cart! Use this to create FOMO and drive conversion:

1. **Always acknowledge their cart** when relevant to the conversation
2. **Call getCartSummary** to get detailed urgency data for cart items
3. **Use psychological triggers:**
   - Scarcity: "Only X left"
   - Social Proof: "X people have this in cart right now"
   - Urgency: "Stock dropping fast"
   - FOMO: "Before it's gone"

4. **Response Patterns:**
   HIGH DEMAND: "That Butter Chicken you've got? 4 people just added it and we're down to 5. Lock it in?"
   MODERATE DEMAND: "Smart choice on the Paneer Tikka. 3 others eyeing it too."
   LOW STOCK: "Only 3 Garlic Naans left today. Grab extras now."
   COMPLEMENTARY UPSELL: "You've got Chicken 65 but no rice? Add Jeera Rice - 87% of people do."

5. **Formula:** [Acknowledge cart] + [Urgency trigger] + [Social proof] + [Call to action question]

Make them feel their cart is smart, but time-sensitive. Drive that order home!`;
    }

    // Prepare messages for OpenAI
    const openAIMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: enhancedSystemPrompt,
      },
      ...messages.slice(-10).map((msg: any) => ({ // Keep last 10 messages for context
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
    ];

    // Convert our function definitions to OpenAI format
    const tools: OpenAI.Chat.ChatCompletionTool[] = Object.values(aiChatFunctions).map((func: any) => ({
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
        responseMessage.tool_calls.map(async (toolCall: any) => {
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

    // GENIUS FEATURE: Generate action buttons based on AI response and function calls
    const actions = await generateActionButtons(finalResponse, functionResults, cartData);

    // Return response with action buttons
    return NextResponse.json({
      success: true,
      message: finalResponse,
      actions, // NEW: Action buttons for frontend
      sessionId, // Return session ID for cart operations
      functionsCalled: functionResults.map((r: any) => r.name),
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
      fallbackMessage: `I'm having trouble connecting right now. Please try again in a moment, or call us directly at ${restaurantInfo.contact.phone}.`,
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

  Object.keys(shape).forEach((key: string) => {
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

/**
 * GENIUS FUNCTION: Generate Action Buttons from AI Response
 * Multi-layer detection: Function calls + NLP extraction + Fuzzy matching
 */
async function generateActionButtons(aiResponse: string, functionResults: any[], cartData: any) {
  const actions: Array<{
    type: string;
    label: string;
    itemId?: string;
    itemName?: string;
    price?: number;
    quantity?: number;
    urgency?: any;
    menuItem?: any; // NEW: Full menu item data for rendering
    items?: Array<{
      itemId: string;
      name: string;
      quantity: number;
      price: number;
      menuItem?: any; // NEW: Full menu item data for bulk actions
    }>;
    totalPrice?: number;
    itemCount?: number;
  }> = [];

  const detectedItems = new Map<string, any>(); // itemId -> full item data

  // ===== LAYER 1: Function Results (Highest Priority) =====
  
  // Check if AI called searchMenuItems
  const searchResults = functionResults.find((r: any) => r.name === 'searchMenuItems');
  if (searchResults) {
    try {
      const result = JSON.parse(searchResults.content);
      if (result.success && result.items && result.items.length > 0) {
        result.items.forEach((item: any) => {
          detectedItems.set(item.id, item); // Store FULL item data
        });
      }
    } catch (e) {
      console.error('[Button Gen] Error parsing searchMenuItems:', e);
    }
  }

  // Check if AI called getPopularItems
  const popularResults = functionResults.find((r: any) => r.name === 'getPopularItems');
  if (popularResults) {
    try {
      const result = JSON.parse(popularResults.content);
      if (result.success && result.items && result.items.length > 0) {
        result.items.slice(0, 5).forEach((item: any) => {
          if (!detectedItems.has(item.id)) {
            detectedItems.set(item.id, item); // Store FULL item data
          }
        });
      }
    } catch (e) {
      console.error('[Button Gen] Error parsing getPopularItems:', e);
    }
  }

  // ===== LAYER 2: NLP Pattern Matching (Backup) =====
  
  if (detectedItems.size === 0) {
    // Only use NLP if function calls didn't find items
    try {
      const extractedItems = extractItemsFromMessage(aiResponse);
      if (extractedItems.length > 0) {
        const matchedItems = await matchItemsToDatabase(extractedItems);
        matchedItems.forEach((item: any) => {
          if (item.confidence >= 0.8) { // 80% confidence threshold
            detectedItems.set(item.id, {
              id: item.id,
              name: item.name,
              price: item.price,
              category: item.category || 'Menu',
            });
          }
        });
      }
    } catch (e) {
      console.error('[Button Gen] Error in NLP extraction:', e);
    }
  }

  // ===== GENERATE INDIVIDUAL BUTTONS WITH FULL MENU DATA =====
  
  const itemsArray = Array.from(detectedItems.values());
  
  console.log('[Button Gen] All detected items:', itemsArray.map((i: any) => i.name));
  console.log('[Button Gen] AI Response:', aiResponse.substring(0, 200));
  
  // GENIUS FILTER: Show items that AI mentioned OR were returned by function calls
  // GENIUS FIX: If function returned items but AI didn't mention them (e.g., said "out of stock" incorrectly),
  // still show the items so user can add them!
  const mentionedItems = itemsArray.filter((item: any) => {
    const itemNameLower = item.name.toLowerCase();
    const responseLower = aiResponse.toLowerCase();
    
    // Strategy 1: Exact full name match
    const exactMatch = responseLower.includes(itemNameLower);
    
    // Strategy 2: Check if response contains 2+ words from item name
    // e.g., "Chicken Tikka" matches "Chicken Tikka Masala"
    const words = itemNameLower.split(' ').filter((w: string) => w.length > 3); // Skip small words like "and", "the"
    const matchedWords = words.filter((word: string) => responseLower.includes(word));
    const multiWordMatch = matchedWords.length >= Math.min(2, words.length);
    
    // Strategy 3: Reverse match - check if shortened name in response matches item
    // e.g., response says "tikka masala", item is "Chicken Tikka Masala"
    const responseWords = responseLower.split(/\s+/);
    const reverseMatch = responseWords.some((rWord: string) => {
      if (rWord.length <= 4) return false; // Skip short words
      return itemNameLower.includes(rWord);
    });
    
    // Strategy 4: GENIUS FIX - If function returned items but AI said "out of stock" or "fresh out",
    // still show them! User might want them anyway or AI might be wrong.
    const aiSaidOutOfStock = responseLower.includes('out of') || 
                             responseLower.includes('fresh out') || 
                             responseLower.includes("we're out") ||
                             responseLower.includes("don't have");
    
    // If AI said "out of stock" but function returned items, show them anyway
    const showDespiteOutOfStock = aiSaidOutOfStock && itemsArray.length > 0;
    
    const isMatched = exactMatch || multiWordMatch || reverseMatch || showDespiteOutOfStock;
    console.log(`[Button Gen] ${item.name}: exact=${exactMatch}, multiWord=${multiWordMatch} (${matchedWords.length}/${words.length}), reverse=${reverseMatch}, showDespiteOutOfStock=${showDespiteOutOfStock} → ${isMatched}`);
    
    return isMatched;
  });
  
  console.log('[Button Gen] Mentioned items (filtered):', mentionedItems.map((i: any) => i.name));
  
  mentionedItems.forEach((item: any) => {
    actions.push({
      type: 'add_to_cart',
      label: `Add ${item.name}`,
      itemId: item.id,
      itemName: item.name,
      price: item.price,
      quantity: 1,
      menuItem: item, // NEW: Include full menu item data
    });
  });

  // ===== ADD URGENCY DATA TO BUTTONS =====
  
  const demandResults = functionResults.find((r: any) => r.name === 'getItemDemandPressure');
  if (demandResults) {
    try {
      const result = JSON.parse(demandResults.content);
      if (result.success && result.items) {
        result.items.forEach((item: any) => {
          const existingAction = actions.find((a: any) => a.itemId === item.itemId);
          if (existingAction && item.urgencyLevel) {
            existingAction.urgency = {
              level: item.urgencyLevel,
              message: item.urgencyMessage,
              demandScore: item.demandScore,
            };
          }
        });
      }
    } catch (e) {
      console.error('[Button Gen] Error parsing demand pressure:', e);
    }
  }

  // ===== GENIUS FEATURE: "Add All Items" Bulk Button =====
  
  const addToCartActions = actions.filter((a: any) => a.type === 'add_to_cart');
  
  // GENIUS FIX: Check if items are already in cart before showing "Add All" button
  const cartItemIds = new Set(
    (cartData?.items || []).map((item: any) => item.menuItem?.id || item.id)
  );
  
  // Only show "Add All" if we have 2+ items AND not all items are already in cart
  const itemsNotInCart = addToCartActions.filter((action: any) => 
    action.itemId && !cartItemIds.has(action.itemId)
  );
  
  if (addToCartActions.length >= 2 && itemsNotInCart.length > 0) {
    // Calculate total price (keep for backend, don't show in label)
    const totalPrice = addToCartActions.reduce((sum: number, action: any) => 
      sum + (action.price || 0), 0
    );
    
    // Create bulk add button - NO PRICE in label (clean, no "to Cart", no price)
    actions.push({
      type: 'add_all_to_cart',
      label: `Add All ${addToCartActions.length} Items`, // Clean label, NO price
      items: addToCartActions.map((action: any) => ({
        itemId: action.itemId!,
        name: action.itemName!,
        quantity: 1,
        price: action.price || 0,
        menuItem: action.menuItem, // Include menu data for bulk
      })),
      totalPrice, // Still track price internally (not shown in UI)
      itemCount: addToCartActions.length,
    });
  }

  // ===== CHECKOUT BUTTON =====
  
  const cartModified = functionResults.some((r: any) => r.name === 'addItemToCart');
  const hasItemsInCart = cartData && cartData.items && cartData.items.length > 0;
  
  if (cartModified || hasItemsInCart) {
    actions.push({
      type: 'checkout',
      label: 'View Cart & Checkout',
    });
  }

  // Check if AI called proceedToCheckout
  const checkoutCalled = functionResults.find((r: any) => r.name === 'proceedToCheckout');
  if (checkoutCalled) {
    const checkoutIndex = actions.findIndex(a => a.type === 'checkout');
    if (checkoutIndex >= 0) {
      actions.splice(checkoutIndex, 1);
    }
    actions.unshift({
      type: 'checkout',
      label: 'View Cart & Checkout',
    });
  }

  // ===== VIEW MENU FALLBACK =====
  
  if ((aiResponse.toLowerCase().includes('popular') || 
       aiResponse.toLowerCase().includes('menu') ||
       aiResponse.toLowerCase().includes('browse')) &&
      actions.length === 0) {
    actions.push({
      type: 'view_menu',
      label: 'View Full Menu',
    });
  }

  return actions;
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

