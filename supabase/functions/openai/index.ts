import OpenAI from "openai";
import type { ChatModel } from "openai/resources";

Deno.serve(async (req) => {
  const { query } = await req.json();

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const model = Deno.env.get("OPENAI_API_MODEL");

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const completion = await openai.chat.completions.create({
      messages: [{
        role: "system",
        content: "You are to act as my helpful assistant. \
          Help me resolve my queries, please.",
      }, {
        role: "user",
        content: query,
      }],
      model: model as ChatModel,
    });

    const reply = completion.choices[0].message.content;

    return new Response(reply, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
});
