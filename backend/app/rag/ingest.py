"""Ingest legal corpus markdown documents into ChromaDB vector store by logical section."""

import re
from pathlib import Path
from typing import Any

import chromadb
from chromadb.utils import embedding_functions

# Default root directories relative to repository root
DEFAULT_CORPUS_DIR = Path(__file__).resolve().parents[3] / "rag_store" / "corpus"
DEFAULT_INDEX_DIR = Path(__file__).resolve().parents[3] / "rag_store" / "index"
COLLECTION_NAME = "wageguard_legal_corpus"


def parse_frontmatter(content: str) -> tuple[dict[str, str], str]:
    """Extract YAML frontmatter key-value pairs and return (metadata, remaining_body)."""
    frontmatter: dict[str, str] = {}
    remaining_body = content

    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            fm_text = parts[1]
            remaining_body = parts[2].strip()
            for line in fm_text.strip().splitlines():
                if ":" in line:
                    key, val = line.split(":", 1)
                    clean_val = val.strip().strip('"').strip("'")
                    frontmatter[key.strip()] = clean_val

    return frontmatter, remaining_body


def chunk_document_by_section(
    filepath: Path,
    repo_root: Path | None = None,
) -> list[dict[str, Any]]:
    """Parse and chunk a markdown document by logical section header (## or ###).
    
    Never chops arbitrary token lengths mid-clause; preserves complete legal sections.
    """
    if repo_root is None:
        repo_root = Path(__file__).resolve().parents[3]

    raw_text = filepath.read_text(encoding="utf-8")
    fm, body = parse_frontmatter(raw_text)

    # Relative path from repo root
    try:
        source_rel = str(filepath.resolve().relative_to(repo_root.resolve())).replace("\\", "/")
    except ValueError:
        source_rel = str(filepath).replace("\\", "/")

    default_act_name = fm.get("act_name", filepath.stem.replace("_", " ").title())
    default_state = fm.get("state", "")
    valid_as_of = fm.get("valid_as_of_date", "2024-01-01")

    # Split body into sections by markdown heading (## or ###)
    # Using regex lookahead to keep headers with the content
    # Split body into sections by markdown heading (##)
    raw_blocks = [b.strip() for b in re.split(r"(?=(?:^|\n)##\s+)", body) if b.strip()]
    section_blocks: list[str] = []

    preamble = ""
    for block in raw_blocks:
        if not block.startswith("##"):
            # Preamble / document header before first ## section
            preamble = block + "\n\n"
        else:
            if preamble:
                section_blocks.append(preamble + block)
                preamble = ""
            else:
                section_blocks.append(block)

    if preamble and not section_blocks:
        section_blocks.append(preamble.strip())

    chunks: list[dict[str, Any]] = []
    file_stem = filepath.stem

    chunk_idx = 0
    for block in section_blocks:
        clean_block = block.strip()
        if not clean_block:
            continue

        # Extract heading if present
        header_match = re.search(r"^##\s+(.+)$", clean_block, re.MULTILINE)
        if header_match:
            heading = header_match.group(1).strip()
            section_title = heading
        else:
            h1_match = re.search(r"^#\s+(.+)$", clean_block, re.MULTILINE)
            section_title = h1_match.group(1).strip() if h1_match else "General Provisions"

        # Determine section or clause label
        section_clause = section_title
        sec_num_match = re.search(r"(Section\s+\d+[A-Za-z]?(?:\(\d+\))?|Rule\s+\d+|FAQ\s+\d+)", section_title, re.IGNORECASE)
        if sec_num_match:
            section_clause = sec_num_match.group(1).title()

        # Build metadata dictionary
        chunk_id = f"{file_stem}_{chunk_idx:03d}"
        metadata: dict[str, Any] = {
            "source_file": source_rel,
            "act_name": default_act_name,
            "section_or_clause": section_clause,
            "section_title": section_title,
            "state": default_state,
            "valid_as_of_date": valid_as_of,
            "chunk_id": chunk_id,
        }

        chunks.append({
            "id": chunk_id,
            "text": clean_block,
            "metadata": metadata,
        })
        chunk_idx += 1

    return chunks


MULTILINGUAL_MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
_embedding_fn_instance = None


def get_embedding_function() -> Any:
    """Return cached multilingual sentence-transformers embedding function for ChromaDB."""
    global _embedding_fn_instance
    if _embedding_fn_instance is None:
        try:
            _embedding_fn_instance = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name=MULTILINGUAL_MODEL_NAME,
                local_files_only=True,
            )
        except Exception:
            _embedding_fn_instance = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name=MULTILINGUAL_MODEL_NAME,
            )
    return _embedding_fn_instance


def ingest_corpus(
    corpus_dir: Path | None = None,
    index_dir: Path | None = None,
) -> int:
    """Read all markdown files in corpus_dir, chunk by logical section, and index into ChromaDB."""
    if corpus_dir is None:
        corpus_dir = DEFAULT_CORPUS_DIR
    if index_dir is None:
        index_dir = DEFAULT_INDEX_DIR

    repo_root = Path(__file__).resolve().parents[3]
    index_dir.mkdir(parents=True, exist_ok=True)

    client = chromadb.PersistentClient(path=str(index_dir))
    embedding_fn = get_embedding_function()

    try:
        client.delete_collection(name=COLLECTION_NAME)
    except (ValueError, KeyError, chromadb.errors.ChromaError) as err:
        import logging
        logging.getLogger(__name__).debug("Collection reset notice: %s", err)

    collection = client.create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_fn,
        metadata={"hnsw:space": "cosine"},
    )

    all_chunks: list[dict[str, Any]] = []
    md_files = sorted(corpus_dir.rglob("*.md"))

    for md_file in md_files:
        doc_chunks = chunk_document_by_section(md_file, repo_root=repo_root)
        all_chunks.extend(doc_chunks)

    if not all_chunks:
        return 0

    # Ingest in batches
    batch_size = 50
    for i in range(0, len(all_chunks), batch_size):
        batch = all_chunks[i : i + batch_size]
        ids = [c["id"] for c in batch]
        documents = [c["text"] for c in batch]
        metadatas = [c["metadata"] for c in batch]
        collection.add(ids=ids, documents=documents, metadatas=metadatas)

    return len(all_chunks)


if __name__ == "__main__":
    count = ingest_corpus()
    print(f"Successfully ingested {count} logical section chunks into ChromaDB at {DEFAULT_INDEX_DIR}")
