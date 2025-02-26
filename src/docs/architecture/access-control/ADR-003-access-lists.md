# ADR-003: Access Lists

## Status
Implemented - May 2024

Here's a detailed overview of how we handle creating lists in our Supabase database and app UI to manage access via access bundle variations in bulk, while ensuring proper records of the people currently in those lists.

---

### Understanding the Goal
We wanted to create "lists" in our database to group users and assign them access bundle variations in bulk. These lists help manage access control efficiently—for example, granting all users in a "Beta Testers" list access to a specific variation. We also needed to track who is currently in each list and decide where to place these tables in our database schema.

---

### Database Schema Design
To achieve this, we implemented a relational structure with two main tables: one for the lists themselves and another to track list memberships.

#### 1. `access_lists` Table
This table stores information about each list with the following structure:

##### Core Columns

- **`id` (UUID PRIMARY KEY)**: Unique identifier for the list, automatically generated using `gen_random_uuid()`.
- **`name` (TEXT NOT NULL)**: A human-readable name, e.g., "Beta Testers", enforced as unique via a constraint.
- **`description` (TEXT)**: Optional field for additional context, e.g., "Users testing new AI features."
- **`variation_id` (UUID, REFERENCES `access.bundle_variations`)**: Links the list to a specific access bundle variation, defining the access rights granted to list members.
- **`created_at` (TIMESTAMPTZ)**: Timestamp when the list was created, automatically set.
- **`updated_at` (TIMESTAMPTZ)**: Timestamp when the list was last updated, maintained via a trigger.

##### Extended Columns (For Two-Tier Structure)

- **`list_type` (TEXT)**: Categorizes the list with values:
  - `'custom'` (default): Manually managed list
  - `'auto_bundle'`: Automatically generated and maintained list for a bundle
  - `'auto_variation'`: Automatically generated and maintained list for a variation
  - `'combination'`: List created by combining other lists via set operations
- **`bundle_id` (UUID)**: References `access.bundles.id`, used by auto-bundle lists to track which bundle they're associated with.
- **`source_lists` (UUID[])**: Array of list IDs that serve as sources for a combination list, only used when `list_type` is `'combination'`.
- **`list_operation` (TEXT)**: For combination lists, defines how to combine source lists:
  - `'union'`: Users in ANY source list
  - `'intersection'`: Users in ALL source lists
  - `'difference'`: Users in the first list but not in other lists

#### 2. `list_members` Table
This junction table manages the many-to-many relationship between users and lists.

- **Columns**:
  - `list_id` (UUID, REFERENCES `access.access_lists`): References the list.
  - `user_id` (UUID, REFERENCES `auth.users`): References the user.
  - `created_at` (TIMESTAMPTZ): When the user was added to the list.

- **Primary Key**: A composite key of `(list_id, user_id)` to prevent duplicate memberships.

- **Purpose**: Tracks which users belong to which lists, providing a clear record of current members.

---

### Automatic List Management

In May 2024, we enhanced the system to make the management of auto-generated lists fully automated through database triggers. This ensures lists are always created and kept in sync without manual intervention.

#### Automatic Creation Triggers

When new bundles or variations are created in the system, triggers automatically:
1. Create corresponding auto-lists
2. Name them appropriately based on bundle/variation names
3. Set the correct list type and relationships

```sql
-- Example: When a new bundle is created
CREATE TRIGGER "create_bundle_auto_list"
AFTER INSERT ON "access"."bundles"
FOR EACH ROW
EXECUTE FUNCTION "access"."trigger_bundle_auto_list"();
```

#### Name Synchronization

When bundle or variation names change, triggers automatically update all related auto-list names to maintain consistency:

```sql
-- Example: When a bundle name changes
CREATE TRIGGER "update_bundle_auto_list_names"
AFTER UPDATE ON "access"."bundles"
FOR EACH ROW
EXECUTE FUNCTION "access"."update_bundle_auto_list_names"();
```

#### Access Change Synchronization

The system automatically keeps auto-lists in sync with user access through an enhanced trigger on the `user_access` table:

```sql
CREATE TRIGGER "sync_auto_lists_trigger"
AFTER INSERT OR UPDATE OR DELETE
ON "access"."user_access"
FOR EACH STATEMENT
EXECUTE FUNCTION "access"."trigger_sync_auto_lists"();
```

This trigger ensures that:
1. When user access changes, appropriate auto-lists are updated
2. Combination lists are re-synchronized to reflect these changes
3. The entire system stays consistent automatically

#### Complete Automation Workflow

The complete automation system works as follows:

1. **Bundle/Variation Creation**: Triggers automatically create auto-lists
2. **User Access Changes**: Triggers automatically update list membership
3. **Bundle/Variation Updates**: Triggers ensure list names and descriptions stay in sync
4. **Cascading Updates**: When auto-lists change, combination lists are also updated

This ensures the access list system is self-maintaining, with administrator actions focusing on business decisions rather than technical maintenance.

---

### List Types and Functionality

Our implementation supports four distinct list types, each serving different access control needs:

#### 1. Custom Lists (list_type = 'custom')
- Manually created and managed lists for arbitrary grouping of users
- Administrators explicitly add/remove users from these lists
- Useful for ad-hoc user groups like "Marketing Preview Users" or "External Partners"

#### 2. Auto-Bundle Lists (list_type = 'auto_bundle')
- Automatically generated and maintained lists for users with access to a specific bundle
- Names are prefixed with "Auto: " followed by the bundle name
- System automatically keeps these lists in sync with user access
- Useful for understanding who has access to an entire bundle

#### 3. Auto-Variation Lists (list_type = 'auto_variation')
- Automatically generated and maintained lists for users with access to a specific variation
- Names are prefixed with "Auto: " followed by the bundle and variation names
- System automatically keeps these lists in sync with user access
- Useful for understanding who has access to a specific variation

#### 4. Combination Lists (list_type = 'combination')
- Created by applying set operations to multiple source lists
- Support three operations:
  - **Union**: Users in ANY source list (A ∪ B)
  - **Intersection**: Users in ALL source lists (A ∩ B)
  - **Difference**: Users in the first list but not in other lists (A - B)
- Useful for complex access control scenarios like "All Premium Users except Beta Testers"

---

### Access List Functions

Our implementation includes several database functions to manage these lists:

#### Auto-List Generation
- `generate_bundle_lists()`: Creates auto-generated lists for all bundles
- `generate_variation_lists()`: Creates auto-generated lists for all variations

#### Synchronization Functions
- `sync_auto_bundle_lists()`: Updates auto-bundle lists with current user access
- `sync_auto_variation_lists()`: Updates auto-variation lists with current user access
- `sync_combined_list(list_id)`: Updates a single combination list based on its operation
- `sync_all_auto_lists()`: Synchronizes all auto-generated lists
- `sync_all_combined_lists()`: Synchronizes all combination lists

#### List Management Functions
- `create_access_list(name, description, variation_id)`: Creates a new custom list
- `update_access_list(list_id, name, description, variation_id)`: Updates list properties
- `delete_access_list(list_id)`: Deletes a list and its memberships
- `create_combined_list(name, description, source_lists, list_operation)`: Creates a new combination list

#### Member Management Functions
- `add_users_to_list(list_id, user_ids)`: Adds multiple users to a list
- `remove_users_from_list(list_id, user_ids)`: Removes multiple users from a list
- `get_list_members(list_id)`: Returns all members of a list
- `get_user_lists(user_id)`: Returns all lists that a user belongs to

---

### Implementation Details

#### List-Access Relationship
When a user is added to a list with an associated variation, their access is automatically updated through the `sync_user_access` function, which:

1. Identifies all variation IDs associated with the user through their list memberships
2. Finds all content IDs associated with those variations
3. Grants the user access to all relevant content

#### Auto-List Synchronization Triggers
We've implemented a trigger on the `user_access` table that automatically calls `sync_all_auto_lists()` whenever user access changes, ensuring auto-generated lists always reflect current access rights.

#### Row-Level Security (RLS) Policies
All list-related tables have RLS policies that restrict access to administrators:
- Only users with the 'admin' role can view, create, update, or delete lists
- Only admins can manage list memberships

#### Bulk Access Operations
For efficient bulk operations, we've implemented functions like:
- `grant_list_access(list_id, content_id, access_settings)`: Grants all list members access to specific content
- `revoke_list_access(list_id, content_id)`: Revokes access from all list members
- `sync_list_variation_access(list_id)`: Syncs all access for users in a list based on the list's variation

---

### Two-Tier Structure

Our enhanced implementation uses a two-tier structure for managing access lists:

1. **Base Lists**: These include custom lists and auto-generated lists that directly reflect user membership.
2. **Derived Lists**: Combination lists that are created by applying set operations to base lists.

This structure allows for complex access management while maintaining clear relationships between users and their access rights. When user access changes:

1. Auto-generated lists are automatically updated
2. This triggers updates to combination lists that depend on those auto-lists
3. Access rights are properly recalculated for all affected users

---

### Schema Placement: `access` Schema

We placed both `access_lists` and `list_members` in the `access` schema for:

- **Logical Organization**: Grouping with other access-related tables maintains a clear structure
- **Permission Management**: Schema-level permissions restrict access to authorized users
- **Consistency**: Maintains consistency with our other access control tables

---

### Typical Workflows

#### Creating and Managing Auto-Generated Lists

1. Administrator runs `SELECT access.generate_bundle_lists()` and `SELECT access.generate_variation_lists()`
2. System creates auto-lists for all bundles and variations
3. Lists automatically populate with users who have relevant access
4. When user access changes, auto-lists update via triggers

#### Creating a Combination List

1. Administrator identifies source lists (e.g., "Premium Users" and "Beta Testers")
2. Administrator selects an operation (e.g., "intersection")
3. System creates the combination list and populates it based on set operation
4. When source lists change, administrator can run `SELECT access.sync_combined_list(list_id)` to update

#### Granting Access via Lists

1. Administrator selects a list (e.g., "Marketing Team")
2. Administrator associates the list with a variation (e.g., "Full Premium Access")
3. All users in the list automatically gain access to content defined by that variation
4. Access is tracked and can be revoked in bulk when needed

---

### Final Implementation

Our final implementation provides a flexible, powerful system for managing user access rights:

- **Efficient Bulk Operations**: Grant or revoke access for multiple users at once
- **Clear Membership Tracking**: Always know which users are in which lists
- **Automatic Synchronization**: Auto-generated lists always reflect current access
- **Complex Access Rules**: Combination lists support sophisticated access patterns
- **Performance Optimized**: Denormalized access records for efficient permission checks

The system maintains both the flexibility of manual list management and the consistency of automatically synchronized lists, providing a comprehensive solution for our access control needs.

---

### Technical Schema Reference

```sql
-- access_lists table
CREATE TABLE "access"."access_lists" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "variation_id" UUID REFERENCES "access"."bundle_variations"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "list_type" TEXT NOT NULL DEFAULT 'custom',
    "bundle_id" UUID REFERENCES "access"."bundles"("id") ON DELETE CASCADE,
    "source_lists" UUID[],
    "list_operation" TEXT,
    CONSTRAINT "access_lists_name_unique" UNIQUE ("name"),
    CONSTRAINT "access_lists_list_type_check" 
    CHECK ("list_type" IN ('auto_bundle', 'auto_variation', 'custom', 'combination'))
);

-- list_members table
CREATE TABLE "access"."list_members" (
    "list_id" UUID REFERENCES "access"."access_lists"("id") ON DELETE CASCADE,
    "user_id" UUID REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY ("list_id", "user_id")
);
```

This schema provides a solid foundation for managing access lists while maintaining flexibility for future requirements.