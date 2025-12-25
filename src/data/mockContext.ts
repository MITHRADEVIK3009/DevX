export interface ContextNugget {
  id: string;
  title: string;
  snippet: string;
  source: 'Teams' | 'SharePoint' | 'GitHub' | 'System';
  sourceUrl: string;
  keywords: string[];
  relatedFiles?: string[];
  timestamp: string;
}

export const contextDatabase: ContextNugget[] = [
  {
    id: 'auth-decision-2025',
    title: 'Authentication Architecture Decision',
    snippet: 'We decided to use Supabase JWT for auth tokens with 24h expiry. Store refresh tokens in httpOnly cookies. This was discussed in the auth-design thread and aligns with OWASP guidelines. All new microservices must follow this pattern.',
    source: 'Teams',
    sourceUrl: 'https://teams.microsoft.com/l/channel/19:abc123/General?groupId=xyz789',
    keywords: ['authentication', 'auth', 'jwt', 'token', 'security'],
    relatedFiles: ['auth.ts', 'authConfig.ts', 'token'],
    timestamp: '2025-12-15T10:30:00Z'
  },
  {
    id: 'api-rate-limit',
    title: 'API Rate Limiting Configuration',
    snippet: 'Rate limits set to 100 req/min per user, 1000 req/min per IP. Burst limit: 50 req/10s. Implementation uses Redis sliding window algorithm. See GitHub #2847 for implementation details.',
    source: 'GitHub',
    sourceUrl: 'https://github.com/yourorg/yourrepo/issues/2847',
    keywords: ['rate limit', 'api', 'performance', 'throttle', 'redis'],
    relatedFiles: ['middleware/rateLimit.ts', 'redis.config.ts'],
    timestamp: '2025-12-14T14:22:00Z'
  },
  {
    id: 'db-migration-schema',
    title: 'Database Schema Migration Guide',
    snippet: 'All schema changes require creating numbered migrations in /migrations folder. Use Supabase CLI for generation. Never apply migrations directly to production. Test on staging first. Contact DevOps for production deploys.',
    source: 'SharePoint',
    sourceUrl: 'https://sharepoint.com/sites/engineering/Shared%20Documents/DB-Migrations.docx',
    keywords: ['database', 'migration', 'schema', 'sql', 'deployment'],
    relatedFiles: ['migrations/', 'supabase.ts'],
    timestamp: '2025-12-10T09:15:00Z'
  },
  {
    id: 'react-state-pattern',
    title: 'React State Management Pattern',
    snippet: 'Use Context API + useReducer for app-wide state. For complex flows, integrate Zustand. Avoid Redux unless state complexity exceeds 10+ interconnected slices. All state should be normalized and properly typed with TypeScript.',
    source: 'Teams',
    sourceUrl: 'https://teams.microsoft.com/l/channel/19:def456/Components?groupId=xyz789',
    keywords: ['react', 'state', 'context', 'zustand', 'reducer'],
    relatedFiles: ['context/', 'hooks/useAppState.ts', 'store/'],
    timestamp: '2025-12-12T16:45:00Z'
  },
  {
    id: 'error-handling-spec',
    title: 'Global Error Handling Specification',
    snippet: 'All errors must extend AppError base class. Use error codes format: [MODULE]_[CODE]. Log with severity levels: error, warn, info. Implement retry logic for transient failures. Never expose stack traces to client.',
    source: 'GitHub',
    sourceUrl: 'https://github.com/yourorg/yourrepo/blob/main/docs/ERROR-HANDLING.md',
    keywords: ['error', 'exception', 'logging', 'handling', 'debug'],
    relatedFiles: ['utils/errors.ts', 'middleware/errorHandler.ts'],
    timestamp: '2025-12-08T11:20:00Z'
  },
  {
    id: 'testing-standards',
    title: 'Testing Best Practices & Coverage Requirements',
    snippet: 'Unit test coverage target: 80% for business logic, 60% for UI components. Use Vitest for unit tests, Playwright for e2e. All critical paths require e2e tests. Run tests on every PR. Production deploys require 100% test pass rate.',
    source: 'SharePoint',
    sourceUrl: 'https://sharepoint.com/sites/engineering/Shared%20Documents/Testing-Standards.docx',
    keywords: ['test', 'testing', 'vitest', 'playwright', 'coverage'],
    relatedFiles: ['__tests__/', 'e2e/', 'vitest.config.ts'],
    timestamp: '2025-12-11T13:00:00Z'
  }
];
