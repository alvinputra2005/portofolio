import { mkdir, writeFile } from "node:fs/promises";

// Original brand SVG variants from Devicon, plus vendor-hosted assets.
const names = ["laravel", "react", "tailwindcss", "bootstrap", "nextjs", "redis", "nodejs", "express", "flask", "pytorch", "scikitlearn", "python", "numpy", "pandas", "jupyter", "tensorflow", "matplotlib", "vscode", "googlecolab", "figma", "canva"];
const assets = names.map(name => ({ name, url: `https://raw.githubusercontent.com/devicons/devicon/master/icons/${name}/${name}-original.svg` }));
assets.push(
  { name: "aistudio", extension: "png", url: "https://www.gstatic.com/images/branding/productlogos/ai_studio/v1/web-96dp/logo_ai_studio_color_1x_web_96dp.png" },
  { name: "drawio", url: "https://raw.githubusercontent.com/jgraph/drawio/dev/src/main/webapp/images/drawlogo.svg" },
);
await mkdir("public/images/tech", { recursive: true });
for (let index = 0; index < assets.length; index += 6) {
  await Promise.all(assets.slice(index, index + 6).map(async asset => {
    const response = await fetch(asset.url);
    if (!response.ok) throw new Error(`${asset.name}: HTTP ${response.status}`);
    const data = Buffer.from(await response.arrayBuffer());
    if (!asset.extension && (!data.toString().includes("<svg") || /<script\b|\bonload\s*=/i.test(data.toString()))) throw new Error(`Invalid SVG: ${asset.name}`);
    await writeFile(`public/images/tech/${asset.name}.${asset.extension ?? "svg"}`, data);
    console.log(`Saved ${asset.name}`);
  }));
}
await writeFile("public/images/tech/sources.json", JSON.stringify({ repository: "https://github.com/devicons/devicon", assets }, null, 2) + "\n");
const license = await fetch("https://raw.githubusercontent.com/devicons/devicon/master/LICENSE");
if (!license.ok) throw new Error("Devicon license download failed");
await writeFile("public/images/tech/DEVICON-LICENSE.txt", await license.text());
