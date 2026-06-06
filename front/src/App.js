import { useCallback, useRef, useState } from 'react';
import AuthShell from './components/auth/AuthShell';
import './public/css/auth.css';
import './public/css/app-nav.css';
import Dashboard from './jsx/Dashboard';
import ReservationView from './components/reservation/ReservationView';
import MyPage from './jsx/MyPage';
import CommunitySquareView from './components/community/CommunitySquareView';
import Tour from './jsx/Tour';
import AppLayout from './components/layout/AppLayout';
import { fetchPostDetail } from './components/community/postData';
import { getAppPageMeta, isAppView, isAuthView } from './components/layout/appNavConfig';
import { usePanelTransition } from './hooks/usePanelTransition';

const SQUARE_CONTENT_VIEWS = new Set(['square', 'post', 'new_post', 'edit_post']);

function getAppShell(view) {
  if (SQUARE_CONTENT_VIEWS.has(view)) return 'community';
  if (isAuthView(view)) return 'auth';
  return view;
}

function App() {
  const [activeView, setActiveView] = useState('login');
  const [focusLoginStudentId, setFocusLoginStudentId] = useState(false);
  const [postDetail, setPostDetail] = useState(null);
  const openingPostRef = useRef(false);
  const [session, setSession] = useState({
    id: null,
    studentId: '',
    name: '',
    departmentId: null,
    departmentName: '',
    token: null,
  });

  const { shownValue: shownView, fadeClass } = usePanelTransition(activeView, {
    shouldAnimate: (next, current) => getAppShell(next) !== getAppShell(current),
  });

  const navigateTo = useCallback((nextView) => {
    setActiveView((current) => (current === nextView ? current : nextView));
  }, []);

  const handleLogin = (user) => {
    setSession({
      id: user.id,
      studentId: user.studentId,
      name: user.name,
      departmentId: user.departmentId,
      departmentName: user.departmentName,
      token: user.token,
    });
    navigateTo('dashboard');
  };

  const handleLogout = () => {
    setFocusLoginStudentId(false);
    setPostDetail(null);
    setActiveView('login');
    setSession({
      id: null,
      studentId: '',
      name: '',
      departmentId: null,
      departmentName: '',
      token: null,
    });
  };

  const handleNavSelect = (navId) => {
    if (isAppView(navId)) {
      setPostDetail(null);
      navigateTo(navId);
    }
  };

  const handleOpenPost = useCallback(
    async (post) => {
      if (openingPostRef.current) return;

      openingPostRef.current = true;
      try {
        const detail = await fetchPostDetail(post.id);
        setPostDetail(detail);
        navigateTo('post');
      } catch (err) {
        window.alert(err.message || '게시글을 불러오지 못했습니다.');
      } finally {
        openingPostRef.current = false;
      }
    },
    [navigateTo],
  );

  const handleBackToSquare = () => {
    setPostDetail(null);
    navigateTo('square');
  };

  const handleWritePost = () => {
    setPostDetail(null);
    navigateTo('new_post');
  };

  const handleEditPost = useCallback(() => {
    navigateTo('edit_post');
  }, [navigateTo]);

  const handleCancelEdit = useCallback(() => {
    navigateTo('post');
  }, [navigateTo]);

  const handlePostUpdated = useCallback(
    (updated) => {
      setPostDetail(updated);
      navigateTo('post');
    },
    [navigateTo],
  );

  const handleProfileClick = () => {
    navigateTo('mypage');
  };

  const renderAppMain = (view) => {
    switch (view) {
      case 'dashboard':
        return <Dashboard session={session} onOpenPost={handleOpenPost} />;
      case 'dept':
        return <Tour session={session} />;
      case 'reservation':
        return <ReservationView />;
      case 'mypage':
        return <MyPage session={session} />;
      default:
        return null;
    }
  };

  const renderCommunityMain = (view) => (
    <CommunitySquareView
      view={view}
      postDetail={postDetail}
      token={session.token}
      currentUserId={session.id}
      onOpenPost={handleOpenPost}
      onBack={handleBackToSquare}
      onWritePost={handleWritePost}
      onEditPost={handleEditPost}
      onCancelEdit={handleCancelEdit}
      onPostUpdated={handlePostUpdated}
    />
  );

  const renderShownContent = () => {
    if (getAppShell(shownView) === 'community') {
      const communityView = SQUARE_CONTENT_VIEWS.has(activeView) ? activeView : shownView;
      return renderCommunityMain(communityView);
    }

    if (isAuthView(shownView)) {
      const authView = getAppShell(activeView) === 'auth' ? activeView : shownView;
      return (
        <AuthShell
          view={authView}
          onLogin={handleLogin}
          onGoToRegister={() => navigateTo('regi')}
          onGoToLogin={() => {
            setFocusLoginStudentId(false);
            navigateTo('login');
          }}
          onRegiComplete={() => {
            setFocusLoginStudentId(true);
            navigateTo('login');
          }}
          focusLoginStudentId={focusLoginStudentId}
          onFocusLoginStudentIdHandled={() => setFocusLoginStudentId(false)}
        />
      );
    }

    return renderAppMain(shownView);
  };

  if (isAppView(shownView)) {
    const headerView = isAppView(activeView) ? activeView : shownView;
    const headerMeta = getAppPageMeta(headerView);
    const pageMeta = getAppPageMeta(shownView);

    return (
      <AppLayout
        pageClass={pageMeta.pageClass}
        showWatermark={pageMeta.showWatermark}
        activeNav={headerMeta.activeNav}
        profileActive={headerMeta.profileActive}
        onLogout={handleLogout}
        onNavSelect={handleNavSelect}
        onProfileClick={handleProfileClick}
      >
        <div className={`panel-main-fade ${fadeClass}`}>{renderShownContent()}</div>
      </AppLayout>
    );
  }

  if (isAuthView(shownView)) {
    return <div className={`panel-main-fade ${fadeClass}`}>{renderShownContent()}</div>;
  }

  return null;
}

export default App;
