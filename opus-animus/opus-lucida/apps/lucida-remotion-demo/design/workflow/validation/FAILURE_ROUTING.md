# Failure Routing

Route defects to the smallest gate that owns the incorrect artifact.

- input/content defect -> upstream workflow or G01
- audio/script alignment defect -> G02
- creative framing defect -> G03
- narrative/timing structure defect -> G04
- scene semantics defect -> G05
- abstract resource defect -> G06
- style/motion decision defect -> G07
- missing/invalid binding or rights defect -> G08
- cross-reference/compiler defect -> G09
- layout/motion/preview defect -> owning gate identified by G10
- renderer infrastructure defect -> G11 retry
- publication metadata defect -> G12

Every failure record must include owner, severity, evidence, affected artifacts, retryability, and proposed route.