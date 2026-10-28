import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { NextFunction, Request, Response } from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { initDatabase } from './server/db';
import {
  createSession,
  getHost,
  getPublic,
  joinTeam,
  deleteSession,
  listSessions,
  submitFeedback,
  submitHeights,
  submitMemory,
  submitStudy,
  submitUmfang,
  updateHost,
} from './server/game-store';

const browserDistFolder = join(import.meta.dirname, '../browser');
const indexHtml = existsSync(join(browserDistFolder, 'index.html'))
  ? join(browserDistFolder, 'index.html')
  : join(browserDistFolder, 'index.csr.html');

const app = express();
const angularApp = new AngularNodeAppEngine();
app.set('trust proxy', 1);

app.get(['/health', '/api/health'], (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api', express.json(), (req, res, next) => {
  Promise.resolve()
    .then(() => handleApi(req, res))
    .catch(next);
});

function statusOf(error: unknown): number {
  if (error && typeof error === 'object' && 'status' in error) {
    return Number((error as { status: number }).status) || 500;
  }
  return 500;
}

function apiParts(req: Request): string[] {
  const url = (req.originalUrl || req.url).split('?')[0] ?? '';
  return url
    .replace(/^\/api\/?/, '')
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean);
}

async function handleApi(req: Request, res: Response): Promise<void> {
  const parts = apiParts(req);
  if (parts.length === 1 && parts[0] === 'sessions') {
    if (req.method === 'GET') {
      res.json(await listSessions(String(req.query['password'] ?? '')));
      return;
    }
    if (req.method === 'POST') {
      res.json(
        await createSession(String(req.body?.password ?? ''), {
          umfangTruth: Number(req.body?.umfangTruth),
          studyDrugColor: req.body?.studyDrugColor,
        }),
      );
      return;
    }
  }
  if (parts[0] !== 'sessions' || parts.length < 2) {
    res.status(404).json({ message: 'Unbekannte API' });
    return;
  }
  const code = parts[1];
  const tail = parts.slice(2).join('/');
  if (req.method === 'GET' && !tail) {
    res.json(await getPublic(code));
    return;
  }
  if (req.method === 'DELETE' && !tail) {
    await deleteSession(code, String(req.query['password'] ?? req.body?.password ?? ''));
    res.json({ ok: true });
    return;
  }
  if (req.method === 'GET' && tail === 'host') {
    res.json(await getHost(code, String(req.query['hostKey'] ?? '')));
    return;
  }
  if (req.method === 'POST' && tail === 'join') {
    res.json(await joinTeam(code, req.body));
    return;
  }
  if (req.method === 'PATCH' && !tail) {
    res.json(await updateHost(code, req.body.hostKey, req.body.action));
    return;
  }
  if (req.method === 'POST' && tail === 'heights') {
    res.json(await submitHeights(code, req.body.teamId, req.body.entries));
    return;
  }
  if (req.method === 'POST' && tail === 'umfang') {
    res.json(await submitUmfang(code, req.body.teamId, req.body.entries));
    return;
  }
  if (req.method === 'POST' && tail === 'memory') {
    res.json(
      await submitMemory(code, req.body.teamId, req.body.round, req.body.choice),
    );
    return;
  }
  if (req.method === 'POST' && tail === 'study') {
    res.json(await submitStudy(code, req.body.teamId, req.body.entries));
    return;
  }
  if (req.method === 'POST' && tail === 'feedback') {
    res.json(
      await submitFeedback(code, req.body.teamId, req.body.rating, req.body.comment ?? ''),
    );
    return;
  }
  res.status(404).json({ message: 'Unbekannte API' });
}

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  res.status(statusOf(error)).json({
    message: error instanceof Error ? error.message : 'Serverfehler',
  });
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  if (process.env['NODE_ENV'] === 'production') {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }
    res.sendFile(indexHtml, (error) => {
      if (error) next(error);
    });
    return;
  }
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = Number(process.env['PORT'] || 80);
  void initDatabase()
    .then(() => {
      app.listen(port, '0.0.0.0', (error) => {
        if (error) {
          throw error;
        }
        console.log(`Node Express server listening on http://0.0.0.0:${port}`);
      });
    })
    .catch((error: unknown) => {
      console.error('Datenbank-Start fehlgeschlagen', error);
      process.exit(1);
    });
}

export const reqHandler = createNodeRequestHandler(app);
