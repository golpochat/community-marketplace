import {
  STOREFRONT_BANNER_ASPECT_RATIO,
  STOREFRONT_BANNER_OUTPUT_HEIGHT,
  STOREFRONT_BANNER_OUTPUT_WIDTH,
} from '@/components/storefront/storefront-layout';

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read the image file.'));
    };
    img.src = url;
  });
}

/** Center-crop to 4:1 and resize — always edge-to-edge on the hero, no letterboxing. */
export async function prepareStoreBannerImage(file: File): Promise<File> {
  const img = await loadImageFromFile(file);
  const targetAspect = STOREFRONT_BANNER_ASPECT_RATIO;
  const sourceAspect = img.width / img.height;

  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (sourceAspect > targetAspect) {
    sw = img.height * targetAspect;
    sx = (img.width - sw) / 2;
  } else if (sourceAspect < targetAspect) {
    sh = img.width / targetAspect;
    sy = (img.height - sh) / 2;
  }

  const canvas = document.createElement('canvas');
  canvas.width = STOREFRONT_BANNER_OUTPUT_WIDTH;
  canvas.height = STOREFRONT_BANNER_OUTPUT_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not process the image in this browser.');
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Failed to prepare banner image.'));
      },
      'image/jpeg',
      0.9,
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'store-banner';
  return new File([blob], `${baseName}-hero.jpg`, { type: 'image/jpeg' });
}
