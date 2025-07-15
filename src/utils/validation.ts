import { z } from 'zod';

export function formatZodError(error: z.ZodError) {
    return error.errors.map((err) => ({
        code: 'VALIDATION_ERROR',
        field: err.path.join('.'),
        message: err.message
    }));
}
