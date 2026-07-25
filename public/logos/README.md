# Brand logos

Drop a logo file here named by the brand id and the museum picks it up
automatically (no code change). Until then, an elegant serif wordmark is shown.

Expected filenames (SVG preferred — crisp at any size, tiny):

- `ferrari.svg`
- `porsche.svg`
- `lamborghini.svg`
- `bugatti.svg`
- `ford.svg`
- `dodge.svg`
- `toyota.svg`

Tips:
- **SVG** is best (transparent background, scales perfectly). White or
  monochrome versions read best on the dark museum background.
- The component (`src/components/museum/BrandLogo.tsx`) requests `/logos/<id>.svg`.
- Brand logos are trademarks — fine for this private, non-distributed app; do
  not ship them in a public build without checking usage rights.
