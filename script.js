const webhookUrl = "https://discord.com/api/webhooks/1440084903151534094/oGwEERmrJyr9zGZimB79ePKx9Ztfg5KsEjWkOVrKTCxJVAP8pKQBBZxKAU8iErX6Oxfj"; // Заміни на свій Webhook

const state = {
  type: null,
};

const formSection = document.getElementById("formSection");
const formTitle = document.getElementById("formTitle");
const badge = document.getElementById("badge");
const form = document.getElementById("adForm");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");

const sellBtn = document.getElementById("sellBtn");
const buyBtn = document.getElementById("buyBtn");

sellBtn.addEventListener("click", () => setType("sell"));
buyBtn.addEventListener("click", () => setType("buy"));

function setType(type) {
  state.type = type;
  formSection.classList.remove("card--hidden");
  const label = type === "sell" ? "Продам" : "Куплю";
  formTitle.textContent = `Оголошення: ${label}`;
  badge.textContent = label;
  badge.style.background = type === "sell" ? "rgba(249, 115, 22, 0.16)" : "rgba(34, 197, 94, 0.16)";
  badge.style.color = "#fff";
  badge.style.borderColor = type === "sell" ? "rgba(249, 115, 22, 0.5)" : "rgba(34, 197, 94, 0.5)";
  formMessage.textContent = "";
  formMessage.className = "form__message";
}

function validateFields(values) {
  const requiredFields = [
    "nickname",
    "phone",
    "static",
    "discord",
    "category",
    "itemName",
    "description",
  ];

  for (const field of requiredFields) {
    if (!values[field] || !values[field].trim()) {
      return false;
    }
  }
  return Boolean(state.type);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "";
  formMessage.className = "form__message";

  const values = {
    nickname: form.nickname.value.trim(),
    phone: form.phone.value.trim(),
    static: form.static.value.trim(),
    discord: form.discord.value.trim(),
    category: form.category.value,
    itemName: form.itemName.value.trim(),
    price: form.price.value.trim(),
    description: form.description.value.trim(),
    photo: form.photo.files[0],
  };

  if (!validateFields(values)) {
    formMessage.textContent = "Будь ласка, заповніть усі обов'язкові поля.";
    formMessage.classList.add("form__message--error");
    return;
  }

  if (!webhookUrl || webhookUrl.includes("your-webhook-url")) {
    formMessage.textContent = "Спершу замініть webhookUrl у script.js на свій Discord Webhook.";
    formMessage.classList.add("form__message--error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Надсилання...";

  const titlePrefix = state.type === "sell" ? "ПРОДАМ" : "КУПЛЮ";
const color = state.type === "sell" ? 0xf97316 : 0x22c55e;

const embed = {
  title: `Оголошення: ${titlePrefix} – ${values.itemName}`,
  color,
  fields: [
    { name: "Нік у грі", value: values.nickname, inline: true },
    { name: "Телефон", value: values.phone, inline: true },
    { name: "Static", value: values.static, inline: true },
    { name: "Discord", value: values.discord, inline: true },
    { name: "Категорія", value: values.category, inline: true },
    { name: "Тип оголошення", value: state.type === "sell" ? "Продам" : "Куплю", inline: true },
    ...(values.price
      ? [{ name: "Ціна/Бюджет", value: values.price, inline: true }]
      : []),
    { name: "Опис", value: values.description, inline: false },
  ],
};

const formData = new FormData();

// 🔥 ТУТ ДОДАНО ЗВИЧАЙНИЙ ТЕКСТ ДЛЯ MENTION
// Наприклад: "<@&1234567890>" або "@everyone"
const payload = {
  content: values.mention || "<@&1387276480903647273>", // ⬅️ Сюди ти передаєш mention ролі
  embeds: [embed],
};

  if (values.photo) {
    const attachmentName = `photo-${Date.now()}-${values.photo.name}`;
    embed.image = { url: `attachment://${attachmentName}` };
    payload.attachments = [
      {
        id: 0,
        description: "Фото оголошення",
        filename: attachmentName,
      },
    ];
    formData.append("files[0]", values.photo, attachmentName);
  }

  formData.append("payload_json", JSON.stringify(payload));

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status} – ${errorText}`);
    }

    formMessage.textContent = "Ваше оголошення успішно відправлено в Discord.";
    formMessage.classList.add("form__message--success");
    form.reset();
    state.type = null;
    badge.textContent = "—";
    formTitle.textContent = "Заповніть форму";
  } catch (error) {
    console.error(error);
    const helpText =
      error instanceof TypeError
        ? "Перевірте підключення або CORS (запускайте зі статичного сервера, а не напряму з файлу)."
        : "Сталася помилка під час відправки. Спробуйте ще раз.";
    formMessage.textContent = helpText;
    formMessage.classList.add("form__message--error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Надіслати";
  }
});
