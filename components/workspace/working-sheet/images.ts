import { supabase } from "@/lib/supabase";

export type PreparedImage = { blob: Blob; dataUrl: string; ratio: number };

// Shrink uploads so a page with a dozen images stays light.
export async function prepareImage(file: File, max = 1000): Promise<PreparedImage | null> {
  if (!file.type.startsWith("image/")) return null;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", 0.8));
    if (!blob) return null;
    return { blob, dataUrl: c.toDataURL("image/jpeg", 0.78), ratio: img.width / img.height };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Signed in: store the picture in your own folder of the board-images bucket.
// Signed out (or if the upload fails): keep it inline so the sheet still works.
export async function storeImage(img: { blob: Blob; dataUrl: string }): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return img.dataUrl;
    const path = `${uid}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage
      .from("board-images")
      .upload(path, img.blob, { contentType: "image/jpeg", cacheControl: "31536000" });
    if (error) return img.dataUrl;
    return supabase.storage.from("board-images").getPublicUrl(path).data.publicUrl;
  } catch {
    return img.dataUrl;
  }
}
