import { toPng } from 'html-to-image';

export interface ShareResult {
  shared: boolean;
  downloaded: boolean;
  error?: string;
}

/**
 * Convierte un elemento HTML a Blob PNG de alta resolución (pixelRatio 2)
 */
export async function generatePngBlob(element: HTMLElement): Promise<Blob> {
  const dataUrl = await toPng(element, {
    quality: 0.98,
    pixelRatio: 2,
    cacheBust: true,
  });

  const res = await fetch(dataUrl);
  return await res.blob();
}

/**
 * Descarga directamente un blob como archivo PNG
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Comparte la imagen usando Web Share API nativa (WhatsApp, Telegram, etc.)
 * Si no está soportado (ej. navegador de escritorio), ejecuta el Plan B: descarga el PNG.
 */
export async function shareOrDownloadImage(
  element: HTMLElement,
  options: {
    filename: string;
    title: string;
    text: string;
  }
): Promise<ShareResult> {
  try {
    const blob = await generatePngBlob(element);
    const file = new File([blob], options.filename, { type: 'image/png' });

    // Verificar si el navegador soporta compartir archivos nativamente (Chrome Android, Safari iOS)
    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: options.title,
        text: options.text,
      });
      return { shared: true, downloaded: false };
    }

    // Plan B: Descargar el archivo PNG directamente
    downloadBlob(blob, options.filename);
    return { shared: false, downloaded: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      // El usuario canceló el menú de compartir de su celular
      return { shared: false, downloaded: false };
    }
    console.error('Error sharing image:', err);
    return {
      shared: false,
      downloaded: false,
      error: err instanceof Error ? err.message : 'Error desconocido al compartir',
    };
  }
}

