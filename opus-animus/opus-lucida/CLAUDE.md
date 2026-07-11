# Opus Lucida

Monetization workspace cho `Lucida`.

## Read first

- `ai/status.md`
- `ai/handoff-claude.md` (khi Claude là current owner)
- `docs/RD-beta-launch.md`
- `docs/SD-beta-architecture.md`
- `10-project-architecture-map.md`
- `11-current-operating-flow.md`

## Source of truth

- Business: `strategy/business-plan/01-business-plan.md`
- Brand voice: `strategy/positioning/02-brand-voice.md`
- Lesson method: `framework/lesson-method/02-framework-lesson-method.md`
- 3 View: `framework/grammar-3-view/03-framework-3-view-grammar.md`
- Slide method: `framework/slide-method/04-slide-method-guideline.md`
- Active slide system: `production/01-rules/slide-system/01-slide-architecture-framework.md`
- Slide template library: `production/01-rules/slide-system/02-slide-template-library.md`
- Slide production rules: `production/01-rules/slide-system/03-slide-design-production-rules.md`
- Slide QA checklist: `production/01-rules/slide-system/04-slide-framework-qa-checklist.md`
- Learner-facing generation spec: `production/01-rules/slide-system/09-learner-facing-generation-spec.md`
- Banned/preferred language dictionary: `production/01-rules/slide-system/10-banned-preferred-language-dictionary.md`
- Vietnamese explanation pattern bank: `production/01-rules/slide-system/12-vietnamese-jlpt-n2-explanation-pattern-bank.md`
- Public sample direction: `lessons/samples/06-sample-wake-cluster.md`
- Internal framework test case: `lessons/samples/05-sample-internal-test-case.md`
- Workflow: `automation/workflows/20-lesson-production-sop.md`
- Language generation runner: `automation/workflows/30-language-generation-runner-pack.md`

## Rules

- Uu tien tai su dung bo input hien co, khong viet lai tu dau neu chua can
- Khi lam video Remotion tu script dai hoac raw sources, doc `ai/skills/remotion-script-to-video/SKILL.md` truoc. Workflow nay dieu phoi `source-ingestor-cleaner`, `script-template-mapper`, `remotion-video-builder`, va `remotion-visual-qa`.
- Khi chi sua video Remotion dang technical diagram/card/arrow/subtitle, doc `ai/skills/remotion-diagram-video/SKILL.md` truoc khi sua `apps/lucida-remotion-demo/`
- File trong `docs/reference/` va `framework/**/reference/` la tham khao, khong phai source-of-truth active
- Sample-first: khong scale batch lesson neu public sample trung tam chua on
- Direction hien tai:
  - public video/sample 1 = `ã‚ã‘ã ãƒ»ã‚ã‘ã§ã¯ãªã„ãƒ»ã‚ã‘ãŒãªã„ãƒ»ã‚ã‘ã«ã¯ã„ã‹ãªã„`
  - `kai / gai / temade` giu lam internal sample / framework test case / video 2 candidate
- Funnel-first enough: moi content can co duong dan sang lead magnet hoac waitlist
- SaaS boundary: khong build custom LMS, payment, analytics dashboard trong phase beta
- Moi thay doi co y nghia phai sync docs lien quan trong cung luot
- Naming theo layer:
  - `10-*.md` = project-wide architecture / map
  - `20-*.md` = lesson workflow / SOP
  - `30-*.md` = subagent governance + runner packs
  - `40-*.md` = criteria / QA gate khi can them o dung folder
- Ten file uu tien:
  - ngan
  - ro vai tro
  - nhin ten la biet thuoc layer nao
- Khong dat ten theo lich su tam thoi kieu `final-final-v2`, `new`, `updated`
- Neu file da doi vai tro, rename cho hop layer thay vi de ten cu gay hieu nham

## Process File Governance

- Khong tao file `.md` ve process neu chua xac dinh ro file owner active cho concern do.
- Rule bat buoc:
  - `one concern = one active owner file`
  - neu file moi cung concern voi file cu:
    - hoac update file cu
    - hoac file moi phai ghi ro `Supersedes`
- Moi process file moi phai thuoc dung mot layer:
  - `project architect`
  - `operating flow`
  - `workflow SOP`
  - `rule / policy`
  - `lane review`
  - `reference only`
- Moi process file moi phai co header toi thieu:
  - `Status`
  - `Date`
  - `Scope`
  - `Role`
  - `Owner layer`
  - `Parent`
  - `Supersedes`
  - `Superseded by`
- Moi process file moi phai tra loi ro:
  - file nay duoc tao ra de tra loi cau hoi gi
- Moi process file moi phai link:
  - `upward` = file architect / flow / rule cha
  - `downward` = artifact / runner / QA ma no chi phoi
- Khong tao them lane-local process file neu no chi lap lai process chung.
- Chi tao lane-local process file khi co:
  - decision rieng cua lane
  - traceability rieng
  - review ket qua rieng
- Khi file process moi thay file cu:
  - update reference ngay trong cung luot
  - archive hoac xoa file cu ngay
  - khong de 2 file active cung mo ta cung mot process
- Process file khong dung de chua brainstorm tam thoi.
  - Brainstorm / patch thinking de o patch plan, review note, hoac archive.
  - Process file chi giu `operational truth`.
- Thu tu uu tien khi can hieu process:
  - `ai/status.md`
  - `ai/handoff-claude.md` (khi Claude là current owner)
  - `10-project-architecture-map.md`
  - `11-current-operating-flow.md`
  - `12-repo-folder-status-map.md`
  - `automation/workflows/**`
- He thong resume mac dinh cua repo:
  - `ai/status.md` = trang thai song hien tai (project-wide, owner-agnostic)
  - `ai/handoff-claude.md` = chot tiep tuc session sau cho Claude
  - khong dung file context dai ad-hoc lam live source-of-truth neu da co cac file nay
- Neu muon tao process file moi ma khong pass het rule tren, dung tao file moi; patch file owner hien co.
- Khi mot `migration` da tro thanh active direction cua he thong, doi ten va doi vai tro sang `upgrade` hoac file owner active; khong de `migration` song song lau voi contract moi.
- Voi process cai tien app/he thong, uu tien de ban active moi de len contract cu va day contract cu sang `legacy`, `historical`, hoac `archive` thay vi giu hai process active ngang nhau.

## Slide System Rule

- Slide khong phai lop trang tri cho script; slide la lop cau truc nhan thuc giua skeleton va script.
- Flow chuan:
  - `Skeleton -> Slide Architecture -> Slide Template / Wireframe -> Script -> Slide Design -> Audio / Video`
- Moi slide phai co:
  - phase
  - skeleton link
  - template
  - learning function
  - script role
  - production note
- Neu slide khong link duoc ve skeleton, hoac bo slide, hoac update skeleton truoc.
- Public slide heading uu tien tieng Viet learner-facing; tranh label noi bo bang tieng Anh nhu `Core Method`, `Payoff`, `Reveal`, `Diagnostic Practice`.
- Moi agent/subagent tao skeleton, script, slide, CTA, hay quiz explanation co learner-facing Vietnamese phai doc:
  - `production/01-rules/slide-system/07-vietnamese-explanation-style-guide.md`
  - `production/01-rules/slide-system/08-learner-facing-language-audit-checklist.md`
  - `production/01-rules/slide-system/09-learner-facing-generation-spec.md`
  - `production/01-rules/slide-system/10-banned-preferred-language-dictionary.md`
  - `production/01-rules/slide-system/12-vietnamese-jlpt-n2-explanation-pattern-bank.md`
- Language contract bat buoc cho generation:
  - tach `logic note` khoi `public phrasing`
  - khong de ngôn ngữ system/framework roi thang vao on-screen text hoac script
  - neu xuat hien 3-view method tren public output, dung `Y nghia - Dang - Cach dung`
- MVP quiz/reveal rule:
  - hien tai `1 logical slide = 1 PNG frame = 1 audio segment`
  - quiz slide phai co static `Truoc khi chot` / `Sau khi chot`
  - khong dua vao animation/reveal neu tech stack chua support.

## Script Opening Rule

- YouTube lesson script khong mo dau bang chao hoi dai hoac gioi thieu kenh qua som.
- 3-5 giay dau phai vao thang pain point, tinh huong that, hoac contrast khien nguoi hoc thay "dung van de cua minh".
- Chao hoi / "minh la..." neu can thi dat sau hook, thuong sau 30-45 giay hoac sau khi viewer da hieu vi sao nen xem tiep.
- Opening tot nen co nhip: pain point -> vi du/contrast ngan -> grammar logic twist -> promise cua video.
- Khong mo dau bang list grammar kho khan truoc khi tao ly do de quan tam.

## Writing convention

- Uu tien markdown gon, de scan
- Ten file active ngan, ro vai tro
- Neu co ban nhap va ban reviewed, ghi ro state trong file

