import FileClock from "lucide-react/dist/esm/icons/file-clock";
import FileText from "lucide-react/dist/esm/icons/file-text";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import History from "lucide-react/dist/esm/icons/history";
import Image from "lucide-react/dist/esm/icons/image";
import LayoutDashboard from "lucide-react/dist/esm/icons/layout-dashboard";
import Newspaper from "lucide-react/dist/esm/icons/newspaper";
import Package from "lucide-react/dist/esm/icons/package";
import Settings from "lucide-react/dist/esm/icons/settings";
import Users from "lucide-react/dist/esm/icons/users";

const icons = {
  dashboard: LayoutDashboard,
  products: Package,
  articles: Newspaper,
  projects: FolderKanban,
  pages: FileText,
  media: Image,
  "business-settings": Settings,
  users: Users,
  versions: FileClock,
  audit: History,
} as const;

export function NavIcon({ route }: { route: keyof typeof icons }) {
  const Icon = icons[route];
  return <Icon size={18} aria-hidden="true" />;
}
