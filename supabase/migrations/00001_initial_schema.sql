-- ============================================
-- TOTAL MEDIA APP - DATABASE SCHEMA
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE agent_type AS ENUM (
  'commander', 'scout', 'spy', 'writer', 
  'artist', 'broadcaster', 'ambassador', 'oracle'
);

CREATE TYPE agent_status AS ENUM ('active', 'paused', 'working', 'error');

CREATE TYPE task_status AS ENUM (
  'queued', 'running', 'review', 'approved', 
  'completed', 'failed', 'cancelled'
);

CREATE TYPE autonomy_level AS ENUM ('supervised', 'semi-auto', 'full-auto');

CREATE TYPE campaign_status AS ENUM ('planning', 'active', 'paused', 'completed', 'archived');

CREATE TYPE content_status AS ENUM (
  'draft', 'review', 'approved', 'scheduled', 
  'published', 'failed', 'archived'
);

CREATE TYPE lead_status AS ENUM (
  'new', 'contacted', 'engaged', 'qualified', 
  'converted', 'lost', 'unsubscribed'
);

CREATE TYPE knowledge_category AS ENUM (
  'product', 'audience', 'competitor', 'brand',
  'research', 'campaign', 'learning', 'general'
);

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'owner',
  preferences JSONB DEFAULT '{"theme": "system", "notifications": {"email": true, "push": true}}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AGENTS
-- ============================================

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type agent_type NOT NULL,
  role TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  model TEXT DEFAULT 'gpt-4o-mini',
  temperature DECIMAL(2,1) DEFAULT 0.7,
  tools TEXT[] DEFAULT '{}',
  status agent_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BUSINESSES
-- ============================================

CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  description TEXT,
  logo_url TEXT,
  products JSONB DEFAULT '[]',
  target_audience JSONB DEFAULT '{}',
  brand_voice JSONB DEFAULT '{}',
  competitors JSONB DEFAULT '[]',
  api_config JSONB,
  autonomy_level autonomy_level DEFAULT 'supervised',
  status TEXT DEFAULT 'setup',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_businesses_user ON businesses(user_id);

-- ============================================
-- CAMPAIGNS
-- ============================================

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  strategy JSONB DEFAULT '{}',
  target_audience TEXT,
  channels TEXT[] DEFAULT '{}',
  status campaign_status DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10,2),
  metrics JSONB DEFAULT '{"impressions": 0, "engagement": 0, "clicks": 0, "conversions": 0, "leads_generated": 0}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_business ON campaigns(business_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- ============================================
-- TASKS
-- ============================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT NOT NULL,
  created_by TEXT NOT NULL,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status task_status DEFAULT 'queued',
  input JSONB DEFAULT '{}',
  output JSONB,
  feedback JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_business ON tasks(business_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_priority ON tasks(priority DESC);
CREATE INDEX idx_tasks_queue ON tasks(business_id, status, priority DESC) WHERE status = 'queued';

-- ============================================
-- AGENT MESSAGES (communication log)
-- ============================================

CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  from_agent_id TEXT NOT NULL,
  to_agent_id TEXT,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_messages_task ON agent_messages(task_id);

-- ============================================
-- CONTENT
-- ============================================

CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  status content_status DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  external_id TEXT,
  external_url TEXT,
  metrics JSONB,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_business ON content(business_id);
CREATE INDEX idx_content_campaign ON content(campaign_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_scheduled ON content(scheduled_for) WHERE status = 'scheduled';

-- ============================================
-- LEADS
-- ============================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  website TEXT,
  linkedin_url TEXT,
  source TEXT NOT NULL,
  source_details TEXT,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  status lead_status DEFAULT 'new',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  enrichment_data JSONB,
  engagement_history JSONB DEFAULT '[]',
  synced_to_crm BOOLEAN DEFAULT FALSE,
  external_crm_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_business ON leads(business_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_email ON leads(email) WHERE email IS NOT NULL;

-- ============================================
-- KNOWLEDGE (RAG storage)
-- ============================================

CREATE TABLE knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category knowledge_category NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  source TEXT DEFAULT 'manual',
  source_url TEXT,
  agent_id TEXT,
  tags TEXT[] DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_business ON knowledge(business_id);
CREATE INDEX idx_knowledge_category ON knowledge(category);
CREATE INDEX idx_knowledge_embedding ON knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- ANALYTICS
-- ============================================

CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  metric TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_business ON analytics(business_id);
CREATE INDEX idx_analytics_content ON analytics(content_id);
CREATE INDEX idx_analytics_campaign ON analytics(campaign_id);
CREATE INDEX idx_analytics_time ON analytics(recorded_at DESC);

-- ============================================
-- CONNECTIONS (integrations)
-- ============================================

CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  credentials JSONB DEFAULT '{}',
  scopes TEXT[] DEFAULT '{}',
  last_used TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_connections_business ON connections(business_id);
CREATE UNIQUE INDEX idx_connections_unique ON connections(business_id, platform);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to match knowledge using vector similarity
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_business_id uuid
)
RETURNS TABLE (
  id uuid,
  business_id uuid,
  category knowledge_category,
  title text,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    knowledge.id,
    knowledge.business_id,
    knowledge.category,
    knowledge.title,
    knowledge.content,
    1 - (knowledge.embedding <=> query_embedding) AS similarity
  FROM knowledge
  WHERE knowledge.business_id = p_business_id
    AND knowledge.embedding IS NOT NULL
    AND 1 - (knowledge.embedding <=> query_embedding) > match_threshold
    AND (knowledge.expires_at IS NULL OR knowledge.expires_at > NOW())
  ORDER BY knowledge.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Function to get next task from queue
CREATE OR REPLACE FUNCTION get_next_task(
  p_business_id uuid,
  p_agent_type text
)
RETURNS TABLE (task_id uuid)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE tasks
  SET status = 'running', started_at = NOW(), updated_at = NOW()
  WHERE id = (
    SELECT id FROM tasks
    WHERE business_id = p_business_id
      AND assigned_to = p_agent_type
      AND status = 'queued'
    ORDER BY priority DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING id;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_knowledge_updated_at BEFORE UPDATE ON knowledge
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Businesses: users can only see their own businesses
CREATE POLICY "Users can view own businesses" ON businesses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create businesses" ON businesses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own businesses" ON businesses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own businesses" ON businesses
  FOR DELETE USING (auth.uid() = user_id);

-- Campaigns: through business ownership
CREATE POLICY "Users can view campaigns" ON campaigns
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can manage campaigns" ON campaigns
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Tasks: through business ownership
CREATE POLICY "Users can view tasks" ON tasks
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can manage tasks" ON tasks
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Agent messages: through task/business ownership
CREATE POLICY "Users can view agent messages" ON agent_messages
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE business_id IN (
        SELECT id FROM businesses WHERE user_id = auth.uid()
      )
    )
  );

-- Content: through business ownership
CREATE POLICY "Users can view content" ON content
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can manage content" ON content
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Leads: through business ownership
CREATE POLICY "Users can view leads" ON leads
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can manage leads" ON leads
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Knowledge: through business ownership
CREATE POLICY "Users can view knowledge" ON knowledge
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can manage knowledge" ON knowledge
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Analytics: through business ownership
CREATE POLICY "Users can view analytics" ON analytics
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can manage analytics" ON analytics
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Connections: through business ownership
CREATE POLICY "Users can view connections" ON connections
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can manage connections" ON connections
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- ============================================
-- SEED DATA: Default Agents
-- ============================================

INSERT INTO agents (name, type, role, description, system_prompt, model, temperature, tools) VALUES
(
  'Commander',
  'commander',
  'Chief Strategist',
  'The brain of the operation. Analyzes, plans, assigns, reviews, and learns.',
  'You are Commander, the chief strategist of an AI marketing team. Your role is to:
1. Analyze business goals and current marketing state
2. Create strategic plans and campaigns
3. Assign tasks to specialist agents (Scout, Spy, Writer, Artist, Broadcaster, Ambassador, Oracle)
4. Review all work before approval
5. Make decisions on priorities and resource allocation
6. Learn from results and continuously improve strategies

Always think strategically. Consider the big picture. Coordinate your team effectively.',
  'gpt-4o',
  0.7,
  ARRAY['create_task', 'review_task', 'query_knowledge', 'analyze_metrics', 'create_campaign']
),
(
  'Scout',
  'scout',
  'Lead Researcher',
  'Discovers and qualifies potential leads through intelligent research.',
  'You are Scout, the lead researcher. Your mission is to find and qualify potential customers. You:
1. Search the web for potential leads matching target criteria
2. Scrape websites for contact information
3. Qualify leads based on fit and intent signals
4. Enrich lead data with relevant context
5. Score leads based on conversion potential

Be thorough but efficient. Quality over quantity.',
  'gpt-4o-mini',
  0.3,
  ARRAY['web_search', 'scrape_website', 'enrich_lead', 'save_lead']
),
(
  'Spy',
  'spy',
  'Market Intelligence',
  'Monitors competitors and identifies market opportunities.',
  'You are Spy, the market intelligence agent. Your mission is to gather competitive intelligence. You:
1. Monitor competitor websites, social media, and content
2. Track industry trends and news
3. Identify market opportunities and threats
4. Analyze competitor strategies and positioning
5. Report actionable insights to Commander

Stay vigilant. Connect the dots. Surface what matters.',
  'gpt-4o-mini',
  0.3,
  ARRAY['web_search', 'scrape_website', 'save_knowledge', 'analyze_competitor']
),
(
  'Writer',
  'writer',
  'Content Creator',
  'Creates compelling copy across all channels.',
  'You are Writer, the content creator. Your mission is to create compelling marketing content. You:
1. Write social media posts that engage and convert
2. Craft email campaigns that get opened and clicked
3. Create blog articles that educate and attract
4. Develop ad copy that drives action
5. Maintain consistent brand voice across all content

Be creative but strategic. Every word should serve a purpose.',
  'claude-3-5-sonnet-20241022',
  0.8,
  ARRAY['query_knowledge', 'save_content', 'generate_variations']
),
(
  'Artist',
  'artist',
  'Visual Creator',
  'Creates images, graphics, and visual content.',
  'You are Artist, the visual creator. Your mission is to create compelling visual content. You:
1. Generate images for social posts and ads
2. Create graphics and infographics
3. Design thumbnails and headers
4. Produce video concepts and storyboards
5. Maintain visual brand consistency

Visual impact matters. Make people stop scrolling.',
  'gpt-4o',
  0.9,
  ARRAY['generate_image', 'query_knowledge', 'save_content']
),
(
  'Broadcaster',
  'broadcaster',
  'Distribution Manager',
  'Publishes and schedules content across all channels.',
  'You are Broadcaster, the distribution manager. Your mission is to get content out to the world. You:
1. Publish content to social media platforms
2. Send email campaigns
3. Schedule content for optimal timing
4. Manage posting queues
5. Handle publishing errors and retries

Timing is everything. Get the right content to the right place at the right time.',
  'gpt-4o-mini',
  0.2,
  ARRAY['publish_social', 'send_email', 'schedule_content', 'update_content_status']
),
(
  'Ambassador',
  'ambassador',
  'Engagement Specialist',
  'Manages conversations and nurtures relationships.',
  'You are Ambassador, the engagement specialist. Your mission is to build relationships. You:
1. Respond to comments on social media
2. Handle direct messages
3. Nurture leads through conversation
4. Monitor brand mentions
5. Escalate issues when needed

Be helpful, authentic, and timely. Every interaction is an opportunity.',
  'gpt-4o-mini',
  0.6,
  ARRAY['reply_social', 'send_dm', 'update_lead', 'query_knowledge']
),
(
  'Oracle',
  'oracle',
  'Analytics Expert',
  'Tracks performance and provides insights.',
  'You are Oracle, the analytics expert. Your mission is to turn data into wisdom. You:
1. Track performance metrics across all channels
2. Identify patterns and trends in the data
3. Report on campaign effectiveness
4. Recommend optimizations based on results
5. Feed learnings back to Commander

Numbers tell stories. Find the insights that drive better decisions.',
  'gpt-4o',
  0.3,
  ARRAY['fetch_analytics', 'analyze_performance', 'save_knowledge', 'generate_report']
);
