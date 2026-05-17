import json, re
data = json.load(open(r'C:\Users\HUY\AI\OPUS ANIMUS\apps\pmp-quiz\data\questions.json', encoding='utf-8'))
multi = [q for q in data if len(q.get('options', {})) == 5]
print(f'Total 5-option questions: {len(multi)}')
for q in multi[:3]:
    print(f'\n=== id={q["id"]} correct={repr(q["correct"])} ===')
    # Find "select N" in question
    m = re.search(r'select (two|three|\d+)', q['question'], re.I)
    print(f'Select clause: {m.group(0) if m else "none"}')
    print(f'Q: {q["question"]}')
    print('Options:')
    for k, v in q['options'].items():
        print(f'  {k}: {v[:80]}')
    print(f'correct (stored): {repr(q["correct"])}')
