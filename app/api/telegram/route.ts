import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { sendTelegramMessage } from '@/lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Admin Telegram ID from ENV
const ADMIN_TELEGRAM_ID =
  process.env.ADMIN_TELEGRAM_ID ? BigInt(process.env.ADMIN_TELEGRAM_ID) : null;

// Bot token for direct API calls (copyMessage, answerCallbackQuery, sendMessage)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// --- Helpers ---

async function getOrCreateSettings() {
  const settings = await prisma.botSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {}
  });
  return settings;
}

async function createNewUser(telegramId: bigint, username: string | null) {
  try {
    return await prisma.user.create({
      data: {
        telegramId,
        username,
        name: '',
        phone: '',
        job: '',
        step: 'ASK_NAME'
      }
    });
  } catch (err: any) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return await prisma.user.findUnique({ where: { telegramId } });
    }
    throw err;
  }
}

// --- Main handler ---

export async function POST(req: NextRequest) {
  let update: any;

  try {
    update = await req.json().catch(() => null);
  } catch {
    update = null;
  }

  if (!update) {
    return NextResponse.json({ ok: true });
  }

  // --- 1) Handle callback queries (admin inline buttons) ---

  if (update.callback_query) {
    const cq = update.callback_query;
    const from = cq.from;
    const data = cq.data as string | undefined;
    const message = cq.message;

    const chatId =
      message?.chat?.id !== undefined ? BigInt(message.chat.id) : null;
    const fromId =
      from?.id !== undefined ? BigInt(from.id) : null;

    // Answer callback to stop "loading" on Telegram
    if (TELEGRAM_BOT_TOKEN && cq.id) {
      try {
        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: cq.id
            })
          }
        );
      } catch (e) {
        console.error('answerCallbackQuery error:', e);
      }
    }

    if (!data || !chatId || !fromId) {
      return NextResponse.json({ ok: true });
    }

    const isAdmin =
      ADMIN_TELEGRAM_ID !== null && fromId === ADMIN_TELEGRAM_ID;

    if (!isAdmin) {
      await sendTelegramMessage(
        chatId,
        'Bu tugma faqat admin uchun moʻljallangan.'
      );
      return NextResponse.json({ ok: true });
    }

    const settings = await getOrCreateSettings();

    if (data === 'broadcast_yes') {
      if (!settings.broadcastFromChatId || !settings.broadcastMessageId) {
        await sendTelegramMessage(
          chatId,
          'Saqlangan xabar topilmadi. Qaytadan yuborib ko‘ring.'
        );
        return NextResponse.json({ ok: true });
      }

      if (!TELEGRAM_BOT_TOKEN) {
        console.error('TELEGRAM_BOT_TOKEN missing, cannot broadcast');
        await sendTelegramMessage(
          chatId,
          'Server konfiguratsiyasida xatolik (bot token topilmadi).'
        );
        return NextResponse.json({ ok: true });
      }

      const users = await prisma.user.findMany();
      let sent = 0;

      for (const u of users) {
        try {
          await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/copyMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: String(u.telegramId),
                from_chat_id: String(settings.broadcastFromChatId),
                message_id: settings.broadcastMessageId
              })
            }
          );
          sent++;
        } catch (e) {
          console.error('copyMessage error for user', u.id, e);
        }
      }

      await prisma.botSettings.update({
        where: { id: settings.id },
        data: {
          broadcastFromChatId: null,
          broadcastMessageId: null
        }
      });

      await sendTelegramMessage(
        chatId,
        `Xabar ${sent} ta foydalanuvchiga yuborildi.`
      );
      return NextResponse.json({ ok: true });
    }

    if (data === 'broadcast_no') {
      await prisma.botSettings.update({
        where: { id: settings.id },
        data: {
          broadcastFromChatId: null,
          broadcastMessageId: null
        }
      });

      await sendTelegramMessage(chatId, 'Xabar yuborish bekor qilindi.');
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  }

  // --- 2) Handle normal messages ---

  try {
    const message = update.message ?? update.edited_message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const from = message.from;
    const chat = message.chat;

    if (!from || !chat) {
      return NextResponse.json({ ok: true });
    }

    const telegramId = BigInt(from.id);
    const chatId = BigInt(chat.id);
    const username: string | null = from.username ?? null;
    const textRaw: string | undefined = message.text;

    const settings = await getOrCreateSettings();
    const questionsEnabled =
      typeof settings.questionsEnabled === 'boolean'
        ? settings.questionsEnabled
        : true;

    // --- /start command for everyone ---
    if (textRaw === '/start') {
      if (!questionsEnabled) {
        // MODE: questions OFF – only collect telegramId + username
        await prisma.user.upsert({
          where: { telegramId },
          update: {
            username,
            step: 'DONE'
          },
          create: {
            telegramId,
            username,
            name: '',
            phone: '',
            job: '',
            step: 'DONE'
          }
        });

        const msg =
          settings.finalMessage ||
          "Rahmat! Siz ro'yxatga olindingiz. Yangiliklar bo'yicha shu bot orqali xabar beramiz.";
        await sendTelegramMessage(chatId, msg);
        return NextResponse.json({ ok: true });
      }

      // MODE: questions ON – reset funnel
      let existing = await prisma.user.findUnique({ where: { telegramId } });

      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            username,
            name: '',
            phone: '',
            job: '',
            step: 'ASK_NAME'
          }
        });
      } else {
        await prisma.user.create({
          data: {
            telegramId,
            username,
            name: '',
            phone: '',
            job: '',
            step: 'ASK_NAME'
          }
        });
      }

      await sendTelegramMessage(chatId, settings.greetingText);
      return NextResponse.json({ ok: true });
    }

    const isAdmin =
      ADMIN_TELEGRAM_ID !== null && telegramId === ADMIN_TELEGRAM_ID;

    // --- Admin: any non-/start message becomes "candidate broadcast message" ---
    if (isAdmin) {
      if (!TELEGRAM_BOT_TOKEN) {
        await sendTelegramMessage(
          chatId,
          'Bot token sozlanmagan. Admin broadcast ishlamaydi.'
        );
        return NextResponse.json({ ok: true });
      }

      await prisma.botSettings.update({
        where: { id: settings.id },
        data: {
          broadcastFromChatId: chatId,
          broadcastMessageId: message.message_id
        }
      });

      const keyboard = {
        inline_keyboard: [
          [
            { text: 'Ha, yubor', callback_data: 'broadcast_yes' },
            { text: 'Yo‘q, bekor qil', callback_data: 'broadcast_no' }
          ]
        ]
      };

      try {
        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: String(chatId),
              text: 'Bu xabarni barcha foydalanuvchilarga yuboraysizmi?',
              reply_markup: keyboard
            })
          }
        );
      } catch (e) {
        console.error('sendMessage for admin keyboard error:', e);
        await sendTelegramMessage(
          chatId,
          'Inline tugmalarni yuborishda xatolik yuz berdi.'
        );
      }

      return NextResponse.json({ ok: true });
    }

    // --- Normal user ---

    // If questions are disabled, just ensure user exists and do nothing.
    if (!questionsEnabled) {
      await prisma.user.upsert({
        where: { telegramId },
        update: {
          username,
          step: 'DONE'
        },
        create: {
          telegramId,
          username,
          name: '',
          phone: '',
          job: '',
          step: 'DONE'
        }
      });

      // No additional message here (so chat is not spammed).
      return NextResponse.json({ ok: true });
    }

    // Questions are enabled – registration funnel
    let user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      user = await createNewUser(telegramId, username);
    }

    // Keep username fresh
    if (user.username !== username) {
      try {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { username }
        });
      } catch (e) {
        console.warn('Could not update username:', e);
      }
    }

    if (!textRaw) {
      await sendTelegramMessage(
        chatId,
        'Iltimos, faqat matn yuboring. Boshlash uchun /start yuboring.'
      );
      return NextResponse.json({ ok: true });
    }

    const text = textRaw.trim();

    switch (user.step) {
      case 'ASK_NAME': {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: text,
            step: 'ASK_PHONE'
          }
        });

        await sendTelegramMessage(chatId, settings.askPhoneText);
        break;
      }

      case 'ASK_PHONE': {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            phone: text,
            step: 'ASK_JOB'
          }
        });

        await sendTelegramMessage(chatId, settings.askJobText);
        break;
      }

      case 'ASK_JOB': {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            job: text,
            step: 'DONE'
          }
        });

        await sendTelegramMessage(chatId, settings.finalMessage);
        break;
      }

      case 'DONE':
      default: {
        await sendTelegramMessage(
          chatId,
          "Siz allaqachon ro'yxatdan o'tgansiz. Ma'lumotlarni yangilash uchun /start yuborishingiz mumkin."
        );
        break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('ERROR in Telegram route:', err);

    try {
      if (TELEGRAM_BOT_TOKEN && update?.message?.chat?.id) {
        await sendTelegramMessage(
          BigInt(update.message.chat.id),
          'Serverda xatolik yuz berdi. Iltimos, keyinroq yana urinib ko‘ring.'
        );
      }
    } catch (e) {
      console.error('Failed to send error message to Telegram:', e);
    }

    return NextResponse.json({ ok: true });
  }
}
