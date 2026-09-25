"""Grounded legal rights generation with traceable citations and safety disclaimers."""

import os
from typing import Any

from pydantic import BaseModel, Field

from backend.app.rag.retrieve import retrieve_chunks

MANDATORY_DISCLAIMER_EN = "This is educational information, not legal advice."
MANDATORY_DISCLAIMER_HI = "यह केवल शैक्षणिक जानकारी है, कानूनी सलाह नहीं है।"

FALLBACK_MESSAGE_EN = (
    "I don't have a grounded answer for this — here's where to ask a human: "
    "You can contact NALSA's National Legal Aid Helpline at 15100 (24x7 toll-free) "
    "for free legal counsel, or report grievances on the Ministry of Labour Shram Suvidha portal (https://shramsuvidha.gov.in)."
)

FALLBACK_MESSAGE_HI = (
    "मेरे पास इसके लिए पुष्ट कानूनी जानकारी उपलब्ध नहीं है — मानव सहायता के लिए: "
    "आप मुफ्त कानूनी सलाह के लिए NALSA की राष्ट्रीय हेल्पलाइन 15100 (टोल-फ्री) पर संपर्क कर सकते हैं, "
    "या श्रम मंत्रालय के श्रम सुविधा पोर्टल (https://shramsuvidha.gov.in) पर शिकायत दर्ज कर सकते हैं।"
)


class Citation(BaseModel):
    """Traceable citation model for legal knowledge base retrieval."""
    source_file: str
    act_name: str
    section_or_clause: str
    section_title: str | None = None
    state: str | None = ""
    valid_as_of_date: str | None = None


class GroundedAnswer(BaseModel):
    """Structured response model for legal rights queries."""
    answer: str
    citations: list[Citation] = Field(default_factory=list)
    disclaimer: str
    language: str = "en"
    grounded: bool = True
    next_steps: str | None = None


def _format_citations(chunks: list[dict[str, Any]]) -> list[Citation]:
    """Convert raw chunk metadata into deduplicated Citation objects."""
    seen = set()
    citations: list[Citation] = []
    for c in chunks:
        m = c.get("metadata", {})
        key = (m.get("act_name", ""), m.get("section_or_clause", ""), m.get("source_file", ""))
        if key not in seen and m.get("act_name"):
            seen.add(key)
            citations.append(
                Citation(
                    source_file=m.get("source_file", ""),
                    act_name=m.get("act_name", ""),
                    section_or_clause=m.get("section_or_clause", ""),
                    section_title=m.get("section_title"),
                    state=m.get("state", ""),
                    valid_as_of_date=m.get("valid_as_of_date"),
                )
            )
    return citations


def _extract_next_steps(state: str | None = None, language: str = "en") -> str:
    """Return recommended official grievance channels for the state."""
    state_clean = (state or "").strip().title()
    if language == "hi":
        steps = "आधिकारिक शिकायत दर्ज करने के लिए कदम:\n1. NALSA मुफ्त कानूनी सहायता हेल्पलाइन: 15100 (टोल-फ्री)\n2. केंद्रीय श्रम सुविधा पोर्टल: https://shramsuvidha.gov.in"
        if state_clean:
            steps += f"\n3. {state_clean} राज्य श्रम विभाग पोर्टल पर ऑनलाइन शिकायत दर्ज करें।"
        return steps

    steps = (
        "Recommended Next Steps:\n"
        "1. Free Legal Aid: Call NALSA 24x7 Helpline at 15100 for an appointed advocate.\n"
        "2. Central Portal: File a grievance on Shram Suvidha Portal (https://shramsuvidha.gov.in)."
    )
    if state_clean:
        steps += f"\n3. State Portal: Approach the {state_clean} Labour Commissioner Office / Portal for formal recovery."
    return steps


def _deterministic_grounded_answer(
    query: str,
    chunks: list[dict[str, Any]],
    language: str = "en",
    state: str | None = None,
) -> GroundedAnswer:
    """Deterministic, highly grounded answer synthesis based strictly on retrieved chunks."""
    disclaimer = MANDATORY_DISCLAIMER_HI if language == "hi" else MANDATORY_DISCLAIMER_EN
    citations = _format_citations(chunks)
    next_steps = _extract_next_steps(state=state, language=language)

    top_chunk = chunks[0]
    top_meta = top_chunk.get("metadata", {})
    act_name = top_meta.get("act_name", "Indian Labour Law")
    section = top_meta.get("section_or_clause", "")
    text = top_chunk.get("text", "")

    # Extract key lines from the top matching chunk
    lines = [line.strip() for line in text.splitlines() if line.strip() and not line.startswith("---") and not line.startswith("#")]
    summary_lines = lines[:4]
    summary_body = " ".join(summary_lines)

    if language == "hi":
        answer = (
            f"कानूनी प्रावधानों के अनुसार ({act_name}, {section}):\n"
            f"यह पैटर्न इंगित करता है कि कानून के तहत श्रमिकों को वैधानिक संरक्षण प्राप्त है। "
            f"प्रासंगिक प्रावधान के अनुसार:\n\n{summary_body}\n\n"
            f"यदि नियोक्ता वैधानिक नियमों का पालन नहीं कर रहा है, तो वास्तविक निर्धारण के लिए आधिकारिक शिकायत चैनल का उपयोग करें।"
        )
    else:
        answer = (
            f"Based on {act_name} ({section}):\n"
            f"This pattern indicates statutory protection under applicable labour law. "
            f"According to the relevant statutory section:\n\n{summary_body}\n\n"
            f"Under Indian law, employers must adhere strictly to these timelines and deduction ceilings. "
            f"If an employer deviates from this statutory standard, route your complaint to the official grievance channel for formal determination."
        )

    return GroundedAnswer(
        answer=answer,
        citations=citations,
        disclaimer=disclaimer,
        language=language,
        grounded=True,
        next_steps=next_steps,
    )


def generate_grounded_answer(
    query: str,
    retrieved_chunks: list[dict[str, Any]] | None = None,
    state: str | None = None,
    language: str = "en",
    similarity_threshold: float = 0.35,
) -> GroundedAnswer:
    """Generate a strictly grounded answer citing retrieved legal sources.

    Complies with AGENTS.md:
    1. Returns explicit fallback if retrieval confidence is low or no chunks found.
    2. Never accuses a named employer of being guilty.
    3. Always attaches visible educational disclaimer.
    4. Includes traceable citations with act_name, section, source_file.
    """
    disclaimer = MANDATORY_DISCLAIMER_HI if language == "hi" else MANDATORY_DISCLAIMER_EN

    # If chunks not provided directly, retrieve them
    if retrieved_chunks is None:
        retrieved_chunks = retrieve_chunks(query=query, state=state, top_k=4)

    # Check grounding confidence
    if not retrieved_chunks or retrieved_chunks[0].get("similarity", 0.0) < similarity_threshold:
        fallback_msg = FALLBACK_MESSAGE_HI if language == "hi" else FALLBACK_MESSAGE_EN
        return GroundedAnswer(
            answer=fallback_msg,
            citations=[],
            disclaimer=disclaimer,
            language=language,
            grounded=False,
            next_steps=_extract_next_steps(state=state, language=language),
        )

    # Check if Gemini API key or external LLM is configured
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if gemini_api_key:
        try:
            # We can use google-genai / httpx to call Gemini API if provided
            import httpx
            context_blocks = []
            for idx, c in enumerate(retrieved_chunks, 1):
                m = c.get("metadata", {})
                context_blocks.append(
                    f"--- Source [{idx}]: {m.get('act_name')} ({m.get('section_or_clause')}) ---\n{c.get('text')}"
                )
            context_str = "\n\n".join(context_blocks)

            prompt = (
                f"You are WageGuard India's rights navigator assistant.\n"
                f"Answer the user's question ONLY using the facts from the legal sources below.\n"
                f"Never accuse a named employer of guilt; use 'based on [Act/Section], this pattern may indicate...'.\n"
                f"If the answer cannot be strictly found in the text, say: 'I don't have a grounded answer for this — here's where to ask a human'.\n"
                f"Language required: {'Hindi' if language == 'hi' else 'English'}.\n\n"
                f"LEGAL CONTEXT:\n{context_str}\n\n"
                f"USER QUESTION: {query}\n"
            )

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_api_key}"
            resp = httpx.post(
                url,
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=15.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                generated_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                return GroundedAnswer(
                    answer=generated_text,
                    citations=_format_citations(retrieved_chunks),
                    disclaimer=disclaimer,
                    language=language,
                    grounded=True,
                    next_steps=_extract_next_steps(state=state, language=language),
                )
        except (httpx.HTTPError, KeyError, ValueError) as err:
            import logging
            logging.getLogger(__name__).warning("LLM call failed, falling back to deterministic synthesis: %s", err)

    # Deterministic synthesis
    return _deterministic_grounded_answer(
        query=query,
        chunks=retrieved_chunks,
        language=language,
        state=state,
    )


if __name__ == "__main__":
    test_query = "can my employer delay my final salary after I resign?"
    result = generate_grounded_answer(query=test_query, language="en")
    print("=== GROUNDED ANSWER ===")
    print(result.answer)
    print("\n=== CITATIONS ===")
    for cit in result.citations:
        print(f"- {cit.act_name}: {cit.section_or_clause} ({cit.source_file})")
    print(f"\nDisclaimer: {result.disclaimer}")
    print(f"Grounded: {result.grounded}")
