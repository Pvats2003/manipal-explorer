export interface Photo {
  id: string;
  dataUrl: string;
  caption: string;
  location: string;
  date: string; // ISO
}

const KEY = "mhs_photos_v1";

export function getPhotos(): Photo[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function savePhoto(p: Photo) {
  const all = getPhotos();
  all.unshift(p);
  localStorage.setItem(KEY, JSON.stringify(all));
}
export function deletePhoto(id: string) {
  const all = getPhotos().filter(p => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function fileToDataUrl(file: File, maxDim = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}