import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const databaseUrlSchema = z.string().url('DATABASE_URL must be a valid URL');
const databaseUrl =
  process.env.NODE_ENV === 'test'
    ? databaseUrlSchema.default(
        'mysql://test:test@localhost:3306/magnoterra_test'
      )
    : databaseUrlSchema;

// Environment schema validation
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: databaseUrl,
  MP_PUBLIC_KEY: z.string().optional(),
  MP_ACCESS_TOKEN: z.string().optional(),
});

// Validate environment variables
const env = envSchema.parse(process.env);

export default env;
