import json

data = json.load(open(r'C:\Users\HUY\AI\OPUS ANIMUS\apps\pmp-quiz\data\questions.json', encoding='utf-8'))
multi = [q for q in data if len(q.get('options', {})) == 5]

has_expl = sum(1 for q in multi if q.get('explanation'))
print(f"Total 5-option questions: {len(multi)}")
print(f"Have explanation: {has_expl}")
print(f"No explanation:  {len(multi) - has_expl}")
print()

# Show a few with explanation
for q in multi[:3]:
    print(f"id={q['id']} correct={repr(q['correct'])}")
    print(f"Q: {q['question'][:120]}")
    for k,v in q['options'].items():
        print(f"  {k}: {v}")
    print(f"explanation: {repr(q.get('explanation'))}")
    print()
