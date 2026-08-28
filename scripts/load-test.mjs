const baseUrl = process.env.BIOSENSE_BASE_URL || "http://localhost:3000";

async function jsonFetch(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${body.error || JSON.stringify(body)}`);
  }
  return { response, body };
}

async function runStudent(index) {
  const code = `BIO-${String(index + 1).padStart(3, "0")}`;
  const joined = await jsonFetch("/api/student/join", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ joinCode: "BIO7", participantCode: code }),
  });
  const cookie = joined.response.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error(`No student cookie returned for ${code}`);
  const headers = { "content-type": "application/json", cookie };
  const submit = (payload) =>
    jsonFetch("/api/student/submit", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

  await submit({
    action: "initial",
    responseText:
      "The rabbit gets carbon matter and stored chemical energy from grass. During cellular respiration, carbon can leave in carbon dioxide while energy is made usable and eventually leaves the ecosystem as heat.",
    confidenceChoice: "somewhat_sure",
    clientTimestamp: new Date().toISOString(),
  });
  await submit({
    action: "revision",
    responseText:
      "Carbon matter from food can become part of the rabbit and later return to the air as carbon dioxide. Cellular respiration releases usable energy in cells; matter can cycle, while energy flows and eventually leaves as heat.",
    confidenceChoice: "very_sure",
    clientTimestamp: new Date().toISOString(),
  });
  await submit({
    action: "transfer",
    responseText:
      "In the terrarium, carbon matter moves among the plant, insect, decomposers, air, and soil. Light energy enters, stored energy moves through food, cellular respiration releases usable energy, and some energy leaves as heat rather than cycling.",
    confidenceChoice: "somewhat_sure",
    clientTimestamp: new Date().toISOString(),
  });
  await submit({
    action: "survey",
    clarity: 5,
    pressure: 1,
    helpfulness: 4,
    openComment: "Synthetic load-test response",
  });
  return code;
}

const startedAt = Date.now();
await jsonFetch("/api/demo/reset", { method: "POST" });
const results = await Promise.allSettled(Array.from({ length: 30 }, (_, index) => runStudent(index)));
const failures = results.filter((result) => result.status === "rejected");
if (failures.length) {
  failures.forEach((failure) => console.error(failure.reason));
  process.exitCode = 1;
} else {
  const teacherLogin = await jsonFetch("/api/teacher/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: process.env.TEACHER_PASSWORD || "demo-teacher" }),
  });
  const teacherCookie = teacherLogin.response.headers.get("set-cookie")?.split(";")[0];
  if (!teacherCookie) throw new Error("No teacher cookie returned.");
  const dashboard = await jsonFetch("/api/teacher/sessions/demo-session/dashboard", {
    headers: { cookie: teacherCookie },
  });
  if (
    dashboard.body.snapshot.counts.complete !== 30 ||
    dashboard.body.snapshot.conditionCounts.adaptive !== 15 ||
    dashboard.body.snapshot.conditionCounts.reflection !== 15
  ) {
    throw new Error(`Unexpected dashboard totals: ${JSON.stringify(dashboard.body.snapshot)}`);
  }
  await jsonFetch("/api/teacher/sessions/demo-session/action", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: teacherCookie },
    body: JSON.stringify({
      actionType: "review_responses",
      note: "Synthetic load-test teacher action",
    }),
  });
  const exportResponse = await fetch(
    `${baseUrl}/api/teacher/sessions/demo-session/export?format=csv`,
    { headers: { cookie: teacherCookie } },
  );
  const exportText = await exportResponse.text();
  if (!exportResponse.ok || exportText.trim().split("\n").length !== 31) {
    throw new Error(`Research export validation failed with ${exportResponse.status}.`);
  }
  const health = await jsonFetch("/api/health");
  console.log(
    JSON.stringify(
      {
        ok: true,
        studentsCompleted: results.length,
        conditionSplit: "15 adaptive / 15 reflection",
        researchExportRows: 30,
        teacherActionRecorded: true,
        elapsedMs: Date.now() - startedAt,
        service: health.body,
      },
      null,
      2,
    ),
  );
}
