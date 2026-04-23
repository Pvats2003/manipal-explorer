export interface GuideTip {
  id: string;
  title: string;
  body: string;
  emoji: string;
}
export interface GuideCategory {
  id: string;
  label: string;
  icon: string;
  tips: GuideTip[];
}

export const GUIDE: GuideCategory[] = [
  {
    id: "transport",
    label: "Getting Around",
    icon: "🛵",
    tips: [
      { id: "t1", emoji: "🚌", title: "KSRTC bus to Udupi", body: "Bus 5/5A from Tiger Circle to Udupi every 10 min. ₹15. Stops at Service Bus Stand — walk to Diana for breakfast." },
      { id: "t2", emoji: "🛺", title: "Rapido is your best friend", body: "Bike rides cheaper than autos. Manipal → Malpe ~₹120. Manipal → Udupi ₹40-60. Always book on app, never street." },
      { id: "t3", emoji: "🏍️", title: "Renting a scooter", body: "Royal Bike Rentals or Wheelstreet — ~₹300/day. Need DL + ID. Fill petrol at HP near KMC." },
      { id: "t4", emoji: "🚆", title: "Udupi railway station", body: "10 min from campus by auto. Mangalore Express, Matsyagandha to Goa. Book on IRCTC 60 days ahead." },
    ],
  },
  {
    id: "food",
    label: "Food & Cafes",
    icon: "🍽️",
    tips: [
      { id: "f1", emoji: "🥞", title: "Mitra Samaj for breakfast", body: "Car Street, Udupi. Open 7 AM. Order: Goli baje, Mangalore bun, filter coffee. Under ₹150 for full breakfast." },
      { id: "f2", emoji: "☕", title: "Hangyo Cafe", body: "Late-night hangout near campus. Cold coffee + maggi combo ₹150. Open till 1 AM most nights." },
      { id: "f3", emoji: "🍕", title: "19th Hole / Eat Street", body: "Group dinner spots. 19th Hole has the best pizza. Eat Street rooftop for vibes." },
      { id: "f4", emoji: "🍜", title: "Hadiqa for dates", body: "Chill ambience, decent pasta + shakes. Slightly pricier (₹400-600 for two). Reserve weekend evenings." },
    ],
  },
  {
    id: "money",
    label: "Money & Hacks",
    icon: "💰",
    tips: [
      { id: "m1", emoji: "🏦", title: "ATMs that work", body: "SBI inside campus, Canara near Tiger Circle, Axis at End Point. Avoid sketchy ones near KC." },
      { id: "m2", emoji: "💳", title: "UPI everywhere", body: "Even chai-walas accept Paytm/PhonePe. Cash mostly for KSRTC bus + small shops." },
      { id: "m3", emoji: "🎟️", title: "Student discounts", body: "Show MIT ID at Forum Fiza Mall (PVR), some Udupi temples, museum entries. Always ask." },
      { id: "m4", emoji: "🏪", title: "Cheapest groceries", body: "MORE supermarket at End Point. Reliance Smart in Udupi. Tiger Circle for snacks/maggi." },
    ],
  },
  {
    id: "safety",
    label: "Safety & Health",
    icon: "🩺",
    tips: [
      { id: "s1", emoji: "🏥", title: "Kasturba Hospital (KMC)", body: "On-campus, 24/7 emergency. Free for MIT students with ID. Ambulance: 0820-2922200." },
      { id: "s2", emoji: "💊", title: "Medplus near KC", body: "24-hour pharmacy. Keep ORS, Paracetamol, Crocin, Avomine (for bus rides) stocked." },
      { id: "s3", emoji: "🌊", title: "Beach safety", body: "Malpe & Kapu have lifeguards till 6 PM. NEVER swim at Hoode or Padubidri after dark — strong currents." },
      { id: "s4", emoji: "📞", title: "Save these numbers", body: "Campus security: 0820-2925757. Police: 100. Women's helpline: 1091. MIT Wellness: 0820-2924001." },
    ],
  },
  {
    id: "fun",
    label: "Things To Try",
    icon: "✨",
    tips: [
      { id: "x1", emoji: "🌅", title: "Sunrise at End Point", body: "Wake up at 5:45 AM, walk 15 min, watch fog lift off the valley. Free, life-changing." },
      { id: "x2", emoji: "🎉", title: "Revels & TechTatva", body: "MIT's flagship fests in Feb & Oct. Apply for organising committees in 1st year — best way to meet seniors." },
      { id: "x3", emoji: "🛕", title: "Krishna Mutt at 4:30 AM", body: "Nirmalya darshana — most peaceful temple experience. Free prasadam (Udupi sambar!) after." },
      { id: "x4", emoji: "🚣", title: "Kayaking at Suvarna river", body: "₹500/hour at Malpe. Best at sunset. Group of 4 is perfect." },
    ],
  },
];