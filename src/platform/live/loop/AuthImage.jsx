import { useEffect, useState } from 'react';
import api from '../../../api';

/** An image that needs the signed-in user's token (a photo of their work): fetched with it, then shown. */
export default function AuthImage({ path, alt, className }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let url = null, live = true;
    api.get(path, { responseType: 'blob' }).then(r => { if (!live) return; url = URL.createObjectURL(r.data); setSrc(url); }).catch(() => live && setFailed(true));
    return () => { live = false; if (url) URL.revokeObjectURL(url); };
  }, [path]);
  if (failed) return <span className="pf-small pf-muted">Photo not available</span>;
  if (!src) return <span className={`pf-skel ${className || ''}`} style={{ display: 'inline-block', width: 120, height: 90, borderRadius: 8 }} aria-hidden="true" />;
  return <a href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt={alt} className={className || 'pf-workphoto'} /></a>;
}
