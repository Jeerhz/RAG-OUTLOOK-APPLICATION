class Chunk:
    is_image: bool = False
    image: str = ""
    text: str
    page_number: int = 0
    filename: str


class ChunkedDoc:
    chunked_doc: list[Chunk]
    metadata: dict
    filename: str
