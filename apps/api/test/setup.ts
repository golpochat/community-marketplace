import { config } from 'dotenv';
import path from 'node:path';
import 'reflect-metadata';

config({ path: path.resolve(__dirname, '../.env') });

process.env.NODE_ENV ??= 'test';
