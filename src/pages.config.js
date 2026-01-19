import AgentCreate from './pages/AgentCreate';
import AgentPlayground from './pages/AgentPlayground';
import Agents from './pages/Agents';
import ArchitectureDesigner from './pages/ArchitectureDesigner';
import Architectures from './pages/Architectures';
import AuditLog from './pages/AuditLog';
import Compliance from './pages/Compliance';
import Costs from './pages/Costs';
import Dashboard from './pages/Dashboard';
import Documentation from './pages/Documentation';
import Integrations from './pages/Integrations';
import Monitoring from './pages/Monitoring';
import Observability from './pages/Observability';
import PRDGenerator from './pages/PRDGenerator';
import Policies from './pages/Policies';
import PolicyCreate from './pages/PolicyCreate';
import Users from './pages/Users';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AgentCreate": AgentCreate,
    "AgentPlayground": AgentPlayground,
    "Agents": Agents,
    "ArchitectureDesigner": ArchitectureDesigner,
    "Architectures": Architectures,
    "AuditLog": AuditLog,
    "Compliance": Compliance,
    "Costs": Costs,
    "Dashboard": Dashboard,
    "Documentation": Documentation,
    "Integrations": Integrations,
    "Monitoring": Monitoring,
    "Observability": Observability,
    "PRDGenerator": PRDGenerator,
    "Policies": Policies,
    "PolicyCreate": PolicyCreate,
    "Users": Users,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};