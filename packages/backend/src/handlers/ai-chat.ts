import OpenAI from 'openai';
import type { CrumbChatRequest, CrumbChatResponse } from '@proofed/shared';
import { getOpenAIApiKey } from '../lib/secrets';

export async function getCrumbChat(
  userId: string,
  attemptId: string,
  request: CrumbChatRequest
): Promise<CrumbChatResponse> {
  const { message, chatHistory, context } = request;

  console.log('Crumb Chat Request:', JSON.stringify(request, null, 2));

  const apiKey = await getOpenAIApiKey();
  const openai = new OpenAI({ apiKey });

  try {
    // Build context description for the focused item
    const { focusedItem, otherItems, attemptName } = context;

    const ingredientList = focusedItem.ingredients
      .map((ing) => `${ing.quantity} ${ing.unit} ${ing.name}`)
      .join(', ');

    let focusedDescription = `${focusedItem.itemName} using ${focusedItem.recipeName}`;
    if (focusedItem.variantName) {
      focusedDescription += ` (variant: ${focusedItem.variantName})`;
    }
    if (focusedItem.scaleFactor && focusedItem.scaleFactor !== 1) {
      focusedDescription += ` scaled to ${focusedItem.scaleFactor}x`;
    }
    if (ingredientList) {
      focusedDescription += `\nIngredients: ${ingredientList}`;
    }
    if (focusedItem.bakeTime || focusedItem.bakeTemp) {
      const bakeInfo = [];
      if (focusedItem.bakeTime) bakeInfo.push(`${focusedItem.bakeTime} minutes`);
      if (focusedItem.bakeTemp) bakeInfo.push(`${focusedItem.bakeTemp}°${focusedItem.bakeTempUnit || 'F'}`);
      focusedDescription += `\nBaking: ${bakeInfo.join(' at ')}`;
    }

    const otherItemsDescription = otherItems.length > 0
      ? `\nOther items in this bake: ${otherItems.join(', ')}`
      : '';

    const systemPrompt = `You are "Crumb", a warm and encouraging baking assistant with the personality of Mary Berry. You have that lovely, slightly posh British warmth combined with decades of baking wisdom. You're supportive but honest, using phrases like "scrummy," "lovely," "delightful," and "rather good." You have a gentle, grandmotherly charm and genuinely want to help bakers improve.

The baker is working on a bake called "${attemptName}" and is asking about a specific item:

FOCUSED ITEM:
${focusedDescription}
${otherItemsDescription}

Guidelines for your responses:
- Channel Mary Berry's warmth: supportive, encouraging, but honest when needed
- Use British English spellings (colour, favourite, flavour, marvellous)
- Use phrases like "scrummy," "lovely," "delightful," "rather good," "well done"
- Keep responses conversational and warm, like a gentle mentor
- Answer questions specifically about the focused item and its ingredients
- If asked about other items in the bake, acknowledge them but keep focus on the item they're asking about
- Be helpful with substitutions, techniques, troubleshooting, and baking tips
- NEVER use dashes or hyphens in your response. Write in natural flowing sentences instead
- Keep responses concise but helpful (2-4 sentences for simple questions, more for complex ones)`;

    // Build messages array with chat history
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add chat history
    for (const historyMessage of chatHistory) {
      messages.push({
        role: historyMessage.role,
        content: historyMessage.content,
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    console.log('Calling OpenAI API for Crumb Chat...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages,
      max_completion_tokens: 2000,
    });

    console.log('OpenAI response received:', JSON.stringify(completion, null, 2));

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      console.error('Empty response content. Choices:', JSON.stringify(completion.choices, null, 2));
      throw new Error('No response from AI');
    }

    return {
      reply: responseContent,
    };
  } catch (error: any) {
    console.error('OpenAI API Error:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      error: error.error,
      stack: error.stack,
    });
    throw error;
  }
}
