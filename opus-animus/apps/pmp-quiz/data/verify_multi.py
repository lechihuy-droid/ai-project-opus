import json, sys
sys.stdout.reconfigure(encoding='utf-8')
data = json.load(open(r'C:\Users\HUY\AI\OPUS ANIMUS\apps\pmp-quiz\data\questions.json', encoding='utf-8'))
multi = [q for q in data if isinstance(q.get('correct'), list)]
print(f"Multi-answer questions: {len(multi)}")
choose2 = [q for q in multi if len(q['correct']) == 2]
choose3 = [q for q in multi if len(q['correct']) == 3]
print(f"  Choose 2: {len(choose2)}")
print(f"  Choose 3: {len(choose3)}")
print()
for q in multi[:4]:
    print(f"id={q['id']} correct={q['correct']}")
    print(f"  Q: {q['question'][:80]}...")
    print()
