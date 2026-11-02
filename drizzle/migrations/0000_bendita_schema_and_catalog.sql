CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TABLE public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads active categories" ON public.categories FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manages categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  image_url text,
  category_id text NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  available boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  max_flavors int CHECK (max_flavors IS NULL OR max_flavors >= 0),
  addons jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_featured_idx ON public.products(featured) WHERE featured;
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads products of active categories" ON public.products FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.active) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manages products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.flavors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.flavors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.flavors TO authenticated;
GRANT ALL ON public.flavors TO service_role;
ALTER TABLE public.flavors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads available flavors" ON public.flavors FOR SELECT TO anon, authenticated
USING (available OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admin manages flavors" ON public.flavors FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE SEQUENCE public.order_number_seq START 1001;
GRANT USAGE ON SEQUENCE public.order_number_seq TO service_role;
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('BC-' || nextval('public.order_number_seq')),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  delivery_type text NOT NULL CHECK (delivery_type IN ('delivery','retirada')),
  delivery_address text,
  delivery_complement text,
  delivery_reference text,
  payment_method text NOT NULL,
  notes text,
  subtotal numeric(10,2) NOT NULL,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'aguardando_confirmacao' CHECK (status IN ('aguardando_confirmacao','confirmado','em_preparacao','saiu_para_entrega','pronto_para_retirada','concluido','cancelado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_created_idx ON public.orders(created_at DESC);
CREATE INDEX orders_status_idx ON public.orders(status);
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin reads orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin updates orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin deletes orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  flavors text[] NOT NULL DEFAULT '{}',
  addons jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  subtotal numeric(10,2) NOT NULL
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
CREATE INDEX order_items_product_idx ON public.order_items(product_id);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin reads order items" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.store_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name text NOT NULL DEFAULT 'Bendita Cremeria',
  whatsapp text,
  address text,
  instagram text,
  ifood text,
  opening_hours text,
  delivery_enabled boolean NOT NULL DEFAULT true,
  pickup_enabled boolean NOT NULL DEFAULT true,
  delivery_fee numeric(10,2),
  hero_eyebrow text,
  hero_subtitle text,
  hero_image_url text,
  essence_title text,
  essence_text text,
  show_featured boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER store_settings_touch BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads store settings" ON public.store_settings FOR SELECT TO anon, authenticated USING (id = 1);
CREATE POLICY "admin updates settings" ON public.store_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.store_settings (id, store_name, address, instagram, ifood) VALUES
(1, 'Bendita Cremeria', 'Rua Padre Teixeira, 2216 — Centro, São Carlos - SP', 'https://www.instagram.com/benditacremeria',
 'https://www.ifood.com.br/delivery/sao-carlos-sp/bendita-cremeria-sorvetes-artesanais---gelatos--sorbets-centro/3966715e-e09b-4f4d-a7fb-183635416912')
ON CONFLICT (id) DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.flavors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;

INSERT INTO public.categories (id,name,description,sort_order) VALUES
('sorvetes','Sorvetes',NULL,1),
('waffles','Waffles','Ambos acompanham calda de chocolate.',2),
('sobremesas','Sobremesas especiais',NULL,3),
('bebidas','Bebidas',NULL,4),
('milkshake','Milkshake','Sabores disponíveis no expositor.',5),
('tacas','Taças especiais',NULL,6),
('bolos','Bolos','Pergunte pelas opções de sabores do dia.',7),
('mini-bolos','Mini bolos',NULL,8),
('salgados','Salgados',NULL,9),
('embalagens','Embalagens',NULL,10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.products (name,slug,description,price,category_id,available,featured,max_flavors,addons,sort_order) VALUES
('Copo Pequeno','copo-pequeno','1 sabor',17,'sorvetes',true,true,1,'[{"id":"cascao","name":"Cascão artesanal","price":3}]'::jsonb,1),
('Copo Médio','copo-medio','Até 2 sabores',20,'sorvetes',true,true,2,'[{"id":"cascao","name":"Cascão artesanal","price":3}]'::jsonb,2),
('Copo Grande','copo-grande','Até 3 sabores',25,'sorvetes',true,false,3,'[{"id":"cascao","name":"Cascão artesanal","price":3}]'::jsonb,3),
('Waffle de Brownie','waffle-de-brownie','Acompanha calda de chocolate.',14,'waffles',true,false,NULL,'[]'::jsonb,4),
('Waffle de Chocolate Branco','waffle-de-chocolate-branco','Acompanha calda de chocolate.',14,'waffles',true,false,NULL,'[]'::jsonb,5),
('Café + Waffle com Calda de Chocolate','cafe-waffle-com-calda-de-chocolate',NULL,20,'sobremesas',true,false,NULL,'[]'::jsonb,6),
('Taça com 2 Bolas de Sorvete + Calda + Farofa Doce + Chantilly','taca-com-2-bolas-de-sorvete-calda-farofa-doce-chantilly',NULL,27,'sobremesas',true,false,2,'[]'::jsonb,7),
('Waffle com 2 Bolas de Sorvete + Calda + Farofa Doce','waffle-com-2-bolas-de-sorvete-calda-farofa-doce',NULL,27,'sobremesas',true,false,2,'[]'::jsonb,8),
('Vulcano di Cioccolato','vulcano-di-cioccolato',NULL,30,'sobremesas',true,true,NULL,'[]'::jsonb,9),
('Petit Gâteau com Sorvete','petit-gateau-com-sorvete',NULL,30,'sobremesas',true,false,1,'[]'::jsonb,10),
('Crumble de Nozes com Maçã + 1 Bola de Sorvete','crumble-de-nozes-com-maca-1-bola-de-sorvete',NULL,30,'sobremesas',true,false,1,'[]'::jsonb,11),
('Brownie com Calda de Chocolate + 1 Bola de Sorvete','brownie-com-calda-de-chocolate-1-bola-de-sorvete',NULL,27,'sobremesas',true,false,1,'[]'::jsonb,12),
('Café Espresso','cafe-espresso',NULL,8.5,'bebidas',true,false,NULL,'[]'::jsonb,13),
('Café Gelado','cafe-gelado',NULL,22,'bebidas',true,false,NULL,'[]'::jsonb,14),
('Macchiato','macchiato',NULL,12,'bebidas',true,false,NULL,'[]'::jsonb,15),
('Capuccino','capuccino',NULL,15,'bebidas',true,false,NULL,'[]'::jsonb,16),
('Affogato','affogato',NULL,22,'bebidas',true,true,NULL,'[]'::jsonb,17),
('Água sem Gás','agua-sem-gas',NULL,6,'bebidas',true,false,NULL,'[]'::jsonb,18),
('Água com Gás','agua-com-gas',NULL,6.5,'bebidas',true,false,NULL,'[]'::jsonb,19),
('Coca-Cola','coca-cola','Refrigerante 200 ml',8,'bebidas',true,false,NULL,'[]'::jsonb,20),
('Coca-Cola Zero Açúcar','coca-cola-zero-acucar','Refrigerante 200 ml',8,'bebidas',true,false,NULL,'[]'::jsonb,21),
('Guaraná','guarana','Refrigerante 200 ml',8,'bebidas',true,false,NULL,'[]'::jsonb,22),
('Guaraná Zero Açúcar','guarana-zero-acucar','Refrigerante 200 ml',8,'bebidas',true,false,NULL,'[]'::jsonb,23),
('Milkshake','milkshake','Sabores disponíveis no expositor.',26,'milkshake',true,false,1,'[]'::jsonb,24),
('Taça Pistache','taca-pistache','1 bola de sorvete de pistache, calda de chocolate branco, pistache picado e chantilly.',27,'tacas',true,true,NULL,'[]'::jsonb,25),
('Taça Brownie','taca-brownie','1 bola de sorvete, brownie picado, calda de chocolate meio amargo e chantilly.',27,'tacas',true,false,1,'[]'::jsonb,26),
('Taça Frutas Vermelhas','taca-frutas-vermelhas','1 bola de sorvete, calda de chocolate branco, calda de frutas vermelhas e chantilly.',27,'tacas',true,false,1,'[]'::jsonb,27),
('Taça Zurique','taca-zurique','1 bola de sorvete, café espresso, calda de chocolate e chantilly.',27,'tacas',true,false,1,'[]'::jsonb,28),
('Fatia de Bolo de Sorvete','fatia-de-bolo-de-sorvete','Pergunte pelas opções de sabores do dia.',20,'bolos',true,false,NULL,'[]'::jsonb,29),
('Fatia de Bolo de Sorvete + Café','fatia-de-bolo-de-sorvete-cafe','Pergunte pelas opções de sabores do dia.',26,'bolos',true,false,NULL,'[]'::jsonb,30),
('Fatia de Bolo Brigadeiro','fatia-de-bolo-brigadeiro',NULL,14,'mini-bolos',true,false,NULL,'[]'::jsonb,31),
('Fatia de Bolo de Coco','fatia-de-bolo-de-coco',NULL,14,'mini-bolos',true,false,NULL,'[]'::jsonb,32),
('Torta de Abacaxi com Coco','torta-de-abacaxi-com-coco',NULL,20,'mini-bolos',true,false,NULL,'[]'::jsonb,33),
('Torta de Frango','torta-de-frango',NULL,20,'salgados',true,false,NULL,'[]'::jsonb,34),
('Pote 700 ml — Sabores tradicionais','pote-700-ml-sabores-tradicionais',NULL,65,'embalagens',true,false,1,'[]'::jsonb,35),
('Pote 700 ml — Pistache, Macadâmia e Sorvetes Zero Açúcar','pote-700-ml-pistache-macadamia-e-sorvetes-zero-acucar',NULL,70,'embalagens',true,false,1,'[]'::jsonb,36),
('Pote Individual para Viagem','pote-individual-para-viagem',NULL,3,'embalagens',true,false,NULL,'[]'::jsonb,37)
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.grant_initial_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) = 'lopxs33@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.grant_initial_admin() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created_grant_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_initial_admin();

CREATE POLICY "admin uploads product images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admin updates product images" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admin deletes product images" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));