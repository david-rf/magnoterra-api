import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  MP_PUBLIC_KEY: z.string().optional(),
  MP_ACCESS_TOKEN: z.string().optional(),
});

const envVars = { ...process.env };

if (envVars.NODE_ENV === 'test' && !envVars.DATABASE_URL) {
  envVars.DATABASE_URL = 'mysql://test:test@localhost:3306/test';
}

// Validate environment variables
const env = envSchema.parse(envVars);

export default env;
