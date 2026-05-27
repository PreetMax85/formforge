import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { SubmitResponseSchema, ListResponsesSchema } from "@repo/shared";
import { submitResponse, listResponses, getResponseById, deleteResponse } from "../../modules/responses/responses.service";

const successEnvelope = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: dataSchema,
  });

const responseAnswerSchema = z.object({
  id: z.string().uuid(),
  responseId: z.string().uuid(),
  fieldId: z.string().uuid(),
  fieldLabel: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
  createdAt: z.date(),
});

const responseItemSchema = z.object({
  id: z.string().uuid(),
  formId: z.string().uuid(),
  respondentEmail: z.string().nullable(),
  respondentName: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  emailCopySent: z.boolean(),
  completedAt: z.date(),
  createdAt: z.date(),
  answers: z.array(responseAnswerSchema),
});

const responsesListSchema = z.object({
  items: z.array(responseItemSchema),
  nextCursor: z.string().nullable(),
});

const responsesRouter = router({
  submit: publicProcedure
    .meta({ openapi: { method: "POST", path: "/responses/submit" } })
    .input(SubmitResponseSchema)
    .output(successEnvelope(z.object({ duplicate: z.boolean() })))
    .mutation(async ({ input, ctx }) => {
      const ipAddress =
        (ctx.req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
        ctx.req.socket?.remoteAddress ??
        undefined;
      const userAgent = ctx.req.headers["user-agent"] ?? undefined;

      const result = await submitResponse({
        ...input,
        ipAddress,
        userAgent,
      });

      const duplicate = "duplicate" in result && result.duplicate === true;

      return {
        success: true as const,
        message: duplicate
          ? "Response already received."
          : "Response submitted successfully.",
        data: { duplicate },
      };
    }),

  list: protectedProcedure
    .input(ListResponsesSchema)
    .query(async ({ input, ctx }) => {
      const result = await listResponses(input.formId, ctx.user.sub, {
        limit: input.limit,
        cursor: input.cursor,
      });
      return { success: true as const, message: "Responses found", data: result };
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const response = await getResponseById(input.id, ctx.user.sub);
      return { success: true as const, message: "Response found", data: response };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await deleteResponse(input.id, ctx.user.sub);
      return { success: true as const, message: "Response deleted", data: null };
    }),
});

export { responsesRouter };
