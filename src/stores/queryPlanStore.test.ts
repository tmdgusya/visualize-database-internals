import { describe, it, expect, beforeEach } from 'vitest';
import {
  useQueryPlanStore,
  parseSQLQuery,
  generatePlanFromSQL,
  PRESET_QUERIES,
  COST_CONSTANTS,
} from './queryPlanStore';

describe('QueryPlanStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useQueryPlanStore.getState().clearPlan();
    useQueryPlanStore.getState().reset();
  });

  describe('parseSQLQuery', () => {
    it('should parse a simple SELECT query', () => {
      const sql = 'SELECT * FROM users WHERE age > 25';
      const result = parseSQLQuery(sql);

      expect(result.type).toBe('SELECT');
      expect(result.tables).toContain('users');
      expect(result.conditions).toContain('age > 25');
    });

    it('should parse a JOIN query', () => {
      const sql = 'SELECT u.name, o.amount FROM users u JOIN orders o ON u.id = o.user_id';
      const result = parseSQLQuery(sql);

      expect(result.type).toBe('SELECT');
      expect(result.tables).toContain('users');
      expect(result.tables).toContain('orders');
      expect(result.joins).toContain('orders');
    });

    it('should parse aggregate functions', () => {
      const sql = 'SELECT COUNT(*), AVG(salary) FROM employees';
      const result = parseSQLQuery(sql);

      expect(result.aggregates).toContain('COUNT');
      expect(result.aggregates).toContain('AVG');
    });

    it('should parse GROUP BY clause', () => {
      const sql = 'SELECT department, COUNT(*) FROM employees GROUP BY department';
      const result = parseSQLQuery(sql);

      expect(result.groupBy).toContain('department');
    });

    it('should parse ORDER BY clause', () => {
      const sql = 'SELECT * FROM users ORDER BY name DESC';
      const result = parseSQLQuery(sql);

      expect(result.orderBy.length).toBeGreaterThan(0);
    });

    it('should parse LIMIT clause', () => {
      const sql = 'SELECT * FROM users LIMIT 10';
      const result = parseSQLQuery(sql);

      expect(result.limit).toBe(10);
    });

    it('should handle INSERT queries', () => {
      const sql = 'INSERT INTO users (name) VALUES (\'John\')';
      const result = parseSQLQuery(sql);

      expect(result.type).toBe('INSERT');
    });

    it('should handle UPDATE queries', () => {
      const sql = 'UPDATE users SET name = \'Jane\' WHERE id = 1';
      const result = parseSQLQuery(sql);

      expect(result.type).toBe('UPDATE');
    });

    it('should handle DELETE queries', () => {
      const sql = 'DELETE FROM users WHERE id = 1';
      const result = parseSQLQuery(sql);

      expect(result.type).toBe('DELETE');
    });
  });

  describe('generatePlanFromSQL', () => {
    it('should generate a plan for simple SELECT', () => {
      const sql = 'SELECT * FROM users';
      const plan = generatePlanFromSQL(sql);

      expect(plan).not.toBeNull();
      expect(plan?.type).toBeDefined();
      expect(plan?.cost).toBeDefined();
      expect(plan?.rows).toBeGreaterThan(0);
    });

    it('should generate a plan with SeqScan for simple queries', () => {
      const sql = 'SELECT * FROM users';
      const plan = generatePlanFromSQL(sql);

      expect(plan?.type).toBe('SeqScan');
      expect(plan?.table).toBe('users');
    });

    it('should generate a plan with IndexScan for id conditions', () => {
      const sql = 'SELECT * FROM users WHERE id = 123';
      const plan = generatePlanFromSQL(sql);

      // Should use index scan due to id condition
      expect(['IndexScan', 'IndexOnlyScan']).toContain(plan?.type);
    });

    it('should generate a plan with JOIN', () => {
      const sql = 'SELECT * FROM users JOIN orders ON users.id = orders.user_id';
      const plan = generatePlanFromSQL(sql);

      expect(['NestedLoop', 'HashJoin', 'MergeJoin']).toContain(plan?.type);
      expect(plan?.children.length).toBe(2);
    });

    it('should generate a plan with Aggregate', () => {
      const sql = 'SELECT COUNT(*) FROM users GROUP BY status';
      const plan = generatePlanFromSQL(sql);

      expect(plan?.type).toBe('Aggregate');
    });

    it('should generate a plan with Sort', () => {
      const sql = 'SELECT * FROM users ORDER BY name';
      const plan = generatePlanFromSQL(sql);

      expect(plan?.type).toBe('Sort');
      expect(plan?.sortKeys).toBeDefined();
    });

    it('should generate a plan with Limit', () => {
      const sql = 'SELECT * FROM users LIMIT 10';
      const plan = generatePlanFromSQL(sql);

      expect(plan?.type).toBe('Limit');
      expect(plan?.rows).toBe(10);
    });

    it('should return null for non-SELECT queries', () => {
      const sql = 'INSERT INTO users (name) VALUES (\'John\')';
      const plan = generatePlanFromSQL(sql);

      expect(plan).toBeNull();
    });

    it('should return null for empty SQL', () => {
      const plan = generatePlanFromSQL('');
      expect(plan).toBeNull();
    });
  });

  describe('COST_CONSTANTS', () => {
    it('should have expected cost constants', () => {
      expect(COST_CONSTANTS.seq_page_cost).toBe(1.0);
      expect(COST_CONSTANTS.random_page_cost).toBe(4.0);
      expect(COST_CONSTANTS.cpu_tuple_cost).toBe(0.01);
      expect(COST_CONSTANTS.cpu_index_tuple_cost).toBe(0.005);
      expect(COST_CONSTANTS.cpu_operator_cost).toBe(0.0025);
    });
  });

  describe('PRESET_QUERIES', () => {
    it('should have all preset queries defined', () => {
      expect(PRESET_QUERIES.simple).toBeDefined();
      expect(PRESET_QUERIES.join).toBeDefined();
      expect(PRESET_QUERIES.aggregate).toBeDefined();
      expect(PRESET_QUERIES.subquery).toBeDefined();
      expect(PRESET_QUERIES.index).toBeDefined();
      expect(PRESET_QUERIES.complex).toBeDefined();
    });

    it('should have valid SQL in preset queries', () => {
      Object.entries(PRESET_QUERIES).forEach(([key, sql]) => {
        expect(sql).toContain('SELECT');
        expect(sql.length).toBeGreaterThan(10);
      });
    });
  });

  describe('store state management', () => {
    it('should parse SQL and set plan tree', () => {
      const sql = 'SELECT * FROM users';
      useQueryPlanStore.getState().parseSQL(sql);

      expect(useQueryPlanStore.getState().sql).toBe(sql);
      expect(useQueryPlanStore.getState().planTree).not.toBeNull();
    });

    it('should clear plan', () => {
      useQueryPlanStore.getState().parseSQL('SELECT * FROM users');
      useQueryPlanStore.getState().clearPlan();

      expect(useQueryPlanStore.getState().planTree).toBeNull();
      expect(useQueryPlanStore.getState().sql).toBe('');
    });

    it('should select node', () => {
      useQueryPlanStore.getState().parseSQL('SELECT * FROM users');
      const plan = useQueryPlanStore.getState().planTree;

      if (plan) {
        useQueryPlanStore.getState().selectNode(plan.id);
        expect(useQueryPlanStore.getState().selectedNode).toBe(plan.id);
      }
    });

    it('should deselect node', () => {
      useQueryPlanStore.getState().selectNode('some-node');
      useQueryPlanStore.getState().selectNode(null);
      expect(useQueryPlanStore.getState().selectedNode).toBeNull();
    });

    it('should reset execution state', () => {
      useQueryPlanStore.getState().parseSQL('SELECT * FROM users');
      useQueryPlanStore.getState().startExecution();
      useQueryPlanStore.getState().reset();

      expect(useQueryPlanStore.getState().executionState).toBe('idle');
      expect(useQueryPlanStore.getState().currentStep).toBe(0);
      expect(useQueryPlanStore.getState().executionLog).toEqual([]);
      expect(useQueryPlanStore.getState().currentNodeId).toBeNull();
    });

    it('should update animation speed', () => {
      useQueryPlanStore.getState().setAnimationSpeed(1000);
      expect(useQueryPlanStore.getState().animationSpeed).toBe(1000);
    });

    it('should toggle show costs', () => {
      const initial = useQueryPlanStore.getState().showCosts;
      useQueryPlanStore.getState().setShowCosts(!initial);
      expect(useQueryPlanStore.getState().showCosts).toBe(!initial);
    });

    it('should toggle show actuals', () => {
      const initial = useQueryPlanStore.getState().showActuals;
      useQueryPlanStore.getState().setShowActuals(!initial);
      expect(useQueryPlanStore.getState().showActuals).toBe(!initial);
    });
  });

  describe('store computed helpers', () => {
    beforeEach(() => {
      useQueryPlanStore.getState().parseSQL('SELECT * FROM users');
    });

    it('should get node by id', () => {
      const plan = useQueryPlanStore.getState().planTree;
      if (plan) {
        const node = useQueryPlanStore.getState().getNodeById(plan.id);
        expect(node).not.toBeNull();
        expect(node?.id).toBe(plan.id);
      }
    });

    it('should return null for non-existent node', () => {
      const node = useQueryPlanStore.getState().getNodeById('non-existent');
      expect(node).toBeNull();
    });

    it('should get total cost', () => {
      const totalCost = useQueryPlanStore.getState().getTotalCost();
      expect(totalCost).toBeGreaterThanOrEqual(0);
    });

    it('should get total rows', () => {
      const totalRows = useQueryPlanStore.getState().getTotalRows();
      expect(totalRows).toBeGreaterThan(0);
    });

    it('should get node count', () => {
      const nodeCount = useQueryPlanStore.getState().getNodeCount();
      expect(nodeCount).toBeGreaterThan(0);
    });

    it('should get max depth', () => {
      const depth = useQueryPlanStore.getState().getMaxDepth();
      expect(depth).toBeGreaterThan(0);
    });
  });

  describe('complex query plans', () => {
    it('should handle complex query with multiple operations', () => {
      const sql = `
        SELECT c.name, COUNT(o.id) as order_count
        FROM customers c
        JOIN orders o ON c.id = o.customer_id
        WHERE o.created_at > '2024-01-01'
        GROUP BY c.name
        ORDER BY order_count DESC
        LIMIT 10
      `;

      useQueryPlanStore.getState().parseSQL(sql);
      const plan = useQueryPlanStore.getState().planTree;

      expect(plan).not.toBeNull();
      expect(useQueryPlanStore.getState().getNodeCount()).toBeGreaterThan(1);
      expect(useQueryPlanStore.getState().getMaxDepth()).toBeGreaterThan(1);
    });

    it('should handle subqueries', () => {
      const sql = `
        SELECT name FROM products
        WHERE category_id IN (
          SELECT id FROM categories WHERE name = 'Electronics'
        )
      `;

      useQueryPlanStore.getState().parseSQL(sql);
      const plan = useQueryPlanStore.getState().planTree;

      expect(plan).not.toBeNull();
    });
  });

  describe('execution state transitions', () => {
    beforeEach(() => {
      useQueryPlanStore.getState().parseSQL('SELECT * FROM users');
    });

    it('should start in idle state', () => {
      expect(useQueryPlanStore.getState().executionState).toBe('idle');
    });

    it('should transition to running on start', () => {
      useQueryPlanStore.getState().startExecution();
      expect(useQueryPlanStore.getState().executionState).toBe('running');
    });

    it('should transition to paused on pause', () => {
      useQueryPlanStore.getState().startExecution();
      useQueryPlanStore.getState().pause();
      expect(useQueryPlanStore.getState().executionState).toBe('paused');
    });

    it('should add log entries during execution', () => {
      useQueryPlanStore.getState().startExecution();

      // Wait a bit for execution to start
      setTimeout(() => {
        expect(useQueryPlanStore.getState().executionLog.length).toBeGreaterThan(0);
      }, 100);
    });
  });
});
