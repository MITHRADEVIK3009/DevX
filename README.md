# Copilot Context-Bridge

A VS Code Extension that reduces context-switching friction by surfacing relevant Teams chats, GitHub discussions, and SharePoint docs when you highlight code.

## The Problem

Developers lose 6+ hours per week context switching:
- Searching Teams for architectural decisions
- Hunting SharePoint for authentication patterns
- Scrolling GitHub PRs for design rationale

## Solution

Highlight code and see the top 3 most relevant context nuggets from Teams, GitHub, and SharePoint in the sidebar.

## Features

- Code selection triggers instant context retrieval (< 200ms)
- Semantic ranking with keyword matching (70%) and recency (30%)
- Multiple sources: Teams, SharePoint, GitHub PRs, GitHub Issues
- Direct links to source threads and discussions
- Accessibility: Keyboard navigation, high contrast, ARIA labels
- Metrics: Logs MTTC (Mean Time to Context) and user interactions

## Quick Start

Install and build:

```bash
npm install
npm run build
```

Run in VS Code (interactive):

```bash
# Press F5 to start Extension Development Host
# Select code in editor to trigger sidebar
```

Preview UI only:

```bash
npm run dev
# Opens http://localhost:5173
```

Test:

```bash
npm run test                # Run unit tests
npm run test:coverage       # Coverage report
npm run check:duplicates    # Check for duplicate content
```

Package for distribution:

```bash
npm run package             # Creates .vsix file
```

## Architecture

4-state finite state machine:
1. State_Idle - Ready
2. State_Trigger - Extract metadata from selection
3. State_Retrieval - Rank context nuggets semantically
4. State_Display - Render results in sidebar

See [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## Project Structure

```
src/
  extension.ts              # Entry point
  stateMachine.ts           # State machine logic
  types.ts                  # Type definitions
  data/
    contextDatabase.json    # Mock data
  webview/
    provider.ts             # Webview provider
    main.tsx                # React entry
    ui/
      Sidebar.tsx           # UI components
      Sidebar.css           # Styles
  __tests__/
    stateMachine.test.ts    # Unit tests
```

## Test Coverage

12 unit tests covering:
- State machine transitions
- Metadata extraction
- Semantic ranking (keyword + recency)
- Scoring correctness
- Context map generation

## Available Commands

```bash
npm run build               # Compile and bundle
npm run dev                 # Start Vite dev server
npm run test                # Run tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npm run check:duplicates    # Content dedup check
npm run lint                # ESLint
npm run package             # Create .vsix
```

## Documentation

- [QUICK_START.md](QUICK_START.md) - Quick reference
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical design
- [TESTING.md](TESTING.md) - Testing strategy
- [BUILD_SUMMARY.md](BUILD_SUMMARY.md) - Build details

## Test Data Format

Add context nuggets to `src/data/contextDatabase.json`:

```json
{
  "id": "unique-id",
  "source": "Teams|SharePoint|GitHub PR|GitHub Issue",
  "title": "Title",
  "content": "Full context text",
  "keywords": ["keyword1", "keyword2"],
  "timestamp": "2025-12-24T12:00:00Z",
  "author": "Name",
  "relevanceScore": 0.85,
  "url": "https://..."
}
```

## Technical Specifications

### Prototype (Current)
- **MTTC**: ~50-150ms
- **Database**: In-memory JSON (6 examples)
- **Ranking**: O(n) keyword matching + recency filter

### Production (Live APIs)
- **MTTC Target**: Still < 30 seconds
- **Optimization needed**:
  - Parallel API calls (Teams + GitHub simultaneously)
  - Caching layer (local session cache)
  - Debouncing frequent selections
  - Pagination for large result sets

## Status

- Build: Clean (zero warnings)
- Tests: 12/12 passing
- Code Quality: No critical duplicates
- Ready for: VS Code installation and testing

## Resume / Portfolio Value

This prototype demonstrates:

1. **System Design**: Multi-tier architecture (extension layer, state machine, webview)
2. **Product Thinking**: Solving a real DevEx problem (Atlassian 2025 research)
3. **Technical PM Skills**: Scoping, prioritization (MVP → Production roadmap)
4. **Full-Stack Engineering**:
   - VS Code Extension API (native integration)
   - React for UI
   - TypeScript for type safety
   - Semantic algorithms (ranking, filtering)
5. **Metrics-Driven Approach**: MTTC tracking for product success

## References

- [VS Code Extension API Docs](https://code.visualstudio.com/api)
- [Atlassian 2025 State of DevEx Report](https://www.atlassian.com/devex)
- [Accessibility Guidelines (WCAG 2.1)](https://www.w3.org/WAI/WCAG21/quickref/)
- [OpenAI API for Synthesis (Phase 3)](https://platform.openai.com/docs/guides/gpt)

## License

MIT - Student Portfolio Project
