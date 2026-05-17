# Aligning Latent Geometry for Spherical Flow Matching in Image Generation

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.15193
**Published:** 2026-05-17 13:42 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3
**Relevance:** Aligning Latent Geometry giúp tạo hình ảnh với luồng latent -> đọc và lưu để nghiên cứu sau

Latent flow matching for image generation usually transports Gaussian noise to variational autoencoder latents along linear paths. Both endpoints, however, concentrate in thin spherical shells, and a Euclidean chord leaves those shells even when preprocessing aligns their radii. By decomposing each latent token into radial and angular components, we show through component-swap probes that decoded perceptual and semantic content is carried predominantly by direction, with radius contributing much less. We therefore project data latents onto a fixed token radius, use the radial projection of Gaussian noise as the spherical prior, finetune the decoder with the encoder frozen, and replace linear interpolation with spherical linear interpolation. The resulting geodesic paths stay on the sphere  | 👍 4
