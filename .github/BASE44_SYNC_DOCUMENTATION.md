# Base44 Visual Editor Sync Documentation

## Overview

This document explains how the Base44 visual editor synchronization system works with the Enterprise Hub GitHub repository. The sync system enables the Base44 platform to automatically detect and render code changes from GitHub in its visual canvas.

## Architecture

The sync system consists of three main configuration files:

### 1. `.github/sync-manifest.json`

**Purpose**: Comprehensive manifest documenting all pages, components, and their relationships.

**Key Sections**:
- **metadata**: Framework, build tool, styling information
- **pages**: All application pages with routes and data bindings
- **components**: Organized by category (dashboard, agent, architecture, policy, rbac, ui)
- **tailwind_theme**: Theme configuration and commonly used utility classes
- **entity_models**: List of all Base44 entities used in the application
- **sync_attributes**: Sync configuration settings

**Example Entry**:
```json
{
  "id": "dashboard",
  "path": "src/pages/Dashboard.jsx",
  "name": "Dashboard",
  "route": "/",
  "data_bindings": ["User", "Agent", "Architecture", "ComplianceFramework", "Activity"],
  "components_used": ["MetricCard", "ActivityFeed", "QuickActionCard"],
  "data_b44_sync": "page-dashboard"
}
```

### 2. `base44.config.json`

**Purpose**: Platform configuration for Base44 integration and visual editor settings.

**Key Settings**:

```json
{
  "visualEditor": {
    "enabled": true,
    "canvasMode": "visual-render",  // Forces visual rendering instead of "Synced" status
    "attributePrefix": "data-b44-sync",
    "elementsTreeSync": true,
    "previewRefreshOnSync": true,
    "showSyncedStatus": false,  // Disables "Synced" status message
    "autoDetectChanges": true
  }
}
```

**Important Flags**:
- `showSyncedStatus: false` - Stops showing the "Synced" status
- `canvasMode: "visual-render"` - Forces actual visual rendering
- `autoDetectChanges: true` - Automatically detects GitHub changes
- `elementsTreeSync: true` - Syncs with Elements tree panel

### 3. `src/models/schema.json`

**Purpose**: Complete JSON Schema definition for all Base44 entities.

**Entities Defined**:
1. User
2. Agent
3. Architecture
4. Policy
5. ComplianceFramework
6. Activity
7. Cost
8. Metric

**Features**:
- JSON Schema draft-07 compliant
- Type definitions for all fields
- Relationship mappings between entities
- Validation rules and constraints
- Index definitions for optimized queries

## Sync Attributes (`data-b44-sync`)

### What Are They?

HTML data attributes added to React components to enable visual editor mapping.

### Format
```jsx
<div data-b44-sync="component-name">
  {/* Component content */}
</div>
```

### Where Applied

#### Pages
- `data-b44-sync="page-dashboard"` - Dashboard page
- `data-b44-sync="page-agents"` - Agents page
- `data-b44-sync="page-architectures"` - Architectures page
- `data-b44-sync="page-policies"` - Policies page
- `data-b44-sync="page-compliance"` - Compliance page

#### Components
- `data-b44-sync="component-metric-card"` - MetricCard component
- `data-b44-sync="component-activity-feed"` - ActivityFeed component
- `data-b44-sync="component-quick-action-card"` - QuickActionCard component
- `data-b44-sync="component-permission-gate"` - PermissionGate component

#### Layout Sections
- `data-b44-sync="metrics-grid"` - Dashboard metrics grid

## How It Works

### 1. GitHub Push Detection

When code is pushed to GitHub:
1. Base44 detects changes via webhook or polling
2. Reads `.github/sync-manifest.json` from the repository
3. Compares manifest with current visual canvas state

### 2. Component Scanning

Base44 scans for components marked in the manifest:
1. Looks for `data-b44-sync` attributes in the code
2. Maps components to visual blocks in the canvas
3. Creates missing visual elements automatically

### 3. Schema Synchronization

The "Data" tab syncs with `src/models/schema.json`:
1. Reads entity definitions from schema file
2. Auto-generates visual data-binding nodes
3. Updates data panel with new fields

### 4. Visual Styles Mapping

Tailwind classes are mapped to Visual Styles panel:
1. Extracts Tailwind classes from components
2. Maps to visual style controls
3. Enables visual editing of styles

### 5. Preview Refresh

Finally, the preview window refreshes:
1. Loads latest component versions
2. Applies visual changes
3. Shows live preview of the application

## Tailwind CSS Classes Documentation

### Common Layout Classes
- `grid`, `grid-cols-1`, `md:grid-cols-3`
- `flex`, `items-center`, `justify-between`
- `p-6`, `p-8`, `gap-6`, `mb-8`

### Typography Classes
- `text-3xl`, `text-2xl`, `text-lg`
- `font-bold`, `font-medium`, `font-semibold`
- `text-slate-900`, `text-slate-500`

### Component Styling
- `bg-white`, `rounded-xl`
- `border`, `border-slate-200`
- `shadow-lg`, `hover:shadow-lg`
- `transition-all`, `duration-300`

### Color Palette
- **Primary**: `bg-slate-900`, `text-slate-900`
- **Accents**: `bg-blue-50`, `text-blue-600`
- **Success**: `bg-green-50`, `text-green-600`
- **Warning**: `bg-yellow-50`, `text-yellow-600`
- **Error**: `bg-red-50`, `text-red-600`
- **Info**: `bg-purple-50`, `text-purple-600`

## Entity Data Bindings

### Data Flow

```
Component → useQuery → Base44 SDK → Entity API → Database
```

### Example Bindings

**Dashboard Page**:
- `User` - Current user information
- `Agent` - List of AI agents
- `Architecture` - Architecture designs
- `ComplianceFramework` - Compliance frameworks
- `Activity` - Recent activity log

**Agent Page**:
- `Agent` - Agent CRUD operations
- `User` - Creator information

**Architecture Page**:
- `Architecture` - Architecture CRUD operations
- `User` - Creator information

## Troubleshooting

### Visual Editor Not Updating

**Issue**: Changes pushed to GitHub but visual editor still shows "Synced"

**Solution**:
1. Verify `base44.config.json` has `showSyncedStatus: false`
2. Check `canvasMode` is set to `"visual-render"`
3. Ensure `.github/sync-manifest.json` is committed
4. Verify webhook/polling is active in Base44 settings

### Components Not Appearing in Elements Tree

**Issue**: Components exist in code but not visible in Elements tree

**Solution**:
1. Add `data-b44-sync` attribute to component root element
2. Update `.github/sync-manifest.json` with component entry
3. Commit and push changes
4. Wait for auto-sync or manually trigger sync

### Schema Not Syncing

**Issue**: New entity fields not appearing in Data panel

**Solution**:
1. Update `src/models/schema.json` with new fields
2. Ensure JSON is valid (use JSON validator)
3. Commit and push schema changes
4. Refresh Data panel in visual editor

### Tailwind Classes Not Mapping

**Issue**: Tailwind classes not appearing in Visual Styles panel

**Solution**:
1. Use standard Tailwind classes (no arbitrary values)
2. Add commonly used classes to `tailwind_theme.utilities` in manifest
3. Ensure `tailwind.config.js` is properly configured
4. Re-sync to update style mappings

## Best Practices

### 1. Consistent Sync Attributes

Use descriptive, hierarchical naming:
- **Pages**: `page-{name}`
- **Components**: `component-{name}`
- **Sections**: `{context}-{name}`

### 2. Keep Manifest Updated

Update `.github/sync-manifest.json` when:
- Adding new pages
- Creating new components
- Changing component relationships
- Updating data bindings

### 3. Schema Maintenance

Keep `src/models/schema.json` accurate:
- Add new entities immediately
- Document field types and constraints
- Update relationships when entities change
- Include examples for complex fields

### 4. Semantic HTML

Use semantic HTML elements for better visual editor mapping:
- `<section>` for major sections
- `<article>` for content blocks
- `<nav>` for navigation
- `<main>` for main content

### 5. Component Organization

Organize components by feature:
- `components/dashboard/` - Dashboard-specific
- `components/agent/` - Agent-related
- `components/architecture/` - Architecture-related
- `components/ui/` - Reusable UI primitives
- `components/rbac/` - Permission-related

## API Reference

### Sync Manifest Schema

```typescript
interface SyncManifest {
  version: string;
  repository: string;
  last_sync: string;
  metadata: {
    framework: string;
    build_tool: string;
    styling: string;
    component_library: string;
    backend: string;
  };
  pages: Page[];
  components: ComponentCategory;
  tailwind_theme: TailwindTheme;
  entity_models: string[];
  sync_attributes: SyncAttributes;
}
```

### Base44 Config Schema

```typescript
interface Base44Config {
  platform: PlatformConfig;
  sync: SyncConfig;
  visualEditor: VisualEditorConfig;
  entities: EntitiesConfig;
  styling: StylingConfig;
  routing: RoutingConfig;
  stateManagement: StateManagementConfig;
  authentication: AuthConfig;
  build: BuildConfig;
  deployment: DeploymentConfig;
}
```

## Version History

- **v1.0.0** (2026-01-12): Initial implementation
  - Created sync manifest with 14 pages
  - Documented 75+ components
  - Defined 8 entity schemas
  - Added sync attributes to key components
  - Configured visual editor settings

## Support

For issues with Base44 visual editor sync:

1. Check configuration files are valid JSON
2. Verify all required fields are present
3. Ensure GitHub webhooks are active
4. Review Base44 platform logs
5. Contact Base44 support if issues persist

## Additional Resources

- [Base44 SDK Documentation](https://docs.base44.com)
- [Enterprise Hub Architecture](../ARCHITECTURE.md)
- [Database Schema](../DATABASE_SCHEMA.md)
- [Component Documentation](../README.md)
