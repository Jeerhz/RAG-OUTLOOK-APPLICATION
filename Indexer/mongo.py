from typing import List
import os
from langchain_core.documents import Document
from pymongo import MongoClient
from pymongo.server_api import ServerApi


def insert_documents_to_mongodb(documents: List[Document], url: str) -> None:
    # Replace with your MongoDB Atlas connection string

    # Create a new client and connect to the server
    client: MongoClient = MongoClient(url, server_api=ServerApi("1"))

    try:
        # Send a ping to confirm a successful connection
        client.admin.command("ping")

        # Select the database and collection
        db = client[os.environ["DATABASE_NAME"]]
        collection = db[os.environ["COLLECTION_NAME"]]

        # Prepare documents for insertion
        docs_to_insert = []
        for doc in documents:
            mongo_doc = {"content": doc.page_content, "metadata": doc.metadata}
            docs_to_insert.append(mongo_doc)

        # Insert documents
        collection.insert_many(docs_to_insert)

    except Exception as e:
        print(e)
    finally:
        client.close()
