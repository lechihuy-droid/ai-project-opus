"""
Apply correct multi-answers to questions.json.
Answers determined by PMP domain knowledge analysis.
"""
import json, shutil, sys
sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path

DATA_FILE   = Path(__file__).parent / "questions.json"
BACKUP_FILE = Path(__file__).parent / "questions.backup.json"

# Correct answers for all 60 multi-answer questions
# Format: {question_id: [sorted list of correct letters]}
ANSWERS = {
    57:   ["A","C"],   # Burndown chart + CFD — agile performance tools
    63:   ["B","E"],   # Transparent env + regular meetings with stakeholder
    64:   ["A","B","E"], # Prioritize stakeholders + stakeholder assessment + impact matrix
    66:   ["B","E"],   # Set clear vision + keep team engaged/focused on direction
    195:  ["B","C"],   # Survey to confirm issues + deploy tracking/resolution system
    247:  ["D","E"],   # Assign to strength areas + support decisions in strength areas
    316:  ["A","E"],   # Ask customer priorities + discuss with dev team which reqs fit Q1
    353:  ["B","C"],   # Daily virtual meetings + web-based kanban board
    358:  ["A","B","E"], # WBS of new scope + change request + manage quality
    361:  ["C","E"],   # Training/mentoring/coaching + recognition/retention program
    366:  ["A","E"],   # Questionnaire to participants + deliver materials and gather comments
    377:  ["A","B","D"], # Story testing + BDD/TDD + security and performance testing
    395:  ["B","D"],   # Sprint goal + product backlog
    411:  ["A","B"],   # Product owner adds to backlog + ask security for regulation details
    414:  ["A","D"],   # Stakeholder analysis + adopt incremental approach
    443:  ["A","E"],   # Discussions yield no results + focus on negative/disinterest
    483:  ["A","C"],   # Virtual workspace + talk to team member directly
    487:  ["D","E"],   # Regular meetings with neighbors + register as risk with mitigation
    488:  ["B","D"],   # Evaluate PM strengths/weaknesses + establish progress monitoring & comms
    504:  ["B","C"],   # Meeting with neighborhood reps + analyze root cause of negative attitude
    508:  ["C","E"],   # Coach new team member + facilitate open discussion
    514:  ["B","D"],   # Pair work/knowledge sharing + external training event
    515:  ["A","B","C"], # Define ground rules + retrospective + daily team meetings
    536:  ["A","C"],   # Alternatives analysis + cost-benefit analysis
    540:  ["B","D"],   # Review ground rules with team + contact team member about sharing norms
    546:  ["B","D"],   # Review and update dependencies + root cause analysis
    555:  ["A","C","D"], # Story not on board + technology blocking agile + lack of empowerment
    568:  ["A","C"],   # Five whys + Ishikawa diagrams (root cause analysis tools)
    583:  ["D","E"],   # Discuss with functional managers + work with team to accelerate
    592:  ["C","D"],   # Reiterate ground rules + address behavioral issue with each member
    594:  ["A","C"],   # Complexity/cost of development + cost of delay vs business value
    595:  ["A","D"],   # Issue log + change log
    624:  ["C","E"],   # Backlog refinement meeting + prioritize issues affecting iteration goal
    685:  ["B","E"],   # Gather info and estimate impact + update risk log and raise in meeting
    738:  ["B","E"],   # Individual meetings with conflicting members + direct collaborative approach
    785:  ["A","B"],   # Work together daily + strive toward continuous improvement
    813:  ["A","C"],   # Speak with both members to resolve + clarify inclusive practices
    851:  ["B","C","D"], # Rolling wave + relative estimation + iterations and reviews
    862:  ["B","C"],   # Training on agile + brainstorm with team for alternative approaches
    882:  ["A","D"],   # Identify knowledge gap specifics + SME mentoring groups
    897:  ["B","C"],   # Flexibility the team exercises + risk the org is willing to accept
    902:  ["A","C"],   # Foster stakeholder engagement + share project objectives
    932:  ["B","C","E"], # Ask testers for more info + brainstorm with team + ask sponsor
    959:  ["A","C","D"], # Acceptance criteria in iteration planning + lessons learned metrics + performance metrics
    981:  ["B","E"],   # Train all on cultural differences + address language ambiguity in requirements
    1030: ["A","B","E"], # Update documents + highlight impacts + meeting with customer to align
    1059: ["B","C"],   # Risk workshop with stakeholders + log as risk and assess
    1108: ["A","D","E"], # Risks to benefits + expected business value + metrics to measure benefits
    1174: ["B","E"],   # Past project docs with early warning + discuss problems without retribution
    1200: ["A","B"],   # Update comms management plan + weekly meetings with all teams taking turns
    1216: ["B","C","E"], # Feedback from team + feedback from isolated member + team-building
    1225: ["B","D"],   # Discuss with sponsor + evaluate impact of incremental deliverables
    1242: ["A","B","C"], # Survey preferred comms + review comms strategy regularly + compile comms plan
    1256: ["B","C"],   # Alternatives to scope change at phases + tier contract for fixed/agile
    1266: ["A","C","E"], # Product roadmap + product vision + high-level product backlog
    1330: ["D","E"],   # Update risk checklist + reallocate resources to complete before policy
    1368: ["A","C"],   # Review customer priorities + discuss with team which reqs can go faster
    1388: ["A","E"],   # Risk steering committee + advisory team panel
    1398: ["B","C"],   # Log in risk register + analyze impact and submit change request
    1414: ["A","C"],   # Schedule compression techniques + variance and trend analysis
}

def main():
    if not BACKUP_FILE.exists():
        shutil.copy(DATA_FILE, BACKUP_FILE)
        print(f"Backup saved -> {BACKUP_FILE.name}")

    data = json.loads(DATA_FILE.read_text(encoding='utf-8'))
    id_to_idx = {q['id']: i for i, q in enumerate(data)}

    updated = 0
    for qid, answers in ANSWERS.items():
        if qid in id_to_idx:
            data[id_to_idx[qid]]['correct'] = answers
            updated += 1

    DATA_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"OK Updated {updated} questions in {DATA_FILE.name}")

    # Verify
    data2 = json.loads(DATA_FILE.read_text(encoding='utf-8'))
    multi = [q for q in data2 if isinstance(q.get('correct'), list)]
    print(f"Total multi-answer questions now: {len(multi)}")
    print(f"Sample: id={multi[0]['id']} correct={multi[0]['correct']}")

if __name__ == "__main__":
    main()
