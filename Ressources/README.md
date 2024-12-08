# **RAG-OUTLOOK-APPLICATION (Express.js)**

An Outlook application that reads emails and writes responses based on retrieved context.

---

## **Known issues**

- Python 3.13 can create python dependencies conflict when using the code in the Indexer folder.

- Outlook selfsigned https certificate are not accepted by MacOS. You can still deploy the application or use another certificate

## **Requirements**

To run this application, ensure you have the following prerequisites installed and configured:

### 1. **Node.js & npm**

- Download and install Node.js (which includes npm) from the [official website](https://nodejs.org/en/download/package-manager).
- Verify installation:
  ```bash
  node -v
  npm -v
  ```

### 2. **MongoDB Atlas**

- Set up a MongoDB Atlas database with a collection to store vectorized documents. [Learn more here](https://www.mongodb.com/resources/products/fundamentals/embedded-mongodb).
- Each document should follow this structure:
  ```json
  {
    "content": "Main text content",
    "metadata": {
      "filename": "Filename of the document",
      "is_image": true, // Boolean indicating if it's an image description
      "image": "Base64 encoded image or null",
      "page_number": 1, // Integer indicating the page number
      "vector_embedding": [1536] // Array of 1536 floating-point numbers
    }
  }
  ```
- The Code used for creating the vectored database can be found in the `Indexer` folder

### 3. **Outlook Account**

- Ensure you have an active Outlook account to integrate and test the add-in functionality.

---

## **Installation**

### **1. Clone the Repository**

```bash
git clone <repository_url>
cd RAG-OUTLOOK-APPLICATION/Outlook-RAG-App
```

---

## **Configuration**

### **1. Environment Variables**

Configure environment variables by following the template in `.env.example`.
Create a `.env` file in both the **root** folder and the **backend** folder.

Example `.env` file:

```env
OPENAI_API_KEY="your_openai_api_key_here"
MONGODB_URL="your_mongodb_url_here"
DATABASE_NAME="your_database_name_here"
COLLECTION_NAME="your_collection_name_here"
```

### **2. MongoDB Access**

Ensure your machine's IP address is allowed by the MongoDB database:

1. Go to the **Security** section in MongoDB Atlas.
2. Navigate to **Network Access**.
3. Add your IP address.

### **3. Install Backend Dependencies**

Navigate to the `backend` folder and install the required dependencies:

```bash
cd backend
npm install
```

### **4. HTTPS Certificate for Local Development**

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

Copy and paste the certificate and key paths into the `webpack.config.js` file in the `app` folder:

```javascript
server: {
  type: "https",
  options: {
    key: fs.readFileSync("BASE_PATH/.office-addin-dev-certs/localhost.key"), // Change BASE_PATH to access the certificate
    cert: fs.readFileSync("BASE_PATH/.office-addin-dev-certs/localhost.crt"),
  }
}
```

---

### **5. Install Frontend Dependencies**

Navigate to the `app` folder and install the required dependencies:

```bash
cd app
npm install
```

---

## **Development Setup**

### **1. Start the Frontend**

In the `app` folder, start the application:

```bash
npm start
```

### **2. Start the Backend**

Navigate to the `backend` folder and start the server:

```bash
cd backend
node server.js
```

Expected output:

```
Server running on port 5551
Connected to MongoDB
```

---

## **Running the Application**

- **Backend**: Runs on port `5551`.
  - Change the port in the `server.js` file if needed.
- **Frontend**: Runs on port `3000`.
  - Change the port in the `webpack.config.js` file and `manifest.xml` if needed.

---

## **Installation Guide**

A step-by-step guide to install the app is provided in the `Resources` folder:

- **Video**: `Resources/Step-by-Step Guide to Install a Custom Add-In App.mp4`
- **PDF**: `Resources/How_To_Install_Outlook_Add-In_App.pdf`

---

## **Congratulations!**

Your app is now running locally:

- Backend: [http://localhost:5551](http://localhost:5551)
- Frontend: [http://localhost:3000](http://localhost:3000)
