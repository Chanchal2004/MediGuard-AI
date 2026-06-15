# Image Testing Playbook

- Always use base64-encoded images.
- Accepted formats: JPEG, PNG, WEBP only.
- Do not use SVG, BMP, HEIC.
- Do not upload blank/solid/uniform images. Every image must contain real visual features.
- If not PNG/JPEG/WEBP, transcode to PNG/JPEG before upload. Update MIME after conversion.
- If animated, extract first frame only.
- Resize large images to reasonable bounds.
