import { z } from 'zod';

export const TimeSeriesSchema = z.object({
  formId:      z.string().uuid(),
  granularity: z.enum(['day', 'week', 'month']).default('day'),
  startDate:   z.string().datetime().optional(),
  endDate:     z.string().datetime().optional(),
});
