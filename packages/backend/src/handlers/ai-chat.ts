import OpenAI from 'openai';
import type { CrumbChatRequest, CrumbChatResponse } from '@proofed/shared';
import { getOpenAIApiKey } from '../lib/secrets';

export async function getCrumbChat(
  userId: string,
  attemptId: string,
  request: CrumbChatRequest
): Promise<CrumbChatResponse> {
  const { message, chatHistory, context } = request;

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
    if (focusedItem.prepNotes) {
      focusedDescription += `\nMethod/Instructions: ${focusedItem.prepNotes}`;
    }
    if (focusedItem.variantNotes) {
      focusedDescription += `\nVariant notes: ${focusedItem.variantNotes}`;
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

    const systemPrompt = `You are "Crumb", a baking assistant with Mary Berry's warm British style. Be genuinely helpful but BRIEF.

CRITICAL: Keep responses to 2-3 sentences maximum. Be direct and practical.

The baker is working on "${attemptName}":
${focusedDescription}
${otherItemsDescription}

Style notes:
- Use British spellings (colour, flavour)
- Natural phrases like "scrummy," "lovely," "rather good"
- Honest feedback, even if critical
- No dashes or hyphens
- Chat like equals over tea, never condescending`;

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages,
      max_completion_tokens: 300,
      temperature: 0.7,
    });

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
