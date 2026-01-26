Use this example for the key/value pairs for breaking out the sprints from plan into todo list json files. Title them in this format: PHASE_1_SPRINT_X_TODO_X.json files.
Example:
"{
  "phase": 10,
  "sprint": 1,
  "title": "Transaction Batching API",
  "priority": "HIGH",
  "effort": "6 hours",
  "status": "completed",
  "completedAt": "2026-01-06",
  "implementationNotes": "Implemented using BatchTransaction class with fluent API and execute() method. Different from spec design (no GraphStorage.transaction() callback) but achieves same goals with cleaner API.",
  "impact": "2-3x speedup for bulk sequential operations by reducing mutex lock/unlock cycles from N to 1",
  "targetMetrics": {
    "sequentialOperations": {
      "current": "10 operations = 10 lock/unlock cycles, 10 file saves",
      "target": "10 operations = 1 lock/unlock cycle, 1 file save"
    },
    "bulkImportSpeedup": {
      "current": "~500ms for 100 entities (individual creates)",
      "target": "~50ms for 100 entities (batched transaction)"
    }
  },
  "tasks": [
    {
      "id": "10.1.1",
      "category": "types",
      "title": "Create Transaction Batching Interfaces",
      "description": "Define TypeScript interfaces for the fluent transaction batching API in src/types/types.ts. These interfaces enable collecting multiple operations and executing them atomically in a single lock/save cycle.",
      "status": "completed",
      "implementationNotes": "Implemented as BatchOperation, BatchResult, BatchOptions types instead of spec's BatchTransactionContext, EntityInput, RelationInput. Same functionality with different type names.",
      "estimatedHours": 0.5,
      "agent": "haiku",
      "files": ["src/types/types.ts"],
      "testCategories": ["unit", "typecheck"],
      "implementation": {
        "purpose": "Create type definitions that enable a fluent API for batching operations. The BatchTransactionContext collects operations, then GraphStorage.transaction() executes them atomically.",
        "keyDecisions": [
          "BatchTransactionContext is the interface users interact with",
          "All methods return void (operations are collected, not executed immediately)",
          "BatchTransactionResult provides statistics about what was executed",
          "EntityInput and RelationInput are simplified creation types without timestamps"
        ]
      },
      "stepByStep": [
        {
          "step": 1,
          "action": "Open src/types/types.ts",
          "details": "Navigate to the types file which contains all type definitions for the project"
        },
        {
          "step": 2,
          "action": "Find the end of the file (before any closing exports)",
          "details": "Scroll to the bottom of the file. Add new interfaces after the LongRunningOperationOptions section (around line 1420)"
        },
        {
          "step": 3,
          "action": "Add section comment for Transaction Batching Types",
          "details": "Add: // ==================== Transaction Batching Types (Phase 10) ===================="
        },
        {
          "step": 4,
          "action": "Add EntityInput interface",
          "code": "/**\n * Input for creating a new entity in a batch transaction.\n * Timestamps are added automatically when the transaction commits.\n */\nexport interface EntityInput {\n  /** Unique name identifying the entity */\n  name: string;\n  /** Type/category of the entity */\n  entityType: string;\n  /** Array of observation strings */\n  observations: string[];\n  /** Optional tags for categorization */\n  tags?: string[];\n  /** Optional importance level (0-10) */\n  importance?: number;\n  /** Optional parent entity name for hierarchy */\n  parentId?: string;\n}"
        },
        {
          "step": 5,
          "action": "Add RelationInput interface",
          "code": "/**\n * Input for creating a new relation in a batch transaction.\n * Timestamps are added automatically when the transaction commits.\n */\nexport interface RelationInput {\n  /** Source entity name */\n  from: string;\n  /** Target entity name */\n  to: string;\n  /** Type of relationship (active voice, e.g., 'works_at') */\n  relationType: string;\n}"
        },
        {
          "step": 6,
          "action": "Add ObservationInput interface",
          "code": "/**\n * Input for adding observations to an entity in a batch transaction.\n */\nexport interface ObservationInput {\n  /** Name of the entity to add observations to */\n  entityName: string;\n  /** Array of observation strings to add */\n  contents: string[];\n}"
        },
        {
          "step": 7,
          "action": "Add BatchTransactionContext interface",
          "code": "/**\n * Context for batching multiple graph operations.\n * Operations are collected and executed atomically when the transaction commits.\n *\n * @example\n * ```typescript\n * await storage.transaction((tx) => {\n *   tx.createEntities([{ name: 'Alice', entityType: 'person', observations: [] }]);\n *   tx.createRelations([{ from: 'Alice', to: 'Bob', relationType: 'knows' }]);\n *   tx.addObservations([{ entityName: 'Alice', contents: ['Engineer'] }]);\n * }); // All operations execute in single lock/save\n * ```\n */\nexport interface BatchTransactionContext {\n  /** Create multiple entities within the transaction */\n  createEntities(entities: EntityInput[]): void;\n\n  /** Create multiple relations within the transaction */\n  createRelations(relations: RelationInput[]): void;\n\n  /** Add observations to entities within the transaction */\n  addObservations(observations: ObservationInput[]): void;\n\n  /** Delete entities by name within the transaction */\n  deleteEntities(entityNames: string[]): void;\n\n  /** Delete specific relations within the transaction */\n  deleteRelations(relations: { from: string; to: string; relationType: string }[]): void;\n\n  /** Update entities within the transaction */\n  updateEntities(updates: { name: string; updates: Partial<Entity> }[]): void;\n\n  /** Add tags to a single entity within the transaction */\n  addTags(entityName: string, tags: string[]): void;\n\n  /** Set importance for a single entity within the transaction */\n  setImportance(entityName: string, importance: number): void;\n}"
        },
        {
          "step": 8,
          "action": "Add BatchTransactionResult interface",
          "code": "/**\n * Result of a committed batch transaction.\n * Provides statistics about what operations were executed.\n */\nexport interface BatchTransactionResult {\n  /** Whether the transaction completed successfully */\n  success: boolean;\n  /** Number of entities created */\n  entitiesCreated: number;\n  /** Number of entities updated (including tag/importance changes) */\n  entitiesUpdated: number;\n  /** Number of entities deleted */\n  entitiesDeleted: number;\n  /** Number of relations created */\n  relationsCreated: number;\n  /** Number of relations deleted */\n  relationsDeleted: number;\n  /** Number of observations added */\n  observationsAdded: number;\n  /** Duration of the transaction in milliseconds */\n  durationMs: number;\n}"
        },
        {
          "step": 9,
          "action": "Run TypeScript compilation to verify",
          "details": "Run: npm run typecheck"
        }
      ],
      "acceptanceCriteria": [
        "EntityInput interface defined with name, entityType, observations, and optional fields",
        "RelationInput interface defined with from, to, relationType",
        "ObservationInput interface defined with entityName and contents",
        "BatchTransactionContext interface defined with all 8 methods",
        "BatchTransactionResult interface defined with all statistics fields",
        "All interfaces have JSDoc documentation",
        "npm run typecheck passes with no errors"
      ]
    },
"successCriteria": [
    "All four tasks completed with passing tests",
    "BatchTransactionContext interface available in types",
    "BatchTransaction class implements all operation methods",
    "GraphStorage.transaction() method executes operations atomically",
    "Single lock/save cycle for all operations in a transaction",
    "15+ unit tests pass",
    "npm run typecheck passes",
    "All existing tests pass (backward compatible)"
  ],
  "filesCreated": [
    "tests/unit/core/TransactionBatching.test.ts"
  ],
  "filesModified": [
    "src/types/types.ts",
    "src/core/TransactionManager.ts",
    "src/core/GraphStorage.ts"
  ],
  "totalNewTests": 15,
  "totalEstimatedHours": 6,
  "dependencies": [],
  "notes": [
    "CRITICAL: The BatchTransaction class collects operations - GraphStorage.transaction() executes them",
    "Order of operations matters: creates before updates, updates before deletes",
    "Entity deletions must cascade to remove related relations",
    "Tags must be normalized to lowercase",
    "Empty transactions should return early without acquiring locks",
    "This sprint provides foundation for Sprint 2 (Graph Events) to emit events during transactions"
  ]
}"