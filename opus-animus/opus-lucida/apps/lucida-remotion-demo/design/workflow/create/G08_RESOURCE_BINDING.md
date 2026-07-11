# G08 — Resource Binding

**Verb:** Bind

## Input
- validated `CreativePlan`
- `ResourcePlan`
- asset/component/motion registries
- rights and renderer policies

## Worker
Deterministic resolver and retrieval services. Codex may implement or repair an approved missing component/adapter in a separate code-change workflow. GPT is not permitted to invent runtime IDs.

## Transform
Bind concrete assets, component templates, motion presets, caption components, fonts, audio resources, and fallback resources to each scene.

## Output
- `ImplementationPlan`

## Verify
- every referenced version exists
- checksums and storage URIs resolve
- licenses permit intended use
- component props match schema
- motion and caption presets support required timing mode
- deterministic fallback exists for optional external resources

## Failure routing
Missing approved resources return to G07 for alternative selection or create an implementation task. Rights failure blocks the resource and triggers rebinding.