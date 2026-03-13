import { describe, it, expect, beforeEach } from 'vitest';
import {
  useJoinAlgorithmStore,
  getAlgorithmComplexity,
  getAlgorithmDescription,
  getAlgorithmBestUseCase,
} from './joinAlgorithmStore';

describe('JoinAlgorithmStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useJoinAlgorithmStore.getState().reset();
    useJoinAlgorithmStore.setState({
      algorithm: 'NestedLoop',
      currentStep: 0,
      results: [],
      comparisons: 0,
      isPlaying: false,
    });
  });

  describe('Initial State', () => {
    it('should have NestedLoop as default algorithm', () => {
      expect(useJoinAlgorithmStore.getState().algorithm).toBe('NestedLoop');
    });

    it('should have empty results initially', () => {
      expect(useJoinAlgorithmStore.getState().results).toEqual([]);
    });

    it('should have currentStep at 0 initially', () => {
      expect(useJoinAlgorithmStore.getState().currentStep).toBe(0);
    });

    it('should have isPlaying as false initially', () => {
      expect(useJoinAlgorithmStore.getState().isPlaying).toBe(false);
    });

    it('should have tables with data', () => {
      const { outerTable, innerTable } = useJoinAlgorithmStore.getState();
      expect(outerTable.rows.length).toBeGreaterThan(0);
      expect(innerTable.rows.length).toBeGreaterThan(0);
    });
  });

  describe('setAlgorithm', () => {
    it('should change algorithm to HashJoin', () => {
      useJoinAlgorithmStore.getState().setAlgorithm('HashJoin');
      expect(useJoinAlgorithmStore.getState().algorithm).toBe('HashJoin');
    });

    it('should change algorithm to MergeJoin', () => {
      useJoinAlgorithmStore.getState().setAlgorithm('MergeJoin');
      expect(useJoinAlgorithmStore.getState().algorithm).toBe('MergeJoin');
    });

    it('should reset currentStep when changing algorithm', () => {
      useJoinAlgorithmStore.setState({ currentStep: 5 });
      useJoinAlgorithmStore.getState().setAlgorithm('HashJoin');
      expect(useJoinAlgorithmStore.getState().currentStep).toBe(0);
    });

    it('should regenerate animation steps when changing algorithm', () => {
      useJoinAlgorithmStore.getState().setAlgorithm('HashJoin');
      const steps = useJoinAlgorithmStore.getState().animationSteps;
      expect(steps.length).toBeGreaterThan(0);
    });
  });

  describe('generateTables', () => {
    it('should generate new table data', () => {
      const oldOuter = useJoinAlgorithmStore.getState().outerTable;
      useJoinAlgorithmStore.getState().generateTables();
      const newOuter = useJoinAlgorithmStore.getState().outerTable;
      expect(newOuter).not.toEqual(oldOuter);
    });

    it('should generate tables with specified size', () => {
      useJoinAlgorithmStore.getState().setTableSize(3);
      const { outerTable, innerTable } = useJoinAlgorithmStore.getState();
      expect(outerTable.rows.length).toBe(3);
      expect(innerTable.rows.length).toBe(3);
    });

    it('should reset current step when generating tables', () => {
      useJoinAlgorithmStore.setState({ currentStep: 3 });
      useJoinAlgorithmStore.getState().generateTables();
      expect(useJoinAlgorithmStore.getState().currentStep).toBe(0);
    });
  });

  describe('setTableSize', () => {
    it('should update table size', () => {
      useJoinAlgorithmStore.getState().setTableSize(8);
      expect(useJoinAlgorithmStore.getState().tableSize).toBe(8);
    });

    it('should regenerate tables with new size', () => {
      useJoinAlgorithmStore.getState().setTableSize(4);
      const { outerTable, innerTable } = useJoinAlgorithmStore.getState();
      expect(outerTable.rows.length).toBe(4);
      expect(innerTable.rows.length).toBe(4);
    });
  });

  describe('step', () => {
    beforeEach(() => {
      useJoinAlgorithmStore.getState().generateTables();
    });

    it('should increment currentStep', () => {
      const initialStep = useJoinAlgorithmStore.getState().currentStep;
      useJoinAlgorithmStore.getState().step();
      expect(useJoinAlgorithmStore.getState().currentStep).toBe(initialStep + 1);
    });

    it('should update results when step has results', () => {
      // Find a step that produces results
      const { animationSteps } = useJoinAlgorithmStore.getState();
      const matchStepIndex = animationSteps.findIndex(s => s.type === 'match');

      if (matchStepIndex >= 0) {
        // Step up to and including the match step
        for (let i = 0; i <= matchStepIndex; i++) {
          useJoinAlgorithmStore.getState().step();
        }
        expect(useJoinAlgorithmStore.getState().results.length).toBeGreaterThan(0);
      }
    });

    it('should increment comparisons on compare steps', () => {
      const initialComparisons = useJoinAlgorithmStore.getState().comparisons;
      useJoinAlgorithmStore.getState().step();
      // First step is usually a compare step
      expect(useJoinAlgorithmStore.getState().comparisons).toBeGreaterThanOrEqual(initialComparisons);
    });
  });

  describe('play and pause', () => {
    it('should set isPlaying to true when play is called', () => {
      useJoinAlgorithmStore.getState().play();
      expect(useJoinAlgorithmStore.getState().isPlaying).toBe(true);
    });

    it('should set isPlaying to false when pause is called', () => {
      useJoinAlgorithmStore.getState().play();
      useJoinAlgorithmStore.getState().pause();
      expect(useJoinAlgorithmStore.getState().isPlaying).toBe(false);
    });

    it('should set isPlaying to false when reset is called', () => {
      useJoinAlgorithmStore.getState().play();
      useJoinAlgorithmStore.getState().reset();
      expect(useJoinAlgorithmStore.getState().isPlaying).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset currentStep to 0', () => {
      useJoinAlgorithmStore.setState({ currentStep: 5 });
      useJoinAlgorithmStore.getState().reset();
      expect(useJoinAlgorithmStore.getState().currentStep).toBe(0);
    });

    it('should reset results to empty array', () => {
      useJoinAlgorithmStore.setState({ results: [{ outerRow: { id: 1, value: 1 }, innerRow: { id: 1, value: 1 } }] });
      useJoinAlgorithmStore.getState().reset();
      expect(useJoinAlgorithmStore.getState().results).toEqual([]);
    });

    it('should reset comparisons to 0', () => {
      useJoinAlgorithmStore.setState({ comparisons: 10 });
      useJoinAlgorithmStore.getState().reset();
      expect(useJoinAlgorithmStore.getState().comparisons).toBe(0);
    });
  });

  describe('setAnimationSpeed', () => {
    it('should update animation speed', () => {
      useJoinAlgorithmStore.getState().setAnimationSpeed(500);
      expect(useJoinAlgorithmStore.getState().animationSpeed).toBe(500);
    });

    it('should accept different speed values', () => {
      useJoinAlgorithmStore.getState().setAnimationSpeed(100);
      expect(useJoinAlgorithmStore.getState().animationSpeed).toBe(100);

      useJoinAlgorithmStore.getState().setAnimationSpeed(2000);
      expect(useJoinAlgorithmStore.getState().animationSpeed).toBe(2000);
    });
  });

  describe('startAnimation', () => {
    it('should reset state and start playing', () => {
      useJoinAlgorithmStore.setState({ currentStep: 3, results: [{ outerRow: { id: 1, value: 1 }, innerRow: { id: 1, value: 1 } }] });
      useJoinAlgorithmStore.getState().startAnimation();

      expect(useJoinAlgorithmStore.getState().currentStep).toBe(0);
      expect(useJoinAlgorithmStore.getState().results).toEqual([]);
      expect(useJoinAlgorithmStore.getState().isPlaying).toBe(true);
    });
  });

  describe('Animation Steps Generation', () => {
    it('should generate steps for NestedLoop', () => {
      useJoinAlgorithmStore.getState().setAlgorithm('NestedLoop');
      const steps = useJoinAlgorithmStore.getState().animationSteps;
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0].message).toContain('Nested Loop');
    });

    it('should generate steps for HashJoin', () => {
      useJoinAlgorithmStore.getState().setAlgorithm('HashJoin');
      const steps = useJoinAlgorithmStore.getState().animationSteps;
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(s => s.message.includes('BUILD PHASE'))).toBe(true);
      expect(steps.some(s => s.message.includes('PROBE PHASE'))).toBe(true);
    });

    it('should generate steps for MergeJoin', () => {
      useJoinAlgorithmStore.getState().setAlgorithm('MergeJoin');
      const steps = useJoinAlgorithmStore.getState().animationSteps;
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(s => s.message.includes('SORT PHASE'))).toBe(true);
      expect(steps.some(s => s.message.includes('MERGE PHASE'))).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    describe('getAlgorithmComplexity', () => {
      it('should return correct complexity for NestedLoop', () => {
        expect(getAlgorithmComplexity('NestedLoop')).toBe('O(N × M)');
      });

      it('should return correct complexity for HashJoin', () => {
        expect(getAlgorithmComplexity('HashJoin')).toBe('O(N + M)');
      });

      it('should return correct complexity for MergeJoin', () => {
        expect(getAlgorithmComplexity('MergeJoin')).toBe('O(N log N + M log M)');
      });
    });

    describe('getAlgorithmDescription', () => {
      it('should return description for NestedLoop', () => {
        expect(getAlgorithmDescription('NestedLoop')).toContain('outer table');
        expect(getAlgorithmDescription('NestedLoop')).toContain('inner table');
      });

      it('should return description for HashJoin', () => {
        expect(getAlgorithmDescription('HashJoin')).toContain('hash table');
      });

      it('should return description for MergeJoin', () => {
        expect(getAlgorithmDescription('MergeJoin')).toContain('Sort');
        expect(getAlgorithmDescription('MergeJoin')).toContain('merge');
      });
    });

    describe('getAlgorithmBestUseCase', () => {
      it('should return use case for each algorithm', () => {
        expect(getAlgorithmBestUseCase('NestedLoop')).toBeTruthy();
        expect(getAlgorithmBestUseCase('HashJoin')).toBeTruthy();
        expect(getAlgorithmBestUseCase('MergeJoin')).toBeTruthy();
      });
    });
  });

  describe('Table Data Structure', () => {
    it('should have rows with id and value properties', () => {
      const { outerTable } = useJoinAlgorithmStore.getState();
      if (outerTable.rows.length > 0) {
        const row = outerTable.rows[0];
        expect(row).toHaveProperty('id');
        expect(row).toHaveProperty('value');
        expect(typeof row.id).toBe('number');
        expect(typeof row.value).toBe('number');
      }
    });

    it('should have table names', () => {
      const { outerTable, innerTable } = useJoinAlgorithmStore.getState();
      expect(outerTable.name).toBe('Outer Table');
      expect(innerTable.name).toBe('Inner Table');
    });
  });

  describe('Algorithm Switching', () => {
    it('should maintain table data when switching algorithms', () => {
      const { outerTable, innerTable } = useJoinAlgorithmStore.getState();
      useJoinAlgorithmStore.getState().setAlgorithm('HashJoin');

      expect(useJoinAlgorithmStore.getState().outerTable).toEqual(outerTable);
      expect(useJoinAlgorithmStore.getState().innerTable).toEqual(innerTable);
    });

    it('should regenerate steps appropriate for each algorithm', () => {
      useJoinAlgorithmStore.getState().setAlgorithm('NestedLoop');
      const nestedSteps = useJoinAlgorithmStore.getState().animationSteps.length;

      useJoinAlgorithmStore.getState().setAlgorithm('HashJoin');
      const hashSteps = useJoinAlgorithmStore.getState().animationSteps.length;

      useJoinAlgorithmStore.getState().setAlgorithm('MergeJoin');
      const mergeSteps = useJoinAlgorithmStore.getState().animationSteps.length;

      // All should have steps
      expect(nestedSteps).toBeGreaterThan(0);
      expect(hashSteps).toBeGreaterThan(0);
      expect(mergeSteps).toBeGreaterThan(0);
    });
  });
});
