'use client';
import { BarChart3, BookOpen, Settings, UserRound } from 'lucide-react';
import Link from 'next/link'; import { usePathname } from 'next/navigation'; import { Logo } from './Logo'; import { cn } from '@/lib/utils';
const items=[['/library','Biblioteca',BookOpen],['/stats','Ranking',BarChart3],['/profile','Perfil',UserRound],['/settings','Ajustes',Settings]] as const;
export function AppShell({children,wide=false}:{children:React.ReactNode;wide?:boolean}){const path=usePathname();return <div className="app"><div className="ambient"><span/><span/><span/></div><header className="nav"><Logo/><nav>{items.map(([href,label,Icon])=><Link key={href} className={cn('navLink',path.startsWith(href)&&'active')} href={href}><Icon size={17}/><span>{label}</span></Link>)}</nav></header><main className={cn('shell',wide&&'shellWide')}>{children}</main></div>}
