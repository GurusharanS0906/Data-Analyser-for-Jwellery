import { Calendar, Coins, Hash, Type } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { ColumnPreview } from "@/types/upload";

const TYPE_ICON = {
  number: Hash,
  text: Type,
  date: Calendar,
  currency: Coins,
} as const;

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

interface PreviewTableProps {
  columns: ColumnPreview[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export function PreviewTable({ columns, rows, rowCount }: PreviewTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <ScrollArea className="h-[380px] w-full">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-secondary/95 backdrop-blur">
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => {
                const Icon = TYPE_ICON[col.dtype];
                return (
                  <TableHead key={col.name} className="whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <Icon className="size-3.5 text-foreground" />
                      {col.name}
                    </span>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.name} className="whitespace-nowrap text-sm">
                    {formatCell(row[col.name])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <div className="border-t border-border bg-secondary/40 px-4 py-2 text-xs text-muted-foreground">
        Showing {rows.length.toLocaleString()} of {rowCount.toLocaleString()} rows
      </div>
    </div>
  );
}
