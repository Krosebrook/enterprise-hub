# Enterprise Hub

**Enterprise AI Governance, Compliance, and Architecture Management Platform**

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Security](https://img.shields.io/badge/security-view%20policy-orange.svg)](./SECURITY.md)

## Overview

Enterprise Hub is a comprehensive platform for managing AI agents, cloud architectures, policies, compliance frameworks, and costs across your organization. Built with React 18, Vite 6, and the Base44 serverless platform.

### Key Features

- 🤖 **Agent Management**: AI agent lifecycle management with deployment tracking
- 🏗️ **Architecture Designer**: Visual cloud architecture design with Terraform code generation
- 📋 **Policy Management**: Policy creation, enforcement, and compliance tracking
- ✅ **Compliance Tracking**: Multi-framework support (SOC2, HIPAA, GDPR, ISO 27001, PCI DSS)
- 💰 **Cost Management**: Multi-cloud cost tracking and optimization
- 📊 **Observability**: Real-time monitoring, metrics, and alerting
- 📝 **Audit Logging**: Comprehensive audit trail for governance
- 🔐 **RBAC**: Role-based access control (Admin, Developer, Viewer, Auditor)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Base44 account and application credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Krosebrook/enterprise-hub.git
cd enterprise-hub
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Base44 credentials:
```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

Example:
```
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-enterprise-hub-81bfaad7.base44.app
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Technology Stack

### Frontend
- **React** 18.2.0 - UI framework
- **Vite** 6.1.0 - Build tool and dev server
- **Tailwind CSS** 3.4.17 - Utility-first CSS
- **Radix UI** - Accessible component primitives
- **React Query** 5.84.1 - Server state management
- **React Router** 6.26.0 - Client-side routing
- **Lucide React** 0.475.0 - Icons
- **Recharts** 2.15.4 - Data visualization
- **Zod** 3.24.2 - Schema validation

### Backend
- **Base44 SDK** 0.8.3 - Serverless platform integration
- **Deno** - Serverless function runtime
- **TypeScript** 5.8.2 - Type safety for functions

## Project Structure

```
enterprise-hub/
├── src/
│   ├── api/              # Base44 SDK configuration
│   ├── components/       # React components (59 components)
│   │   ├── architecture/ # Architecture-specific components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── policy/       # Policy components
│   │   ├── rbac/         # RBAC components
│   │   └── ui/           # Radix UI wrappers (40+ components)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and contexts
│   ├── pages/            # Application pages (12 pages)
│   ├── utils/            # Utility functions
│   └── pages.config.js   # Page routing configuration
├── functions/            # Backend serverless functions
│   └── generateTerraform.ts  # Terraform code generation
├── public/               # Static assets
└── docs/                 # Documentation (in root)
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server

# Building
npm run build        # Production build
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint (with --quiet flag)
npm run lint:fix     # Auto-fix ESLint issues
npm run typecheck    # TypeScript type checking
```

## Documentation

Comprehensive documentation is available:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design patterns
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Entity schemas and data relationships
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - API reference and examples
- **[MVP_ROADMAP.md](./MVP_ROADMAP.md)** - Product roadmap and feature planning
- **[SECURITY.md](./SECURITY.md)** - Security policies and vulnerability reporting
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes
- **[.github/FEATURE_TO_PR_TEMPLATE.md](./.github/FEATURE_TO_PR_TEMPLATE.md)** - Feature development workflow
- **[.github/copilot-instructions.md](./.github/copilot-instructions.md)** - GitHub Copilot guidelines

## Application Pages

1. **Dashboard** - Overview metrics, activity feed, quick actions
2. **Agents** - AI agent management and lifecycle tracking
3. **Agent Create** - Create new AI agents
4. **Architectures** - Cloud architecture listing
5. **Architecture Designer** - Visual architecture design with drag-and-drop
6. **Policies** - Governance policy management
7. **Policy Create** - Create new policies
8. **Compliance** - Multi-framework compliance tracking
9. **Users** - User management with RBAC
10. **Costs** - Multi-cloud cost tracking and visualization
11. **Observability** - Real-time metrics and monitoring
12. **Audit Log** - Comprehensive activity audit trail

## Key Features Detail

### Agent Management
- Create and manage AI agents (GPT-4, Claude, etc.)
- Track deployment status and lifecycle
- Monitor agent costs per request
- Compliance status tracking

### Architecture Designer
- Visual drag-and-drop architecture design
- Support for AWS, GCP, and Azure
- Terraform code generation with one click
- Component library (VPC, Kubernetes, RDS, etc.)

### Compliance Tracking
- SOC2, HIPAA, GDPR, ISO 27001, PCI DSS frameworks
- Automated compliance score calculation
- Requirements tracking with evidence
- Certification management

### Cost Management
- Multi-cloud cost aggregation
- Agent usage cost tracking
- Cost trends and forecasting
- Budget alerts (planned)

## Development Guidelines

### Code Style
- Follow existing patterns in the codebase
- Use functional components with hooks
- Leverage Tailwind CSS for styling
- Use Radix UI components for consistency
- Add PropTypes or TypeScript types

### Component Development
1. Check existing components in `src/components/ui/` first
2. Follow the composition pattern
3. Use React Query for data fetching
4. Implement loading and error states
5. Make components responsive (mobile-first)

### Best Practices
- Use `useQuery` for data fetching
- Use `useMutation` for data updates
- Implement optimistic updates where appropriate
- Add proper error handling and user feedback
- Follow the RBAC pattern with `PermissionGate`

## Known Issues & Security

### Security Vulnerabilities
The project currently has **8 known vulnerabilities** in dependencies:
- 1 Critical (jspdf)
- 1 High (glob)
- 6 Moderate (various)

See [SECURITY.md](./SECURITY.md) for details and mitigation status.

### Code Quality
- 54 ESLint warnings (mostly unused imports) - Run `npm run lint:fix` to fix
- Testing infrastructure not yet implemented (planned for Phase 3)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Pull Request Guidelines
- Follow the [FEATURE_TO_PR_TEMPLATE.md](./.github/FEATURE_TO_PR_TEMPLATE.md)
- Include tests for new features
- Update documentation as needed
- Ensure all CI checks pass

## Roadmap

See [MVP_ROADMAP.md](./MVP_ROADMAP.md) for detailed product roadmap.

**Current Phase**: Phase 3 - Testing & Security  
**Next Feature**: Real-Time Collaboration in Architecture Designer  
**Target MVP**: Version 1.0.0 (Week 20)

## Support

- **Issues**: [GitHub Issues](https://github.com/Krosebrook/enterprise-hub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Krosebrook/enterprise-hub/discussions)
- **Documentation**: See docs folder and markdown files in root

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- Built with [Base44](https://base44.com) serverless platform
- UI components from [Radix UI](https://www.radix-ui.com)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Icons from [Lucide](https://lucide.dev)

---

**Version**: 0.2.0  
**Last Updated**: 2025-01-07  
**Maintained by**: Enterprise Hub Team
