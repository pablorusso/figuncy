import { chromium } from 'playwright'
import cron from 'node-cron'
import { Telegraf } from "telegraf";
import * as dotenv from "dotenv";

async function checkUrl(url: string, telegramToken: string, chatId: number) {
  if (!telegramToken || telegramToken === "") {
    throw new Error("Please provide a token via environment variables");
  }

  const bot = new Telegraf(telegramToken);

  bot.start((ctx) => {
    console.log(`Cliente: ${ctx.chat.id}`);
    ctx.reply(`Cliente: ${ctx.chat.id} -- Este bot te avisa si hay figuritas con un mensaje en telegram.`);
  });

  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });

  cron.schedule("*/5 * * * *", async () => {
    console.log(`Running on: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Buenos_Aires' })}`);
    if (chatId === 0) {
      console.log('Unknown chat id!');
      return;
    }

    const page = await browser.newPage();
    await page.goto(url);

    const content = await page.inputValue('#product_form input[type="submit"]');

    if (content === 'Sin stock') {
      console.log('SIN STOCK');
    } else {
      console.log('HAY FIGURITAS!!');
      bot.telegram.sendMessage(chatId, `*HAY FIGURITAS!!* Andá a ${url}`);
    }

    await page.close();
  });

  bot.launch();
  console.log(`Figuncy bot started! Using ChatID: ${chatId}`);
}

dotenv.config();

const url = "https://www.zonakids.com/productos/pack-x-25-sobres-de-figuritas-fifa-world-cup-qatar-2022/";
const telegramToken = process.env.TELEGRAM_TOKEN || "";
let chatId = !!process.env.CHAT_ID ? Number.parseInt(process.env.CHAT_ID) : 0;

checkUrl(url, telegramToken, chatId);
