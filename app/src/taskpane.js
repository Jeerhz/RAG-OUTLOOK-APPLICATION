console.log("taskpane.js script loaded");

(function() {
  'use strict';

  // Global variables
  let g_item;

  // Office initialization
  Office.onReady((info) => {
    console.log("Office.onReady called with info:", info);
    if (info.host === Office.HostType.Outlook) {
      console.log("Outlook host detected");
      initializeOutlook();
    } else {
      console.log("Non-Outlook host detected");
      initializeNonOutlook();
    }
  }).catch(error => {
    console.error("Error in Office.onReady:", error);
    displayError("Failed to initialize Office.js. Please try reloading the add-in.");
  });

  function initializeOutlook() {
    g_item = Office.context.mailbox.item;
    attachEventListeners();
  }

  function initializeNonOutlook() {
    document.addEventListener("DOMContentLoaded", (event) => {
      console.log("DOM fully loaded and parsed");
      attachEventListeners();
    });
  }

  function attachEventListeners() {
    document.getElementById("conciseButton").addEventListener("click", () => handleReply("concise"));
    document.getElementById("standardButton").addEventListener("click", () => handleReply("standard"));
    document.getElementById("detailedButton").addEventListener("click", () => handleReply("detailed"));
  }

  async function handleReply(replyType) {
    try {
      showLoading(true);
      if (Office.context.host === Office.HostType.Outlook) {
        await handleOutlookReply(replyType);
      } else {
        handleNonOutlookReply(replyType);
      }
    } catch (error) {
      console.error(`Error handling ${replyType} reply:`, error);
      displayError(`Failed to generate ${replyType} reply. Please try again. \n Error: ${error}`);
    } finally {
      showLoading(false);
    }
  }

  async function handleOutlookReply(replyType) {
    try {
      const originalMessage = await getMessageBody();
      console.log("Original message text:", originalMessage);

      const response = await callChatGPT(originalMessage, replyType);
      console.log(`${capitalizeFirstLetter(replyType)} Reply:`, response);

      const replyBody = formatReplyBody(response, replyType);

      g_item.displayReplyAllForm({
        htmlBody: replyBody,
      });
    } catch (error) {
      throw new Error(`Outlook reply error: ${error.message}`);
    }
  }

  function handleNonOutlookReply(replyType) {
    console.log(`${capitalizeFirstLetter(replyType)} button clicked outside Outlook`);
    alert(`${capitalizeFirstLetter(replyType)} Reply`);
  }

  function getMessageBody() {
    return new Promise((resolve, reject) => {
      g_item.body.getAsync("text", function (result) {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          resolve(result.value);
        } else {
          reject(new Error("Failed to get the message body: " + result.error.message));
        }
      });
    });
  }

  async function callChatGPT(mail_content, replyType) {
    try {
      const response = await fetch("http://localhost:5551/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: mail_content,
          replyType: replyType,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to call backend API:", error);
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  function formatReplyBody(response, replyType) {
    const answer = response.answer || "No response generated.";
    const images = response.images || [];

    let htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #0078d4;">${capitalizeFirstLetter(replyType)} Reply</h2>
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

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function showLoading(isLoading) {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      loadingElement.style.display = isLoading ? "block" : "none";
    }
  }

  function displayError(message) {
    const errorElement = document.getElementById("error");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    }
    console.error(message);
  }

  // Additional initialization if needed
  Office.initialize = function (reason) {
    console.log("Office.initialize called with reason:", reason);
  };

})();