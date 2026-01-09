import AgentCreate from './pages/AgentCreate';
import Agents from './pages/Agents';
import ArchitectureDesigner from './pages/ArchitectureDesigner';
import Architectures from './pages/Architectures';
import AuditLog from './pages/AuditLog';
import Compliance from './pages/Compliance';
import Costs from './pages/Costs';
import Dashboard from './pages/Dashboard';
import Documentation from './pages/Documentation';
import Observability from './pages/Observability';
import Policies from './pages/Policies';
import PolicyCreate from './pages/PolicyCreate';
import Users from './pages/Users';
import AgentPlayground from './pages/AgentPlayground';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AgentCreate": AgentCreate,
    "Agents": Agents,
    "ArchitectureDesigner": ArchitectureDesigner,
    "Architectures": Architectures,
    "AuditLog": AuditLog,
    "Compliance": Compliance,
    "Costs": Costs,
    "Dashboard": Dashboard,
    "Documentation": Documentation,
    "Observability": Observability,
    "Policies": Policies,
    "PolicyCreate": PolicyCreate,
    "Users": Users,
    "AgentPlayground": AgentPlayground,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};