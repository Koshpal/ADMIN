import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  total?: number;
  pageSize?: number;
  keyExtractor: (row: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No records found.',
  page = 1,
  totalPages = 1,
  onPageChange,
  total,
  pageSize = 20,
  keyExtractor,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-[var(--color-bg-secondary)]" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-card)]">
              <div className="h-4 bg-[var(--color-bg-tertiary)] rounded mx-4 my-5 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ${col.className || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-16 text-center text-[var(--color-text-secondary)] text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="border-b border-[var(--color-border-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors last:border-0"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-5 py-4 text-sm text-[var(--color-text-primary)] ${col.className || ''}`}>
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
          <p className="text-xs text-[var(--color-text-secondary)]">
            {total !== undefined && (
              <>Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}</>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-[var(--color-text-primary)] px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
