import { Bot, webhookCallback } from "grammy";
import {
  createClient,
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "supabase";

const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? "",
);

bot.command("start", async (ctx) => {
  const { error: createChatError } = await supabaseClient
    .from("chats")
    .upsert(ctx.chat);

  if (createChatError) throw createChatError;

  if (!ctx.message || !ctx.message.from) {
    throw new Error("No user found in message");
  }

  const user = ctx.message
    ?.from;

  const { error: createUserError } = await supabaseClient
    .from("users")
    .upsert(user);

  if (createUserError) throw createUserError;

  await ctx.reply(
    `Welcome to the chat, ${user.first_name}! What would you like to discuss today?`,
    {
      entities: ctx.message?.entities,
    },
  );
});

bot.on("message", async (ctx) => {
  try {
    if (ctx.message.text) {
      const { data: chatgptResponse, error: functionError } =
        await supabaseClient.functions.invoke("openai", {
          body: { query: ctx.message.text },
        });

      if (functionError instanceof FunctionsHttpError) {
        const errorMessage = await functionError.context.json();
        console.log("Function returned an error", errorMessage);
        throw new Error(`Function returned an error: ${errorMessage.message}`);
      } else if (functionError instanceof FunctionsRelayError) {
        console.log("Relay error:", functionError.message);
        throw new Error(`Relay error: ${functionError.message}`);
      } else if (functionError instanceof FunctionsFetchError) {
        console.log("Fetch error:", functionError.message);
        throw new Error(`Fetch error: ${functionError.message}`);
      }

      await ctx.reply(chatgptResponse);
    } else {
      await ctx.reply("I couldn't understand that");
    }
  } catch (err) {
    console.log(err);
  }
});

const handleUpdate = webhookCallback(bot, "std/http");

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);

    if (url.searchParams.get("secret") !== Deno.env.get("FUNCTION_SECRET")) {
      return new Response("NOT ALLOWED", { status: 405 });
    }

    return await handleUpdate(req);
  } catch (err) {
    console.error(err);
  }
});
