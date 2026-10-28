export const cellValue = (cell) => (typeof cell === 'object' && cell !== null ? cell.value : cell);

export const cellCode = (cell, column) => (typeof cell === 'object' && cell !== null ? Boolean(cell.code) : Boolean(column.code));
