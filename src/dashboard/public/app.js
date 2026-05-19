const form = document.getElementById("send-form");
const statusText = document.getElementById("status");

const whatsappStatusText = document.getElementById("wa-status");
const qrImage = document.getElementById("qr");

/**
 * Consulta el estado actual de WhatsApp y muestra el QR si existe.
 */
async function loadWhatsAppStatus() {
    try {
        const response = await fetch("/api/whatsapp/status");
        const data = await response.json();

        whatsappStatusText.textContent = `Estado: ${data.status}`;

        if (data.qr) {
            qrImage.src = data.qr;
            qrImage.style.display = "block";
        } else {
            qrImage.removeAttribute("src");
            qrImage.style.display = "none";
        }
    } catch (error) {
        whatsappStatusText.textContent = "No se pudo obtener el estado de WhatsApp";
        qrImage.style.display = "none";
        console.error(error);
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const phone = document.getElementById("phone").value;
    const message = document.getElementById("message").value;

    statusText.textContent = "Enviando mensaje...";

    try {
        const response = await fetch("/api/messages/test-send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                phone,
                message,
            }),
        });

        if (!response.ok) {
            throw new Error("No se pudo enviar el mensaje");
        }

        statusText.textContent = "Mensaje enviado correctamente";
        form.reset();
    } catch (error) {
        statusText.textContent = "Error enviando el mensaje";
        console.error(error);
    }
});

loadWhatsAppStatus();
setInterval(loadWhatsAppStatus, 3000);