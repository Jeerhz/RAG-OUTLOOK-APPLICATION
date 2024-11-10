require('dotenv').config(); // Load environment variables
console.log( "taskpane.js script loaded" );

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
        item.body.getAsync("text", async function (result) {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            const originalMessage = result.value;
            console.log("Original message text: " + originalMessage);

            // Appeler l'API ChatGPT pour générer une réponse
            const reply = await callChatGPT(originalMessage, replyType);
            console.log(
              `${replyType.charAt(0).toUpperCase() + replyType.slice(1)} Reply: ${reply}`,
            );

            // Construire la réponse
            const replyBody = `<p>${reply}</p>`;

            // Afficher le formulaire de réponse avec la réponse générée
            item.displayReplyAllForm({
              htmlBody: replyBody,
            });
          } else {
            console.error(
              "Failed to get the message body: " + result.error.message,
            );
          }
        });
      }

      async function callChatGPT(message, replyType) {
        const apiKey = process.env.OPENAI_API_KEY; // Remplacez par votre clé API OpenAI
        const apiUrl = "https://api.openai.com/v1/chat/completions";
        let prompt;

        switch (replyType) {
          case "concise":
            prompt = `Generate a concise reply to the following message:\n\n${message}`;
            break;
          case "standard":
            prompt = `Generate a standard reply to the following message:\n\n${message}`;
            break;
          case "detailed":
            prompt = `Generate a detailed reply to the following message:\n\n${message}`;
            break;
          default:
            prompt = message;
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 150,
            temperature: 0.5,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.choices[0].message.content.trim();
        } else {
          const errorData = await response.json();
          console.error(
            "Failed to call OpenAI API: " + response.statusText,
            errorData,
          );
          return "Error generating reply.";
        }
      }
    } else {
      console.log("Non-Outlook host detected");
    }
  });
} else {
  console.log("Office.js is not loaded or not in Outlook context");
}
