import React from 'react';

export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface FooterNavProps {
  navItems: NavItem[];
  activeItem: string;
  onNavigate: (itemKey: string) => void;
}

const FooterNav: React.FC<FooterNavProps> = ({ navItems, activeItem, onNavigate }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 shadow-t-md z-40 md:hidden">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors ${
              activeItem === item.key ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-500'
            }`}
          >
            <div className="w-6 h-6 mb-1">{item.icon}</div>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </footer>
  );
};

export default FooterNav;
