import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Bot, Zap, Brain, Target, BarChart3, Shield, Search, Eye, Pen, Palette, Radio, MessageCircle, ArrowRight, Check } from 'lucide-react'

const agents = [
  { id: 'commander', name: 'Commander', role: 'Chief Strategist', icon: Bot, color: 'bg-commander' },
  { id: 'scout', name: 'Scout', role: 'Lead Researcher', icon: Search, color: 'bg-scout' },
  { id: 'spy', name: 'Spy', role: 'Market Intel', icon: Eye, color: 'bg-spy' },
  { id: 'writer', name: 'Writer', role: 'Content Creator', icon: Pen, color: 'bg-writer' },
  { id: 'artist', name: 'Artist', role: 'Visual Creator', icon: Palette, color: 'bg-artist' },
  { id: 'broadcaster', name: 'Broadcaster', role: 'Distribution', icon: Radio, color: 'bg-broadcaster' },
  { id: 'ambassador', name: 'Ambassador', role: 'Engagement', icon: MessageCircle, color: 'bg-ambassador' },
  { id: 'oracle', name: 'Oracle', role: 'Analytics', icon: BarChart3, color: 'bg-oracle' },
]

const features = [
  { icon: Zap, title: 'Autonomous', desc: 'AI agents work independently, only escalating when needed' },
  { icon: Brain, title: 'Intelligent', desc: 'RAG-powered memory learns your brand and improves over time' },
  { icon: Target, title: 'Targeted', desc: 'Find and nurture the right leads for your business' },
  { icon: BarChart3, title: 'Optimized', desc: 'Continuous analysis and optimization of campaigns' },
  { icon: Shield, title: 'Controlled', desc: 'Set autonomy levels from supervised to fully automatic' },
  { icon: Bot, title: 'Scalable', desc: 'Your AI team grows with your business needs' },
]

const pricing = [
  { 
    name: 'Starter', 
    price: '€49', 
    period: '/month',
    features: ['1 business', '1,000 AI actions/month', 'Basic agents', 'Email support'],
    cta: 'Start Free Trial',
    popular: false
  },
  { 
    name: 'Growth', 
    price: '€149', 
    period: '/month',
    features: ['3 businesses', '10,000 AI actions/month', 'All agents', 'Priority support', 'Custom integrations'],
    cta: 'Start Free Trial',
    popular: true
  },
  { 
    name: 'Enterprise', 
    price: 'Custom', 
    period: '',
    features: ['Unlimited businesses', 'Unlimited actions', 'Dedicated support', 'Custom agents', 'On-premise option'],
    cta: 'Contact Sales',
    popular: false
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <span className="font-bold text-2xl gradient-text">
          TotalMedia
        </span>
        <div className="flex gap-4">
          <Link to="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
          <Zap size={14} />
          AI-Powered Marketing Automation
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Your AI Marketing
          <br />
          <span className="gradient-text">Dream Team</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          8 specialized AI agents working 24/7 to grow your business.
          Research leads, create content, publish campaigns, and analyze results — autonomously.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/register">
            <Button size="lg" className="px-8">
              Start Free Trial
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
          <Button size="lg" variant="outline">
            Watch Demo
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          No credit card required • 14-day free trial
        </p>
      </section>

      {/* Agents */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Meet Your AI Team</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Each agent is specialized in a critical aspect of marketing, working together seamlessly.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {agents.map((agent) => {
            const Icon = agent.icon
            return (
              <div key={agent.id} className="p-6 rounded-xl bg-card border text-center hover:shadow-lg transition-shadow">
                <div className={`w-16 h-16 ${agent.color} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                  <Icon className="text-white" size={28} />
                </div>
                <h3 className="font-bold text-lg">{agent.name}</h3>
                <p className="text-muted-foreground text-sm">{agent.role}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 bg-muted/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why TotalMedia?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            More than a tool — a complete marketing department powered by AI.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="p-6 rounded-xl bg-card">
              <feature.icon className="text-primary mb-4" size={32} />
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
        </div>
        <div className="max-w-3xl mx-auto">
          {[
            { step: '1', title: 'Connect Your Business', desc: 'Add your business info, products, and target audience. Use our templates or start from scratch.' },
            { step: '2', title: 'Set Your Goals', desc: 'Tell Commander what you want to achieve. More leads? More engagement? Brand awareness?' },
            { step: '3', title: 'Let AI Work', desc: 'The agent team executes your strategy autonomously. Review and approve or go fully automatic.' },
            { step: '4', title: 'Watch Results', desc: 'Oracle tracks everything. See what\'s working, get recommendations, and continuously improve.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-6 mb-8 last:mb-0">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20 bg-muted/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-muted-foreground">Start free, scale as you grow</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricing.map((plan) => (
            <div
              key={plan.name}
              className={`p-6 rounded-xl bg-card border ${plan.popular ? 'border-primary ring-2 ring-primary' : ''}`}
            >
              {plan.popular && (
                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full mb-4">
                  Most Popular
                </span>
              )}
              <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check size={16} className="text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-gradient-to-r from-commander/20 to-oracle/20 border">
          <h2 className="text-3xl font-bold mb-4">Ready to Scale Your Marketing?</h2>
          <p className="text-muted-foreground mb-6">
            Join hundreds of businesses already using AI agents to grow.
          </p>
          <Link to="/register">
            <Button size="lg">
              Get Started Free
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-bold text-xl gradient-text">TotalMedia</span>
          <p className="text-sm text-muted-foreground">© 2024 TotalMedia. Built with AI, for growth.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
