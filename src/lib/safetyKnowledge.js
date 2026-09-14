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
  hinglish: "Is specific situation ke liye verified safety jankari uplabdh nahi hai. Kripya apne site ke emergency procedure ko follow karein aur turant apne supervisor ya safety officer se contact karein.",
  sat: "ᱱᱚᱶᱟ ᱵᱤᱥᱮᱥ ᱦᱟᱞᱚᱛ ᱞᱟᱹᱜᱤᱫ ᱥᱟᱹᱨᱤ ᱩᱫᱩᱜ ᱵᱟᱹᱱᱩᱜᱼᱟ᱾ ᱫᱟᱭᱟᱠᱟᱛᱮ ᱟᱢᱟᱜ ᱥᱟᱭᱤᱴ ᱨᱮᱱᱟᱜ ᱟᱯᱟᱛᱠᱟᱞᱤᱱ ᱱᱤᱭᱟᱹᱢ ᱯᱟᱸᱡᱟᱭ ᱢᱮ ᱟᱨ ᱥᱩᱯᱚᱨᱵᱷᱟᱭᱤᱡᱚᱨ ᱥᱟᱶ ᱡᱚᱯᱲᱟᱣ ᱢᱮ᱾",
}

export const KNOWLEDGE_BASE = [
  // ─── GREETINGS & INTRO ──────────────────────────────────────
  {
    id: 'greeting',
    module: MODULES.GLOBAL,
    keywords: ['hi', 'hii', 'hiii', 'hello', 'hey', 'namaste', 'namaskar', 'good morning', 'good afternoon', 'good evening', 'help', 'start', 'नमस्ते', 'नमस्कार', 'मदद', 'हॅलो', 'kya kar sakte ho', 'kaise ho', 'ᱡᱚᱦᱟᱨ', 'ᱜᱚᱲᱚ'],
    answer_en: "👷 Hello! I am your SurakshaAR Safety Knowledge Assistant.\n\nYou can ask me anything about:\n• 🔴 Fire extinguishers & PASS rules\n• ⚡ Electrical fire procedures\n• 🦺 Mandatory PPE safety gear\n• 💨 Gas leak detection & Buddy System\n• 🚪 Evacuation routes & Muster Points\n• 📞 Emergency helpline numbers\n\nWhat safety topic can I help you with?",
    answer_hi: "👷 नमस्ते! मैं आपका SurakshaAR सुरक्षा ज्ञान सहायक हूँ।\n\nआप मुझसे निम्न के बारे में पूछ सकते हैं:\n• 🔴 अग्निशामक और PASS नियम\n• ⚡ बिजली की आग से निपटने के तरीके\n• 🦺 अनिवार्य PPE सुरक्षा उपकरण\n• 💨 गैस रिसाव और बडी सिस्टम\n• 🚪 निकासी मार्ग और मस्टर पॉइंट\n• 📞 आपातकालीन हेल्पलाइन नंबर\n\nआज मैं आपकी क्या सहायता कर सकता हूँ?",
    answer_hinglish: "👷 Namaste! Main aapka SurakshaAR Safety Knowledge Assistant hoon.\n\nAap mujhse in zaroori cheezon ke baare mein pooch sakte hain ya bol kar bata sakte hain:\n• 🔴 Fire extinguishers aur PASS rules\n• ⚡ Bijli ki aag (Electrical fire) se bachaav\n• 🦺 Anivarya PPE safety gear\n• 💨 Gas leak detection aur Buddy System\n• 🚪 Evacuation routes aur Muster Points\n• 📞 Emergency helpline numbers (101, 108, 112)\n\nAapko kis safety topic par madad chahiye?",
    answer_sat: "👷 ᱡᱚᱦᱟᱨ! ᱤᱧ SurakshaAR ᱥᱩᱨᱠᱷᱟ ᱜᱮᱭᱟᱱ ᱜᱚᱲᱚᱭᱤᱡ ᱠᱟᱹᱱᱟᱹᱧ᱾\n\nᱟᱢ ᱤᱧ ᱱᱚᱶᱟ ᱠᱚ ᱵᱟᱵᱚᱛ ᱠᱩᱞᱤ ᱫᱟᱲᱮᱭᱟᱹᱧᱟ:\n• 🔴 ᱥᱮᱸᱜᱮᱞ ᱤᱬᱤᱡᱤᱡ ᱟᱨ PASS ᱱᱤᱭᱟᱹᱢ\n• ⚡ ᱵᱤᱡᱽᱞᱤ ᱥᱮᱸᱜᱮᱞ ᱨᱩᱠᱷᱤᱭᱟᱹ\n• 🦺 ᱞᱟᱹᱠᱛᱤᱭᱟᱱ PPE ᱥᱩᱨᱠᱷᱟ ᱥᱟᱢᱟᱱ\n• 💨 ᱜᱮᱥ ᱞᱤᱠ ᱟᱨ ᱵᱟᱰᱤ ᱥᱤᱥᱴᱚᱢ\n• 🚪 ᱱᱤᱠᱟᱥ ᱰᱟᱦᱟᱨ ᱟᱨ ᱢᱟᱥᱴᱟᱨ ᱯᱚᱭᱮᱱᱴ\n• 📞 ᱟᱯᱟᱛᱠᱟᱞᱤᱱ ᱦᱮᱞᱯᱞᱟᱭᱤᱱ ᱱᱚᱢᱵᱚᱨ\n\nᱛᱮᱦᱮᱧ ᱟᱢᱟᱜ ᱪᱮᱫ ᱜᱚᱲᱚᱧ ᱮᱢ ᱫᱟᱲᱮᱭᱟᱜᱼᱟ?",
  },
  // ─── FIRE & EXPLOSION ───────────────────────────────────────
  {
    id: 'fire_extinguisher_types',
    module: MODULES.GLOBAL,
    keywords: ['extinguisher', 'fire extinguisher', 'अग्निशामक', 'type', 'use', 'how', 'kaise use kare', 'extinguisher ke type', 'pass rule', 'fire kaise bujhaye', 'aag kaise bujhaye', 'ᱥᱮᱸᱜᱮᱞ ᱤᱬᱤᱡᱤᱡ'],
    answer_en: 'There are 4 main fire extinguisher types:\n\n🔴 Water (Red) — for wood, paper, cloth. NEVER on electrical or chemical fires.\n⚫ CO₂ (Black) — for electrical fires and flammable liquids. Safe on electronics.\n🟤 Dry Powder (Blue) — versatile; works on most fires. Can damage equipment.\n🟡 Foam (Cream) — for flammable liquids. NOT for electrical fires.\n\nRemember PASS: Pull • Aim • Squeeze • Sweep',
    answer_hi: 'अग्निशामक के 4 मुख्य प्रकार हैं:\n\n🔴 पानी (लाल) — लकड़ी, कागज, कपड़े के लिए। बिजली या रसायन की आग पर कभी नहीं।\n⚫ CO₂ (काला) — बिजली की आग और ज्वलनशील तरल पदार्थों के लिए।\n🟤 सूखा पाउडर (नीला) — अधिकांश आगों पर काम करता है।\n🟡 फोम (क्रीम) — ज्वलनशील तरल के लिए।\n\nPASS याद रखें: खींचें • लक्ष्य करें • दबाएं • झाडू लगाएं',
    answer_hinglish: 'Fire extinguisher ke 4 main types hote hain:\n\n🔴 Water (Laal) — Lakdi, kagaz, kapde ke liye. Bijli ya chemical aag par KABHI NAHI dalein.\n⚫ CO₂ (Kaala) — Electrical fires aur flammable liquids ke liye. Machines ke liye safe hai.\n🟤 Dry Powder (Neela) — Har tarah ki aag par asardaar hai.\n🟡 Foam (Cream) — Flammable liquids (petrol/diesel) ke liye. Bijli ki aag par na dalein.\n\nPASS formula yaad rakhein: Pull (Pin kheenche) • Aim (Nishana lagaye) • Squeeze (Handle dabaye) • Sweep (Aage-peeche ghumaye).',
    answer_sat: 'ᱥᱮᱸᱜᱮᱞ ᱤᱬᱤᱡᱤᱡ (Extinguisher) ᱨᱮᱱᱟᱜ ᱔ ᱢᱩᱬ ᱞᱮᱠᱟᱱ:\n\n🔴 ᱫᱟᱜ (Water - ᱟᱨᱟᱜ) — ᱠᱟᱴ, ᱠᱟᱜᱚᱡᱽ, ᱞᱩᱜᱽᱲᱤ ᱞᱟᱹᱜᱤᱫ᱾ ᱵᱤᱡᱽᱞᱤ ᱟᱨ ᱠᱮᱢᱤᱠᱟᱞ ᱨᱮ ᱛᱤᱥ ᱦᱚᱸ ᱵᱟᱝ᱾\n⚫ CO₂ (ᱦᱮᱸᱫᱮ) — ᱵᱤᱡᱽᱞᱤ ᱟᱨ ᱥᱩᱱᱩᱢ ᱥᱮᱸᱜᱮᱞ ᱞᱟᱹᱜᱤᱫ᱾\n🟤 ᱨᱚᱦᱚᱲ ᱜᱩᱸᱰᱟᱹ (Dry Powder - ᱞᱤᱞ) — ᱡᱚᱛᱚ ᱞᱮᱠᱟᱱ ᱥᱮᱸᱜᱮᱞ ᱨᱮ ᱠᱟᱹᱢᱤᱭᱟ᱾\n🟡 ᱯᱷᱳᱢ (Foam - ᱥᱟᱥᱟᱝ) — ᱥᱩᱱᱩᱢ ᱥᱮᱸᱜᱮᱞ ᱞᱟᱹᱜᱤᱫ᱾\n\nPASS ᱱᱤᱭᱟᱹᱢ ᱫᱤᱥᱟᱹᱭ ᱢᱮ: Pull • Aim • Squeeze • Sweep',
  },
  {
    id: 'electrical_fire',
    module: MODULES.FIRE_EXPLOSION,
    keywords: ['electrical', 'electric', 'control panel', 'panel', 'co2', 'बिजली', 'विद्युत', 'bijli ki aag', 'current', 'short circuit', 'current lag gaya', 'ᱵᱤᱡᱽᱞᱤ ᱥᱮᱸᱜᱮᱞ'],
    answer_en: 'For electrical fires:\n✅ Use CO₂ (black) or Dry Powder extinguisher\n❌ NEVER use water — risk of electrocution\n\nFirst: Switch off the power supply if safe to do so. Alert others and activate the fire alarm. Do NOT approach without proper PPE.',
    answer_hi: 'बिजली की आग के लिए:\n✅ CO₂ (काला) या सूखा पाउडर अग्निशामक उपयोग करें\n❌ पानी का उपयोग कभी न करें — बिजली का झटका लग सकता है\n\nपहले: सुरक्षित होने पर बिजली बंद करें। अलार्म बजाएं। उचित PPE के बिना पास न जाएं।',
    answer_hinglish: 'Bijli (Electrical) ki aag ke liye:\n✅ CO₂ (Kaala) ya Dry Powder extinguisher use karein\n❌ Paani KABHI BHI NAHI dalein — current lagne ka khatra hota hai\n\nSabse pehle: Agar safe ho toh main power switch off karein. Alarm bajayein aur bina safety PPE ke paas na jayein.',
    answer_sat: 'ᱵᱤᱡᱽᱞᱤ ᱥᱮᱸᱜᱮᱞ ᱞᱟᱹᱜᱤᱫ:\n✅ CO₂ (ᱦᱮᱸᱫᱮ) ᱥᱮ ᱨᱚᱦᱚᱲ ᱜᱩᱸᱰᱟᱹ ᱵᱮᱵᱷᱟᱨ ᱢᱮ\n❌ ᱫᱟᱜ ᱛᱤᱥ ᱦᱚᱸ ᱟᱞᱚᱢ ᱫᱩᱞᱟ — ᱠᱟᱨᱮᱱᱴ ᱞᱟᱜᱟᱣ ᱫᱟᱲᱮᱭᱟᱜᱼᱟ\n\nᱯᱟᱹᱦᱤᱞ: ᱵᱤᱡᱽᱞᱤ ᱢᱩᱬ ᱥᱩᱭᱤᱪ ᱵᱚᱸᱫᱽ ᱢᱮ, ᱟᱞᱟᱨᱢ ᱪᱟᱹᱞᱩᱭ ᱢᱮ ᱟᱨ PPE ᱦᱚᱨᱚᱜ ᱠᱟᱛᱮ ᱥᱮᱱᱚᱜ ᱢᱮ᱾',
  },
  {
    id: 'fire_ppe',
    module: MODULES.FIRE_EXPLOSION,
    keywords: ['ppe', 'protective', 'equipment', 'wear', 'fire ppe', 'helmet', 'gloves', 'सुरक्षात्मक', 'उपकरण', 'PPE', 'ppe kit', 'kya pehne', 'helmet boots', 'gear', 'ᱥᱩᱨᱠᱷᱟ ᱥᱟᱢᱟᱱ'],
    answer_en: 'For fire emergencies, required PPE includes:\n🪖 Fire-rated safety helmet\n🧤 Heat-resistant gloves\n👁️ Safety goggles\n🦺 Flame-retardant high-visibility vest\n👢 Safety boots (steel-toed)\n\nAlways don PPE BEFORE approaching the hazard zone.',
    answer_hi: 'आग की आपातस्थिति के लिए आवश्यक PPE:\n🪖 फायर-रेटेड सेफ्टी हेलमेट\n🧤 हीट-प्रतिरोधी दस्ताने\n👁️ सेफ्टी चश्मे\n🦺 फ्लेम-रिटार्डेंट वेस्ट\n👢 सेफ्टी बूट्स\n\nहमेशा खतरे की जगह पहुंचने से पहले PPE पहनें।',
    answer_hinglish: 'Fire emergency ke liye zaroori PPE:\n🪖 Fire-rated safety helmet\n🧤 Heat-resistant (garmi se bachane wale) gloves\n👁️ Safety goggles (aankhon ki suraksha)\n🦺 Flame-retardant high-visibility vest\n👢 Steel-toed safety boots\n\nDhayan rahe: Khatre wali jagah par jaane se PEHLE pura PPE pehen lein.',
    answer_sat: 'ᱥᱮᱸᱜᱮᱞ ᱟᱯᱟᱛᱠᱟᱞ ᱞᱟᱹᱜᱤᱫ ᱞᱟᱹᱠᱛᱤᱭᱟᱱ PPE:\n🪖 ᱥᱮᱸᱜᱮᱞ ᱥᱩᱨᱠᱷᱤᱛ ᱦᱮᱞᱢᱮᱴ\n🧤 ᱞᱚᱞᱚ ᱴᱮᱠᱟᱣ ᱛᱤ-ᱢᱳᱡᱟ (Gloves)\n👁️ ᱥᱩᱨᱠᱷᱟ ᱪᱚᱥᱢᱟ (Goggles)\n🦺 ᱥᱮᱸᱜᱮᱞ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱵᱷᱮᱥᱴ\n👢 ᱥᱴᱤᱞ ᱴᱳ ᱥᱩᱨᱠᱷᱟ ᱡᱩᱛᱟᱹ\n\nᱵᱚᱛᱚᱨ ᱴᱷᱟᱶ ᱛᱮ ᱥᱮᱱᱚᱜ ᱞᱟᱦᱟᱨᱮ ᱱᱚᱶᱟ ᱡᱚᱛᱚ ᱦᱚᱨᱚᱜ ᱢᱮ᱾',
  },
  {
    id: 'fire_evacuation',
    module: MODULES.FIRE_EXPLOSION,
    keywords: ['evacuate', 'evacuation', 'exit', 'escape', 'leave', 'get out', 'निकास', 'खाली करें', 'bahar nikle', 'bhage', 'emergency exit', 'aag lagne par kya kare', 'ᱥᱮᱸᱜᱮᱞ ᱱᱤᱠᱟᱥ'],
    answer_en: 'Fire evacuation sequence:\n1. Activate the nearest fire alarm\n2. Don PPE if safe to do so\n3. Alert all personnel — use verbal warning\n4. Use the nearest marked fire exit (never elevators)\n5. Close doors behind you to slow fire spread\n6. Assemble at the designated Muster Point\n7. Await roll call — do NOT re-enter until cleared by authorities',
    answer_hi: 'अग्नि निकासी क्रम:\n1. नजदीकी फायर अलार्म सक्रिय करें\n2. सुरक्षित होने पर PPE पहनें\n3. सभी कर्मचारियों को सतर्क करें\n4. नजदीकी अग्नि निकास का उपयोग करें (लिफ्ट नहीं)\n5. आग की गति धीमी करने के लिए दरवाजे बंद करें\n6. निर्धारित मस्टर पॉइंट पर जाएं\n7. रोल कॉल तक प्रतीक्षा करें',
    answer_hinglish: 'Fire Evacuation (Bahar nikalne) ka sahi sequence:\n1. Nazdeeki fire alarm activate karein\n2. Agar safe ho toh PPE pehnein\n3. Sabhi saathiyon ko awaaz dekar alert karein\n4. Marked Fire Exit se bahar niklein (LIFT ka use kabhi na karein)\n5. Peeche ke darwaze band karte hue jayein taaki aag na faile\n6. Baahar tay shuda Muster Point par assemble ho jayein\n7. Attendance / Roll call tak wahan rukein.',
    answer_sat: 'ᱥᱮᱸᱜᱮᱞ ᱱᱤᱠᱟᱥ ᱨᱮᱭᱟᱜ ᱱᱤᱭᱟᱹᱢ:\n᱑. ᱥᱩᱨ ᱨᱮᱱᱟᱜ ᱯᱷᱟᱭᱟᱨ ᱟᱞᱟᱨᱢ ᱫᱟᱵᱟᱣ ᱢᱮ\n᱒. ᱥᱩᱨᱠᱷᱤᱛ ᱦᱩᱭ ᱞᱮᱱᱠᱷᱟᱱ PPE ᱦᱚᱨᱚᱜ ᱢᱮ\n᱓. ᱡᱚᱛᱚ ᱦᱚᱲ ᱠᱚ ᱦᱚᱦᱚ ᱠᱟᱛᱮ ᱵᱟᱰᱟᱭ ᱦᱚᱪᱚ ᱠᱚ ᱢᱮ\n᱔. ᱥᱮᱸᱜᱮᱞ ᱱᱤᱠᱟᱥ ᱰᱟᱦᱟᱨ ᱛᱮ ᱩᱰᱩᱠᱚᱜ ᱢᱮ (ᱞᱤᱯᱷᱴ ᱟᱞᱚᱢ ᱵᱮᱵᱷᱟᱨᱟ)\n᱕. ᱫᱩᱣᱟᱹᱨ ᱵᱚᱸᱫᱽ ᱠᱟᱛᱮ ᱪᱟᱞᱟᱜ ᱢᱮ ᱡᱮᱢᱚᱱ ᱥᱮᱸᱜᱮᱞ ᱵᱟᱝ ᱯᱟᱥᱱᱟᱣᱜ\n᱖. ᱢᱟᱥᱴᱟᱨ ᱯᱚᱭᱮᱱᱴ ᱨᱮ ᱡᱟᱨᱣᱟᱜ ᱢᱮ᱾',
  },
  {
    id: 'muster_point',
    module: MODULES.GLOBAL,
    keywords: ['muster', 'assembly', 'point', 'gather', 'meet', 'मस्टर', 'एकत्र', 'kahan jaye', 'muster point kya hai', 'assembly point', 'safe place', 'ᱢᱟᱥᱴᱟᱨ ᱯᱚᱭᱮᱱᱴ'],
    answer_en: 'The Muster Point is the pre-designated safe area where all personnel must assemble during an emergency. Features:\n• Located at a safe distance from the facility\n• Clearly marked with signage\n• Has a roll-call register\n\nDo NOT leave the muster point until officially cleared by the Safety Officer.',
    answer_hi: 'मस्टर पॉइंट वह पूर्व-निर्धारित सुरक्षित क्षेत्र है जहाँ आपातकाल में सभी कर्मचारियों को एकत्र होना होता है। सुरक्षा अधिकारी की अनुमति के बिना यहाँ से न जाएं।',
    answer_hinglish: 'Muster Point ek pehle se tay safe open area hota hai jahan aag ya gas leak ke waqt sabhi workers ikattha hote hain.\n• Ye plant/building se surakshit doori par hota hai\n• Yahan roll-call (haziri) hoti hai taaki pata chale koi andar toh nahi chhoota\n• Safety Officer ki permission ke bina yahan se na jayein.',
    answer_sat: 'ᱢᱟᱥᱴᱟᱨ ᱯᱚᱭᱮᱱᱴ (Muster Point) ᱫᱚ ᱢᱤᱫ ᱥᱩᱨᱠᱷᱤᱛ ᱯᱷᱟᱸᱠᱟ ᱴᱷᱟᱶ ᱠᱟᱱᱟ ᱡᱟᱦᱟᱸᱨᱮ ᱟᱯᱟᱛᱠᱟᱞ ᱚᱠᱛᱚ ᱡᱚᱛᱚ ᱦᱚᱲ ᱠᱚ ᱡᱟᱨᱣᱟᱜᱼᱟ᱾ ᱥᱩᱨᱠᱷᱟ ᱚᱯᱷᱤᱥᱟᱨᱟᱜ ᱦᱩᱠᱩᱢ ᱵᱮᱜᱚᱨ ᱚᱸᱰᱮ ᱠᱷᱚᱱ ᱟᱞᱚᱢ ᱥᱮᱱᱚᱜᱼᱟ᱾',
  },
  // ─── GAS LEAK ────────────────────────────────────────────────
  {
    id: 'gas_leak_detection',
    module: MODULES.GAS_LEAK,
    keywords: ['gas', 'leak', 'smell', 'detect', 'identify', 'गैस', 'रिसाव', 'पहचान', 'cylinder leak', 'gas badbu', 'gas smell', 'gas leak hone par', 'hissing', 'ᱜᱮᱥ ᱞᱤᱠ'],
    answer_en: 'Gas leak detection signs:\n\n👃 Unusual smell (rotten eggs for H₂S, chemical odor for other gases)\n👁️ Visible cloud, haze, or discoloration\n🔊 Hissing or whistling sound from pipes\n🌡️ Frost or condensation around fittings\n\nImmediate actions:\n1. Do NOT ignite any flame or spark\n2. Alert all personnel\n3. Activate the emergency alarm\n4. Don gas mask / SCBA before approaching',
    answer_hi: 'गैस रिसाव के संकेत:\n\n👃 असामान्य गंध (H₂S के लिए सड़े अंडे जैसी)\n👁️ दृश्यमान बादल या धुंध\n🔊 पाइप से सीटी या फुसफुसाहट की आवाज़\n\nतत्काल कार्रवाई:\n1. कोई ज्वाला या चिंगारी न जलाएं\n2. सभी को सतर्क करें\n3. आपातकालीन अलार्म बजाएं\n4. गैस मास्क/SCBA पहनकर ही पास जाएं',
    answer_hinglish: 'Gas Leak pehchaanne ke mukhya sanket:\n👃 Ajeeb badbu (jaise H₂S ke liye sade hue ande jaisi smell)\n👁️ Hawa mein dhundh, badal ya discoloration dikhna\n🔊 Pipes ya valves se hissing ya seeti jaisi awaaz aana\n🌡️ Joints ke paas barf ya thanda jamna\n\nTurant kya karein:\n1. Koi aag, lighter ya electrical switch on/off na karein\n2. Emergency siren bajayein aur sabhi ko alert karein\n3. Gas Mask ya SCBA pehankar hawa ke viprit disha (upwind) mein bahar niklein.',
    answer_sat: 'ᱜᱮᱥ ᱞᱤᱠ ᱪᱤᱱᱦᱟᱹᱣ ᱨᱮᱱᱟᱜ ᱪᱤᱱᱦᱟᱹ:\n👃 ᱵᱟᱹᱲᱤᱡ ᱥᱚ (ᱥᱮᱭᱟ ᱵᱤᱞᱤ ᱞᱮᱠᱟᱱ ᱥᱚ)\n👁️ ᱦᱚᱭ ᱨᱮ ᱠᱩᱦᱲᱟᱹ ᱥᱮ ᱫᱷᱩᱸᱣᱟᱹ ᱧᱮᱞᱚᱜ\n🔊 ᱯᱟᱭᱤᱯ ᱠᱷᱚᱱ ᱥᱩᱸ-ᱥᱩᱸ ᱥᱟᱰᱮ ᱦᱤᱡᱩᱜ\n\nᱞᱚᱜᱚᱱ ᱠᱟᱹᱢᱤ:\n᱑. ᱥᱮᱸᱜᱮᱞ ᱥᱮ ᱥᱩᱭᱤᱪ ᱟᱞᱚᱢ ᱡᱩᱞᱟ\n᱒. ᱟᱞᱟᱨᱢ ᱪᱟᱹᱞᱩᱭ ᱢᱮ ᱟᱨ ᱡᱚᱛᱚ ᱦᱚᱲ ᱵᱟᱰᱟᱭ ᱦᱚᱪᱚ ᱠᱚ ᱢᱮ\n᱓. ᱜᱮᱥ ᱢᱟᱥᱠ ᱦᱚᱨᱚᱜ ᱠᱟᱛᱮ ᱦᱚᱭ ᱩᱞᱴᱟᱹ ᱥᱮᱫ ᱩᱰᱩᱠᱚᱜ ᱢᱮ᱾',
  },
  {
    id: 'buddy_system',
    module: MODULES.GAS_LEAK,
    keywords: ['buddy', 'confined', 'space', 'alone', 'partner', 'system', 'बडी', 'साथी', 'buddy system', 'saathi', 'akele kaam', 'partner system', 'ᱵᱟᱰᱤ ᱥᱤᱥᱴᱚᱢ'],
    answer_en: 'The Buddy System is mandatory for confined space entry and gas leak response:\n\n✅ Never enter a gas-affected area alone\n✅ One person enters — one stands outside as Safety Watch\n✅ Maintain visual or voice contact at all times\n✅ Safety Watch must have communication to call for help\n✅ Pre-agree on distress signals\n\nIf your buddy becomes incapacitated — do NOT enter alone. Call for rescue team immediately.',
    answer_hi: 'बडी सिस्टम सीमित स्थान प्रवेश और गैस रिसाव के लिए अनिवार्य है:\n\n✅ गैस प्रभावित क्षेत्र में अकेले कभी न जाएं\n✅ एक व्यक्ति अंदर जाता है — एक बाहर सेफ्टी वॉच के रूप में\n✅ हमेशा दृश्य या आवाज़ संपर्क बनाए रखें\n\nयदि आपका साथी अक्षम हो जाए — अकेले अंदर न जाएं। तुरंत बचाव दल को बुलाएं।',
    answer_hinglish: 'Buddy System confined space aur gas response ke liye anivarya (mandatory) hai:\n\n✅ Gas wale area mein kabhi bhi akele na jayein\n✅ Ek worker andar kaam karta hai — aur dusra bahar Safety Watch bankar khada rehta hai\n✅ Hamesha visual ya bolkar communication banaye rakhein\n✅ Agar aapka partner behosh ya asahaj ho jaye, toh akele andar koodne ki galti na karein — turant rescue team ko bulayein.',
    answer_sat: 'ᱵᱟᱰᱤ ᱥᱤᱥᱴᱚᱢ (Buddy System) ᱫᱚ ᱵᱟᱨ ᱦᱚᱲ ᱢᱮᱥᱟ ᱠᱟᱛᱮ ᱠᱟᱹᱢᱤ ᱨᱮᱭᱟᱜ ᱱᱤᱭᱟᱹᱢ ᱠᱟᱱᱟ:\n✅ ᱜᱮᱥ ᱴᱷᱟᱶ ᱨᱮ ᱛᱤᱥ ᱦᱚᱸ ᱮᱠᱞᱟ ᱟᱞᱚᱢ ᱵᱚᱞᱚᱱᱟ\n✅ ᱢᱤᱫ ᱦᱚᱲ ᱵᱷᱤᱛᱨᱤ ᱨᱮ ᱠᱟᱹᱢᱤᱭᱟ — ᱢᱤᱫ ᱦᱚᱲ ᱵᱟᱦᱨᱮ ᱨᱮ ᱧᱮᱧᱮᱞᱤᱡ ᱛᱟᱦᱮᱸᱱᱟ\n✅ ᱡᱩᱫᱤ ᱜᱟᱛᱮ ᱦᱚᱲ ᱠᱤᱪᱷᱩ ᱦᱩᱭᱩᱜ ᱛᱟᱭᱟ — ᱮᱠᱞᱟ ᱟᱞᱚᱢ ᱵᱚᱞᱚᱱᱟ, ᱵᱟᱧᱪᱟᱣ ᱫᱚᱞ ᱦᱚᱦᱚᱣᱟᱠᱚ ᱢᱮ᱾',
  },
  {
    id: 'gas_ppe',
    module: MODULES.GAS_LEAK,
    keywords: ['mask', 'scba', 'breathing', 'respirator', 'मास्क', 'श्वसन', 'gas mask', 'oxygen mask', 'scba kya hai', 'gas ppe', 'respirator mask', 'ᱜᱮᱥ ᱢᱟᱥᱠ'],
    answer_en: 'PPE for gas leak response:\n\n🎭 Gas mask (appropriate for identified gas type) OR SCBA (Self-Contained Breathing Apparatus) for unknown gas\n🥽 Chemical splash goggles\n🧤 Chemical-resistant gloves\n👔 Coveralls (chemical resistant if needed)\n👢 Safety boots\n\nNever use a standard dust mask — it provides NO protection against toxic gases.',
    answer_hi: 'गैस रिसाव के लिए PPE:\n\n🎭 गैस मास्क (पहचाने गए गैस प्रकार के लिए) या SCBA (अज्ञात गैस के लिए)\n🥽 रासायनिक चश्मे\n🧤 रासायनिक-प्रतिरोधी दस्ताने\n\nसाधारण धूल मास्क का उपयोग न करें — यह जहरीली गैस से कोई सुरक्षा नहीं देता।',
    answer_hinglish: 'Gas Leak ke liye zaroori PPE:\n🎭 Gas Mask (gas ke filter ke saath) ya SCBA (Self-Contained Breathing Apparatus)\n🥽 Chemical splash safety goggles\n🧤 Chemical-resistant gloves (neoprene/nitrile)\n👔 Chemical-resistant coverall suit\n👢 Chemical safety boots\n\nYaad rakhein: Normal kapde ka mask toxic gas mein bilkul kaam nahi karta.',
    answer_sat: 'ᱜᱮᱥ ᱞᱤᱠ ᱞᱟᱹᱜᱤᱫ ᱞᱟᱹᱠᱛᱤᱭᱟᱱ PPE:\n🎭 ᱜᱮᱥ ᱢᱟᱥᱠ (Gas Mask) ᱥᱮ SCBA ᱥᱟᱶᱛᱮ ᱥᱟᱦᱮᱫ ᱦᱟᱛᱟᱣ ᱡᱚᱱᱛᱨᱚ\n🥽 ᱠᱮᱢᱤᱠᱟᱞ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱪᱚᱥᱢᱟ\n🧤 ᱠᱮᱢᱤᱠᱟᱞ ᱴᱮᱠᱟᱣ ᱛᱤ-ᱢᱳᱡᱟ\n👢 ᱥᱩᱨᱠᱷᱟ ᱡᱩᱛᱟᱹ\n\nᱥᱟᱫᱷᱟᱨᱚᱱ ᱫᱷᱩᱲᱤ ᱢᱟᱥᱠ ᱡᱮᱦᱮᱨ ᱜᱮᱥ ᱠᱷᱚᱱ ᱵᱟᱭ ᱵᱟᱧᱪᱟᱣᱟ᱾',
  },
  // ─── GENERAL SAFETY ──────────────────────────────────────────
  {
    id: 'emergency_number',
    module: MODULES.GLOBAL,
    keywords: ['emergency', 'number', 'call', 'help', 'contact', 'ambulance', 'नंबर', 'आपातकाल', 'मदद', 'phone number', 'fire brigade number', 'police number', 'helpline', '112', '101', '108', 'ᱟᱯᱟᱛᱠᱟᱞᱤᱱ ᱱᱚᱢᱵᱚᱨ'],
    answer_en: 'Emergency contact numbers in India:\n\n🚒 Fire: 101\n🚑 Ambulance: 108 (National Health Helpline)\n👮 Police: 100\n🆘 National Emergency: 112\n\nAlways know your site-specific emergency contacts. Post them at all workstations.',
    answer_hi: 'भारत में आपातकालीन नंबर:\n\n🚒 अग्निशमन: 101\n🚑 एम्बुलेंस: 108\n👮 पुलिस: 100\n🆘 राष्ट्रीय आपातकाल: 112\n\nअपने साइट के विशिष्ट आपातकालीन नंबर भी जानें।',
    answer_hinglish: 'Bharat ke mukhya Emergency Helpline Numbers:\n🚒 Fire Brigade: 101\n🚑 Ambulance: 108 (Health Helpline)\n👮 Police: 100\n🆘 National Emergency Number: 112\n\nApne plant/site ke safety officer aur control room ka local number workstation par hamesha note karke rakhein.',
    answer_sat: 'ᱵᱷᱟᱨᱚᱛ ᱨᱮᱱᱟᱜ ᱟᱯᱟᱛᱠᱟᱞᱤᱱ ᱱᱚᱢᱵᱚᱨ ᱠᱚ:\n🚒 ᱥᱮᱸᱜᱮᱞ ᱤᱬᱤᱡ (Fire): ᱑᱐᱑\n🚑 ᱨᱩᱜᱤ ᱜᱟᱹᱰᱤ (Ambulance): ᱑᱐᱘\n👮 ᱯᱩᱞᱤᱥ (Police): ᱑᱐᱐\n🆘 ᱡᱟᱹᱛᱤᱭᱟᱹᱨᱤ ᱟᱯᱟᱛᱠᱟᱞ: ᱑᱑᱒\n\nᱟᱢᱟᱜ ᱠᱟᱹᱢᱤ ᱴᱷᱟᱶ ᱨᱮᱱᱟᱜ ᱥᱩᱨᱠᱷᱟ ᱚᱯᱷᱤᱥᱟᱨ ᱱᱚᱢᱵᱚᱨ ᱦᱚᱸ ᱫᱤᱥᱟᱹᱭ ᱢᱮ᱾',
  },
  {
    id: 'first_aid',
    module: MODULES.GLOBAL,
    keywords: ['first aid', 'injured', 'hurt', 'burn', 'wound', 'प्राथमिक', 'चोट', 'जलन', 'jal gaya', 'chot lag gayi', 'jalne par kya lagaye', 'treatment', 'medical', 'ᱯᱟᱹᱦᱤᱞ ᱨᱟᱱ'],
    answer_en: 'Basic first aid principles (RICE for injuries):\n\nFor burns:\n• Cool with running water for 10+ minutes\n• Do NOT use ice, butter, or toothpaste\n• Cover with clean, non-fluffy material\n• Seek medical attention for any significant burn\n\nFor chemical contact:\n• Flush with large amounts of water immediately (20+ min for eyes)\n• Remove contaminated clothing\n• Seek immediate medical attention\n\nAlways alert your supervisor and record the incident.',
    answer_hi: 'प्राथमिक उपचार के सिद्धांत:\n\nजलने पर:\n• 10+ मिनट के लिए बहते पानी से ठंडा करें\n• बर्फ, मक्खन या टूथपेस्ट का उपयोग न करें\n• साफ कपड़े से ढकें\n• डॉक्टर से मिलें\n\nरासायनिक संपर्क पर:\n• तुरंत बड़ी मात्रा में पानी से धोएं\n• दूषित कपड़े हटाएं\n• तुरंत चिकित्सा सहायता लें',
    answer_hinglish: 'Emergency First Aid ke niyam:\n\nJalne (Burns) par:\n• Kam se kam 10 minute tak saaf behte thande paani se dhowein\n• Barf, tel, ghee ya toothpaste KABHI NAHI lagayein\n• Saaf kapde se dhakein aur turant doctor ko dikhayein\n\nChemical contact par:\n• Turant 20 minute tak paani se dhowein\n• Dushit kapde turant utaar dein\n• Turant medical room jayein.',
    answer_sat: 'ᱯᱟᱹᱦᱤᱞ ᱨᱟᱱ (First Aid) ᱨᱮᱱᱟᱜ ᱱᱤᱭᱟᱹᱢ:\n\nᱞᱚ ᱞᱮᱱᱠᱷᱟᱱ (Burns):\n• ᱑᱐ ᱢᱤᱱᱤᱴ ᱫᱷᱟᱹᱵᱤᱡ ᱞᱤᱸᱜᱤᱱ ᱨᱮᱭᱟᱲ ᱫᱟᱜ ᱛᱮ ᱟᱹᱨᱩᱵ ᱢᱮ\n• ᱵᱚᱨᱚᱯᱷ, ᱛᱩᱲᱤ ᱥᱩᱱᱩᱢ ᱥᱮ ᱴᱩᱛᱷᱯᱮᱥᱴ ᱛᱤᱥ ᱦᱚᱸ ᱟᱞᱚᱢ ᱞᱟᱜᱟᱣᱟ\n• ᱥᱟᱯᱷᱟ ᱞᱩᱜᱽᱲᱤ ᱛᱮ ᱯᱚᱴᱚᱢ ᱠᱟᱛᱮ ᱰᱟᱠᱛᱚᱨ ᱴᱷᱮᱱ ᱤᱫᱤᱭ ᱢᱮ᱾\n\nᱠᱮᱢᱤᱠᱟᱞ ᱡᱚᱴᱮᱫ ᱞᱮᱱᱠᱷᱟᱱ:\n• ᱒᱐ ᱢᱤᱱᱤᱴ ᱫᱷᱟᱹᱵᱤᱡ ᱫᱟᱜ ᱛᱮ ᱟᱹᱨᱩᱵ ᱢᱮ ᱟᱨ ᱞᱚᱜᱚᱱ ᱨᱟᱱ ᱚᱲᱟᱜ ᱤᱫᱤᱭ ᱢᱮ᱾',
  },
  {
    id: 'hazard_identification',
    module: MODULES.GLOBAL,
    keywords: ['hazard', 'risk', 'identify', 'danger', 'sign', 'symbol', 'खतरा', 'जोखिम', 'पहचान', 'safety sign', 'warning sign', 'symbol ka matlab', 'yellow triangle', 'khatre ka nishan', 'ᱵᱚᱛᱚᱨ ᱪᱤᱱᱦᱟᱹ'],
    answer_en: 'Hazard identification — look for these warning signs:\n\n🟡 Yellow triangle — Warning/Caution\n🔴 Red circle with line — Prohibition (forbidden action)\n🔵 Blue circle — Mandatory action (must do)\n🟢 Green square — Safe condition or First Aid\n\nAlways report unidentified hazards to your supervisor. Use the site hazard log.',
    answer_hi: 'खतरे की पहचान — इन चेतावनी संकेतों पर ध्यान दें:\n\n🟡 पीला त्रिकोण — चेतावनी/सावधानी\n🔴 लाल वृत्त — निषेध\n🔵 नीला वृत्त — अनिवार्य कार्य\n🟢 हरा वर्ग — सुरक्षित स्थिति या प्राथमिक चिकित्सा\n\nअज्ञात खतरों की सूचना अपने सुपरवाइज़र को दें।',
    answer_hinglish: 'Industrial Safety Signs ki pehchaan:\n🟡 Peela Triangle — Warning/Caution (Savdhani bartein)\n🔴 Laal Circle (Cross ke saath) — Prohibition (Ye karna mana hai)\n🔵 Neela Circle — Mandatory Action (Ye karna zaroori hai, jaise PPE pehanna)\n🟢 Hara Square — Safe Condition ya First Aid\n\nKoi bhi khatra dikhne par turant supervisor ko inform karein.',
    answer_sat: 'ᱠᱟᱹᱨᱜᱟᱲ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱪᱤᱱᱦᱟᱹ ᱠᱚ:\n🟡 ᱥᱟᱥᱟᱝ ᱛᱮᱠᱳᱬ — ᱦᱩᱥᱤᱭᱟᱹᱨ / ᱵᱚᱛᱚᱨ\n🔴 ᱟᱨᱟᱜ ᱜᱩᱞᱟᱹᱭ — ᱢᱟᱱᱟ ᱜᱮᱭᱟ (Prohibited)\n🔵 ᱞᱤᱞ ᱜᱩᱞᱟᱹᱭ — ᱞᱟᱹᱠᱛᱤᱭᱟᱱ ᱠᱟᱹᱢᱤ (Mandatory PPE)\n🟢 ᱦᱟᱹᱨᱭᱟᱹᱲ ᱪᱟᱹᱣᱠᱟᱹ — ᱥᱩᱨᱠᱷᱤᱛ ᱴᱷᱟᱶ / ᱯᱟᱹᱦᱤᱞ ᱨᱟᱱ\n\nᱡᱟᱦᱟᱸᱱ ᱵᱚᱛᱚᱨ ᱧᱮᱞ ᱞᱮᱠᱷᱟᱱ ᱥᱩᱯᱚᱨᱵᱷᱟᱭᱤᱡᱚᱨ ᱞᱟᱹᱭᱟᱭ ᱢᱮ᱾',
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

  const ans = (
    (lang === 'sat' && best.entry.answer_sat) ||
    (lang === 'hinglish' && best.entry.answer_hinglish) ||
    (lang === 'hi' && best.entry.answer_hi) ||
    best.entry.answer_en
  ) ?? (SAFE_FALLBACK[lang] ?? SAFE_FALLBACK.en)

  const sourceByLang = {
    en: 'National Industrial Safety Protocol',
    hi: 'राष्ट्रीय औद्योगिक सुरक्षा प्रोटोकॉल',
    hinglish: 'National Industrial Safety Protocol',
    sat: 'ᱡᱟᱹᱛᱤᱭᱟᱹᱨᱤ ᱠᱟᱹᱨᱜᱟᱲ ᱥᱩᱨᱠᱷᱟ ᱯᱨᱳᱴᱳᱠᱳᱞ',
  }

  return {
    answer: ans,
    source: sourceByLang[lang] ?? 'National Industrial Safety Protocol',
    confidence: Math.min(1.0, 0.7 + best.score * 0.05),
  }
}

/** Get suggested questions for a module */
export function getSuggestedQuestions(module, lang = 'en') {
  const questions = {
    FIRE_EXPLOSION: {
      en: ['How do I use a fire extinguisher?', 'What PPE should I wear during a fire?', 'What is the fire evacuation sequence?', 'Which extinguisher for electrical fire?'],
      hi: ['अग्निशामक का उपयोग कैसे करें?', 'आग के दौरान कौन सा PPE पहनें?', 'अग्नि निकासी क्रम क्या है?', 'बिजली की आग के लिए कौन सा अग्निशामक?'],
      hinglish: ['Fire extinguisher kaise use karein?', 'Fire ke waqt kaunsa PPE pehnein?', 'Fire evacuation sequence kya hai?', 'Bijli ki aag ke liye kaunsa extinguisher?'],
      sat: ['ᱥᱮᱸᱜᱮᱞ ᱤᱬᱤᱡᱤᱡ ᱪᱮᱫ ᱞᱮᱠᱟ ᱵᱮᱵᱷᱟᱨᱟ?', 'ᱥᱮᱸᱜᱮᱞ ᱚᱠᱛᱚ ᱪᱮᱫ PPE ᱦᱚᱨᱚᱜ ᱞᱟᱹᱠᱛᱤ?', 'ᱥᱮᱸᱜᱮᱞ ᱱᱤᱠᱟᱥ ᱫᱷᱟᱯ ᱪᱮᱫ?', 'ᱵᱤᱡᱽᱞᱤ ᱥᱮᱸᱜᱮᱞ ᱞᱟᱹᱜᱤᱫ ᱚᱠᱟ ᱤᱬᱤᱡᱤᱡ?'],
    },
    GAS_LEAK: {
      en: ['How do I detect a gas leak?', 'What is the buddy system?', 'What PPE for gas leak?', 'What are gas emergency steps?'],
      hi: ['गैस रिसाव कैसे पहचानें?', 'बडी सिस्टम क्या है?', 'गैस रिसाव के लिए कौन सा PPE?', 'गैस आपातकाल के कदम क्या हैं?'],
      hinglish: ['Gas leak kaise detect karein?', 'Buddy system kya hai?', 'Gas leak ke liye kaunsa PPE?', 'Gas emergency mein kya karein?'],
      sat: ['ᱜᱮᱥ ᱞᱤᱠ ᱪᱮᱫ ᱞᱮᱠᱟ ᱪᱤᱱᱦᱟᱹᱣᱟ?', 'ᱵᱟᱰᱤ ᱥᱤᱥᱴᱚᱢ ᱫᱚ ᱪᱮᱫ?', 'ᱜᱮᱥ ᱞᱤᱠ ᱞᱟᱹᱜᱤᱫ ᱪᱮᱫ PPE?', 'ᱜᱮᱥ ᱟᱯᱟᱛᱠᱟᱞ ᱫᱷᱟᱯ ᱠᱚ ᱪᱮᱫ?'],
    },
    GLOBAL: {
      en: ['What are emergency numbers?', 'How to identify a hazard?', 'What is first aid for burns?', 'Where is the muster point?'],
      hi: ['आपातकालीन नंबर क्या हैं?', 'खतरे की पहचान कैसे करें?', 'जलने पर प्राथमिक उपचार?', 'मस्टर पॉइंट कहाँ है?'],
      hinglish: ['Emergency helpline numbers kya hain?', 'Safety signs kaise pehchanein?', 'Jalne par first aid kya hai?', 'Muster point kahan hai?'],
      sat: ['ᱟᱯᱟᱛᱠᱟᱞᱤᱱ ᱱᱚᱢᱵᱚᱨ ᱠᱚ ᱪᱮᱫ?', 'ᱵᱚᱛᱚᱨ ᱪᱮᱫ ᱞᱮᱠᱟ ᱪᱤᱱᱦᱟᱹᱣᱟ?', 'ᱞᱚ ᱞᱮᱱᱠᱷᱟᱱ ᱯᱟᱹᱦᱤᱞ ᱨᱟᱱ?', 'ᱢᱟᱥᱴᱟᱨ ᱯᱚᱭᱮᱱᱴ ᱫᱚ ᱚᱠᱟᱨᱮ?'],
    },
  }
  const moduleQuestions = questions[module] ?? questions.GLOBAL
  return moduleQuestions[lang] ?? moduleQuestions.en
}
