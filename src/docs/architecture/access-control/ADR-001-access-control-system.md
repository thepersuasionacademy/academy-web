# ADR-001: Access Control System Redesign

## Status
Proposed - February 2024

## Context
The current access control system for educational content uses a complex combination of `hasAccess` boolean flags and `accessDelay` configurations across multiple levels (Content, Modules, Media, and Media Items). This has led to:
- Inconsistent state management
- Complex inheritance rules
- Difficult-to-maintain code
- Potential performance issues with deep tree traversal

## Decision
Implement a simplified access control system with the following key characteristics:

### 1. Binary Content-Level Access
- **`granted`**: User is enrolled and has base access to the course
- **`denied`**: User has no access to any course content
- Stored in `access_status` field

### 2. Override-Based Access Control
- Only applicable when content-level access is `granted`
- Stored in `access_overrides` JSON field
- Two types of overrides:
  - **`locked`**: Completely restricts access
  - **`pending`**: Implements drip-scheduling

### 3. Hierarchical Structure
```
Content (granted/denied)
├── Module
│   ├── Media
│   │   └── Media Items (inherit from Media)
│   └── Media
│       └── Media Items (inherit from Media)
└── Module
    └── Media
        └── Media Items (inherit from Media)
```

### 4. Data Structure
```typescript
interface AccessControl {
  // Base access
  access_status: 'granted' | 'denied';
  access_starts_at?: Date;
  
  // Overrides
  access_overrides?: {
    modules?: {
      [moduleId: string]: {
        status: 'locked' | 'pending';
        delay?: {
          value: number;
          unit: 'days' | 'weeks' | 'months';
        };
      };
    };
    media?: {
      [mediaId: string]: {
        status: 'locked' | 'pending';
        delay?: {
          value: number;
          unit: 'days' | 'weeks' | 'months';
        };
      };
    };
  };
}
```

### 5. Key Rules
1. Content-level `denied` status overrides all other settings
2. Media Items always inherit access status from parent Media
3. Overrides only apply when content-level status is `granted`
4. No direct access control on Media Items

## Consequences

### Positive
1. **Simplified State Management**
   - Clear, predictable states
   - Easier to reason about access rules
   - Reduced complexity in code

2. **Better Performance**
   - Fewer database queries needed
   - Simpler tree traversal
   - More efficient caching possible

3. **Improved Maintainability**
   - Clearer code structure
   - Fewer edge cases
   - Better separation of concerns

4. **Enhanced User Experience**
   - More predictable behavior
   - Clearer UI states
   - Faster access checks

### Negative
1. **Migration Required**
   - Need to convert existing access settings
   - Temporary complexity during transition
   - Potential for migration edge cases

2. **Less Granular Control**
   - No direct Media Item level control
   - Some complex access patterns may need redesign

## Implementation Plan

### Phase 1: Database Updates
```sql
-- Add new columns
ALTER TABLE access.user_access
ADD COLUMN access_status text CHECK (access_status IN ('granted', 'denied')),
ADD COLUMN access_overrides jsonb;

-- Create indexes
CREATE INDEX idx_user_access_status ON access.user_access(access_status);
CREATE INDEX idx_user_access_overrides ON access.user_access USING gin(access_overrides);
```

### Phase 2: Backend Logic
1. Update RPCs for new access model
2. Implement migration scripts
3. Add validation functions
4. Update access check logic

### Phase 3: Frontend Updates
1. Modify state management
2. Update UI components
3. Implement new access controls
4. Update access visualization

### Phase 4: Testing & Validation
1. Unit tests for new logic
2. Integration tests
3. Migration testing
4. Performance testing

### Phase 5: Cleanup
1. Remove old columns
2. Clean up deprecated code
3. Update documentation
4. Monitor for issues

## References
- Previous implementation in `src/app/profile/components/content/`
- Access control components
- Database schema
- Frontend state management

## Notes
- Keep this document updated as implementation progresses
- Document any deviations or additional requirements
- Track migration issues and resolutions 