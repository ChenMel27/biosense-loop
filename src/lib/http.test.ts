import { describe, expect, it } from "vitest";

import { csvEscape, rowsToCsv } from "@/lib/http";

describe("CSV export safety", () => {
  it.each(["=2+2", "+cmd", "-1+2", "@SUM(A1:A2)", "  =HYPERLINK(\"x\")"])(
    "exports formula-like text as plain text: %s",
    (value) => {
      expect(csvEscape(value)).toContain("'");
    },
  );

  it("does not alter real numeric values", () => {
    expect(csvEscape(-3)).toBe("-3");
  });

  it("neutralizes untrusted response text in a complete CSV", () => {
    const csv = rowsToCsv([{ initial_text: "=WEBSERVICE(\"https://example.com\")" }]);
    expect(csv).toBe('initial_text\n"\'=WEBSERVICE(""https://example.com"")"');
  });
});
