import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import threadRoutes from './routes/threads.js';
import subredditRoutes from './routes/subreddits.js';

// Import models so that they are registered with Mongoose
import './models/Thread.js';
import './models/Subreddit.js';
import './models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openapiSpec = YAML.load(path.join(__dirname, '..', 'openapi.yaml'));

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({
    limit: '10mb',
    extended: true
}));

// API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Routes
app.use('/api/threads', threadRoutes);
app.use('/api/subreddits', subredditRoutes);

export default app;