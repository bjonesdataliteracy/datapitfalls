/**
 * The vortex from the Lab's Pitfalls banner with its callout tags drawn on top as
 * live text, so their size is a style change rather than an image edit. One SVG
 * in the image's own 1200x900 space, sliced to cover the hero like object-fit.
 */
export function HeroVortex() {
  return (
    <svg
      className="hero-vortex"
      viewBox="0 0 1200 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <image href="/vortex.jpg" width="1200" height="900" />

      {/* Leader lines from the marked points on the vortex to their tags. */}
      <line className="vortex-leader" x1="678" y1="316" x2="735" y2="262" stroke="#cf6e66" />
      <line className="vortex-leader" x1="598" y1="626" x2="665" y2="679" stroke="#c9a85a" />

      <g className="vortex-tag vortex-tag-status">
        <rect x="427" y="118" width="235" height="37" rx="18.5" />
        <text x="544.5" y="136.5">NEEDS ATTENTION</text>
      </g>
      <g className="vortex-tag vortex-tag-red">
        <rect x="721" y="218" width="178" height="44" rx="6" />
        <text x="810" y="240">Truncated axis</text>
      </g>
      <g className="vortex-tag vortex-tag-gold">
        <rect x="653" y="679" width="264" height="44" rx="6" />
        <text x="785" y="701">Correlation ≠ causation</text>
      </g>
    </svg>
  );
}
