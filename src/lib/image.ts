// Procesado de fotos de perfil en el navegador, antes de subirlas.

/** Lado del cuadrado final en px (suficiente para el avatar más grande en pantallas retina). */
const AVATAR_SIZE = 320;
const QUALITY = 0.85;

export type ProcessedPhoto = {
  blob: Blob;
  /** data: URL para la vista previa antes de guardar. */
  previewUrl: string;
};

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen."))), type, QUALITY),
  );
}

/**
 * Recorta la foto en cuadrado y la reduce a 320 px. En fotos verticales el
 * recorte se desplaza hacia arriba, que es donde suele estar la cara.
 */
export async function processAvatar(file: File): Promise<ProcessedPhoto> {
  if (!file.type.startsWith("image/")) throw new Error("Ese archivo no es una imagen.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file); // respeta la orientación EXIF
  } catch {
    throw new Error("No hemos podido leer esa imagen. Prueba con una JPG o PNG.");
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) * 0.3;

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tu navegador no permite procesar imágenes.");
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close();

  // WebP si el navegador sabe codificarlo; si no, JPEG.
  let blob = await toBlob(canvas, "image/webp");
  if (blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg");

  return { blob, previewUrl: canvas.toDataURL(blob.type, QUALITY) };
}
