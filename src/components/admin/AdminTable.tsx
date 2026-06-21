import type { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

interface AdminTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  emptyMessage?: string
}

export function AdminTable<T extends { id: string }>({
  columns,
  rows,
  emptyMessage = 'No hay registros',
}: AdminTableProps<T>) {
  return (
    <div className="overflow-x-auto border border-surface-variant">
      <table className="w-full text-left">
        <thead className="bg-surface-container-low border-b border-surface-variant">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center font-body-md text-body-md text-on-surface-variant"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
          {rows.map((row, idx) => (
            <tr
              key={row.id}
              className={idx % 2 === 0 ? 'bg-surface' : 'bg-surface-container-lowest'}
            >
              {columns.map((col) => (
                <td
                  key={`${row.id}-${col.key}`}
                  className={`px-4 py-3 font-body-md text-body-md text-on-surface ${col.className ?? ''}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
