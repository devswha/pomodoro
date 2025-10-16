#!/usr/bin/env node

/**
 * Test New MCP Agents - Context7, Sequential Thinking, Memory Getch
 */

import dotenv from 'dotenv';
import { Context7MCPAgent } from '../lib/mcp/Context7MCPAgent.js';
import { SequentialThinkingMCPAgent } from '../lib/mcp/SequentialThinkingMCPAgent.js';
import { MemoryGetchMCPAgent } from '../lib/mcp/MemoryGetchMCPAgent.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🧪 Testing New MCP Agents');
console.log('='.repeat(50));

async function testContext7Agent() {
  try {
    console.log('\n🧠 Testing Context7 MCP Agent...');

    const agent = new Context7MCPAgent();

    // Test initialization
    console.log('📋 Initializing Context7 Agent...');
    const initResult = await agent.initialize();

    if (initResult.success) {
      console.log('✅ Context7 Agent initialized successfully');
    } else {
      console.log('❌ Context7 Agent initialization failed:', initResult.error);
      return false;
    }

    // Test context processing
    console.log('📋 Testing context processing...');
    const testInput = "I need to start a pomodoro session for studying JavaScript";
    const contextResult = await agent.processContext(testInput, {
      deep: true,
      cached: true,
      expand: true
    });

    if (contextResult.success !== false) {
      console.log('✅ Context processing completed');
      console.log('📊 Confidence:', contextResult.confidence?.toFixed(2) || 'N/A');
      console.log('🔢 Layers processed:', Object.keys(contextResult.layers || {}).length);
    } else {
      console.log('❌ Context processing failed:', contextResult.error);
      return false;
    }

    // Test status
    const status = agent.getStatus();
    console.log('📊 Agent Status:', {
      initialized: status.isInitialized,
      activeLayers: status.activeLayers,
      totalLayers: status.totalLayers,
      cacheSize: status.cacheSize
    });

    // Cleanup
    agent.cleanup();
    console.log('✅ Context7 Agent test completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Context7 Agent test failed:', error.message);
    return false;
  }
}

async function testSequentialThinkingAgent() {
  try {
    console.log('\n🔄 Testing Sequential Thinking MCP Agent...');

    const agent = new SequentialThinkingMCPAgent();

    // Test initialization
    console.log('📋 Initializing Sequential Thinking Agent...');
    const initResult = await agent.initialize();

    if (initResult.success) {
      console.log('✅ Sequential Thinking Agent initialized successfully');
    } else {
      console.log('❌ Sequential Thinking Agent initialization failed:', initResult.error);
      return false;
    }

    // Test sequential thinking
    console.log('📋 Testing sequential thinking process...');
    const testProblem = "How can I improve my productivity using the pomodoro technique?";
    const thinkingResult = await agent.processSequentialThinking(testProblem, {
      maxSteps: 5,
      allowBranching: true,
      trackDecisions: true,
      reasoningMode: 'analytical'
    });

    if (thinkingResult.success) {
      console.log('✅ Sequential thinking completed');
      console.log('📊 Steps taken:', thinkingResult.steps);
      console.log('📊 Confidence:', thinkingResult.confidence?.toFixed(2) || 'N/A');
      console.log('🎯 Chain ID:', thinkingResult.chainId);
    } else {
      console.log('❌ Sequential thinking failed:', thinkingResult.error);
      return false;
    }

    // Test status
    const status = agent.getStatus();
    console.log('📊 Agent Status:', {
      initialized: status.isInitialized,
      activeChains: status.activeChains,
      totalDecisions: status.totalDecisions,
      reasoningPatterns: status.reasoningPatterns
    });

    // Cleanup
    agent.cleanup();
    console.log('✅ Sequential Thinking Agent test completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Sequential Thinking Agent test failed:', error.message);
    return false;
  }
}

async function testMemoryGetchAgent() {
  try {
    console.log('\n💾 Testing Memory Getch MCP Agent...');

    const agent = new MemoryGetchMCPAgent();

    // Test initialization
    console.log('📋 Initializing Memory Getch Agent...');
    const initResult = await agent.initialize();

    if (initResult.success) {
      console.log('✅ Memory Getch Agent initialized successfully');
    } else {
      console.log('❌ Memory Getch Agent initialization failed:', initResult.error);
      return false;
    }

    // Test memory storage
    console.log('📋 Testing memory storage...');
    const testData = {
      type: 'pomodoro_session',
      duration: 25,
      task: 'Learning JavaScript',
      completed: false
    };

    const storeResult = await agent.storeMemory('test_session_001', testData, {
      importance: 'medium',
      context: 'learning',
      tags: ['javascript', 'pomodoro', 'learning'],
      compress: true
    });

    if (storeResult.success) {
      console.log('✅ Memory stored successfully');
      console.log('📊 Memory ID:', storeResult.memoryId);
      console.log('📊 Stored in layers:', storeResult.storedLayers?.join(', ') || 'N/A');
      console.log('📊 Size:', storeResult.size, 'bytes');
    } else {
      console.log('❌ Memory storage failed:', storeResult.error);
      return false;
    }

    // Test memory retrieval
    console.log('📋 Testing memory retrieval...');
    const retrieveResult = await agent.getchMemory('test_session_001', {
      includeContext: true,
      searchDepth: 'deep',
      fallbackToSemantic: true
    });

    if (retrieveResult.success) {
      console.log('✅ Memory retrieved successfully');
      console.log('📊 Found in layer:', retrieveResult.foundInLayer);
      console.log('📊 Retrieval time:', retrieveResult.retrievalTime?.toFixed(2) || 'N/A', 'ms');
      console.log('📊 Data type:', typeof retrieveResult.data);
    } else {
      console.log('❌ Memory retrieval failed:', retrieveResult.error);
      return false;
    }

    // Test semantic search
    console.log('📋 Testing semantic search...');
    const searchResult = await agent.semanticSearch('javascript learning', {
      maxResults: 3,
      threshold: 0.5
    });

    if (searchResult) {
      console.log('✅ Semantic search completed');
      console.log('📊 Found semantic match with key:', searchResult.key);
    } else {
      console.log('📊 No semantic matches found (normal for new data)');
    }

    // Test status
    const status = agent.getStatus();
    console.log('📊 Agent Status:', {
      initialized: status.isInitialized,
      totalLayers: status.totalLayers,
      indexSize: status.indexSize,
      metrics: status.metrics
    });

    // Cleanup
    agent.cleanup();
    console.log('✅ Memory Getch Agent test completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Memory Getch Agent test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  const results = {
    context7: false,
    sequentialThinking: false,
    memoryGetch: false
  };

  // Run tests
  results.context7 = await testContext7Agent();
  results.sequentialThinking = await testSequentialThinkingAgent();
  results.memoryGetch = await testMemoryGetchAgent();

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  console.log(`✅ Context7 Agent: ${results.context7 ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Sequential Thinking Agent: ${results.sequentialThinking ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Memory Getch Agent: ${results.memoryGetch ? 'PASSED' : 'FAILED'}`);

  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All new MCP agents are working correctly!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error.message);
  process.exit(1);
});