const contactsTable = document.getElementById("contacts-table");
const contactForm = document.getElementById("contact-form");
const searchInput = document.getElementById("contact-search");

const showAllButton = document.getElementById("show-all-contacts");
const showFavoriteButton = document.getElementById("show-favorite-contacts");

const exportCsvButton = document.getElementById("export-csv-button");
const exportJsonButton = document.getElementById("export-json-button");

const historyContactName = document.getElementById("history-contact-name");
const contactHistoryTable = document.getElementById("contact-history-table");

let onlyFavorites = false;

async function loadContacts(query = "") {
    const response = await fetch(
        `/api/contacts${query ? `?q=${encodeURIComponent(query)}` : ""}`
    );

    const contacts = await response.json();

    renderContacts(contacts);
}

function renderContacts(contacts) {
    contactsTable.innerHTML = "";

    if (onlyFavorites) {
        contacts = contacts.filter((contact) => contact.priority === "favorite");
    }

    if (contacts.length === 0) {
        contactsTable.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    No hay contactos
                </td>
            </tr>
        `;
        return;
    }

    contacts.sort((a, b) => {
        if (a.priority === "favorite" && b.priority !== "favorite") {
            return -1;
        }

        if (a.priority !== "favorite" && b.priority === "favorite") {
            return 1;
        }

        return a.name.localeCompare(b.name);
    });

    for (const contact of contacts) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${contact.name}</td>
            <td>${contact.phone}</td>
            <td>${formatTags(contact.tags)}</td>
            <td class="priority-cell">
                ${contact.priority === "favorite" ? "⭐" : "—"}
            </td>
            <td class="actions-cell">
                <button class="secondary history-button">
                    Historial
                </button>

                <button class="secondary favorite-button">
                    ${contact.priority === "favorite" ? "Quitar" : "Favorito"}
                </button>

                <button class="danger delete-button">
                    Eliminar
                </button>
            </td>
        `;

        row.querySelector(".history-button").addEventListener("click", async () => {
            await loadContactHistory(contact);
        });

        row.querySelector(".favorite-button").addEventListener("click", async () => {
            await updateContact(contact.id, {
                priority: contact.priority === "favorite" ? "normal" : "favorite",
            });

            await loadContacts(searchInput.value.trim());
        });

        row.querySelector(".delete-button").addEventListener("click", async () => {
            await deleteContact(contact.id);
        });

        contactsTable.appendChild(row);
    }
}

async function loadContactHistory(contact) {
    historyContactName.textContent = `Historial de ${contact.name} (${contact.phone})`;

    const response = await fetch(`/api/contacts/${contact.id}/messages`);
    const messages = await response.json();

    contactHistoryTable.innerHTML = "";

    if (messages.length === 0) {
        contactHistoryTable.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    Este contacto todavía no tiene mensajes.
                </td>
            </tr>
        `;
        return;
    }

    for (const message of messages) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${shorten(message.message)}</td>
            <td>${formatDate(message.scheduledAt)}</td>
            <td>${formatDate(message.sentAt)}</td>
            <td>
                <span class="status-badge ${getStatusClass(message.status)}">
                    ${message.status}
                </span>
            </td>
            <td>${message.ackLevel ?? "-"}</td>
        `;

        contactHistoryTable.appendChild(row);
    }
}

function setFilterMode(showFavorites) {
    onlyFavorites = showFavorites;

    showAllButton.classList.toggle("active", !onlyFavorites);
    showFavoriteButton.classList.toggle("active", onlyFavorites);

    loadContacts(searchInput.value.trim());
}

function buildExportUrl(format) {
    const params = new URLSearchParams();

    const query = searchInput.value.trim();

    if (query) {
        params.set("q", query);
    }

    if (onlyFavorites) {
        params.set("favorites", "true");
    }

    const queryString = params.toString();

    return `/api/contacts/export/${format}${queryString ? `?${queryString}` : ""}`;
}

function exportContacts(format) {
    window.location.href = buildExportUrl(format);
}

function formatTags(tags) {
    if (!tags) {
        return "-";
    }

    return tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => `<span class="tag-chip">${tag}</span>`)
        .join(" ");
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleString("es-ES");
}

function getStatusClass(status) {
    const classes = {
        scheduled: "badge-blue",
        sending: "badge-yellow",
        sent: "badge-purple",
        delivered: "badge-green",
        delivery_failed: "badge-red",
        failed: "badge-red",
    };

    return classes[status] ?? "badge-gray";
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

async function createContact(event) {
    event.preventDefault();

    const body = {
        name: document.getElementById("contact-name").value,
        phone: document.getElementById("contact-phone").value,
        tags: document.getElementById("contact-tags").value,
        priority: document.getElementById("contact-priority").value,
    };

    const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.json();

        alert(error.error ?? "No se pudo crear el contacto");

        return;
    }

    contactForm.reset();

    await loadContacts(searchInput.value.trim());
}

async function updateContact(id, body) {
    await fetch(`/api/contacts/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
}

async function deleteContact(id) {
    await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
    });

    await loadContacts(searchInput.value.trim());
}

contactForm.addEventListener("submit", createContact);

searchInput.addEventListener("input", () => {
    loadContacts(searchInput.value.trim());
});

searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        loadContacts(searchInput.value.trim());
    }
});

showAllButton.addEventListener("click", () => {
    setFilterMode(false);
});

showFavoriteButton.addEventListener("click", () => {
    setFilterMode(true);
});

exportCsvButton.addEventListener("click", () => {
    exportContacts("csv");
});

exportJsonButton.addEventListener("click", () => {
    exportContacts("json");
});

setFilterMode(false);