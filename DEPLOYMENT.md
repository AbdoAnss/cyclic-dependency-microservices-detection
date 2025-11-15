# Deployment Guide

## Production Deployment Options

### Option 1: Deploy to Vercel (Frontend) + Railway (Backend + Neo4j)

#### Frontend (Vercel)
1. Push your code to GitHub
2. Connect repository to Vercel
3. Set environment variable:
   - `NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api`
4. Deploy

#### Backend + Neo4j (Railway)
1. Create new project on Railway
2. Add Neo4j plugin
3. Add Node.js service
4. Set environment variables from Neo4j plugin:
   - `NEO4J_URI`
   - `NEO4J_USER`
   - `NEO4J_PASSWORD`
   - `PORT=3001`
5. Deploy from GitHub

### Option 2: Docker Deployment

Create `Dockerfile` for backend:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

Create `Dockerfile` for frontend:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Update `docker-compose.yml`:

```yaml
version: '3.8'

services:
  neo4j:
    image: neo4j:latest
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      - NEO4J_AUTH=neo4j/your_secure_password
    volumes:
      - neo4j_data:/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=your_secure_password
      - PORT=3001
    depends_on:
      - neo4j

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001/api
    depends_on:
      - backend

volumes:
  neo4j_data:
```

### Option 3: AWS Deployment

1. **Frontend**: Deploy to AWS Amplify or S3 + CloudFront
2. **Backend**: Deploy to AWS ECS or Elastic Beanstalk
3. **Database**: Use Neo4j Aura (managed cloud service)

### Option 4: Azure Deployment

1. **Frontend**: Azure Static Web Apps
2. **Backend**: Azure App Service
3. **Database**: Neo4j Aura or Azure VM with Neo4j

## Environment Variables for Production

### Frontend
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

### Backend
```env
NEO4J_URI=bolt://your-neo4j-host:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=secure_password_here
PORT=3001
NODE_ENV=production
```

## Security Checklist

- [ ] Change default Neo4j password
- [ ] Enable HTTPS for all services
- [ ] Set up CORS properly
- [ ] Add rate limiting
- [ ] Add authentication/authorization
- [ ] Secure environment variables
- [ ] Enable Neo4j authentication
- [ ] Regular security updates

## Performance Optimization

### Frontend
- Enable Next.js production build
- Use CDN for static assets
- Enable image optimization
- Implement caching strategies

### Backend
- Enable compression middleware
- Set up connection pooling for Neo4j
- Implement response caching
- Add monitoring and logging

### Database
- Index frequently queried properties
- Optimize Cypher queries
- Regular database maintenance
- Set up backup strategy

## Monitoring

Recommended tools:
- **Frontend**: Vercel Analytics, Google Analytics
- **Backend**: DataDog, New Relic, or Sentry
- **Database**: Neo4j Browser, Neo4j monitoring tools
- **Infrastructure**: CloudWatch, Azure Monitor

## Backup Strategy

### Neo4j Backup
```bash
# Automated backup
neo4j-admin backup --backup-dir=/backups --name=graph-backup
```

Set up automated backups:
- Daily backups to cloud storage (S3, Azure Blob)
- Retention policy (keep last 30 days)
- Test restore procedure regularly

## Scaling Considerations

### Horizontal Scaling
- Frontend: Automatic with Vercel/Netlify
- Backend: Use load balancer with multiple instances
- Database: Neo4j Enterprise for clustering

### Vertical Scaling
- Increase server resources based on usage
- Monitor memory usage for Neo4j
- Scale based on graph size

## Cost Estimation

### Small Scale (Development/Testing)
- Vercel: Free tier
- Railway: $5-10/month
- Neo4j Aura Free: $0

### Medium Scale (Production)
- Vercel Pro: $20/month
- Railway/Heroku: $25-50/month
- Neo4j Aura Professional: $65/month
- **Total**: ~$110-135/month

### Large Scale (Enterprise)
- AWS/Azure: Variable, $500+/month
- Neo4j Enterprise: Custom pricing
- CDN costs
- **Total**: $1000+/month

## Maintenance Tasks

### Weekly
- Check error logs
- Monitor performance metrics
- Review security alerts

### Monthly
- Update dependencies
- Review and optimize queries
- Backup verification
- Cost optimization review

### Quarterly
- Security audit
- Performance testing
- Disaster recovery drill
- User feedback review

## Support & Resources

- Neo4j Documentation: https://neo4j.com/docs/
- Next.js Docs: https://nextjs.org/docs
- ReactFlow Docs: https://reactflow.dev/
- Express.js Docs: https://expressjs.com/

## Troubleshooting Production Issues

### High Memory Usage
- Check Neo4j heap size settings
- Optimize graph queries
- Implement pagination

### Slow Response Times
- Add database indexes
- Implement caching
- Optimize ReactFlow rendering

### Connection Errors
- Verify network security groups
- Check firewall rules
- Validate credentials

---

**Ready for Production!** 🚀
