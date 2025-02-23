# ADR-002: Access Templates and Bundles

Thank you for your query. Below, I'll explain how to design a system where **bundles** can include template IDs from either **AI templates** or **content templates**, with the ability to have multiple templates per bundle. I'll also break down how to manage **variations of bundles**, where a single bundle can have different named variations, each with its own set of templates. Let's dive in step by step.

---

## Understanding Templates and Bundles

### Templates
There are two types of templates:

1. **Content Templates**:
   - Used to define access rules for specific content items (e.g., courses, videos, documents).
   - Each content template is linked to a specific content item and includes access rules (e.g., which modules or media are accessible).

2. **AI Templates**:
   - Used to define access to AI tools, suites, or collections.
   - They include an access level (e.g., 'collection', 'suite', 'tool') and a target ID (e.g., the ID of the collection, suite, or tool being accessed).

### Bundles
- A **bundle** is a collection of templates that can include both content templates and AI templates.
- A bundle can have **multiple templates** of either type, allowing flexible combinations (e.g., a bundle might include two content templates and one AI template).
- Bundles simplify granting access by applying multiple templates to a user at once.

### Bundle Variations
- A single bundle can have **variations**, each with a different name and potentially different templates.
- For example, the "Power Bundle" might have:
  - A "Basic" variation with basic templates.
  - A "Premium" variation with more comprehensive templates.
- Each variation is essentially a different version of the bundle, allowing flexibility in pricing, access levels, or user needs.

---

## Database Design for Bundles and Variations

To support bundles with multiple template types and variations, we'll use a database structure with the following tables. I'll explain each table's purpose and columns.

### 1. Content Templates Table (`content_templates`)
- **Purpose**: Stores templates for content access.
- **Columns**:
  - `id` (UUID): Unique identifier for the template.
  - `name` (TEXT): Name of the template (e.g., "Basic Drip for Power Patterns").
  - `content_id` (UUID): ID of the content item this template applies to.
  - `access_overrides` (JSONB): Access rules (e.g., which modules or media are accessible).
  - `created_by` (UUID): Who created the template.
  - `created_at` (TIMESTAMP): When the template was created.

### 2. AI Templates Table (`ai_templates`)
- **Purpose**: Stores templates for AI tool access.
- **Columns**:
  - `id` (UUID): Unique identifier for the template.
  - `name` (TEXT): Name of the template (e.g., "Full AI Collection Access").
  - `access_level` (TEXT): 'collection', 'suite', or 'tool'.
  - `target_id` (UUID): ID of the collection, suite, or tool being accessed.
  - `created_by` (UUID): Who created the template.
  - `created_at` (TIMESTAMP): When the template was created.

### 3. Bundles Table (`bundles`)
- **Purpose**: Represents the main bundle concept (e.g., "Power Bundle").
- **Columns**:
  - `id` (UUID): Unique identifier for the bundle.
  - `name` (TEXT): Name of the bundle (e.g., "Power Bundle").
  - `created_by` (UUID): Who created the bundle.
  - `created_at` (TIMESTAMP): When the bundle was created.

### 4. Bundle Variations Table (`bundle_variations`)
- **Purpose**: Represents different variations of a bundle (e.g., "Basic" or "Premium").
- **Columns**:
  - `id` (UUID): Unique identifier for the variation.
  - `bundle_id` (UUID): ID of the parent bundle (links to `bundles` table).
  - `variation_name` (TEXT): Name of the variation (e.g., "Basic").
  - `created_by` (UUID): Who created the variation.
  - `created_at` (TIMESTAMP): When the variation was created.

### 5. Bundle Templates Table (`bundle_templates`)
- **Purpose**: Links bundle variations to specific templates (either content or AI).
- **Columns**:
  - `id` (UUID): Unique identifier for the link.
  - `bundle_variation_id` (UUID): ID of the bundle variation (links to `bundle_variations` table).
  - `template_type` (TEXT): 'content' or 'ai' (indicates the type of template).
  - `template_id` (UUID): ID of the template (from `content_templates` or `ai_templates`).
  - `created_by` (UUID): Who added the template to the variation.
  - `created_at` (TIMESTAMP): When the template was added.

---

## How It Works

### Creating Templates
- **Content Templates**:
  - Create a content template by specifying the content item and access rules.
  - Example: A template for "Basic Drip for Power Patterns" might allow access to the first module only.
- **AI Templates**:
  - Create an AI template by specifying the access level and target ID.
  - Example: A template for "Full AI Collection Access" might grant access to an entire collection of AI tools.

### Creating Bundles and Variations
1. **Create a Bundle**:
   - Create a bundle with a name (e.g., "Power Bundle").
2. **Create Variations**:
   - For the "Power Bundle", create variations like "Basic" and "Premium".
   - Each variation is linked to the bundle via `bundle_id`.
3. **Add Templates to Variations**:
   - For each variation, add templates using the `bundle_templates` table.
   - Specify whether each template is a content template or an AI template.
   - Example:
     - "Power Bundle - Basic":
       - Content Template: "Basic Drip for Power Patterns" (template_type = 'content').
       - AI Template: "Basic AI Access" (template_type = 'ai').
     - "Power Bundle - Premium":
       - Content Template: "Premium Access for Power Patterns" (template_type = 'content').
       - AI Template: "Full AI Collection Access" (template_type = 'ai').

### Granting Access to Users
- To grant access, select a specific **bundle variation** (e.g., "Power Bundle - Basic").
- For each template in the variation:
  - If it's a **content template**, apply the access rules to the user's content access.
  - If it's an **AI template**, grant the specified AI access (e.g., to a collection, suite, or tool).
- This process can be automated with functions or scripts in your application.

---

## Example Scenario

### Bundle and Variations
- **Bundle**: "Power Bundle"
  - **Variation 1**: "Basic"
    - Content Template: "Basic Drip for Power Patterns" (access to first module).
    - AI Template: "Basic AI Access" (access to a basic suite of AI tools).
  - **Variation 2**: "Premium"
    - Content Template: "Premium Access for Power Patterns" (access to all modules).
    - AI Template: "Full AI Collection Access" (access to an entire AI collection).

### Granting Access
- If a user purchases "Power Bundle - Basic":
  - Apply the "Basic Drip for Power Patterns" content template to their content access.
  - Apply the "Basic AI Access" AI template to their AI access.
- If a user upgrades to "Power Bundle - Premium":
  - Apply the "Premium Access for Power Patterns" content template.
  - Apply the "Full AI Collection Access" AI template.

---

## Benefits of This Design

- **Flexibility**:
  - Bundles can include any combination of content and AI templates.
  - Variations allow multiple versions of a bundle with different templates.
- **Scalability**:
  - The `bundle_templates` table supports multiple templates per variation.
  - Adding new template types in the future is possible by extending `template_type`.
- **Clarity**:
  - Separating bundles and variations makes it easy to manage related but distinct sets of templates.
  - For display purposes, you can combine bundle and variation names (e.g., "Power Bundle - Basic") in the frontend.

---

## Additional Considerations

- **Validation**:
  - Ensure that `template_id` in `bundle_templates` corresponds to a valid ID in the correct table (`content_templates` or `ai_templates`) based on `template_type`.
  - This can be enforced in application logic, scripts, or database triggers.
- **Display**:
  - When showing bundles to users, you can concatenate the bundle name and variation name (e.g., "Power Bundle - Basic") for clarity.
- **Access Management**:
  - For content access, update a `user_access` table with the template's access rules.
  - For AI access, update a `user_ai_access` table with the access level and target ID from the AI template.
  - These updates can be handled by functions or automated processes in your application.

---

## Summary

- **Bundles** can include multiple templates from either **content templates** or **AI templates**, managed via the `bundle_templates` table.
- A single bundle can have **variations** (e.g., "Basic" and "Premium"), each with its own name and set of templates, stored in the `bundle_variations` table.
- The structure is flexible, scalable, and supports granting access to users based on bundle variations.
- Validation and access management can be handled in your application logic or database functions.

This design meets your requirements and provides a robust foundation for managing bundles and variations. Let me know if you need further clarification or adjustments!

## Related Documents
- [ADR-001: Access Control System Redesign](./ADR-001-access-control-system.md) 