# Design Guidelines: 5G NR Throughput & Link Budget Calculator

## Design Approach

**Selected System**: Material Design with emphasis on data density and technical precision
**Rationale**: This is a utility-focused engineering tool requiring clarity, efficiency, and professional credibility. Material Design's structured approach to forms and data display aligns perfectly with RF engineering workflows.

**Key Principles**:
- Clarity over decoration: Every element serves a functional purpose
- Information density: Maximize usable space without overwhelming
- Professional credibility: Clean, technical aesthetic that inspires confidence
- Efficiency: Quick scanning, minimal cognitive load

## Typography

**Font Stack**: 
- Primary: Inter (via Google Fonts CDN) - excellent readability for technical data
- Monospace: JetBrains Mono - for numerical values and results

**Hierarchy**:
- H1 (Page title): text-2xl, font-semibold (24px)
- H2 (Section headers): text-lg, font-medium (18px)
- Labels: text-sm, font-medium (14px)
- Input values: text-base (16px)
- Results/Output: text-lg, font-semibold for primary metrics
- Helper text: text-xs (12px)

## Layout System

**Spacing Units**: Tailwind units of 2, 3, 4, 6, and 8 (e.g., p-4, gap-6, mt-8)
- Form spacing: gap-4 between fields, gap-6 between sections
- Container padding: p-6 on desktop, p-4 on mobile
- Section separation: mb-8 between major blocks

**Grid Structure**:
- Main container: max-w-7xl mx-auto (wider for data density)
- Parameter grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Results grid: grid-cols-2 md:grid-cols-4 for metrics

## Component Library

### Mode Switcher
- Horizontal pill-style toggle at top
- Active state: filled background, inactive: ghost style
- Fixed position in header alongside title

### Input Groups
- Label above input pattern
- Full-width inputs within grid cells
- Border: border-2 on focus for clear interaction feedback
- Grouped logically by parameter category (RF params, modulation params, TDD params)

### Form Controls
- Select dropdowns: Subtle arrow indicator, adequate padding (p-2)
- Number inputs: Increment/decrement controls visible
- Input validation: Red border for invalid states
- Unit indicators: Inline after label (e.g., "Bandwidth (MHz)")

### Results Display
- Distinct visual container (subtle background)
- Large, bold numbers for primary metrics
- Grid layout for multiple results
- Clear labels with units
- Separate sections for intermediate vs final calculations

### Action Buttons
- Primary actions (Export CSV): Filled style with icons
- Secondary actions (Copy): Outlined style
- Button group: gap-2 spacing, flex layout
- Icons: Use Heroicons via CDN (DocumentArrowDownIcon, ClipboardDocumentIcon)

### Cards/Panels
- Rounded corners: rounded-xl for main panels
- Shadow: shadow-md for depth
- Padding: p-6 for content areas
- Background: Subtle contrast between input areas and results areas

## Navigation & Structure

**Top Bar**:
- App title (left), mode switcher (right)
- Sticky header optional for long parameter lists
- Border-bottom separator

**Content Organization**:
- Single column on mobile, multi-column grid on desktop
- Collapsible advanced parameters section
- Results always visible (sticky or prominent placement)

**Responsive Breakpoints**:
- Mobile: Single column, stacked inputs
- Tablet (md:): 2-column parameter grid
- Desktop (lg:): 3-column parameter grid

## Visual Patterns

**Sections**:
- Input parameters: Lighter background panel
- Calculated results: Subtle highlight background (different from inputs)
- Clear visual boundary between configuration and results

**Data Presentation**:
- Align numerical values right for easy scanning
- Consistent decimal precision display
- Use monospace font for numerical outputs
- Group related metrics together

**Interactive States**:
- Focus: Prominent border treatment
- Hover: Subtle background shift on interactive elements
- Disabled: Reduced opacity (opacity-50)
- Active calculation: Subtle pulse or indicator

## Images

**No hero images required** - This is a technical calculator tool where immediate access to functionality takes priority over marketing visuals.

**Icons**: Use Heroicons for UI affordances (download, copy, info tooltips)

## Technical Considerations

- Real-time calculation feedback: No loading states needed, instant updates
- Precision display: Show appropriate decimal places for engineering accuracy
- Export functionality: Clear download button with icon
- Copy-to-clipboard: Icon button with success feedback
- Validation messaging: Inline, contextual error states

## Special Features

**TDD Slot Configuration**: Conditional display showing custom inputs only when "Custom" option selected
**Advanced Parameters**: Collapsible panel to reduce initial complexity
**Presets**: Quick-select buttons for common configurations (if implemented)
**Comparison Mode**: Side-by-side layout option for scenario comparison (future consideration)