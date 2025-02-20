-- Drop existing view if it exists
DROP VIEW IF EXISTS access.user_content_tree;

-- Create view for content tree with access information
CREATE OR REPLACE VIEW access.user_content_tree AS
WITH RECURSIVE content_tree AS (
  -- Base query for content
  SELECT 
    ua.user_id,
    c.id as content_id,
    c.title,
    'content' as type,
    ua.access_status = 'granted' 
    AND (ua.access_starts_at IS NULL OR ua.access_starts_at <= CURRENT_TIMESTAMP) as has_access,
    NULL::uuid as parent_id
  FROM access.user_access ua
  JOIN content.content c ON c.id = ua.content_id
  
  UNION ALL
  
  -- Recursive part for modules and media
  SELECT
    ct.user_id,
    item.id,
    item.title,
    item.type::text,
    CASE
      WHEN ct.has_access = false THEN false
      WHEN ct.access_overrides->'modules'->(item.id::text)->>'status' = 'locked' THEN false
      WHEN ct.access_overrides->'modules'->(item.id::text)->>'status' = 'pending' 
        AND ct.access_starts_at + make_interval(
          days := (ct.access_overrides->'modules'->(item.id::text)->'delay'->>'value')::int
        ) > CURRENT_TIMESTAMP THEN false
      WHEN ct.access_overrides->'media'->(item.id::text)->>'status' = 'locked' THEN false
      WHEN ct.access_overrides->'media'->(item.id::text)->>'status' = 'pending'
        AND ct.access_starts_at + make_interval(
          days := (ct.access_overrides->'media'->(item.id::text)->'delay'->>'value')::int
        ) > CURRENT_TIMESTAMP THEN false
      ELSE true
    END as has_access,
    ct.content_id as parent_id
  FROM content_tree ct
  JOIN LATERAL (
    SELECT m.id, m.title, 'module' as type FROM content.modules m WHERE m.content_id = ct.content_id
    UNION ALL
    SELECT med.id, med.title, 'media' as type FROM content.media med WHERE med.module_id IN (
      SELECT m2.id FROM content.modules m2 WHERE m2.content_id = ct.content_id
    )
  ) item ON true
)
SELECT 
  user_id,
  content_id as id,
  title,
  type,
  has_access,
  parent_id
FROM content_tree; 