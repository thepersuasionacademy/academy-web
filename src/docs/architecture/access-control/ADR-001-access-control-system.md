# ADR-001: Access Control System Redesign

## Status
Proposed - February 2024

Let me walk you through the entire case of the changes being made to the access control system for your utmost clarity. I’ll explain how it works step-by-step, incorporating your preferences for a binary initial access status, access settings as differences from that status, and the inheritance rules for media items—all while keeping it clean, simple, and aligned with your needs.

---

Got it! You’re right—if you don’t need a denied status at the content level and can simply delete the record to revoke access, we can abolish the `access_status` column entirely. This simplifies things even further: a record in `user_access` means the user has access to the course, and the `access_overrides` (or whatever we rename it) handles any exceptions (locks or drip schedules). Below, I’ve updated the entire plan with this change, ensuring it’s clean, scalable, and fits your structure.

---

### Updated Access Control System

#### Structure Recap
- **Content**: The course (e.g., "Power Patterns")
  - **Modules**: Sections (e.g., "The BootCamp", "BONUS")
    - **Media**: Daily lessons (e.g., "Day 1", "Day 2", "Day 3")
      - **Media Items**: Content pieces (e.g., "Video lesson", "AI tools", "PDF", "Text Lesson")

#### Core Concepts
1. **Content-Level Access**:
   - **Presence of Record**: If a row exists in `user_access` for a `user_id` and `content_id`, the user has access to the course.
   - **No Record**: If there’s no row, the user has no access (equivalent to "denied"). You delete the record to revoke access.
   - **Default Behavior**: Access is immediate to all Modules, Media, and Media Items unless overridden.

2. **Access Overrides (Renamed from `access_settings`)**:
   - **Purpose**: Specifies exceptions to the default immediate access.
   - **Scope**: Applies to Modules or Media (not Media Items directly).
   - **Possible States**:
     - **`locked`**: Blocks access to that Module/Media and its children.
     - **`pending`**: Delays access via a drip schedule (e.g., 3 days).
   - **Default**: If no override exists, the item is accessible immediately.

3. **Media Items**:
   - **Inheritance**: Take their access status from their parent Media.
   - **No Direct Control**: Simplifies management—no overrides at this level.

---

### Database Design

#### Table: `user_access`
- **Columns**:
  - `id` (UUID): Primary key.
  - `user_id` (UUID): The user.
  - `content_id` (UUID): The course.
  - `access_starts_at` (TIMESTAMP): When access begins (optional, for course-level drip).
  - `access_overrides` (JSONB): Exceptions for Modules or Media.
  - `granted_by` (UUID): Who granted access.
  - `granted_at` (TIMESTAMP): When access was granted.

- **Schema**:
  ```sql
  CREATE TABLE access.user_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content_id UUID NOT NULL,
    access_starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_overrides JSONB DEFAULT '{}',
    granted_by UUID,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, content_id)
  );
  ```

- **Example**:
  ```sql
  INSERT INTO access.user_access (
    user_id, content_id, access_starts_at, access_overrides, granted_by, granted_at
  ) VALUES (
    'user-123',
    'power-patterns-id',
    '2025-02-19T00:00:00+00',
    '{
      "media": {
        "day-2-id": { "access_status": "pending", "delay": { "value": 2, "unit": "days" } }
      }
    }',
    'admin-456',
    NOW()
  );
  ```
  - **Meaning**: User has access to "Power Patterns" immediately, but "Day 2" is locked for 2 days.

#### Table: `access_history`
- Remains unchanged for auditing:
  ```sql
  CREATE TABLE access.access_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_access_id UUID REFERENCES access.user_access(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by UUID,
    previous_settings JSONB,
    new_settings JSONB
  );
  ```

---

### RPC Functions

#### Grant/Update Access (`grant_user_access`)
- **Logic**:
  - Inserts or updates a record in `user_access`.
  - Logs changes to `access_history`.
  - Deletes the record if you want to revoke access (handled separately).

- **Code**:
  ```sql
  CREATE OR REPLACE FUNCTION public.grant_user_access(
      p_user_id UUID,
      p_content_structure JSONB,
      p_granted_by UUID
  )
  RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
      v_content_id UUID := (p_content_structure->>'content_id')::UUID;
      v_overrides JSONB := p_content_structure->'overrides';
      v_access_starts_at TIMESTAMP := NOW();
      v_user_access_id UUID;
      v_previous_overrides JSONB;
      v_result JSONB;
  BEGIN
      -- Validate
      IF v_content_id IS NULL THEN
          RAISE EXCEPTION 'Invalid content structure: content_id required';
      END IF;

      -- Handle content-level delay if present
      IF (p_content_structure->>'delay')::INT > 0 THEN
          v_access_starts_at := NOW() + ((p_content_structure->>'delay')::INT || ' days')::INTERVAL;
      END IF;

      -- Get existing overrides for history
      SELECT ua.access_overrides, ua.id INTO v_previous_overrides, v_user_access_id
      FROM access.user_access ua
      WHERE ua.user_id = p_user_id AND ua.content_id = v_content_id
      FOR UPDATE;

      -- Upsert user_access
      INSERT INTO access.user_access (
          user_id, content_id, access_starts_at, access_overrides, granted_by, granted_at
      ) VALUES (
          p_user_id, v_content_id, v_access_starts_at, v_overrides, p_granted_by, NOW()
      )
      ON CONFLICT (user_id, content_id) DO UPDATE
      SET 
          access_starts_at = EXCLUDED.access_starts_at,
          access_overrides = EXCLUDED.access_overrides,
          granted_by = EXCLUDED.granted_by,
          granted_at = NOW()
      RETURNING id INTO v_user_access_id;

      -- Log to access_history
      INSERT INTO access.access_history (
          user_access_id, changed_at, changed_by, previous_settings, new_settings
      ) VALUES (
          v_user_access_id, NOW(), p_granted_by, v_previous_overrides, v_overrides
      );

      -- Return result
      SELECT jsonb_build_object(
          'operation', CASE WHEN v_previous_overrides IS NULL THEN 'insert' ELSE 'update' END,
          'user_id', p_user_id,
          'content_id', v_content_id,
          'updated_record', row_to_json(ua)
      ) INTO v_result
      FROM access.user_access ua
      WHERE ua.id = v_user_access_id;

      RETURN v_result;
  END;
  $$;
  ```

#### Revoke Access (`revoke_user_access`)
- **Logic**: Deletes the record to remove access.
- **Code**:
  ```sql
  CREATE OR REPLACE FUNCTION public.revoke_user_access(
      p_user_id UUID,
      p_content_id UUID,
      p_revoked_by UUID
  )
  RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
      v_user_access_id UUID;
      v_previous_overrides JSONB;
      v_result JSONB;
  BEGIN
      -- Capture current state for history
      SELECT ua.id, ua.access_overrides INTO v_user_access_id, v_previous_overrides
      FROM access.user_access ua
      WHERE ua.user_id = p_user_id AND ua.content_id = p_content_id
      FOR UPDATE;

      IF v_user_access_id IS NULL THEN
          RAISE EXCEPTION 'No access record found for user % and content %', p_user_id, p_content_id;
      END IF;

      -- Log revocation
      INSERT INTO access.access_history (
          user_access_id, changed_at, changed_by, previous_settings, new_settings
      ) VALUES (
          v_user_access_id, NOW(), p_revoked_by, v_previous_overrides, NULL
      );

      -- Delete the record
      DELETE FROM access.user_access
      WHERE id = v_user_access_id;

      -- Return result
      RETURN jsonb_build_object(
          'operation', 'delete',
          'user_id', p_user_id,
          'content_id', p_content_id
      );
  END;
  $$;
  ```

#### Retrieve Access (`get_user_access`)
- **Logic**: Returns the current access details or null if no access.
- **Code**:
  ```sql
  CREATE FUNCTION public.get_user_access(p_user_id UUID, p_content_id UUID)
  RETURNS JSONB
  LANGUAGE SQL
  AS $$
      SELECT jsonb_build_object(
          'user_id', ua.user_id,
          'content_id', ua.content_id,
          'access_starts_at', ua.access_starts_at,
          'access_overrides', ua.access_overrides
      )
      FROM access.user_access ua
      WHERE ua.user_id = p_user_id AND ua.content_id = p_content_id;
  $$;
  ```

---

### Frontend Logic

#### Transforming Data
- **Logic**: Apply overrides to the course structure, with Media Items inheriting from Media.
- **Code**:
  ```typescript
  interface Override {
    access_status: 'locked' | 'pending';
    delay?: { value: number; unit: 'days' };
  }

  interface AccessData {
    access_starts_at: string;
    access_overrides: {
      modules?: { [id: string]: Override };
      media?: { [id: string]: Override };
    };
  }

  const applyAccess = (structure: any, accessData: AccessData | null) => {
    if (!accessData) return { ...structure, hasAccess: false }; // No record = no access

    const overrides = accessData.access_overrides || {};
    const now = new Date();
    const startsAt = new Date(accessData.access_starts_at);

    const applyToNode = (node: any): any => {
      const override = overrides[node.type + 's']?.[node.id];
      let nodeStatus: 'granted' | 'locked' | 'pending' = 'granted';
      let delay: { value: number; unit: 'days' } | undefined;

      if (override) {
        nodeStatus = override.access_status;
        delay = override.delay;
      }

      const isAccessible = nodeStatus === 'granted' || 
        (nodeStatus === 'pending' && delay && now >= addDays(startsAt, delay.value));

      const children = node.children?.map((child: any) => {
        if (child.type === 'media_item') {
          return { ...child, hasAccess: isAccessible };
        }
        return applyToNode(child);
      });

      return {
        ...node,
        hasAccess: isAccessible,
        accessStatus: nodeStatus,
        accessDelay: delay,
        children
      };
    };

    return applyToNode(structure);
  };

  // Helper to add days
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // Example usage
  const fetchAccess = async () => {
    const { data } = await supabase.rpc('get_user_access', {
      p_user_id: targetUserId,
      p_content_id: 'power-patterns-id'
    });
    const updatedStructure = applyAccess(courseStructure, data);
    setStructure(updatedStructure);
  };
  ```

#### Granting Access
- **Logic**: Create or update access with overrides.
- **Code**:
  ```typescript
  const handleGrantAccess = async () => {
    const payload = {
      content_id: 'power-patterns-id',
      overrides: {
        media: {
          'day-2-id': { access_status: 'pending', delay: { value: 2, unit: 'days' } }
        }
      }
    };

    await supabase.rpc('grant_user_access', {
      p_user_id: targetUserId,
      p_content_structure: payload,
      p_granted_by: user.id
    });
  };
  ```

#### Revoking Access
- **Logic**: Delete the record.
- **Code**:
  ```typescript
  const handleRevokeAccess = async () => {
    await supabase.rpc('revoke_user_access', {
      p_user_id: targetUserId,
      p_content_id: 'power-patterns-id',
      p_revoked_by: user.id
    });
  };
  ```

---

### Example Scenarios

#### Full Access
- **Record**:
  ```json
  {
    "user_id": "user-123",
    "content_id": "power-patterns-id",
    "access_overrides": {}
  }
  ```
- **Result**: Immediate access to everything.

#### Day 2 on Drip
- **Record**:
  ```json
  {
    "user_id": "user-123",
    "content_id": "power-patterns-id",
    "access_overrides": {
      "media": {
        "day-2-id": { "access_status": "pending", "delay": { "value": 2, "unit": "days" } }
      }
    }
  }
  ```
- **Result**: Access to everything except "Day 2" (and its Media Items), which unlocks after 2 days.

#### Locked Module
- **Record**:
  ```json
  {
    "user_id": "user-123",
    "content_id": "power-patterns-id",
    "access_overrides": {
      "modules": {
        "bonus-id": { "access_status": "locked" }
      }
    }
  }
  ```
- **Result**: Access to everything except the "BONUS" module.

#### No Access
- **Record**: None (deleted)
- **Result**: No access to anything.

---

### Why This is Optimal
- **Clean**: No `access_status` column—just presence/absence of a record.
- **Scalable**: One record per user/course, small JSONB for overrides.
- **Simple**: Overrides only where needed, Media Items inherit from Media.
- **Robust**: Deleting a record cleanly revokes access, history tracks all changes.

This matches your vision perfectly: access at the content level means everything’s available unless overridden, and Media Items follow their Media without extra complexity. Let me know if you need any adjustments!