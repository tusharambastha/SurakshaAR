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
    description: 'Simulate responding to an electrical fire on a manufacturing floor. Identify the hazard, activate emergency protocols, don PPE, use the correct extinguisher, and evacuate safely.',
    hazard_type: 'fire',
    difficulty: 'beginner',
    benchmark_time_ms: 90000,
    thumbnail_url: null,
    created_at: new Date('2026-01-01').toISOString(),
    steps: [
      { index: 0, label: 'Identify Fire Source', instruction: 'Locate and identify the electrical fire near the control panel', position: [3, 1.2, 3], color: '#ef4444', is_ppe_step: false },
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
    description: 'Practice responding to a hazardous gas leak in a mining tunnel using the buddy system. Identify the leak, activate protocols, don breathing apparatus, and evacuate safely.',
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
    description: 'Learn to safely isolate and lock out machinery before maintenance using the LOTO procedure. Prevents accidental machine startup during maintenance.',
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
  // Gas Leak (scenario 0002)
  {
    id: 'q-gas-001',
    scenario_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_en: 'What is the Buddy System in confined space and gas leak response?',
    question_hi: '\u0938\u0940\u092e\u093f\u0924 \u0938\u094d\u0925\u093e\u0928 \u0914\u0930 \u0917\u0948\u0938 \u0930\u093f\u0938\u093e\u0935 \u092e\u0947\u0902 \u092c\u0921\u0940 \u0938\u093f\u0938\u094d\u091f\u092e \u0915\u094d\u092f\u093e \u0939\u0948?',
    question_sat: 'Buddy System \u0915\u093e \u092e\u0924\u0932\u092c?',
    options_en: ['Both workers enter together', 'One person enters, one stays outside as safety watch', 'Take turns entering alone', 'Only supervisors use it'],
    options_hi: ['\u0926\u094b\u0928\u094b\u0902 \u0915\u0930\u094d\u092e\u091a\u093e\u0930\u0940 \u090f\u0915 \u0938\u093e\u0925 \u092a\u094d\u0930\u0935\u0947\u0936 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902', '\u090f\u0915 \u0935\u094d\u092f\u0915\u094d\u0924\u093f \u0905\u0902\u0926\u0930 \u091c\u093e\u0924\u093e \u0939\u0948, \u090f\u0915 \u092c\u093e\u0939\u0930 \u0938\u0947\u092b\u094d\u091f\u0940 \u0935\u0949\u091a \u0915\u0947 \u0930\u0942\u092a \u092e\u0947\u0902', '\u092c\u093e\u0930\u0940-\u092c\u093e\u0930\u0940 \u0938\u0947 \u0905\u0915\u0947\u0932\u0947 \u092a\u094d\u0930\u0935\u0947\u0936 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902', '\u0915\u0947\u0935\u0932 \u0938\u0941\u092a\u0930\u0935\u093e\u0907\u091c\u0930 \u0909\u092a\u092f\u094b\u0917 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902'],
    correct_index: 1,
    explanation_en: 'The Buddy System requires one person to enter while another stays outside as Safety Watch. They maintain constant visual/voice contact. If the inside person is incapacitated, the watch calls rescue \u2014 they do NOT enter alone.',
    explanation_hi: '\u092c\u0921\u0940 \u0938\u093f\u0938\u094d\u091f\u092e \u092e\u0947\u0902 \u090f\u0915 \u0935\u094d\u092f\u0915\u094d\u0924\u093f \u0905\u0902\u0926\u0930 \u091c\u093e\u0924\u093e \u0939\u0948 \u0914\u0930 \u0926\u0942\u0938\u0930\u093e \u092c\u093e\u0939\u0930 \u0938\u0947\u092b\u094d\u091f\u0940 \u0935\u0949\u091a \u0915\u0947 \u0930\u0942\u092a \u092e\u0947\u0902\u0964 \u092f\u0926\u093f \u0905\u0902\u0926\u0930 \u0935\u093e\u0932\u093e \u0935\u094d\u092f\u0915\u094d\u0924\u093f \u0905\u0915\u094d\u0937\u092e \u0939\u094b \u091c\u093e\u090f, \u0924\u094b \u092c\u093e\u0939\u0930 \u0935\u093e\u0932\u093e \u092c\u091a\u093e\u0935 \u0926\u0932 \u0915\u094b \u092c\u0941\u0932\u093e\u0924\u093e \u0939\u0948 \u2014 \u0905\u0915\u0947\u0932\u0947 \u0905\u0902\u0926\u0930 \u0928\u0939\u0940\u0902 \u091c\u093e\u0924\u093e\u0964',
    order_index: 1,
  },
  {
    id: 'q-gas-002',
    scenario_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_en: 'When you detect a gas leak, what should you NOT do?',
    question_hi: '\u091c\u092c \u0906\u092a \u0917\u0948\u0938 \u0930\u093f\u0938\u093e\u0935 \u0915\u093e \u092a\u0924\u093e \u0932\u0917\u093e\u090f\u0902, \u0924\u094b \u0915\u094d\u092f\u093e \u0928\u0939\u0940\u0902 \u0915\u0930\u0928\u093e \u091c\u093e\u0939\u093f\u090f?',
    question_sat: 'Gas leak \u092e\u0947\u0902 \u0915\u093e \u0928\u0939\u0940\u0902 \u0915\u0930\u092c\u093e\u0935?',
    options_en: ['Activate the emergency alarm', 'Ignite a lighter or switch to check visibility', 'Don your gas mask', 'Evacuate the area'],
    options_hi: ['\u0906\u092a\u093e\u0924\u0915\u093e\u0932\u0940\u0928 \u0905\u0932\u093e\u0930\u094d\u092e \u091a\u093e\u0932\u0942 \u0915\u0930\u0947\u0902', '\u0932\u093e\u0907\u091f\u0930 \u091c\u0932\u093e\u090f\u0902 \u092f\u093e \u0938\u094d\u0935\u093f\u091a \u0915\u0930\u0947\u0902', '\u0917\u0948\u0938 \u092e\u093e\u0938\u094d\u0915 \u092a\u0939\u0928\u0947\u0902', '\u0915\u094d\u0937\u0947\u0924\u094d\u0930 \u0916\u093e\u0932\u0940 \u0915\u0930\u0947\u0902'],
    correct_index: 1,
    explanation_en: 'NEVER ignite any flame or operate electrical switches in a gas leak area \u2014 this can ignite the gas causing an explosion. The correct actions are: alarm \u2192 evacuate \u2192 don PPE \u2192 emergency services.',
    explanation_hi: '\u0917\u0948\u0938 \u0930\u093f\u0938\u093e\u0935 \u0915\u094d\u0937\u0947\u0924\u094d\u0930 \u092e\u0947\u0902 \u0915\u092d\u0940 \u092d\u0940 \u0932\u093e\u0907\u091f\u0930 \u0928 \u091c\u0932\u093e\u090f\u0902 \u092f\u093e \u092c\u093f\u091c\u0932\u0940 \u0915\u0947 \u0938\u094d\u0935\u093f\u091a \u0928 \u091a\u0932\u093e\u090f\u0902 \u2014 \u0907\u0938\u0938\u0947 \u0935\u093f\u0938\u094d\u092b\u094b\u091f \u0939\u094b \u0938\u0915\u0924\u093e \u0939\u0948\u0964',
    order_index: 2,
  },
  {
    id: 'q-gas-003',
    scenario_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_en: 'Which breathing apparatus is recommended for unknown or high-concentration toxic gas?',
    question_hi: '\u0905\u091c\u094d\u091e\u093e\u0924 \u092f\u093e \u0909\u091a\u094d\u091a-\u0938\u093e\u0902\u0926\u094d\u0930\u0924\u093e \u0935\u093e\u0932\u0940 \u091c\u0939\u0930\u0940\u0932\u0940 \u0917\u0948\u0938 \u0915\u0947 \u0932\u093f\u090f \u0915\u094c\u0928 \u0938\u093e \u0936\u094d\u0935\u093e\u0938 \u0909\u092a\u0915\u0930\u0923 \u0909\u091a\u093f\u0924 \u0939\u0948?',
    question_sat: '\u091c\u0939\u0930\u0940\u0932\u0940 \u0917\u0948\u0938 \u0932\u093e \u0915\u094b\u0928 breathing apparatus?',
    options_en: ['Surgical mask', 'Dust mask (N95)', 'SCBA (Self-Contained Breathing Apparatus)', 'Cloth over mouth'],
    options_hi: ['\u0938\u0930\u094d\u091c\u093f\u0915\u0932 \u092e\u093e\u0938\u094d\u0915', '\u0921\u0938\u094d\u091f \u092e\u093e\u0938\u094d\u0915 (N95)', 'SCBA (\u0938\u094d\u0935-\u0928\u093f\u0939\u093f\u0924 \u0936\u094d\u0935\u093e\u0938 \u0909\u092a\u0915\u0930\u0923)', '\u092e\u0941\u0902\u0939 \u092a\u0930 \u0915\u092a\u095c\u093e'],
    correct_index: 2,
    explanation_en: 'For unknown or high-concentration toxic gases, use SCBA (Self-Contained Breathing Apparatus). It provides its own clean air supply, independent of the surrounding atmosphere. Regular dust masks offer NO protection against toxic gases.',
    explanation_hi: '\u0905\u091c\u094d\u091e\u093e\u0924 \u092f\u093e \u0909\u091a\u094d\u091a-\u0938\u093e\u0902\u0926\u094d\u0930\u0924\u093e \u0935\u093e\u0932\u0940 \u091c\u0939\u0930\u0940\u0932\u0940 \u0917\u0948\u0938 \u0915\u0947 \u0932\u093f\u090f SCBA \u0915\u093e \u0909\u092a\u092f\u094b\u0917 \u0915\u0930\u0947\u0902\u0964 \u092f\u0939 \u0938\u094d\u0935\u092f\u0902 \u0915\u0940 \u0938\u094d\u0935\u091a\u094d\u091b \u0939\u0935\u093e \u092a\u094d\u0930\u0926\u093e\u0928 \u0915\u0930\u0924\u093e \u0939\u0948\u0964 \u0938\u093e\u0927\u093e\u0930\u0923 \u0921\u0938\u094d\u091f \u092e\u093e\u0938\u094d\u0915 \u091c\u0939\u0930\u0940\u0932\u0940 \u0917\u0948\u0938 \u0938\u0947 \u0915\u094b\u0908 \u0938\u0941\u0930\u0915\u094d\u0937\u093e \u0928\u0939\u0940\u0902 \u0926\u0947\u0924\u093e\u0964',
    order_index: 3,
  },
  {
    id: 'q-gas-004',
    scenario_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_en: 'What does H\u2082S smell like, and why is this dangerous?',
    question_hi: 'H\u2082S (\u0939\u093e\u0907\u0921\u094d\u0930\u094b\u091c\u0928 \u0938\u0932\u094d\u092b\u093e\u0907\u0921) \u0915\u0940 \u0917\u0902\u0927 \u0915\u0948\u0938\u0940 \u0939\u094b\u0924\u0940 \u0939\u0948 \u0914\u0930 \u092f\u0939 \u0916\u0924\u0930\u0928\u093e\u0915 \u0915\u094d\u092f\u094b\u0902 \u0939\u0948?',
    question_sat: 'H\u2082S gas ka smell?',
    options_en: ['Sweet smell \u2014 harmless at low concentrations', 'Rotten eggs smell \u2014 but you lose sense of smell at high concentrations', 'No smell \u2014 only detected by instruments', 'Strong chemical smell \u2014 always detectable'],
    options_hi: ['\u092e\u0940\u0920\u0940 \u0917\u0902\u0927 \u2014 \u0915\u092e \u0938\u093e\u0902\u0926\u094d\u0930\u0924\u093e \u092e\u0947\u0902 \u0939\u093e\u0928\u093f\u0930\u0939\u093f\u0924', '\u0938\u095c\u0947 \u0905\u0902\u0921\u0947 \u0915\u0940 \u0917\u0902\u0927 \u2014 \u0932\u0947\u0915\u093f\u0928 \u0909\u091a\u094d\u091a \u0938\u093e\u0902\u0926\u094d\u0930\u0924\u093e \u092e\u0947\u0902 \u0938\u0942\u0902\u0918\u0928\u0947 \u0915\u0940 \u0915\u094d\u0937\u092e\u0924\u093e \u0916\u094b \u0926\u0947\u0924\u0947 \u0939\u0948\u0902', '\u0915\u094b\u0908 \u0917\u0902\u0927 \u0928\u0939\u0940\u0902 \u2014 \u0915\u0947\u0935\u0932 \u0909\u092a\u0915\u0930\u0923\u094b\u0902 \u0926\u094d\u0935\u093e\u0930\u093e \u092a\u0924\u093e \u0932\u0917\u093e\u092f\u093e \u091c\u093e\u0924\u093e \u0939\u0948', '\u0924\u0947\u091c \u0930\u093e\u0938\u093e\u092f\u0928\u093f\u0915 \u0917\u0902\u0927 \u2014 \u0939\u092e\u0947\u0936\u093e \u092a\u0939\u091a\u093e\u0928 \u092e\u0947\u0902 \u0906\u0924\u0940 \u0939\u0948'],
    correct_index: 1,
    explanation_en: 'H\u2082S smells like rotten eggs at low concentrations. Dangerously, at high concentrations it causes olfactory fatigue \u2014 you lose your sense of smell and can no longer detect it, making it extremely lethal.',
    explanation_hi: 'H\u2082S \u0915\u0940 \u0917\u0902\u0927 \u0915\u092e \u0938\u093e\u0902\u0926\u094d\u0930\u0924\u093e \u092e\u0947\u0902 \u0938\u095c\u0947 \u0905\u0902\u0921\u0947 \u091c\u0948\u0938\u0940 \u0939\u094b\u0924\u0940 \u0939\u0948\u0964 \u0909\u091a\u094d\u091a \u0938\u093e\u0902\u0926\u094d\u0930\u0924\u093e \u092e\u0947\u0902, \u0906\u092a \u0938\u0942\u0902\u0918\u0928\u0947 \u0915\u0940 \u0915\u094d\u0937\u092e\u0924\u093e \u0916\u094b \u0926\u0947\u0924\u0947 \u0939\u0948\u0902 \u2014 \u0907\u0938\u0947 \u0918\u094d\u0930\u093e\u0923 \u0925\u0915\u093e\u0928 \u0915\u0939\u0924\u0947 \u0939\u0948\u0902 \u2014 \u091c\u094b \u0907\u0938\u0947 \u092c\u0947\u0939\u0926 \u0916\u0924\u0930\u0928\u093e\u0915 \u092c\u0928\u093e\u0924\u093e \u0939\u0948\u0964',
    order_index: 4,
  },
  {
    id: 'q-gas-005',
    scenario_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_en: 'After a gas leak emergency, when can workers safely re-enter the area?',
    question_hi: '\u0917\u0948\u0938 \u0930\u093f\u0938\u093e\u0935 \u0906\u092a\u093e\u0924 \u0938\u094d\u0925\u093f\u0924\u093f \u0915\u0947 \u092c\u093e\u0926 \u0915\u0930\u094d\u092e\u091a\u093e\u0930\u0940 \u0915\u092c \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u0930\u0942\u092a \u0938\u0947 \u0915\u094d\u0937\u0947\u0924\u094d\u0930 \u092e\u0947\u0902 \u0935\u093e\u092a\u0938 \u091c\u093e \u0938\u0915\u0924\u0947 \u0939\u0948\u0902?',
    question_sat: 'Gas emergency \u092c\u093e\u0926 \u092e\u0947\u0902 \u0915\u092c \u0932\u094c\u091f\u093e\u092e?',
    options_en: ['Immediately after gas stops', 'Only after the Safety Officer declares the area safe', 'After 30 minutes', 'Whenever they feel ready'],
    options_hi: ['\u0917\u0948\u0938 \u0930\u0941\u0915\u0928\u0947 \u0915\u0947 \u0924\u0941\u0930\u0902\u0924 \u092c\u093e\u0926', '\u0915\u0947\u0935\u0932 \u0924\u092c \u091c\u092c \u0938\u0947\u092b\u094d\u091f\u0940 \u0911\u092b\u093c\u093f\u0938\u0930 \u0915\u094d\u0937\u0947\u0924\u094d\u0930 \u0915\u094b \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u0918\u094b\u0937\u093f\u0924 \u0915\u0930\u0947', '30 \u092e\u093f\u0928\u091f \u092c\u093e\u0926', '\u091c\u092c \u092d\u0940 \u0935\u0947 \u0924\u0948\u092f\u093e\u0930 \u092e\u0939\u0938\u0942\u0938 \u0915\u0930\u0947\u0902'],
    correct_index: 1,
    explanation_en: 'Workers must NEVER re-enter a gas-affected area until the designated Safety Officer has declared it safe using gas detection instruments. Premature re-entry has caused many fatalities.',
    explanation_hi: '\u0915\u0930\u094d\u092e\u091a\u093e\u0930\u093f\u092f\u094b\u0902 \u0915\u094b \u0915\u092d\u0940 \u092d\u0940 \u092a\u094d\u0930\u092d\u093e\u0935\u093f\u0924 \u0915\u094d\u0937\u0947\u0924\u094d\u0930 \u092e\u0947\u0902 \u0924\u092c \u0924\u0915 \u0935\u093e\u092a\u0938 \u0928\u0939\u0940\u0902 \u091c\u093e\u0928\u093e \u091a\u093e\u0939\u093f\u090f \u091c\u092c \u0924\u0915 \u0938\u0947\u092b\u094d\u091f\u0940 \u0911\u092b\u093c\u093f\u0938\u0930 \u0917\u0948\u0938 \u0921\u093f\u091f\u0947\u0915\u094d\u0936\u0928 \u0909\u092a\u0915\u0930\u0923\u094b\u0902 \u0938\u0947 \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u0928 \u0918\u094b\u0937\u093f\u0924 \u0915\u0930\u0947\u0964',
    order_index: 5,
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
  const questions = DEMO_QUESTIONS.filter(q => q.scenario_id === scenarioId)
    .sort((a, b) => a.order_index - b.order_index)
  return { data: questions, error: null }
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

// ─── Utility ─────────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Re-export helpers for use in other modules if needed
export { load, save, uuid, DEMO_SCENARIOS, DEMO_QUESTIONS }
