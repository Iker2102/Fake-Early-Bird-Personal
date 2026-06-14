const settingsForm = document.getElementById("settings-form");
const settingsStatus = document.getElementById("settings-status");

async function loadSettings() {
    const response = await fetch("/api/settings");
    const settings = await response.json();

    renderSettings(settings);
}

function renderSettings(settings) {
    settingsForm.innerHTML = "";

    for (const setting of settings) {
        const label = document.createElement("label");

        label.innerHTML = `
            ${setting.label}
            ${renderInput(setting)}
            ${
                setting.restartRequired
                    ? '<span class="muted">Requiere reiniciar</span>'
                    : ""
            }
        `;

        settingsForm.appendChild(label);
    }

    const button = document.createElement("button");
    button.type = "submit";
    button.textContent = "Guardar configuración";

    settingsForm.appendChild(button);
}

function renderInput(setting) {
    if (setting.type === "boolean") {
        return `
            <select name="${setting.key}">
                <option value="true" ${setting.value === "true" ? "selected" : ""}>
                    Activado
                </option>
                <option value="false" ${setting.value === "false" ? "selected" : ""}>
                    Desactivado
                </option>
            </select>
        `;
    }

    if (setting.type === "number") {
        return `
            <input
                name="${setting.key}"
                type="number"
                value="${setting.value}"
            />
        `;
    }

    return `
        <input
            name="${setting.key}"
            type="text"
            value="${setting.value}"
        />
    `;
}

async function saveSettings(event) {
    event.preventDefault();

    const formData = new FormData(settingsForm);
    const body = {};

    for (const [key, value] of formData.entries()) {
        body[key] = value;
    }

    settingsStatus.textContent = "Guardando configuración...";

    const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
        settingsStatus.textContent = result.error ?? "No se pudo guardar";
        return;
    }

    settingsStatus.textContent =
        "Configuración guardada. Reinicia la aplicación para aplicar los cambios.";
}

settingsForm.addEventListener("submit", saveSettings);

loadSettings();