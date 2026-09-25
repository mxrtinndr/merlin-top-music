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

/** Recorte cuadrado en píxeles de la imagen original. */
export type SquareCrop = { x: number; y: number; size: number };

/** Abre la imagen elegida (respetando la orientación EXIF) para poder encuadrarla. */
export async function loadPhoto(file: File): Promise<ImageBitmap> {
  if (!file.type.startsWith("image/")) throw new Error("Ese archivo no es una imagen.");
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error("No hemos podido leer esa imagen. Prueba con una JPG o PNG.");
  }
}

/**
 * Recorta el cuadrado elegido y lo reduce a 320 px, en WebP (o JPEG si el
 * navegador no sabe codificar WebP).
 */
export async function cropAvatar(bitmap: ImageBitmap, crop: SquareCrop): Promise<ProcessedPhoto> {
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tu navegador no permite procesar imágenes.");
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, crop.x, crop.y, crop.size, crop.size, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

  let blob = await toBlob(canvas, "image/webp");
  if (blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg");

  return { blob, previewUrl: canvas.toDataURL(blob.type, QUALITY) };
}
