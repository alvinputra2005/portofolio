# Creative tech stack logo sources

Brand artwork is downloaded and hosted locally; no brand logos are hand-drawn or generated.

- Original SVG variants: [Devicon upstream](https://github.com/devicons/devicon), which collects brand logos for development and design tools. Each brand retains ownership of its marks. The upstream MIT license is stored beside the assets.
- Google AI Studio: the [official Google AI Studio site](https://aistudio.google.com) supplies the Google-hosted product logo used here.
- draw.io: the [official jgraph/drawio repository](https://github.com/jgraph/drawio/blob/dev/src/main/webapp/images/drawlogo.svg).
- Every exact download URL is recorded in `public/images/tech/sources.json`. Run `node scripts/download-tech-logos.mjs` to refresh assets.

The strip shows all 16 technologies and tools in one continuous row, inside the Tech Stack section between its centered heading and the Front End, Back End, and AI/ML cards. It has no separate heading or nested page container. Each cycle uses four seconds per item. The sequence repeats when needed to fill wide viewports without gaps. Hovering or focusing pauses motion; reduced-motion preferences replace animation with one manually scrollable row. Items never wrap to a second row.
