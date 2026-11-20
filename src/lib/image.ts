/**
 * Downscale an uploaded image into a WebP/JPEG blob sized for a backdrop —
 * under-the-veil photos never need full resolution, and IndexedDB space is cheap
 * only when we keep it so.
 */
export async function imageFileToBlob(file: File, maxSide = 1760): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('not an image file')
  }
  let bmp: ImageBitmap
  try {
    bmp = await createImageBitmap(file)
  } catch {
    // very old Safari without createImageBitmap — keep original bytes instead of failing
    return file
  }

  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
  const width = Math.max(1, Math.round(bmp.width * scale))
  const height = Math.max(1, Math.round(bmp.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bmp, 0, 0, width, height)
  bmp.close()

  return await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ?? file),
      'image/webp',
      0.78,
    )
  })
}
