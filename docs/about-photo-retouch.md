# Penyesuaian foto Tentang

## Hasil yang dipakai

- Aset tetap: `../public/images/alvin-about-seated-v2.webp`, dari foto asli pengguna. File fotonya tidak diubah.
- Acuan warna: `../public/images/alvin-hero-framed.webp`.
- Koreksi tampilan di `../src/app/reference-home.css`: `brightness(1.08) saturate(.88) hue-rotate(-5deg) blur(.12px)`, diikuti bayangan yang sudah ada. Penyesuaian ini sedikit mencerahkan dan menetralkan warna serta melembutkan noise pada tampilan; tidak merekonstruksi detail atau struktur wajah.
- Skala crop akhir 1,47, sedikit diperkecil dari 1,52. Offset ke bawah 60px; ditambah 32px dari posisi sebelumnya atas permintaan pengguna. Dimensi card tetap mengikuti hero.

## Percobaan retouch AI yang tidak dipakai

Tool: built-in `image_gen`, mode edit, background transparan. Hasil tidak dipasang karena beberapa detail wajah terlalu dihaluskan. Pratinjau disimpan sebagai `../artifacts/about-retouch-ai-rejected.png`; perbandingan wajah sebelum/sesudah ada di `../artifacts/about-face-comparison.png`. Foto asli dipertahankan untuk memenuhi batasan identitas pengguna.

Prompt lengkap yang digunakan:

```text
Use case: identity-preserve. Minimal photographic color correction and denoising for an existing portfolio cutout. Image 1 is the ONLY EDIT TARGET: Alvin seated cross-legged in a chair. Image 2 is a SKIN COLOR / WHITE BALANCE reference ONLY, not a face or pose replacement. Make the skin in image 1 a little more neutral and naturally warm like image 2, reducing the existing yellow/green cast, with a very restrained exposure and white balance correction on face, neck and hands. Gently reduce visible sensor/compression noise, especially in skin and dark clothing, while retaining natural skin texture and real fabric details. STRICT INVARIANTS: preserve the exact original face geometry and identity of image 1, its eyes, nose, mouth, jaw, facial proportions, expression, head angle, hairline, hair style, transparent glasses, pose, hand/finger positions, anatomy, body shape, navy blazer, shirt, emblem, watch, gray trousers, sneakers, chair shape and phone. Do not substitute the face from image 2. Do not beautify, reshape, smooth into plastic skin, invent details, sharpen aggressively, add makeup, remove objects, alter logos, reframe, crop, zoom, or change the silhouette. This should look like the identical source photo after gentle camera RAW white balance and noise reduction only. Keep the original full cutout composition and genuine transparent alpha background; do not add any background, shadow, glow, white outline or bottom fade. Return only the edited version of image 1.
```
