import { z } from "zod";

export function getRoutineFallbackReason(error: unknown) {
  if (error instanceof z.ZodError) {
    const details = error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";

        return `${path}${issue.message}`;
      })
      .join("; ");

    return `AI response validation failed: ${details}`;
  }

  if (error instanceof SyntaxError) {
    return `AI response was not valid JSON: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown AI routine generation error.";
}
