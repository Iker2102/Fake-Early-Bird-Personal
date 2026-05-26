const whatsappStatusEl = document.getElementById("whatsapp-status");
const smtpStatusEl = document.getElementById("smtp-status");
const qrContainer = document.getElementById("qr-container");

const pendingMessagesEl = document.getElementById("pending-messages");
const sentMessagesEl = document.getElementById("sent-messages");

const scheduleForm = document.getElementById("schedule-form");
const formStatus = document.getElementById("form-status");
const refreshButton = document.getElementById("refresh-button");

function getStatusClass(status) {
    const classes = {
        scheduled: "badge-blue",
        sending: "badge-yellow",
        sent: "badge-purple",
        delivered: "badge-green",
        delivery_failed: "badge-red",
        failed: "badge-red",
        ready: "badge-green",
        authenticated: "badge-blue",
        qr: "badge-yellow",
        disconnected: "badge-red",
        error: "badge-red",
        initializing: "badge-yellow",
    };

    return classes[status] ?? "badge-gray";
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleString("es-ES");
}

function shorten(text, length = 80) {
    if (!text) {
        return "";
    }

    if (text.length <= length) {
        return text;
    }

    return `${text.slice(0, length)}...`;
}

async function loadWhatsAppStatus() {
    const response = await fetch("/api/whatsapp/status");
    const data = await response.json();

    whatsappStatusEl.textContent = data.status;
    whatsappStatusEl.className = `status-badge ${getStatusClass(data.status)}`;

    qrContainer.innerHTML = "";

    if (data.qr) {
        const image = document.createElement("img");
        image.src = data.qr;
        image.alt = "QR de WhatsApp";
        qrContainer.appendChild(image);
    }
}

async function loadMessages() {
    const response = await fetch("/api/messages");
    const messages = await response.json();

    const pendingMessages = messages.filter((message) =>
        ["scheduled", "sending"].includes(message.status)
    );

    const sentMessages = messages.filter((message) =>
        ["sent", "delivered", "delivery_failed", "failed"].includes(message.status)
    );

    renderPendingMessages(pendingMessages);
    renderSentMessages(sentMessages);
}

function renderPendingMessages(messages) {
    pendingMessagesEl.innerHTML = "";

    if (messages.length === 0) {
        pendingMessagesEl.innerHTML = `
            <tr>
                <td colspan="5" class="empty">No hay mensajes pendientes</td>
            </tr>
        `;
        return;
    }

    for (const message of messages) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${message.phone}</td>
            <td>${shorten(message.message)}</td>
            <td>${formatDate(message.scheduledAt)}</td>
            <td>
                <span class="status-badge ${getStatusClass(message.status)}">
                    ${message.status}
                </span>
            </td>
            <td>
                <button class="danger" data-id="${message.id}">
                    Eliminar
                </button>
            </td>
        `;

        row.querySelector("button").addEventListener("click", async () => {
            await deleteMessage(message.id);
        });

        pendingMessagesEl.appendChild(row);
    }
}

function renderSentMessages(messages) {
    sentMessagesEl.innerHTML = "";

    if (messages.length === 0) {
        sentMessagesEl.innerHTML = `
            <tr>
                <td colspan="6" class="empty">No hay historial de envíos</td>
            </tr>
        `;
        return;
    }

    for (const message of messages) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${message.phone}</td>
            <td>${shorten(message.message)}</td>
            <td>${formatDate(message.sentAt)}</td>
            <td>${formatDate(message.deliveredAt)}</td>
            <td>${message.ackLevel ?? "-"}</td>
            <td>
                <span class="status-badge ${getStatusClass(message.status)}">
                    ${message.status}
                </span>
            </td>
        `;

        sentMessagesEl.appendChild(row);
    }
}

async function deleteMessage(id) {
    await fetch(`/api/messages/${id}`, {
        method: "DELETE",
    });

    await refreshDashboard();
}

async function createScheduledMessage(event) {
    event.preventDefault();

    const phone = document.getElementById("phone").value;
    const message = document.getElementById("message").value;
    const scheduledAtInput = document.getElementById("scheduledAt").value;

    const scheduledAt = new Date(scheduledAtInput).toISOString();

    formStatus.textContent = "Programando mensaje...";

    try {
        const response = await fetch("/api/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                phone,
                message,
                scheduledAt,
            }),
        });

        if (!response.ok) {
            throw new Error("No se pudo programar el mensaje");
        }

        formStatus.textContent = "Mensaje programado correctamente";
        scheduleForm.reset();

        await refreshDashboard();
    } catch (error) {
        formStatus.textContent = "Error programando el mensaje";
        console.error(error);
    }
}

async function refreshDashboard() {
    await Promise.all([
        loadWhatsAppStatus(),
        loadMessages(),
        loadStats(),
    ]);
}

scheduleForm.addEventListener("submit", createScheduledMessage);
refreshButton.addEventListener("click", refreshDashboard);

refreshDashboard();

setInterval(refreshDashboard, 5000);



const sentTodayEl = document.getElementById("sent-today");
const deliveredTodayEl = document.getElementById("delivered-today");
const deliveryRateEl = document.getElementById("delivery-rate");
const emailsSentTodayEl = document.getElementById("emails-sent-today");

async function loadStats() {
    const response = await fetch("/api/stats");
    const stats = await response.json();

    sentTodayEl.textContent = stats.sentToday;
    deliveredTodayEl.textContent = stats.deliveredToday;
    deliveryRateEl.textContent = `${stats.deliveryRate}%`;
    emailsSentTodayEl.textContent = stats.emailsSentToday;
}


const liveLogsEl = document.getElementById("live-logs");

function connectLogStream() {
    const eventSource = new EventSource("/api/logs/stream");

    eventSource.onmessage = (event) => {
        const log = JSON.parse(event.data);

        const item = document.createElement("div");
        item.className = `log-item log-${log.level}`;
        item.textContent = `[${new Date(log.createdAt).toLocaleTimeString("es-ES")}] ${log.message}`;

        liveLogsEl.prepend(item);
    };

    eventSource.onerror = () => {
        console.warn("SSE desconectado, reintentando...");
    };
}

connectLogStream();