import { Telegraf, Markup } from "telegraf"
import "dotenv/config.js"

const bot = new Telegraf(process.env.BOT_TOKEN)
const adminId = process.env.ADMIN_ID
// const channelId = process.env.CHANNEL_ID

const userStates = new Map();

const categories = [
  "Sherik kerak",
  "Ish joyi kerak",
  "Hodim kerak",
  "Ustoz kerak",
  "Shogird kerak"
]

const introMessages = {
  "Sherik kerak": "Sherik topish uchun ariza berish\n\nHar bir savolga javob bering.",
  "Ish joyi kerak": "Ish topish uchun ariza berish\n\nHar bir savolga javob bering.",
  "Hodim kerak": "Xodim topish uchun ariza berish\n\nHar bir savolga javob bering.",
  "Ustoz kerak": "Ustoz topish uchun ariza berish\n\nHar bir savolga javob bering.",
  "Shogird kerak": "Shogird topish uchun ariza berish\n\nHar bir savolga javob bering.",
}

const steps = [
  { key: "name", question: "Ism familiyangizni kiriting:" },
  { key: "technology", question: "Texnologiya:\nTexnologiyalarni vergul bilan kiriting. Masalan: Java, Python, C++" },
  { 
    key: "contact", 
    question: "Telefon raqamingizni kiriting. Masalan: +998 90 123 45 67",
    validate: (text) => /^\+998 \d{2} \d{3} \d{2} \d{2}$/.test(text)
  },
  { key: "region", question: "Hudud:\nQaysi hududdansiz?" },
  { key: "price", question: "Narxi:\nTo'lov qilasizmi yoki tekinmi? Kerak bo'lsa summani yozing." },
  { key: "profession", question: "Kasbi:\nIshlaysizmi yoki o'qiysizmi?" },
  { key: "time", question: "Murojaat vaqti:\nQaysi vaqtda murojaat mumkin?" },
  { key: "goal", question: "Maqsad:\nMaqsadingizni yozing." },
]

bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username ? `@${ctx.from.username}` : ""
  const firstName = ctx.from.first_name || ""
  const lastName = ctx.from.last_name || ""
  const sender = [username, firstName, lastName].filter(Boolean).join(" ")

  startSelection(ctx)

  const adminMessage = `Botga yangi foydalanuvchi kirdi:\n👤 Foydalanuvchi: ${sender}\nID: ${userId}`;
  await bot.telegram.sendMessage(adminId, adminMessage)
})

function startSelection(ctx) {
  userStates.set(ctx.from.id, { stepIndex: null, data: {} })
  ctx.reply(
    "Quyidagi bo'limlardan birini tanlang:",
    Markup.keyboard([
      ["Sherik kerak", "Ish joyi kerak"],
      ["Hodim kerak", "Ustoz kerak", "Shogird kerak"]
    ]).resize()
  )
}

function ask(ctx, userId) {
  const state = userStates.get(userId)
  if (state.stepIndex === null) state.stepIndex = 0
  const step = steps[state.stepIndex]
  if (!step) return submit(ctx, userId)

  ctx.reply(step.question)
}
async function submit(ctx, userId) {
  const state = userStates.get(userId)
  const data = state.data
  const sender = ctx.from.username ? `@${ctx.from.username}` : `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`;
  const out = `
${data.category}:
👤 Foydalanuvchi: ${sender}
👨‍💼 Ism: ${data.name}
📚 Texnologiya: ${data.technology}
📞 Aloqa: ${data.contact}
🌐 Hudud: ${data.region}
💰 Narxi: ${data.price}
👨🏻‍💻 Kasbi: ${data.profession}
🕰 Murojaat vaqti: ${data.time}
🔎 Maqsad: ${data.goal}

#${data.category.replace(/ /g, "_").toLowerCase()}
`
  await ctx.reply("Ma'lumotlaringiz saqlandi ✅")
  await ctx.reply(out)

  await bot.telegram.sendMessage(adminId, out)
  // await bot.telegram.sendMessage(channelId, out);

  startSelection(ctx)
}

bot.on("text", async (ctx) => {
  const text = ctx.message.text
  const userId = ctx.from.id

  let state = userStates.get(userId)
  if (!state) return startSelection(ctx)

  if (categories.includes(text)) {
    state.data.category = text
    state.stepIndex = 0
    userStates.set(userId, state)
    await ctx.reply(introMessages[text])
    return ask(ctx, userId)
  }

  if (!state.data.category) return ctx.reply("Iltimos, bo'lim tanlang. /start tugmasini bosing.")
  const step = steps[state.stepIndex]
  if (step.validate && !step.validate(text)) {
    return ctx.reply("Noto'g'ri format, qaytadan kiriting:")
  }

  state.data[step.key] = text
  state.stepIndex++
  userStates.set(userId, state)
  ask(ctx, userId)
})


bot.launch().then(() => console.log("Bot ishga tushdi..."))

