# Creative tech stack logo sources

Brand artwork is downloaded and hosted locally; no brand logos are hand-drawn or generated.

- Original SVG variants: [Devicon upstream](https://github.com/devicons/devicon), which collects brand logos for development and design tools. Each brand retains ownership of its marks. The upstream MIT license is stored beside the assets.
- Google AI Studio: the [official Google AI Studio site](https://aistudio.google.com) supplies the Google-hosted product logo used here.
- draw.io: the [official jgraph/drawio repository](https://github.com/jgraph/drawio/blob/dev/src/main/webapp/images/drawlogo.svg).
- Every exact download URL is recorded in `public/images/tech/sources.json`. Run `node scripts/download-tech-logos.mjs` to refresh assets.

The strip currently shows 16 technologies and tools in two continuous lanes. Each cycle uses four seconds per item, giving a 1.25× speed increase over the previous five seconds per item. Short lanes repeat to fill wide viewports without gaps. Hovering or focusing pauses motion; reduced-motion preferences replace animation with manually scrollable lists. The heading is centered and there is no pause button or eyebrow text.
