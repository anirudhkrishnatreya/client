/**
 * Shrinks a photo on the student's device before it is sent: at most 1280 pixels on the long side, as a JPEG. A phone photo of
 * a sketch goes from several MB to about 150 KB, which is clear enough to judge and cheap to store and send.
 * @returns a data URL, or throws if the file is not an image the browser can read
 */
export async function shrinkImage(file, { max = 1280, quality = 0.75 } = {}) {
  if (!file || !/^image\//.test(file.type)) throw new Error('not-an-image');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => reject(new Error('unreadable')); i.src = url; });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale); canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);          // transparent PNGs get a white page, not black
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally { URL.revokeObjectURL(url); }
}
