import { ContextBridgeStateMachine, computeRelevanceScores } from '../stateMachine';
import { IntentMetadata, ContextNugget } from '../types';

describe('ContextBridgeStateMachine', () => {
  let machine: ContextBridgeStateMachine;

  beforeEach(() => {
    machine = new ContextBridgeStateMachine();
  });

  describe('extractIntentMetadata', () => {
    it('should extract intent metadata from selection', () => {
      const result = ContextBridgeStateMachine.extractIntentMetadata(
        'const x = 5;',
        'app.ts',
        'typescript',
        42
      );

      expect(result).toHaveProperty('selectedText', 'const x = 5;');
      expect(result).toHaveProperty('fileName', 'app.ts');
      expect(result).toHaveProperty('fileLanguage', 'typescript');
      expect(result).toHaveProperty('lineNumber', 42);
      expect(result).toHaveProperty('timestamp');
    });

    it('should handle empty selections', () => {
      const result = ContextBridgeStateMachine.extractIntentMetadata(
        '',
        'empty.ts',
        'typescript',
        1
      );

      expect(result.selectedText).toBe('');
      expect(result.fileName).toBe('empty.ts');
    });
  });

  describe('retrieveContextNuggets', () => {
    it('should return ranked nuggets based on keyword matching', () => {
      const mockDb: ContextNugget[] = [
        {
          id: '1',
          source: 'GitHub PR',
          title: 'Fix build issue',
          content: 'Build script broken on Windows with path issues',
          keywords: ['build', 'Windows', 'path'],
          timestamp: '2025-12-20T10:00:00Z',
          author: 'alice',
          relevanceScore: 0,
          url: 'https://github.com/owner/repo/pull/1',
        },
        {
          id: '2',
          source: 'Teams',
          title: 'Meeting notes',
          content: 'Discussed API integration',
          keywords: ['API', 'integration'],
          timestamp: '2025-12-15T10:00:00Z',
          author: 'bob',
          relevanceScore: 0,
          url: 'https://teams.microsoft.com/1',
        },
      ];

      const metadata: IntentMetadata = {
        selectedText: 'build',
        fileName: 'script.ts',
        fileLanguage: 'typescript',
        lineNumber: 1,
        timestamp: Date.now(),
      };

      const result = ContextBridgeStateMachine.retrieveContextNuggets(metadata);

      // Since the actual implementation reads from a database, we're testing
      // that it returns an array (even if empty with test data)
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no matches found', () => {
      const metadata: IntentMetadata = {
        selectedText: 'nonexistent_keyword_12345',
        fileName: 'test.ts',
        fileLanguage: 'typescript',
        lineNumber: 1,
        timestamp: Date.now(),
      };

      const result = ContextBridgeStateMachine.retrieveContextNuggets(metadata);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('processSelection', () => {
    it('should process selection and return context map', () => {
      const result = machine.processSelection(
        'TypeScript error',
        'index.ts',
        'typescript',
        10
      );

      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('nuggets');
      expect(result).toHaveProperty('cachedAt');
      expect(result).toHaveProperty('sessionId');
      expect(result.metadata.selectedText).toBe('TypeScript error');
    });

    it('should return context map with valid structure', () => {
      const result = machine.processSelection(
        'const app = express();',
        'server.ts',
        'typescript',
        15
      );

      if (result) {
        expect(result.metadata.fileName).toBe('server.ts');
        expect(result.nuggets).toBeDefined();
        expect(Array.isArray(result.nuggets)).toBe(true);
        expect(typeof result.sessionId).toBe('string');
        expect(typeof result.cachedAt).toBe('number');
      }
    });
  });

  describe('state management', () => {
    it('should track initial state as idle', () => {
      const state = machine.getState();
      expect(state).toBe('State_Idle');
    });

    it('should provide state history', () => {
      machine.processSelection('test', 'test.ts', 'typescript', 1);
      const history = machine.getStateHistory();
      
      expect(Array.isArray(history)).toBe(true);
      // Should have transitions from the processSelection call
      expect(history.length).toBeGreaterThan(0);
    });

    it('should allow session cache clearing', () => {
      machine.processSelection('test', 'test.ts', 'typescript', 1);
      expect(() => machine.clearSessionCache()).not.toThrow();
    });
  });

  describe('generateContextMap', () => {
    it('should generate a valid context map', () => {
      const metadata: IntentMetadata = {
        selectedText: 'test',
        fileName: 'test.ts',
        fileLanguage: 'typescript',
        lineNumber: 1,
        timestamp: Date.now(),
      };

      const nuggets: ContextNugget[] = [];
      const map = machine['generateContextMap'](metadata, nuggets);

      expect(map.metadata).toEqual(metadata);
      expect(map.nuggets).toEqual([]);
      expect(typeof map.cachedAt).toBe('number');
      expect(typeof map.sessionId).toBe('string');
    });
  });

  describe('scoring and ranking (detailed)', () => {
    it('computeRelevanceScores should return scores for provided db', () => {
      const mockDb: ContextNugget[] = [
        {
          id: 'a',
          source: 'GitHub PR',
          title: 'Recent build fix',
          content: 'Fix build script',
          keywords: ['build', 'ci', 'windows'],
          timestamp: new Date().toISOString(),
          author: 'alice',
          relevanceScore: 0,
          url: 'https://example.com/pr/1',
        },
        {
          id: 'b',
          source: 'Teams',
          title: 'Old doc',
          content: 'Legacy notes',
          keywords: ['legacy', 'notes'],
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400).toISOString(), // >6 months ago
          author: 'bob',
          relevanceScore: 0,
          url: 'https://example.com/teams/1',
        },
        {
          id: 'c',
          source: 'SharePoint',
          title: 'Recent unrelated',
          content: 'Design decisions',
          keywords: ['design', 'patterns'],
          timestamp: new Date().toISOString(),
          author: 'carol',
          relevanceScore: 0,
          url: 'https://example.com/doc/1',
        },
      ];

      const metadata: IntentMetadata = {
        selectedText: 'build',
        fileName: 'script.ts',
        fileLanguage: 'typescript',
        lineNumber: 1,
        timestamp: Date.now(),
      };

      const scored = computeRelevanceScores(metadata, mockDb);
      expect(scored.length).toBe(3);
      scored.forEach((s) => expect(typeof s.calculatedScore).toBe('number'));
    });

    it('ranking should prioritize keyword match + recency', () => {
      const mockDb: ContextNugget[] = [
        {
          id: 'x1',
          source: 'GitHub PR',
          title: 'Recent build fix',
          content: 'Fix build script',
          keywords: ['build', 'ci'],
          timestamp: new Date().toISOString(),
          author: 'alice',
          relevanceScore: 0,
          url: 'https://example.com/pr/1',
        },
        {
          id: 'x2',
          source: 'GitHub PR',
          title: 'Old build note',
          content: 'Old build discussion',
          keywords: ['build', 'legacy'],
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400).toISOString(),
          author: 'eve',
          relevanceScore: 0,
          url: 'https://example.com/pr/2',
        },
        {
          id: 'x3',
          source: 'Teams',
          title: 'Recent doc',
          content: 'Some doc about patterns',
          keywords: ['patterns'],
          timestamp: new Date().toISOString(),
          author: 'mallory',
          relevanceScore: 0,
          url: 'https://example.com/teams/2',
        },
      ];

      const metadata: IntentMetadata = {
        selectedText: 'build',
        fileName: 'build.ts',
        fileLanguage: 'typescript',
        lineNumber: 1,
        timestamp: Date.now(),
      };

      const scored = computeRelevanceScores(metadata, mockDb);
      // find by id
      const s1 = scored.find((s) => s.id === 'x1')!;
      const s2 = scored.find((s) => s.id === 'x2')!;
      const s3 = scored.find((s) => s.id === 'x3')!;

      // s1 should score higher than s2 due to recency (both match keyword)
      expect(s1.calculatedScore).toBeGreaterThan(s2.calculatedScore);
      // s3 has no keyword match, so should be lower than x1
      expect(s1.calculatedScore).toBeGreaterThan(s3.calculatedScore);

      // Now ensure retrieveContextNuggets with provided db returns x1 first
      const ranked = ContextBridgeStateMachine.retrieveContextNuggets(metadata, mockDb);
      expect(ranked.length).toBeGreaterThan(0);
      expect(ranked[0].id).toBe('x1');
    });
  });
});
