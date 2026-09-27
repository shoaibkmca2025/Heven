/* ==========================================================
   HAVEN — EDITABLE CONTENT & SETTINGS
   Everything a non-developer is likely to change lives here.
   ========================================================== */
window.HAVEN_CONFIG = {
  brand: {
    wordmark: "Haven",                 // replace with the client logo when supplied
    tagline: "Gifts & Hampers",
    credit: "Website concept by 4AM Global Media"
  },
  contact: {
    instagram: "https://www.instagram.com/havengiftsandhampers/",
    instagramHandle: "@havengiftsandhampers",
    addressLines: ["E-3/62, Sector 16, Rohini", "Near Garhwal Grills"],
    addressNote: "Address from Haven’s public profile · to be confirmed before launch.",
    mapQuery: "E-3/62, Sector 16, Rohini, near Garhwal Grills, Delhi",
    whatsappNumber: ""                 // leave empty until a verified number is supplied (digits only, with country code)
  },
  occasions: ["Birthday", "Anniversary", "Festive", "Wedding", "Welcome", "Thank You"],
  occasionBlurbs: {
    Birthday: "Blush, bright and a little bit playful.",
    Anniversary: "Deeper tones for your favourite person.",
    Festive: "Coordinated hampers for the whole list.",
    Wedding: "Favours that match the day.",
    Welcome: "Light, airy gifts for new beginnings.",
    "Thank You": "A considered way to show appreciation."
  },
  bulkOccasions: ["Birthday", "Anniversary", "Festive", "Wedding", "Welcome", "Thank You", "Corporate thank-you", "Other"],
  /* Illustrative builder contents. Not verified inventory. */
  contents: [
    { id: "candle",     name: "Scented candle",        note: "Soft, slow evenings" },
    { id: "mug",        name: "Ceramic mug",           note: "An everyday keepsake" },
    { id: "chocolates", name: "Artisan chocolates",    note: "A small indulgence" },
    { id: "tea",        name: "Tea selection",         note: "For quiet mornings" },
    { id: "dryfruits",  name: "Dry fruit jar",         note: "A festive classic" },
    { id: "notebook",   name: "Notebook & pen",        note: "For the desk" },
    { id: "flowers",    name: "Dried flower posy",     note: "Lasts beyond the day" },
    { id: "diffuser",   name: "Reed diffuser",         note: "Fragrance for home" }
  ],
  packaging: [
    { id: "ivory",    name: "Ivory",    hex: "#F4EDE2" },
    { id: "blush",    name: "Blush",    hex: "#EBCFC6" },
    { id: "burgundy", name: "Burgundy", hex: "#6A2A3B" },
    { id: "ink",      name: "Charcoal", hex: "#3A3132" }
  ],
  ribbons: [
    { id: "burgundy",  name: "Burgundy",  hex: "#5B2333" },
    { id: "rose",      name: "Dusty rose",hex: "#C98F93" },
    { id: "champagne", name: "Champagne", hex: "#B89A67" },
    { id: "sage",      name: "Sage",      hex: "#5F7563" },
    { id: "ink",       name: "Ink",       hex: "#2E2526" }
  ],
  messageSamples: [
    "Happy birthday! Here’s to your best year yet.",
    "Every year with you is my favourite one.",
    "Thank you for everything. This is just a small hello from us.",
    "Welcome home. We are so glad you’re here."
  ],
  /* Six concept collections. Replace with Haven’s real collections, images and contents. */
  collections: [
    { id: "blush-celebration", name: "The Blush Celebration", occasions: ["Birthday", "Thank You"],
      desc: "Blush tissue, a candle for the evening and a keepsake mug, finished with a handwritten card.",
      contents: ["Scented candle", "Ceramic mug", "Artisan chocolates", "Message card"],
      art: { img: "img/open.webp", alt: "Open ivory box with a candle and mug in blush tissue" } },
    { id: "burgundy-evening", name: "Burgundy Evening", occasions: ["Anniversary", "Wedding"],
      desc: "A richer, more intimate hamper in deep burgundy with room for a longer message.",
      contents: ["Scented candle", "Pair of flutes (concept)", "Chocolates", "Rose petals", "Message card"],
      art: { img: "img/anniv.webp", alt: "Gift box beside crystal flutes and roses on a burgundy table" } },
    { id: "festive-glow", name: "Festive Glow", occasions: ["Festive", "Thank You"],
      desc: "Coordinated boxes for sharing, in warm champagne and burgundy.",
      contents: ["Dry fruit jar", "Tea selection", "Tea-light holder", "Sweets (to be confirmed)"],
      art: { svg: "festive" } },
    { id: "little-favours", name: "Little Favours", occasions: ["Wedding", "Thank You"],
      desc: "Miniature favour boxes made to match a celebration, designed for many guests at once.",
      contents: ["Mini chocolates", "Favour tag", "Satin ribbon in your colour"],
      art: { svg: "favours" } },
    { id: "welcome-home", name: "Welcome Home", occasions: ["Welcome", "Birthday"],
      desc: "Light and airy: something for the new home and something for the first evening in it.",
      contents: ["Reed diffuser", "Dried flower posy", "Tea selection", "Welcome card"],
      art: { img: "img/closed.webp", alt: "Closed ivory gift box tied with a burgundy bow" } },
    { id: "desk-edit", name: "The Desk Edit", occasions: ["Thank You", "Festive"],
      desc: "A tidy thank-you for colleagues and clients, with space for sample branding.",
      contents: ["Notebook & pen", "Tea selection", "Cookies", "Branded card (concept)"],
      art: { svg: "desk" } }
  ],
  faq: [
    { q: "How do I enquire?", a: "Choose a collection or build a hamper on this page, then use Copy Enquiry and paste the text into an Instagram direct message to @havengiftsandhampers. Haven replies there to discuss the details." },
    { q: "How do I share bulk requirements?", a: "Use the bulk form in Retail & Wholesale: occasion, approximate quantity, an optional budget per hamper, the date you have in mind and any notes. Haven’s profile says bulk enquiries are welcome by DM. Quantities, lead times and pricing are confirmed with Haven directly." },
    { q: "Can I discuss my own gifting idea?", a: "Yes. Describe your idea in the message. Whether a particular item, finish or customisation is possible is something to confirm with Haven when you get in touch." },
    { q: "Do you deliver, and where?", a: "Delivery areas and timings are not listed on this concept yet. Please ask Haven when you send your enquiry." }
  ]
};
