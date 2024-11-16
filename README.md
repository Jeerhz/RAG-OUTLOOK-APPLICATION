# **RAG-OUTLOOK-APPLICATION (Express.js)**

An Outlook application that reads emails and writes responses based on retrieved context.

---

## **Requirements**

- **Python**: Version `3.12.6` is recommended.
  - Known Issue: Python `3.13.0` causes dependency errors on MacOS.
- **Node.js & npm**: [Download and install Node.js and npm](https://nodejs.org/en/download/package-manager).
- The Outlook Desktop Application

---

## **Installation**

### **1. Clone the Repository**

```bash
git clone <repository_url>
cd rag-outlook-application
```

### **2. Install Dependencies**

#### **Backend**

Navigate to the `backend` folder and install the required dependencies:

```bash
cd backend
npm install express --save
```

#### **Frontend**

Navigate to the `app` folder and install the required dependencies:

```bash
cd ../app
npm install
```

---

## **Configuration**

### **1. Environment Variables**

Configure environment variables by following the template in `.env.example`.  
Create a `.env` file in both the **root** folder and the **backend** folder.

Example `.env` file:

```env
# Azure OpenAI Model Configurations
AZURE_OPENAI_MODEL_GPT="GPT-4o"
AZURE_OPENAI_API_KEY_GPT="your_api_key_here"
AZURE_OPENAI_URI_GPT="https://your_openai_uri_here"  # Endpoint URI for GPT Model
AZURE_OPENAI_BASE_URL="https://your_base_url_here"
AZURE_OPENAI_DEPLOYMENT_NAME="your_deployment_name_here"
API_VERSION_GPT="your_api_version_here"

AZURE_OPENAI_MODEL_EMBEDDING="Text-Embedding-ADA-002"
AZURE_OPENAI_API_KEY_EMBEDDING="your_api_key_here"
AZURE_OPENAI_URI_EMBEDDING="https://your_openai_uri_here"  # Endpoint URI for Text Embedding Model

OPENAI_API_KEY="your_openai_api_key_here"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"

MONGODB_URL="your_mongodb_url_here"
DATABASE_NAME="your_database_name_here"
COLLECTION_NAME="your_collection_name_here"
```

### **2. MongoDB Access**

Ensure your machine's IP address is allowed by the MongoDB database.  
To configure:

1. Go to the **Security** section in MongoDB Atlas.
2. Navigate to **Network Access**.
3. Add your IP address.

---

## **Development Setup**

### **1. Backend**

Navigate to the `backend` folder and start the server:

```bash
cd backend
node server.js
```

Expected output:

```
Server running on port 12121
Connected to MongoDB
```

### **2. HTTPS Certificate for Local Development**

Install developer certificates for HTTPS requests:

```bash
npx office-addin-dev-certs install
```

Expected output:

```
The developer certificates have been generated in /Users/your_username/.office-addin-dev-certs
Installing CA certificate "Developer CA for Microsoft Office Add-ins"...
You now have trusted access to https://localhost.
Certificate: BASE_URL/.office-addin-dev-certs/localhost.crt
Key: BASE_URL/.office-addin-dev-certs/localhost.key
```

Copy and paste the certificate and key paths into the `webpack.config.js` file in the `app` folder.

### **3. Frontend**

Navigate to the `app` folder and start the application:

```bash
cd ../app
npm start
```

---

## **Running the Application**

- **Backend**: Runs on port `12121` (default).
  - Change the port in the `server.js` file if needed.
- **Frontend**: Runs on port `3000` (default).
  - Change the port in the `webpack.config.js` file if needed.

---

## **Congratulations!**

Your app is now running locally:

- Backend: [http://localhost:12121](http://localhost:12121)
- Frontend: [http://localhost:3000](http://localhost:3000)

---

## **Install the application**

A step-by-step guide to install the app is provided to you in the Ressources folder.

- Video: Ressources/Step-by-Step guide to install a custom Add-In App.mp4
- PDF: Ressources/How_To_Install_Outlook_Add_In_App.pdf
