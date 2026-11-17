import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './resolvers/index.js';
import { createContext } from './context.js';

const json = bodyParser.json;

const PORT = parseInt(process.env.API_PORT ?? '4000', 10);

async function main() {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
  });

  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
  });

  await apollo.start();

  // Apollo Server 4 + Express 4: cors + body-parser must wrap expressMiddleware
  app.use(
    '/graphql',
    cors({ origin: process.env.CORS_ORIGIN ?? '*', credentials: true }),
    json({ limit: '10mb' }),
    // @ts-expect-error — Express type mismatch between @apollo/server bundled @types/express and ours; safe at runtime
    expressMiddleware(apollo, {
      context: async ({ req }: { req: express.Request }) => createContext(req),
    })
  );

  app.listen(PORT, () => {
    console.log(`🚀  API Gateway  → http://localhost:${PORT}/graphql`);
    console.log(`❤️   Health      → http://localhost:${PORT}/health`);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
