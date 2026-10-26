"use client";

import { createClient } from "@/lib/supabase/client";

const maxFileSize = 5 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function uploadAppFile({
  bucket,
  file,
  folder,
  allowedTypes
}: {
  bucket: string;
  file: File;
  folder: string;
  allowedTypes: string[];
}) {
  if (file.size > maxFileSize) {
    throw new Error("Ukuran file maksimal 5 MB.");
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Tipe file tidak didukung.");
  }

  const supabase = createClient();
  const safeName = sanitizeFileName(file.name);
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export const proofFileTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
];

export const imageFileTypes = ["image/jpeg", "image/png", "image/webp"];
