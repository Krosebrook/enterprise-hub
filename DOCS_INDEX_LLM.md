# Documentation Index for LLMs

This index helps AI assistants and LLM-based agents quickly identify relevant sections within the full documentation suite of the Enterprise Hub project.

## Core Documentation Files

### Governance & Process

- **[DOC_POLICY.md](./DOC_POLICY.md)**: Outlines the governance, versioning, and approval process for all project documentation. Defines documentation standards, review workflows, and maintenance procedures.

- **[AGENTS_DOCUMENTATION_AUTHORITY.md](./AGENTS_DOCUMENTATION_AUTHORITY.md)**: Details the architecture and implementation of the AI-driven Documentation Authority system. Explains how AI agents contribute to and maintain project documentation.

### Security & Compliance

- **[SECURITY.md](./SECURITY.md)**: Comprehensive overview of the application's security architecture, data handling, and compliance measures. Includes vulnerability reporting, security best practices, and supported versions.

- **[ENTITY_ACCESS_RULES.md](./ENTITY_ACCESS_RULES.md)**: Detailed explanation of role-based access control (RBAC) rules for each database entity. Defines permissions for Admin, Developer, Viewer, and Auditor roles across all entities (Agent, Architecture, Policy, Cost, etc.).

### Technical Architecture

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: High-level architectural overview of the entire system. Covers system architecture, technology stack, data architecture, frontend/backend structure, security architecture, and design patterns.

- **[FRAMEWORK.md](./FRAMEWORK.md)**: Describes the core technologies, libraries, and architectural patterns used in the project. Includes details on React 18, Vite 6+, Tailwind CSS, Radix UI, Base44 backend, and other key dependencies.

### API & Integration

- **[API_REFERENCE.md](./API_REFERENCE.md)**: Provides a reference for available API endpoints and how to interact with them. Covers Base44 Entity APIs, serverless functions, authentication, error handling, and rate limiting.

### Version Control & Changes

- **[CHANGELOG_SEMANTIC.md](./CHANGELOG_SEMANTIC.md)**: Explains the semantic versioning approach for releases and how changes are documented. Details the versioning strategy (MAJOR.MINOR.PATCH) and changelog format.

### Development & Deployment

- **[GITHUB_SETUP_INSTRUCTIONS.md](./GITHUB_SETUP_INSTRUCTIONS.md)**: Manual steps for setting up the GitHub repository and Actions for CI/CD. Includes configuration for automated testing, linting, deployment pipelines, and GitHub integration.

### Product Definition

- **[PRD_MASTER.md](./PRD_MASTER.md)**: The overarching Product Requirements Document for the platform. Defines the product vision, key features, user stories, success metrics, and roadmap for Enterprise Hub.

## Quick Reference by Topic

### For AI Agent Development
- Start with: **AGENTS_DOCUMENTATION_AUTHORITY.md**
- Then review: **ARCHITECTURE.md**, **FRAMEWORK.md**

### For Security Implementation
- Start with: **SECURITY.md**
- Then review: **ENTITY_ACCESS_RULES.md**, **API_REFERENCE.md**

### For New Features
- Start with: **PRD_MASTER.md**
- Then review: **ARCHITECTURE.md**, **FRAMEWORK.md**, **API_REFERENCE.md**

### For Documentation Updates
- Start with: **DOC_POLICY.md**
- Then review: **AGENTS_DOCUMENTATION_AUTHORITY.md**

### For CI/CD Setup
- Start with: **GITHUB_SETUP_INSTRUCTIONS.md**
- Then review: **CHANGELOG_SEMANTIC.md**

## Additional Documentation

For a complete list of all documentation files in the repository, including:
- `README.md` - Project overview and quick start guide
- `CONTRIBUTING.md` - Contribution guidelines
- `DATABASE_SCHEMA.md` - Database structure and entity definitions
- `MVP_ROADMAP.md` - Development roadmap and milestones
- `.github/FEATURE_TO_PR_TEMPLATE.md` - Feature implementation workflow
- `.github/copilot-instructions.md` - GitHub Copilot agent instructions

Please explore the root directory and `.github/` folder.

---

**Last Updated**: 2026-01-08  
**Maintained by**: Enterprise Hub Documentation Team
