import { FileSpreadsheet } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UploadedFileSummary } from "@/types/chat";

interface FileSelectorProps {
  files: UploadedFileSummary[];
  selectedFileId: string;
  onChange: (fileId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function FileSelector({
  files,
  selectedFileId,
  onChange,
  disabled,
  placeholder = "Select a file",
}: FileSelectorProps) {
  return (
    <Select value={selectedFileId} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full sm:w-72">
        <FileSpreadsheet className="size-4 text-foreground" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {files.map((file) => (
          <SelectItem key={file.id} value={file.id}>
            {file.originalName}
            {file.rowCount != null && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({file.rowCount.toLocaleString()} rows)
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
