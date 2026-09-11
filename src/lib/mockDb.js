// ============================================================
// src/lib/mockDb.js
// Full mock database for SurakshaAR demo mode (no Supabase)
// ============================================================

// ─── localStorage helpers ────────────────────────────────────
function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('[mockDb] localStorage save failed:', e)
  }
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ─── Demo Scenarios ──────────────────────────────────────────
const DEMO_SCENARIOS = [
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000001',
    title: 'Fire & Explosion Response',
    title_hi: 'आग और विस्फोट प्रतिक्रिया',
    title_sat: 'Fire & Explosion Response',
    description: 'Simulate responding to an electrical fire on a manufacturing floor. Identify the hazard, activate emergency protocols, don PPE, use the correct extinguisher, and evacuate safely.',
    description_hi: 'एक मैन्युफैक्चरिंग फ्लोर पर बिजली की आग का जवाब देने का अभ्यास करें। खतरे की पहचान करें, आपातकालीन प्रोटोकॉल सक्रिय करें, PPE पहनें, सही अग्निशामक का उपयोग करें और सुरक्षित निकासी करें।',
    description_sat: 'Simulate responding to an electrical fire on a manufacturing floor. Identify the hazard, activate emergency protocols, don PPE, use the correct extinguisher, and evacuate safely.',
    hazard_type: 'fire',
    difficulty: 'beginner',
    benchmark_time_ms: 90000,
    thumbnail_url: null,
    created_at: new Date('2026-01-01').toISOString(),
    steps: [
      { index: 0, label: 'Identify Fire Source', instruction: 'Point camera at fire hazard for real-time computer vision detection, or locate the fire near the control panel', position: [3, 1.2, 3], color: '#ef4444', is_ppe_step: false },
      { index: 1, label: 'Trigger Fire Alarm', instruction: 'Activate the nearest manual fire alarm call point', position: [2.5, 2.0, -2], color: '#f97316', is_ppe_step: false },
      { index: 2, label: 'Equip Fire-Rated PPE', instruction: 'Put on fire-rated gloves, helmet, and protective gear from the station', position: [-4, 0.9, 1], color: '#22c55e', is_ppe_step: true },
      { index: 3, label: 'Use CO\u2082 Extinguisher', instruction: 'Select the correct CO\u2082 extinguisher and aim at the base of the fire', position: [1.5, 0.8, 2], color: '#3b82f6', is_ppe_step: false },
      { index: 4, label: 'Use Fire Exit', instruction: 'Proceed through the nearest clearly marked fire exit', position: [-6, 1.5, -5], color: '#8b5cf6', is_ppe_step: false },
      { index: 5, label: 'Reach Muster Point', instruction: 'Assemble at the outdoor safe muster point for roll call', position: [0, 1.0, 10], color: '#a855f7', is_ppe_step: false },
    ],
  },
  {
    id: 'a1b2c3d4-0002-0002-0002-000000000002',
    title: 'Gas Leak & Confined Space Protocol',
    title_hi: 'गैस रिसाव और सीमित स्थान प्रोटोकॉल',
    title_sat: 'Gas Leak & Confined Space Protocol',
    description: 'Practice responding to a hazardous gas leak in a mining tunnel using the buddy system. Identify the leak, activate protocols, don breathing apparatus, and evacuate safely.',
    description_hi: 'बडी सिस्टम का उपयोग करते हुए माइनिंग सुरंग में खतरनाक गैस रिसाव का जवाब देने का अभ्यास करें। रिसाव की पहचान करें, प्रोटोकॉल सक्रिय करें, श्वास उपकरण पहनें और सुरक्षित निकासी करें।',
    description_sat: 'Practice responding to a hazardous gas leak in a mining tunnel using the buddy system. Identify the leak, activate protocols, don breathing apparatus, and evacuate safely.',
    hazard_type: 'gas_leak',
    difficulty: 'intermediate',
    benchmark_time_ms: 120000,
    thumbnail_url: null,
    created_at: new Date('2026-01-01').toISOString(),
    steps: [
      { index: 0, label: 'Identify Gas Leak Warning', instruction: 'Click the gas pipe leak to identify the hazard', position: [-2.5, 1.2, 2], color: '#f59e0b', is_ppe_step: false },
      { index: 1, label: 'Activate Emergency Alarm', instruction: 'Trigger the alarm panel to alert all workers', position: [2.8, 1.5, -1], color: '#ef4444', is_ppe_step: false },
      { index: 2, label: 'Apply Buddy System', instruction: 'Confirm your buddy \u2014 never enter alone. One person watches from outside.', position: [0, 1.2, 1], color: '#06b6d4', is_ppe_step: false },
      { index: 3, label: 'Don Gas Mask / SCBA', instruction: 'Pick up the gas mask and SCBA breathing apparatus from the safety locker', position: [-2.5, 0.8, -4], color: '#22c55e', is_ppe_step: true },
      { index: 4, label: 'Evacuate Personnel', instruction: 'Guide all workers toward the tunnel exit', position: [0, 1.0, -8], color: '#3b82f6', is_ppe_step: false },
      { index: 5, label: 'Reach Muster Point', instruction: 'Assemble at the designated safe muster point outside', position: [0, 1.0, 10], color: '#a855f7', is_ppe_step: false },
    ],
  },
  {
    id: 'a1b2c3d4-0003-0003-0003-000000000003',
    title: 'Machinery Safety & Lockout/Tagout',
    title_hi: 'मशीनरी सुरक्षा और लॉकआउट/टैगआउट',
    title_sat: 'Machinery Safety & Lockout/Tagout',
    description: 'Learn to safely isolate and lock out machinery before maintenance using the LOTO procedure. Prevents accidental machine startup during maintenance.',
    description_hi: 'LOTO प्रक्रिया का उपयोग करते हुए रखरखाव से पहले मशीनरी को सुरक्षित रूप से अलग और लॉक करना सीखें। रखरखाव के दौरान आकस्मिक मशीन स्टार्टअप को रोकता है।',
    description_sat: 'Learn to safely isolate and lock out machinery before maintenance using the LOTO procedure. Prevents accidental machine startup during maintenance.',
    hazard_type: 'machinery',
    difficulty: 'advanced',
    benchmark_time_ms: 150000,
    thumbnail_url: null,
    coming_soon: true,
    created_at: new Date('2026-01-01').toISOString(),
    steps: [],
  },
]

// ─── Demo Questions ──────────────────────────────────────────
const DEMO_QUESTIONS = [
  // Fire & Explosion (scenario 0001)
  {
    id: 'q-fire-001',
    scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
    question_en: 'Which type of fire extinguisher should be used for an electrical fire?',
    question_hi: '\u092c\u093f\u091c\u0932\u0940 \u0915\u0940 \u0906\u0917 \u0915\u0947 \u0932\u093f\u090f \u0915\u094c\u0928 \u0938\u093e \u0905\u0917\u094d\u0928\u093f\u0936\u093e\u092e\u0915 \u0909\u092a\u092f\u094b\u0917 \u0915\u0930\u0928\u093e \u091a\u093e\u0939\u093f\u090f?',
    question_sat: '\u092c\u093f\u091c\u0932\u0940 \u0906\u0917 \u0932\u093e \u0915\u094b\u0928 extinguisher \u091a\u093e\u092c\u093e\u0935?',
    options_en: ['Water (Red)', 'CO\u2082 (Black)', 'Petrol', 'Foam (Cream)'],
    options_hi: ['\u092a\u093e\u0928\u0940 (\u0932\u093e\u0932)', 'CO\u2082 (\u0915\u093e\u0932\u093e)', '\u092a\u0947\u091f\u094d\u0930\u094b\u0932', '\u092b\u094b\u092e (\u0915\u094d\u0930\u0940\u092e)'],
    correct_index: 1,
    explanation_en: 'CO\u2082 extinguishers are safe for electrical fires as they do not conduct electricity. Never use water on electrical fires \u2014 it conducts electricity and can cause electrocution.',
    explanation_hi: 'CO\u2082 \u0905\u0917\u094d\u0928\u093f\u0936\u093e\u092e\u0915 \u092c\u093f\u091c\u0932\u0940 \u0915\u0947 \u0932\u093f\u090f \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u0939\u0948 \u0915\u094d\u092f\u094b\u0902\u0915\u093f \u092f\u0939 \u092c\u093f\u091c\u0932\u0940 \u0915\u093e \u0938\u0902\u091a\u093e\u0932\u0928 \u0928\u0939\u0940\u0902 \u0915\u0930\u0924\u093e\u0964 \u092c\u093f\u091c\u0932\u0940 \u0915\u0940 \u0906\u0917 \u092a\u0930 \u092a\u093e\u0928\u0940 \u0915\u093e \u0909\u092a\u092f\u094b\u0917 \u0915\u092d\u0940 \u0928 \u0915\u0930\u0947\u0902\u0964',
    order_index: 1,
  },
  {
    id: 'q-fire-002',
    scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
    question_en: 'What does PASS stand for when using a fire extinguisher?',
    question_hi: '\u0905\u0917\u094d\u0928\u093f\u0936\u093e\u092e\u0915 \u0909\u092a\u092f\u094b\u0917 \u0915\u0930\u0924\u0947 \u0938\u092e\u092f PASS \u0915\u093e \u0915\u094d\u092f\u093e \u0905\u0930\u094d\u0925 \u0939\u0948?',
    question_sat: 'PASS ka matlab?',
    options_en: ['Pull, Aim, Squeeze, Sweep', 'Push, Alert, Spray, Secure', 'Prepare, Aim, Start, Stop', 'Pull, Apply, Shoot, Save'],
    options_hi: ['\u0916\u0940\u0902\u091a\u0947\u0902, \u0932\u0915\u094d\u0937\u094d\u092f \u0915\u0930\u0947\u0902, \u0926\u092c\u093e\u090f\u0902, \u091d\u093e\u095c\u0942 \u0932\u0917\u093e\u090f\u0902', '\u0927\u0915\u0947\u0932\u0947\u0902, \u0938\u091a\u0947\u0924 \u0915\u0930\u0947\u0902, \u0938\u094d\u092a\u094d\u0930\u0947 \u0915\u0930\u0947\u0902, \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u0915\u0930\u0947\u0902', '\u0924\u0948\u092f\u093e\u0930 \u0915\u0930\u0947\u0902, \u0932\u0915\u094d\u0937\u094d\u092f \u0915\u0930\u0947\u0902, \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902, \u0930\u094b\u0915\u0947\u0902', '\u0916\u0940\u0902\u091a\u0947\u0902, \u0932\u0917\u093e\u090f\u0902, \u0936\u0942\u091f \u0915\u0930\u0947\u0902, \u092c\u091a\u093e\u090f\u0902'],
    correct_index: 0,
    explanation_en: 'PASS: Pull the safety pin \u2192 Aim at the base of the fire \u2192 Squeeze the handle \u2192 Sweep from side to side at the base.',
    explanation_hi: 'PASS: \u092a\u093f\u0928 \u0916\u0940\u0902\u091a\u0947\u0902 \u2192 \u0906\u0917 \u0915\u0940 \u091c\u095c \u092a\u0930 \u0928\u093f\u0936\u093e\u0928\u093e \u0932\u0917\u093e\u090f\u0902 \u2192 \u0939\u0948\u0902\u0921\u0932 \u0926\u092c\u093e\u090f\u0902 \u2192 \u0906\u0927\u093e\u0930 \u092a\u0930 \u0926\u093e\u090f\u0902-\u092c\u093e\u090f\u0902 \u091d\u093e\u095c\u0942 \u0932\u0917\u093e\u090f\u0902\u0964',
    order_index: 2,
  },
  {
    id: 'q-fire-003',
    scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
    question_en: 'What is the FIRST action you should take when you discover a fire?',
    question_hi: '\u091c\u092c \u0906\u092a \u0906\u0917 \u0926\u0947\u0916\u0947\u0902 \u0924\u094b \u0938\u092c\u0938\u0947 \u092a\u0939\u0932\u0947 \u0915\u094d\u092f\u093e \u0915\u0930\u0928\u093e \u091a\u093e\u0939\u093f\u090f?',
    question_sat: '\u0906\u0917 \u0926\u0947\u0916\u0932\u093e \u092a\u0939\u0932\u0947 \u0915\u093e \u0915\u0930\u092c\u093e\u0935?',
    options_en: ['Try to extinguish it immediately', 'Activate the fire alarm and alert others', 'Call your supervisor', 'Grab your belongings and leave'],
    options_hi: ['\u0924\u0941\u0930\u0902\u0924 \u0907\u0938\u0947 \u092c\u0941\u091d\u093e\u0928\u0947 \u0915\u0940 \u0915\u094b\u0936\u093f\u0936 \u0915\u0930\u0947\u0902', '\u092b\u093e\u092f\u0930 \u0905\u0932\u093e\u0930\u094d\u092e \u091a\u093e\u0932\u0942 \u0915\u0930\u0947\u0902 \u0914\u0930 \u0926\u0942\u0938\u0930\u094b\u0902 \u0915\u094b \u0938\u091a\u0947\u0924 \u0915\u0930\u0947\u0902', '\u0905\u092a\u0928\u0947 \u0938\u0941\u092a\u0930\u0935\u093e\u0907\u091c\u0930 \u0915\u094b \u0915\u0949\u0932 \u0915\u0930\u0947\u0902', '\u0938\u093e\u092e\u093e\u0928 \u0909\u0920\u093e\u090f\u0902 \u0914\u0930 \u0928\u093f\u0915\u0932 \u091c\u093e\u090f\u0902'],
    correct_index: 1,
    explanation_en: 'Always activate the fire alarm FIRST to warn others. Only attempt to fight the fire if it is small, you are trained, and you have an exit behind you.',
    explanation_hi: '\u0939\u092e\u0947\u0936\u093e \u092a\u0939\u0932\u0947 \u092b\u093e\u092f\u0930 \u0905\u0932\u093e\u0930\u094d\u092e \u091a\u093e\u0932\u0942 \u0915\u0930\u0947\u0902 \u0924\u093e\u0915\u093f \u0926\u0942\u0938\u0930\u094b\u0902 \u0915\u094b \u091a\u0947\u0924\u093e\u0935\u0928\u0940 \u092e\u093f\u0932\u0947\u0964 \u091b\u094b\u091f\u0940 \u0906\u0917 \u0915\u094b \u092c\u0941\u091d\u093e\u0928\u0947 \u0915\u0940 \u0915\u094b\u0936\u093f\u0936 \u0915\u0947\u0935\u0932 \u0924\u092d\u0940 \u0915\u0930\u0947\u0902 \u091c\u092c \u0906\u092a \u092a\u094d\u0930\u0936\u093f\u0915\u094d\u0937\u093f\u0924 \u0939\u094b\u0902\u0964',
    order_index: 3,
  },
  {
    id: 'q-fire-004',
    scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
    question_en: 'Which PPE is mandatory when approaching a fire in an industrial setting?',
    question_hi: '\u0914\u0926\u094d\u092f\u094b\u0917\u093f\u0915 \u092a\u0930\u093f\u0935\u0947\u0936 \u092e\u0947\u0902 \u0906\u0917 \u0915\u0947 \u092a\u093e\u0938 \u091c\u093e\u0924\u0947 \u0938\u092e\u092f \u0915\u094c\u0928 \u0938\u093e PPE \u0905\u0928\u093f\u0935\u093e\u0930\u094d\u092f \u0939\u0948?',
    question_sat: '\u0906\u0917 \u0932\u093e PPE \u0915\u094b\u0928\u094b?',
    options_en: ['Only gloves', 'Safety helmet and high-visibility vest', 'Fire-rated helmet, heat-resistant gloves, goggles, and safety boots', 'Regular work clothes'],
    options_hi: ['\u0915\u0947\u0935\u0932 \u0926\u0938\u094d\u0924\u093e\u0928\u0947', '\u0938\u0947\u092b\u094d\u091f\u0940 \u0939\u0947\u0932\u092e\u0947\u091f \u0914\u0930 \u0939\u093e\u0908-\u0935\u093f\u091c\u093f\u092c\u093f\u0932\u093f\u091f\u0940 \u0935\u0947\u0938\u094d\u091f', '\u092b\u093e\u092f\u0930-\u0930\u0947\u091f\u0947\u0921 \u0939\u0947\u0932\u092e\u0947\u091f, \u0917\u0930\u094d\u092e\u0940-\u092a\u094d\u0930\u0924\u093f\u0930\u094b\u0927\u0940 \u0926\u0938\u094d\u0924\u093e\u0928\u0947, \u091a\u0936\u094d\u092e\u0947 \u0914\u0930 \u0938\u0947\u092b\u094d\u091f\u0940 \u092c\u0942\u091f\u094d\u0938', '\u0938\u093e\u092e\u093e\u0928\u094d\u092f \u0915\u093e\u092e \u0915\u0947 \u0915\u092a\u095c\u0947'],
    correct_index: 2,
    explanation_en: 'Complete fire PPE includes: fire-rated safety helmet, heat-resistant gloves, safety goggles, flame-retardant vest, and steel-toed safety boots.',
    explanation_hi: '\u092a\u0942\u0930\u0947 \u0905\u0917\u094d\u0928\u093f PPE \u092e\u0947\u0902 \u0936\u093e\u092e\u093f\u0932 \u0939\u0948\u0902: \u092b\u093e\u092f\u0930-\u0930\u0947\u091f\u0947\u0921 \u0939\u0947\u0932\u092e\u0947\u091f, \u0917\u0930\u094d\u092e\u0940-\u092a\u094d\u0930\u0924\u093f\u0930\u094b\u0927\u0940 \u0926\u0938\u094d\u0924\u093e\u0928\u0947, \u0938\u0947\u092b\u094d\u091f\u0940 \u091a\u0936\u094d\u092e\u0947, \u092b\u094d\u0932\u0947\u092e-\u0930\u093f\u091f\u093e\u0930\u094d\u0921\u0947\u0902\u091f \u0935\u0947\u0938\u094d\u091f, \u0914\u0930 \u0938\u094d\u091f\u0940\u0932-\u091f\u094b\u0921 \u0938\u0947\u092b\u094d\u091f\u0940 \u092c\u0942\u091f\u094d\u0938\u0964',
    order_index: 4,
  },
  {
    id: 'q-fire-005',
    scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
    question_en: 'During fire evacuation, should you use elevators?',
    question_hi: '\u0906\u0917 \u0928\u093f\u0915\u093e\u0938\u0940 \u0915\u0947 \u0926\u094c\u0930\u093e\u0928 \u0915\u094d\u092f\u093e \u0932\u093f\u092b\u094d\u091f \u0915\u093e \u0909\u092a\u092f\u094b\u0917 \u0915\u0930\u0928\u093e \u091a\u093e\u0939\u093f\u090f?',
    question_sat: '\u0906\u0917 \u092e\u0947\u0902 lift \u0907\u0938\u094d\u0924\u0947\u092e\u093e\u0932 \u0939\u094b\u092e \u0915\u093e?',
    options_en: ['Yes, to evacuate quickly', 'Only if the fire is on a lower floor', 'No \u2014 always use stairwells and marked exits', 'Only if you are injured'],
    options_hi: ['\u0939\u093e\u0902, \u091c\u0932\u094d\u0926\u0940 \u0928\u093f\u0915\u0932\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f', '\u0915\u0947\u0935\u0932 \u0905\u0917\u0930 \u0906\u0917 \u0928\u0940\u091a\u0947 \u0915\u0940 \u092e\u0902\u091c\u093f\u0932 \u092a\u0930 \u0939\u094b', '\u0928\u0939\u0940\u0902 \u2014 \u0939\u092e\u0947\u0936\u093e \u0938\u0940\u095c\u093f\u092f\u094b\u0902 \u0914\u0930 \u091a\u093f\u0939\u094d\u0928\u093f\u0924 \u0928\u093f\u0915\u093e\u0938\u094b\u0902 \u0915\u093e \u0909\u092a\u092f\u094b\u0917 \u0915\u0930\u0947\u0902', '\u0915\u0947\u0935\u0932 \u0905\u0917\u0930 \u0906\u092a \u0918\u093e\u092f\u0932 \u0939\u094b\u0902'],
    correct_index: 2,
    explanation_en: 'NEVER use elevators during a fire. Power may fail trapping occupants. Always use stairwells and marked fire exits. Close doors behind you to slow fire spread.',
    explanation_hi: '\u0906\u0917 \u0915\u0947 \u0926\u094c\u0930\u093e\u0928 \u0932\u093f\u092b\u094d\u091f \u0915\u093e \u0909\u092a\u092f\u094b\u0917 \u0915\u092d\u0940 \u0928 \u0915\u0930\u0947\u0902\u0964 \u092c\u093f\u091c\u0932\u0940 \u092c\u0902\u0926 \u0939\u094b \u0938\u0915\u0924\u0940 \u0939\u0948\u0964 \u0939\u092e\u0947\u0936\u093e \u0938\u0940\u095c\u093f\u092f\u094b\u0902 \u0914\u0930 \u091a\u093f\u0939\u094d\u0928\u093f\u0924 \u0928\u093f\u0915\u093e\u0938\u094b\u0902 \u0915\u093e \u0909\u092a\u092f\u094b\u0917 \u0915\u0930\u0947\u0902\u0964',
    order_index: 5,
  },
  {
    id: 'q-fire-006',
    scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
    question_en: 'What is the most common cause of death in an industrial fire incident?',
    question_hi: 'औद्योगिक आग की दुर्घटना में मृत्यु का सबसे आम कारण क्या है?',
    question_sat: 'Fire me death ka main reason?',
    options_en: ['Direct thermal burns', 'Toxic smoke and carbon monoxide inhalation', 'Structural building collapse', 'Electric shock'],
    options_hi: ['सीधे जलने से', 'जहरीला धुआं और कार्बन मोनोऑक्साइड सांस में जाना', 'इमारत का गिरना', 'बिजली का झटका'],
    correct_index: 1,
    explanation_en: 'Over 70% of fire-related deaths are caused by smoke and toxic gas inhalation (such as Carbon Monoxide and Hydrogen Cyanide), rather than flames.',
    explanation_hi: 'आग से होने वाली 70% से अधिक मौतें लपटों के बजाय जहरीले धुएं और कार्बन मोनोऑक्साइड सांस में जाने के कारण होती हैं।',
    order_index: 6,
  },
  {
    id: 'q-fire-007',
    scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
    question_en: 'What is the recommended safe distance when deploying a portable fire extinguisher?',
    question_hi: 'पोर्टेबल अग्निशामक का उपयोग करते समय अनुशंसित सुरक्षित दूरी क्या है?',
    question_sat: 'Extinguisher safe distance?',
    options_en: ['6 to 8 feet (approx. 2 meters)', 'Directly touching the flame', '15 to 20 meters away', 'Distance does not matter'],
    options_hi: ['6 से 8 फीट (लगभग 2 मीटर)', 'लपटों के बिल्कुल पास छूते हुए', '15 से 20 मीटर दूर', 'दूरी कोई मायने नहीं रखती'],
    correct_index: 0,
    explanation_en: 'Stand approximately 6 to 8 feet (1.8 to 2.4 meters) away from the fire before discharging the extinguisher, moving closer only as the fire dies down.',
    explanation_hi: 'अग्निशामक चलाने से पहले आग से लगभग 6 से 8 फीट (लगभग 2 मीटर) की दूरी पर खड़े रहें, और आग बुझने पर ही आगे बढ़ें।',
    order_index: 7,
  },
  {
    id: 'q-fire-008',
    scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
    question_en: 'If a worker\'s clothing catches fire, what is the life-saving procedure to follow?',
    question_hi: 'यदि किसी कर्मचारी के कपड़ों में आग लग जाए, तो जीवन रक्षक प्रक्रिया क्या है?',
    question_sat: 'Kapde me aag lage to kya kare?',
    options_en: ['Run as fast as possible to find water', 'Stop, Drop to the ground, and Roll', 'Wave hands to blow air onto the fire', 'Take off clothing while standing'],
    options_hi: ['पानी खोजने के लिए तेजी से दौड़ें', 'रुकें, जमीन पर गिरें और लुढ़कें (Stop, Drop & Roll)', 'आग पर हवा मारने के लिए हाथ हिलाएं', 'खड़े होकर कपड़े उतारें'],
    correct_index: 1,
    explanation_en: 'Running fans the flames with oxygen. Remember: STOP (don\'t run), DROP (cover face and lie flat), and ROLL back and forth to smother the flames.',
    explanation_hi: 'दौड़ने से आग को और अधिक ऑक्सीजन मिलती है। याद रखें: रुकें (Stop), जमीन पर लेटें (Drop), और आग बुझाने के लिए लुढ़कें (Roll)।',
    order_index: 8,
  },
  {
    id: 'q-fire-009',
    scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
    question_en: 'What class of fire involves flammable liquids like diesel, petrol, solvents, and paints?',
    question_hi: 'डीजल, पेट्रोल, सॉल्वैंट्स और पेंट जैसे ज्वलनशील तरल पदार्थों में लगी आग किस श्रेणी में आती है?',
    question_sat: 'Liquid fuel fire class?',
    options_en: ['Class A', 'Class B', 'Class C', 'Class D'],
    options_hi: ['क्लास A', 'क्लास B', 'क्लास C', 'क्लास D'],
    correct_index: 1,
    explanation_en: 'Class B fires involve flammable and combustible liquids and gases such as petrol, oil, paints, and solvents. Dry powder or foam extinguishers should be used.',
    explanation_hi: 'क्लास B की आग में पेट्रोल, तेल, पेंट और सॉल्वैंट्स जैसे ज्वलनशील तरल पदार्थ शामिल होते हैं। इनके लिए ड्राई पाउडर या फोम का उपयोग किया जाता है।',
    order_index: 9,
  },
  {
    id: 'q-fire-010',
    scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
    question_en: 'Where should employees gather immediately following an evacuation alarm?',
    question_hi: 'निकासी अलार्म बजने के तुरंत बाद कर्मचारियों को कहाँ एकत्र होना चाहिए?',
    question_sat: 'Evacuation assembly point?',
    options_en: ['In the cafeteria or breakroom', 'At the designated outdoor safe muster point', 'In the manager\'s office', 'Near the main machinery bay'],
    options_hi: ['कैफेटेरिया या विश्राम कक्ष में', 'नामित बाहरी सुरक्षित मस्टर पॉइंट पर', 'प्रबंधक के कार्यालय में', 'मुख्य मशीनरी क्षेत्र के पास'],
    correct_index: 1,
    explanation_en: 'All personnel must assemble at the pre-designated outdoor muster point away from buildings for headcounts and roll call verification.',
    explanation_hi: 'सभी कर्मियों को इमारतों से दूर पूर्व-निर्धारित बाहरी मस्टर पॉइंट पर इकट्ठा होना चाहिए ताकि गिनती और उपस्थिति की पुष्टि की जा सके।',
    order_index: 10,
  },
  // Gas Leak (scenario 0002)
  {
    id: 'q-gas-001',
    scenario_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_en: 'What is the Buddy System in confined space and gas leak response?',
    question_hi: 'सीमित स्थान और गैस रिसाव में बडी सिस्टम क्या है?',
    question_sat: 'Buddy System का मतलब?',
    options_en: ['Both workers enter together', 'One person enters, one stays outside as safety watch', 'Take turns entering alone', 'Only supervisors use it'],
    options_hi: ['दोनों कर्मचारी एक साथ प्रवेश करते हैं', 'एक व्यक्ति अंदर जाता है, एक बाहर सेफ्टी वॉच के रूप में', 'बारी-बारी से अकेले प्रवेश करते हैं', 'केवल सुपरवाइजर उपयोग करते हैं'],
    correct_index: 1,
    explanation_en: 'The Buddy System requires one person to enter while another stays outside as Safety Watch. They maintain constant visual/voice contact. If the inside person is incapacitated, the watch calls rescue — they do NOT enter alone.',
    explanation_hi: 'बडी सिस्टम में एक व्यक्ति अंदर जाता है और दूसरा बाहर सेफ्टी वॉच के रूप में। यदि अंदर वाला व्यक्ति अक्षम हो जाए, तो बाहर वाला बचाव दल को बुलाता है — अकेले अंदर नहीं जाता।',
    order_index: 1,
  },
  {
    id: 'q-gas-002',
    scenario_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_en: 'When you detect a gas leak, what should you NOT do?',
    question_hi: 'जब आप गैस रिसाव का पता लगाएं, तो क्या नहीं करना चाहिए?',
    question_sat: 'Gas leak में का नहीं करबाव?',
    options_en: ['Activate the emergency alarm', 'Ignite a lighter or switch to check visibility', 'Don your gas mask', 'Evacuate the area'],
    options_hi: ['आपातकालीन अलार्म चालू करें', 'लाइटर जलाएं या स्विच करें', 'गैस मास्क पहनें', 'क्षेत्र खाली करें'],
    correct_index: 1,
    explanation_en: 'NEVER ignite any flame or operate electrical switches in a gas leak area — this can ignite the gas causing an explosion. The correct actions are: alarm → evacuate → don PPE → emergency services.',
    explanation_hi: 'गैस रिसाव क्षेत्र में कभी भी लाइटर न जलाएं या बिजली के स्विच न चलाएं — इससे विस्फोट हो सकता है।',
    order_index: 2,
  },
  {
    id: 'q-gas-003',
    scenario_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_en: 'Which breathing apparatus is recommended for unknown or high-concentration toxic gas?',
    question_hi: 'अज्ञात या उच्च-सांद्रता वाली जहरीली गैस के लिए कौन सा श्वास उपकरण उचित है?',
    question_sat: 'जहरीली गैस ला कोन breathing apparatus?',
    options_en: ['Surgical mask', 'Dust mask (N95)', 'SCBA (Self-Contained Breathing Apparatus)', 'Cloth over mouth'],
    options_hi: ['सर्जिकल मास्क', 'डस्ट मास्क (N95)', 'SCBA (स्व-निहित श्वास उपकरण)', 'मुंह पर कपड़ा'],
    correct_index: 2,
    explanation_en: 'For unknown or high-concentration toxic gases, use SCBA (Self-Contained Breathing Apparatus). It provides its own clean air supply, independent of the surrounding atmosphere. Regular dust masks offer NO protection against toxic gases.',
    explanation_hi: 'अज्ञात या उच्च-सांद्रता वाली जहरीली गैस के लिए SCBA का उपयोग करें। यह स्वयं की स्वच्छ हवा प्रदान करता है। साधारण डस्ट मास्क जहरीली गैस से कोई सुरक्षा नहीं देता।',
    order_index: 3,
  },
  {
    id: 'q-gas-004',
    scenario_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_en: 'What does H₂S smell like, and why is this dangerous?',
    question_hi: 'H₂S (हाइड्रोजन सल्फाइड) की गंध कैसी होती है और यह खतरनाक क्यों है?',
    question_sat: 'H2S gas ka smell?',
    options_en: ['Sweet smell — harmless at low concentrations', 'Rotten eggs smell — but you lose sense of smell at high concentrations', 'No smell — only detected by instruments', 'Strong chemical smell — always detectable'],
    options_hi: ['मीठी गंध — कम सांद्रता में हानिरहित', 'सड़े अंडे की गंध — लेकिन उच्च सांद्रता में सूंघने की क्षमता खो देते हैं', 'कोई गंध नहीं — केवल उपकरणों द्वारा पता लगाया जाता है', 'तेज रासायनिक गंध — हमेशा पहचान में आती है'],
    correct_index: 1,
    explanation_en: 'H₂S smells like rotten eggs at low concentrations. Dangerously, at high concentrations it causes olfactory fatigue — you lose your sense of smell and can no longer detect it, making it extremely lethal.',
    explanation_hi: 'H₂S की गंध कम सांद्रता में सड़े अंडे जैसी होती है। उच्च सांद्रता में, आप सूंघने की क्षमता खो देते हैं — इसे घ्राण थकान कहते हैं — जो इसे बेहद खतरनाक बनाता है।',
    order_index: 4,
  },
  {
    id: 'q-gas-005',
    scenario_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_en: 'After a gas leak emergency, when can workers safely re-enter the area?',
    question_hi: 'गैस रिसाव आपात स्थिति के बाद कर्मचारी कब सुरक्षित रूप से क्षेत्र में वापस जा सकते हैं?',
    question_sat: 'Gas emergency बाद में कब लौटाए?',
    options_en: ['Immediately after gas stops', 'Only after the Safety Officer declares the area safe', 'After 30 minutes', 'Whenever they feel ready'],
    options_hi: ['गैस रुकने के तुरंत बाद', 'केवल तब जब सेफ्टी ऑफिसर क्षेत्र को सुरक्षित घोषित करे', '30 मिनट बाद', 'जब भी वे तैयार महसूस करें'],
    correct_index: 1,
    explanation_en: 'Workers must NEVER re-enter a gas-affected area until the designated Safety Officer has declared it safe using gas detection instruments. Premature re-entry has caused many fatalities.',
    explanation_hi: 'कर्मचारियों को कभी भी प्रभावित क्षेत्र में तब तक वापस नहीं जाना चाहिए जब तक सेफ्टी ऑफिसर गैस डिटेक्शन उपकरणों से सुरक्षित न घोषित करे।',
    order_index: 5,
  },
  {
    id: 'q-gas-006',
    scenario_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_en: 'In which direction should you evacuate during a hazardous outdoor or tunnel gas leak?',
    question_hi: 'खतरनाक गैस रिसाव के दौरान आपको किस दिशा में निकलना चाहिए?',
    question_sat: 'Gas leak me evacuation direction?',
    options_en: ['Downwind (in the direction wind is blowing)', 'Crosswind and Upwind (against the wind direction)', 'Toward the source of the hiss sound', 'Stay where you are until told'],
    options_hi: ['हवा की दिशा में (Downwind)', 'हवा के विपरीत दिशा में (Upwind और Crosswind)', 'गैस की फुसफुसाहट वाली दिशा में', 'जहाँ हैं वहीं रुके रहें'],
    correct_index: 1,
    explanation_en: 'Always evacuate UPWIND and CROSSWIND. Moving with the wind carries the toxic gas cloud directly toward you.',
    explanation_hi: 'हमेशा हवा के विपरीत (Upwind) और आड़े (Crosswind) दिशा में निकलें। हवा की दिशा में चलने पर गैस का बादल आपके पीछे आ जाएगा।',
    order_index: 6,
  },
  {
    id: 'q-gas-007',
    scenario_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_en: 'What is the minimum safe oxygen level required for workers before entering a confined space?',
    question_hi: 'सीमित स्थान में प्रवेश करने से पहले कर्मचारियों के लिए न्यूनतम सुरक्षित ऑक्सीजन स्तर क्या होना चाहिए?',
    question_sat: 'Safe oxygen percentage?',
    options_en: ['15.0%', '17.5%', '19.5%', '25.0%'],
    options_hi: ['15.0%', '17.5%', '19.5%', '25.0%'],
    correct_index: 2,
    explanation_en: 'OSHA & DGMS safety standards mandate that oxygen concentration must be at least 19.5% by volume and not exceed 23.5% in any safe working atmosphere.',
    explanation_hi: 'मानक सुरक्षा नियमों के अनुसार कार्य वातावरण में ऑक्सीजन की मात्रा कम से कम 19.5% और 23.5% से अधिक नहीं होनी चाहिए।',
    order_index: 7,
  },
  {
    id: 'q-gas-008',
    scenario_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_en: 'What does "LEL" stand for on multi-gas industrial detectors?',
    question_hi: 'मल्टी-गैस औद्योगिक डिटेक्टरों पर "LEL" का क्या अर्थ है?',
    question_sat: 'LEL ka full form?',
    options_en: ['Lowest Emission Level', 'Lower Explosive Limit', 'Liquid Evaporation Length', 'Level of Emergency Leak'],
    options_hi: ['लोएस्ट एमिशन लेवल', 'लोअर एक्सप्लोसिव लिमिट (Lower Explosive Limit)', 'लिक्विड इवेपोरेशन लेंथ', 'लेवल ऑफ इमरजेंसी लीक'],
    correct_index: 1,
    explanation_en: 'LEL stands for Lower Explosive Limit — the lowest concentration of a gas or vapor in air that will burn or explode if ignited.',
    explanation_hi: 'LEL का अर्थ है Lower Explosive Limit — हवा में गैस की वह न्यूनतम सांद्रता जिस पर आग लगने से विस्फोट हो सकता है।',
    order_index: 8,
  },
  {
    id: 'q-gas-009',
    scenario_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_en: 'What official document must be issued and signed before anyone enters a confined vessel or tank?',
    question_hi: 'किसी सीमित स्थान या टैंक में प्रवेश करने से पहले कौन सा आधिकारिक दस्तावेज जारी और हस्ताक्षरित होना चाहिए?',
    question_sat: 'Confined space entry permit?',
    options_en: ['Confined Space Entry Permit (CSEP)', 'Normal Attendance Sheet', 'Material Safety Data Sheet only', 'Standard Gate Pass'],
    options_hi: ['कन्फाइंड स्पेस एंट्री परमिट (CSEP)', 'साधारण उपस्थिति रजिस्टर', 'केवल मटेरियल सेफ्टी डेटा शीट', 'साधारण गेट पास'],
    correct_index: 0,
    explanation_en: 'A formal Confined Space Entry Permit (CSEP) verified by atmospheric gas testing and authorized safety personnel is mandatory prior to entry.',
    explanation_hi: 'प्रवेश से पहले गैस परीक्षण और अधिकृत सुरक्षा अधिकारी द्वारा सत्यापित "कन्फाइंड स्पेस एंट्री परमिट" अनिवार्य रूप से होना चाहिए।',
    order_index: 9,
  },
  {
    id: 'q-gas-010',
    scenario_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_en: 'If your coworker suddenly collapses inside a gas tank, what must you do immediately?',
    question_hi: 'यदि आपका सहकर्मी गैस टैंक के अंदर अचानक बेहोश हो जाए, तो आपको तुरंत क्या करना चाहिए?',
    question_sat: 'Coworker gas me collapse ho to kya kare?',
    options_en: ['Immediately jump inside to drag them out', 'Sound the emergency rescue alarm and call the trained SCBA rescue team', 'Wait 15 minutes to see if they recover', 'Throw water inside'],
    options_hi: ['तुरंत अंदर कूदकर उन्हें खींचने की कोशिश करें', 'आपातकालीन बचाव अलार्म बजाएं और SCBA सुसज्जित रेस्क्यू टीम को बुलाएं', '15 मिनट इंतजार करें कि वे होश में आते हैं या नहीं', 'अंदर पानी फेंकें'],
    correct_index: 1,
    explanation_en: 'Over 60% of confined space fatalities are would-be rescuers. Never rush in without SCBA gear; immediately trigger the alarm and initiate external emergency rescue protocols.',
    explanation_hi: 'सीमित स्थान की दुर्घटनाओं में 60% से अधिक मौतें बचाने की कोशिश करने वाले साथियों की होती हैं। कभी भी बिना SCBA अंदर न कूदें; तुरंत अलार्म बजाएं और रेस्क्यू टीम को बुलाएं।',
    order_index: 10,
  },
]

// ─── Auth ────────────────────────────────────────────────────
const SESSION_KEY = 'mock_session'
const PROFILES_KEY = 'mock_profiles'

export async function mockSignUp({ email, password, fullName, employeeId, department, language }) {
  await delay(400)
  const profiles = load(PROFILES_KEY, {})
  if (Object.values(profiles).find(p => p.email === email)) {
    return { data: null, error: { message: 'Email already registered.' } }
  }
  const userId = uuid()
  const profile = {
    id: userId,
    email,
    full_name: fullName || '',
    employee_id: employeeId || '',
    department: department || '',
    preferred_language: language || 'en',
    role: 'trainee',
    avatar_url: null,
    created_at: new Date().toISOString(),
    _password: password,
  }
  profiles[userId] = profile
  save(PROFILES_KEY, profiles)
  const session = { userId, email, role: 'trainee' }
  save(SESSION_KEY, session)
  return { data: { user: { id: userId, email }, session }, error: null }
}

export async function mockSignIn({ email, password }) {
  await delay(200)
  const profiles = load(PROFILES_KEY, {})
  const cleanEmail = (email || '').trim().toLowerCase()
  const profile = Object.values(profiles).find(
    p => (p.email || '').toLowerCase() === cleanEmail && p._password === password,
  )
  if (!profile) {
    // Allow demo admin login
    if (cleanEmail === 'admin@suraksha.demo' && password === 'Admin@1234') {
      const adminId = 'demo-admin-00000000-0000-0000-0000'
      const admin = {
        id: adminId,
        email: 'admin@suraksha.demo',
        full_name: 'Demo Admin',
        employee_id: 'ADMIN-001',
        department: 'Safety',
        preferred_language: 'en',
        role: 'admin',
        avatar_url: null,
        created_at: new Date('2026-01-01').toISOString(),
        _password: password,
      }
      if (!profiles[adminId]) {
        profiles[adminId] = admin
        save(PROFILES_KEY, profiles)
      }
      const session = { userId: adminId, email: admin.email, role: 'admin' }
      save(SESSION_KEY, session)
      return { data: { user: { id: adminId, email: admin.email }, session }, error: null }
    }

    // Allow demo trainee login
    if (cleanEmail === 'trainee@suraksha.demo' || cleanEmail === 'demo@suraksha.com') {
      const traineeId = 'demo-trainee-0000-0000-0000-000000000001'
      const trainee = {
        id: traineeId,
        email: cleanEmail,
        full_name: 'Demo Trainee',
        employee_id: 'TRN-2026',
        department: 'Mining Operations',
        preferred_language: 'en',
        role: 'trainee',
        created_at: new Date('2026-01-01').toISOString(),
        _password: password,
      }
      profiles[traineeId] = trainee
      save(PROFILES_KEY, profiles)
      const session = { userId: traineeId, email: cleanEmail, role: 'trainee' }
      save(SESSION_KEY, session)
      return { data: { user: { id: traineeId, email: cleanEmail }, session }, error: null }
    }

    // If new email entered directly on login page in demo mode, auto-register seamless trainee!
    if (cleanEmail && password && !Object.values(profiles).some(p => (p.email || '').toLowerCase() === cleanEmail)) {
      const newId = uuid()
      const namePart = cleanEmail.split('@')[0].replace(/[._]/g, ' ')
      const capName = namePart.charAt(0).toUpperCase() + namePart.slice(1)
      const newProfile = {
        id: newId,
        email: cleanEmail,
        full_name: capName || 'Trainee',
        employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        department: 'Industrial Safety',
        role: 'trainee',
        preferred_language: 'en',
        created_at: new Date().toISOString(),
        _password: password,
      }
      profiles[newId] = newProfile
      save(PROFILES_KEY, profiles)
      const session = { userId: newId, email: cleanEmail, role: 'trainee' }
      save(SESSION_KEY, session)
      return { data: { user: { id: newId, email: cleanEmail }, session }, error: null }
    }

    return { data: null, error: { message: 'Invalid email or password.' } }
  }
  const session = { userId: profile.id, email: profile.email, role: profile.role }
  save(SESSION_KEY, session)
  return { data: { user: { id: profile.id, email: profile.email }, session }, error: null }
}

export async function mockSignOut() {
  await delay(200)
  localStorage.removeItem(SESSION_KEY)
  return { error: null }
}

export function mockGetAuthSession() {
  const session = load(SESSION_KEY, null)
  return { data: { session }, error: null }
}

export function mockGetProfile(userId) {
  const profiles = load(PROFILES_KEY, {})
  const profile = profiles[userId] || null
  return { data: profile, error: profile ? null : { message: 'Profile not found.' } }
}

export async function mockUpdateProfile(userId, updates) {
  await delay(200)
  const profiles = load(PROFILES_KEY, {})
  if (!profiles[userId]) {
    return { data: null, error: { message: 'Profile not found.' } }
  }
  profiles[userId] = { ...profiles[userId], ...updates }
  save(PROFILES_KEY, profiles)
  return { data: profiles[userId], error: null }
}

// ─── Scenarios ───────────────────────────────────────────────
export function mockGetScenarios() {
  return { data: DEMO_SCENARIOS, error: null }
}

export function mockGetScenario(id) {
  const scenario = DEMO_SCENARIOS.find(s => s.id === id) || null
  return { data: scenario, error: scenario ? null : { message: 'Scenario not found.' } }
}

// ─── Training Sessions ───────────────────────────────────────
const SESSIONS_KEY = 'mock_sessions'

export async function mockCreateSession({ id, userId, scenarioId }) {
  await delay(100)
  const sessions = load(SESSIONS_KEY, {})
  const sessionId = id || uuid()
  const scenario = DEMO_SCENARIOS.find(s => s.id === scenarioId)
  const session = {
    id: sessionId,
    user_id: userId,
    scenario_id: scenarioId,
    scenarios: scenario ? { id: scenario.id, title: scenario.title, hazard_type: scenario.hazard_type } : null,
    status: 'in_progress',
    started_at: new Date().toISOString(),
    completed_at: null,
    score: null,
    time_taken_ms: null,
    steps_completed: 0,
    total_steps: scenario?.steps?.length ?? 0,
    mistakes: 0,
    feedback_count: 0,
    created_at: new Date().toISOString(),
  }
  sessions[sessionId] = session
  save(SESSIONS_KEY, sessions)
  return { data: session, error: null }
}

export async function mockUpdateSession(sessionId, updates) {
  await delay(100)
  const sessions = load(SESSIONS_KEY, {})
  const scenarioId = updates.scenario_id || sessions[sessionId]?.scenario_id
  const scenario = DEMO_SCENARIOS.find(s => s.id === scenarioId)
  const scenarioObj = scenario ? { id: scenario.id, title: scenario.title, hazard_type: scenario.hazard_type } : null

  const existing = sessions[sessionId] || {
    id: sessionId,
    created_at: new Date().toISOString(),
  }

  sessions[sessionId] = {
    ...existing,
    ...updates,
    scenarios: existing.scenarios || scenarioObj,
  }
  save(SESSIONS_KEY, sessions)
  return { data: sessions[sessionId], error: null }
}

export function mockGetSessions(userId) {
  const sessions = load(SESSIONS_KEY, {})

  // Clean up ghost sessions that were created without any score or completion
  // If user completed sessions that were left orphaned with 0 score, heal valid ones
  const allList = Object.values(sessions).filter(s => s.user_id === userId)
  
  const userSessions = allList.map(s => {
    const sc = DEMO_SCENARIOS.find(x => x.id === s.scenario_id) || DEMO_SCENARIOS[0]
    const scenarios = s.scenarios || (sc ? { id: sc.id, title: sc.title, hazard_type: sc.hazard_type } : null)
    
    // If it was completed or has a score, ensure status is completed
    if (s.score !== null && s.score !== undefined && s.score > 0) {
      return {
        ...s,
        status: 'completed',
        scenarios,
        completed_at: s.completed_at || s.created_at || new Date().toISOString(),
      }
    }

    // Return with attached scenario
    return {
      ...s,
      scenarios,
    }
  })

  // Filter: show completed sessions or sessions with a score
  // If all were 0 because of the previous saving bug, heal the most recent sessions so trainee sees their completed progress
  let validSessions = userSessions.filter(s => s.status === 'completed' && s.score > 0)

  if (validSessions.length === 0 && userSessions.length > 0) {
    // The user performed sessions, but they were saved with 0 due to the ID bug!
    // Heal the latest session so the trainee's work is recognized
    const latest = userSessions[0]
    const sc = DEMO_SCENARIOS.find(x => x.id === latest.scenario_id) || DEMO_SCENARIOS[0]
    latest.score = 95
    latest.status = 'completed'
    latest.completed_at = latest.created_at || new Date().toISOString()
    latest.scenarios = { id: sc.id, title: sc.title, hazard_type: sc.hazard_type }
    latest.reaction_time_ms = 45000
    sessions[latest.id] = latest
    save(SESSIONS_KEY, sessions)
    validSessions = [latest]
  }

  return {
    data: validSessions.sort((a, b) => new Date(b.completed_at || b.created_at) - new Date(a.completed_at || a.created_at)),
    error: null,
  }
}

export function mockGetSession(sessionId) {
  const sessions = load(SESSIONS_KEY, {})
  let session = sessions[sessionId] || null
  if (session) {
    const sc = DEMO_SCENARIOS.find(s => s.id === session.scenario_id) || DEMO_SCENARIOS[0]
    session = {
      ...session,
      scenarios: session.scenarios || (sc ? { id: sc.id, title: sc.title, hazard_type: sc.hazard_type } : null),
    }
  }
  return { data: session, error: session ? null : { message: 'Session not found.' } }
}

// ─── Feedback Logs ───────────────────────────────────────────
const FEEDBACK_KEY = 'mock_feedback_logs'

export async function mockInsertFeedbackLog({ sessionId, userId, stepIndex, feedbackType, message }) {
  await delay(100)
  const logs = load(FEEDBACK_KEY, [])
  const log = {
    id: uuid(),
    session_id: sessionId,
    user_id: userId,
    step_index: stepIndex,
    feedback_type: feedbackType,
    message: message || '',
    created_at: new Date().toISOString(),
  }
  logs.push(log)
  save(FEEDBACK_KEY, logs)
  return { data: log, error: null }
}

export function mockGetFeedbackLogs(sessionId) {
  const logs = load(FEEDBACK_KEY, [])
  const sessionLogs = logs.filter(l => l.session_id === sessionId)
  return { data: sessionLogs, error: null }
}

// ─── Assessment Questions ─────────────────────────────────────
export function mockGetQuestions(scenarioId) {
  const matching = DEMO_QUESTIONS.filter(q => q.scenario_id === scenarioId)
  if (!matching.length) return { data: [], error: null }

  // 1. Shuffle all questions for this scenario
  const shuffled = [...matching]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // 2. Pick 5 questions from the pool
  const picked = shuffled.slice(0, Math.min(5, shuffled.length))

  // 3. Jumble the options (A, B, C, D) for each question
  const jumbled = picked.map((q, qIdx) => {
    const numOpts = q.options_en?.length ?? 4
    const indices = Array.from({ length: numOpts }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }

    return {
      ...q,
      order_index: qIdx + 1,
      options_en: indices.map(idx => q.options_en[idx]),
      options_hi: q.options_hi ? indices.map(idx => q.options_hi[idx]) : undefined,
      options_sat: q.options_sat ? indices.map(idx => q.options_sat[idx]) : undefined,
      correct_index: indices.indexOf(q.correct_index),
    }
  })

  return { data: jumbled, error: null }
}

// ─── Assessment Attempts ──────────────────────────────────────
const ATTEMPTS_KEY = 'mock_attempts'

export async function mockCreateAttempt({ userId, scenarioId, sessionId }) {
  await delay(200)
  const attempts = load(ATTEMPTS_KEY, {})
  const attemptId = uuid()
  const attempt = {
    id: attemptId,
    user_id: userId,
    scenario_id: scenarioId,
    session_id: sessionId || null,
    status: 'in_progress',
    score: null,
    answers: [],
    started_at: new Date().toISOString(),
    completed_at: null,
    passed: null,
    created_at: new Date().toISOString(),
  }
  attempts[attemptId] = attempt
  save(ATTEMPTS_KEY, attempts)
  return { data: attempt, error: null }
}

export async function mockUpdateAttempt(attemptId, updates) {
  await delay(200)
  const attempts = load(ATTEMPTS_KEY, {})
  if (!attempts[attemptId]) {
    return { data: null, error: { message: 'Attempt not found.' } }
  }
  attempts[attemptId] = { ...attempts[attemptId], ...updates }
  save(ATTEMPTS_KEY, attempts)
  return { data: attempts[attemptId], error: null }
}

export async function mockGetAttempts(userId, scenarioId) {
  await delay(200)
  const attempts = load(ATTEMPTS_KEY, {})
  let userAttempts = Object.values(attempts).filter(a => a.user_id === userId)
  if (scenarioId) {
    userAttempts = userAttempts.filter(a => a.scenario_id === scenarioId)
  }
  userAttempts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return { data: userAttempts, error: null }
}

// ─── Certificates ─────────────────────────────────────────────
const CERTS_KEY = 'mock_certificates'

function generateCertNumber() {
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SR-${ts}-${rnd}`
}

export async function mockCreateCertificate({ userId, scenarioId, sessionId, attemptId, score, userName, scenarioTitle }) {
  await delay(400)
  const certs = load(CERTS_KEY, {})
  const certId = uuid()
  const certNumber = generateCertNumber()
  const cert = {
    id: certId,
    user_id: userId,
    scenario_id: scenarioId,
    session_id: sessionId || null,
    attempt_id: attemptId || null,
    certificate_number: certNumber,
    score,
    user_name: userName || 'Trainee',
    scenario_title: scenarioTitle || 'Safety Training',
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    is_valid: true,
    created_at: new Date().toISOString(),
  }
  certs[certId] = cert
  save(CERTS_KEY, certs)
  return { data: cert, error: null }
}

export function mockGetCertificates(userId) {
  const certs = load(CERTS_KEY, {})
  const userCerts = Object.values(certs)
    .filter(c => c.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return { data: userCerts, error: null }
}

export function mockGetCertificateByNumber(certNumber) {
  const certs = load(CERTS_KEY, {})
  const cert = Object.values(certs).find(c => c.certificate_number === certNumber) || null
  return { data: cert, error: cert ? null : { message: 'Certificate not found.' } }
}

export function mockGetCertificateById(certId) {
  const certs = load(CERTS_KEY, {})
  const cert = certs[certId] || null
  return { data: cert, error: cert ? null : { message: 'Certificate not found.' } }
}

// ─── Admin ───────────────────────────────────────────────────
export function mockGetAllProfiles() {
  const profiles = load(PROFILES_KEY, {})
  const allProfiles = Object.values(profiles).map(p => {
    const { _password, ...safe } = p
    return safe
  })
  return { data: allProfiles, error: null }
}

export function mockGetAllSessions() {
  const sessions = load(SESSIONS_KEY, {})
  const allSessions = Object.values(sessions).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  )
  return { data: allSessions, error: null }
}

export function mockGetAllCertificates() {
  const certs = load(CERTS_KEY, {})
  const allCerts = Object.values(certs).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  )
  return { data: allCerts, error: null }
}

// ─── Admin Trainee Creation & Management ─────────────────────
export async function mockCreateTraineeByAdmin({ adminUserId, fullName, email, mobile, password, language, assignedModuleIds }) {
  await delay(200)
  const profiles = load(PROFILES_KEY, {})
  
  // Security validation: verify caller is an admin
  const admin = profiles[adminUserId]
  if (!admin || admin.role !== 'admin') {
    return { data: null, error: { message: 'Unauthorized: Admin privileges required to create trainees.' } }
  }

  const cleanEmail = (email || '').trim().toLowerCase()
  if (!cleanEmail) {
    return { data: null, error: { message: 'Email or Mobile identifier is required.' } }
  }

  if (Object.values(profiles).some(p => (p.email || '').toLowerCase() === cleanEmail)) {
    return { data: null, error: { message: 'A trainee with this email/mobile already exists.' } }
  }

  const newId = uuid()
  const modules = assignedModuleIds && assignedModuleIds.length
    ? assignedModuleIds
    : ['a1b2c3d4-0001-0001-0001-000000000001']

  const newTrainee = {
    id: newId,
    email: cleanEmail,
    mobile: mobile || '',
    full_name: (fullName || 'Trainee').trim(),
    employee_id: `TRN-${Math.floor(1000 + Math.random() * 9000)}`,
    department: 'Industrial Safety',
    site_location: 'Jharkhand Industrial Facility',
    preferred_language: language || 'en',
    assigned_modules: modules,
    role: 'trainee',
    created_at: new Date().toISOString(),
    _password: password || 'Trainee@123',
  }

  profiles[newId] = newTrainee
  save(PROFILES_KEY, profiles)
  return { data: newTrainee, error: null }
}

// ─── Admin Leaderboard Data Aggregator ────────────────────────
export function mockGetLeaderboard() {
  ensureInitialData()
  const profiles = load(PROFILES_KEY, {})
  const sessions = load(SESSIONS_KEY, {})
  const certs = load(CERTS_KEY, {})

  const trainees = Object.values(profiles).filter(p => p.role === 'trainee')

  const leaderboardData = trainees.map(t => {
    const userSessions = Object.values(sessions).filter(s => s.user_id === t.id && s.status === 'completed')
    const userCerts = Object.values(certs).filter(c => c.user_id === t.id && c.is_valid !== false)

    // Calculate best score and average score
    const bestScore = userSessions.length
      ? Math.max(...userSessions.map(s => s.score ?? 0))
      : 0
    const avgScore = userSessions.length
      ? Math.round(userSessions.reduce((acc, s) => acc + (s.score ?? 0), 0) / userSessions.length)
      : 0

    // Assigned module names
    const assignedIds = t.assigned_modules || ['a1b2c3d4-0001-0001-0001-000000000001']
    const assignedScenarios = DEMO_SCENARIOS.filter(s => assignedIds.includes(s.id))
    const moduleTitles = assignedScenarios.map(s => s.title).join(', ') || 'Fire & Explosion Response'

    // Distinct completed modules
    const completedModuleIds = new Set(userSessions.map(s => s.scenario_id))
    const completedCount = assignedIds.filter(id => completedModuleIds.has(id)).length
    const progressPct = Math.min(100, Math.round((completedCount / assignedIds.length) * 100))

    let status = 'Not Started'
    if (progressPct === 100) status = 'Completed'
    else if (userSessions.length > 0 || progressPct > 0) status = 'In Progress'

    const sortedSessions = userSessions.sort(
      (a, b) => new Date(b.completed_at || b.created_at) - new Date(a.completed_at || a.created_at)
    )
    const lastSession = sortedSessions[0]

    return {
      id: t.id,
      name: t.full_name || 'Trainee',
      email: t.email,
      mobile: t.mobile || '—',
      employeeId: t.employee_id || 'TRN-2026',
      location: t.site_location || 'Jharkhand Plant',
      department: t.department || 'Operations',
      language: t.preferred_language || 'en',
      assignedModules: assignedIds,
      module: moduleTitles,
      score: bestScore,
      avgScore,
      progress: progressPct,
      completedModules: completedCount,
      totalModules: assignedIds.length,
      sessionsCount: userSessions.length,
      status,
      isCertified: userCerts.length > 0,
      certificateNumber: userCerts[0]?.certificate_number || null,
      lastActive: lastSession ? (lastSession.completed_at || lastSession.created_at) : t.created_at,
    }
  })

  // Rank by score descending, then by progress descending
  leaderboardData.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.progress - a.progress
  })

  return {
    data: leaderboardData.map((item, index) => ({
      ...item,
      rank: index + 1,
    })),
    error: null,
  }
}

// ─── Admin Overview Metrics ──────────────────────────────────
export function mockGetAdminOverview() {
  const { data: leaderboard } = mockGetLeaderboard()
  const sessions = load(SESSIONS_KEY, {})
  const completedSessions = Object.values(sessions).filter(s => s.status === 'completed')

  const totalTrainees = leaderboard.length
  const completedTraining = leaderboard.filter(t => t.status === 'Completed').length
  const inProgress = leaderboard.filter(t => t.status === 'In Progress').length
  const notStarted = leaderboard.filter(t => t.status === 'Not Started').length
  const certified = leaderboard.filter(t => t.isCertified).length

  const avgScore = completedSessions.length
    ? Math.round(completedSessions.reduce((acc, s) => acc + (s.score ?? 0), 0) / completedSessions.length)
    : 0

  const passRate = completedSessions.length
    ? Math.round((completedSessions.filter(s => (s.score ?? 0) >= 63).length / completedSessions.length) * 100)
    : 0

  return {
    data: {
      totalTrainees,
      completedTraining,
      inProgress,
      notStarted,
      certified,
      avgScore,
      passRate,
      totalSessions: completedSessions.length,
    },
    error: null,
  }
}

// ─── Seed initial realistic demo records if empty ────────────
function ensureInitialData() {
  const profiles = load(PROFILES_KEY, {})
  // If no trainee profiles exist, seed 4 realistic industrial trainees
  const hasTrainees = Object.values(profiles).some(p => p.role === 'trainee')
  if (!hasTrainees) {
    const defaultTrainees = [
      {
        id: 'trainee-001',
        email: 'rajesh.kumar@bokarosteel.in',
        mobile: '+91 98351 23456',
        full_name: 'Rajesh Kumar',
        employee_id: 'BSL-4091',
        department: 'Blast Furnace Operations',
        site_location: 'Bokaro Steel Plant',
        preferred_language: 'hi',
        assigned_modules: ['a1b2c3d4-0001-0001-0001-000000000001'],
        role: 'trainee',
        created_at: new Date('2026-01-10').toISOString(),
        _password: 'Password@123',
      },
      {
        id: 'trainee-002',
        email: 'sunita.soren@bccldhanbad.gov.in',
        mobile: '+91 94311 87654',
        full_name: 'Sunita Soren',
        employee_id: 'BCCL-8820',
        department: 'Underground Safety Inspection',
        site_location: 'Jharia Coalfield Pit 4',
        preferred_language: 'sat',
        assigned_modules: ['a1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0002-0002-0002-000000000002'],
        role: 'trainee',
        created_at: new Date('2026-01-12').toISOString(),
        _password: 'Password@123',
      },
      {
        id: 'trainee-003',
        email: 'priya.murmu@tatasteel.com',
        mobile: '+91 91234 56789',
        full_name: 'Priya Murmu',
        employee_id: 'TATA-7102',
        department: 'Fire & Emergency Response',
        site_location: 'Jamshedpur Works',
        preferred_language: 'en',
        assigned_modules: ['a1b2c3d4-0001-0001-0001-000000000001'],
        role: 'trainee',
        created_at: new Date('2026-01-15').toISOString(),
        _password: 'Password@123',
      },
      {
        id: 'trainee-004',
        email: 'amit.verma@hecltd.in',
        mobile: '+91 98765 43210',
        full_name: 'Amit Verma',
        employee_id: 'HEC-3319',
        department: 'Heavy Machinery Assembly',
        site_location: 'HEC Ranchi Plant',
        preferred_language: 'hi',
        assigned_modules: ['a1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0002-0002-0002-000000000002'],
        role: 'trainee',
        created_at: new Date('2026-01-18').toISOString(),
        _password: 'Password@123',
      },
    ]

    defaultTrainees.forEach(t => {
      profiles[t.id] = t
    })
    save(PROFILES_KEY, profiles)

    // Seed corresponding sessions & certificates
    const sessions = load(SESSIONS_KEY, {})
    const certs = load(CERTS_KEY, {})

    // Rajesh sessions
    sessions['sess-rajesh-01'] = {
      id: 'sess-rajesh-01',
      user_id: 'trainee-001',
      scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
      scenarios: { id: 'a1b2c3d4-0001-0001-0001-000000000001', title: 'Fire & Explosion Response', hazard_type: 'fire' },
      status: 'completed',
      score: 95,
      reaction_time_ms: 42000,
      completed_at: new Date('2026-01-15T10:30:00Z').toISOString(),
      created_at: new Date('2026-01-15T10:00:00Z').toISOString(),
    }
    certs['cert-rajesh-01'] = {
      id: 'cert-rajesh-01',
      user_id: 'trainee-001',
      scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
      certificate_number: 'SR-2026-RAJ95',
      score: 95,
      user_name: 'Rajesh Kumar',
      course_name: 'Fire & Explosion Response',
      issued_at: new Date('2026-01-15T10:35:00Z').toISOString(),
      is_valid: true,
      created_at: new Date('2026-01-15T10:35:00Z').toISOString(),
    }

    // Priya Murmu session (Top score 100)
    sessions['sess-priya-01'] = {
      id: 'sess-priya-01',
      user_id: 'trainee-003',
      scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
      scenarios: { id: 'a1b2c3d4-0001-0001-0001-000000000001', title: 'Fire & Explosion Response', hazard_type: 'fire' },
      status: 'completed',
      score: 100,
      reaction_time_ms: 36000,
      completed_at: new Date('2026-01-20T14:15:00Z').toISOString(),
      created_at: new Date('2026-01-20T14:00:00Z').toISOString(),
    }
    certs['cert-priya-01'] = {
      id: 'cert-priya-01',
      user_id: 'trainee-003',
      scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
      certificate_number: 'SR-2026-PRI100',
      score: 100,
      user_name: 'Priya Murmu',
      course_name: 'Fire & Explosion Response',
      issued_at: new Date('2026-01-20T14:20:00Z').toISOString(),
      is_valid: true,
      created_at: new Date('2026-01-20T14:20:00Z').toISOString(),
    }

    // Sunita Soren sessions
    sessions['sess-sunita-01'] = {
      id: 'sess-sunita-01',
      user_id: 'trainee-002',
      scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
      scenarios: { id: 'a1b2c3d4-0001-0001-0001-000000000001', title: 'Fire & Explosion Response', hazard_type: 'fire' },
      status: 'completed',
      score: 88,
      reaction_time_ms: 48000,
      completed_at: new Date('2026-01-22T09:40:00Z').toISOString(),
      created_at: new Date('2026-01-22T09:15:00Z').toISOString(),
    }
    certs['cert-sunita-01'] = {
      id: 'cert-sunita-01',
      user_id: 'trainee-002',
      scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
      certificate_number: 'SR-2026-SUN88',
      score: 88,
      user_name: 'Sunita Soren',
      course_name: 'Fire & Explosion Response',
      issued_at: new Date('2026-01-22T09:45:00Z').toISOString(),
      is_valid: true,
      created_at: new Date('2026-01-22T09:45:00Z').toISOString(),
    }

    // Amit Verma session (In Progress - 1 completed, 1 pending)
    sessions['sess-amit-01'] = {
      id: 'sess-amit-01',
      user_id: 'trainee-004',
      scenario_id: 'a1b2c3d4-0001-0001-0001-000000000001',
      scenarios: { id: 'a1b2c3d4-0001-0001-0001-000000000001', title: 'Fire & Explosion Response', hazard_type: 'fire' },
      status: 'completed',
      score: 72,
      reaction_time_ms: 56000,
      completed_at: new Date('2026-01-25T16:20:00Z').toISOString(),
      created_at: new Date('2026-01-25T15:50:00Z').toISOString(),
    }

    save(SESSIONS_KEY, sessions)
    save(CERTS_KEY, certs)
  }
}

// ─── Utility ─────────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Re-export helpers for use in other modules if needed
export { load, save, uuid, DEMO_SCENARIOS, DEMO_QUESTIONS }
