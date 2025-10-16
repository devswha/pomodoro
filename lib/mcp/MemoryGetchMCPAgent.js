/**
 * MemoryGetchMCPAgent - Advanced Memory Management and Intelligent Retrieval System
 *
 * This agent provides multi-layered memory management, intelligent context retrieval,
 * adaptive caching, and memory optimization for the Pomodoro Timer application.
 * "Getch" refers to intelligent "getting" and "fetching" of contextual memory.
 */

import { supabase, handleSupabaseError } from '../supabase/client.js';

export class MemoryGetchMCPAgent {
  constructor() {
    this.memoryLayers = new Map();
    this.contextualMemory = new Map();
    this.workingMemory = new Map();
    this.persistentMemory = new Map();
    this.sessionMemory = new Map();
    this.memoryIndex = new Map();
    this.isInitialized = false;
    this.memoryMetrics = {
      totalMemories: 0,
      cacheHits: 0,
      cacheMisses: 0,
      memoryEvictions: 0,
      compressionRatio: 0,
      retrievalLatency: 0
    };
  }

  /**
   * Initialize Memory Getch MCP Agent with multi-layer memory system
   */
  async initialize() {
    try {
      console.log('💾 Initializing Memory Getch MCP Agent...');

      // Initialize memory layers
      await this.initializeMemoryLayers();

      // Set up memory indexing system
      await this.setupMemoryIndexing();

      // Load persistent memories from database
      await this.loadPersistentMemories();

      // Initialize intelligent retrieval system
      await this.setupIntelligentRetrieval();

      this.isInitialized = true;
      console.log('✅ Memory Getch MCP Agent initialized successfully');

      return { success: true, message: 'Memory Getch Agent ready', layers: this.memoryLayers.size };
    } catch (error) {
      console.error('❌ Failed to initialize Memory Getch Agent:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize multi-layer memory system
   */
  async initializeMemoryLayers() {
    const layers = [
      {
        id: 'working',
        name: 'Working Memory',
        description: 'Short-term active memory for current tasks',
        capacity: 100,
        ttl: 300000, // 5 minutes
        evictionPolicy: 'lru',
        storage: this.workingMemory
      },
      {
        id: 'session',
        name: 'Session Memory',
        description: 'Memory for current browser/app session',
        capacity: 500,
        ttl: 3600000, // 1 hour
        evictionPolicy: 'lfu',
        storage: this.sessionMemory
      },
      {
        id: 'persistent',
        name: 'Persistent Memory',
        description: 'Long-term memory stored in database',
        capacity: 10000,
        ttl: null, // No expiration
        evictionPolicy: 'relevance',
        storage: this.persistentMemory
      },
      {
        id: 'contextual',
        name: 'Contextual Memory',
        description: 'Context-aware memory with semantic associations',
        capacity: 1000,
        ttl: 1800000, // 30 minutes
        evictionPolicy: 'semantic',
        storage: this.contextualMemory
      }
    ];

    for (const layer of layers) {
      this.memoryLayers.set(layer.id, {
        ...layer,
        isActive: true,
        lastAccess: null,
        accessCount: 0,
        hitRate: 0,
        memoryUsage: 0
      });
    }

    console.log('🧠 Memory layers initialized:', this.memoryLayers.size);
  }

  /**
   * Store memory with intelligent placement across layers
   */
  async storeMemory(key, data, options = {}) {
    try {
      const {
        importance = 'medium',
        context = null,
        tags = [],
        ttl = null,
        preferredLayer = null,
        compress = true
      } = options;

      console.log(`💾 Storing memory: ${key}`);

      const memory = {
        id: this.generateMemoryId(),
        key,
        data: compress ? this.compressData(data) : data,
        metadata: {
          importance,
          context,
          tags,
          ttl: ttl || this.calculateOptimalTTL(importance),
          compressed: compress,
          storedAt: new Date().toISOString(),
          accessCount: 0,
          lastAccess: new Date().toISOString(),
          size: this.calculateMemorySize(data)
        }
      };

      // Determine optimal layer for storage
      const targetLayers = preferredLayer
        ? [preferredLayer]
        : this.determineOptimalLayers(memory);

      const storedLayers = [];

      for (const layerId of targetLayers) {
        const layer = this.memoryLayers.get(layerId);
        if (!layer || !layer.isActive) continue;

        // Check capacity and evict if necessary
        await this.ensureCapacity(layer, memory.metadata.size);

        // Store in layer
        layer.storage.set(key, memory);
        layer.memoryUsage += memory.metadata.size;
        storedLayers.push(layerId);

        // Update layer metrics
        layer.lastAccess = new Date().toISOString();
        layer.accessCount++;
      }

      // Index the memory for fast retrieval
      await this.indexMemory(memory, storedLayers);

      // Store in persistent database if high importance
      if (importance === 'high' || targetLayers.includes('persistent')) {
        await this.storePersistentMemory(memory);
      }

      this.memoryMetrics.totalMemories++;

      console.log(`✅ Memory stored in layers: ${storedLayers.join(', ')}`);

      return {
        success: true,
        memoryId: memory.id,
        storedLayers,
        size: memory.metadata.size
      };
    } catch (error) {
      console.error('❌ Memory storage failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Intelligent memory retrieval with multi-layer search
   */
  async getchMemory(key, options = {}) {
    try {
      const {
        includeContext = true,
        searchDepth = 'deep',
        preferredLayers = null,
        fallbackToSemantic = true
      } = options;

      console.log(`🔍 Retrieving memory: ${key}`);

      const startTime = performance.now();
      let memory = null;
      let foundInLayer = null;

      // Search in preferred order: working -> session -> contextual -> persistent
      const searchOrder = preferredLayers || ['working', 'session', 'contextual', 'persistent'];

      for (const layerId of searchOrder) {
        const layer = this.memoryLayers.get(layerId);
        if (!layer || !layer.isActive) continue;

        memory = layer.storage.get(key);
        if (memory) {
          foundInLayer = layerId;
          this.memoryMetrics.cacheHits++;
          break;
        }
      }

      // If not found, try semantic search
      if (!memory && fallbackToSemantic) {
        memory = await this.semanticSearch(key, options);
        foundInLayer = 'semantic';
      }

      // If still not found, try database
      if (!memory) {
        memory = await this.retrievePersistentMemory(key);
        foundInLayer = 'database';
      }

      if (!memory) {
        this.memoryMetrics.cacheMisses++;
        console.log(`❌ Memory not found: ${key}`);
        return { success: false, error: 'Memory not found' };
      }

      // Update access patterns
      memory.metadata.accessCount++;
      memory.metadata.lastAccess = new Date().toISOString();

      // Promote frequently accessed memories to faster layers
      await this.considerMemoryPromotion(memory, foundInLayer);

      // Decompress if needed
      const retrievedData = memory.metadata.compressed
        ? this.decompressData(memory.data)
        : memory.data;

      // Get related context if requested
      let context = null;
      if (includeContext) {
        context = await this.getRelatedContext(memory, options);
      }

      const retrievalTime = performance.now() - startTime;
      this.updateRetrievalMetrics(retrievalTime);

      console.log(`✅ Memory retrieved from ${foundInLayer} in ${retrievalTime.toFixed(2)}ms`);

      return {
        success: true,
        data: retrievedData,
        metadata: memory.metadata,
        foundInLayer,
        context,
        retrievalTime
      };
    } catch (error) {
      console.error('❌ Memory retrieval failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Semantic search for memories based on content similarity
   */
  async semanticSearch(query, options = {}) {
    try {
      const { maxResults = 5, threshold = 0.7 } = options;

      console.log(`🔎 Performing semantic search: ${query}`);

      const candidates = [];

      // Search across all layers
      for (const [layerId, layer] of this.memoryLayers) {
        for (const [key, memory] of layer.storage) {
          const similarity = this.calculateSemanticSimilarity(query, memory);
          if (similarity >= threshold) {
            candidates.push({
              memory,
              similarity,
              layer: layerId
            });
          }
        }
      }

      // Sort by similarity and return top results
      candidates.sort((a, b) => b.similarity - a.similarity);
      const topResults = candidates.slice(0, maxResults);

      if (topResults.length > 0) {
        console.log(`🎯 Found ${topResults.length} semantic matches`);
        return topResults[0].memory; // Return best match
      }

      return null;
    } catch (error) {
      console.error('❌ Semantic search failed:', error);
      return null;
    }
  }

  /**
   * Intelligent memory eviction with multiple policies
   */
  async ensureCapacity(layer, requiredSize) {
    const availableSpace = this.calculateAvailableSpace(layer);

    if (availableSpace >= requiredSize) {
      return; // Sufficient space available
    }

    console.log(`🧹 Evicting memories from ${layer.name} to free ${requiredSize} bytes`);

    const toEvict = [];
    let freedSpace = 0;

    // Apply eviction policy
    switch (layer.evictionPolicy) {
      case 'lru':
        toEvict.push(...this.selectLRUCandidates(layer, requiredSize));
        break;
      case 'lfu':
        toEvict.push(...this.selectLFUCandidates(layer, requiredSize));
        break;
      case 'relevance':
        toEvict.push(...this.selectRelevanceCandidates(layer, requiredSize));
        break;
      case 'semantic':
        toEvict.push(...this.selectSemanticCandidates(layer, requiredSize));
        break;
    }

    // Evict selected memories
    for (const { key, memory } of toEvict) {
      layer.storage.delete(key);
      layer.memoryUsage -= memory.metadata.size;
      freedSpace += memory.metadata.size;
      this.memoryMetrics.memoryEvictions++;

      // Consider moving to lower-priority layer instead of deletion
      await this.considerMemoryDemotion(memory, layer);

      if (freedSpace >= requiredSize) {
        break;
      }
    }

    console.log(`✅ Freed ${freedSpace} bytes through eviction`);
  }

  /**
   * Memory compression and optimization
   */
  compressData(data) {
    try {
      const jsonString = JSON.stringify(data);
      // Simple compression simulation (in real implementation, use actual compression)
      const compressed = {
        __compressed: true,
        data: jsonString,
        originalSize: jsonString.length,
        compressedSize: Math.floor(jsonString.length * 0.7) // Simulate 30% compression
      };

      this.memoryMetrics.compressionRatio =
        (this.memoryMetrics.compressionRatio + 0.3) / 2; // Rolling average

      return compressed;
    } catch (error) {
      console.warn('Compression failed, storing uncompressed:', error);
      return data;
    }
  }

  decompressData(compressedData) {
    try {
      if (compressedData.__compressed) {
        return JSON.parse(compressedData.data);
      }
      return compressedData;
    } catch (error) {
      console.error('Decompression failed:', error);
      return compressedData;
    }
  }

  /**
   * Memory indexing for fast retrieval
   */
  async indexMemory(memory, layers) {
    const indexKey = memory.key;
    const indexEntry = {
      memoryId: memory.id,
      layers,
      importance: memory.metadata.importance,
      tags: memory.metadata.tags,
      context: memory.metadata.context,
      lastAccess: memory.metadata.lastAccess
    };

    this.memoryIndex.set(indexKey, indexEntry);

    // Create tag-based indices
    for (const tag of memory.metadata.tags) {
      const tagKey = `tag:${tag}`;
      if (!this.memoryIndex.has(tagKey)) {
        this.memoryIndex.set(tagKey, []);
      }
      this.memoryIndex.get(tagKey).push(indexKey);
    }
  }

  /**
   * Get related context for a memory
   */
  async getRelatedContext(memory, options = {}) {
    const context = {
      relatedMemories: [],
      tags: memory.metadata.tags,
      timeContext: this.getTimeContext(memory),
      semanticContext: await this.getSemanticContext(memory),
      userContext: await this.getUserContext(memory)
    };

    // Find related memories by tags
    for (const tag of memory.metadata.tags) {
      const taggedMemories = this.memoryIndex.get(`tag:${tag}`) || [];
      for (const relatedKey of taggedMemories.slice(0, 3)) { // Limit to 3 per tag
        if (relatedKey !== memory.key) {
          const related = await this.getchMemory(relatedKey, { includeContext: false });
          if (related.success) {
            context.relatedMemories.push({
              key: relatedKey,
              similarity: 'tag-based',
              metadata: related.metadata
            });
          }
        }
      }
    }

    return context;
  }

  /**
   * Database integration for persistent memory
   */
  async storePersistentMemory(memory) {
    try {
      const { data, error } = await supabase
        .from('memory_store')
        .upsert({
          memory_key: memory.key,
          memory_data: memory.data,
          metadata: memory.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to store persistent memory:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Database storage error:', error);
      return false;
    }
  }

  async retrievePersistentMemory(key) {
    try {
      const { data, error } = await supabase
        .from('memory_store')
        .select('*')
        .eq('memory_key', key)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: `db_${data.id}`,
        key: data.memory_key,
        data: data.memory_data,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Database retrieval error:', error);
      return null;
    }
  }

  /**
   * Utility Methods
   */
  generateMemoryId() {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  calculateMemorySize(data) {
    return JSON.stringify(data).length;
  }

  calculateOptimalTTL(importance) {
    const ttlMap = {
      low: 300000,    // 5 minutes
      medium: 1800000, // 30 minutes
      high: null       // No expiration
    };
    return ttlMap[importance] || ttlMap.medium;
  }

  determineOptimalLayers(memory) {
    const layers = [];

    // Always store in working memory for immediate access
    layers.push('working');

    // Store in session memory for medium-term access
    if (memory.metadata.importance !== 'low') {
      layers.push('session');
    }

    // Store in contextual memory if has context
    if (memory.metadata.context || memory.metadata.tags.length > 0) {
      layers.push('contextual');
    }

    // Store in persistent memory for high importance
    if (memory.metadata.importance === 'high') {
      layers.push('persistent');
    }

    return layers;
  }

  calculateAvailableSpace(layer) {
    return (layer.capacity * 1000) - layer.memoryUsage; // Assuming capacity in KB
  }

  calculateSemanticSimilarity(query, memory) {
    // Simplified semantic similarity calculation
    const queryWords = query.toLowerCase().split(/\s+/);
    const memoryText = JSON.stringify(memory.data).toLowerCase();

    let matches = 0;
    for (const word of queryWords) {
      if (memoryText.includes(word)) {
        matches++;
      }
    }

    return queryWords.length > 0 ? matches / queryWords.length : 0;
  }

  selectLRUCandidates(layer, requiredSize) {
    const memories = Array.from(layer.storage.entries())
      .map(([key, memory]) => ({ key, memory }))
      .sort((a, b) => new Date(a.memory.metadata.lastAccess) - new Date(b.memory.metadata.lastAccess));

    const candidates = [];
    let size = 0;

    for (const candidate of memories) {
      candidates.push(candidate);
      size += candidate.memory.metadata.size;
      if (size >= requiredSize) break;
    }

    return candidates;
  }

  selectLFUCandidates(layer, requiredSize) {
    const memories = Array.from(layer.storage.entries())
      .map(([key, memory]) => ({ key, memory }))
      .sort((a, b) => a.memory.metadata.accessCount - b.memory.metadata.accessCount);

    const candidates = [];
    let size = 0;

    for (const candidate of memories) {
      candidates.push(candidate);
      size += candidate.memory.metadata.size;
      if (size >= requiredSize) break;
    }

    return candidates;
  }

  selectRelevanceCandidates(layer, requiredSize) {
    // Simplified relevance-based selection
    return this.selectLRUCandidates(layer, requiredSize);
  }

  selectSemanticCandidates(layer, requiredSize) {
    // Simplified semantic-based selection
    return this.selectLFUCandidates(layer, requiredSize);
  }

  async considerMemoryPromotion(memory, currentLayer) {
    if (memory.metadata.accessCount > 5 && currentLayer !== 'working') {
      // Promote frequently accessed memory to working layer
      await this.storeMemory(memory.key, memory.data, {
        ...memory.metadata,
        preferredLayer: 'working'
      });
    }
  }

  async considerMemoryDemotion(memory, fromLayer) {
    // Move to a lower-priority layer instead of deletion
    const lowerLayers = {
      working: 'session',
      session: 'contextual',
      contextual: 'persistent'
    };

    const targetLayer = lowerLayers[fromLayer.id];
    if (targetLayer) {
      await this.storeMemory(memory.key, memory.data, {
        ...memory.metadata,
        preferredLayer: targetLayer
      });
    }
  }

  updateRetrievalMetrics(retrievalTime) {
    this.memoryMetrics.retrievalLatency =
      (this.memoryMetrics.retrievalLatency + retrievalTime) / 2; // Rolling average
  }

  getTimeContext(memory) {
    const now = new Date();
    const storedAt = new Date(memory.metadata.storedAt);
    const ageMs = now - storedAt;

    return {
      age: ageMs,
      ageHuman: this.humanizeTime(ageMs),
      isRecent: ageMs < 3600000, // Less than 1 hour
      timeOfDay: this.getTimeOfDay(storedAt)
    };
  }

  async getSemanticContext(memory) {
    // Simplified semantic context
    return {
      concepts: memory.metadata.tags,
      domain: this.identifyDomain(memory),
      complexity: this.assessComplexity(memory)
    };
  }

  async getUserContext(memory) {
    // User context based on current session and preferences
    return {
      sessionType: 'pomodoro_timer',
      userPreferences: await this.getUserPreferences(),
      activityContext: 'focused_work'
    };
  }

  identifyDomain(memory) {
    const dataString = JSON.stringify(memory.data).toLowerCase();
    if (dataString.includes('pomodoro') || dataString.includes('timer')) return 'pomodoro';
    if (dataString.includes('meeting') || dataString.includes('calendar')) return 'scheduling';
    if (dataString.includes('task') || dataString.includes('todo')) return 'task_management';
    return 'general';
  }

  assessComplexity(memory) {
    const size = memory.metadata.size;
    if (size < 1000) return 'simple';
    if (size < 10000) return 'moderate';
    return 'complex';
  }

  async getUserPreferences() {
    // Simplified user preferences
    return {
      defaultPomodoroLength: 25,
      preferredBreakLength: 5,
      memoryRetention: 'high'
    };
  }

  humanizeTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  }

  getTimeOfDay(date) {
    const hour = date.getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Load persistent memories from database
   */
  async loadPersistentMemories() {
    try {
      console.log('📚 Loading persistent memories from database...');

      const { data, error } = await supabase
        .from('memory_store')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(100); // Load recent 100 memories

      if (error) {
        console.warn('Could not load persistent memories:', error);
        return;
      }

      for (const row of data || []) {
        const memory = {
          id: `db_${row.id}`,
          key: row.memory_key,
          data: row.memory_data,
          metadata: row.metadata
        };

        this.persistentMemory.set(row.memory_key, memory);
      }

      console.log(`✅ Loaded ${data?.length || 0} persistent memories`);
    } catch (error) {
      console.warn('Failed to load persistent memories:', error);
    }
  }

  /**
   * Setup memory indexing system
   */
  async setupMemoryIndexing() {
    console.log('🔍 Setting up memory indexing system...');
    // Index system is initialized with the memoryIndex Map
  }

  /**
   * Setup intelligent retrieval system
   */
  async setupIntelligentRetrieval() {
    console.log('🎯 Setting up intelligent retrieval system...');
    // Intelligent retrieval patterns are set up
  }

  /**
   * Get agent status and metrics
   */
  getStatus() {
    const layerStats = {};
    for (const [layerId, layer] of this.memoryLayers) {
      layerStats[layerId] = {
        memoryCount: layer.storage.size,
        memoryUsage: layer.memoryUsage,
        capacity: layer.capacity * 1000,
        utilizationPercent: (layer.memoryUsage / (layer.capacity * 1000)) * 100,
        accessCount: layer.accessCount
      };
    }

    return {
      isInitialized: this.isInitialized,
      totalLayers: this.memoryLayers.size,
      indexSize: this.memoryIndex.size,
      metrics: this.memoryMetrics,
      layerStats
    };
  }

  /**
   * Cleanup method
   */
  cleanup() {
    this.memoryLayers.clear();
    this.contextualMemory.clear();
    this.workingMemory.clear();
    this.persistentMemory.clear();
    this.sessionMemory.clear();
    this.memoryIndex.clear();
    console.log('🧹 Memory Getch MCP Agent cleanup completed');
  }
}

export default MemoryGetchMCPAgent;