import { navigate } from '../router';
import { IconBook, IconDumbbell, IconHome, IconMap, IconMore } from './Icons';

const TABS = [
  { path: '/', label: 'النهارده', Icon: IconHome },
  { path: '/lessons', label: 'الدروس', Icon: IconBook },
  { path: '/gym', label: 'الصالة', Icon: IconDumbbell },
  { path: '/map', label: 'درجاتي', Icon: IconMap },
  { path: '/more', label: 'المزيد', Icon: IconMore },
];

export function BottomNav({ current }: { current: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label="التنقل الرئيسي">
      <div className="mx-auto flex max-w-xl">
        {TABS.map(({ path, label, Icon }) => {
          const active = path === '/' ? current === '/' : current.startsWith(path);
          return (
            <button key={path} type="button" onClick={() => navigate(path)} className={`tap flex flex-1 flex-col items-center gap-0.5 py-2 text-[12px] ${active ? 'font-bold text-ink' : 'text-muted'}`} aria-current={active ? 'page' : undefined}>
              <span className={`flex h-7 w-12 items-center justify-center rounded-full ${active ? 'bg-amber-soft text-amber' : ''}`}>
                <Icon size={21} />
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
