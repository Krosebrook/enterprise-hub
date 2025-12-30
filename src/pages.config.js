import Dashboard from './pages/Dashboard';
import Architectures from './pages/Architectures';
import ArchitectureDesigner from './pages/ArchitectureDesigner';
import Agents from './pages/Agents';
import AgentCreate from './pages/AgentCreate';
import Compliance from './pages/Compliance';
import Costs from './pages/Costs';
import Observability from './pages/Observability';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Architectures": Architectures,
    "ArchitectureDesigner": ArchitectureDesigner,
    "Agents": Agents,
    "AgentCreate": AgentCreate,
    "Compliance": Compliance,
    "Costs": Costs,
    "Observability": Observability,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};