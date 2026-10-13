/** A photo cut to one of the design's blob shapes (the shape picture's outline is used as a mask). */
export default function Shaped({ photo, mask, className = '', style, position = 'center' }) {
  return <div className={`lp-shaped ${className}`} style={{ backgroundImage: `url(${photo})`, WebkitMaskImage: `url(${mask})`, maskImage: `url(${mask})`, backgroundPosition: position, ...style }} role="presentation" />;
}
