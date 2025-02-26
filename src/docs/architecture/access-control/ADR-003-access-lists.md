# ADR-003: Access Control System

## Status
Updated - May 2024

This document outlines our simplified approach to managing user access to bundle variations, moving away from the previous complex list-based system to a more direct and maintainable solution.

---

## Understanding the Goal
We need to track and manage:
1. Which users have access to which bundle variations
2. Custom groupings of users for organizational purposes
3. The ability to view access at both variation and bundle levels

---

## Core Components

### 1. Direct Bundle Variation Access
The primary table `access.bundle_variation_access` directly tracks who has access to what:

```sql
CREATE TABLE access.bundle_variation_access (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    variation_id UUID REFERENCES access.bundle_variations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    PRIMARY KEY (user_id, variation_id)
);
```

#### Key Features:
- Direct relationship between users and variations
- Tracks who granted the access and when
- Simple to query and maintain
- Protected by Row Level Security (RLS)

#### Core Functions:
- `grant_bundle_variation_access(user_ids UUID[], variation_id UUID)`: Grant access to multiple users
- `revoke_bundle_variation_access(user_ids UUID[], variation_id UUID)`: Revoke access from multiple users
- `get_variation_users(variation_id UUID)`: List all users with access to a variation

### 2. Custom Lists (Optional)
For organizing users independently of their bundle access:

```sql
CREATE TABLE access.custom_lists (
    id UUID PRIMARY KEY,
    name TEXT,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ
);

CREATE TABLE access.custom_list_members (
    list_id UUID,
    user_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ,
    PRIMARY KEY (list_id, user_id)
);
```

#### Key Features:
- Separate from bundle access tracking
- Flexible grouping of users
- Can include users regardless of their bundle access

#### Core Functions:
- `create_custom_list(name TEXT, description TEXT)`
- `add_users_to_custom_list(list_id UUID, user_ids UUID[])`
- `remove_users_from_custom_list(list_id UUID, user_ids UUID[])`
- `get_custom_list_members(list_id UUID)`
- `get_user_custom_lists(user_id UUID)`

### 3. Bundle-Level Access Queries
View access at the bundle level through the variation relationship:

```sql
CREATE FUNCTION access.get_bundle_users(p_bundle_id UUID) 
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    variation_name TEXT,
    created_at TIMESTAMPTZ
) AS $$
    SELECT DISTINCT
        bva.user_id,
        u.email,
        bv.variation_name,
        bva.created_at
    FROM access.bundle_variation_access bva
    JOIN access.bundle_variations bv ON bva.variation_id = bv.id
    JOIN auth.users u ON bva.user_id = u.id
    WHERE bv.bundle_id = p_bundle_id
    ORDER BY u.email;
$$;
```

---

## Security

### Row Level Security (RLS)
All tables are protected by RLS policies:

1. Bundle Variation Access:
```sql
-- Admins can manage access
CREATE POLICY "Allow admins to manage bundle variation access"
    ON access.bundle_variation_access
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Users can view their own access
CREATE POLICY "Allow users to view their own access"
    ON access.bundle_variation_access
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
```

2. Custom Lists (when implemented):
- Only admins can create and manage lists
- Users can view lists they belong to

---

## Why This Approach?

### Benefits of Simplification
1. **Direct Relationships**
   - Clear, one-to-many relationship between users and variations
   - No intermediate tables or complex joins needed
   - Easier to understand and maintain

2. **Performance**
   - Simpler queries with fewer joins
   - More efficient access checks
   - Better scalability

3. **Maintainability**
   - Less code to maintain
   - Fewer potential points of failure
   - Clearer audit trail

4. **Flexibility**
   - Easy to extend with custom lists when needed
   - Simple to query at both variation and bundle levels
   - Clear separation of concerns

### Moving Away from Complex Lists
We deliberately moved away from the previous system of auto-generated and combination lists because:
1. It added unnecessary complexity
2. Required constant synchronization
3. Made it difficult to track the source of access grants
4. Created maintenance overhead with triggers and automated updates

---

## Implementation Details

### Schema Placement
All tables remain in the `access` schema for:
- Logical organization with other access-related tables
- Consistent permission management
- Clear boundaries of responsibility

### Typical Workflows

#### Granting Access
1. Admin identifies users to grant access
2. Admin selects target variation
3. Admin calls `grant_bundle_variation_access` with user IDs and variation ID
4. System records access with timestamp and admin ID

#### Viewing Access
1. At variation level: Use `get_variation_users`
2. At bundle level: Use `get_bundle_users`
3. For custom groups: Use custom list functions (when implemented)

#### Revoking Access
1. Admin identifies users to revoke
2. Admin calls `revoke_bundle_variation_access`
3. System removes access records

---

## Future Considerations

### Potential Enhancements
1. Add support for time-limited access
2. Implement access request/approval workflows
3. Add bulk operations for efficient management
4. Create views for common access patterns

### Migration Path
When implementing custom lists:
1. Create new tables without disrupting existing access
2. Add management functions
3. Create UI components for list management
4. Maintain separation from core access tracking

---

## Technical Schema Reference

```sql
-- Core access tracking
CREATE TABLE access.bundle_variation_access (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    variation_id UUID REFERENCES access.bundle_variations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    PRIMARY KEY (user_id, variation_id)
);

-- Optional custom lists (when implemented)
CREATE TABLE access.custom_lists (
    id UUID PRIMARY KEY,
    name TEXT,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ
);

CREATE TABLE access.custom_list_members (
    list_id UUID,
    user_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ,
    PRIMARY KEY (list_id, user_id)
);
```

This schema provides a solid foundation for managing access while maintaining simplicity and flexibility for future requirements.