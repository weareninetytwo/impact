# 0006 — Mockup generation

**Status:** Proposed (defer)

## Context
The hypothesis is a signage mockup on a business's storefront as the hook. It needs an image provider and storefront imagery. Street-level imagery terms generally restrict bulk or derived use; costs per image are unknown.

## Options
1. Generate with a diffusion/image-edit API on a customer-supplied or public photo. Per-image cost and quality unverified.
2. **Template mockup**: a generic storefront render with the business name and logo placed on it. Cheap, no third-party imagery.
3. Skip mockups; lead with text and a link to the owner's portfolio.

## Decision
Defer. Do not build until a buyer says mockups would change their decision. If built, start with option 2. Do not scrape or bulk-use street imagery without written terms review.

## Consequences
- No image provider, cost line or storage is added now.
- Open question for Gino: has any customer asked for this?
