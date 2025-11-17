const webhookUrl = "https://discord.com/api/webhooks/your-webhook-url"; // Заміни на свій Webhook

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
    description: form.description.value.trim(),
    photo: form.photo.files[0],
  };

  if (!validateFields(values)) {
    formMessage.textContent = "Будь ласка, заповніть усі обов'язкові поля.";
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
      { name: "Опис", value: values.description, inline: false },
    ],
  };

  const formData = new FormData();
  if (values.photo) {
    embed.image = { url: `attachment://${values.photo.name}` };
    formData.append("files[0]", values.photo);
  }

  formData.append("payload_json", JSON.stringify({ embeds: [embed] }));

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    formMessage.textContent = "Ваше оголошення успішно відправлено в Discord.";
    formMessage.classList.add("form__message--success");
    form.reset();
    state.type = null;
    badge.textContent = "—";
    formTitle.textContent = "Заповніть форму";
  } catch (error) {
    console.error(error);
    formMessage.textContent = "Сталася помилка під час відправки. Спробуйте ще раз.";
    formMessage.classList.add("form__message--error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Надіслати";
  }
});
