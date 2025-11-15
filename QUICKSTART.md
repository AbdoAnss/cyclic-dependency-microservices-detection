# Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- Docker installed (for Neo4j)

## 1. Start Neo4j Database

Using Docker Compose:
```bash
docker-compose up -d
```

This will start Neo4j with:
- **HTTP URL**: http://localhost:7474
- **Bolt URL**: bolt://localhost:7687
- **Username**: neo4j
- **Password**: password123

**Access Neo4j Browser:**
Visit http://localhost:7474 in your web browser to access the Neo4j Browser interface. You can:
- View all graphs created in the application
- Run custom Cypher queries
- Visualize the graph data directly in Neo4j
- Login with username `neo4j` and password `password123`

## 2. Install Dependencies

Run the setup script:
```bash
npm run setup
```

Or manually:
```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env if needed

# Frontend
cd ../frontend
npm install
```

## 3. Update Backend Configuration

Edit `backend/.env`:
```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password123
PORT=3001
```

## 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 5. Access the Application

Open your browser and go to: http://localhost:3000

## Usage Flow

1. **Create a Graph**: Click "Create New Graph" on the home page
2. **Add Microservices**: In the graph editor, click "Add Microservice"
3. **Create Relationships**: Drag from one node's handle to another to create a relationship
4. **Name Relationships**: Enter a name for each relationship (e.g., "calls", "depends on")
5. **Edit Names**: Double-click on any node or edge to edit its name
6. **Save**: Click "Save" to persist your graph
7. **Analyze**: Click "Analyze Graph" to detect cycles and view metrics
8. **View Results**: See strongly connected components and graph metrics

## Example Use Case

Create a graph representing:
- **API Gateway** → calls → **Auth Service**
- **Auth Service** → calls → **User Service**
- **User Service** → calls → **Database Service**
- **Database Service** → sends events to → **Auth Service** (creates a cycle!)

When you analyze this graph, the system will detect the cycle between Auth Service, User Service, and Database Service.

## Troubleshooting

### Neo4j won't start
```bash
docker-compose down
docker-compose up -d
```

### Backend connection error
- Check Neo4j is running: `docker ps`
- Verify credentials in `backend/.env`
- Check Neo4j logs: `docker logs microservices-graph-neo4j`

### Port already in use
Change ports in:
- Frontend: `frontend/.env.local` (Next.js uses PORT env var)
- Backend: `backend/.env` (PORT=3001)

### Dependencies not installing
Try removing node_modules and reinstalling:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install

cd ../backend
rm -rf node_modules package-lock.json
npm install
```

## Features to Try

- ✅ Create multiple graphs
- ✅ Add multiple nodes (microservices)
- ✅ Create n:n relationships between nodes (multiple edges between same pair)
- ✅ Create self-loops (node connecting to itself)
- ✅ Name each relationship
- ✅ View comprehensive metrics (density, degrees, self-loops, multi-edges)
- ✅ Detect circular dependencies (strongly connected components)
- ✅ Find elementary cycles within each SCC
- ✅ In-degree and out-degree distribution
- ✅ Delete graphs
- ✅ Real-time graph visualization

## Advanced Features

### Multiple Edges Between Same Nodes
You can create multiple relationships between the same pair of nodes:
- Order Service → "update inventory" → Inventory Service
- Order Service → "check product availability" → Inventory Service

### Self-Connecting Nodes
Nodes can connect to themselves (self-loops):
- Cache Service → "invalidates" → Cache Service

### Cycle Detection
1. View strongly connected components (groups with circular dependencies)
2. Click "Find Cycles" button on any SCC
3. See all elementary cycles with their exact paths

Enjoy building your microservices dependency graphs!
