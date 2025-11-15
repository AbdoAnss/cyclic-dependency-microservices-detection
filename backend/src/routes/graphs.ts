import { Router, Request, Response } from 'express';
import { getDriver } from '../db/neo4j';
import { GraphAnalyzer } from '../services/graphAnalyzer';

const router = Router();
const analyzer = new GraphAnalyzer();

interface GraphData {
  nodes: any[];
  edges: any[];
}

// Get all graphs
router.get('/', async (req: Request, res: Response) => {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(
      'MATCH (g:Graph) RETURN g.id as id, g.name as name, g.createdAt as createdAt ORDER BY g.createdAt DESC'
    );

    const graphs = result.records.map(record => ({
      id: record.get('id'),
      name: record.get('name'),
      createdAt: record.get('createdAt'),
    }));

    res.json(graphs);
  } catch (error) {
    console.error('Error fetching graphs:', error);
    res.status(500).json({ error: 'Failed to fetch graphs' });
  } finally {
    await session.close();
  }
});

// Get a specific graph
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(
      'MATCH (g:Graph {id: $id}) RETURN g.id as id, g.name as name, g.data as data',
      { id }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Graph not found' });
    }

    const record = result.records[0];
    const graph = {
      id: record.get('id'),
      name: record.get('name'),
      data: record.get('data') ? JSON.parse(record.get('data')) : { nodes: [], edges: [] },
    };

    res.json(graph);
  } catch (error) {
    console.error('Error fetching graph:', error);
    res.status(500).json({ error: 'Failed to fetch graph' });
  } finally {
    await session.close();
  }
});

// Create a new graph
router.post('/', async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const driver = getDriver();
  const session = driver.session();
  const id = `graph_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  try {
    await session.run(
      'CREATE (g:Graph {id: $id, name: $name, createdAt: $createdAt, data: $data})',
      {
        id,
        name,
        createdAt: new Date().toISOString(),
        data: JSON.stringify({ nodes: [], edges: [] }),
      }
    );

    res.status(201).json({ id, name });
  } catch (error) {
    console.error('Error creating graph:', error);
    res.status(500).json({ error: 'Failed to create graph' });
  } finally {
    await session.close();
  }
});

// Update a graph
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'Data is required' });
  }

  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(
      'MATCH (g:Graph {id: $id}) SET g.data = $data RETURN g',
      { id, data: JSON.stringify(data) }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Graph not found' });
    }

    res.json({ message: 'Graph updated successfully' });
  } catch (error) {
    console.error('Error updating graph:', error);
    res.status(500).json({ error: 'Failed to update graph' });
  } finally {
    await session.close();
  }
});

// Delete a graph
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(
      'MATCH (g:Graph {id: $id}) DELETE g RETURN count(g) as deleted',
      { id }
    );

    const deleted = result.records[0].get('deleted').toNumber();
    
    if (deleted === 0) {
      return res.status(404).json({ error: 'Graph not found' });
    }

    res.json({ message: 'Graph deleted successfully' });
  } catch (error) {
    console.error('Error deleting graph:', error);
    res.status(500).json({ error: 'Failed to delete graph' });
  } finally {
    await session.close();
  }
});

// Analyze a graph
router.post('/:id/analyze', async (req: Request, res: Response) => {
  const { id } = req.params;
  const driver = getDriver();
  const session = driver.session();

  try {
    // Fetch the graph
    const result = await session.run(
      'MATCH (g:Graph {id: $id}) RETURN g.data as data',
      { id }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Graph not found' });
    }

    const graphData: GraphData = JSON.parse(result.records[0].get('data'));

    // Analyze the graph
    const metrics = analyzer.calculateMetrics(graphData);

    res.json({
      metrics,
      graphData,
    });
  } catch (error) {
    console.error('Error analyzing graph:', error);
    res.status(500).json({ error: 'Failed to analyze graph' });
  } finally {
    await session.close();
  }
});

// Find elementary cycles in a component
router.post('/:id/find-cycles', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { componentNodes } = req.body;

  if (!componentNodes || !Array.isArray(componentNodes)) {
    return res.status(400).json({ error: 'Component nodes array is required' });
  }

  const driver = getDriver();
  const session = driver.session();

  try {
    // Fetch the graph
    const result = await session.run(
      'MATCH (g:Graph {id: $id}) RETURN g.data as data',
      { id }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Graph not found' });
    }

    const graphData: GraphData = JSON.parse(result.records[0].get('data'));

    // Find cycles in the component
    const cycles = analyzer.findElementaryCycles(graphData, componentNodes);

    res.json({ cycles });
  } catch (error) {
    console.error('Error finding cycles:', error);
    res.status(500).json({ error: 'Failed to find cycles' });
  } finally {
    await session.close();
  }
});

// Detect tiny cycles in a component
router.post('/:id/detect-tiny-cycles', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { componentNodes } = req.body;

  if (!componentNodes || !Array.isArray(componentNodes)) {
    return res.status(400).json({ error: 'Component nodes array is required' });
  }

  const driver = getDriver();
  const session = driver.session();

  try {
    // Fetch the graph
    const result = await session.run(
      'MATCH (g:Graph {id: $id}) RETURN g.data as data',
      { id }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Graph not found' });
    }

    const graphData: GraphData = JSON.parse(result.records[0].get('data'));

    // Detect tiny cycles
    const tinyCycles = analyzer.detectTinyCycles(graphData, componentNodes);

    res.json({ tinyCycles });
  } catch (error) {
    console.error('Error detecting tiny cycles:', error);
    res.status(500).json({ error: 'Failed to detect tiny cycles' });
  } finally {
    await session.close();
  }
});

export default router;
