import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Sparkles, Download, Copy, Check, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

// PRD Template Structure
const PRD_TEMPLATE = {
  sections: [
    {
      id: "executive-summary",
      title: "1. Executive Summary",
      description: "High-level overview of the product/feature and business case",
      prompt:
        "Provide a high-level overview of this feature, including the business case and goals.",
    },
    {
      id: "problem-statement",
      title: "2. Problem Statement",
      description: "Clear articulation of the problem being solved",
      prompt: "Describe the problem being solved, who experiences it, and why it's critical.",
    },
    {
      id: "target-audience",
      title: "3. Target Audience / User Personas",
      description: "Define primary user roles, pain points and goals",
      prompt: "Define the primary user roles, their pain points, and their goals.",
    },
    {
      id: "functional-requirements",
      title: "4. Functional Requirements",
      description: "List of all core features with clear scope",
      prompt: "List all core features with clearly scoped behavior and edge cases.",
    },
    {
      id: "non-functional-requirements",
      title: "5. Non-Functional Requirements",
      description: "Performance, scalability, accessibility considerations",
      prompt:
        "Specify performance, scalability, uptime, localization, and accessibility requirements.",
    },
    {
      id: "user-stories",
      title: "6. User Stories & Acceptance Criteria",
      description: "Gherkin-style user stories (Given/When/Then)",
      prompt:
        "Write user stories in Gherkin format (Given/When/Then) covering all personas and use cases.",
    },
    {
      id: "technical-architecture",
      title: "7. Technical Architecture Overview",
      description: "High-level system design and services",
      prompt:
        "Describe the high-level system design, services involved (frontend, backend, APIs, DBs), and sequence diagrams or flows.",
    },
    {
      id: "api-design",
      title: "8. API Design",
      description: "REST/GraphQL endpoints, schemas, auth",
      prompt:
        "Specify API endpoints, request/response schemas, and authentication/authorization requirements.",
    },
    {
      id: "ui-ux",
      title: "9. UI/UX Considerations",
      description: "Page layout, interactions, mobile responsiveness",
      prompt:
        "Describe page/component layouts, interaction expectations, and mobile responsiveness requirements.",
    },
    {
      id: "security-compliance",
      title: "10. Security & Compliance",
      description: "Data handling, RBAC, encryption, compliance",
      prompt:
        "Outline data handling policies, role-based access control, encryption requirements, and relevant compliance standards (GDPR/SOC2/HIPAA).",
    },
    {
      id: "testing-strategy",
      title: "11. Testing Strategy",
      description: "Unit, integration, E2E testing plan",
      prompt:
        "Define unit, integration, and E2E test coverage requirements, including tooling and automation plans.",
    },
    {
      id: "deployment-devops",
      title: "12. Deployment & DevOps Plan",
      description: "Environments, CI/CD, rollback plans",
      prompt: "Describe environments (dev, staging, prod), CI/CD strategy, and rollback plans.",
    },
    {
      id: "assumptions-risks",
      title: "13. Assumptions, Risks & Open Questions",
      description: "Known unknowns and risk mitigation",
      prompt: "List known unknowns, external dependencies, and risk mitigation strategies.",
    },
  ],
};

export default function PRDGenerator() {
  const [featureIdea, setFeatureIdea] = useState("");
  const [generatedPRD, setGeneratedPRD] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate PRD from feature idea
  const handleGeneratePRD = async () => {
    if (!featureIdea.trim()) {
      toast.error("Please enter a feature idea first");
      return;
    }

    setIsGenerating(true);

    try {
      // Simulate AI generation with structured content
      // In production, this would call an AI API (OpenAI, Claude, etc.)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const prdSections = {};

      PRD_TEMPLATE.sections.forEach((section) => {
        prdSections[section.id] = generateSectionContent(section, featureIdea);
      });

      setGeneratedPRD({
        title: extractFeatureTitle(featureIdea),
        featureIdea,
        sections: prdSections,
        generatedAt: new Date().toISOString(),
      });

      toast.success("PRD generated successfully!");
    } catch (error) {
      console.error("Error generating PRD:", error);
      toast.error("Failed to generate PRD");
    } finally {
      setIsGenerating(false);
    }
  };

  // Extract a title from the feature idea
  const extractFeatureTitle = (idea) => {
    const firstLine = idea.split("\n")[0];
    return firstLine.substring(0, 100) || "Untitled Feature";
  };

  // Generate content for a PRD section
  const generateSectionContent = (section, idea) => {
    // This is a placeholder for AI-generated content
    // In production, this would use OpenAI, Claude, or similar
    const templates = {
      "executive-summary": `### Overview\n\nThis PRD outlines the requirements for: ${extractFeatureTitle(idea)}\n\n### Business Case\n\n- **Problem**: [Generated from feature idea analysis]\n- **Opportunity**: [Market opportunity and business value]\n- **Goals**: [Key business objectives]\n\n### Success Metrics\n\n- User engagement metrics\n- Business impact KPIs\n- Technical performance goals`,

      "problem-statement": `### Current State\n\n[Description of current situation and pain points]\n\n### Who Experiences This Problem\n\n- **Primary Users**: [User segment]\n- **Impact**: [Business and user impact]\n- **Frequency**: [How often this problem occurs]\n\n### Why It's Critical\n\n[Business justification and urgency]`,

      "target-audience": `### User Personas\n\n#### Persona 1: [Name]\n- **Role**: [Job title/role]\n- **Goals**: [Primary objectives]\n- **Pain Points**: [Current challenges]\n- **Technical Proficiency**: [Level]\n\n#### Persona 2: [Name]\n- **Role**: [Job title/role]\n- **Goals**: [Primary objectives]\n- **Pain Points**: [Current challenges]\n- **Technical Proficiency**: [Level]`,

      "functional-requirements": `### Core Features\n\n#### FR-1: [Feature Name]\n- **Description**: [Detailed description]\n- **User Actions**: [What users can do]\n- **System Behavior**: [How system responds]\n- **Edge Cases**: [Special scenarios]\n\n#### FR-2: [Feature Name]\n- **Description**: [Detailed description]\n- **User Actions**: [What users can do]\n- **System Behavior**: [How system responds]\n- **Edge Cases**: [Special scenarios]`,

      "non-functional-requirements": `### Performance\n- Response time: < 200ms for UI interactions\n- API latency: < 500ms (p95)\n- Concurrent users: Support 10,000+ simultaneous users\n\n### Scalability\n- Horizontal scaling capability\n- Database optimization for large datasets\n- CDN integration for static assets\n\n### Availability\n- Uptime: 99.9% SLA\n- Disaster recovery: RPO < 1 hour, RTO < 4 hours\n\n### Accessibility\n- WCAG 2.1 Level AA compliance\n- Keyboard navigation support\n- Screen reader compatibility\n\n### Localization\n- Multi-language support (initial: EN, ES, FR)\n- RTL language support\n- Timezone and date format handling`,

      "user-stories": `### User Story 1\n\n**As a** [user persona]  \n**I want to** [action]  \n**So that** [benefit]\n\n**Acceptance Criteria:**\n\`\`\`gherkin\nGiven [initial context]\nWhen [action is performed]\nThen [expected outcome]\nAnd [additional outcome]\n\`\`\`\n\n### User Story 2\n\n**As a** [user persona]  \n**I want to** [action]  \n**So that** [benefit]\n\n**Acceptance Criteria:**\n\`\`\`gherkin\nGiven [initial context]\nWhen [action is performed]\nThen [expected outcome]\nAnd [additional outcome]\n\`\`\``,

      "technical-architecture": `### System Components\n\n#### Frontend\n- Framework: React 18 + Vite\n- State Management: React Query + Context API\n- UI Components: Radix UI + Tailwind CSS\n\n#### Backend\n- Platform: Base44 serverless functions\n- Runtime: Deno/Node.js\n- Database: PostgreSQL (via Base44)\n\n#### External Services\n- Authentication: Base44 Auth\n- File Storage: Base44 Storage\n- Email: SendGrid/AWS SES\n\n### Data Flow\n\n1. User interaction triggers frontend action\n2. Frontend calls Base44 API endpoint\n3. Backend processes request and validates data\n4. Database operations performed\n5. Response returned to frontend\n6. UI updates with new state\n\n### Architecture Diagram\n\n[Placeholder for architecture diagram]`,

      "api-design": `### Endpoints\n\n#### GET /api/[resource]\n\n**Description**: Retrieve list of resources\n\n**Authentication**: Required (Bearer token)\n\n**Query Parameters:**\n- \`page\` (number): Page number for pagination\n- \`limit\` (number): Items per page (max 100)\n- \`filter\` (string): Filter criteria\n\n**Response (200 OK):**\n\`\`\`json\n{\n  "data": [...],\n  "pagination": {\n    "page": 1,\n    "limit": 20,\n    "total": 150\n  }\n}\n\`\`\`\n\n#### POST /api/[resource]\n\n**Description**: Create new resource\n\n**Authentication**: Required (Bearer token)\n\n**Request Body:**\n\`\`\`json\n{\n  "name": "string",\n  "description": "string"\n}\n\`\`\`\n\n**Response (201 Created):**\n\`\`\`json\n{\n  "id": "uuid",\n  "name": "string",\n  "description": "string",\n  "created_at": "timestamp"\n}\n\`\`\``,

      "ui-ux": `### Page Layout\n\n#### Main View\n- Header with navigation and search\n- Sidebar with filters and quick actions\n- Main content area with cards/table view\n- Footer with pagination\n\n### Key Interactions\n\n1. **Primary Action**: Click to create/edit\n2. **Secondary Actions**: Dropdown menus for bulk operations\n3. **Navigation**: Breadcrumbs and back buttons\n4. **Feedback**: Toast notifications for success/error states\n\n### Mobile Responsiveness\n\n- Breakpoints: 640px (mobile), 768px (tablet), 1024px (desktop)\n- Touch-friendly targets (min 44x44px)\n- Collapsible sidebar on mobile\n- Bottom navigation bar for mobile\n\n### Wireframes\n\n[Placeholder for wireframe links]`,

      "security-compliance": `### Data Handling\n\n- **Encryption at Rest**: AES-256 for sensitive data\n- **Encryption in Transit**: TLS 1.3\n- **Data Classification**: PII, confidential, internal, public\n- **Data Retention**: Configurable per data type\n\n### Access Control\n\n- **Authentication**: OAuth 2.0 + JWT tokens\n- **Authorization**: RBAC with 4 roles (Admin, Developer, Viewer, Auditor)\n- **Session Management**: 24-hour token expiry with refresh\n- **MFA**: Optional for all users, required for admins\n\n### Compliance Requirements\n\n#### GDPR\n- Right to access personal data\n- Right to be forgotten\n- Data portability\n- Consent management\n\n#### SOC2 Type II\n- Audit logging for all actions\n- Access reviews quarterly\n- Change management process\n\n#### HIPAA (if applicable)\n- PHI encryption and access controls\n- BAA with vendors\n- Audit trails for PHI access`,

      "testing-strategy": `### Test Coverage\n\n#### Unit Tests\n- Target: 80% code coverage\n- Framework: Vitest\n- Focus: Business logic, utilities, hooks\n\n#### Integration Tests\n- API endpoint testing\n- Database operations\n- External service mocking\n\n#### E2E Tests\n- Framework: Playwright or Cypress\n- Critical user flows\n- Cross-browser testing (Chrome, Firefox, Safari)\n\n### Testing Tools\n\n- **Unit/Integration**: Vitest + React Testing Library\n- **E2E**: Playwright\n- **API Testing**: Postman/Newman\n- **Performance**: Lighthouse, WebPageTest\n\n### Automation\n\n- CI/CD pipeline runs all tests on PR\n- Nightly E2E test suite\n- Performance benchmarks on staging\n- Security scanning (SAST/DAST)`,

      "deployment-devops": `### Environments\n\n#### Development\n- Local development with hot reload\n- Shared dev database\n- Mock external services\n\n#### Staging\n- Production-like environment\n- Full integration with services\n- Used for UAT and QA\n\n#### Production\n- Multi-region deployment\n- Auto-scaling enabled\n- Monitoring and alerting\n\n### CI/CD Pipeline\n\n1. **Commit**: Developer pushes code\n2. **Build**: Automated build and tests\n3. **Test**: Unit, integration, E2E tests\n4. **Security Scan**: SAST, dependency check\n5. **Deploy to Staging**: Automatic on main branch\n6. **UAT**: Manual testing on staging\n7. **Deploy to Prod**: Manual approval required\n\n### Rollback Plan\n\n- **Fast Rollback**: Previous version deployment (< 5 min)\n- **Database Migrations**: Backward-compatible changes\n- **Feature Flags**: Ability to disable features without deployment\n- **Monitoring**: Automated alerts for errors/performance issues`,

      "assumptions-risks": `### Assumptions\n\n1. Users have modern browsers (last 2 versions)\n2. Base44 platform provides 99.9% uptime\n3. External APIs have documented rate limits\n4. Team has required technical expertise\n\n### Risks & Mitigation\n\n#### High Priority\n\n**Risk**: Third-party API downtime  \n**Impact**: Feature unavailable  \n**Mitigation**: Implement fallback behavior, queue requests, show cached data  \n**Owner**: Backend Team\n\n**Risk**: Scalability issues at launch  \n**Impact**: Poor user experience  \n**Mitigation**: Load testing before launch, auto-scaling, CDN  \n**Owner**: DevOps Team\n\n#### Medium Priority\n\n**Risk**: User adoption below expectations  \n**Impact**: ROI concerns  \n**Mitigation**: User research, beta testing, iterative improvements  \n**Owner**: Product Team\n\n### Open Questions\n\n1. What is the budget for external services?\n2. Do we need internationalization from day one?\n3. What are the data retention policies?\n4. Should we support offline mode?\n5. What browser versions must we support?`,
    };

    return (
      templates[section.id] ||
      `[Content for ${section.title}]\n\nThis section will be generated based on the feature idea:\n\n"${idea}"\n\n${section.prompt}`
    );
  };

  // Copy PRD to clipboard
  const handleCopy = async () => {
    if (!generatedPRD) return;

    const markdown = formatPRDAsMarkdown(generatedPRD);
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast.success("PRD copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Download PRD as markdown file
  const handleDownload = () => {
    if (!generatedPRD) return;

    const markdown = formatPRDAsMarkdown(generatedPRD);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prd-${generatedPRD.title.toLowerCase().replace(/\s+/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("PRD downloaded!");
  };

  // Format PRD as markdown
  const formatPRDAsMarkdown = (prd) => {
    let markdown = `# Product Requirements Document\n\n`;
    markdown += `## ${prd.title}\n\n`;
    markdown += `**Generated**: ${new Date(prd.generatedAt).toLocaleString()}\n\n`;
    markdown += `---\n\n`;
    markdown += `## Feature Idea\n\n${prd.featureIdea}\n\n`;
    markdown += `---\n\n`;

    PRD_TEMPLATE.sections.forEach((section) => {
      markdown += `## ${section.title}\n\n`;
      markdown += `${prd.sections[section.id]}\n\n`;
      markdown += `---\n\n`;
    });

    return markdown;
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">PRD Generator</h1>
            <p className="text-slate-500">AI-powered Product Requirements Document generation</p>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="bg-purple-50 border-purple-200 mt-4">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-900">
                <p className="font-medium mb-1">Comprehensive PRD Generation</p>
                <p className="text-purple-700">
                  Transform your feature ideas into complete, spec-driven Product Requirements
                  Documents with all 13 essential sections following industry best practices.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Feature Idea Input
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Describe Your Feature Idea
                  </label>
                  <Textarea
                    placeholder="Enter your feature or product idea here...&#10;&#10;Example:&#10;- A real-time collaboration feature for the architecture designer&#10;- Multi-user editing with presence indicators&#10;- Live cursor tracking and selections&#10;- Comment threads on architecture components"
                    value={featureIdea}
                    onChange={(e) => setFeatureIdea(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    The more detail you provide, the better the generated PRD will be.
                  </p>
                </div>

                <Button
                  onClick={handleGeneratePRD}
                  disabled={isGenerating || !featureIdea.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating PRD...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate PRD
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Template Structure */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">PRD Template Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {PRD_TEMPLATE.sections.map((section, index) => (
                  <div key={section.id} className="flex items-start gap-3 text-sm">
                    <Badge variant="outline" className="flex-shrink-0">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{section.title.replace(/^\d+\.\s*/, "")}</p>
                      <p className="text-xs text-slate-500">{section.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <div>
          {!generatedPRD ? (
            <Card className="h-full flex items-center justify-center min-h-[500px]">
              <CardContent className="text-center p-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-900 mb-2">No PRD Generated Yet</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Enter your feature idea on the left and click "Generate PRD" to create a
                  comprehensive Product Requirements Document.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Actions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Generated PRD</CardTitle>
                    <div className="flex gap-2">
                      <Button onClick={handleCopy} variant="outline" size="sm">
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button onClick={handleDownload} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Title</p>
                      <p className="text-sm text-slate-900">{generatedPRD.title}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Generated</p>
                      <p className="text-sm text-slate-500">
                        {new Date(generatedPRD.generatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* PRD Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="executive-summary" className="w-full">
                    <TabsList className="grid grid-cols-3 lg:grid-cols-4 mb-4 h-auto">
                      {PRD_TEMPLATE.sections.slice(0, 4).map((section) => (
                        <TabsTrigger
                          key={section.id}
                          value={section.id}
                          className="text-xs px-2 py-2"
                        >
                          {section.title.split(":")[0]}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {PRD_TEMPLATE.sections.map((section) => (
                      <TabsContent
                        key={section.id}
                        value={section.id}
                        className="max-h-[500px] overflow-y-auto"
                      >
                        <div className="prose prose-sm max-w-none">
                          <h3 className="text-lg font-semibold mb-3">{section.title}</h3>
                          <div className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border">
                            {generatedPRD.sections[section.id]}
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      Use the tabs above to preview different sections. All 13 sections are included
                      in the full document.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
