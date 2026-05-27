import type { Field as DbField } from '@repo/shared';
import type { ConditionalLogicSchema } from '@repo/shared';
import type { z } from 'zod';

type FieldConfig = Partial<{
  options: string[];
  min: number;
  max: number;
  minDate: string;
  maxDate: string;
  minLength: number;
  maxLength: number;
  maxSelections: number;
}>;

export type Field = Omit<DbField, 'config' | 'conditions' | 'createdAt' | 'updatedAt'> & {
  config: FieldConfig;
  conditions?: z.infer<typeof ConditionalLogicSchema> | null;
  createdAt: string;
  updatedAt: string;
};

export type FieldType = Field['type'];
