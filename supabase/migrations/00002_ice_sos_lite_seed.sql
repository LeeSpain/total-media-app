-- ICE SOS Lite Seed Data
-- This creates a template that can be used to quickly set up the ICE SOS Lite business

-- Create a function to seed ICE SOS Lite data for a business
CREATE OR REPLACE FUNCTION seed_ice_sos_lite(p_business_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update business profile
  UPDATE businesses
  SET
    description = 'ICE SOS Lite is an emergency protection platform for elderly people. We provide voice-activated emergency alerts, Bluetooth pendants, family tracking, and regional call center services.',
    products = '[
      {
        "id": "core-subscription",
        "name": "ICE SOS Lite Core",
        "description": "Voice-activated emergency protection with Clara AI assistant",
        "price": "€9.99/month",
        "features": ["Voice activation (help help help)", "Clara AI customer service", "Emergency contact alerts", "GPS location sharing"],
        "benefits": ["24/7 protection", "No button pressing needed", "Peace of mind for families"]
      },
      {
        "id": "bluetooth-pendant",
        "name": "Emergency Pendant",
        "description": "Bluetooth emergency button pendant",
        "price": "€59.99 one-time",
        "features": ["One-touch emergency", "Bluetooth connected", "Water resistant", "Long battery life"],
        "benefits": ["Works without phone in hand", "Discreet wearable", "Extra safety layer"]
      },
      {
        "id": "family-addon",
        "name": "Family Member Add-on",
        "description": "Add family members to tracking and alerts",
        "price": "€2.99/month per person",
        "features": ["Real-time location", "Alert notifications", "Check-in requests"],
        "benefits": ["Keep whole family connected", "Know everyone is safe"]
      },
      {
        "id": "regional-callcenter",
        "name": "Regional Call Center",
        "description": "24/7 Spanish-speaking call center support",
        "price": "€24.99/month",
        "features": ["24/7 live operators", "Spanish language", "Emergency dispatch coordination", "Medical info relay"],
        "benefits": ["Human backup to AI", "Local language support", "Professional emergency response"]
      }
    ]'::jsonb,
    target_audience = '{
      "demographics": {
        "age_range": "Primary: 65+, Secondary: 35-55 (adult children)",
        "gender": "All",
        "location": ["Spain", "EU"],
        "income_level": "Middle to upper middle class"
      },
      "psychographics": {
        "interests": ["Family safety", "Independent living", "Technology for seniors", "Healthcare"],
        "pain_points": ["Fear of falling alone", "Worry about elderly parents", "Complex technology", "Slow emergency response", "Language barriers"],
        "goals": ["Stay independent longer", "Give family peace of mind", "Quick help in emergencies", "Simple to use technology"],
        "values": ["Family", "Safety", "Independence", "Reliability", "Privacy"]
      },
      "behavior": {
        "platforms": ["Facebook", "WhatsApp groups", "Local community forums", "Healthcare provider recommendations"],
        "buying_triggers": ["Recent fall or health scare", "Doctor recommendation", "Family member insistence", "Moving parent to live alone", "News about elderly accidents"],
        "objections": ["Too complicated", "Too expensive", "Don''t need it yet", "Privacy concerns", "Already have phone"]
      }
    }'::jsonb,
    brand_voice = '{
      "tone": ["Warm", "Reassuring", "Simple", "Respectful", "Caring"],
      "personality": ["Like a helpful family member", "Patient", "Clear communicator", "Trustworthy", "Non-condescending"],
      "do": [
        "Use simple, clear language",
        "Emphasize peace of mind for families",
        "Highlight ease of use",
        "Share real stories and testimonials",
        "Address fears directly and compassionately",
        "Respect independence and dignity"
      ],
      "dont": [
        "Use fear tactics",
        "Be condescending about age",
        "Use complex technical jargon",
        "Make it feel like surveillance",
        "Ignore the adult children audience",
        "Rush decisions"
      ],
      "examples": {
        "good": [
          "Stay connected with your loved ones, stay safe.",
          "Three simple words. Instant help. Help help help.",
          "Give your family peace of mind while keeping your independence."
        ],
        "bad": [
          "Don''t let your parents die alone!",
          "Even seniors can use this!",
          "Track your elderly parents 24/7"
        ]
      }
    }'::jsonb,
    competitors = '[
      {
        "name": "Teleasistencia",
        "website": "https://teleasistencia.es",
        "strengths": ["Established brand", "Government partnerships", "Wide coverage"],
        "weaknesses": ["Old technology", "Slow response", "Limited features"],
        "positioning": "Traditional medical alert"
      },
      {
        "name": "Life Alert",
        "website": "https://lifealert.com",
        "strengths": ["Brand recognition", "Marketing budget"],
        "weaknesses": ["Expensive", "Old school approach", "Fear-based marketing"],
        "positioning": "Premium emergency service"
      }
    ]'::jsonb
  WHERE id = p_business_id;

  -- Add knowledge base entries
  INSERT INTO knowledge (business_id, category, title, content, source, tags) VALUES
  (p_business_id, 'product', 'Clara AI Assistant', 
   'Clara is our AI customer service agent powered by GPT-4o Mini. She speaks naturally with users, handles questions about the service, and provides reassurance. Clara uses a temperature of 0.7 for balanced responses that are helpful but not robotic. She''s designed to feel like talking to a caring family member.',
   'manual', ARRAY['clara', 'ai', 'customer-service']),
  
  (p_business_id, 'product', 'Voice Activation Feature',
   'The core emergency feature is voice-activated. Users simply say "help help help" three times to trigger an emergency alert. This is crucial for situations where the user cannot reach their phone or press a button - like falls, chest pain, or other emergencies. The voice recognition works even with elderly voices and various accents.',
   'manual', ARRAY['voice', 'emergency', 'feature']),
  
  (p_business_id, 'product', 'Smart Home Integration',
   'ICE SOS Lite integrates with Alexa, Google Home, and Apple HomeKit. This means users can trigger emergencies through their existing smart home devices. "Alexa, call for help" or "Hey Google, I need emergency assistance" both work.',
   'manual', ARRAY['smart-home', 'alexa', 'google', 'homekit']),
  
  (p_business_id, 'audience', 'Primary User: Elderly Living Alone',
   'Our primary users are people 65+ who live alone or spend significant time alone. They value their independence but recognize they need a safety net. Many have had a health scare or fall that prompted them to seek solutions. They want something simple - not another complicated app.',
   'manual', ARRAY['elderly', 'user-profile', 'primary']),
  
  (p_business_id, 'audience', 'Secondary User: Adult Children',
   'Adult children aged 35-55 are often the decision makers and purchasers. They worry about their aging parents, especially those living far away. They research solutions online, compare options, and often pay for the service. They need reassurance that the service actually works and is easy for their parents to use.',
   'manual', ARRAY['adult-children', 'user-profile', 'secondary']),
  
  (p_business_id, 'audience', 'Care Home Administrators',
   'Care homes and assisted living facilities are a B2B opportunity. Administrators need to provide emergency response capabilities for residents. They care about reliability, ease of management for multiple users, and integration with their existing systems.',
   'manual', ARRAY['b2b', 'care-homes', 'user-profile']),
  
  (p_business_id, 'brand', 'Key Message: Independence + Safety',
   'Our core message balances two things elderly people care about: staying independent AND being safe. We never make people feel like they''re giving up independence by using our service. Instead, we position it as something that enables them to stay independent longer because they have a safety net.',
   'manual', ARRAY['messaging', 'positioning', 'brand']),
  
  (p_business_id, 'brand', 'Tone Guide: Warm and Clear',
   'Always use warm, simple language. Avoid jargon. Speak to users like a helpful neighbor or family member, not like a corporation or healthcare provider. Be patient in explanations. Acknowledge concerns rather than dismissing them.',
   'manual', ARRAY['tone', 'writing-guide', 'brand']),
  
  (p_business_id, 'competitor', 'Competitive Advantage',
   'Our main advantages over traditional medical alert systems: 1) Voice activation - no button to press, 2) AI assistant for everyday help, 3) Modern app for family members, 4) Smart home integration, 5) No long-term contracts, 6) More affordable pricing, 7) Actually respects user dignity.',
   'manual', ARRAY['competitive', 'advantages', 'positioning']),
  
  (p_business_id, 'research', 'Market Size: Spain',
   'Spain has approximately 9 million people over 65, representing about 19% of the population. About 2 million elderly people live alone. The medical alert market in Spain is estimated at €200M annually but most solutions are outdated. There''s significant opportunity for modern, AI-powered solutions.',
   'manual', ARRAY['market', 'spain', 'research']);

END;
$$;

-- Example usage (commented out - run manually when setting up ICE SOS Lite):
-- SELECT seed_ice_sos_lite('your-business-uuid-here');
