# Microservices Graph Manager

A full-stack application for visualizing and analyzing microservices dependencies with cycle detection using strongly connected components.

## Features

- 🎨 Interactive graph editor using ReactFlow
- 🔄 N:N relationships between microservices
- 📊 Graph metrics and analysis
- 🔍 Strongly connected components detection (cycle detection)
- 🤖 AI-powered fix suggestions using Google Gemini
- 💾 Graph persistence with Neo4j
- 🎯 Real-time graph visualization
- ✏️ Edit microservice names and relationships with double-click

## Tech Stack

### Frontend
- Next.js 14 with TypeScript
- ReactFlow for graph visualization
- Tailwind CSS for styling
- Axios for API calls

### Backend
- Node.js with Express
- Neo4j for graph database
- TypeScript
- Tarjan's algorithm for SCC detection
- Google Gemini AI for architectural suggestions

## Prerequisites

- Node.js 18+ and npm/yarn
- Neo4j Database (local or remote)
- Google Gemini API key (for AI suggestions)

## Setup Instructions

### 1. Neo4j Setup

You can use Neo4j Desktop or Docker:

**Using Docker (Recommended):**
```bash
docker-compose up -d
```

This will start Neo4j with:
- HTTP Browser UI at http://localhost:7474
- Bolt protocol at bolt://localhost:7687
- Default credentials: `neo4j` / `password123`

**Access Neo4j Browser:**
1. Open http://localhost:7474 in your web browser
2. Login with username: `neo4j`, password: `password123`
3. You can view and query all graphs created in the application

**Alternative - Using Docker manually:**
```bash
docker run -d \
  --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/your_password \
  neo4j:latest
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Neo4j credentials and Gemini API key
# NEO4J_URI=bolt://localhost:7687
# NEO4J_USER=neo4j
# NEO4J_PASSWORD=your_password
# PORT=3001
# GEMINI_API_KEY=your_gemini_api_key_here

# Run in development mode
npm run dev
```

The backend will run on http://localhost:3001

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run in development mode
npm run dev
```

The frontend will run on http://localhost:3000

## Usage

### 1. Home Page (`/`)
- View all created graphs in a table
- Create new graphs
- Navigate to edit or view metrics
- Delete graphs

### 2. Graph Editor (`/graph/[id]`)
- Add microservices (nodes) to the graph
- Connect microservices with relationships (edges)
- Name each relationship (e.g., "calls", "depends on", "sends data to")
- Save the graph
- Send graph for analysis

### 3. Results Page (`/result/[id]`)
- View graph metrics:
  - Total microservices
  - Total relationships
  - Average degree
  - Maximum degree
- View strongly connected components (cycles)
- Identify circular dependencies
- **Detect tiny cycles** (2-node bidirectional dependencies)
- **Get AI-powered fix suggestions** for each tiny cycle

## AI-Powered Fix Suggestions

When tiny cycles (bidirectional dependencies between two services) are detected, you can click the **"Fix with AI"** button to get architectural suggestions from Google Gemini.

### What the AI Provides:
1. **Problem Analysis**: Explanation of why the circular dependency is problematic
2. **Multiple Solutions**: 3 concrete architectural patterns to break the cycle
3. **Implementation Guidance**: Step-by-step approaches for each solution
4. **Best Practice Recommendation**: Which solution is most appropriate for your case

### Example Suggestions:
- Introduce an intermediary service or event bus
- Use asynchronous messaging patterns
- Refactor to extract shared logic into a common service
- Implement API Gateway pattern
- Use publish-subscribe architecture

### Setup:
1. Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `backend/.env` file: `GEMINI_API_KEY=your_key_here`

## API Endpoints

### Graphs
- `GET /api/graphs` - Get all graphs
- `GET /api/graphs/:id` - Get specific graph
- `POST /api/graphs` - Create new graph
- `PUT /api/graphs/:id` - Update graph
- `DELETE /api/graphs/:id` - Delete graph
- `POST /api/graphs/:id/analyze` - Analyze graph and get metrics
- `POST /api/graphs/:id/find-cycles` - Find all elementary cycles in a component
- `POST /api/graphs/:id/detect-tiny-cycles` - Detect 2-node cycles
- `POST /api/graphs/:id/suggest-fix` - Get AI suggestion for fixing a tiny cycle

## Graph Analysis

The application uses **Tarjan's algorithm** to detect strongly connected components (SCCs) in the directed graph. An SCC is a maximal set of vertices where every vertex is reachable from every other vertex in the set.

### Why SCC Detection Matters

In microservices architecture:
- **Circular dependencies** are identified as SCCs with multiple nodes
- These cycles can indicate:
  - Tight coupling between services
  - Potential deployment challenges
  - Risk of cascading failures
  - Need for architectural refactoring

### Metrics Calculated

1. **Node Count**: Total number of microservices
2. **Edge Count**: Total number of relationships
3. **Average Degree**: Average number of connections per service
4. **Maximum Degree**: Highest number of connections for a single service
5. **Strongly Connected Components**: Groups of services with circular dependencies

## Project Structure

```
tiny-cycles-detection-app/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Home page
│   │   │   ├── layout.tsx            # Root layout
│   │   │   ├── globals.css           # Global styles
│   │   │   ├── graph/[id]/page.tsx   # Graph editor
│   │   │   └── result/[id]/page.tsx  # Results page
│   │   └── lib/
│   │       └── api.ts                # API client
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Entry point
│   │   ├── db/
│   │   │   └── neo4j.ts              # Neo4j connection
│   │   ├── routes/
│   │   │   └── graphs.ts             # Graph routes
│   │   └── services/
│   │       └── graphAnalyzer.ts      # SCC detection
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd backend
npm run dev
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

**Backend:**
```bash
cd backend
npm run build
npm start
```

## Troubleshooting

### Neo4j Connection Issues
- Ensure Neo4j is running on the specified port
- Check credentials in `.env` file
- Verify firewall settings

### Port Conflicts
- Frontend default: 3000 (Next.js default)
- Backend default: 3001
- Neo4j HTTP: 7474
- Neo4j Bolt: 7687

Change ports in respective configuration files if needed.

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
