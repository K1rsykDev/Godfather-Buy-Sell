// Конфігурація Webhook. Можна передати через window.WEBHOOK_URL або параметр ?webhook=...
const RAW_WEBHOOK_URL =
  (typeof window !== "undefined" && window.WEBHOOK_URL) ||
  new URLSearchParams(window.location.search).get("webhook") ||
  "https://discord.com/api/webhooks/1440084903151534094/oGwEERmrJyr9zGZimB79ePKx9Ztfg5KsEjWkOVrKTCxJVAP8pKQBBZxKAU8iErX6Oxfj";
const WEBHOOK_URL = RAW_WEBHOOK_URL.trim();

const form = document.getElementById("adForm");
const toggleButtons = document.querySelectorAll(".toggle-btn");
const statusEl = document.querySelector(".status");
const adTypeLabel = document.getElementById("adTypeLabel");
const webhookHint = document.getElementById("webhookHint");
const body = document.body;

let currentType = "sell"; // sell | buy

const submitButton = form.querySelector("button[type='submit']");

// Перевірка вебхука з підказкою для користувача
const webhookLooksInvalid = (url) => {
  if (!url) return true;
  return /your[-_]?webhook|example|<webhook>/i.test(url);
};

const showWebhookStatus = () => {
  if (!webhookHint) return;

  const source =
    (typeof window !== "undefined" && window.WEBHOOK_URL && "window.WEBHOOK_URL") ||
    (new URLSearchParams(window.location.search).get("webhook") && "?webhook параметр") ||
    "RAW_WEBHOOK_URL";

  if (webhookLooksInvalid(WEBHOOK_URL)) {
    webhookHint.textContent =
      "Налаштуй Discord Webhook у RAW_WEBHOOK_URL або додай ?webhook=... у адресу сторінки";
    webhookHint.classList.add("error");
    submitButton.disabled = true;
  } else {
    webhookHint.textContent = `Webhook активний (джерело: ${source})`;
    webhookHint.classList.remove("error");
  }
};

// Динамічна зміна теми та бейджа
const updateMode = (type) => {
  currentType = type;
  toggleButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === type);
  });
  body.classList.toggle("sell-mode", type === "sell");
  body.classList.toggle("buy-mode", type === "buy");
  adTypeLabel.textContent = type === "sell" ? "Продам" : "Куплю";
};

toggleButtons.forEach((btn) => {
  btn.addEventListener("click", () => updateMode(btn.dataset.type));
});

// Показати помилку біля конкретного поля
const setFieldError = (field, message = "") => {
  const errorElement = document.querySelector(`[data-error-for="${field.name}"]`);
  if (errorElement) {
    errorElement.textContent = message;
  }
  field.classList.toggle("error-state", Boolean(message));
};

// Базова валідація
const validateForm = () => {
  let isValid = true;
  const requiredFields = ["nickname", "phone", "staticId", "discord", "category", "title"];

  requiredFields.forEach((name) => {
    const field = form.elements[name];
    const value = field.value.trim();
    if (!value) {
      setFieldError(field, "Обов'язкове поле");
      isValid = false;
    } else {
      setFieldError(field, "");
    }
  });

  return isValid;
};

// Збір даних для Discord Embed
const buildEmbedPayload = async (formData) => {
  const adId = `AD-${Date.now()}`;
  const titleType = currentType === "sell" ? "Продам" : "Куплю";
  const color = currentType === "sell" ? 0xf59e0b : 0x22c55e;
  const nickname = formData.get("nickname").trim();
  const phone = formData.get("phone").trim();
  const staticId = formData.get("staticId").trim();
  const discord = formData.get("discord").trim();
  const category = formData.get("category");
  const title = formData.get("title").trim();
  const price = formData.get("price").trim();
  const description = formData.get("description").trim();
  const photoUrl = formData.get("photoUrl").trim();
  const file = form.elements.photoUpload.files[0];

  const embed = {
    title: `${titleType}: ${title}`,
    color,
    description: description || "Без опису",
    fields: [
      { name: "Тип", value: titleType, inline: true },
      { name: "NickName", value: nickname, inline: true },
      { name: "Телефон", value: phone, inline: true },
      { name: "Static ID", value: staticId, inline: true },
      { name: "Discord", value: discord, inline: true },
      { name: "Категорія", value: category, inline: true },
    ],
    footer: { text: `ID заявки: ${adId}` },
    timestamp: new Date().toISOString(),
  };

  if (price) {
    embed.fields.push({ name: "Ціна / Бюджет", value: price, inline: true });
  }

  if (file) {
    embed.image = { url: `attachment://${file.name}` };
  } else if (photoUrl) {
    embed.image = { url: photoUrl };
  }

  return { embed, adId, file };
};

// Відправка в Discord
const sendToDiscord = async (payload) => {
  if (webhookLooksInvalid(WEBHOOK_URL)) {
    throw new Error(
      "Додай робочий Discord Webhook у RAW_WEBHOOK_URL або через ?webhook=..."
    );
  }

  // Якщо є файл, збираємо FormData з вкладенням
  if (payload.file) {
    const formData = new FormData();
    formData.append("payload_json", JSON.stringify({ embeds: [payload.embed] }));
    formData.append("file", payload.file, payload.file.name);

    return fetch(WEBHOOK_URL, {
      method: "POST",
      body: formData,
    });
  }

  // Без файлу — звичайний JSON
  return fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [payload.embed] }),
  });
};

// Відображення статусу
const setStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#ef4444" : "var(--accent)";
};

const clearForm = () => {
  form.reset();
  form.querySelectorAll(".error-state").forEach((el) => el.classList.remove("error-state"));
  form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
  updateMode(currentType);
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");

  if (!validateForm()) {
    setStatus("Заповніть обов'язкові поля", true);
    return;
  }

  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Відправка...";

  try {
    const formData = new FormData(form);
    const { embed, adId } = await buildEmbedPayload(formData);
    await sendToDiscord({ embed, file: form.elements.photoUpload.files[0] });
    setStatus("Оголошення надіслано ✅");
    clearForm();
    console.info(`Заявка ${adId} успішно відправлена`);
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Не вдалося надіслати оголошення", true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Надіслати оголошення";
  }
});

// Ініціалізація
updateMode(currentType);
showWebhookStatus();
