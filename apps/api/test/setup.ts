import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(__dirname, '../.env') });

process.env.NODE_ENV ??= 'test';
