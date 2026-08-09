# Skill Control Plane

Tài liệu này mô tả cơ chế **chọn skill có kiểm soát** của Harness Hub. Đây là một control-plane độc lập với prompt của agent và với nội dung từng `SKILL.md`.

## Trạng thái triển khai

Phiên bản hiện tại chạy ở chế độ **`shadow` / advisory**:

- Hub có thể phân tích task, chọn skill và đánh giá capability/policy.
- Kết quả chỉ là preview có trace; chưa tự nạp body `SKILL.md` và chưa gọi tool.
- Workflow đang chạy vẫn dùng skills đã pin trong `AgentManifest` qua legacy loader.
- Vì vậy preview **không điều khiển execution** và không phải bằng chứng rằng quyền/tool đã được enforce trong lần chạy workflow đó.

Mục tiêu của shadow mode là quan sát quyết định, phát hiện metadata/collision/policy sai trước khi đưa quyết định vào execution path.

## Mô hình 5 lớp

```text
Task
  ↓
Agent Router
  ↓
Skill Resolver
  ↓
Capability Resolver
  ↓
Policy / Permission Engine
  ↓
Execution + Quality Gate
```

| Lớp | Trách nhiệm |
| --- | --- |
| Agent Router | Chọn agent và `AgentManifest` phù hợp với job. |
| Skill Resolver | Dùng metadata để tạo `SelectionDecision` xác định, có hash/trace. |
| Capability Resolver | Xác định trạng thái capability mà skill cần. |
| Policy / Permission Engine | Chỉ cho phép phần giao nhau giữa grant agent, runtime permission và binding sẵn sàng. |
| Execution + Quality Gate | Thực thi adapter và kiểm tra evidence/gate. Hiện chưa consume preview. |

Nguyên tắc ownership:

| Concern | Source of truth |
| --- | --- |
| Agent tồn tại và skills legacy đang pin | `agents/` và `AgentManifest` |
| Skill discovery/identity | `services/skill_library.py` |
| Skill enrichment | `catalogs/skill_metadata.yaml` |
| Quy tắc chọn/budget | `policies/skill_selection.yaml` |
| Capability, binding và health | `capabilities/` cùng catalog/runtime capability data |
| Quyền agent/runtime | runtime profile và policy engine |
| Quyết định preview | `services/skill_resolution.py` |
| API | `api/skills.py` |
| Evidence thực thi | trace/run artifacts và quality gates |

`SKILL.md` vẫn là hướng dẫn đầy đủ của skill, **không** là nơi cấp quyền và **không** là inventory resolver. Điều này tách rõ: agent là *ai làm*, skill là *cách làm*, capability là *có thể làm gì*, adapter là *tool/vendor cụ thể*, policy là *có được làm không*.

## Discovery, identity và selection

Resolver dùng progressive disclosure:

1. Discovery chỉ lấy descriptor metadata của toàn bộ skill: identity, source, path, kích thước prompt, modified time và enrichment.
2. Catalog chọn tối đa số skill trong policy; kết quả pin `id`, `source`, `content_hash`.
3. Resolver chỉ đọc skill đã chọn để tạo strong hash; body không được đưa vào model context hay response. Execution rollout tương lai mới được phép inject toàn bộ body sau khi selection và policy thành công.

Identity chuẩn là namespaced, ví dụ `hub_builtin/frontend-design`, không chỉ là tên ngắn. Request explicit bằng tên ngắn chỉ hợp lệ nếu nó ánh xạ duy nhất; collision giữa nhiều source sẽ **fail closed**, buộc caller dùng namespaced ID. Đây là guard chống route nhầm vendor/source.

Thứ tự chọn được quyết định bằng rule/policy thay vì “LLM thích gì thì load”. Rule `force` được đưa lên đầu và **thắng** mọi nguồn candidate khác; phần còn lại theo strategy hiện hành:

1. policy `force`;
2. explicit request;
3. skills yêu cầu bởi agent (tương thích legacy trong shadow mode);
4. intent match;
5. domain match.

Mỗi candidate vẫn phải qua compatibility, capability và prompt budget. `never_truncate_skill: true` nghĩa là skill vượt budget bị từ chối, không bị cắt body để cố nhét vào context.

## Capability và quyền

Skill đề xuất capability không đồng nghĩa agent được cấp tool. Trạng thái được tính theo giao:

```text
agent capability grant
  ∩ runtime permission
  ∩ adapter binding configured + registered + healthy/not_checked
```

- Required capability không đạt trạng thái `allowed` → skill bị `denied`.
- Optional capability không đạt → skill vẫn có thể được chọn nhưng ở trạng thái `degraded` và trace nêu rõ capability nào không dùng được.
- Không có đường đi từ câu lệnh trong `SKILL.md` sang escalation quyền. Policy/runtime là hard constraint; prompt là soft constraint.

## API preview

`POST /api/skill-resolution/preview` nhận payload task/agent/lifecycle/tags/explicit skill theo contract resolver và trả về quyết định ở mode `shadow`.

Kết quả dùng để audit gồm:

- task classification (intent/domain);
- danh sách skill được chọn với `id`, `source`, `content_hash`;
- reject/degrade reasons và capability state;
- budget, version/hash của policy và catalog;
- trace để giải thích thứ tự quyết định.

Endpoint không trả body `SKILL.md`, credentials, adapter config hoặc secret. Input invalid, explicit skill không tồn tại hay collision sẽ trả lỗi 400 đã được sanitize.

## Cách dùng trên UI

1. Mở **Workflows** tại route `#/workflows`.
2. Chọn một workflow và node agent đang active.
3. Mở tab **Run**, nhập objective.
4. Bấm **Resolution preview**.
5. Đọc overlay: classification, selected skills/hash, reject/degrade, budget và capability/policy state.

Nút bị vô hiệu khi thiếu objective hoặc node không phải agent. Overlay là dialog có focus quản lý, trả focus về nút mở khi đóng và hỗ trợ phím `Escape`. UI chỉ render trường preview an toàn; không render body skill hay cấu hình nhạy cảm.

## SDD và evidence kiểm thử

Kiểm thử cho control plane theo **SDD (specification-driven development)**: assertion kiểm tra yêu cầu và hành vi public, không khóa vào private helper, layout source hay chi tiết implementation.

Evidence đã chạy cho bản này:

| Hạng mục | Lệnh / kết quả |
| --- | --- |
| Resolver + capability + execution contracts | `test_skill_resolution_spec.py` + `test_capabilities.py` + `test_execution.py`: **30 passed** |
| Regression API/agent/workflow | `test_runtime_agents.py` + `test_workflow_templates.py` + `test_added_api_endpoints.py`: **47 passed** |
| Frontend build | `pnpm build`: **pass**, 1861 modules; có cảnh báo bundle 588.63 kB |
| Frontend lint | `pnpm lint`: **pass** |
| Browser acceptance | `harness/hub/tests/ui_skill_resolution_smoke.py` qua `with_server` tại port 8799: **pass** |

Browser smoke xác nhận user flow public: mở Workflows, chọn agent node, nhập objective, mở preview, thấy dữ liệu preview an toàn, không console error và `Escape` đóng dialog.

## Rollout từ shadow sang enforcement

Không bật enforcement chỉ bằng đổi mode. Các bước tiếp theo cần hoàn thành theo thứ tự:

1. Migrate skill trong mọi `AgentManifest` sang namespaced ID.
2. Cho execution consume đúng `SelectionDecision` đã pin, gồm `id`/`source`/`content_hash`, thay vì resolve lại theo tên.
3. Nạp full `SKILL.md` chỉ sau selection/policy thành công; giữ policy budget và tuyệt đối không truncate.
4. Thêm binding health check có evidence cho từng adapter trước execution.
5. Gắn execution artifacts vào quality gates; chỉ PASS khi deterministic checks và evidence requirement đều đạt.
6. Chạy shadow/compare đủ lâu, audit rejected/degraded/collision, rồi mới đặt enforcement flag theo runtime profile.

Khi các bước trên chưa hoàn tất, mọi run phải tiếp tục được hiểu là legacy execution có preview tư vấn kèm theo, không phải một policy-enforced tool run.
