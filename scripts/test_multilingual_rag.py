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
    print("=" * 80)
    print("TESTING RETRIEVAL QUALITY ACROSS NON-HINDI INDIAN LANGUAGES")
    print("Model: paraphrase-multilingual-MiniLM-L12-v2")
    print("Production Threshold: similarity >= 0.40")
    print("=" * 80)

    for lang, queries in TEST_SUITE.items():
        results[lang] = []
        print(f"\n--- Language: {lang} ---")

        for item in queries:
            q = item["query"]
            topic = item["topic"]
            chunks = retrieve_chunks(q, top_k=4, score_threshold=0.0)

            # Find matching relevant chunk
            matched_chunk = None
            for c in chunks:
                c_act = c.get("metadata", {}).get("act_name", "").lower()
                c_text = c.get("text", "").lower()
                act_match = any(e.lower() in c_act for e in item["expected_act"])
                kw_match = any(k.lower() in c_text for k in item["expected_keywords"])
                if act_match and kw_match:
                    matched_chunk = c
                    break

            top1_sim = chunks[0]["similarity"] if chunks else 0.0
            top1_meta = chunks[0].get("metadata", {}) if chunks else {}
            top1_info = f"{top1_meta.get('act_name')} - {top1_meta.get('section_or_clause')}" if chunks else "None"

            matched_sim = matched_chunk["similarity"] if matched_chunk else 0.0
            matched_meta = matched_chunk.get("metadata", {}) if matched_chunk else {}
            matched_info = f"{matched_meta.get('act_name')} - {matched_meta.get('section_or_clause')}" if matched_chunk else "None"

            pass_raw = matched_chunk is not None
            pass_025 = pass_raw and matched_sim >= 0.25
            # Production threshold 0.40: both top-1 confidence >= 0.40 and relevant chunk >= 0.40
            pass_040 = pass_raw and matched_sim >= 0.40

            status_str = f"PASS_0.40 (Sim: {matched_sim:.3f})" if pass_040 else (f"PASS_RAW_ONLY (Sim: {matched_sim:.3f} < 0.40)" if pass_raw else "FAIL")

            print(f"[{status_str}] {topic}")
            print(f"  Query: {q}")
            print(f"  Top-1: {top1_info} (Sim: {top1_sim:.3f})")
            if matched_chunk:
                print(f"  Relevant Match: {matched_info} (Sim: {matched_sim:.3f})")
            else:
                print("  Relevant Match: NONE in top 4")

            results[lang].append({
                "topic": topic,
                "query": q,
                "top1_info": top1_info,
                "top1_sim": top1_sim,
                "matched_info": matched_info,
                "matched_sim": matched_sim,
                "pass_raw": pass_raw,
                "pass_025": pass_025,
                "pass_040": pass_040,
            })

    # Summary Table
    print("\n" + "=" * 80)
    print("MULTILINGUAL RETRIEVAL PERFORMANCE SUMMARY")
    print("=" * 80)
    print(f"{'Language':<12} | {'Raw Match':<12} | {'Threshold 0.25':<16} | {'Production 0.40':<16}")
    print("-" * 65)

    tot_raw = 0
    tot_025 = 0
    tot_040 = 0
    total_q = sum(len(qs) for qs in TEST_SUITE.values())

    for lang, res_list in results.items():
        n = len(res_list)
        n_raw = sum(1 for r in res_list if r["pass_raw"])
        n_025 = sum(1 for r in res_list if r["pass_025"])
        n_040 = sum(1 for r in res_list if r["pass_040"])
        tot_raw += n_raw
        tot_025 += n_025
        tot_040 += n_040
        print(f"{lang:<12} | {n_raw}/{n} ({n_raw/n*100:>3.0f}%)   | {n_025}/{n} ({n_025/n*100:>3.0f}%)        | {n_040}/{n} ({n_040/n*100:>3.0f}%)")

    print("-" * 65)
    print(f"{'TOTAL':<12} | {tot_raw}/{total_q} ({tot_raw/total_q*100:>3.1f}%) | {tot_025}/{total_q} ({tot_025/total_q*100:>3.1f}%)      | {tot_040}/{total_q} ({tot_040/total_q*100:>3.1f}%)")
    print("=" * 80)


if __name__ == "__main__":
    run_test()
