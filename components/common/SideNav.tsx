import React from 'react';

export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface SideNavProps {
  navItems: NavItem[];
  activeItem: string;
  onNavigate: (itemKey: string) => void;
  header: React.ReactNode;
}

const SideNav: React.FC<SideNavProps> = ({ navItems, activeItem, onNavigate, header }) => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed top-0 left-0 h-full">
      <div className="h-20 flex items-center px-6 border-b border-slate-200">
        {header}
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeItem === item.key
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="w-5 h-5 mr-3">{item.icon}</div>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default SideNav;
