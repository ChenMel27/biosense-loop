export const MAX_LESSON_FILE_BYTES = 4_000_000;

export const LESSON_FILE_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "txt",
  "md",
  "rtf",
  "odt",
] as const;

export const LESSON_FILE_ACCEPT = LESSON_FILE_EXTENSIONS
  .map((extension) => `.${extension}`)
  .join(",");

export const LESSON_FILE_FORMAT_LABEL =
  "PDF (.pdf), PowerPoint (.ppt, .pptx), Word (.doc, .docx), text (.txt, .md, .rtf), or OpenDocument (.odt)";

const mimeByExtension: Record<(typeof LESSON_FILE_EXTENSIONS)[number], string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  md: "text/markdown",
  rtf: "application/rtf",
  odt: "application/vnd.oasis.opendocument.text",
};

export function lessonFileExtension(filename: string) {
  return filename.split(".").pop()?.trim().toLowerCase() ?? "";
}

export function isAcceptedLessonFilename(filename: string) {
  const extension = lessonFileExtension(filename);
  return LESSON_FILE_EXTENSIONS.some((accepted) => accepted === extension);
}

export function resolveLessonFileMime(filename: string, browserMime = "") {
  const extension = lessonFileExtension(filename);
  if (isAcceptedLessonFilename(filename)) {
    return mimeByExtension[extension as keyof typeof mimeByExtension];
  }
  return browserMime.trim() || "application/octet-stream";
}
