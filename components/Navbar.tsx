import React from 'react';
import { Layers, Grid, History, Menu, X } from 'lucide-react';
import { Button } from './Button';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const NavItem = ({ page, icon: Icon, label }: { page: string, icon: any, label: string }) => (
    <button
      onClick={() => { onNavigate(page); setIsOpen(false); }}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-sm
        ${currentPage === page ? 'text-primary bg-primaryDim' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-gradient-to-br from-cyan-500 to-blue-600 mr-3 shadow-[0_0_10px_rgba(6,182,212,0.5)]">
               <Layers className="text-black h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">InsideView <span className="text-primary">AI</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <NavItem page="studio" icon={Layers} label="Studio" />
            <NavItem page="presets" icon={Grid} label="Presets" />
            <NavItem page="gallery" icon={History} label="My Gallery" />
          </div>

          <div className="hidden md:flex items-center gap-4">
             <div className="text-xs text-gray-500 font-mono">PRO BETA</div>
             <Button variant="outline" onClick={() => window.open('https://ai.google.dev', '_blank')} className="h-8 px-3 text-xs">
               Docs
             </Button>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-white p-2">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-surface border-b border-white/10 px-4 py-4 flex flex-col gap-2">
            <NavItem page="studio" icon={Layers} label="Studio" />
            <NavItem page="presets" icon={Grid} label="Presets" />
            <NavItem page="gallery" icon={History} label="My Gallery" />
        </div>
      )}
    </nav>
  );
};