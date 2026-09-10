-- =============================================================================
-- SurakshaAR Database Seed Data
-- =============================================================================

-- Scenarios
insert into public.scenarios (id, title, description, hazard_type, difficulty, benchmark_time_ms, steps, coming_soon)
values
  (
    'a1b2c3d4-0001-0001-0001-000000000001',
    'Fire & Explosion Response',
    'Simulate responding to an electrical fire on a manufacturing floor. Identify the hazard, activate emergency protocols, don PPE, use the correct extinguisher, and evacuate safely.',
    'fire',
    'beginner',
    90000,
    '[
      {"index": 0, "label": "Identify Fire Source", "instruction": "Locate and identify the electrical fire near the control panel", "position": [3, 1.2, 3], "color": "#ef4444", "is_ppe_step": false},
      {"index": 1, "label": "Trigger Fire Alarm", "instruction": "Activate the nearest manual fire alarm call point", "position": [2.5, 2.0, -2], "color": "#f97316", "is_ppe_step": false},
      {"index": 2, "label": "Equip Fire-Rated PPE", "instruction": "Put on fire-rated gloves, helmet, and protective gear from the station", "position": [-4, 0.9, 1], "color": "#22c55e", "is_ppe_step": true},
      {"index": 3, "label": "Use CO₂ Extinguisher", "instruction": "Select the correct CO₂ extinguisher and aim at the base of the fire", "position": [1.5, 0.8, 2], "color": "#3b82f6", "is_ppe_step": false},
      {"index": 4, "label": "Use Fire Exit", "instruction": "Proceed through the nearest clearly marked fire exit", "position": [-6, 1.5, -5], "color": "#8b5cf6", "is_ppe_step": false},
      {"index": 5, "label": "Reach Muster Point", "instruction": "Assemble at the outdoor safe muster point for roll call", "position": [0, 1.0, 10], "color": "#a855f7", "is_ppe_step": false}
    ]'::jsonb,
    false
  ),
  (
    'a1b2c3d4-0002-0002-0002-000000000002',
    'Gas Leak & Confined Space Protocol',
    'Practice responding to a hazardous gas leak in a mining tunnel using the buddy system. Identify the leak, activate protocols, don breathing apparatus, and evacuate safely.',
    'gas_leak',
    'intermediate',
    120000,
    '[
      {"index": 0, "label": "Identify Gas Leak Warning", "instruction": "Click the gas pipe leak to identify the hazard", "position": [-2.5, 1.2, 2], "color": "#f59e0b", "is_ppe_step": false},
      {"index": 1, "label": "Activate Emergency Alarm", "instruction": "Trigger the alarm panel to alert all workers", "position": [2.8, 1.5, -1], "color": "#ef4444", "is_ppe_step": false},
      {"index": 2, "label": "Apply Buddy System", "instruction": "Confirm your buddy — never enter alone. One person watches from outside.", "position": [0, 1.2, 1], "color": "#06b6d4", "is_ppe_step": false},
      {"index": 3, "label": "Don Gas Mask / SCBA", "instruction": "Pick up the gas mask and SCBA breathing apparatus from the safety locker", "position": [-2.5, 0.8, -4], "color": "#22c55e", "is_ppe_step": true},
      {"index": 4, "label": "Evacuate Personnel", "instruction": "Guide all workers toward the tunnel exit", "position": [0, 1.0, -8], "color": "#3b82f6", "is_ppe_step": false},
      {"index": 5, "label": "Reach Muster Point", "instruction": "Assemble at the designated safe muster point outside", "position": [0, 1.0, 10], "color": "#a855f7", "is_ppe_step": false}
    ]'::jsonb,
    false
  ),
  (
    'a1b2c3d4-0003-0003-0003-000000000003',
    'Machinery Safety & Lockout/Tagout',
    'Learn to safely isolate and lock out machinery before maintenance using the LOTO procedure. Prevents accidental machine startup during maintenance.',
    'machinery',
    'advanced',
    150000,
    '[]'::jsonb,
    true
  )
on conflict (id) do nothing;

-- Assessment Questions
insert into public.assessment_questions (
  id, scenario_id, question_en, question_hi, question_sat, options_en, options_hi, correct_index, explanation_en, explanation_hi, order_index
) values
  (
    'b1c2d3e4-0001-0001-0001-000000000001',
    'a1b2c3d4-0001-0001-0001-000000000001',
    'Which type of fire extinguisher should be used for an electrical fire?',
    'बिजली की आग के लिए कौन सा अग्निशामक उपयोग करना चाहिए?',
    'बिजली आग ला कोन extinguisher चाबाव?',
    '["Water (Red)", "CO₂ (Black)", "Petrol", "Foam (Cream)"]'::jsonb,
    '["पानी (लाल)", "CO₂ (काला)", "पेट्रोल", "फोम (क्रीम)"]'::jsonb,
    1,
    'CO₂ extinguishers are safe for electrical fires as they do not conduct electricity. Never use water on electrical fires — it conducts electricity and can cause electrocution.',
    'CO₂ अग्निशामक बिजली के लिए सुरक्षित है क्योंकि यह बिजली का संचालन नहीं करता। बिजली की आग पर पानी का उपयोग कभी न करें।',
    1
  ),
  (
    'b1c2d3e4-0001-0001-0001-000000000002',
    'a1b2c3d4-0001-0001-0001-000000000001',
    'What does PASS stand for when using a fire extinguisher?',
    'अग्निशामक उपयोग करते समय PASS का क्या अर्थ है?',
    'PASS ka matlab?',
    '["Pull, Aim, Squeeze, Sweep", "Push, Alert, Spray, Secure", "Prepare, Aim, Start, Stop", "Pull, Apply, Shoot, Save"]'::jsonb,
    '["खींचें, लक्ष्य करें, दबाएं, झाड़ू लगाएं", "धकेलें, सचेत करें, स्प्रे करें, सुरक्षित करें", "तैयार करें, लक्ष्य करें, शुरू करें, रोकें", "खींचें, लगाएं, शूट करें, बचाएं"]'::jsonb,
    0,
    'PASS: Pull the safety pin → Aim at the base of the fire → Squeeze the handle → Sweep from side to side at the base.',
    'PASS: पिन खींचें → आग की जड़ पर निशाना लगाएं → हैंडल दबाएं → आधार पर दाएं-बाएं झाड़ू लगाएं।',
    2
  ),
  (
    'b1c2d3e4-0002-0002-0002-000000000001',
    'a1b2c3d4-0002-0002-0002-000000000002',
    'What is the Buddy System in confined space and gas leak response?',
    'सीमित स्थान और गैस रिसाव में बडी सिस्टम क्या है?',
    'Buddy System का मतलब?',
    '["Both workers enter together", "One person enters, one stays outside as safety watch", "Take turns entering alone", "Only supervisors use it"]'::jsonb,
    '["दोनों कर्मचारी एक साथ प्रवेश करते हैं", "एक व्यक्ति अंदर जाता है, एक बाहर सेफ्टी वॉच के रूप में", "बारी-बारी से अकेले प्रवेश करते हैं", "केवल सुपरवाइजर उपयोग करते हैं"]'::jsonb,
    1,
    'The Buddy System requires one person to enter while another stays outside as Safety Watch. They maintain constant visual/voice contact.',
    'बडी सिस्टम में एक व्यक्ति अंदर जाता है और दूसरा बाहर सेफ्टी वॉच के रूप में। यदि अंदर वाला व्यक्ति अक्षम हो जाए, तो बाहर वाला बचाव दल को बुलाता है।',
    1
  ),
  (
    'b1c2d3e4-0002-0002-0002-000000000002',
    'a1b2c3d4-0002-0002-0002-000000000002',
    'When you detect a gas leak, what should you NOT do?',
    'जब आप गैस रिसाव का पता लगाएं, तो क्या नहीं करना चाहिए?',
    'Gas leak में का नहीं करबाव?',
    '["Activate the emergency alarm", "Ignite a lighter or switch to check visibility", "Don your gas mask", "Evacuate the area"]'::jsonb,
    '["आपातकालीन अलार्म चालू करें", "लाइटर जलाएं या स्विच करें", "गैस मास्क पहनें", "क्षेत्र खाली करें"]'::jsonb,
    1,
    'NEVER ignite any flame or operate electrical switches in a gas leak area — this can ignite the gas causing an explosion.',
    'गैस रिसाव क्षेत्र में कभी भी लाइटर न जलाएं या बिजली के स्विच न चलाएं — इससे विस्फोट हो सकता है।',
    2
  )
on conflict (id) do nothing;
