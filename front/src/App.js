import { useCallback, useEffect, useRef, useState } from 'react';
import AuthShell from './components/auth/AuthShell';
import './public/css/auth.css';
import './public/css/app-nav.css';
import Dashboard from './jsx/Dashboard';
import ReservationView from './components/reservation/ReservationView';
import MyPage from './jsx/MyPage';
import CommunitySquareView from './components/community/CommunitySquareView';
import Tour from './jsx/Tour';
import Shuttle from './jsx/Shuttle';
import AppLayout from './components/layout/AppLayout';
import { fetchPostDetail } from './components/community/postData';
import { getAppPageMeta, isAppView, isAuthView } from './components/layout/appNavConfig';
import { usePanelTransition } from './hooks/usePanelTransition';
import {
  clearStoredAuth,
  getEmptySession,
  getInitialAppState,
  saveStoredAuth,
} from './utils/authSession';

const SQUARE_CONTENT_VIEWS = new Set([
  'square',
  'post',
  'new_post',
  'edit_post',
  'qna_board',
  'new_qna_post',
]);

function getAppShell(view) {
  if (SQUARE_CONTENT_VIEWS.has(view)) return 'community';
  if (isAuthView(view)) return 'auth';
  return view;
}

function App() {
  const [activeView, setActiveView] = useState(() => getInitialAppState().activeView);
  const [focusLoginStudentId, setFocusLoginStudentId] = useState(false);
  const [postDetail, setPostDetail] = useState(null);
  const [postReturnView, setPostReturnView] = useState('square');
  const openingPostRef = useRef(false);
  const [session, setSession] = useState(() => getInitialAppState().session);

  useEffect(() => {
    if (session.token) {
      saveStoredAuth({ session, activeView });
      return;
    }
    clearStoredAuth();
  }, [session, activeView]);

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
    clearStoredAuth();
    setFocusLoginStudentId(false);
    setPostDetail(null);
    setActiveView('login');
    setSession(getEmptySession());
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
        setPostReturnView(activeView === 'qna_board' ? 'qna_board' : 'square');
        setPostDetail(detail);
        navigateTo('post');
      } catch (err) {
        window.alert(err.message || '게시글을 불러오지 못했습니다.');
      } finally {
        openingPostRef.current = false;
      }
    },
    [navigateTo, activeView],
  );

  const handleBackToSquare = () => {
    setPostDetail(null);
    navigateTo('square');
  };

  const handleBackFromPost = useCallback(() => {
    setPostDetail(null);
    if (postDetail?.boardKind === 'qna') {
      navigateTo(postReturnView);
      return;
    }
    navigateTo('square');
  }, [postDetail, postReturnView, navigateTo]);

  const handleWritePost = () => {
    setPostDetail(null);
    navigateTo('new_post');
  };

  const handleWriteQna = () => {
    setPostDetail(null);
    navigateTo('new_qna_post');
  };

  const handleViewAllQna = () => {
    setPostDetail(null);
    navigateTo('qna_board');
  };

  const handleQnaFlowBack = () => {
    setPostDetail(null);
    navigateTo('square');
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
      case 'shuttle':
        return <Shuttle />;
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
      departmentId={session.departmentId}
      departmentName={session.departmentName}
      onOpenPost={handleOpenPost}
      onBack={handleBackToSquare}
      onBackFromPost={handleBackFromPost}
      onWritePost={handleWritePost}
      onWriteQna={handleWriteQna}
      onViewAllQna={handleViewAllQna}
      onQnaFlowBack={handleQnaFlowBack}
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
