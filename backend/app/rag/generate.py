"""Given a query + retrieved chunks, produce a grounded, cited answer.

Rule (AGENTS.md): the LLM must answer ONLY from the provided chunks. If no
relevant chunk is found, return an explicit "no grounded answer" response
instead of letting the model answer from parametric memory.
"""

# TODO: def generate_answer(query: str, chunks: list, language: str) -> RightsResult: ...
