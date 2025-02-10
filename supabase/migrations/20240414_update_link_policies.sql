-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can manage collections" ON links.collections;
DROP POLICY IF EXISTS "Anyone can view collections" ON links.collections;
DROP POLICY IF EXISTS "Anyone can view suites" ON links.suites;
DROP POLICY IF EXISTS "Anyone can view items" ON links.items;
DROP POLICY IF EXISTS "Anyone can view tags" ON links.tags;
DROP POLICY IF EXISTS "Anyone can view link_tags" ON links.link_tags;

-- Create new policies for collections
CREATE POLICY "Admins can manage collections"
    ON links.collections FOR ALL
    USING (public.is_admin() OR public.is_super_admin());

CREATE POLICY "Anyone can view collections"
    ON links.collections FOR SELECT
    TO authenticated
    USING (true);

-- Create policies for suites
CREATE POLICY "Admins can manage suites"
    ON links.suites FOR ALL
    USING (public.is_admin() OR public.is_super_admin());

CREATE POLICY "Anyone can view suites"
    ON links.suites FOR SELECT
    TO authenticated
    USING (true);

-- Create policies for items
CREATE POLICY "Admins can manage items"
    ON links.items FOR ALL
    USING (public.is_admin() OR public.is_super_admin());

CREATE POLICY "Anyone can view items"
    ON links.items FOR SELECT
    TO authenticated
    USING (true);

-- Create policies for tags
CREATE POLICY "Admins can manage tags"
    ON links.tags FOR ALL
    USING (public.is_admin() OR public.is_super_admin());

CREATE POLICY "Anyone can view tags"
    ON links.tags FOR SELECT
    TO authenticated
    USING (true);

-- Create policies for link_tags
CREATE POLICY "Admins can manage link_tags"
    ON links.link_tags FOR ALL
    USING (public.is_admin() OR public.is_super_admin());

CREATE POLICY "Anyone can view link_tags"
    ON links.link_tags FOR SELECT
    TO authenticated
    USING (true); 