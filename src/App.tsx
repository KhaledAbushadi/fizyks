import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRoute, navigate } from './router';
import { db, openDb, quotaListeners } from './db/schema';
import { useAppData } from './services/appData';
import { lessonById } from './content/loader';
import { isVisible, PREVIEW_BUILD } from './content/loader';
import { HindiDigits } from './ui/Num';
import { BottomNav } from './ui/BottomNav';
import { Empty, Page, TopBar } from './ui/bits';
import { Home } from './features/home/Home';
import { LessonsList } from './features/lesson/LessonsList';
import { LessonJourney } from './features/lesson/LessonJourney';
import { PracticePage } from './features/workshop/PracticePage';
import { GymList, GymSkillPage } from './features/gym/Gym';
import { Review } from './features/review/Review';
import { Errors } from './features/review/Errors';
import { Mixed } from './features/mixed/Mixed';
import { ScoreMapPage } from './features/map/ScoreMap';
import { Diagnostic, Welcome } from './features/diagnostic/Diagnostic';
import { More } from './features/more/More';
import { ContentPreview, UiGallery } from './features/dev/DevPages';

const TAB_PATHS = ['/', '/lessons', '/gym', '/map', '/more'];

function Shell() {
  const route = useRoute();
  const data = useAppData();
  const onboarded = useLiveQuery(async () => (await db.meta.get('onboarded'))?.value === true, []);
  const [quota, setQuota] = useState(false);

  useEffect(() => {
    const l = () => setQuota(true);
    quotaListeners.add(l);
    return () => void quotaListeners.delete(l);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (data.settings.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', data.settings.theme);
  }, [data.settings.theme]);

  // التوجيه لشاشة الترحيب مرة واحدة عند الفتح (لا نعيد التوجيه أثناء التنقل حتى لا نسابق حفظ الإعداد)
  const redirected = useRef(false);
  useEffect(() => {
    if (onboarded === undefined || redirected.current) return;
    redirected.current = true;
    if (onboarded === false && !route.path.startsWith('/welcome') && !route.path.startsWith('/dev')) navigate('/welcome', true);
  }, [onboarded, route.path]);

  if (onboarded === undefined || !data.ready) {
    return <div className="flex min-h-[100dvh] items-center justify-center text-muted">…</div>;
  }

  const [a, b, c] = route.parts;
  const devAllowed = import.meta.env.DEV || PREVIEW_BUILD || data.settings.showDrafts;
  let view: React.ReactNode;
  if (route.path === '/') view = <Home data={data} />;
  else if (a === 'welcome') view = <Welcome />;
  else if (a === 'diagnostic') view = <Diagnostic data={data} post={b === 'post'} />;
  else if (a === 'lessons') view = <LessonsList data={data} />;
  else if (a === 'lesson' && b) {
    const l = lessonById(b);
    view = l && isVisible(l, data.settings.showDrafts) ? <LessonJourney key={b} lesson={l} /> : <Page><TopBar title="الدرس" /><Empty title="الدرس ده بيتجهز" /></Page>;
  } else if (a === 'practice' && b) view = <PracticePage key={b + route.query.toString()} id={b} query={route.query} />;
  else if (a === 'gym') view = b ? <GymSkillPage key={b} id={b} data={data} /> : <GymList data={data} />;
  else if (a === 'review') view = <Review data={data} />;
  else if (a === 'errors') view = <Errors data={data} />;
  else if (a === 'mixed') view = <Mixed data={data} />;
  else if (a === 'map') view = <ScoreMapPage data={data} />;
  else if (a === 'more') view = <More data={data} />;
  else if (a === 'dev' && devAllowed && b === 'ui') view = <UiGallery />;
  else if (a === 'dev' && devAllowed && b === 'content-preview') view = <ContentPreview />;
  else view = <Page><TopBar title="فيزيكس بالمصري" /><Empty title="الصفحة دي مش موجودة" /></Page>;
  void c;

  return (
    <HindiDigits.Provider value={data.settings.hindiDigits}>
      {!data.persistent && (
        <div className="bg-warm-soft px-4 py-2 text-center text-sm" role="alert" data-testid="no-storage">
          التقدم مش هيتحفظ في الوضع ده (تصفح خاص؟). افتح التطبيق في وضع عادي.
        </div>
      )}
      {quota && (
        <div className="bg-warm-soft px-4 py-2 text-center text-sm" role="alert">
          مساحة التخزين قربت تخلص: مسحنا المحاولات القديمة. اعمل نسخة احتياطية من "المزيد".
        </div>
      )}
      {view}
      {TAB_PATHS.includes(route.path === '/' ? '/' : '/' + a) && (b === undefined || a === 'lessons') && <BottomNav current={route.path} />}
    </HindiDigits.Provider>
  );
}

export function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    openDb().finally(() => setReady(true));
  }, []);
  if (!ready) return <div className="flex min-h-[100dvh] items-center justify-center text-muted">…</div>;
  return <Shell />;
}
