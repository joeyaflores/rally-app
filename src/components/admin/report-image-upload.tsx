"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface ReportImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ReportImageUpload({ images, onChange }: ReportImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    const results = await Promise.all(
      Array.from(files).map(async (file) => {
        const form = new FormData();
        form.append("file", file);
        try {
          const res = await fetch("/api/uploads", { method: "POST", body: form });
          if (res.ok) {
            const { url } = await res.json();
            return url as string;
          }
        } catch {
          // skip failed uploads
        }
        return null;
      })
    );

    const newUrls = results.filter((u): u is string => u !== null);
    onChange([...images, ...newUrls]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        event photos
      </label>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {/* Existing images */}
        {images.map((src, i) => (
          <div
            key={src}
            className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
          >
            <Image
              src={src}
              alt=""
              fill
              unoptimized
              className="object-cover"
              sizes="120px"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/50 px-1.5 py-0.5 text-[0.55rem] font-medium text-white/80 backdrop-blur-sm">
                featured
              </span>
            )}
          </div>
        ))}

        {/* Add button */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border/60 text-muted-foreground/40 transition-colors hover:border-navy/30 hover:text-navy/50"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-5 w-5" />
              <span className="text-[0.6rem] font-medium tracking-wide">
                add photos
              </span>
            </>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {images.length > 0 && (
        <p className="mt-1.5 text-[0.6rem] text-muted-foreground/50">
          first image is featured at full width on the report
        </p>
      )}
    </div>
  );
}
