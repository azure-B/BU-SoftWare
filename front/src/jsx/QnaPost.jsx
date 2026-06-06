import { useMemo } from 'react';
import { mapApiQnaDetail } from '../components/community/qnaData';
import '../public/css/qna.css';
import '../public/css/mobile/qna.css';

function QnaPost({ detail, onBack }) {
  const qna = useMemo(() => mapApiQnaDetail(detail), [detail]);
  const showQuestionBody =
    qna.questionBody &&
    qna.questionBody.trim() !== qna.questionTitle.trim();

  return (
    <main className="qna-post-main community-main flex-1 min-w-0 py-12">
      <article>
          <div className="qna-post-back">
            <button type="button" onClick={onBack}>
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                arrow_back
              </span>
              Back to List
            </button>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-xs sm:text-sm">
              Student Square / Q&amp;A
            </span>
          </div>

          <section className="flex flex-col gap-6">
            <header className="flex flex-col gap-4">
              <span className="qna-post-category">{qna.category}</span>
              <h1 className="qna-post-question-title">{qna.questionTitle}</h1>
              <div className="qna-post-meta">
                <span>
                  {qna.authorName}
                  {qna.authorDepartmentName ? ` (${qna.authorDepartmentName})` : ''}
                </span>
                <span className="qna-post-meta__dot" aria-hidden="true" />
                <span>{qna.formattedDate}</span>
                <span className="qna-post-meta__dot" aria-hidden="true" />
                <span>조회수 {qna.viewCount}</span>
              </div>
            </header>

            {showQuestionBody && (
              <div className="qna-post-question-body">{qna.questionBody}</div>
            )}

            {qna.hasAnswer ? (
              <section className="qna-post-answer">
                <div className="qna-post-answer__badge" aria-hidden="true">
                  A
                </div>
                <div className="qna-post-answer__meta">
                  <span>{qna.answerMeta?.responder ?? '학사지원팀'} 답변</span>
                  {qna.formattedAnswerDate && (
                    <>
                      <span className="qna-post-meta__dot" aria-hidden="true" />
                      <span>{qna.formattedAnswerDate}</span>
                    </>
                  )}
                </div>
                <div className="qna-post-answer__body">{qna.answerBody}</div>
              </section>
            ) : (
              <p className="qna-post-answer--pending">담당 부서 확인 후 답변이 등록됩니다.</p>
            )}
          </section>
      </article>
    </main>
  );
}

export default QnaPost;
