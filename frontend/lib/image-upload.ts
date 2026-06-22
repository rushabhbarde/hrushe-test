export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not process selected image."));
    image.src = source;
  });
}

export async function compressSingleImage(file: File, maxDimension = 520) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not process selected image.");
  }

  context.drawImage(image, 0, 0, width, height);

  const compressed = canvas.toDataURL("image/jpeg", 0.72);

  if (compressed.length > 450_000) {
    return canvas.toDataURL("image/jpeg", 0.6);
  }

  return compressed;
}

export async function compressImageFile(file: File, maxDimension = 1600) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not process selected image.");
  }

  context.drawImage(image, 0, 0, width, height);

  let blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.82)
  );

  if (!blob) {
    throw new Error("Could not compress selected image.");
  }

  const supportedOutputTypes: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  let outputType = blob.type.toLowerCase();

  // Safari may fall back to PNG when a requested canvas encoder is not
  // available. Keep the MIME type and extension aligned with the bytes it
  // actually produced instead of force-labelling the result as WebP.
  if (!supportedOutputTypes[outputType]) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    outputType = blob?.type.toLowerCase() || "";
  }

  if (!blob || !supportedOutputTypes[outputType]) {
    throw new Error("This browser could not create a supported image format.");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "hrushe-product";
  return new File([blob], `${baseName}.${supportedOutputTypes[outputType]}`, {
    type: outputType,
    lastModified: file.lastModified,
  });
}
