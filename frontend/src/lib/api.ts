import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Graph {
  id: string;
  name: string;
  createdAt: string;
}

export interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { label: string };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  avgDegree: number;
  maxDegree: number;
  stronglyConnectedComponents: string[][];
  density: number;
  inDegrees: { [key: string]: number };
  outDegrees: { [key: string]: number };
  selfLoops: number;
  multiEdges: number;
}

export interface Cycle {
  nodes: string[];
  length: number;
}

export interface TinyCycle {
  node1: string;
  node2: string;
}

export interface FixSuggestion {
  cycle: TinyCycle;
  suggestion: string;
  strategies: string[];
}

export interface AnalysisResult {
  metrics: GraphMetrics;
  graphData: GraphData;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const graphApi = {
  // Get all graphs
  getAllGraphs: async (): Promise<Graph[]> => {
    const response = await api.get('/graphs');
    return response.data;
  },

  // Get a specific graph
  getGraph: async (id: string): Promise<{ id: string; name: string; data: GraphData }> => {
    const response = await api.get(`/graphs/${id}`);
    return response.data;
  },

  // Create a new graph
  createGraph: async (name: string): Promise<{ id: string; name: string }> => {
    const response = await api.post('/graphs', { name });
    return response.data;
  },

  // Update a graph
  updateGraph: async (id: string, data: GraphData): Promise<void> => {
    await api.put(`/graphs/${id}`, { data });
  },

  // Delete a graph
  deleteGraph: async (id: string): Promise<void> => {
    await api.delete(`/graphs/${id}`);
  },

  // Analyze a graph
  analyzeGraph: async (id: string): Promise<AnalysisResult> => {
    const response = await api.post(`/graphs/${id}/analyze`);
    return response.data;
  },

  // Find elementary cycles in a component
  findCycles: async (id: string, componentNodes: string[]): Promise<{ cycles: Cycle[] }> => {
    const response = await api.post(`/graphs/${id}/find-cycles`, { componentNodes });
    return response.data;
  },

  // Detect tiny cycles in a component
  detectTinyCycles: async (id: string, componentNodes: string[]): Promise<{ tinyCycles: TinyCycle[] }> => {
    const response = await api.post(`/graphs/${id}/detect-tiny-cycles`, { componentNodes });
    return response.data;
  },

  // Get AI suggestion to fix a tiny cycle
  suggestFix: async (id: string, node1: string, node2: string): Promise<FixSuggestion> => {
    const response = await api.post(`/graphs/${id}/suggest-fix`, { node1, node2 });
    return response.data;
  },
};
