import { GoogleGenerativeAI } from '@google/generative-ai';

interface TinyCycle {
  node1: string;
  node2: string;
}

interface SuggestionResponse {
  cycle: TinyCycle;
  suggestion: string;
  strategies: string[];
}

class AISuggestionService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async suggestFix(tinyCycle: TinyCycle, node1Label: string, node2Label: string): Promise<SuggestionResponse> {
    const prompt = `You are a microservices architecture expert. I have detected a tiny cycle (bidirectional dependency) between two microservices:

Service A: "${node1Label}" (ID: ${tinyCycle.node1})
Service B: "${node2Label}" (ID: ${tinyCycle.node2})

These two services have a circular dependency where they call each other directly, which can lead to:
- Tight coupling
- Deployment challenges
- Potential cascading failures
- Difficult testing and maintenance

Please provide:
1. A brief explanation of why this is problematic (2-3 sentences)
2. THREE concrete architectural solutions to break this cycle
3. For each solution, explain the implementation approach

Format your response as:
**Problem:** [explanation]

**Solution 1: [Title]**
[Description and implementation steps]

**Solution 2: [Title]**
[Description and implementation steps]

**Solution 3: [Title]**
[Description and implementation steps]

**Recommended Approach:** [Which solution you recommend and why]`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response into structured data
      const strategies = this.parseStrategies(text);

      return {
        cycle: tinyCycle,
        suggestion: text,
        strategies,
      };
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to generate suggestion from AI service');
    }
  }

  private parseStrategies(text: string): string[] {
    const strategies: string[] = [];
    const solutionRegex = /\*\*Solution \d+: ([^\*]+)\*\*/g;
    let match;

    while ((match = solutionRegex.exec(text)) !== null) {
      strategies.push(match[1].trim());
    }

    // If parsing fails, return generic strategies
    if (strategies.length === 0) {
      return [
        'Introduce an intermediary service or event bus',
        'Use asynchronous messaging patterns',
        'Refactor to extract shared logic into a common service',
      ];
    }

    return strategies;
  }

  async suggestMultipleFixes(
    tinyCycles: Array<{ cycle: TinyCycle; node1Label: string; node2Label: string }>
  ): Promise<SuggestionResponse[]> {
    const suggestions = await Promise.all(
      tinyCycles.map(({ cycle, node1Label, node2Label }) =>
        this.suggestFix(cycle, node1Label, node2Label)
      )
    );
    return suggestions;
  }
}

export default new AISuggestionService();
