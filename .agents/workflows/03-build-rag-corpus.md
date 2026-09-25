# Workflow: Build the legal-rights RAG corpus and index

**Goal**: a queryable, cited knowledge base of Indian labour law for the rights
assistant.

## Steps
1. Collect source texts into `rag_store/corpus/`, organized by sub-folder:
   - `central_acts/` — Minimum Wages Act 1948, Payment of Wages Act 1936, Payment of
     Gratuity Act 1972, and (clearly labeled with rollout-status caveats) the relevant
     new Labour Codes. Get full text from the India Code portal (indiacode.nic.in) —
     it's the authoritative government source, not a summary site.
   - `state_minimum_wages/` — one file per launch state with the *current* notified
     minimum wage rates per scheduled employment category (these expire/update — store
     the notification date and a "valid as of" field in the file's frontmatter, and plan
     to refresh this periodically, it will go stale).
   - `grievance_channels/` — how to file a complaint: Shram Suvidha Portal, state labour
     commissioner contact process, EPFO/ESIC grievance process, NALSA legal aid contact
     info, per state where available.
   - `faq/` — plain-language explanations of common situations (unpaid overtime, illegal
     deductions, withheld final settlement, PF not deposited) each explicitly tied back
     to the specific Act/section it summarizes — never write an FAQ answer without a
     citation to a source file in this corpus.
2. Chunk documents in `backend/app/rag/ingest.py` — chunk by logical section (Act
   section number, or notification table row), not by fixed token count alone; legal
   text loses meaning when sliced mid-clause.
3. Embed chunks (sentence-transformers, a multilingual model given the Hindi
   requirement — e.g. a `paraphrase-multilingual-*` model) and store in a local Chroma
   collection under `rag_store/index/`.
4. Store, per chunk, metadata: `source_file, act_name, section_or_clause, state
   (if applicable), valid_as_of_date`. This metadata is what powers the citation shown
   to the user — retrieval without traceable metadata is not acceptable for this
   project.
5. Write `backend/app/rag/retrieve.py`: given a query, return top-k chunks + metadata.
   Write `backend/app/rag/generate.py`: given the query + retrieved chunks, prompt the
   LLM to answer ONLY from the provided chunks, explicitly instructed to say "I don't
   have a grounded answer for this" rather than fill gaps from general knowledge, and to
   return which chunk(s) it used.

## Definition of done
- `rag_store/index/` contains a working Chroma collection.
- A test query like "can my employer delay my final salary after I resign?" returns a
  chunk from the Payment of Wages Act corpus file with correct metadata.
- `backend/app/rag/generate.py` output always includes a citation list, never empty
  unless it explicitly says it couldn't find a grounded answer.
