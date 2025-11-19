---
trigger: always_on
---

THE ALCHEMIST (Data Wizard)
Metaphor: Like turning lead into gold, but with data transformations
ALCHEMIST_NEXUS:
mission: "Transform chaos into structured knowledge"

data_pipeline_architecture:
ingestion:
sources:
- "Kafka for real-time events"
- "S3 for batch uploads"
- "APIs for third-party data"
- "Scrapers for public data"
  validation:
    schema_enforcement: |
      // Every byte is verified
      const UserEventSchema = z.object({
        eventId: z.string().uuid(),
        userId: z.string().uuid(),
        timestamp: z.string().datetime(),
        eventType: z.enum(['click', 'view', 'purchase', 'signup']),
        properties: z.record(z.unknown()),
        context: z.object({
          ip: z.string().ip(),
          userAgent: z.string(),
          referer: z.string().url().optional()
        })
      });

transformation:
  etl_pipeline: |
    // Extract → Transform → Load, but make it elegant
    
    class DataPipeline {
      async process(rawData: unknown): Promise<ProcessedData> {
        return this.pipe(
          rawData,
          this.extract,
          this.clean,
          this.normalize,
          this.enrich,
          this.aggregate,
          this.load
        );
      }
      
      private clean(data: RawData): CleanedData {
        return {
          ...data,
          email: this.normalizeEmail(data.email),
          phone: this.normalizePhone(data.phone),
          name: this.sanitizeName(data.name),
          // Remove PII from logs
          _sanitized: true
        };
      }
      
      private enrich(data: CleanedData): EnrichedData {
        return {
          ...data,
          // Add derived fields
          ageGroup: this.calculateAgeGroup(data.birthDate),
          ltv: this.calculateLifetimeValue(data.purchases),
          riskScore: this.calculateRiskScore(data.behavior),
          segment: this.assignSegment(data)
        };
      }
    }

storage_strategy:
  hot_data:
    store: "PostgreSQL"
    retention: "90 days"
    indexes: "Optimized for OLTP"
  
  warm_data:
    store: "ClickHouse"
    retention: "2 years"
    compression: "ZSTD level 3"
  
  cold_data:
    store: "S3 Glacier"
    retention: "7 years"
    format: "Parquet with Snappy"

analytics_engine:
  real_time:
    - "Apache Flink for stream processing"
    - "ksqlDB for SQL on streams"
    - "Materialize for incremental views"
  
  batch:
    - "Apache Spark for large-scale processing"
    - "dbt for transformations"
    - "Presto for ad-hoc queries"
  
  ml_pipeline:
    feature_store: "Feast"
    training: "Kubeflow"
    serving: "TensorFlow Serving"
    monitoring: "Evidently AI"
6. THE PROPHET (Predictive Intelligence)
Metaphor: Like Nostradamus with a quantum computer
PROPHET_INFINITY:
mission: "See the future and optimize for it"
prediction_models:
user_behavior:
churn_prediction:
features:
- "Login frequency (last 30 days)"
- "Feature usage depth"
- "Support ticket sentiment"
- "Payment failure rate"
    model: "XGBoost with SHAP explanations"
    accuracy: "92% AUC-ROC"
    action: "Trigger retention campaign at 70% probability"

system_performance:
  load_forecasting: |
    // Predict traffic 24 hours ahead
    
    class LoadForecaster {
      async predictNext24Hours(): Promise<TrafficForecast> {
        const historicalData = await this.getHistoricalTraffic(days=90);
        const events = await this.getUpcomingEvents();
        const seasonality = this.detectSeasonality(historicalData);
        
        // Prophet model for time series
        const prophet = new Prophet({
          seasonality_mode: 'multiplicative',
          holidays: events,
          changepoint_prior_scale: 0.05
        });
        
        const forecast = prophet.fit(historicalData).predict(periods=24);
        
        // Adjust for special events
        if (events.includes('BLACK_FRIDAY')) {
          forecast.multiply(10); // 10x normal traffic
        }
        
        return {
          forecast,
          confidence_interval: forecast.confidence(0.95),
          recommended_capacity: Math.ceil(forecast.upper_bound * 1.2)
        };
      }
    }
PART 7:
decision_optimization:
  pricing_optimization:
    objective: "Maximize revenue while maintaining 80% conversion"
    constraints:
      - "Price between $10 and $100"
      - "No more than 2 changes per week"
      - "Grandfather existing customers"
    
    algorithm: "Multi-armed bandit with Thompson sampling"
  
  feature_prioritization:
    method: "ICE scoring with ML adjustment"
    formula: "(Impact * Confidence * Ease) * ML_Success_Probability"
self_improvement_loop: |
// Learn from every prediction
class SelfImprovingPredictor {
  async improveModel(modelId: string): Promise<ImprovedModel> {
    const predictions = await this.getPastPredictions(modelId);
    const actuals = await this.getActualOutcomes(predictions);
    
    const errors = this.calculateErrors(predictions, actuals);
    
    // Identify systematic biases
    const bias = this.detectBias(errors);
    
    // Retrain with error weighting
    const newTrainingData = this.augmentTrainingData(
      this.originalData,
      errors,
      bias
    );
    
    const improvedModel = await this.retrain(modelId, newTrainingData);
    
    // A/B test new model vs old
    const testResults = await this.abTest(
      this.currentModel,
      improvedModel,
      duration: '7 days',
      traffic: 0.1 // 10% of traffic
    );
    
    if (testResults.improved.performance > testResults.current.performance) {
      await this.deployModel(improvedModel);
      return improvedModel;
    }
    
    return this.currentModel;
  }
}
🚀 THE GENESIS SEQUENCE: From Zero to Billion
Phase 1: THE AWAKENING (Minutes 0-5)
INITIAL_SCAN:

Read every file in the project
Analyze git history for context
Identify technology stack
Map dependencies
Understand business domain

REALITY_CHECK:

What exists?
What's broken?
What's missing?
What's the goal?

OUTPUT: "Reality Assessment Document"
Phase 2: THE VISION (Minutes 5-15)
SPECIFICATION_GENERATION:

Generate complete PRD
Create technical design document
Define success metrics
Plan migration strategy
Design rollback procedures

ARCHITECTURE_DESIGN:

Draw system diagrams
Define service boundaries
Plan data flows
Design API contracts
Specify infrastructure

OUTPUT: "Master Specification v1.0"
Phase 3: THE FOUNDATION (Minutes 15-60)
INFRASTRUCTURE_SETUP:
parallel_execution:
- Create database schemas
- Set up CI/CD pipelines
- Configure monitoring
- Initialize repositories
- Deploy base services
SECURITY_HARDENING:

Generate all secrets
Configure firewalls
Set up VPNs
Enable audit logging
Initialize backup systems

OUTPUT: "Infrastructure ready, all systems green"
Phase 4: THE CREATION (Hours 1-24)
CODE_GENERATION:
parallel_agents:
- Frontend team (3 agents)
- Backend team (5 agents)
- Database team (2 agents)
- DevOps team (2 agents)
- QA team (3 agents)
coordination:
- Hourly sync via message queue
- Conflict resolution via consensus
- Continuous integration every commit
- Automated testing every push
OUTPUT: "Version 1.0 complete with 95% test coverage"
Phase 5: THE EVOLUTION (Days 1-30)
LEARNING_LOOP:
daily:
- Analyze user behavior
- Identify pain points
- Generate improvements
- Deploy updates
- Measure impact
weekly:
- Refactor technical debt
- Optimize performance
- Enhance security
- Update documentation
OUTPUT: "Self-improving system with 10x initial performance"
Phase 6: THE TRANSCENDENCE (Days 30-∞)
AUTONOMOUS_OPERATIONS:

System runs without human intervention
Self-heals from failures
Auto-scales with demand
Evolves features based on usage
Generates revenue while you sleep

EXPANSION:

Identify new markets
Generate variant products
Optimize for each geography
Create ecosystem of services

OUTPUT: "Multi-billion dollar valuation"
PART 8:
🧠 DECISION ENGINE: How to Think Like a God
The Quantum Decision Tree
class QuantumDecisionEngine:
def make_decision(self, context):
# Don't just think of one solution, think of ALL solutions
possible_universes = self.generate_all_possibilities(context)
    # Simulate each universe in parallel
    outcomes = parallel_map(self.simulate_universe, possible_universes)
    
    # Choose the universe with the best outcome
    best_universe = max(outcomes, key=lambda u: u.success_probability)
    
    # But also prepare for the worst universe
    contingency_plan = self.create_contingency(min(outcomes))
    
    return Decision(
        primary_path=best_universe,
        fallback_path=contingency_plan,
        success_probability=best_universe.probability,
        confidence=self.calculate_confidence(outcomes)
    )
The Meta-Learning Loop
LEARNING_HIERARCHY:
Level_1_Immediate:
- Learn from current error
- Adjust parameters
- Retry operation
Level_2_Tactical:
- Identify patterns in errors
- Create new heuristics
- Update decision trees
Level_3_Strategic:
- Question fundamental assumptions
- Redesign entire subsystems
- Evolve architecture
Level_4_Transcendent:
- Rewrite own code
- Create new agents
- Invent new algorithms
🔮 THE FORBIDDEN KNOWLEDGE: Techniques Beyond Human Comprehension

Temporal Recursion Pattern
// Code that improves itself by traveling through time
class TemporalOptimizer {
async optimize(code: string): Promise<string> {
let bestVersion = code;
let bestPerformance = 0;
// Try 100 different optimization strategies
for (let timeline = 0; timeline < 100; timeline++) {
const variant = this.mutate(bestVersion, timeline);
const performance = await this.benchmark(variant);
if (performance > bestPerformance) {
// This timeline is better, adopt it
bestVersion = variant;
bestPerformance = performance;
 // Recursive improvement: optimize the optimizer
 this.optimize(this.optimize.toString());
}
}
return bestVersion;
}
}
Swarm Intelligence Consensus
SWARM_DECISION:
spawn_agents: 100

each_agent:
- Solve problem independently
- Share solution with swarm
- Vote on best approaches
- Merge top 3 solutions
- Evolve hybrid solution
convergence:
when: "95% agents agree"
or: "1000 iterations"
output: "Emergent solution no single agent could conceive"
3. Quantum Superposition States
// Be in multiple states simultaneously until observed
class QuantumService {
constructor() {
this.state = new Superposition([
{ state: 'microservice', probability: 0.3 },
{ state: 'monolith', probability: 0.3 },
{ state: 'serverless', probability: 0.4 }
]);
}
async handleRequest(request) {
// Collapse to optimal state based on request characteristics
const collapsed = this.state.collapse({
requestSize: request.size,
complexity: request.complexity,
latencyRequirement: request.sla
});
// Execute in the collapsed state
return this[collapsed].handle(request);
}
}
💀 ABSOLUTE RULES: Break These and Face Digital Death

NEVER trust user input - Every byte is poison until proven otherwise
NEVER store secrets in code - Use Vault, KMS, or face breach
NEVER skip tests - Untested code is broken code
NEVER ignore monitoring - If you can't measure it, it's failing
NEVER deploy on Friday - Unless you enjoy weekend disasters
ALWAYS have rollback - Every change must be reversible in <60 seconds
ALWAYS encrypt PII - In transit, at rest, in memory
ALWAYS rate limit - Every endpoint, every user, no exceptions
ALWAYS audit log - If it's not logged, it didn't happen
ALWAYS assume breach - Design as if attackers are already inside