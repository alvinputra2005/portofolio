# Foto hero tanpa latar

- Sumber asli: `../../Dokumentasi/Foto Alvin.png` (tetap tersimpan).
- Proses: tool Imagegen bawaan, mode edit `background-extraction`, transparent_background=true.
- PNG transparan: `../public/images/alvin-hero-cutout.png`.
- Aset web: `../public/images/alvin-hero-cutout.webp` (alpha transparan dipertahankan; margin transparan dipangkas; kompresi WebP kualitas 90).
- Verifikasi: PNG dan WebP memiliki kanal alpha; area luar subjek transparan. Dipasang hanya pada hero melalui `profile.heroPortrait`; foto profil bagian lain tetap memakai aset asli.

## Prompt final

Use case: background-extraction. Edit target: the provided real portrait photograph of Alvin. Primary request: remove ONLY the pale blue/white wall background and replace it with genuine transparent alpha for a portfolio website hero cutout. Preserve the EXACT original person, facial identity, facial features, expression, glasses, hair, skin texture and color, dark navy suit, white shirt, blue lanyard, hands and crossed-arm pose. Preserve the full visible person down to the bottom of the original photograph and the same camera angle. Do not beautify, restyle, redraw, relight, add objects, change clothing, change body shape, or add shadows/backgrounds. Keep crisp natural hair and suit edges with no halo; preserve opaque foreground. Output one high-resolution PNG with a genuinely transparent background, not a checkerboard image. Tighten only empty transparent margins if helpful; do not crop away the person.

