'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  MarkerType,
  EdgeTypes,
  getSmoothStepPath,
  EdgeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { graphApi, GraphData } from '@/lib/api';

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

// Custom edge component with offset for multiple edges
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  markerEnd,
  data,
}: EdgeProps) {
  // Calculate offset for multiple edges between same nodes
  const offset = (data?.offset || 0) * 30;
  
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY: sourceY + offset,
    sourcePosition,
    targetX,
    targetY: targetY + offset,
    targetPosition,
    borderRadius: 20,
  });

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: '#b1b1b7', strokeWidth: 2 }}
      />
      {label && (
        <text>
          <textPath
            href={`#${id}`}
            style={{ fontSize: '12px', fill: '#555' }}
            startOffset="50%"
            textAnchor="middle"
          >
            {label}
          </textPath>
        </text>
      )}
    </>
  );
}

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

export default function GraphEditor() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [graphName, setGraphName] = useState('');
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [showEdgeLabelModal, setShowEdgeLabelModal] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [edgeLabel, setEdgeLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editNodeName, setEditNodeName] = useState('');
  const [editingEdge, setEditingEdge] = useState<string | null>(null);
  const [editEdgeLabel, setEditEdgeLabel] = useState('');

  useEffect(() => {
    loadGraph();
  }, [id]);

  const loadGraph = async () => {
    try {
      const graph = await graphApi.getGraph(id);
      setGraphName(graph.name);
      if (graph.data) {
        const loadedNodes = graph.data.nodes || [];
        const loadedEdges = graph.data.edges || [];
        
        // Calculate offsets for multiple edges between same nodes
        const edgesWithOffsets = calculateEdgeOffsets(loadedEdges);
        
        setNodes(loadedNodes);
        setEdges(edgesWithOffsets);
        // Update nodeId counter
        const maxId = Math.max(
          0,
          ...loadedNodes.map(n => {
            const match = n.id.match(/node_(\d+)/);
            return match ? parseInt(match[1]) : 0;
          })
        );
        nodeId = maxId + 1;
      }
    } catch (error) {
      console.error('Error loading graph:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate offsets for multiple edges between same node pairs
  const calculateEdgeOffsets = (edges: Edge[]): Edge[] => {
    const edgeGroups = new Map<string, Edge[]>();
    
    // Group edges by source-target pair
    edges.forEach(edge => {
      const key = `${edge.source}-${edge.target}`;
      if (!edgeGroups.has(key)) {
        edgeGroups.set(key, []);
      }
      edgeGroups.get(key)!.push(edge);
    });
    
    // Assign offsets to edges in each group
    const result: Edge[] = [];
    edgeGroups.forEach((group) => {
      if (group.length === 1) {
        result.push({ ...group[0], data: { offset: 0 } });
      } else {
        // For multiple edges, distribute them with offsets
        group.forEach((edge, index) => {
          const offset = index - (group.length - 1) / 2;
          result.push({ ...edge, data: { offset } });
        });
      }
    });
    
    return result;
  };

  const onConnect = useCallback((connection: Connection) => {
    // Allow self-loops and multiple edges
    setPendingConnection(connection);
    setShowEdgeLabelModal(true);
  }, []);

  const handleAddEdge = () => {
    if (!pendingConnection) return;

    // Generate unique ID for edge to support multiple edges
    const edgeId = `e-${pendingConnection.source}-${pendingConnection.target}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const newEdge: Edge = {
      id: edgeId,
      source: pendingConnection.source!,
      target: pendingConnection.target!,
      label: edgeLabel || undefined,
      type: pendingConnection.source === pendingConnection.target ? 'default' : 'custom',
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      // For self-loops, add some styling
      ...(pendingConnection.source === pendingConnection.target && {
        style: { stroke: '#f59e0b', strokeWidth: 2 },
      }),
      data: { offset: 0 },
    };

    // Add edge and recalculate offsets
    const updatedEdges = [...edges, newEdge];
    const edgesWithOffsets = calculateEdgeOffsets(updatedEdges);
    setEdges(edgesWithOffsets);
    
    setShowEdgeLabelModal(false);
    setPendingConnection(null);
    setEdgeLabel('');
  };

  const handleAddNode = () => {
    if (!newNodeName.trim()) return;

    const newNode: Node = {
      id: getNodeId(),
      type: 'default',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { label: newNodeName },
    };

    setNodes((nds) => [...nds, newNode]);
    setNewNodeName('');
    setShowAddNodeModal(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const graphData: GraphData = {
        nodes: nodes as any,
        edges: edges as any,
      };
      await graphApi.updateGraph(id, graphData);
      alert('Graph saved successfully!');
    } catch (error) {
      console.error('Error saving graph:', error);
      alert('Error saving graph');
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    await handleSave();
    router.push(`/result/${id}`);
  };

  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setEditingNode(node.id);
    setEditNodeName(node.data.label || '');
  }, []);

  const handleUpdateNodeName = () => {
    if (!editingNode || !editNodeName.trim()) return;
    
    setNodes((nds) =>
      nds.map((node) =>
        node.id === editingNode
          ? { ...node, data: { ...node.data, label: editNodeName } }
          : node
      )
    );
    setEditingNode(null);
    setEditNodeName('');
  };

  const handleEdgeDoubleClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setEditingEdge(edge.id);
    setEditEdgeLabel(edge.label as string || '');
  }, []);

  const handleUpdateEdgeLabel = () => {
    if (!editingEdge) return;
    
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === editingEdge
          ? { ...edge, label: editEdgeLabel || undefined }
          : edge
      )
    );
    setEditingEdge(null);
    setEditEdgeLabel('');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl">Loading graph...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">{graphName}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddNodeModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            Add Microservice
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleAnalyze}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            Analyze Graph
          </button>
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={handleNodeDoubleClick}
          onEdgeDoubleClick={handleEdgeDoubleClick}
          edgeTypes={edgeTypes}
          fitView
          defaultEdgeOptions={{
            type: 'custom',
            markerEnd: { type: MarkerType.ArrowClosed },
          }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Add Node Modal */}
      {showAddNodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-2xl font-bold mb-4">Add Microservice</h2>
            <input
              type="text"
              value={newNodeName}
              onChange={(e) => setNewNodeName(e.target.value)}
              placeholder="Enter microservice name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAddNode();
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddNodeModal(false);
                  setNewNodeName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNode}
                disabled={!newNodeName.trim()}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:bg-gray-400"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edge Label Modal */}
      {showEdgeLabelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-2xl font-bold mb-4">Name Relationship</h2>
            <input
              type="text"
              value={edgeLabel}
              onChange={(e) => setEdgeLabel(e.target.value)}
              placeholder="e.g., 'calls', 'depends on', 'sends data to'"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAddEdge();
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEdgeLabelModal(false);
                  setPendingConnection(null);
                  setEdgeLabel('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEdge}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                Add Relationship
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Node Modal */}
      {editingNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-2xl font-bold mb-4">Edit Microservice Name</h2>
            <input
              type="text"
              value={editNodeName}
              onChange={(e) => setEditNodeName(e.target.value)}
              placeholder="Enter new name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleUpdateNodeName();
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditingNode(null);
                  setEditNodeName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateNodeName}
                disabled={!editNodeName.trim()}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:bg-gray-400"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Edge Modal */}
      {editingEdge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-2xl font-bold mb-4">Edit Relationship Name</h2>
            <input
              type="text"
              value={editEdgeLabel}
              onChange={(e) => setEditEdgeLabel(e.target.value)}
              placeholder="e.g., 'calls', 'depends on', 'sends data to'"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleUpdateEdgeLabel();
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditingEdge(null);
                  setEditEdgeLabel('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEdgeLabel}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
