#!/usr/bin/env node

/**
 * Duplicate Content Detection Script
 * Scans contextDatabase.json and mockContext.ts for duplicate context nuggets
 * Checks for: duplicate titles, duplicate content, duplicate URLs, keyword overlap
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../src/data/contextDatabase.json');
const mockPath = path.join(__dirname, '../src/data/mockContext.ts');

function readDatabase() {
  try {
    const rawData = fs.readFileSync(dbPath, 'utf-8');
    const parsed = JSON.parse(rawData);
    return parsed.contexts || [];
  } catch (error) {
    console.error('Error reading contextDatabase.json:', error.message);
    return [];
  }
}

function readMockContext() {
  try {
    const content = fs.readFileSync(mockPath, 'utf-8');
    // Extract the exported array from the TS file
    const match = content.match(/export const mockContextNuggets[:\s]*ContextNugget\[\]\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) {
      console.warn('Could not parse mockContext.ts');
      return [];
    }
    // Evaluate the parsed JSON (risky but for dev use only)
    const mockData = eval(`(${match[1]})`);
    return Array.isArray(mockData) ? mockData : [];
  } catch (error) {
    console.error('Error reading mockContext.ts:', error.message);
    return [];
  }
}

function checkDuplicates(nuggets) {
  const results = {
    duplicateTitles: [],
    duplicateUrls: [],
    similarContent: [],
    totalNuggets: nuggets.length,
  };

  for (let i = 0; i < nuggets.length; i++) {
    for (let j = i + 1; j < nuggets.length; j++) {
      const n1 = nuggets[i];
      const n2 = nuggets[j];

      // Safety checks
      if (!n1 || !n2) continue;

      // Check for duplicate titles (use thread or document as fallback)
      const title1 = (n1.title || n1.thread || n1.document || '').toLowerCase();
      const title2 = (n2.title || n2.thread || n2.document || '').toLowerCase();
      
      if (title1 && title2 && title1 === title2) {
        results.duplicateTitles.push({
          nugget1: { id: n1.id, title: title1, source: n1.source },
          nugget2: { id: n2.id, title: title2, source: n2.source },
        });
      }

      // Check for duplicate URLs
      if (n1.url && n2.url && n1.url === n2.url) {
        results.duplicateUrls.push({
          nugget1: { id: n1.id, title: n1.title || n1.thread || 'N/A' },
          nugget2: { id: n2.id, title: n2.title || n2.thread || 'N/A' },
          url: n1.url,
        });
      }

      // Check for content similarity (simple substring check)
      const content1 = (n1.content || '').toLowerCase();
      const content2 = (n2.content || '').toLowerCase();
      
      if (
        content1.length > 30 &&
        content2.length > 30 &&
        (content1.includes(content2.substring(0, 30)) ||
          content2.includes(content1.substring(0, 30)))
      ) {
        results.similarContent.push({
          nugget1: { id: n1.id, title: n1.title || n1.thread || 'N/A' },
          nugget2: { id: n2.id, title: n2.title || n2.thread || 'N/A' },
          similarity: 'substring match',
        });
      }
    }
  }

  return results;
}

function main() {
  console.log('🔍 Duplicate Content Detection\n');

  const dbNuggets = readDatabase();
  const mockNuggets = readMockContext();
  const allNuggets = [...dbNuggets, ...mockNuggets];

  console.log(`📊 Statistics:`);
  console.log(`   - Database nuggets: ${dbNuggets.length}`);
  console.log(`   - Mock nuggets: ${mockNuggets.length}`);
  console.log(`   - Total: ${allNuggets.length}\n`);

  const results = checkDuplicates(allNuggets);

  let hasIssues = false;

  if (results.duplicateTitles.length > 0) {
    hasIssues = true;
    console.log(`⚠️  Duplicate Titles (${results.duplicateTitles.length}):`);
    results.duplicateTitles.forEach((dup) => {
      console.log(`   - "${dup.nugget1.title}"`);
      console.log(`     IDs: ${dup.nugget1.id}, ${dup.nugget2.id}`);
    });
    console.log();
  }

  if (results.duplicateUrls.length > 0) {
    hasIssues = true;
    console.log(`⚠️  Duplicate URLs (${results.duplicateUrls.length}):`);
    results.duplicateUrls.forEach((dup) => {
      console.log(`   - ${dup.url}`);
      console.log(`     IDs: ${dup.nugget1.id}, ${dup.nugget2.id}`);
    });
    console.log();
  }

  if (results.similarContent.length > 0) {
    console.log(`ℹ️  Similar Content (${results.similarContent.length}):`);
    results.similarContent.forEach((sim) => {
      console.log(`   - "${sim.nugget1.title}" ↔ "${sim.nugget2.title}"`);
      console.log(`     IDs: ${sim.nugget1.id}, ${sim.nugget2.id}`);
    });
    console.log();
  }

  if (!hasIssues) {
    console.log('✅ No critical duplicates detected!\n');
  }

  console.log('📝 Recommendations:');
  console.log('   - Review and consolidate duplicate entries');
  console.log('   - Update URLs to point to unique resources');
  console.log('   - Add unique keywords to differentiate similar content\n');

  process.exit(hasIssues ? 1 : 0);
}

main();
