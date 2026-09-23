// ================== CONFIG ==================
const CHANNEL_USERNAME = "@ZhostTech";
const CHANNEL_LINK = "https://t.me/ZhostTech";
const DEVELOPER_LINK = "https://t.me/ZawMyoNaing_Official";
const SUPPORT_LINK = "https://t.me/ZawMyoNaing_Official";
// ============================================

const API = "https://api.telegram.org/bot";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/webhook" && request.method === "POST") {
      try {
        const update = await request.json();
        await processUpdate(update, env);
      } catch (e) {
        console.error("Webhook error:", e.message);
      }
      return new Response("OK");
    }

    if (url.pathname === "/set-webhook") {
      const r = await tg(env, "setWebhook", { url: `${url.origin}/webhook` });
      return new Response(JSON.stringify(r), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("🤖 Bot is running!");
  },
};

async function processUpdate(update, env) {
  const msg = update.message;
  const cb = update.callback_query;
  if (msg) return handleMessage(msg, env);
  if (cb) return handleCallback(cb, env);
}

async function tg(env, method, body) {
  const r = await fetch(`${API}${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function tgDoc(env, chatId, filename, content, caption) {
  const fd = new FormData();
  fd.append("chat_id", String(chatId));
  fd.append(
    "document",
    new Blob([content], { type: "text/plain;charset=utf-8" }),
    filename
  );
  fd.append("caption", caption);
  fd.append("parse_mode", "HTML");
  await fetch(`${API}${env.BOT_TOKEN}/sendDocument`, {
    method: "POST",
    body: fd,
  });
}

async function joined(env, uid) {
  try {
    const r = await tg(env, "getChatMember", {
      chat_id: CHANNEL_USERNAME,
      user_id: uid,
    });
    if (!r.ok) return false;
    const s = r.result.status;
    return s === "member" || s === "administrator" || s === "creator";
  } catch {
    return false;
  }
}

const joinKb = () => ({
  inline_keyboard: [
    [{ text: "📢 Channel Join", url: CHANNEL_LINK }],
    [{ text: "✅ Join ပြီးပါပြီ", callback_data: "check_join" }],
  ],
});

const mainKb = () => ({
  inline_keyboard: [
    [
      { text: "📢 Channel", url: CHANNEL_LINK },
      { text: "👨‍💻 Developer", url: DEVELOPER_LINK },
    ],
    [
      { text: "💬 Support", url: SUPPORT_LINK },
      { text: "ℹ️ Help", callback_data: "help" },
    ],
  ],
});

async function askJoin(chatId, env, msgId) {
  const text =
    "🔒 <b>Channel Join လိုအပ်ပါသည်</b>\n\n" +
    "🤖 ဒီ Bot ကို အသုံးပြုဖို့အတွက်\n" +
    "ကျွန်တော်တို့ရဲ့ Official Channel ကို\n" +
    "<b>အရင်ဆုံး Join</b> ပေးပါ။\n\n" +
    "👇 Join ပြီးပါက ✅ ခလုတ်ကို နှိပ်ပါ။";

  const p = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: joinKb(),
    disable_web_page_preview: true,
  };

  if (msgId) {
    await tg(env, "editMessageText", { ...p, message_id: msgId });
  } else {
    await tg(env, "sendMessage", p);
  }
}

async function handleMessage(msg, env) {
  const u = msg.from;
  const chatId = msg.chat.id;
  const text = msg.text || "";

  if (!(await joined(env, u.id))) {
    if (text.startsWith("/start") || text.startsWith("/help") || !text.startsWith("/")) {
      return askJoin(chatId, env);
    }
  }

  if (text === "/start") {
    const name = esc(u.first_name || "there");
    const t =
      "🌟 <b>PREMIUM SOURCE</b> 🌟\n\n" +
      `👋 မင်္ဂလာပါ <b>${name}</b> ရေ!\n\n` +
      "🚀 <b>Website Source Code Downloader</b> မှ\n" +
      "ကြိုဆိုပါတယ်။\n\n" +
      "💎 <b>ဘယ်လိုအသုံးပြုမလဲ?</b>\n" +
      "① Website link ကို copy ကူးပါ\n" +
      "② ဒီ chat ထဲ paste ပြီး ပို့ပါ\n" +
      "③ Source code ဖိုင် ပြန်ရပါမယ် ✅\n\n" +
      "💡 <i>ဥပမာ - https://www.google.com</i>\n\n" +
      "⚡ Fast • 🎯 Accurate • 🛡 Safe";

    return tg(env, "sendMessage", {
      chat_id: chatId,
      text: t,
      parse_mode: "HTML",
      reply_markup: mainKb(),
      disable_web_page_preview: true,
    });
  }

  if (text === "/help") {
    return tg(env, "sendMessage", {
      chat_id: chatId,
      text:
        "📖 <b>Help & Guide</b>\n\n" +
        "🔹 <b>Commands:</b>\n" +
        "  • /start — Bot ပြန်စတင်ရန်\n" +
        "  • /help — အကူအညီ\n" +
        "  • /id — သင့် ID ကြည့်ရန်\n\n" +
        "🔹 <b>အသုံးပြုပုံ:</b>\n" +
        "  Website link ပို့လိုက်ရုံပါ။\n\n" +
        "⚠️ Login လိုအပ်တဲ့ site များ အလုပ်မလုပ်ပါ။",
      parse_mode: "HTML",
    });
  }

  if (text === "/id") {
    return tg(env, "sendMessage", {
      chat_id: chatId,
      text: `🆔 <b>Your ID:</b> <code>${u.id}</code>\n💬 <b>Chat:</b> <code>${chatId}</code>`,
      parse_mode: "HTML",
    });
  }

  if (text && !text.startsWith("/")) {
    return handleLink(chatId, text, env);
  }
}

async function handleCallback(q, env) {
  const u = q.from;
  const chatId = q.message.chat.id;
  const msgId = q.message.message_id;

  if (q.data === "check_join") {
    if (await joined(env, u.id)) {
      await tg(env, "answerCallbackQuery", {
        callback_query_id: q.id,
        text: "✅ Join ဖြစ်ပါပြီ။",
        show_alert: true,
      });
      const name = esc(u.first_name || "there");
      await tg(env, "editMessageText", {
        chat_id: chatId,
        message_id: msgId,
        text:
          "✅ <b>Verified!</b>\n\n" +
          `👋 မင်္ဂလာပါ <b>${name}</b>!\n` +
          "Bot ကို အသုံးပြုနိုင်ပါပြီ။\n\n" +
          "🔗 Website link ကို ပို့ပေးပါ။",
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "📢 Channel", url: CHANNEL_LINK }]],
        },
        disable_web_page_preview: true,
      });
    } else {
      await tg(env, "answerCallbackQuery", {
        callback_query_id: q.id,
        text: "❌ Channel Join မထားပါ။",
        show_alert: true,
      });
    }
    return;
  }

  if (q.data === "help") {
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id });
    await tg(env, "editMessageText", {
      chat_id: chatId,
      message_id: msgId,
      text:
        "📖 <b>အသုံးပြုပုံ</b>\n\n" +
        "1️⃣ Website ဖွင့်ပါ\n" +
        "2️⃣ Link copy ကူးပါ\n" +
        "3️⃣ Chat ထဲ paste ပြီး ပို့ပါ\n" +
        "4️⃣ Source file ပြန်ရပါမယ် ✅",
      parse_mode: "HTML",
    });
  }
}

async function handleLink(chatId, raw, env) {
  const url = raw.trim();

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return tg(env, "sendMessage", {
      chat_id: chatId,
      text: "❌ <code>http://</code> သို့မဟုတ် <code>https://</code> ဖြင့်စပါ။",
      parse_mode: "HTML",
    });
  }

  const t0 = Date.now();
  let domain = "website";
  try {
    domain = new URL(url).hostname || "website";
  } catch {}

  const sres = await tg(env, "sendMessage", {
    chat_id: chatId,
    text:
      "⏳ <b>PROCESSING...</b>\n\n" +
      "🌐 <i>ချိတ်ဆက်နေပါသည်...</i>",
    parse_mode: "HTML",
  });
  const sid = sres.result && sres.result.message_id;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
    });

    if (!res.ok) {
      if (sid) {
        await tg(env, "editMessageText", {
          chat_id: chatId,
          message_id: sid,
          text: `❌ <b>Website Error</b>\nStatus: <code>${res.status}</code>`,
          parse_mode: "HTML",
        });
      }
      return;
    }

    let html = await res.text();
    const MAX = 500000;
    let truncated = false;
    if (html.length > MAX) {
      html = html.slice(0, MAX);
      truncated = true;
    }

    if (sid) {
      await tg(env, "editMessageText", {
        chat_id: chatId,
        message_id: sid,
        text: "⚙️ <b>FORMATTING...</b>",
        parse_mode: "HTML",
      });
    }

    const pretty = prettify(html);
    const secs = ((Date.now() - t0) / 1000).toFixed(2);
    const kb = (new TextEncoder().encode(pretty).length / 1024).toFixed(2);

    const cap =
      "✅ <b>SUCCESS</b>\n\n" +
      `🌐 <b>Domain:</b> <code>${esc(domain)}</code>\n` +
      `⏱ <b>Time:</b> <code>${secs}s</code>\n` +
      `📦 <b>Size:</b> <code>${kb} KB</code>\n` +
      (truncated ? "✂️ <i>(ဖိုင် ကြီးလို့ ဖြတ်ထားသည်)</i>\n" : "") +
      "\n💎 <b>Premium Source Downloader</b>";

    await tgDoc(env, chatId, `${domain}_source.txt`, pretty, cap);

    if (sid) {
      await tg(env, "deleteMessage", { chat_id: chatId, message_id: sid });
    }
  } catch (e) {
    const m = esc(String(e.message || e).slice(0, 150));
    if (sid) {
      await tg(env, "editMessageText", {
        chat_id: chatId,
        message_id: sid,
        text: `❌ <b>Error</b>\n\n<code>${m}</code>`,
        parse_mode: "HTML",
      });
    }
  }
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function prettify(html) {
  const lines = html.replace(/>\s*</g, ">\n<").split("\n");
  const out = [];
  const IND = "  ";
  const VOID = /^<(br|hr|img|input|meta|link|area|base|col|embed|source|track|wbr|!doctype|\?)/i;
  let lvl = 0;

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (!ln) continue;

    if (ln.charCodeAt(0) === 60) {
      if (ln.charCodeAt(1) === 47) {
        lvl = lvl > 0 ? lvl - 1 : 0;
        out.push(IND.repeat(lvl) + ln);
      } else {
        out.push(IND.repeat(lvl) + ln);
        if (!VOID.test(ln) && ln.charCodeAt(ln.length - 2) !== 47) {
          lvl++;
        }
      }
    } else {
      const t = ln.trim();
      if (t) out.push(IND.repeat(lvl) + t);
    }
  }
  return out.join("\n");
}