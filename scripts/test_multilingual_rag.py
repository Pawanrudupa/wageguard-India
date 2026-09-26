"""Empirical evaluation of existing ChromaDB multilingual retrieval quality.

Tests Tamil, Telugu, Kannada, Malayalam, and Bengali queries against the
existing embedding model (all-MiniLM-L6-v2 DefaultEmbeddingFunction).
"""

import json
import sys
from pathlib import Path

# Fix Windows console encoding for Indic unicode scripts
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.rag.retrieve import retrieve_chunks

TEST_SUITE = {
    "Tamil": [
        {
            "query": "நான் ராஜினாமா செய்த பிறகு முதலாளி எனது சம்பளத்தை நிறுத்தி வைக்கலாமா?",
            "topic": "Resignation salary withholding",
            "expected_act": ["Code on Wages", "Payment of Wages"],
            "expected_keywords": ["17", "resignation", "settlement", "wages"],
        },
        {
            "query": "கூடுதல் நேர வேலைக்கு (ஓவர்டைம்) இரட்டிப்பு சம்பளம் வழங்கப்பட வேண்டுமா?",
            "topic": "Overtime double rate",
            "expected_act": ["Code on Wages", "Factories Act", "Minimum Wages"],
            "expected_keywords": ["overtime", "twice", "double", "14"],
        },
        {
            "query": "5 ஆண்டுகள் வேலை செய்த பிறகு பணிக்கொடை (கிராஜுவிட்டி) கிடைக்குமா?",
            "topic": "Gratuity 5 years",
            "expected_act": ["Payment of Gratuity", "Gratuity"],
            "expected_keywords": ["gratuity", "5 years", "five years"],
        },
        {
            "query": "குறைந்தபட்ச ஊதியம் வழங்காவிட்டால் எங்கு புகார் செய்வது?",
            "topic": "Minimum wage complaint",
            "expected_act": ["Minimum Wages", "Code on Wages", "Shram Suvidha"],
            "expected_keywords": ["minimum wage", "complaint", "inspector"],
        },
        {
            "query": "தொழிலாளர்களுக்கு இலவச சட்ட உதவி மற்றும் வழக்கறிஞர் கிடைக்குமா?",
            "topic": "NALSA free legal aid",
            "expected_act": ["Legal Services Authorities", "NALSA"],
            "expected_keywords": ["15100", "legal aid", "free"],
        },
    ],
    "Telugu": [
        {
            "query": "నేను రాజీనామా చేసిన తర్వాత యజమాని నా జీతం నిలిపివేయవచ్చా?",
            "topic": "Resignation salary withholding",
            "expected_act": ["Code on Wages", "Payment of Wages"],
            "expected_keywords": ["17", "resignation", "settlement", "wages"],
        },
        {
            "query": "ఓవర్‌టైమ్ పనికి డబుల్ జీతం చెల్లించాలా?",
            "topic": "Overtime double rate",
            "expected_act": ["Code on Wages", "Factories Act", "Minimum Wages"],
            "expected_keywords": ["overtime", "twice", "double", "14"],
        },
        {
            "query": "5 సంవత్సరాలు పనిచేసిన తర్వాత గ్రాట్యుటీ వస్తుందా?",
            "topic": "Gratuity 5 years",
            "expected_act": ["Payment of Gratuity", "Gratuity"],
            "expected_keywords": ["gratuity", "5 years"],
        },
        {
            "query": "కనీస వేతనం చెల్లించకపోతే ఎక్కడ ఫిర్యాదు చేయాలి?",
            "topic": "Minimum wage complaint",
            "expected_act": ["Minimum Wages", "Code on Wages", "Shram Suvidha"],
            "expected_keywords": ["minimum wage", "complaint", "claim"],
        },
        {
            "query": "ఉచిత న్యాయ సహాయం కోసం ఏ నంబర్‌కు కాల్ చేయాలి?",
            "topic": "NALSA free legal aid 15100",
            "expected_act": ["Legal Services Authorities", "NALSA"],
            "expected_keywords": ["15100", "legal aid", "free"],
        },
    ],
    "Kannada": [
        {
            "query": "ನಾನು ರಾಜೀನಾಮೆ ನೀಡಿದ ನಂತರ ಮಾಲೀಕರು ನನ್ನ ಸಂಬಳವನ್ನು ತಡೆಹಿಡಿಯಬಹುದೇ?",
            "topic": "Resignation salary withholding",
            "expected_act": ["Code on Wages", "Payment of Wages"],
            "expected_keywords": ["17", "resignation", "settlement", "wages"],
        },
        {
            "query": "ಅಧಿಕಾವಧಿ (ಓವರ್‌ಟೈಮ್) ಕೆಲಸಕ್ಕೆ ದುಪ್ಪಟ್ಟು ವೇತನ ಸಿಗುತ್ತದೆಯೇ?",
            "topic": "Overtime double rate",
            "expected_act": ["Code on Wages", "Factories Act", "Minimum Wages"],
            "expected_keywords": ["overtime", "twice", "double", "14"],
        },
        {
            "query": "5 ವರ್ಷ ಕೆಲಸ ಮಾಡಿದ ನಂತರ ಗ್ರಾಚ್ಯುಟಿ ಪಡೆಯಲು ಅರ್ಹತೆಯಿದೆಯೇ?",
            "topic": "Gratuity 5 years",
            "expected_act": ["Payment of Gratuity", "Gratuity"],
            "expected_keywords": ["gratuity", "5 years"],
        },
        {
            "query": "ಕನಿಷ್ಠ ವೇತನ ಸಿಗದಿದ್ದರೆ ಎಲ್ಲಿ ದೂರು ನೀಡಬೇಕು?",
            "topic": "Minimum wage complaint",
            "expected_act": ["Minimum Wages", "Code on Wages", "Shram Suvidha"],
            "expected_keywords": ["minimum wage", "complaint"],
        },
        {
            "query": "ಕಾರ್ಮಿಕರಿಗೆ ಉಚಿತ ಕಾನೂನು ನೆರವು ಸಿಗುತ್ತದೆಯೇ?",
            "topic": "NALSA free legal aid",
            "expected_act": ["Legal Services Authorities", "NALSA"],
            "expected_keywords": ["15100", "legal aid", "free"],
        },
    ],
    "Malayalam": [
        {
            "query": "രാജി വെച്ചതിനു ശേഷം തൊഴിലുടമയ്ക്ക് ശമ്പളം തടഞ്ഞുവെക്കാൻ കഴിയുമോ?",
            "topic": "Resignation salary withholding",
            "expected_act": ["Code on Wages", "Payment of Wages"],
            "expected_keywords": ["17", "resignation", "settlement", "wages"],
        },
        {
            "query": "അധിക സമയം (ഓവർടൈം) ജോലി ചെയ്താൽ ഇരട്ടി വേതനം ലഭിക്കുമോ?",
            "topic": "Overtime double rate",
            "expected_act": ["Code on Wages", "Factories Act", "Minimum Wages"],
            "expected_keywords": ["overtime", "twice", "double", "14"],
        },
        {
            "query": "5 വർഷത്തെ സേവനത്തിന് ശേഷം ഗ്രാറ്റുവിറ്റി ലഭിക്കാൻ അർഹതയുണ്ടോ?",
            "topic": "Gratuity 5 years",
            "expected_act": ["Payment of Gratuity", "Gratuity"],
            "expected_keywords": ["gratuity", "5 years"],
        },
        {
            "query": "മിനിമം വേതനം ലഭിച്ചില്ലെങ്കിൽ എവിടെ പരാതി നൽകണം?",
            "topic": "Minimum wage complaint",
            "expected_act": ["Minimum Wages", "Code on Wages", "Shram Suvidha"],
            "expected_keywords": ["minimum wage", "complaint"],
        },
        {
            "query": "തൊഴിലാളികൾക്ക് സൗജന്യ നിയമസഹായം ലഭിക്കുമോ?",
            "topic": "NALSA free legal aid",
            "expected_act": ["Legal Services Authorities", "NALSA"],
            "expected_keywords": ["15100", "legal aid", "free"],
        },
    ],
    "Bengali": [
        {
            "query": "পদত্যাগ করার পর কি মালিক আমার বেতন আটকে রাখতে পারে?",
            "topic": "Resignation salary withholding",
            "expected_act": ["Code on Wages", "Payment of Wages"],
            "expected_keywords": ["17", "resignation", "settlement", "wages"],
        },
        {
            "query": "ওভারটাইম কাজের জন্য কি দ্বিগুণ মজুরি দিতে হয়?",
            "topic": "Overtime double rate",
            "expected_act": ["Code on Wages", "Factories Act", "Minimum Wages"],
            "expected_keywords": ["overtime", "twice", "double", "14"],
        },
        {
            "query": "৫ বছর কাজ করার পর কি গ্র্যাচুইটি পাওয়া যায়?",
            "topic": "Gratuity 5 years",
            "expected_act": ["Payment of Gratuity", "Gratuity"],
            "expected_keywords": ["gratuity", "5 years"],
        },
        {
            "query": "ন্যূনতম মজুরি না দিলে কোথায় অভিযোগ করব?",
            "topic": "Minimum wage complaint",
            "expected_act": ["Minimum Wages", "Code on Wages", "Shram Suvidha"],
            "expected_keywords": ["minimum wage", "complaint"],
        },
        {
            "query": "বিনামূল্যে আইনি সহায়তা পাওয়ার জন্য কোন নম্বরে ফোন করব?",
            "topic": "NALSA free legal aid 15100",
            "expected_act": ["Legal Services Authorities", "NALSA"],
            "expected_keywords": ["15100", "legal aid", "free"],
        },
    ],
}


def run_test():
    results = {}
    print("=" * 70)
    print("TESTING RETRIEVAL QUALITY ACROSS NON-HINDI INDIAN LANGUAGES")
    print("Embedding Function: ChromaDB Default (all-MiniLM-L6-v2)")
    print("=" * 70)

    for lang, queries in TEST_SUITE.items():
        results[lang] = []
        print(f"\n--- Language: {lang} ---")
        correct_count = 0

        for item in queries:
            q = item["query"]
            topic = item["topic"]
            chunks = retrieve_chunks(q, top_k=4, score_threshold=0.0)

            # Check if any chunk matches expected
            matched = False
            top_chunk_info = "None"
            top_similarity = 0.0

            if chunks:
                top = chunks[0]
                meta = top.get("metadata", {})
                act = meta.get("act_name", "Unknown Act")
                sec = meta.get("section_or_clause", "")
                title = meta.get("section_title", "")
                text = top.get("text", "")
                top_similarity = top.get("similarity", 0.0)
                top_chunk_info = f"{act} - {sec}: {title}"

                # Match logic: check act and keywords in top chunk or in top 4
                for c in chunks:
                    c_act = c.get("metadata", {}).get("act_name", "").lower()
                    c_text = c.get("text", "").lower()
                    act_match = any(e.lower() in c_act for e in item["expected_act"])
                    kw_match = any(k.lower() in c_text for k in item["expected_keywords"])
                    if act_match and kw_match:
                        matched = True
                        break

            if matched:
                correct_count += 1
                status = "PASS (Relevant Chunk in Top 4)"
            else:
                status = "FAIL (No Grounded Chunk Found)"

            print(f"[{status}] {topic}")
            print(f"  Query: {q}")
            print(f"  Top-1: {top_chunk_info} (Sim: {top_similarity:.3f})")
            if not matched and chunks:
                print(f"  Retrieved but irrelevant Top-1 snippet: {chunks[0].get('text', '')[:120]}...")

            results[lang].append({
                "topic": topic,
                "query": q,
                "passed": matched,
                "top_chunk": top_chunk_info,
                "top_similarity": top_similarity,
            })

        print(f"Summary for {lang}: {correct_count}/{len(queries)} passed ({correct_count / len(queries) * 100:.0f}%)")

    # Overall Summary
    total_passed = sum(sum(1 for r in res if r["passed"]) for res in results.values())
    total_queries = sum(len(res) for res in results.values())
    print("\n" + "=" * 70)
    print(f"OVERALL RETRIEVAL ACCURACY: {total_passed}/{total_queries} ({total_passed / total_queries * 100:.1f}%)")
    print("=" * 70)


if __name__ == "__main__":
    run_test()
