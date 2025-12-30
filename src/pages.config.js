import AgentCreate from './pages/AgentCreate';
import Agents from './pages/Agents';
import ArchitectureDesigner from './pages/ArchitectureDesigner';
import Architectures from './pages/Architectures';
import Compliance from './pages/Compliance';
import Costs from './pages/Costs';
import Dashboard from './pages/Dashboard';
import Observability from './pages/Observability';
import Policies from './pages/Policies';
import PolicyCreate from './pages/PolicyCreate';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AgentCreate": AgentCreate,
    "Agents": Agents,
    "ArchitectureDesigner": ArchitectureDesigner,
    "Architectures": Architectures,
    "Compliance": Compliance,
    "Costs": Costs,
    "Dashboard": Dashboard,
    "Observability": Observability,
    "Policies": Policies,
    "PolicyCreate": PolicyCreate,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};