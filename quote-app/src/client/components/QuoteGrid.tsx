import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { Fragment, useEffect, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { calculateLineAmounts, formatDiscountPercent, formatVndInput, formatVndNumber, parseVndInput } from "../../shared/calculations";
import { numericInputError, parseDiscountPercentInput } from "../numeric-input";

export type EditorRow = {
  clientId: string;
  productName: string;
  specification: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  note: string;
};

const editableColumns = ["productName", "specification", "quantity", "unit", "unitPrice", "discountPercent", "note"] as const;
type EditableColumn = typeof editableColumns[number];
const pasteColumns = ["productName", "specification", "quantity", "unit", "unitPrice", "discountPercent", "discountedUnitPrice", "lineTotal", "note"] as const;
type PasteColumn = typeof pasteColumns[number];
const legacyPasteColumns = ["productName", "specification", "quantity", "unit", "unitPrice", "note"] as const;
const columnLabels: Record<EditableColumn, string> = {
  productName: "Tên sản phẩm",
  specification: "Quy cách",
  quantity: "Số lượng",
  unit: "Đơn vị",
  unitPrice: "Đơn giá",
  discountPercent: "Chiết khấu (%)",
  note: "Ghi chú",
};

export function emptyRow(): EditorRow {
  return { clientId: crypto.randomUUID(), productName: "", specification: "", quantity: 0, unit: "", unitPrice: 0, discountPercent: 0, note: "" };
}

export function parseQuantityInput(value: string): number {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".").replace(/[^0-9.]/g, "");
  const separator = normalized.indexOf(".");
  const whole = (separator === -1 ? normalized : normalized.slice(0, separator)).replace(/^0+(?=\d)/, "") || "0";
  const fraction = separator === -1 ? "" : normalized.slice(separator + 1).replace(/\./g, "").slice(0, 3);
  const parsed = Number(fraction ? `${whole}.${fraction}` : whole);
  return Number.isFinite(parsed) ? Math.min(parsed, 1_000_000_000) : 0;
}

function clipboardMatrix(text: string): string[][] {
  return text.replace(/\r/g, "").split("\n").filter((line, index, all) => line || index < all.length - 1).map((line) => line.split("\t"));
}

function usesLegacyPasteColumns(matrix: string[][], startColumn: number): boolean {
  const legacyNoteOffset = startColumn === 0 ? 5 : startColumn === 4 ? 1 : -1;
  return legacyNoteOffset >= 0 && matrix.some((values) => {
    const legacyNote = values[legacyNoteOffset]?.trim();
    return Boolean(legacyNote) && Number.isNaN(Number(legacyNote.replace(",", ".")));
  });
}

function pasteColumn(matrix: string[][], startColumn: number, columnOffset: number): PasteColumn | EditableColumn | undefined {
  return usesLegacyPasteColumns(matrix, startColumn)
    ? legacyPasteColumns[startColumn + columnOffset]
    : pasteColumns[startColumn + columnOffset];
}

export function pasteGridText(rows: EditorRow[], text: string, startRow: number, startColumn: number): EditorRow[] {
  const matrix = clipboardMatrix(text);
  const next = rows.map((row) => ({ ...row }));
  while (next.length < startRow + matrix.length + 1) next.push(emptyRow());
  matrix.forEach((values, rowOffset) => {
    values.forEach((value, columnOffset) => {
      const column = pasteColumn(matrix, startColumn, columnOffset);
      const target = next[startRow + rowOffset];
      if (!column || !target) return;
      if (column === "discountedUnitPrice" || column === "lineTotal") return;
      if (column === "quantity") target.quantity = parseQuantityInput(value);
      else if (column === "unitPrice") target.unitPrice = parseVndInput(value);
      else if (column === "discountPercent") target.discountPercent = parseDiscountPercentInput(value);
      else target[column] = value.trim();
    });
  });
  return next;
}

function displayDiscountedUnitPrice(row: EditorRow): string {
  try { return formatVndNumber(calculateLineAmounts(row.quantity, row.unitPrice, row.discountPercent ?? 0).discountedUnitPrice); }
  catch { return "Quá lớn"; }
}

function displayLineTotal(row: EditorRow): string {
  try { return formatVndNumber(calculateLineAmounts(row.quantity, row.unitPrice, row.discountPercent ?? 0).lineTotal); }
  catch { return "Quá lớn"; }
}

function hasContent(row: EditorRow): boolean {
  return Boolean(row.productName || row.specification || row.quantity || row.unit || row.unitPrice || row.discountPercent || row.note);
}

export function QuoteGrid({ rows, onChange, readOnly = false }: { rows: EditorRow[]; onChange: (rows: EditorRow[]) => void; readOnly?: boolean }) {
  const [inputError, setInputError] = useState("");
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({});
  const [discountDrafts, setDiscountDrafts] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!readOnly && rows.length && hasContent(rows[rows.length - 1])) onChange([...rows, emptyRow()]);
  }, [rows, onChange, readOnly]);

  const update = (rowIndex: number, column: EditableColumn, value: string) => {
    const numericKind = column === "quantity" ? "quantity" : column === "unitPrice" ? "money" : column === "discountPercent" ? "percent" : null;
    const invalid = numericKind ? numericInputError(numericKind, value) : "";
    if (invalid) {
      setInputError(invalid);
      return;
    }
    setInputError("");
    if (column === "quantity" && rows[rowIndex]) {
      const rowId = rows[rowIndex].clientId;
      setQuantityDrafts((drafts) => ({ ...drafts, [rowId]: value }));
    }
    if (column === "discountPercent" && rows[rowIndex]) {
      const rowId = rows[rowIndex].clientId;
      setDiscountDrafts((drafts) => ({ ...drafts, [rowId]: value }));
    }
    const next = rows.map((row, index) => index === rowIndex ? {
      ...row,
      [column]: column === "quantity" ? parseQuantityInput(value) : column === "unitPrice" ? parseVndInput(value) : column === "discountPercent" ? parseDiscountPercentInput(value) : value,
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
    const matrix = clipboardMatrix(text);
    let invalid = "";
    matrix.forEach((values) => {
      values.forEach((value, offset) => {
        const column = pasteColumn(matrix, startColumn, offset);
        const numericKind = column === "quantity" ? "quantity" : column === "unitPrice" ? "money" : column === "discountPercent" ? "percent" : null;
        if (!invalid && numericKind) invalid = numericInputError(numericKind, value);
      });
    });
    if (invalid) { setInputError(invalid); return; }
    setInputError("");
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
      {inputError && <div className="form-error" role="alert">{inputError}</div>}
      <table className="quote-grid">
        <thead><tr><th>STT</th><th>Tên sản phẩm</th><th>Quy cách</th><th>Số lượng</th><th>Đơn vị</th><th>Đơn giá</th><th>CK (%)</th><th>Đơn giá sau CK</th><th>Thành tiền sau CK</th><th>Ghi chú</th>{!readOnly && <th aria-label="Thao tác" />}</tr></thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.clientId}>
              <td className="row-number">{rowIndex + 1}</td>
              {editableColumns.map((column, columnIndex) => {
                const pasteColumnIndex = pasteColumns.indexOf(column);
                const value = column === "unitPrice"
                  ? (row.unitPrice ? formatVndInput(row.unitPrice) : "")
                  : column === "quantity"
                    ? (quantityDrafts[row.clientId] !== undefined && parseQuantityInput(quantityDrafts[row.clientId]) === row.quantity ? quantityDrafts[row.clientId] : (row.quantity || ""))
                    : column === "discountPercent"
                      ? (discountDrafts[row.clientId] !== undefined && parseDiscountPercentInput(discountDrafts[row.clientId]) === (row.discountPercent ?? 0)
                        ? discountDrafts[row.clientId]
                        : readOnly ? formatDiscountPercent(row.discountPercent ?? 0) : row.discountPercent ? formatDiscountPercent(row.discountPercent) : "")
                      : row[column];
                return (
                  <Fragment key={column}>
                    <td className={column === "quantity" || column === "unitPrice" || column === "discountPercent" ? "number-cell" : ""}>
                      <input
                        data-grid-row={rowIndex}
                        data-grid-col={columnIndex}
                        data-grid-paste-col={pasteColumnIndex}
                        aria-label={`${columnLabels[column]} dòng ${rowIndex + 1}`}
                        value={value}
                        inputMode={column === "quantity" || column === "discountPercent" ? "decimal" : column === "unitPrice" ? "numeric" : "text"}
                        readOnly={readOnly}
                        onChange={(event) => update(rowIndex, column, event.target.value)}
                        onBlur={column === "quantity" ? () => setQuantityDrafts((drafts) => {
                          const next = { ...drafts };
                          delete next[row.clientId];
                          return next;
                        }) : column === "discountPercent" ? () => setDiscountDrafts((drafts) => {
                          const next = { ...drafts };
                          delete next[row.clientId];
                          return next;
                        }) : undefined}
                        onKeyDown={(event) => keyboard(event, rowIndex, columnIndex)}
                        onPaste={(event) => paste(event, rowIndex, pasteColumnIndex)}
                      />
                    </td>
                    {column === "discountPercent" && <>
                      <td className="number-cell">{displayDiscountedUnitPrice(row)}</td>
                      <td className="number-cell total-cell">{displayLineTotal(row)}</td>
                    </>}
                  </Fragment>
                );
              })}
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
