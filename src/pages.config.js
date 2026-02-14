/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AgentCreate from './pages/AgentCreate';
import AgentPlayground from './pages/AgentPlayground';
import Agents from './pages/Agents';
import ArchitectureDesigner from './pages/ArchitectureDesigner';
import Architectures from './pages/Architectures';
import AuditLog from './pages/AuditLog';
import Compliance from './pages/Compliance';
import Costs from './pages/Costs';
import Dashboard from './pages/Dashboard';
import DeveloperHub from './pages/DeveloperHub';
import Documentation from './pages/Documentation';
import Integrations from './pages/Integrations';
import Monitoring from './pages/Monitoring';
import Observability from './pages/Observability';
import PRDGenerator from './pages/PRDGenerator';
import Playbooks from './pages/Playbooks';
import Policies from './pages/Policies';
import PolicyCreate from './pages/PolicyCreate';
import ServiceCatalog from './pages/ServiceCatalog';
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
    "DeveloperHub": DeveloperHub,
    "Documentation": Documentation,
    "Integrations": Integrations,
    "Monitoring": Monitoring,
    "Observability": Observability,
    "PRDGenerator": PRDGenerator,
    "Playbooks": Playbooks,
    "Policies": Policies,
    "PolicyCreate": PolicyCreate,
    "ServiceCatalog": ServiceCatalog,
    "Users": Users,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};