/**
 * SurakshaAR — Safety Knowledge Base (RAG-lite)
 *
 * A curated, safety-verified knowledge base for the Safety Chatbot.
 * Uses keyword matching — NOT an LLM — to ensure deterministic,
 * safety-critical responses.
 *
 * Unknown queries get a safe fallback response instructing the user
 * to follow site procedures and contact their supervisor.
 */

export const MODULES = {
  FIRE_EXPLOSION: 'FIRE_EXPLOSION',
  GAS_LEAK: 'GAS_LEAK',
  MACHINERY: 'MACHINERY',
  GLOBAL: 'GLOBAL',
}

// Safe fallback — never invents safety procedures
export const SAFE_FALLBACK = {
  en: "I don't have verified guidance for this specific situation. Please follow your site's emergency procedure and contact your supervisor or the emergency response team immediately.",
  hi: "इस विशेष स्थिति के लिए मेरे पास सत्यापित मार्गदर्शन नहीं है। कृपया अपनी साइट की आपातकालीन प्रक्रिया का पालन करें और तुरंत अपने सुपरवाइज़र या आपातकालीन प्रतिक्रिया टीम से संपर्क करें।",
  sat: "ᱤᱠᱤ ᱵᱮᱢ ᱯᱟᱛᱟᱣ — ᱟᱯᱮᱨ ᱥᱟᱭᱛ ᱨᱮᱭᱟᱜ ᱤᱢᱚᱨᱡᱮᱱᱥᱤ ᱨᱩᱴᱤᱱ ᱠᱷᱚᱱ ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟ।",
}

export const KNOWLEDGE_BASE = [
  // ─── GREETINGS & INTRO ──────────────────────────────────────
  {
    id: 'greeting',
    module: MODULES.GLOBAL,
    keywords: ['hi', 'hii', 'hiii', 'hello', 'hey', 'namaste', 'namaskar', 'good morning', 'good afternoon', 'good evening', 'help', 'start', 'नमस्ते', 'नमस्कार', 'मदद', 'हॅलो'],
    answer_en: "👷 Hello! I am your SurakshaAR Safety Knowledge Assistant.\n\nYou can ask me anything about:\n• 🔴 Fire extinguishers & PASS rules\n• ⚡ Electrical fire procedures\n• 🦺 Mandatory PPE safety gear\n• 💨 Gas leak detection & Buddy System\n• 🚪 Evacuation routes & Muster Points\n• 📞 Emergency helpline numbers\n\nWhat safety topic can I help you with?",
    answer_hi: "👷 नमस्ते! मैं आपका SurakshaAR सुरक्षा ज्ञान सहायक हूँ।\n\nआप मुझसे निम्न के बारे में पूछ सकते हैं:\n• 🔴 अग्निशामक और PASS नियम\n• ⚡ बिजली की आग से निपटने के तरीके\n• 🦺 अनिवार्य PPE सुरक्षा उपकरण\n• 💨 गैस रिसाव और बडी सिस्टम\n• 🚪 निकासी मार्ग और मस्टर पॉइंट\n• 📞 आपातकालीन हेल्पलाइन नंबर\n\nआज मैं आपकी क्या सहायता कर सकता हूँ?",
  },
  // ─── FIRE & EXPLOSION ───────────────────────────────────────
  {
    id: 'fire_extinguisher_types',
    module: MODULES.GLOBAL,
    keywords: ['extinguisher', 'fire extinguisher', 'अग्निशामक', 'type', 'use', 'how'],
    answer_en: 'There are 4 main fire extinguisher types:\n\n🔴 Water (Red) — for wood, paper, cloth. NEVER on electrical or chemical fires.\n⚫ CO₂ (Black) — for electrical fires and flammable liquids. Safe on electronics.\n🟤 Dry Powder (Blue) — versatile; works on most fires. Can damage equipment.\n🟡 Foam (Cream) — for flammable liquids. NOT for electrical fires.\n\nRemember PASS: Pull • Aim • Squeeze • Sweep',
    answer_hi: 'अग्निशामक के 4 मुख्य प्रकार हैं:\n\n🔴 पानी (लाल) — लकड़ी, कागज, कपड़े के लिए। बिजली या रसायन की आग पर कभी नहीं।\n⚫ CO₂ (काला) — बिजली की आग और ज्वलनशील तरल पदार्थों के लिए।\n🟤 सूखा पाउडर (नीला) — अधिकांश आगों पर काम करता है।\n🟡 फोम (क्रीम) — ज्वलनशील तरल के लिए।\n\nPASS याद रखें: खींचें • लक्ष्य करें • दबाएं • झाडू लगाएं',
  },
  {
    id: 'electrical_fire',
    module: MODULES.FIRE_EXPLOSION,
    keywords: ['electrical', 'electric', 'control panel', 'panel', 'co2', 'बिजली', 'विद्युत'],
    answer_en: 'For electrical fires:\n✅ Use CO₂ (black) or Dry Powder extinguisher\n❌ NEVER use water — risk of electrocution\n\nFirst: Switch off the power supply if safe to do so. Alert others and activate the fire alarm. Do NOT approach without proper PPE.',
    answer_hi: 'बिजली की आग के लिए:\n✅ CO₂ (काला) या सूखा पाउडर अग्निशामक उपयोग करें\n❌ पानी का उपयोग कभी न करें — बिजली का झटका लग सकता है\n\nपहले: सुरक्षित होने पर बिजली बंद करें। अलार्म बजाएं।',
  },
  {
    id: 'fire_ppe',
    module: MODULES.FIRE_EXPLOSION,
    keywords: ['ppe', 'protective', 'equipment', 'wear', 'fire ppe', 'helmet', 'gloves', 'सुरक्षात्मक', 'उपकरण', 'PPE'],
    answer_en: 'For fire emergencies, required PPE includes:\n🪖 Fire-rated safety helmet\n🧤 Heat-resistant gloves\n👁️ Safety goggles\n🦺 Flame-retardant high-visibility vest\n👢 Safety boots (steel-toed)\n\nAlways don PPE BEFORE approaching the hazard zone.',
    answer_hi: 'आग की आपातस्थिति के लिए आवश्यक PPE:\n🪖 फायर-रेटेड सेफ्टी हेलमेट\n🧤 हीट-प्रतिरोधी दस्ताने\n👁️ सेफ्टी चश्मे\n🦺 फ्लेम-रिटार्डेंट वेस्ट\n👢 सेफ्टी बूट्स\n\nहमेशा खतरे की जगह पहुंचने से पहले PPE पहनें।',
  },
  {
    id: 'fire_evacuation',
    module: MODULES.FIRE_EXPLOSION,
    keywords: ['evacuate', 'evacuation', 'exit', 'escape', 'leave', 'get out', 'निकास', 'खाली करें'],
    answer_en: 'Fire evacuation sequence:\n1. Activate the nearest fire alarm\n2. Don PPE if safe to do so\n3. Alert all personnel — use verbal warning\n4. Use the nearest marked fire exit (never elevators)\n5. Close doors behind you to slow fire spread\n6. Assemble at the designated Muster Point\n7. Await roll call — do NOT re-enter until cleared by authorities',
    answer_hi: 'अग्नि निकासी क्रम:\n1. नजदीकी फायर अलार्म सक्रिय करें\n2. सुरक्षित होने पर PPE पहनें\n3. सभी कर्मचारियों को सतर्क करें\n4. नजदीकी अग्नि निकास का उपयोग करें (लिफ्ट नहीं)\n5. आग की गति धीमी करने के लिए दरवाजे बंद करें\n6. निर्धारित मस्टर पॉइंट पर जाएं\n7. रोल कॉल तक प्रतीक्षा करें',
  },
  {
    id: 'muster_point',
    module: MODULES.GLOBAL,
    keywords: ['muster', 'assembly', 'point', 'gather', 'meet', 'मस्टर', 'एकत्र'],
    answer_en: 'The Muster Point is the pre-designated safe area where all personnel must assemble during an emergency. Features:\n• Located at a safe distance from the facility\n• Clearly marked with signage\n• Has a roll-call register\n\nDo NOT leave the muster point until officially cleared by the Safety Officer.',
    answer_hi: 'मस्टर पॉइंट वह पूर्व-निर्धारित सुरक्षित क्षेत्र है जहाँ आपातकाल में सभी कर्मचारियों को एकत्र होना होता है। सुरक्षा अधिकारी की अनुमति के बिना यहाँ से न जाएं।',
  },
  // ─── GAS LEAK ────────────────────────────────────────────────
  {
    id: 'gas_leak_detection',
    module: MODULES.GAS_LEAK,
    keywords: ['gas', 'leak', 'smell', 'detect', 'identify', 'गैस', 'रिसाव', 'पहचान'],
    answer_en: 'Gas leak detection signs:\n\n👃 Unusual smell (rotten eggs for H₂S, chemical odor for other gases)\n👁️ Visible cloud, haze, or discoloration\n🔊 Hissing or whistling sound from pipes\n🌡️ Frost or condensation around fittings\n\nImmediate actions:\n1. Do NOT ignite any flame or spark\n2. Alert all personnel\n3. Activate the emergency alarm\n4. Don gas mask / SCBA before approaching',
    answer_hi: 'गैस रिसाव के संकेत:\n\n👃 असामान्य गंध (H₂S के लिए सड़े अंडे जैसी)\n👁️ दृश्यमान बादल या धुंध\n🔊 पाइप से सीटी या फुसफुसाहट की आवाज़\n\nतत्काल कार्रवाई:\n1. कोई ज्वाला या चिंगारी न जलाएं\n2. सभी को सतर्क करें\n3. आपातकालीन अलार्म बजाएं\n4. गैस मास्क/SCBA पहनकर ही पास जाएं',
  },
  {
    id: 'buddy_system',
    module: MODULES.GAS_LEAK,
    keywords: ['buddy', 'confined', 'space', 'alone', 'partner', 'system', 'बडी', 'साथी'],
    answer_en: 'The Buddy System is mandatory for confined space entry and gas leak response:\n\n✅ Never enter a gas-affected area alone\n✅ One person enters — one stands outside as Safety Watch\n✅ Maintain visual or voice contact at all times\n✅ Safety Watch must have communication to call for help\n✅ Pre-agree on distress signals\n\nIf your buddy becomes incapacitated — do NOT enter alone. Call for rescue team immediately.',
    answer_hi: 'बडी सिस्टम सीमित स्थान प्रवेश और गैस रिसाव के लिए अनिवार्य है:\n\n✅ गैस प्रभावित क्षेत्र में अकेले कभी न जाएं\n✅ एक व्यक्ति अंदर जाता है — एक बाहर सेफ्टी वॉच के रूप में\n✅ हमेशा दृश्य या आवाज़ संपर्क बनाए रखें\n\nयदि आपका साथी अक्षम हो जाए — अकेले अंदर न जाएं। तुरंत बचाव दल को बुलाएं।',
  },
  {
    id: 'gas_ppe',
    module: MODULES.GAS_LEAK,
    keywords: ['mask', 'scba', 'breathing', 'respirator', 'मास्क', 'श्वसन'],
    answer_en: 'PPE for gas leak response:\n\n🎭 Gas mask (appropriate for identified gas type) OR SCBA (Self-Contained Breathing Apparatus) for unknown gas\n🥽 Chemical splash goggles\n🧤 Chemical-resistant gloves\n👔 Coveralls (chemical resistant if needed)\n👢 Safety boots\n\nNever use a standard dust mask — it provides NO protection against toxic gases.',
    answer_hi: 'गैस रिसाव के लिए PPE:\n\n🎭 गैस मास्क (पहचाने गए गैस प्रकार के लिए) या SCBA (अज्ञात गैस के लिए)\n🥽 रासायनिक चश्मे\n🧤 रासायनिक-प्रतिरोधी दस्ताने\n\nसाधारण धूल मास्क का उपयोग न करें — यह जहरीली गैस से कोई सुरक्षा नहीं देता।',
  },
  // ─── GENERAL SAFETY ──────────────────────────────────────────
  {
    id: 'emergency_number',
    module: MODULES.GLOBAL,
    keywords: ['emergency', 'number', 'call', 'help', 'contact', 'ambulance', 'नंबर', 'आपातकाल', 'मदद'],
    answer_en: 'Emergency contact numbers in India:\n\n🚒 Fire: 101\n🚑 Ambulance: 108 (National Health Helpline)\n👮 Police: 100\n🆘 National Emergency: 112\n\nAlways know your site-specific emergency contacts. Post them at all workstations.',
    answer_hi: 'भारत में आपातकालीन नंबर:\n\n🚒 अग्निशमन: 101\n🚑 एम्बुलेंस: 108\n👮 पुलिस: 100\n🆘 राष्ट्रीय आपातकाल: 112\n\nअपने साइट के विशिष्ट आपातकालीन नंबर भी जानें।',
  },
  {
    id: 'first_aid',
    module: MODULES.GLOBAL,
    keywords: ['first aid', 'injured', 'hurt', 'burn', 'wound', 'प्राथमिक', 'चोट', 'जलन'],
    answer_en: 'Basic first aid principles (RICE for injuries):\n\nFor burns:\n• Cool with running water for 10+ minutes\n• Do NOT use ice, butter, or toothpaste\n• Cover with clean, non-fluffy material\n• Seek medical attention for any significant burn\n\nFor chemical contact:\n• Flush with large amounts of water immediately (20+ min for eyes)\n• Remove contaminated clothing\n• Seek immediate medical attention\n\nAlways alert your supervisor and record the incident.',
    answer_hi: 'प्राथमिक उपचार के सिद्धांत:\n\nजलने पर:\n• 10+ मिनट के लिए बहते पानी से ठंडा करें\n• बर्फ, मक्खन या टूथपेस्ट का उपयोग न करें\n• साफ कपड़े से ढकें\n• डॉक्टर से मिलें\n\nरासायनिक संपर्क पर:\n• तुरंत बड़ी मात्रा में पानी से धोएं\n• दूषित कपड़े हटाएं\n• तुरंत चिकित्सा सहायता लें',
  },
  {
    id: 'hazard_identification',
    module: MODULES.GLOBAL,
    keywords: ['hazard', 'risk', 'identify', 'danger', 'sign', 'symbol', 'खतरा', 'जोखिम', 'पहचान'],
    answer_en: 'Hazard identification — look for these warning signs:\n\n🟡 Yellow triangle — Warning/Caution\n🔴 Red circle with line — Prohibition (forbidden action)\n🔵 Blue circle — Mandatory action (must do)\n🟢 Green square — Safe condition or First Aid\n\nAlways report unidentified hazards to your supervisor. Use the site hazard log.',
    answer_hi: 'खतरे की पहचान — इन चेतावनी संकेतों पर ध्यान दें:\n\n🟡 पीला त्रिकोण — चेतावनी/सावधानी\n🔴 लाल वृत्त — निषेध\n🔵 नीला वृत्त — अनिवार्य कार्य\n🟢 हरा वर्ग — सुरक्षित स्थिति या प्राथमिक चिकित्सा\n\nअज्ञात खतरों की सूचना अपने सुपरवाइज़र को दें।',
  },
]

/**
 * Query the knowledge base with a text input.
 * Returns the best matching answer in the specified language,
 * or the safe fallback if no match found.
 */
export function queryKnowledgeBase(input, lang = 'en', currentModule = MODULES.GLOBAL) {
  if (!input || input.trim().length === 0) return null

  const tokens = input.toLowerCase().split(/[\s,?.!;:]+/).filter(Boolean)

  // Score each KB entry by keyword matches
  const scored = KNOWLEDGE_BASE.map(entry => {
    // Module relevance: prefer current module, then global
    const moduleBonus = entry.module === currentModule ? 2 : entry.module === MODULES.GLOBAL ? 1 : 0
    const keywordScore = entry.keywords.reduce((score, kw) => {
      const kwTokens = kw.toLowerCase().split(/\s+/)
      // Multi-word keyword matching
      const fullMatch = input.toLowerCase().includes(kw.toLowerCase()) ? 3 : 0
      const partialMatch = kwTokens.filter(t => tokens.includes(t)).length
      return score + fullMatch + partialMatch
    }, 0)
    return { entry, score: keywordScore + moduleBonus }
  })

  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]

  // Only return a match if we have a reasonable score
  if (!best || best.score < 2) {
    const fallbackText = SAFE_FALLBACK[lang] ?? SAFE_FALLBACK.en
    return {
      answer: fallbackText,
      source: 'Standard Emergency Operating Procedure',
      confidence: 0.5,
    }
  }

  const ans = (lang === 'hi' ? best.entry.answer_hi : best.entry.answer_en) ?? (SAFE_FALLBACK[lang] ?? SAFE_FALLBACK.en)
  return {
    answer: ans,
    source: 'National Industrial Safety Protocol',
    confidence: Math.min(1.0, 0.7 + best.score * 0.05),
  }
}

/** Get suggested questions for a module */
export function getSuggestedQuestions(module, lang = 'en') {
  const questions = {
    FIRE_EXPLOSION: {
      en: ['How do I use a fire extinguisher?', 'What PPE should I wear during a fire?', 'What is the fire evacuation sequence?', 'Which extinguisher for electrical fire?'],
      hi: ['अग्निशामक का उपयोग कैसे करें?', 'आग के दौरान कौन सा PPE पहनें?', 'अग्नि निकासी क्रम क्या है?', 'बिजली की आग के लिए कौन सा अग्निशामक?'],
    },
    GAS_LEAK: {
      en: ['How do I detect a gas leak?', 'What is the buddy system?', 'What PPE for gas leak?', 'What are gas emergency steps?'],
      hi: ['गैस रिसाव कैसे पहचानें?', 'बडी सिस्टम क्या है?', 'गैस रिसाव के लिए कौन सा PPE?', 'गैस आपातकाल के कदम क्या हैं?'],
    },
    GLOBAL: {
      en: ['What are emergency numbers?', 'How to identify a hazard?', 'What is first aid for burns?', 'Where is the muster point?'],
      hi: ['आपातकालीन नंबर क्या हैं?', 'खतरे की पहचान कैसे करें?', 'जलने पर प्राथमिक उपचार?', 'मस्टर पॉइंट कहाँ है?'],
    },
  }
  const moduleQuestions = questions[module] ?? questions.GLOBAL
  return moduleQuestions[lang] ?? moduleQuestions.en
}
