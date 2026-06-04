/**
 * Downscale + JPEG-compress an image file to a data URL in the browser before
 * upload (SEC M1 — keeps payloads small; the server caps at ~1.6 MB). Caps the
 * longest edge at 1400px and steps quality down until it fits.
 */
export async function fileToCompressedDataUrl(file: File): Promise<string> {
  const imageUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = imageUrl;
    });

    const maxWidth = 1400;
    const scale = Math.min(1, maxWidth / img.width);
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas_unsupported');
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.84;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrl.length > 1_800_000 && quality > 0.5) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}
