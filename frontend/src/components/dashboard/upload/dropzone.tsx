"use client";

import * as React from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  MAX_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_MB,
  isAllowedUploadFile,
} from "@/constants/upload";

interface DropzoneProps {
  onFileSelected: (file: File) => void;
}

export function Dropzone({ onFileSelected }: DropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    if (!isAllowedUploadFile(file.name)) {
      toast.error("Unsupported file type", {
        description: `Please upload ${ALLOWED_UPLOAD_EXTENSIONS.join(", ")}`,
      });
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      toast.error("File too large", {
        description: `Maximum upload size is ${MAX_UPLOAD_SIZE_MB}MB`,
      });
      return;
    }

    onFileSelected(file);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors",
        isDragging
          ? "border-foreground bg-foreground/[0.03]"
          : "border-border hover:border-foreground/20 hover:bg-secondary/40"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_UPLOAD_EXTENSIONS.join(",")}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex size-16 items-center justify-center rounded-full bg-foreground/5 text-foreground">
        <UploadCloud className="size-7" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-medium">
          <span className="text-foreground">Click to upload</span> or drag and drop
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {ALLOWED_UPLOAD_EXTENSIONS.join(", ")} — up to {MAX_UPLOAD_SIZE_MB}MB
        </p>
      </div>
    </div>
  );
}
