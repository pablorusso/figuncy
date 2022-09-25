import { chromium } from 'playwright'
import cron from 'node-cron'
import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import { Database } from './database'

function createBot(telegramToken: string, url: string, db: Database): Telegraf {
  if (!telegramToken || telegramToken === "") {
    throw new Error("Please provide a bot token via environment variables");
  }

  const bot = new Telegraf(telegramToken);

  const helpText = `*Comandos*
👉 /help: Este mensaje con instrucciones
👉 /check: Verifica si hay o no stock de figuritas
👉 /status: Estado de las notificaciones automáticas
👉 /start: Inicia las notificaciones automáticas
👉 /stop: Detiene las notificaciones automáticas`;


  bot.start(async (ctx) => {
    const chatId = ctx.message.chat.id;
    console.log(`start for ${chatId}`);
    db.saveChatId(chatId);

    ctx.replyWithMarkdown(`\¡\¡\¡*Bienvenido*\!\!\! Este bot te avisará cuando haya figuritas`);
    ctx.replyWithMarkdown(`Notificaciones automáticas: *activas*`)
    ctx.replyWithMarkdown(helpText);

    const hasStock = db.getStock();
    sendNotifications(bot, url, db, hasStock, chatId);
    const lastCheck = db.getLastStockCheck();
    ctx.replyWithMarkdown(`*Última Revisión*: ${lastCheck}`);
  });

  bot.command('help', async (ctx) => {
    const chatId = ctx.message.chat.id;
    console.log(`help for ${chatId}`);
    ctx.replyWithMarkdown(helpText);
  });
  bot.command('status', async (ctx) => {
    const chatId = ctx.message.chat.id;
    console.log(`status for ${chatId}`);
    const isActive = db.getChatIds().indexOf(chatId) >= 0
    isActive ?
      ctx.replyWithMarkdown(`Notificaciones automáticas: *activas*`) :
      ctx.replyWithMarkdown(`Notificaciones automáticas: *en pausa*`)
  });
  bot.command('stop', async (ctx) => {
    const chatId = ctx.message.chat.id;
    console.log(`quit for ${chatId}`);
    db.deleteChatId(chatId);
    ctx.replyWithMarkdown(`Notificaciones automáticas: *en pausa*`)
  });
  bot.command('check', async (ctx) => {
    const chatId = ctx.message.chat.id;
    console.log(`check for ${chatId}`);

    const hasStock = db.getStock();
    sendNotifications(bot, url, db, hasStock, chatId);
    const lastCheck = db.getLastStockCheck();
    ctx.replyWithMarkdown(`*Última Revisión*: ${lastCheck}`);
  });

  bot.launch();

  // Enable graceful stop
  process.once('SIGINT' , () => bot.stop('El bot se ha detenido!'));
  process.once('SIGTERM', () => bot.stop('El bot se ha detenido!'));

  return bot;
}

function sendNotifications(bot: Telegraf, url: string, db: Database, hasStock: boolean, chatId?: number) {
  console.log(`sendNotifications with stock ${hasStock}`);
  const escapedUrl = url
                      .replace(/\_/g, '\\_')
                      .replace(/\*/g, '\\*')
                      .replace(/\[/g, '\\[')
                      .replace(/\]/g, '\\]')
                      .replace(/\(/g, '\\(')
                      .replace(/\)/g, '\\)')
                      .replace(/\~/g, '\\~')
                      .replace(/\`/g, '\\`')
                      .replace(/\>/g, '\\>')
                      .replace(/\#/g, '\\#')
                      .replace(/\+/g, '\\+')
                      .replace(/\-/g, '\\-')
                      .replace(/\=/g, '\\=')
                      .replace(/\|/g, '\\|')
                      .replace(/\{/g, '\\{')
                      .replace(/\}/g, '\\}')
                      .replace(/\./g, '\\.')
                      .replace(/\!/g, '\\!');
  const message = hasStock ? `⚽️ 😁 *\¡\¡\¡HAY FIGURITAS\\!\\!* 😁 ⚽️ \n${escapedUrl}` : `*SIN STOCK*`;
  if (chatId) {
    bot.telegram.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' })
  } else {
    db.getChatIds().forEach(chatId => bot.telegram.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' }))
  }  
}

async function checkUrl(bot: Telegraf, url: string, interval: string, db: Database, browserExecPath?: string) {
  const options = browserExecPath ? { executablePath: browserExecPath } : {}
  const browser = await chromium.launch(options);
  cron.schedule(interval, async () => {
    console.log(`Running on: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Buenos_Aires' })} for url: ${url}`);

    const page = await browser.newPage();
    await page.goto(url);

    const content = await page.inputValue('#product_form input[type="submit"]');
    const hasStock = content !== 'Sin stock';
    const mustNotify = db.updateStock(hasStock);
    if (mustNotify) {
      sendNotifications(bot, url, db, hasStock);
    }
    await page.close();
  });
}

dotenv.config();

const telegramToken = process.env.TELEGRAM_TOKEN || "";
const interval = process.env.INTERVAL || "*/5 * * * *";
const url = "https://www.zonakids.com/productos/pack-x-25-sobres-de-figuritas-fifa-world-cup-qatar-2022/";
const baseDir = process.env.BASE_DIR || process.cwd();
const browserExecPath = process.env.BROWSER_EXEC_PATH;

const db  = new Database(baseDir);
const bot = createBot(telegramToken, url, db);
checkUrl(bot, url, interval, db, browserExecPath);

console.log(`Figuncy bot started!`);
