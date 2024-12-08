console.log("taskpane.js script loaded");

document.addEventListener("DOMContentLoaded", (event) => {
  console.log("DOM fully loaded and parsed");
  document.getElementById("conciseButton").onclick = function () {
    console.log("Concise button clicked outside Outlook");
    alert("Concise Reply");
  };
  document.getElementById("standardButton").onclick = function () {
    console.log("Standard button clicked outside Outlook");
    alert("Standard Reply");
  };
  document.getElementById("detailedButton").onclick = function () {
    console.log("Detailed button clicked outside Outlook");
    alert("Detailed Reply");
  };
});

if (typeof Office !== "undefined") {
  Office.onReady((info) => {
    console.log("Office.onReady called");
    if (info.host === Office.HostType.Outlook) {
      console.log("Outlook host detected");

      document.getElementById("conciseButton").onclick = function () {
        handleReply("concise");
      };
      document.getElementById("standardButton").onclick = function () {
        handleReply("standard");
      };
      document.getElementById("detailedButton").onclick = function () {
        handleReply("detailed");
      };

      async function handleReply(replyType) {
        const item = Office.context.mailbox.item;

        // Récupérer tous les boutons
        const buttons = document.querySelectorAll(".action-button");

        // Désactiver les boutons (ajouter l'attribut disabled)
        buttons.forEach((btn) => {
          btn.setAttribute("disabled", "true"); // Désactive le bouton
          btn.classList.add("disabled"); // Ajoute la classe pour l'apparence
        });

        // Afficher le loader
        loader.classList.remove("hidden");

        item.body.getAsync("text", async function (result) {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            const originalMessage = result.value;
            console.log("Original message text: " + originalMessage);

            try {
              // Appeler l'API ChatGPT pour générer une réponse
              const reply = await callChatGPT(originalMessage, replyType);
              console.log(
                `${replyType.charAt(0).toUpperCase() + replyType.slice(1)} Reply:`,
                reply,
              );

              // Construire la réponse HTML
              const replyBody = `<div>${reply.answer}</div>`;

              // Afficher le formulaire de réponse avec la réponse générée
              item.displayReplyAllForm({
                htmlBody: replyBody,
              });
            } catch (error) {
              console.error("Error during reply generation:", error);
            } finally {
              // Réactiver les boutons et masquer le loader
              buttons.forEach((btn) => {
                btn.removeAttribute("disabled"); // Réactive le bouton
                btn.classList.remove("disabled"); // Supprime la classe pour l'apparence
              });
              loader.classList.add("hidden");
            }
          } else {
            console.error(
              "Failed to get the message body: " + result.error.message,
            );

            // Réactiver les boutons et masquer le loader même en cas d'erreur
            buttons.forEach((btn) => {
              btn.removeAttribute("disabled"); // Réactive le bouton
              btn.classList.remove("disabled"); // Supprime la classe pour l'apparence
            });
            loader.classList.add("hidden");
          }
        });
      }

      async function callChatGPT(message, replyType) {
        try {
          const response = await fetch(
            "http://localhost:5551/api/chat", 
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: message,
                replyType: replyType,
              }),
            },
          );

          if (response.ok) {
            const reply = await response.json(); // Parse JSON au lieu de texte brut
            return reply;
          } else {
            console.error("Failed to call backend API: " + response.statusText);
            return { answer: "Error generating reply." };
          }
        } catch (error) {
          console.error("Failed to call backend API: " + error);
          return { answer: "Error generating reply." };
        }
      }
    } else {
      console.log("Non-Outlook host detected");
    }
  });
} else {
  console.log("Office.js is not loaded or not in Outlook context");
}
