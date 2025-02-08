import "jsr:@std/dotenv/load";
import {
  Bot,
  GrammyError,
  HttpError,
  Keyboard,
  InlineKeyboard,
  Context,
} from "https://deno.land/x/grammy@v1.34.1/mod.ts";
import {
  hydrate,
  HydrateFlavor,
} from "https://deno.land/x/grammy_hydrate@v1.4.1/mod.ts";

type MyContext = HydrateFlavor<Context>;

const bot = new Bot<MyContext>(Deno.env.get("BOT_TOKEN"));
bot.use(hydrate());

bot.api.setMyCommands([
  {
    command: "start",
    description: "Запуск бота",
  },
  {
    command: "get_id",
    description: "Получить ID",
  },
  {
    command: "share",
    description: "Поделиться чем-то",
  },
  {
    command: "menu",
    description: "Получить меню",
  },
]);

bot.command("start", async ctx => {
  await ctx.react("🤝");
  await ctx.reply("Hello, I'm bot");
});

bot.command("share", async ctx => {
  const sharekeyboard = new Keyboard()
    .requestLocation("Геолокация")
    .requestContact("Контакт")
    .requestPoll("Опрос")
    .resized()
    .placeholder("Укажи чем хочешь поделиться");
  await ctx.reply("Чем хочешь поделиться?", {
    reply_markup: sharekeyboard,
  });
});

const menuKeyboard = new InlineKeyboard()
  .text("Узнать статус заказа", "order_status")
  .row()
  .text("Обратиться в поддержку", "support");

const backKeyboard = new InlineKeyboard().text("<Назад в меню", "back");

bot.command("menu", async ctx => {
  await ctx.reply("Выберите пункт меню", {
    reply_markup: menuKeyboard,
  });
});

bot.callbackQuery("order_status", async ctx => {
  await ctx.callbackQuery.message?.editText("Статус заказа в пути", {
    reply_markup: backKeyboard,
  });
  await ctx.answerCallbackQuery();
});

bot.callbackQuery("support", async ctx => {
  await ctx.callbackQuery.message?.editText("Напишите ваш запрос", {
    reply_markup: backKeyboard,
  });
});

bot.callbackQuery("back", async ctx => {
  await ctx.callbackQuery.message?.editText("Выберите пункт меню", {
    reply_markup: menuKeyboard,
  });
});

bot.on(
  ":contact",
  async ctx =>
    await ctx.reply("Спасибо за контакт", {
      reply_markup: { remove_keyboard: true },
    })
);
bot.on(
  ":location",
  async ctx =>
    await ctx.reply("Спасибо за геолокацию", {
      reply_markup: { remove_keyboard: true },
    })
);

bot.command("get_id", async ctx => await ctx.reply(`Ваш ID: ${ctx.from?.id}`));

bot.catch(err => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

bot.start();
