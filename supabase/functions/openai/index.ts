import OpenAI from "openai";
import type {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
  ChatModel,
} from "openai/resources";

Deno.serve(async (req) => {
  const { query } = await req.json();

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const model = Deno.env.get("OPENAI_API_MODEL");

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const initialSystemMessage: ChatCompletionSystemMessageParam = {
      role: "system",
      content: "You are to act as my helpful assistant. \
        Help me resolve my queries, please.",
    };

    const userMessage: ChatCompletionUserMessageParam = {
      role: "user",
      content: query,
    };

    const completion = await openai.chat.completions.create({
      messages: [initialSystemMessage, userMessage],
      model: model as ChatModel,
    });

    const { content } = completion.choices[0].message;

    return new Response(content, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
});
