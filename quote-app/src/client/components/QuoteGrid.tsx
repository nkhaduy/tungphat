import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { useEffect, type ClipboardEvent, type KeyboardEvent } from "react";
import { calculateLineTotal } from "../../shared/calculations";

export type EditorRow = {
  clientId: string;
  productName: string;
  specification: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  note: string;
};

const editableColumns = ["productName", "specification", "quantity", "unit", "unitPrice", "note"] as const;
type EditableColumn = typeof editableColumns[number];
const columnLabels: Record<EditableColumn, string> = {
  productName: "Tên sản phẩm",
  specification: "Quy cách",
  quantity: "Số lượng",
  unit: "Đơn vị",
  unitPrice: "Đơn giá",
  note: "Ghi chú",
};

export function emptyRow(): EditorRow {
  return { clientId: crypto.randomUUID(), productName: "", specification: "", quantity: 0, unit: "", unitPrice: 0, note: "" };
}

function parseVnd(value: string): number {
  const normalized = value.replace(/[^0-9]/g, "");
  return normalized ? Math.min(Number(normalized), Number.MAX_SAFE_INTEGER) : 0;
}

export function parseQuantityInput(value: string): number {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".").replace(/[^0-9.]/g, "");
  const separator = normalized.indexOf(".");
  const whole = (separator === -1 ? normalized : normalized.slice(0, separator)).replace(/^0+(?=\d)/, "") || "0";
  const fraction = separator === -1 ? "" : normalized.slice(separator + 1).replace(/\./g, "").slice(0, 3);
  const parsed = Number(fraction ? `${whole}.${fraction}` : whole);
  return Number.isFinite(parsed) ? Math.min(parsed, 1_000_000_000) : 0;
}

export function pasteGridText(rows: EditorRow[], text: string, startRow: number, startColumn: number): EditorRow[] {
  const matrix = text.replace(/\r/g, "").split("\n").filter((line, index, all) => line || index < all.length - 1).map((line) => line.split("\t"));
  const next = rows.map((row) => ({ ...row }));
  while (next.length < startRow + matrix.length + 1) next.push(emptyRow());
  matrix.forEach((values, rowOffset) => {
    values.forEach((value, columnOffset) => {
      const column = editableColumns[startColumn + columnOffset];
      const target = next[startRow + rowOffset];
      if (!column || !target) return;
      if (column === "quantity") target.quantity = parseQuantityInput(value);
      else if (column === "unitPrice") target.unitPrice = parseVnd(value);
      else target[column] = value.trim();
    });
  });
  return next;
}

function displayLineTotal(row: EditorRow): string {
  try { return calculateLineTotal(row.quantity, row.unitPrice).toLocaleString("vi-VN"); }
  catch { return "Quá lớn"; }
}

function hasContent(row: EditorRow): boolean {
  return Boolean(row.productName || row.specification || row.quantity || row.unit || row.unitPrice || row.note);
}

export function QuoteGrid({ rows, onChange, readOnly = false }: { rows: EditorRow[]; onChange: (rows: EditorRow[]) => void; readOnly?: boolean }) {
  useEffect(() => {
    if (!readOnly && rows.length && hasContent(rows[rows.length - 1])) onChange([...rows, emptyRow()]);
  }, [rows, onChange, readOnly]);

  const update = (rowIndex: number, column: EditableColumn, value: string) => {
    const next = rows.map((row, index) => index === rowIndex ? {
      ...row,
      [column]: column === "quantity" ? parseQuantityInput(value) : column === "unitPrice" ? parseVnd(value) : value,
    } : row);
    onChange(next);
  };

  const focusCell = (rowIndex: number, columnIndex: number) => {
    const cell = document.querySelector<HTMLInputElement>(`[data-grid-row="${rowIndex}"][data-grid-col="${columnIndex}"]`);
    cell?.focus();
    cell?.select();
  };

  const keyboard = (event: KeyboardEvent<HTMLInputElement>, rowIndex: number, columnIndex: number) => {
    if (event.key === "Enter") {
      event.preventDefault();
      focusCell(Math.min(rowIndex + 1, rows.length - 1), columnIndex);
      return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      focusCell(event.key === "ArrowUp" ? Math.max(0, rowIndex - 1) : Math.min(rows.length - 1, rowIndex + 1), columnIndex);
      return;
    }
    if (event.key === "ArrowLeft" && event.currentTarget.selectionStart === 0) {
      event.preventDefault();
      focusCell(rowIndex, Math.max(0, columnIndex - 1));
      return;
    }
    if (event.key === "ArrowRight" && event.currentTarget.selectionStart === event.currentTarget.value.length) {
      event.preventDefault();
      focusCell(rowIndex, Math.min(editableColumns.length - 1, columnIndex + 1));
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const direction = event.shiftKey ? -1 : 1;
      const flat = rowIndex * editableColumns.length + columnIndex + direction;
      const target = Math.max(0, Math.min(rows.length * editableColumns.length - 1, flat));
      focusCell(Math.floor(target / editableColumns.length), target % editableColumns.length);
    }
  };

  const paste = (event: ClipboardEvent<HTMLInputElement>, startRow: number, startColumn: number) => {
    const text = event.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !text.includes("\n")) return;
    event.preventDefault();
    onChange(pasteGridText(rows, text, startRow, startColumn));
  };

  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="quote-grid-wrap">
      <table className="quote-grid">
        <thead><tr><th>STT</th><th>Tên sản phẩm</th><th>Quy cách</th><th>Số lượng</th><th>Đơn vị</th><th>Đơn giá</th><th>Thành tiền</th><th>Ghi chú</th>{!readOnly && <th aria-label="Thao tác" />}</tr></thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.clientId}>
              <td className="row-number">{rowIndex + 1}</td>
              {editableColumns.map((column, columnIndex) => (
                <td key={column} className={column === "quantity" || column === "unitPrice" ? "number-cell" : ""}>
                  <input
                    data-grid-row={rowIndex}
                    data-grid-col={columnIndex}
                    aria-label={`${columnLabels[column]} dòng ${rowIndex + 1}`}
                    value={column === "quantity" || column === "unitPrice" ? (row[column] || "") : row[column]}
                    inputMode={column === "quantity" ? "decimal" : column === "unitPrice" ? "numeric" : "text"}
                    readOnly={readOnly}
                    onChange={(event) => update(rowIndex, column, event.target.value)}
                    onKeyDown={(event) => keyboard(event, rowIndex, columnIndex)}
                    onPaste={(event) => paste(event, rowIndex, columnIndex)}
                  />
                </td>
              )).flatMap((cell, index) => index === 4 ? [cell, (
                <td className="number-cell total-cell" key={`total-${row.clientId}`}>{displayLineTotal(row)}</td>
              )] : [cell])}
              {!readOnly && <td className="row-actions">
                <button type="button" onClick={() => move(rowIndex, -1)} disabled={rowIndex === 0} aria-label="Đưa dòng lên"><ArrowUp size={15} /></button>
                <button type="button" onClick={() => move(rowIndex, 1)} disabled={rowIndex === rows.length - 1} aria-label="Đưa dòng xuống"><ArrowDown size={15} /></button>
                <button type="button" onClick={() => onChange([...rows.slice(0, rowIndex + 1), { ...row, clientId: crypto.randomUUID() }, ...rows.slice(rowIndex + 1)])} aria-label="Sao chép dòng"><Copy size={15} /></button>
                <button type="button" onClick={() => onChange(rows.length > 1 ? rows.filter((_, index) => index !== rowIndex) : [emptyRow()])} aria-label="Xóa dòng"><Trash2 size={15} /></button>
              </td>}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && <button className="add-row" type="button" onClick={() => onChange([...rows, emptyRow()])}><Plus size={16} /> Thêm dòng</button>}
    </div>
  );
}
