# ADR-003: Access Lists

## Status
Proposed - [Month] [Year]

Here’s a detailed overview of how to handle creating lists in your Supabase database and app UI to manage access via access bundle variations in bulk, while ensuring proper records of the people currently in those lists. Since you’re using Supabase (built on PostgreSQL), we’ll leverage its relational capabilities to design an efficient and organized solution. Let’s break it down step by step.

---

### Understanding the Goal
You want to create "lists" in your database to group users and assign them access bundle variations in bulk. These lists will help you manage access control efficiently—for example, granting all users in a "Beta Testers" list access to a specific variation. You also need to track who is currently in each list and decide where to place these tables in your database schema (`public` or `access`).

---

### Database Schema Design
To achieve this, we’ll use a relational structure with two main tables: one for the lists themselves and another to track list memberships. Here’s the recommended setup:

#### 1. `access_lists` Table
This table will store information about each list.

- **Columns**:
  - `id` (SERIAL PRIMARY KEY): Unique identifier for the list.
  - `name` (TEXT): A human-readable name, e.g., "Beta Testers."
  - `description` (TEXT): Optional field for additional context, e.g., "Users testing new AI features."
  - `variation_id` (INTEGER, FOREIGN KEY to `access_bundle_variations`): Links the list to a specific access bundle variation, defining the access rights granted to list members.

- **Purpose**: Each list is tied to one access bundle variation, ensuring that all users in the list inherit the access defined by that variation.

#### 2. `list_members` Table
This junction table manages the many-to-many relationship between users and lists (since a user can be in multiple lists, and a list can have multiple users).

- **Columns**:
  - `list_id` (INTEGER, FOREIGN KEY to `access_lists.id`): References the list.
  - `user_id` (UUID or INTEGER, FOREIGN KEY to `users.id`): References the user (assumes you have a `users` table).

- **Primary Key**: A composite key of `(list_id, user_id)` to prevent duplicate memberships.

- **Purpose**: Tracks which users belong to which lists, providing a clear record of current members.

#### Optional: `user_access` Table
For performance, you might want a denormalized table to store each user’s access rights directly, updated whenever list memberships change.

- **Columns** (example for content access):
  - `user_id` (FOREIGN KEY to `users.id`): The user.
  - `content_id` (FOREIGN KEY to a content table): The resource they can access.
  - `access_type` (TEXT): E.g., "full" or "drip."

- **Purpose**: Simplifies access checks by avoiding complex joins across `list_members`, `access_lists`, and `access_bundle_variations`. This is optional and depends on your performance needs.

---

### Schema Placement: `access` vs. `public`
Supabase uses the `public` schema by default, but you can create custom schemas like `access` to organize related tables. Since these lists are directly tied to access control (granting access via bundle variations), I recommend placing both `access_lists` and `list_members` in the `access` schema. Here’s why:

- **Logical Organization**: Grouping access-related tables (e.g., `access_bundle_variations`, `access_lists`, `list_members`) in the `access` schema keeps your database structure clear and intuitive.
- **Permission Management**: You can set schema-level permissions in PostgreSQL, restricting access to the `access` schema for specific roles (e.g., admin users) while keeping other schemas (like `public`) more open.
- **Consistency**: If you already have an `access` schema for access-related tables, adding these tables there maintains consistency.

If you don’t have an `access` schema yet, you can create it with:
```sql
CREATE SCHEMA access;
```
Then define the tables as:
```sql
CREATE TABLE access.access_lists (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    variation_id INTEGER REFERENCES access.access_bundle_variations(id)
);

CREATE TABLE access.list_members (
    list_id INTEGER REFERENCES access.access_lists(id),
    user_id UUID REFERENCES auth.users(id), -- Adjust based on your users table
    PRIMARY KEY (list_id, user_id)
);
```

---

### Managing Access Logic
When a user is added to or removed from a list, their access should reflect the associated variation. Here’s how to handle it:

1. **Adding a User to a List**:
   - Insert a row into `list_members`.
   - Update the user’s access based on the `variation_id` of the list. For example, if the variation grants access to specific content or AI tools, ensure the user’s permissions reflect this.

2. **Removing a User from a List**:
   - Delete the row from `list_members`.
   - Recalculate the user’s access to ensure they don’t lose rights granted through other lists or direct assignments.

#### Implementation Options
- **Application Logic**: When your app UI updates `list_members`, call a function (e.g., `update_user_access(user_id)`) to recalculate and update the `user_access` table or equivalent access records.
- **Database Triggers**: Create a PostgreSQL trigger on `list_members` to automatically update `user_access` after inserts or deletes. Example:
  ```sql
  CREATE FUNCTION access.sync_user_access() RETURNS TRIGGER AS $$
  BEGIN
      -- Logic to update user_access based on list membership
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER update_access
  AFTER INSERT OR DELETE ON access.list_members
  FOR EACH ROW EXECUTE FUNCTION access.sync_user_access();
  ```
- **Periodic Sync**: Run a batch job to sync access periodically, though real-time updates are preferable for immediate accuracy.

#### Access Checks
To verify a user’s access (e.g., to a content item):
- **With `user_access`**: Query the denormalized table directly (fastest).
- **Without `user_access`**: Join `list_members`, `access_lists`, and `access_bundle_variations` to determine if any of the user’s lists grant access via their variations.

---

### App UI Functionality
In your application’s admin interface, you’ll need features to manage these lists effectively:

#### List Management
- **Create a List**: Form with fields for `name`, `description`, and a dropdown to select an `access_bundle_variation`.
- **Edit a List**: Update `name`, `description`, or `variation_id`.
- **Delete a List**: Remove the list and its `list_members` entries (with a confirmation prompt).

#### Member Management
- **View Members**: Display a table of users in the list (query `list_members` joined with `users`).
- **Add Users**: Search or select users (e.g., by email or ID) and insert into `list_members`.
- **Remove Users**: Select users from the list and delete their `list_members` rows.

Whenever a user is added or removed, trigger the access update logic (e.g., call `update_user_access(user_id)`).

---

### Example Workflow
1. **Create a List**:
   - Admin creates "Beta Testers" with `variation_id` for "AI Tool Suite Access."
   - Inserts into `access_lists`.

2. **Add Users**:
   - Admin adds users A, B, and C to "Beta Testers."
   - Inserts rows into `list_members`.
   - Access logic grants A, B, and C the AI Tool Suite access.

3. **Check Access**:
   - Query checks if user A can access an AI tool.
   - Finds A in "Beta Testers," linked to the variation granting access.

4. **Remove a User**:
   - Admin removes user B from "Beta Testers."
   - Deletes B’s `list_members` row.
   - Access logic updates B’s permissions, revoking AI Tool Suite access unless granted elsewhere.

---

### Final Recommendation
- **Tables**: Use `access_lists` and `list_members` in the `access` schema.
- **Schema Choice**: `access` for consistency and organization with access-related functionality.
- **Access Management**: Use application logic or triggers to sync access (optionally with a `user_access` table for performance).
- **UI**: Build intuitive list and member management features, tied to your access update logic.

This setup is simple yet scalable, ensuring you can bulk-assign access bundle variations while maintaining accurate records of list memberships. Let me know if you need help with specific SQL queries, UI designs, or access logic details!