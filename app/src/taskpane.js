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
  item.body.getAsync("text", async function (result) {
    if (result.status === Office.AsyncResultStatus.Succeeded) {
      const originalMessage = result.value;
      console.log("Original message text: " + originalMessage);

      // Call the ChatGPT API to generate a response
      const response = await callChatGPT(originalMessage, replyType);
      console.log(`${replyType.charAt(0).toUpperCase() + replyType.slice(1)} Reply:`, response);

      // Build the reply body
      const replyBody = formatReplyBody(response, replyType);

      // Display the reply form with the generated response
      item.displayReplyAllForm({
        htmlBody: replyBody,
      });
    } else {
      console.error("Failed to get the message body: " + result.error.message);
    }
  });
}

function formatReplyBody(response, replyType) {
  const answer = response.answer || "No response generated.";
  const images = response.images || [];

  let htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #0078d4;">${replyType.charAt(0).toUpperCase() + replyType.slice(1)} Reply</h2>
      <div style="border-left: 4px solid #0078d4; padding-left: 15px;">
        ${answer.replace(/\n/g, '<br>')}
      </div>
  `;

  if (images.length > 0) {
    htmlBody += `
      <h3 style="color: #0078d4; margin-top: 20px;">Attached Images:</h3>
      <div style="display: flex; flex-wrap: wrap;">
    `;
    images.forEach((img, index) => {
      htmlBody += `
        <div style="margin: 10px; text-align: center;">
          <img src="data:image/jpeg;base64,${img.base64}" alt="Image ${index + 1}" style="max-width: 200px; max-height: 200px; border: 1px solid #ddd; border-radius: 4px; padding: 5px;">
          <p style="margin-top: 5px; font-size: 12px;">Source: ${img.source} (Page ${img.page_number})</p>
        </div>
      `;
    });
    htmlBody += `</div>`;
  }

  htmlBody += `</div>`;
  return htmlBody;
}

async function callChatGPT(mail_content, replyType) {
  try {
    const response = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: mail_content,
        replyType: replyType,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error("Failed to call backend API: " + response.statusText);
      return { answer: "Error generating reply.", images: [] };
    }
  } catch (error) {
    console.error("Failed to call backend API: " + error);
    return { answer: "Error generating reply.", images: [] };
  }
}

    } else {
      console.log("Non-Outlook host detected");
    }
  });
} else {
  console.log("Office.js is not loaded or not in Outlook context");
}