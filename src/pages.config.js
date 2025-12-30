import Dashboard from './pages/Dashboard';
import Architectures from './pages/Architectures';
import ArchitectureDesigner from './pages/ArchitectureDesigner';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Architectures": Architectures,
    "ArchitectureDesigner": ArchitectureDesigner,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};