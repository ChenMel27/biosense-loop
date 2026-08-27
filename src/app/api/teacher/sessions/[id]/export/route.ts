import { getTeacherIdentity } from "@/lib/auth/guards";
import { apiError, rowsToCsv } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await getTeacherIdentity())) return apiError("Teacher sign-in required.", 401);
  const { id } = await context.params;
  const session = await getStore().getSession(id);
  if (!session) return apiError("Session not found.", 404);
  const rows = await getStore().exportSession(id);
  const format = new URL(request.url).searchParams.get("format") ?? "csv";
  if (format === "json") {
    return new Response(JSON.stringify({ session, rows }, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="biosense-${session.joinCode}.json"`,
      },
    });
  }
  return new Response(rowsToCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="biosense-${session.joinCode}.csv"`,
    },
  });
}
