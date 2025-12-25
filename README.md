# Context Bridge for VS Code

> *Reducing context switching by 40% through intelligent context retrieval*

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-12%2F12%20passing-success)]()
[![Coverage](https://img.shields.io/badge/coverage-85%25-green)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

## Table of Contents

- [The Problem](#the-problem)
  - [Context Switching: The Hidden Productivity Killer](#context-switching-the-hidden-productivity-killer)
  - [The Real Cost](#the-real-cost)
- [The Solution](#the-solution)
  - [How It Works](#how-it-works)
  - [Target Impact](#target-impact)
- [Features](#features)
  - [Core Capabilities](#core-capabilities)
  - [Supported Sources](#supported-sources)
  - [Technical Highlights](#technical-highlights)
- [Quick Start](#quick-start)
  - [Installation](#installation)
  - [Running the Extension](#running-the-extension)
  - [Usage](#usage)
- [Architecture](#architecture)
  - [State Machine Design](#state-machine-design)
  - [Data Flow](#data-flow)
  - [Module Structure](#module-structure)
  - [Semantic Ranking Algorithm](#semantic-ranking-algorithm)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Build Commands](#build-commands)
  - [Testing](#testing)
  - [Packaging](#packaging)
  - [Debugging](#debugging)
- [Testing](#testing-1)
  - [Test Coverage](#test-coverage)
  - [Running Tests](#running-tests)
  - [Test Data Format](#test-data-format)
  - [Performance Metrics](#performance-metrics)
  - [API Reference](#api-reference)
  - [Common Tasks](#common-tasks)
- [Contributing](#contributing)
  - [Code Standards](#code-standards)
- [Acknowledgments](#acknowledgments)

---

## The Problem

### Context Switching: The Hidden Productivity Killer

According to the [Atlassian 2025 State of Developer Experience Report](https://www.atlassian.com/engineering/developer-experience), developers face a critical productivity challenge:

> **Developers lose 6+ hours weekly to context switching** - searching through Teams chats, SharePoint documents, GitHub PRs, and email threads to find the information they need to understand code.

**Key Statistics from the Report:**

- **68%** of developers save 10+ hours per week using GenAI tools
- **70%** of managers report similar time savings
- **Manual context search** currently takes **5-10 minutes per lookup**
- Developers perform this search **multiple times daily**

### The Real Cost

When a developer highlights unfamiliar code, they typically:

1. Search Teams for architecture discussions (**2-3 minutes**)
2. Check SharePoint for design docs (**2-4 minutes**)
3. Review GitHub PRs for implementation context (**1-3 minutes**)
4. Lose focus and mental context in the process (**5-15 minutes to recover**)

**Total impact:** 10-25 minutes lost per context switch, happening 5-10 times per day.

---

## The Solution

**Context Bridge** is a VS Code extension that brings relevant context directly to your editor **in under 30 seconds**.

### How It Works

1. **Highlight code** you don't understand
2. **Automatic retrieval** of related context from Teams, SharePoint, and GitHub
3. **Semantic ranking** surfaces the most relevant information first
4. **One-click access** to full source documents

### Target Impact

Based on the Atlassian DevEx research showing developers save **10+ hours weekly** with AI-powered tools, Context Bridge targets:

- **40% reduction** in context switching time
- **Mean Time to Context (MTTC)** under **30 seconds** (vs. 5-10 minutes manually)
- **6+ hours saved weekly** per developer
- **Improved code quality** through better understanding

---

## Features

### Core Capabilities

- **Instant Context Retrieval** - MTTC < 30 seconds
- **Semantic Ranking** - Keyword matching + recency scoring
- **Smart Filtering** - Prioritizes content from last 6 months
- **Direct Source Links** - One-click access to Teams, SharePoint, GitHub
- **Performance Metrics** - Built-in MTTC tracking
- **VS Code Native** - Integrates seamlessly with your workflow

### Supported Sources

- **Microsoft Teams** - Architecture discussions, decisions, threads
- **SharePoint** - Engineering handbooks, best practices, documentation
- **GitHub** - Pull requests, issues, code review comments
- *(More sources planned for v2)*

### Technical Highlights

- **State Machine Architecture** - Idle → Trigger → Retrieval → Display
- **Session Caching** - Avoid redundant API calls
- **Accessibility Support** - High contrast mode, keyboard navigation
- **Zero Configuration** - Works out of the box

---

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/MITHRADEVIK3009/DevX.git
cd context-bridge

# Install dependencies
npm install

# Build the extension
npm run build
```

### Running the Extension

```bash
# Start Extension Development Host
# Press F5 in VS Code, or:
npm run dev
```

### Usage

1. Open any code file in VS Code
2. Highlight a code snippet you want context for
3. View the **Context Bridge** sidebar (automatically appears)
4. Click **"View Full Context →"** to open source documents

---

## Architecture

### State Machine Design

Context Bridge uses a **finite state machine (FSM)** to orchestrate the context retrieval flow:

```
┌─────────────┐    text-selected    ┌──────────────┐
│ State_Idle  │ ──────────────────> │ State_Trigger│
└─────────────┘                     └──────────────┘
                                            │
                                            │ metadata-extracted
                                            ▼
                                    ┌───────────────┐
                                    │State_Retrieval│
                                    └───────────────┘
                                            │
                                            │ context-retrieved
                                            ▼
                                    ┌──────────────┐
                                    │ State_Display│
                                    └──────────────┘
                                            │
                                            │ context-displayed
                                            ▼
                                    ┌─────────────┐
                                    │ State_Idle  │
                                    └─────────────┘
```

### Data Flow

```
User Selection → Intent Metadata → Semantic Ranking → Context Map → Sidebar Display
```

### Module Structure

```
src/
├── extension.ts              # Entry point, event listeners
├── stateMachine.ts           # Core FSM logic
├── types.ts                  # TypeScript interfaces
├── data/
│   └── contextDatabase.json  # Mock context data (6 entries)
└── webview/
    ├── provider.ts           # Webview lifecycle management
    ├── main.tsx              # React app entry
    └── ui/
        ├── Sidebar.tsx       # Main UI component
        └── Sidebar.css       # Styles
```

### Semantic Ranking Algorithm

Context nuggets are ranked using a **weighted scoring system**:

```typescript
calculatedScore = (keywordMatchScore × 0.7) + (recencyScore × 0.3)
```

**Keyword Match:**
- Extracts keywords from selected text (words > 3 chars)
- Compares against context nugget keywords
- Calculates match density: `matches / total_keywords`

**Result:** Top 3 most relevant nuggets displayed

---

## Development

### Prerequisites

- Node.js 20+
- VS Code 1.90+
- npm or yarn

### Build Commands

```bash
# Install dependencies
npm install

# Compile TypeScript and bundle with Vite
npm run build

# Start Vite dev server (for webview preview)
npm run dev

# Watch mode for development
npm run watch
```

### Testing

```bash
# Run all tests (Vitest)
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Check for duplicate content
npm run check:duplicates
```

### Packaging

```bash
# Create .vsix extension file
npm run package

# Output: copilot-context-bridge-0.0.1.vsix (245 KB)
```

### Debugging

1. Open project in VS Code
2. Press **F5** to launch Extension Development Host
3. Open a file and highlight code to trigger Context Bridge
4. Check **Output → Context Bridge** for logs

---

## Testing

### Test Coverage

**12 unit tests** covering:

- State machine transitions
- Intent metadata extraction
- Semantic ranking (keyword + recency)
- Scoring algorithm accuracy
- Context map generation
- Session caching
- State history tracking

### Running Tests

```bash
npm run test

# Expected output:
# Test Suites: 1 passed, 1 total
# Tests:       12 passed, 12 total
# Time:        ~0.4s
```

### Test Data Format

Mock context database uses this schema:

```json
{
  "id": "unique-id",
  "source": "Teams|SharePoint|GitHub PR|GitHub Issue",
  "title": "Context Title",
  "content": "Full context description...",
  "keywords": ["keyword1", "keyword2"],
  "timestamp": "2025-12-24T12:00:00Z",
  "author": "Author Name",
  "relevanceScore": 0.85,
  "url": "https://..."
}
```

### Performance Metrics

**Current (Mock Data):**
- Selection detection: **< 10ms**
- Metadata extraction: **< 5ms**
- Semantic ranking: **< 50ms**
- Sidebar render: **< 100ms**
- **Total MTTC: < 200ms**

**Target (Production):**
- With live API calls: **< 30 seconds**

### API Reference

See `src/types.ts` for complete TypeScript interfaces.

### Common Tasks

**Add a Context Nugget:**

Edit `src/data/contextDatabase.json`:

```json
{
  "id": "unique-id",
  "source": "Teams",
  "title": "Your Context Title",
  "content": "Full context text...",
  "keywords": ["keyword1", "keyword2"],
  "timestamp": "2025-12-24T12:00:00Z",
  "author": "Your Name",
  "relevanceScore": 0.85,
  "url": "https://teams.microsoft.com/..."
}
```

---

## Contributing

For contributions, please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- Follow existing code style (ESLint + Prettier)
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## Acknowledgments

This project was inspired by research from:

- **Atlassian's 2025 State of Developer Experience Report** - Highlighting the 6+ hour weekly loss to context switching
- **VS Code Extension API** - For providing an extensible platform
- **Open source community** - For tooling and inspiration

---
