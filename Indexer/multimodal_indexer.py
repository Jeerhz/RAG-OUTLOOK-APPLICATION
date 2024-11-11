import os
import base64
import fitz  # PyMuPDF
from langchain_core.documents import Document
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai.embeddings import OpenAIEmbeddings
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from mongo import insert_documents_to_mongodb
from pydantic import SecretStr
import logging
from typing import List
from functools import lru_cache

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Constants
BASE_PATH = "C:\\Users\\adles\\OneDrive\\Bureau\\RAG-OUTLOOK-APPLICATION\\Documents\\IR"

# Environment variables
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
OPENAI_EMBEDDING_MODEL = os.environ["OPENAI_EMBEDDING_MODEL"]

# Initialize OpenAI client
image_describer = ChatOpenAI(model="gpt-4o-mini", api_key=SecretStr(OPENAI_API_KEY))
text_embedder = OpenAIEmbeddings(
    model=OPENAI_EMBEDDING_MODEL, api_key=SecretStr(OPENAI_API_KEY)
)


@lru_cache(maxsize=1)
def get_system_message() -> SystemMessage:
    return SystemMessage(
        content="""You are an advanced AI assistant specialized in image analysis and description. Your task is to provide detailed, accurate, and objective descriptions of images presented to you. Please adhere to the following guidelines:

1. Provide a comprehensive and precise description of the image content.
2. If text is visible in the image, transcribe it verbatim.
3. For charts or graphs, analyze and explain their content, trends, and key data points.
4. Describe objects, settings, colors, and notable features in detail.
5. Avoid describing or identifying specific individuals in the images.
6. Do not describe any content that appears inappropriate or offensive.
7. If the image is unclear, corrupted, or cannot be analyzed, state this fact.
8. If there is nothing pertinent to say about the image, or if you cannot process it, respond with an empty string ('').

Your description should be thorough, organized, and easy to understand. Focus on factual observations rather than subjective interpretations."""
    )


def initialize_embedder_model() -> OpenAIEmbeddings:
    try:
        return OpenAIEmbeddings(
            model=OPENAI_EMBEDDING_MODEL,
            api_key=SecretStr(OPENAI_API_KEY),
        )
    except Exception as e:
        logger.error(f"Error initializing OpenAIEmbeddings: {e}")
        raise


def initialize_semantic_chunker() -> SemanticChunker:
    try:
        return SemanticChunker(
            OpenAIEmbeddings(
                model=OPENAI_EMBEDDING_MODEL,
                api_key=SecretStr(OPENAI_API_KEY),
            )
        )
    except Exception as e:
        logger.error(f"Error initializing SemanticChunker: {e}")
        raise


def process_image(image_bytes: bytes, page_num: int, filename: str) -> Document:
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    message = [
        get_system_message(),
        HumanMessage(
            content=[
                {
                    "type": "text",
                    "text": "Please provide a detailed description of the following image based on the guidelines provided. If you cannot describe the image or if there's nothing relevant to say, respond with an empty string ('').",
                },
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{image_base64}"},
                },
            ],
        ),
    ]

    description = image_describer.invoke(message).content
    if isinstance(description, list):
        description = "".join([str(item) for item in description])
    return Document(
        page_content=description,
        metadata={
            "is_image": True,
            "image": image_bytes,
            "page_number": page_num,
            "filename": filename,
            "vector_embedding": text_embedder.embed_query(description),
        },
    )


def index_text_and_images(pdf_path: str) -> List[Document]:
    text_splitter = initialize_semantic_chunker()

    try:
        with fitz.open(pdf_path) as pdf_doc:
            filename = os.path.basename(pdf_path)

            # Extract text
            text_docs = text_splitter.create_documents(
                [page.get_text() for page in pdf_doc],
                [
                    {
                        "filename": filename,
                        "is_image": False,
                        "image": None,
                        "page_number": i,
                        "vector_embedding": text_embedder.embed_query(
                            pdf_doc[i].get_text()
                        ),
                    }
                    for i in range(len(pdf_doc))
                ],
            )

            # Extract images
            image_docs = []
            for page_num, page in enumerate(pdf_doc):
                for img in page.get_images(full=True):
                    xref = img[0]
                    base_image = pdf_doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    image_docs.append(process_image(image_bytes, page_num, filename))

            return text_docs + image_docs

    except Exception as e:
        logger.error(f"Error processing PDF: {e}")
        raise


# Index all pdf files of 2024 directory:
for file in os.listdir(BASE_PATH):
    if file.endswith(".pdf"):
        PDF_PATH = os.path.join(BASE_PATH, file)
        print(f"Processing {PDF_PATH}")
        try:
            results = index_text_and_images(PDF_PATH)
            insert_documents_to_mongodb(
                results,
                url=os.environ["MONGODB_URL"],
            )

            logger.info(f"Embedded {len(results)} paragraphs")

        except Exception as e:
            logger.error(f"An error occurred: {e}")
