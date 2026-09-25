"""Unit tests for WageGuard India RAG corpus chunking, retrieval, and grounded generation."""


from backend.app.rag.generate import (
    MANDATORY_DISCLAIMER_EN,
    MANDATORY_DISCLAIMER_HI,
    generate_grounded_answer,
)
from backend.app.rag.ingest import (
    DEFAULT_CORPUS_DIR,
    chunk_document_by_section,
    parse_frontmatter,
)
from backend.app.rag.retrieve import retrieve_chunks


def test_parse_frontmatter():
    sample = """---
state: "Delhi"
act_name: "Minimum Wages Act, 1948 - Delhi State Schedule"
valid_as_of_date: "2024-04-01"
---
# Main Header
Body text here.
"""
    fm, body = parse_frontmatter(sample)
    assert fm["state"] == "Delhi"
    assert fm["act_name"] == "Minimum Wages Act, 1948 - Delhi State Schedule"
    assert fm["valid_as_of_date"] == "2024-04-01"
    assert "# Main Header" in body


def test_chunk_document_by_section():
    act_file = DEFAULT_CORPUS_DIR / "central_acts" / "payment_of_wages_act_1936.md"
    assert act_file.exists(), f"Corpus file not found: {act_file}"

    chunks = chunk_document_by_section(act_file)
    assert len(chunks) >= 8, f"Expected at least 8 sections, got {len(chunks)}"

    # Check that Section 5 is properly chunked with exact metadata
    sec5_chunks = [c for c in chunks if "Section 5" in c["metadata"]["section_or_clause"]]
    assert len(sec5_chunks) >= 1
    sec5 = sec5_chunks[0]

    assert sec5["metadata"]["act_name"] == "Payment of Wages Act, 1936"
    assert "payment_of_wages_act_1936.md" in sec5["metadata"]["source_file"]
    assert "second working day" in sec5["text"].lower()
    assert sec5["metadata"]["valid_as_of_date"] is not None


def test_state_minimum_wages_chunking():
    delhi_file = DEFAULT_CORPUS_DIR / "state_minimum_wages" / "delhi.md"
    assert delhi_file.exists(), f"Corpus file not found: {delhi_file}"

    chunks = chunk_document_by_section(delhi_file)
    assert len(chunks) >= 2
    for c in chunks:
        assert c["metadata"]["state"] == "Delhi"
        assert c["metadata"]["valid_as_of_date"] == "2024-04-01"


def test_retrieval_payment_of_wages_resignation_deadline():
    """Verify test query from definition of done returns Payment of Wages Act / Section 5."""
    query = "can my employer delay my final salary after I resign?"
    chunks = retrieve_chunks(query, top_k=4)

    assert len(chunks) > 0, "Retrieval returned no chunks"

    # Must contain Payment of Wages Act or FAQ citing Section 5(2)
    sources = [c["metadata"]["source_file"] for c in chunks]
    acts = [c["metadata"]["act_name"] for c in chunks]
    combined_texts = " ".join([c["text"] for c in chunks]).lower()

    assert any(
        "payment_of_wages" in s or "common_labour_rights_faq" in s for s in sources
    ), f"Expected Payment of Wages Act in sources, got: {sources}"
    assert any("Payment of Wages Act" in a or "Labour Rights FAQs" in a for a in acts)
    assert "second working day" in combined_texts or "2nd working day" in combined_texts


def test_retrieval_state_boosting():
    """Verify state parameter correctly prioritizes state-notified rate chunks."""
    query = "what is the minimum wage for construction workers?"
    chunks = retrieve_chunks(query, state="Delhi", top_k=3)

    assert len(chunks) > 0
    # Top chunk should be Delhi minimum wages schedule
    delhi_matches = [c for c in chunks if c["metadata"]["state"] == "Delhi"]
    assert len(delhi_matches) >= 1
    assert "18,066" in delhi_matches[0]["text"] or "695" in delhi_matches[0]["text"]


def test_generate_grounded_answer_success():
    """Assert grounded answer includes citations, disclaimer, and non-accusatory language."""
    query = "can my employer delay my final salary after I resign?"
    result = generate_grounded_answer(query=query, language="en")

    assert result.grounded is True
    assert len(result.citations) > 0
    assert result.disclaimer == MANDATORY_DISCLAIMER_EN

    # Check non-accusatory safety framing
    assert "guilty" not in result.answer.lower()
    assert "indicates" in result.answer or "based on" in result.answer.lower()
    assert result.next_steps is not None
    assert "15100" in result.next_steps or "shramsuvidha" in result.next_steps


def test_generate_grounded_answer_unrelated_query_fallback():
    """Assert out-of-scope query yields explicit grounded=False fallback and no empty/fake citations."""
    query = "how do I bake a chocolate cake at 350 degrees?"
    result = generate_grounded_answer(query=query, language="en")

    assert result.grounded is False
    assert len(result.citations) == 0
    assert "I don't have a grounded answer for this" in result.answer
    assert "15100" in result.answer or "shramsuvidha" in result.answer
    assert result.disclaimer == MANDATORY_DISCLAIMER_EN


def test_generate_grounded_answer_hindi():
    """Assert bilingual support for Hindi queries and Hindi disclaimers."""
    query = "क्या नियोक्ता इस्तीफा देने के बाद मेरा वेतन रोक सकता है?"
    result = generate_grounded_answer(query=query, language="hi")

    assert result.grounded is True
    assert len(result.citations) > 0
    assert result.disclaimer == MANDATORY_DISCLAIMER_HI
    assert result.language == "hi"
