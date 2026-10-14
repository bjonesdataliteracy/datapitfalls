'use client';

export function PrintButton() {
  return (
    <button className="btn btn-primary no-print" type="button" onClick={() => window.print()}>
      Print or save as PDF
    </button>
  );
}
