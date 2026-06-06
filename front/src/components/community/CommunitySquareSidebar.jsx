import CommunityQnaPanel from './CommunityQnaPanel';
import '../../public/css/community.css';
import '../../public/css/qna.css';

function CommunitySquareSidebar({
  onItemClick,
  onWriteQna,
  onViewAllQna,
  refreshKey = 0,
  showWriteQna = true,
  viewAllDisabled = false,
  className = '',
}) {
  return (
    <div className={`community-square-sidebar flex flex-col gap-8 ${className}`.trim()}>
      <div className="community-faq-card p-6 bg-surface-container-lowest relative">
        <div
          className="absolute top-0 right-0 w-16 h-16 bg-tertiary-fixed opacity-20 transform rotate-45 translate-x-8 -translate-y-8 pointer-events-none"
          aria-hidden="true"
        />
        <CommunityQnaPanel
          onItemClick={onItemClick}
          onWriteQna={onWriteQna}
          onViewAllQna={onViewAllQna}
          refreshKey={refreshKey}
          showWriteQna={showWriteQna}
          viewAllDisabled={viewAllDisabled}
        />
      </div>
    </div>
  );
}

export default CommunitySquareSidebar;
