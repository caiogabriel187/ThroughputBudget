# 5G NR Calculator - Throughput & Link Budget Tool

## Overview
Professional 5G NR calculator for RF engineers and telecommunications professionals. Provides accurate throughput calculations and comprehensive link budget analysis for 5G New Radio networks.

**Purpose**: Enable RF engineers to quickly calculate 5G network performance metrics including PHY layer throughput, spectral efficiency, path loss, and SINR under various configuration scenarios.

**Current State**: Full-featured tool with throughput and link budget calculators, 7 path loss models (including 3GPP TR 38.901), vendor presets, interactive charts, CSV export, clipboard functionality, and in-memory calculation history with graceful DB fallback.

## Recent Changes
- **2025-01-24**: Initial implementation
  - Created complete throughput calculator with FDD/TDD support
  - Implemented link budget calculator with FSPL path loss model
  - Built professional Material Design-inspired UI
  - Added CSV export and clipboard copy functionality
  - Configured Inter and JetBrains Mono fonts for optimal readability
- **2026-04-08**: Major feature additions
  - Added PostgreSQL persistence and scenario history (with in-memory fallback)
  - Added 6 new 3GPP TR 38.901 path loss models (UMa LOS/NLOS, UMi LOS/NLOS, RMa LOS, Indoor LOS)
  - Added 4 vendor presets: Ericsson AIR 6449, Nokia AirScale, Huawei AAU5636, Samsung mmWave
  - Added interactive charts: Throughput vs Bandwidth, Path Loss vs Distance (all models)
  - Added SINR quality indicator (Excellent/Good/Marginal/Poor)
  - Switched to postgres-js driver with SSL; in-memory storage fallback when DB unavailable
  - Storage layer: LazyStorage proxy with graceful DB → MemStorage fallback

## User Preferences
- **Design System**: Material Design with emphasis on data density and technical precision
- **Typography**: Inter for UI text, JetBrains Mono for numerical values
- **Target Audience**: RF engineers, network planners, telecommunications professionals
- **Use Case**: Quick calculations and scenario analysis for 5G network planning

## Project Architecture

### Technology Stack
- **Frontend**: React with TypeScript, Vite, Recharts for visualizations
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: React hooks (useState, useMemo)
- **Backend**: Express.js with PostgreSQL (Drizzle ORM, postgres-js driver)
- **Storage**: LazyStorage proxy — tries DB first, falls back to in-memory

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
- TDD slot format configurations (including custom DL fraction)
- Signaling overhead adjustment
- Real-time throughput calculation in Mbps
- Spectral efficiency display

#### Link Budget Calculator
- Transmit power configuration (dBm)
- Antenna gains (Tx/Rx in dBi)
- Cable loss modeling (Tx/Rx)
- Frequency and distance parameters
- **7 Path Loss Models**:
  - FSPL (Free Space Path Loss)
  - 3GPP TR 38.901 UMa LOS / NLOS
  - 3GPP TR 38.901 UMi LOS / NLOS
  - 3GPP TR 38.901 RMa LOS
  - 3GPP TR 38.901 Indoor LOS
  - Custom path loss input
- Noise figure configuration
- Receiver bandwidth
- Real-time calculations: path loss, received power, noise floor, SINR
- SINR quality indicator (Excellent/Good/Marginal/Poor)

#### Vendor Presets
- Ericsson AIR 6449 (3.5 GHz, 100 MHz TDD, 8×8 MIMO)
- Nokia AirScale (3.5 GHz, 100 MHz TDD, CA×2, 8×8 MIMO)
- Huawei AAU5636 (2.6 GHz, 100 MHz TDD, 64T64R)
- Samsung mmWave (28 GHz, 400 MHz FR2, 4×4 MIMO)

#### Charts
- Throughput vs Bandwidth sweep (all standard 5G NR bandwidths)
- Path Loss vs Distance comparison (all 6 models side-by-side)

#### Export & Sharing
- CSV export for both calculators
- Clipboard copy functionality
- Scenario save/load/delete/search (history)

### File Structure
```
client/src/
├── pages/
│   ├── calculator.tsx      # Main calculator component (all features)
│   └── not-found.tsx       # 404 page
├── components/
│   ├── save-calculation-dialog.tsx  # Save scenario dialog
│   ├── calculation-history.tsx      # History sidebar
│   └── ui/                         # shadcn components
├── lib/
│   ├── queryClient.ts      # TanStack Query setup
│   └── utils.ts            # Utility functions
├── App.tsx                 # Root component with routing
├── index.css               # Global styles and design tokens
└── main.tsx                # Entry point

server/
├── app.ts                  # Express app configuration
├── routes.ts               # API routes
├── storage.ts              # Storage interface + LazyStorage proxy + MemStorage
└── db-storage.ts           # DrizzleORM database storage (lazily imported)

db/
└── index.ts                # postgres-js + Drizzle connection (SSL required)

shared/
└── schema.ts               # Shared TypeScript types + Drizzle schema
```

### Design System
- **Color Palette**: Professional blue primary (#0066cc), neutral grays
- **Typography Scale**: 
  - H1: 2xl (24px) - Page titles
  - H2: lg (18px) - Section headers
  - Labels: sm (14px) - Form labels
  - Results: 2xl/3xl mono - Numerical outputs
- **Spacing**: Consistent 4/6/8 units throughout
- **Components**: Cards for parameter groups, tabs for mode switching
- **Layout**: 2/3 + 1/3 grid on desktop (calculator + history sidebar)

### Calculation Methodology

#### Throughput
Based on 3GPP specifications:
- PRB count: `floor(BW_kHz / (12 × SCS))`
- Spectral efficiency: `modulation_bits × code_rate × MIMO_layers × TBS_scaling`
- Throughput: `BW × spectral_efficiency × DL_fraction × (1 - overhead) × carriers`

#### Link Budget
Standard RF link budget:
- Received Power = `Tx_power - Tx_cable_loss + Tx_gain - Path_loss + Rx_gain - Rx_cable_loss - Other_losses`
- FSPL: `20×log10(d_km) + 20×log10(f_MHz) + 32.44`
- UMa LOS: `28 + 22×log10(d3D_m) + 20×log10(f_GHz)` (3GPP TR 38.901)
- UMa NLOS: `13.54 + 39.08×log10(d3D_m) + 20×log10(f_GHz) - 0.6×(hUT-1.5)`
- UMi LOS: `32.4 + 21×log10(d3D_m) + 20×log10(f_GHz)` (3GPP TR 38.901)
- UMi NLOS: `35.3×log10(d3D_m) + 22.4 + 21.3×log10(f_GHz) - 0.3×(hUT-1.5)`
- RMa LOS: Full 3GPP TR 38.901 formula with building height correction
- Indoor LOS: `32.4 + 17.3×log10(d3D_m) + 20×log10(f_GHz)`
- Noise Floor: `thermal_noise + noise_figure` where thermal = `-174 + 10×log10(B_Hz)`
- SINR: `Received_power - Noise_floor`

## Development Guidelines
- All calculations are client-side for instant feedback
- Storage: LazyStorage → DbStorage (postgres-js + SSL) → MemStorage fallback
- Responsive design with mobile-first approach
- Accessibility: proper labels, keyboard navigation, ARIA attributes
- Professional color contrast for technical readability

## Future Enhancements (Post-MVP)
- Scenario comparison (side-by-side view)
- Parameter sweep / sensitivity analysis
- Dark mode optimization
- Multi-language support
- Graphical coverage map simulation
