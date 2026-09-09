import { getTeacherIdentity } from "@/lib/auth/guards";
import { apiError, rowsToCsv } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET(request: Request) {
  if (!(await getTeacherIdentity())) return apiError("Teacher sign-in required.", 401);
  const submissions = await getStore().listTeacherUsabilitySubmissions();
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "csv";

  if (format === "json") {
    return Response.json({
      study: "ExitLoop teacher usability study",
      dataBoundary:
        "Teacher usability responses only. Simulated class responses are researcher-authored.",
      submissions,
    });
  }

  if (format !== "csv") return apiError("Use format=csv or format=json.");
  const rows = submissions.map((submission) => {
    const reviewCounts = submission.reviews.reduce(
      (counts, review) => {
        counts[review.judgment] += 1;
        return counts;
      },
      { agree: 0, needs_revision: 0, unsure: 0 },
    );
    const duration = (taskId: string) =>
      submission.taskMetrics.find((metric) => metric.taskId === taskId)?.durationMs ?? null;
    return {
      participant_tag: submission.participantTag,
      run_id: submission.runId,
      content_version_id: submission.contentVersionId,
      started_at: submission.startedAt,
      completed_at: submission.completedAt,
      sus_score: submission.susScore,
      summary_usefulness_1_to_5: submission.summaryUsefulness,
      prompt_control_1_to_5: submission.promptControl,
      summary_confidence_1_to_5: submission.classSummary.confidence,
      reviewed_examples: submission.reviews.length,
      classifications_agree: reviewCounts.agree,
      classifications_need_revision: reviewCounts.needs_revision,
      classifications_unsure: reviewCounts.unsure,
      selected_primary_pattern: submission.classSummary.primaryPatternId,
      teacher_interpretation: submission.classSummary.interpretation,
      planned_next_action: submission.classSummary.nextAction,
      authoring_duration_ms: duration("authoring"),
      classification_review_duration_ms: duration("classification_review"),
      class_summary_duration_ms: duration("class_summary"),
      survey_duration_ms: duration("survey"),
      open_feedback: submission.openFeedback,
    };
  });
  return new Response(rowsToCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=exitloop-teacher-usability.csv",
    },
  });
}
