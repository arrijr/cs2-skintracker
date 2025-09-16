import {
  Table, TableHeader, TableRow, TableHead,
  TableBody, TableCell,
} from "@/components/ui/table";

type Col<T> = { key: keyof T; header: string; render?: (row: T) => React.ReactNode };
type Props<T> = { columns: Col<T>[]; rows: T[] };

export function TableShell<T extends Record<string, any>>({ columns, rows }: Props<T>) {
  // {/* Generic Table Shell */}
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((c) => <TableHead key={String(c.key)}>{c.header}</TableHead>)}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={i}>
            {columns.map((c) => (
              <TableCell key={String(c.key)}>
                {c.render ? c.render(r) : String(r[c.key] ?? "")}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
