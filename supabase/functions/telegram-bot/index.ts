import { Bot, webhookCallback } from "grammy";

const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");

bot.command("start", async (ctx) => {
  await ctx.reply(
    "Welcome to the chat! What would you like to discuss today?",
    {
      entities: ctx.message?.entities,
    },
  );
});

bot.on("message", async (ctx) => {
  try {
    if (ctx.message.text) {
      await ctx.reply(
        "This is the test response, which means I'm still working on this. Gimme a sec!",
        {
          entities: ctx.message.entities,
        },
      );
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
