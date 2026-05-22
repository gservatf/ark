import type { z } from "zod";

export type FormValidationResult<Data, Fields extends string> = {
  data?: Data;
  errors: Partial<Record<Fields, string>>;
};

export function validateFormData<
  Schema extends z.ZodTypeAny,
  Fields extends string = Extract<keyof z.input<Schema>, string>
>(
  schema: Schema,
  input: z.input<Schema>
): FormValidationResult<z.output<Schema>, Fields> {
  const parsed = schema.safeParse(input);

  if (parsed.success) {
    return { data: parsed.data, errors: {} };
  }

  const flattened = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
  const errors: Partial<Record<Fields, string>> = {};

  Object.entries(flattened).forEach(([field, messages]) => {
    if (messages?.[0]) {
      errors[field as Fields] = messages[0];
    }
  });

  return { errors };
}
