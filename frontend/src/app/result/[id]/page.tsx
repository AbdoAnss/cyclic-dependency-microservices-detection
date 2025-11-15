'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { graphApi, AnalysisResult, Cycle, TinyCycle } from '@/lib/api';

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<number | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [tinyCycles, setTinyCycles] = useState<TinyCycle[]>([]);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [loadingTinyCycles, setLoadingTinyCycles] = useState(false);

  useEffect(() => {
    loadResults();
  }, [id]);

  const loadResults = async () => {
    setAnalyzing(true);
    try {
      const analysisResult = await graphApi.analyzeGraph(id);
      setResult(analysisResult);
      setNodes(analysisResult.graphData.nodes);
      setEdges(analysisResult.graphData.edges);
    } catch (error) {
      console.error('Error analyzing graph:', error);
      alert('Error analyzing graph. Please make sure the graph has been saved.');
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const handleFindCycles = async (componentIndex: number, componentNodes: string[]) => {
    setLoadingCycles(true);
    setSelectedComponent(componentIndex);
    try {
      const response = await graphApi.findCycles(id, componentNodes);
      setCycles(response.cycles);
    } catch (error) {
      console.error('Error finding cycles:', error);
      alert('Error finding cycles in component');
    } finally {
      setLoadingCycles(false);
    }
  };

  const handleDetectTinyCycles = async (componentIndex: number, componentNodes: string[]) => {
    setLoadingTinyCycles(true);
    setSelectedComponent(componentIndex);
    try {
      const response = await graphApi.detectTinyCycles(id, componentNodes);
      setTinyCycles(response.tinyCycles);
    } catch (error) {
      console.error('Error detecting tiny cycles:', error);
      alert('Error detecting tiny cycles in component');
    } finally {
      setLoadingTinyCycles(false);
    }
  };

  if (loading || analyzing) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-2">Analyzing graph...</div>
          <div className="text-gray-600">Computing metrics and detecting cycles</div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">No analysis results found</div>
          <button
            onClick={() => router.push(`/graph/${id}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Back to Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Home
            </button>
            <h1 className="text-2xl font-bold">Analysis Results</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/graph/${id}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Edit Graph
            </button>
            <button
              onClick={loadResults}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Re-analyze
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Total Microservices</div>
            <div className="text-3xl font-bold text-blue-600">{result.metrics.nodeCount}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Total Relationships</div>
            <div className="text-3xl font-bold text-green-600">{result.metrics.edgeCount}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Graph Density</div>
            <div className="text-3xl font-bold text-purple-600">
              {(result.metrics.density * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">SCCs Found</div>
            <div className="text-3xl font-bold text-red-600">
              {result.metrics.stronglyConnectedComponents.length}
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Average Degree</div>
            <div className="text-2xl font-bold">{result.metrics.avgDegree.toFixed(2)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Maximum Degree</div>
            <div className="text-2xl font-bold">{result.metrics.maxDegree}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Self-Loops</div>
            <div className="text-2xl font-bold text-orange-600">{result.metrics.selfLoops}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Multiple Edges</div>
            <div className="text-2xl font-bold text-indigo-600">{result.metrics.multiEdges}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strongly Connected Components */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">
              Strongly Connected Components
              {result.metrics.stronglyConnectedComponents.length > 0 && (
                <span className="ml-2 text-sm font-normal text-red-600">
                  ⚠️ Circular dependencies detected
                </span>
              )}
            </h2>
            
            {result.metrics.stronglyConnectedComponents.length === 0 ? (
              <div className="text-gray-600 text-center py-8 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">✓</div>
                <div className="font-medium">No cycles detected</div>
                <div className="text-sm">Your graph is acyclic (DAG)</div>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {result.metrics.stronglyConnectedComponents.map((component, index) => (
                  <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-lg">
                          Component {index + 1}
                          <span className="ml-2 text-sm text-gray-600">
                            ({component.length} nodes)
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDetectTinyCycles(index, component)}
                          disabled={loadingTinyCycles && selectedComponent === index}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm font-medium transition disabled:bg-gray-400"
                        >
                          {loadingTinyCycles && selectedComponent === index ? 'Detecting...' : 'Tiny Cycles'}
                        </button>
                        <button
                          onClick={() => handleFindCycles(index, component)}
                          disabled={loadingCycles && selectedComponent === index}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition disabled:bg-gray-400"
                        >
                          {loadingCycles && selectedComponent === index ? 'Finding...' : 'All Cycles'}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {component.map((nodeId) => {
                        const node = nodes.find(n => n.id === nodeId);
                        return (
                          <span
                            key={nodeId}
                            className="px-3 py-1 bg-red-200 text-red-900 rounded-full text-sm font-medium"
                          >
                            {node?.data?.label || nodeId}
                          </span>
                        );
                      })}
                    </div>
                    
                    {selectedComponent === index && tinyCycles.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-orange-300 bg-orange-50 p-3 rounded">
                        <div className="font-medium mb-2 text-sm text-orange-900">
                          🔄 Tiny Cycles (2-node cycles): {tinyCycles.length}
                        </div>
                        <div className="space-y-2">
                          {tinyCycles.map((tinyCycle, tcIdx) => {
                            const node1 = nodes.find(n => n.id === tinyCycle.node1);
                            const node2 = nodes.find(n => n.id === tinyCycle.node2);
                            return (
                              <div key={tcIdx} className="bg-white p-2 rounded border border-orange-300 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-orange-700">Tiny Cycle {tcIdx + 1}:</span>
                                  <span className="text-gray-700">
                                    {node1?.data?.label || tinyCycle.node1} ⇄ {node2?.data?.label || tinyCycle.node2}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {selectedComponent === index && cycles.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-red-300">
                        <div className="font-medium mb-2 text-sm">
                          Elementary Cycles Found: {cycles.length}
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {cycles.slice(0, 20).map((cycle, cycleIdx) => (
                            <div key={cycleIdx} className="bg-white p-2 rounded border border-red-200 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Cycle {cycleIdx + 1}:</span>
                                <span className="text-gray-700">
                                  {cycle.nodes.map((nodeId) => {
                                    const node = nodes.find(n => n.id === nodeId);
                                    return node?.data?.label || nodeId;
                                  }).join(' → ')} → {(() => {
                                    const node = nodes.find(n => n.id === cycle.nodes[0]);
                                    return node?.data?.label || cycle.nodes[0];
                                  })()}
                                </span>
                                <span className="ml-auto text-xs text-gray-500">
                                  Length: {cycle.length}
                                </span>
                              </div>
                            </div>
                          ))}
                          {cycles.length > 20 && (
                            <div className="text-xs text-gray-500 text-center py-2">
                              Showing first 20 of {cycles.length} cycles
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Graph Visualization */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Graph Visualization</h2>
            <div className="h-96 border border-gray-200 rounded">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
              >
                <Background />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
