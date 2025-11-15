interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { label: string };
}

interface Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  avgDegree: number;
  maxDegree: number;
  stronglyConnectedComponents: string[][];
  density: number;
  inDegrees: Map<string, number>;
  outDegrees: Map<string, number>;
  selfLoops: number;
  multiEdges: number;
}

interface Cycle {
  nodes: string[];
  length: number;
}

interface TinyCycle {
  node1: string;
  node2: string;
}

enum VisitStatus {
  NOT_VISITED = 'NOT_VISITED',
  CURRENTLY_VISITING = 'CURRENTLY_VISITING',
  VISITED = 'VISITED'
}

/**
 * Tarjan's algorithm for finding strongly connected components
 */
export class GraphAnalyzer {
  private index = 0;
  private stack: string[] = [];
  private indices = new Map<string, number>();
  private lowlinks = new Map<string, number>();
  private onStack = new Set<string>();
  private sccs: string[][] = [];

  /**
   * Find all strongly connected components using Tarjan's algorithm
   */
  findStronglyConnectedComponents(graphData: GraphData): string[][] {
    this.reset();
    
    const adjacencyList = this.buildAdjacencyList(graphData);
    
    for (const node of graphData.nodes) {
      if (!this.indices.has(node.id)) {
        this.strongConnect(node.id, adjacencyList);
      }
    }
    
    // Filter out single-node components (not cycles)
    return this.sccs.filter(scc => scc.length > 1);
  }

  private reset() {
    this.index = 0;
    this.stack = [];
    this.indices.clear();
    this.lowlinks.clear();
    this.onStack.clear();
    this.sccs = [];
  }

  private buildAdjacencyList(graphData: GraphData): Map<string, string[]> {
    const adjacencyList = new Map<string, string[]>();
    
    // Initialize all nodes
    for (const node of graphData.nodes) {
      adjacencyList.set(node.id, []);
    }
    
    // Add edges
    for (const edge of graphData.edges) {
      const neighbors = adjacencyList.get(edge.source) || [];
      neighbors.push(edge.target);
      adjacencyList.set(edge.source, neighbors);
    }
    
    return adjacencyList;
  }

  private strongConnect(nodeId: string, adjacencyList: Map<string, string[]>) {
    this.indices.set(nodeId, this.index);
    this.lowlinks.set(nodeId, this.index);
    this.index++;
    this.stack.push(nodeId);
    this.onStack.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighborId of neighbors) {
      if (!this.indices.has(neighborId)) {
        this.strongConnect(neighborId, adjacencyList);
        this.lowlinks.set(
          nodeId,
          Math.min(this.lowlinks.get(nodeId)!, this.lowlinks.get(neighborId)!)
        );
      } else if (this.onStack.has(neighborId)) {
        this.lowlinks.set(
          nodeId,
          Math.min(this.lowlinks.get(nodeId)!, this.indices.get(neighborId)!)
        );
      }
    }

    if (this.lowlinks.get(nodeId) === this.indices.get(nodeId)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = this.stack.pop()!;
        this.onStack.delete(w);
        scc.push(w);
      } while (w !== nodeId);
      
      this.sccs.push(scc);
    }
  }

  /**
   * Detect tiny cycles (2-node cycles) within a component
   * A tiny cycle exists when node A -> node B and node B -> node A
   */
  detectTinyCycles(graphData: GraphData, componentNodes: string[]): TinyCycle[] {
    const tinyCDs: TinyCycle[] = [];
    const nodeSet = new Set(componentNodes);
    const adjacencyList = this.buildAdjacencyList(graphData);
    
    // Filter adjacency list to only include nodes in component
    const componentAdj = new Map<string, string[]>();
    for (const node of componentNodes) {
      const neighbors = (adjacencyList.get(node) || []).filter(n => nodeSet.has(n));
      componentAdj.set(node, neighbors);
    }
    
    const nodesVisitingStatus = new Map<string, VisitStatus>();
    
    // Initialize all nodes to NOT_VISITED
    for (const node of componentNodes) {
      nodesVisitingStatus.set(node, VisitStatus.NOT_VISITED);
    }
    
    // DFS Visit function
    const dfsVisit = (node: string) => {
      nodesVisitingStatus.set(node, VisitStatus.CURRENTLY_VISITING);
      
      const neighbors = componentAdj.get(node) || [];
      for (const neighbor of neighbors) {
        if (nodesVisitingStatus.get(neighbor) === VisitStatus.NOT_VISITED) {
          dfsVisit(neighbor);
        } else if (nodesVisitingStatus.get(neighbor) === VisitStatus.CURRENTLY_VISITING) {
          // Check if neighbor also points back to node (bidirectional edge)
          const neighborNeighbors = componentAdj.get(neighbor) || [];
          if (neighborNeighbors.includes(node)) {
            // Found a tiny cycle, add it (avoid duplicates)
            const exists = tinyCDs.some(cd => 
              (cd.node1 === node && cd.node2 === neighbor) ||
              (cd.node1 === neighbor && cd.node2 === node)
            );
            if (!exists) {
              tinyCDs.push({ node1: node, node2: neighbor });
            }
          }
        }
      }
      
      nodesVisitingStatus.set(node, VisitStatus.VISITED);
    };
    
    // Start DFS from each unvisited node
    for (const node of componentNodes) {
      if (nodesVisitingStatus.get(node) === VisitStatus.NOT_VISITED) {
        dfsVisit(node);
      }
    }
    
    return tinyCDs;
  }

  /**
   * Find all elementary cycles in a component using Johnson's algorithm
   */
  findElementaryCycles(graphData: GraphData, componentNodes: string[]): Cycle[] {
    const cycles: Cycle[] = [];
    const nodeSet = new Set(componentNodes);
    const adjacencyList = this.buildAdjacencyList(graphData);
    
    // Filter adjacency list to only include nodes in component
    const componentAdj = new Map<string, string[]>();
    for (const node of componentNodes) {
      const neighbors = (adjacencyList.get(node) || []).filter(n => nodeSet.has(n));
      componentAdj.set(node, neighbors);
    }
    
    // Simple cycle detection - find all paths that return to start
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const currentPath: string[] = [];
    
    const dfs = (node: string, startNode: string) => {
      currentPath.push(node);
      visited.add(node);
      recursionStack.add(node);
      
      const neighbors = componentAdj.get(node) || [];
      for (const neighbor of neighbors) {
        if (neighbor === startNode && currentPath.length > 1) {
          // Found a cycle
          cycles.push({
            nodes: [...currentPath],
            length: currentPath.length,
          });
        } else if (!recursionStack.has(neighbor) && cycles.length < 100) {
          // Limit to 100 cycles to prevent performance issues
          dfs(neighbor, startNode);
        }
      }
      
      currentPath.pop();
      recursionStack.delete(node);
    };
    
    // Find cycles starting from each node
    for (const startNode of componentNodes) {
      if (cycles.length >= 100) break;
      visited.clear();
      recursionStack.clear();
      currentPath.length = 0;
      dfs(startNode, startNode);
    }
    
    // Remove duplicate cycles and sort by length
    const uniqueCycles = this.removeDuplicateCycles(cycles);
    return uniqueCycles.sort((a, b) => a.length - b.length);
  }
  
  private removeDuplicateCycles(cycles: Cycle[]): Cycle[] {
    const seen = new Set<string>();
    const unique: Cycle[] = [];
    
    for (const cycle of cycles) {
      // Normalize cycle representation
      const normalized = this.normalizeCycle(cycle.nodes);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(cycle);
      }
    }
    
    return unique;
  }
  
  private normalizeCycle(nodes: string[]): string {
    // Find minimum node and rotate to start there
    let minIdx = 0;
    for (let i = 1; i < nodes.length; i++) {
      if (nodes[i] < nodes[minIdx]) {
        minIdx = i;
      }
    }
    
    const rotated = [...nodes.slice(minIdx), ...nodes.slice(0, minIdx)];
    return rotated.join('->');
  }

  /**
   * Calculate graph metrics
   */
  calculateMetrics(graphData: GraphData): GraphMetrics {
    const nodeCount = graphData.nodes.length;
    const edgeCount = graphData.edges.length;
    
    // Calculate in-degree and out-degree for each node
    const inDegrees = new Map<string, number>();
    const outDegrees = new Map<string, number>();
    
    for (const node of graphData.nodes) {
      inDegrees.set(node.id, 0);
      outDegrees.set(node.id, 0);
    }
    
    let selfLoops = 0;
    const edgePairs = new Map<string, number>();
    
    for (const edge of graphData.edges) {
      outDegrees.set(edge.source, (outDegrees.get(edge.source) || 0) + 1);
      inDegrees.set(edge.target, (inDegrees.get(edge.target) || 0) + 1);
      
      // Check for self-loops
      if (edge.source === edge.target) {
        selfLoops++;
      }
      
      // Track multiple edges between same pair
      const pairKey = `${edge.source}->${edge.target}`;
      edgePairs.set(pairKey, (edgePairs.get(pairKey) || 0) + 1);
    }
    
    // Count multiple edges
    let multiEdges = 0;
    for (const count of edgePairs.values()) {
      if (count > 1) {
        multiEdges += count - 1;
      }
    }
    
    // Calculate total degree (in + out)
    const totalDegrees = new Map<string, number>();
    for (const node of graphData.nodes) {
      const inDeg = inDegrees.get(node.id) || 0;
      const outDeg = outDegrees.get(node.id) || 0;
      totalDegrees.set(node.id, inDeg + outDeg);
    }
    
    const degreeValues = Array.from(totalDegrees.values());
    const maxDegree = degreeValues.length > 0 ? Math.max(...degreeValues) : 0;
    const avgDegree = degreeValues.length > 0 
      ? degreeValues.reduce((a, b) => a + b, 0) / degreeValues.length 
      : 0;
    
    // Calculate graph density
    const maxPossibleEdges = nodeCount * (nodeCount - 1);
    const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;
    
    const stronglyConnectedComponents = this.findStronglyConnectedComponents(graphData);
    
    return {
      nodeCount,
      edgeCount,
      avgDegree,
      maxDegree,
      stronglyConnectedComponents,
      density,
      inDegrees,
      outDegrees,
      selfLoops,
      multiEdges,
    };
  }
}
