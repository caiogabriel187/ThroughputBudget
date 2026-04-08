# 5G NR Calculator - Throughput & Link Budget Tool

## Overview
Professional 5G NR calculator for RF engineers and telecommunications professionals. Provides accurate throughput calculations and comprehensive link budget analysis for 5G New Radio networks.

**Purpose**: Enable RF engineers to quickly calculate 5G network performance metrics including PHY layer throughput, spectral efficiency, path loss, and SINR under various configuration scenarios.

**Current State**: MVP implementation with full throughput and link budget calculators, real-time calculations, CSV export, clipboard functionality, and database-backed calculation history.

## Recent Changes
- **2025-01-24**: Initial implementation
  - Created complete throughput calculator with FDD/TDD support
  - Implemented link budget calculator with FSPL path loss model
  - Built professional Material Design-inspired UI
  - Added CSV export and clipboard copy functionality
  - Configured Inter and JetBrains Mono fonts for optimal readability
- **2026-04-08**: Added PostgreSQL persistence and scenario history
  - Created `calculations` table for saved scenarios
  - Added save/load/delete/search history API endpoints
  - Built sidebar history UI with type filtering

## User Preferences
- **Design System**: Material Design with emphasis on data density and technical precision
- **Typography**: Inter for UI text, JetBrains Mono for numerical values
- **Target Audience**: RF engineers, network planners, telecommunications professionals
- **Use Case**: Quick calculations and scenario analysis for 5G network planning

## Project Architecture

### Technology Stack
- **Frontend**: React with TypeScript, Vite
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: React hooks (useState, useMemo)
- **Backend**: Express.js (minimal, for future extensibility)

### Key Features

#### Throughput Calculator
- Frequency Range selection (FR1/FR2)
- FDD/TDD duplex mode configuration
- Numerology and subcarrier spacing (15-120 kHz)
- Bandwidth configuration (MHz)
- Carrier aggregation support
- PRB calculation (automatic and manual override)
- Modulation schemes (QPSK to 1024QAM)
- Code rate configuration
- MIMO layer support
- TBS scaling factor
- TDD slot format configurations
- Signaling overhead adjustment
- Real-time throughput calculation in Mbps
- Spectral efficiency display

#### Link Budget Calculator
- Transmit power configuration (dBm)
- Antenna gains (Tx/Rx in dBi)
- Cable loss modeling (Tx/Rx)
- Frequency and distance parameters
- Path loss models:
  - FSPL (Free Space Path Loss)
  - Custom path loss input
- Noise figure configuration
- Receiver bandwidth
- Real-time calculations:
  - Path loss
  - Received power
  - Noise floor
  - SINR

#### Export & Sharing
- CSV export for both calculators
- Clipboard copy functionality
- Comprehensive parameter logging in exports

### File Structure
```
client/src/
├── pages/
│   ├── calculator.tsx      # Main calculator component
│   └── not-found.tsx       # 404 page
├── components/ui/          # shadcn components
├── lib/
│   ├── queryClient.ts      # TanStack Query setup
│   └── utils.ts            # Utility functions
├── App.tsx                 # Root component with routing
├── index.css               # Global styles and design tokens
└── main.tsx                # Entry point

server/
├── app.ts                  # Express app configuration
├── routes.ts               # API routes (minimal)
└── storage.ts              # Storage interface (for future features)

shared/
└── schema.ts               # Shared TypeScript types
```

### Design System
- **Color Palette**: Professional blue primary (#0066cc), neutral grays
- **Typography Scale**: 
  - H1: 2xl (24px) - Page titles
  - H2: lg (18px) - Section headers
  - Labels: sm (14px) - Form labels
  - Results: 2xl mono - Numerical outputs
- **Spacing**: Consistent 4/6/8 units throughout
- **Components**: Cards for parameter groups, tabs for mode switching
- **Layout**: Responsive grid (1/2/3 columns based on breakpoint)

### Calculation Methodology

#### Throughput
Based on 3GPP specifications with simplified approximations:
- PRB count: `floor(BW_kHz / (12 * SCS))`
- Spectral efficiency: `modulation_bits × code_rate × MIMO_layers × TBS_scaling`
- Throughput: `BW × spectral_efficiency × DL_fraction × (1 - overhead) × carriers`

#### Link Budget
Standard RF link budget equation:
- Received Power = `Tx_power - Tx_cable_loss + Tx_gain - Path_loss + Rx_gain - Rx_cable_loss - Other_losses`
- FSPL: `20×log10(distance_km) + 20×log10(freq_MHz) + 32.44`
- Noise Floor: `thermal_noise + noise_figure` where thermal = `-174 + 10×log10(bandwidth_Hz)`
- SINR: `Received_power - Noise_floor`

## Development Guidelines
- All calculations are client-side for instant feedback
- No backend persistence in MVP (purely calculation tool)
- Responsive design with mobile-first approach
- Accessibility: proper labels, keyboard navigation, ARIA attributes
- Professional color contrast for technical readability

## Future Enhancements (Post-MVP)
- Additional path loss models (Urban, Rural, Indoor, 3GPP TR 38.901)
- Calculation history with save/load scenarios
- Scenario comparison (side-by-side)
- Graphical visualizations (coverage maps, throughput heatmaps)
- Vendor-specific presets
- Parameter sweep and sensitivity analysis
- Multi-language support
- Dark mode optimization
