const contactsTable = document.getElementById("contacts-table");
const contactForm = document.getElementById("contact-form");
const searchInput = document.getElementById("contact-search");

const showAllButton = document.getElementById("show-all-contacts");
const showFavoriteButton = document.getElementById("show-favorite-contacts");

const exportCsvButton = document.getElementById("export-csv-button");
const exportJsonButton = document.getElementById("export-json-button");

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
                <button class="secondary favorite-button">
                    ${contact.priority === "favorite" ? "Quitar" : "Favorito"}
                </button>

                <button class="danger delete-button">
                    Eliminar
                </button>
            </td>
        `;

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