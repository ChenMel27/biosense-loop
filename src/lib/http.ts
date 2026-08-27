import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function validationMessage(error: ZodError) {
  return error.issues[0]?.message ?? "Please check the information and try again.";
}

export function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function rowsToCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
}

