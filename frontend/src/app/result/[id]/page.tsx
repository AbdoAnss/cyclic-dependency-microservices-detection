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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'reactflow/dist/style.css';
import { graphApi, AnalysisResult, Cycle, TinyCycle, FixSuggestion } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  ArrowLeft, 
  BarChart3, 
  CheckCircle2, 
  Edit, 
  Loader2, 
  RefreshCw, 
  Sparkles,
  TrendingUp,
  Network,
  GitBranch,
  Zap
} from 'lucide-react';

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
  const [suggestions, setSuggestions] = useState<Map<string, FixSuggestion>>(new Map());
  const [loadingSuggestion, setLoadingSuggestion] = useState<string | null>(null);

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

  const handleSuggestFix = async (tinyCycle: TinyCycle) => {
    const cycleKey = `${tinyCycle.node1}-${tinyCycle.node2}`;
    setLoadingSuggestion(cycleKey);
    try {
      const suggestion = await graphApi.suggestFix(id, tinyCycle.node1, tinyCycle.node2);
      setSuggestions(new Map(suggestions.set(cycleKey, suggestion)));
    } catch (error) {
      console.error('Error getting suggestion:', error);
      alert('Error getting AI suggestion. Please check your Gemini API key.');
    } finally {
      setLoadingSuggestion(null);
    }
  };

  if (loading || analyzing) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Analyzing graph...</h2>
                <p className="text-sm text-muted-foreground">Computing metrics and detecting cycles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h2 className="text-xl font-semibold mb-2">No analysis results found</h2>
                <p className="text-sm text-muted-foreground mb-4">Unable to load the graph analysis</p>
              </div>
              <Button onClick={() => router.push(`/graph/${id}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Editor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Analysis Results
                </h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/graph/${id}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Graph
              </Button>
              <Button onClick={loadResults}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Re-analyze
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Microservices</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{result.metrics.nodeCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Total services</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Relationships</CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{result.metrics.edgeCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Total connections</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Graph Density</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(result.metrics.density * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Connection ratio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Circular Dependencies</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {result.metrics.stronglyConnectedComponents.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">SCCs detected</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Degree</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{result.metrics.avgDegree.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Max Degree</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{result.metrics.maxDegree}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Self-Loops</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{result.metrics.selfLoops}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Multiple Edges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{result.metrics.multiEdges}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strongly Connected Components */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Strongly Connected Components
                  </CardTitle>
                  {result.metrics.stronglyConnectedComponents.length > 0 && (
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      Circular dependencies detected - these require attention
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {result.metrics.stronglyConnectedComponents.length === 0 ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">No cycles detected</div>
                    <div className="text-sm text-muted-foreground">Your graph is acyclic (DAG)</div>
                  </AlertDescription>
                </Alert>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                {result.metrics.stronglyConnectedComponents.map((component, index) => (
                  <Card key={index} className="border-destructive/50">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Component {index + 1}
                            <Badge variant="destructive" className="ml-2">
                              {component.length} services
                            </Badge>
                          </CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDetectTinyCycles(index, component)}
                            disabled={loadingTinyCycles && selectedComponent === index}
                          >
                            {loadingTinyCycles && selectedComponent === index ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Tiny Cycles
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleFindCycles(index, component)}
                            disabled={loadingCycles && selectedComponent === index}
                          >
                            {loadingCycles && selectedComponent === index ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            All Cycles
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {component.map((nodeId) => {
                          const node = nodes.find(n => n.id === nodeId);
                          return (
                            <Badge key={nodeId} variant="secondary" className="px-3 py-1">
                              {node?.data?.label || nodeId}
                            </Badge>
                        );
                      })}
                    </div>
                    
                    {selectedComponent === index && tinyCycles.length > 0 && (
                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-orange-600" />
                          <h4 className="font-semibold text-orange-600">
                            Tiny Cycles Detected: {tinyCycles.length}
                          </h4>
                        </div>
                        {tinyCycles.map((tinyCycle, tcIdx) => {
                          const node1 = nodes.find(n => n.id === tinyCycle.node1);
                          const node2 = nodes.find(n => n.id === tinyCycle.node2);
                          const cycleKey = `${tinyCycle.node1}-${tinyCycle.node2}`;
                          const suggestion = suggestions.get(cycleKey);
                          const isLoadingSuggestion = loadingSuggestion === cycleKey;
                          
                          return (
                            <Card key={tcIdx} className="border-orange-200 bg-orange-50/50">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base">
                                    <Badge variant="outline" className="mr-2">#{tcIdx + 1}</Badge>
                                    {node1?.data?.label || tinyCycle.node1} ⇄ {node2?.data?.label || tinyCycle.node2}
                                  </CardTitle>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSuggestFix(tinyCycle)}
                                    disabled={isLoadingSuggestion}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                  >
                                    {isLoadingSuggestion ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing...
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Fix with AI
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </CardHeader>

                              {suggestion && (
                                <CardContent>
                                  <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
                                    <CardHeader>
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-blue-600" />
                                        AI-Powered Solution
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <ScrollArea className="h-[400px]">
                                        <div className="prose prose-sm max-w-none prose-headings:text-blue-900 prose-strong:text-blue-800">
                                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {suggestion.suggestion}
                                          </ReactMarkdown>
                                        </div>
                                      </ScrollArea>
                                      {suggestion.strategies.length > 0 && (
                                        <div className="mt-4 pt-4 border-t">
                                          <p className="text-sm font-medium mb-2">Quick Strategies:</p>
                                          <div className="flex flex-wrap gap-2">
                                            {suggestion.strategies.map((strategy, idx) => (
                                              <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-800">
                                                {strategy}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </CardContent>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    )}
                    
                    {selectedComponent === index && cycles.length > 0 && (
                      <div className="space-y-3 pt-4 border-t">
                        <h4 className="font-semibold">
                          Elementary Cycles Found: {cycles.length}
                        </h4>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {cycles.slice(0, 20).map((cycle, cycleIdx) => (
                              <Card key={cycleIdx} className="border-red-200 bg-red-50/50">
                                <CardContent className="pt-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                      <Badge variant="outline">Cycle {cycleIdx + 1}</Badge>
                                      <span className="text-sm">
                                        {cycle.nodes.map((nodeId) => {
                                          const node = nodes.find(n => n.id === nodeId);
                                          return node?.data?.label || nodeId;
                                        }).join(' → ')} → {(() => {
                                          const node = nodes.find(n => n.id === cycle.nodes[0]);
                                          return node?.data?.label || cycle.nodes[0];
                                        })()}
                                      </span>
                                    </div>
                                    <Badge variant="secondary">Length: {cycle.length}</Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                            {cycles.length > 20 && (
                              <p className="text-xs text-muted-foreground text-center py-2">
                                Showing first 20 of {cycles.length} cycles
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Graph Visualization */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Graph Visualization</CardTitle>
              <CardDescription>Interactive view of your microservices architecture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] border rounded-lg overflow-hidden">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
