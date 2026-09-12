export interface ShopProductColor {
  name: string;
  image: string;
}

export interface ShopBundleOption {
  // e.g. "Top Only", "Bottom Only", "Bundle (Save $10)"
  label: string;
  price: string;
  image: string;
}

export interface ShopProduct {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string;
  materials: string;
  sizeChart: string;
  images: string[];
  // If set, the product page shows color-swatch dots and appends
  // "(ColorName)" to the title based on the selected color.
  colors?: ShopProductColor[];
  // If set, the product page shows a size selector.
  sizes?: string[];
  // If set, shows name/number customization inputs on the product page.
  customizable?: boolean;
  // Availability shown as a badge and used for the Shop page filter.
  // Defaults to "coming-soon" if omitted.
  status?: "coming-soon" | "available" | "sold-out";
  // If set, the product page shows a Top Only / Bottom Only / Bundle selector
  // instead of a plain price — for 2-piece sets (e.g. crop top + sweatpants).
  bundleOptions?: ShopBundleOption[];
  // If set, the product page shows an Adult/Youth toggle that swaps the
  // displayed size options between `sizes` and `youthSizes`.
  youthSizes?: string[];
  // If set, the product page shows a real Men's/Women's size chart table
  // (from src/data/sizeCharts.ts) instead of the plain sizeChart text.
  garmentType?: "tee" | "hoodie" | "sweatpants" | "shorts" | "jersey" | "crop";
}

export interface CouponCode {
  code: string;
  type: "percent" | "fixed";
  value: number; // percent: 0-100, fixed: dollars off
  description: string;
  // If set, only applies to these product ids. Omit for storewide.
  appliesTo?: string[];
}

// Coupon codes — storewide unless `appliesTo` limits them to specific product ids.
export const couponCodes: CouponCode[] = [
  { code: "GTEC10", type: "percent", value: 10, description: "10% off your order" },
  { code: "WELCOME15", type: "percent", value: 15, description: "15% off — welcome to GTEC" },
  { code: "ELITE20", type: "percent", value: 20, description: "20% off for Elite Comp players" },
  { code: "VIP25", type: "percent", value: 25, description: "25% off — VIP / creator code" },
  { code: "RACE5", type: "fixed", value: 5, description: "$5 off Racing gear", appliesTo: ["gtec-racing-tee", "gtec-zip-hoodie-shorts-set", "gtec-racing-crop-set"] },
  { code: "BUNDLE10", type: "fixed", value: 10, description: "$10 off bundle sets", appliesTo: ["gtec-racing-crop-set", "gtec-mountain-crop-set", "gtec-youth-hoodie-set"] },
  { code: "SEASON4", type: "percent", value: 15, description: "Season 4 launch promo" },
];

// Static product catalog — everything below is editable right in this file.
// Images live in /public/shop/, referenced here by filename (e.g. "/shop/tee-classic-1.png").
// To add/remove/change a product, just edit this array and redeploy.
export const shopProducts: ShopProduct[] = [
  {
    id: "gtec-classic-tee",
    name: "GTEC Classic Tee",
    category: "Shirts",
    price: "$34.99",
    description:
      "Oversized fit tee in heavyweight cotton with the distressed GTEC arch logo across the chest. Built for lounging, not lagging.",
    materials: "100% heavyweight combed cotton, 6.5 oz. Garment-dyed for a lived-in look.",
    sizeChart:
      "XS: 36\" chest / S: 40\" chest / M: 44\" chest / L: 48\" chest / XL: 52\" chest / XXL: 56\" chest. Model is 5'7\" wearing a size M for an oversized fit.",
    images: ["/shop/tee-classic-front-2.png", "/shop/tee-classic-back-2.png"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    garmentType: "tee",
  },
  {
    id: "gtec-racing-tee",
    name: "GTEC Racing Tee",
    category: "Shirts",
    price: "$29.99",
    description:
      "White tee with a bold yellow \"1\" on the chest, racing-numeral style. Simple, punchy, and easy to throw on.",
    materials: "100% ringspun cotton, 5.3 oz. Screen printed graphics.",
    sizeChart:
      "XS: 33-35\" chest / S: 36-38\" chest / M: 39-41\" chest / L: 42-44\" chest / XL: 45-47\" chest / XXL: 48-50\" chest.",
    images: ["/shop/tee-racing-front.png", "/shop/tee-racing-back.png"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    garmentType: "tee",
  },
  {
    id: "gtec-logo-tee",
    name: "GTEC Logo Tee",
    category: "Shirts",
    price: "$27.99",
    description: "Clean chest-logo tee featuring the GTEC crest. Everyday essential, true to size.",
    materials: "100% combed cotton, 5.0 oz.",
    sizeChart: "XS: 33\" chest / S: 36\" chest / M: 39\" chest / L: 42\" chest / XL: 45\" chest / XXL: 48\" chest.",
    images: ["/shop/tee-logo-1.png"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    garmentType: "tee",
  },
  {
    id: "gtec-sweatpants",
    name: "GTEC Elite Sweatpants",
    category: "Pants",
    price: "$54.99",
    description:
      "Heavyweight fleece sweatpants with the full GTEC Elite Comp lockup on the hip and a leg hit down the thigh. Unisex fit, available in Black and Heather Grey.",
    materials: "80% cotton / 20% polyester fleece, 12 oz. Elastic waistband with drawcord, ribbed cuffs.",
    sizeChart:
      "XS: 25-27\" waist / S: 28-30\" waist / M: 31-33\" waist / L: 34-36\" waist / XL: 37-39\" waist / XXL: 40-42\" waist. Unisex sizing — runs true to size.",
    images: ["/shop/sweatpants-black.png", "/shop/sweatpants-grey.png"],
    colors: [
      { name: "Black", image: "/shop/sweatpants-black.png" },
      { name: "Grey", image: "/shop/sweatpants-grey.png" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    garmentType: "sweatpants",
  },
  {
    id: "gtec-shorts-womens",
    name: "GTEC Elite Shorts (Women's)",
    category: "Shorts",
    price: "$32.99",
    description:
      "Retro running-style shorts with side piping and the GTEC Elite Comp wordmark. Women's fit with a higher rise.",
    materials: "100% polyester mesh shell, mesh liner. Elastic drawstring waist.",
    sizeChart: "XS: 24-25\" waist / S: 26-27\" waist / M: 28-29\" waist / L: 30-32\" waist / XL: 33-35\" waist.",
    images: ["/shop/shorts-womens-1.png"],
    sizes: ["XS", "S", "M", "L", "XL"],
    garmentType: "shorts",
  },
  {
    id: "gtec-shorts-mens",
    name: "GTEC Elite Shorts (Men's)",
    category: "Shorts",
    price: "$32.99",
    description:
      "Basketball-cut mesh shorts with contrast piping, GTEC crest and wordmark on the leg. Men's relaxed fit.",
    materials: "100% polyester mesh shell, mesh liner, side pockets.",
    sizeChart:
      "XS: 27-29\" waist / S: 30-32\" waist / M: 33-35\" waist / L: 36-38\" waist / XL: 39-41\" waist / XXL: 42-44\" waist.",
    images: ["/shop/shorts-mens-1.png"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    garmentType: "shorts",
  },
  {
    id: "gtec-socks-sole",
    name: "GTEC Sole Print Socks",
    category: "Socks",
    price: "$14.99",
    description:
      "Crew-style socks with the full GTEC crest printed across the sole — the kind of detail you only notice when you kick your feet up.",
    materials: "80% cotton / 15% polyester / 5% spandex. Cushioned footbed, ribbed cuff.",
    sizeChart: "One size fits most: US Men's 6-12 / US Women's 7-13.",
    images: ["/shop/socks-sole-1.png"],
    sizes: ["One Size"],
  },
  {
    id: "gtec-socks-crew",
    name: "GTEC Crew Socks",
    category: "Socks",
    price: "$14.99",
    description: "Cushioned crew socks with the GTEC crest on the ankle and a contrast blue heel/toe.",
    materials: "75% cotton / 20% polyester / 5% spandex. Reinforced heel and toe.",
    sizeChart: "One size fits most: US Men's 6-12 / US Women's 7-13.",
    images: ["/shop/socks-crew-1.png"],
    sizes: ["One Size"],
  },
  {
    id: "gtec-pro-jersey",
    name: "GTEC Pro Jersey",
    category: "Jerseys",
    price: "$64.99",
    description:
      "Our sublimated pro-style jersey with the full GTEC crest and angular red/blue accents. Add your own name and number on the back to make it yours.",
    materials: "100% moisture-wicking polyester interlock. Sublimated dye, won't crack or peel.",
    sizeChart:
      "XS: 33\" chest / S: 36\" chest / M: 39\" chest / L: 42\" chest / XL: 45\" chest / XXL: 48\" chest. Athletic fit — size up for a looser feel.",
    images: ["/shop/jersey-front.png", "/shop/jersey-back.png"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    customizable: true,
    garmentType: "jersey",
  },
  {
    id: "gtec-keyboard",
    name: "GTEC Mechanical Keyboard",
    category: "Accessories",
    price: "$149.99",
    description:
      "Tenkeyless (TKL) mechanical keyboard with a custom red/blue GTEC keycap set and the crest on the escape key. Built for competitive Gorilla Tag.",
    materials: "Hot-swappable mechanical switches, PBT dye-sublimated keycaps, aluminum frame.",
    sizeChart: "Tenkeyless (TKL), 87-key layout, USB-C detachable cable.",
    images: ["/shop/keyboard-1.png", "/shop/keyboard-2.png"],
  },
  {
    id: "gtec-sticker-sheet",
    name: "GTEC Sticker Sheet",
    category: "Accessories",
    price: "$9.99",
    description:
      "A full sheet of GTEC stickers — logos, gorilla mascots, and hype phrases. Slap 'em on a bottle, laptop, or helmet.",
    materials: "Waterproof, weatherproof matte vinyl. Die-cut.",
    sizeChart: "One sheet, approx. 15 stickers. Sheet size: 6\" x 9\".",
    images: ["/shop/sticker-sheet-1.png", "/shop/sticker-sheet-lifestyle-1.png"],
  },
  {
    id: "gtec-mousepad",
    name: "GTEC Mouse Pad",
    category: "Accessories",
    price: "$19.99",
    description:
      "Desk-sized mouse pad with the full GTEC crest and Elite Comp branding. Pairs with the mechanical keyboard for a matching setup.",
    materials: "Stitched-edge cloth surface, non-slip rubber base.",
    sizeChart: "Standard size: 12\" x 14\".",
    images: ["/shop/mousepad-1.png", "/shop/mousepad-lifestyle-1.png"],
  },
  {
    id: "gtec-zip-hoodie-shorts-set",
    name: "GTEC Racing Zip Hoodie",
    category: "Hoodies",
    price: "$54.99",
    description:
      "Full-zip hoodie with the GTEC crest on the chest and \"Elite Comp\" down one sleeve.",
    materials: "80% cotton / 20% polyester fleece, 12 oz.",
    sizeChart:
      "XS: 34\" chest / S: 36\" chest / M: 39\" chest / L: 42\" chest / XL: 45\" chest / XXL: 48\" chest. Unisex sizing, oversized fit.",
    images: ["/shop/zip-hoodie-shorts-set-1.png"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    garmentType: "hoodie",
  },
  {
    id: "gtec-zip-hoodie-sweats-set",
    name: "GTEC Zip Hoodie",
    category: "Hoodies",
    price: "$54.99",
    description:
      "Full-zip hoodie with the GTEC crest and vertical \"GTEC\" sleeve hit.",
    materials: "80% cotton / 20% polyester fleece, 12 oz.",
    sizeChart:
      "XS: 34\" chest / S: 36\" chest / M: 39\" chest / L: 42\" chest / XL: 45\" chest / XXL: 48\" chest. Unisex sizing, oversized fit.",
    images: ["/shop/zip-hoodie-sweats-set-1.png"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    garmentType: "hoodie",
  },
  {
    id: "gtec-racing-crop-set",
    name: "GTEC Racing Crop Set",
    category: "Sets",
    price: "$69.99",
    description:
      "Cropped tee with a diagonal red/blue racing stripe across the sleeves, paired with matching sweatpants. Women's sizing. Buy as a set or grab either piece on its own.",
    materials: "100% cotton cropped tee. 80% cotton / 20% polyester fleece sweatpants.",
    sizeChart:
      "Women's sizing — XS: 30-31\" bust / S: 32-34\" bust / M: 35-37\" bust / L: 38-40\" bust / XL: 41-43\" bust. Cropped, boxy fit.",
    images: ["/shop/racing-crop-set-front.png", "/shop/racing-crop-set-back.png"],
    sizes: ["XS", "S", "M", "L", "XL"],
    garmentType: "crop",
    bundleOptions: [
      { label: "Crop Top Only", price: "$34.99", image: "/shop/racing-crop-set-front.png" },
      { label: "Sweatpants Only", price: "$44.99", image: "/shop/racing-crop-set-front.png" },
      { label: "Bundle (Save $10)", price: "$69.99", image: "/shop/racing-crop-set-front.png" },
    ],
  },
  {
    id: "gtec-mountain-crop-set",
    name: "GTEC Mountain Crop Set",
    category: "Sets",
    price: "$69.99",
    description:
      "Cropped tee with a bold mountain graphic across the chest and a red/blue colorblock hem on the back, paired with matching sweatpants. Women's sizing. Buy as a set or grab either piece on its own.",
    materials: "100% cotton cropped tee. 80% cotton / 20% polyester fleece sweatpants.",
    sizeChart:
      "Women's sizing — XS: 30-31\" bust / S: 32-34\" bust / M: 35-37\" bust / L: 38-40\" bust / XL: 41-43\" bust. Cropped, boxy fit.",
    images: ["/shop/mountain-crop-set-front.png", "/shop/mountain-crop-set-back.png"],
    sizes: ["XS", "S", "M", "L", "XL"],
    garmentType: "crop",
    bundleOptions: [
      { label: "Crop Top Only", price: "$34.99", image: "/shop/mountain-crop-set-front.png" },
      { label: "Sweatpants Only", price: "$44.99", image: "/shop/mountain-crop-set-front.png" },
      { label: "Bundle (Save $10)", price: "$69.99", image: "/shop/mountain-crop-set-front.png" },
    ],
  },
  {
    id: "gtec-elite-comp-hoodie-set",
    name: "GTEC Elite Comp Hoodie",
    category: "Hoodies",
    price: "$54.99",
    description:
      "Pullover hoodie with the full \"Gorilla Tag Elite Comp\" chest graphic and a sleeve patch.",
    materials: "80% cotton / 20% polyester fleece, 12 oz.",
    sizeChart:
      "XS: 33\" chest / S: 36\" chest / M: 39\" chest / L: 42\" chest / XL: 45\" chest / XXL: 48\" chest. Unisex sizing, oversized fit.",
    images: ["/shop/elite-comp-hoodie-set-1.png"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    garmentType: "hoodie",
  },
  {
    id: "gtec-youth-hoodie-set",
    name: "GTEC Elite Hoodie Set",
    category: "Sets",
    price: "$54.99",
    description:
      "Pullover hoodie with the \"Gorilla Tag Elite Comp\" chest graphic and a sleeve logo patch.",
    materials: "80% cotton / 20% polyester fleece, 12 oz.",
    sizeChart:
      "XS: 34\" chest / S: 36\" chest / M: 39\" chest / L: 42\" chest / XL: 45\" chest / XXL: 48\" chest.",
    images: ["/shop/youth-hoodie-set-1.png"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    youthSizes: ["YS", "YM", "YL", "YXL"],
    garmentType: "hoodie",
    bundleOptions: [
      { label: "Hoodie Only", price: "$34.99", image: "/shop/youth-hoodie-set-1.png" },
      { label: "Sweatpants Only", price: "$34.99", image: "/shop/youth-hoodie-set-1.png" },
      { label: "Bundle (Save $15)", price: "$54.99", image: "/shop/youth-hoodie-set-1.png" },
    ],
  },
  {
    id: "gtec-hoodie-set",
    name: "GTEC Pullover Hoodie",
    category: "Hoodies",
    price: "$54.99",
    description:
      "Pullover hoodie with the GTEC crest, \"GTEC\" wordmark, and matching sleeve text.",
    materials: "80% cotton / 20% polyester fleece, 12 oz.",
    sizeChart:
      "XS: 34\" chest / S: 36\" chest / M: 39\" chest / L: 42\" chest / XL: 45\" chest / XXL: 48\" chest.",
    images: ["/shop/gtec-hoodie-set-1.png"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    garmentType: "hoodie",
  },
];
