-- Create shop_products table
CREATE TABLE public.shop_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price TEXT NOT NULL DEFAULT '$0.00',
  description TEXT NOT NULL DEFAULT '',
  materials TEXT NOT NULL DEFAULT '',
  size_chart TEXT NOT NULL DEFAULT '',
  images TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

-- Policies (public read, open write — matches existing tables' pattern;
-- write access is gated in the UI by the isAdmin flag)
CREATE POLICY "Shop products are viewable by everyone"
ON public.shop_products
FOR SELECT
USING (true);

CREATE POLICY "Shop products can be inserted by anyone"
ON public.shop_products
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Shop products can be updated by anyone"
ON public.shop_products
FOR UPDATE
USING (true);

CREATE POLICY "Shop products can be deleted by anyone"
ON public.shop_products
FOR DELETE
USING (true);

-- Reuse the existing update_updated_at_column() trigger function
CREATE TRIGGER update_shop_products_updated_at
  BEFORE UPDATE ON public.shop_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed starter products (edit freely from the Shop admin panel)
-- Images are loaded from /public/shop/ — drop matching files in that folder.
INSERT INTO public.shop_products (name, category, price, description, materials, size_chart, images, sort_order) VALUES
  ('GTEC Classic Tee', 'Shirts', '$34.99', 'Oversized fit tee in heavyweight cotton with the distressed GTEC arch logo across the chest. Built for lounging, not lagging.', '100% heavyweight combed cotton, 6.5 oz. Garment-dyed for a lived-in look.', 'S: 40" chest / M: 44" chest / L: 48" chest / XL: 52" chest / XXL: 56" chest. Model is 5''7" wearing a size M for an oversized fit.', '{/shop/tee-classic-1.png}', 1),
  ('GTEC Racing Tee', 'Shirts', '$29.99', 'Motorsport-inspired tee with a bold number "1" front and back, GTEC branding across the shoulders. Classic fit.', '100% ringspun cotton, 5.3 oz. Screen printed graphics.', 'S: 36-38" chest / M: 39-41" chest / L: 42-44" chest / XL: 45-47" chest / XXL: 48-50" chest.', '{/shop/tee-racing-front.png,/shop/tee-racing-back.png}', 2),
  ('GTEC Logo Tee', 'Shirts', '$27.99', 'Clean chest-logo tee featuring the GTEC crest. Everyday essential, true to size.', '100% combed cotton, 5.0 oz.', 'S: 36" chest / M: 39" chest / L: 42" chest / XL: 45" chest / XXL: 48" chest.', '{/shop/tee-logo-1.png}', 3),
  ('GTEC Elite Comp Sweatpants', 'Pants', '$54.99', 'Heavyweight fleece sweatpants with the full GTEC Elite Comp lockup on the hip and a leg hit down the thigh. Unisex fit, available in Black and Heather Grey.', '80% cotton / 20% polyester fleece, 12 oz. Elastic waistband with drawcord, ribbed cuffs.', 'S: 28-30" waist / M: 31-33" waist / L: 34-36" waist / XL: 37-39" waist / XXL: 40-42" waist. Unisex sizing — runs true to size.', '{/shop/sweatpants-black.png,/shop/sweatpants-grey.png}', 4),
  ('GTEC Elite Comp Shorts (Women''s)', 'Shorts', '$32.99', 'Retro running-style shorts with side piping and the GTEC Elite Comp wordmark. Women''s fit with a higher rise.', '100% polyester mesh shell, mesh liner. Elastic drawstring waist.', 'XS: 24-25" waist / S: 26-27" waist / M: 28-29" waist / L: 30-32" waist / XL: 33-35" waist.', '{/shop/shorts-womens-1.png}', 5),
  ('GTEC Elite Comp Shorts (Men''s)', 'Shorts', '$32.99', 'Basketball-cut mesh shorts with contrast piping, GTEC crest and wordmark on the leg. Men''s relaxed fit.', '100% polyester mesh shell, mesh liner, side pockets.', 'S: 30-32" waist / M: 33-35" waist / L: 36-38" waist / XL: 39-41" waist / XXL: 42-44" waist.', '{/shop/shorts-mens-1.png}', 6),
  ('GTEC Sole Print Socks', 'Socks', '$14.99', 'No-show comfort socks with the full GTEC crest printed across the sole. Low-profile fit that stays hidden in shoes.', '80% cotton / 15% polyester / 5% spandex. Cushioned footbed.', 'One size fits most: US Men''s 6-12 / US Women''s 7-13.', '{/shop/socks-sole-1.png}', 7),
  ('GTEC Crew Socks', 'Socks', '$14.99', 'Cushioned crew socks with the GTEC crest on the ankle and a contrast blue heel/toe.', '75% cotton / 20% polyester / 5% spandex. Reinforced heel and toe.', 'One size fits most: US Men''s 6-12 / US Women''s 7-13.', '{/shop/socks-crew-1.png}', 8),
  ('GTEC Pro Jersey', 'Jerseys', '$64.99', 'Competition-grade sublimated jersey with the full GTEC crest and angular red/blue accents. The jersey worn on stage by GTEC pros.', '100% moisture-wicking polyester interlock. Sublimated dye, won''t crack or peel.', 'S: 36" chest / M: 39" chest / L: 42" chest / XL: 45" chest / XXL: 48" chest. Athletic fit — size up for a looser feel.', '{/shop/jersey-front.png,/shop/jersey-back.png}', 9),
  ('GTEC Mechanical Keyboard', 'Accessories', '$149.99', 'Full-size mechanical keyboard with a custom red/blue GTEC keycap set and the crest on the escape key. Built for competitive Gorilla Tag.', 'Hot-swappable mechanical switches, PBT dye-sublimated keycaps, aluminum frame.', 'Full-size (104-key) layout, USB-C detachable cable.', '{/shop/keyboard-1.png,/shop/keyboard-2.png}', 10)
ON CONFLICT DO NOTHING;
