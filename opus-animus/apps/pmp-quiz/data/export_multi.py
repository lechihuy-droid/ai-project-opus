import json, sys
sys.stdout.reconfigure(encoding='utf-8')
data = json.load(open(r'C:\Users\HUY\AI\OPUS ANIMUS\apps\pmp-quiz\data\questions.json', encoding='utf-8'))
multi = [q for q in data if len(q.get('options', {})) == 5]
for q in multi:
    print(f"ID:{q['id']}")
    print(f"Q:{q['question']}")
    for k,v in q['options'].items():
        print(f"{k}:{v}")
    print("---")
