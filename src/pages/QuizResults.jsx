import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertCircle, RefreshCcw, ArrowRight, Home, Award, Brain } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

/* ════════════════════════════════════════════════════
   DESIGN SYSTEM — Extracted from LandingPage.jsx
════════════════════════════════════════════════════ */
function buildTheme(dk){return dk?{bg:"#0B1120",bgCard:"rgba(255,255,255,0.035)",border:"rgba(255,255,255,0.08)",borderAccent:"rgba(79,70,229,0.38)",accent:"#4F46E5",accentDim:"rgba(79,70,229,0.14)",iconA:"#38BDF8",iconBgA:"rgba(56,189,248,0.10)",iconBorderA:"rgba(56,189,248,0.22)",iconB:"#818CF8",iconBgB:"rgba(129,140,248,0.11)",iconBorderB:"rgba(129,140,248,0.25)",textPrimary:"#F8FAFC",textMuted:"#94A3B8",textDim:"#475569",shadowCard:"0 1px 1px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)",trackBg:"rgba(255,255,255,0.06)",green:"#34D399",greenDim:"rgba(52,211,153,0.12)",greenBorder:"rgba(52,211,153,0.22)",red:"#F87171",redDim:"rgba(248,113,113,0.10)",redBorder:"rgba(248,113,113,0.20)",yellow:"#FBBF24",yellowDim:"rgba(251,191,36,0.12)",yellowBorder:"rgba(251,191,36,0.22)",headerBg:"rgba(11,17,32,0.88)"}:{bg:"#F8FAFC",bgCard:"#FFFFFF",border:"#E2E8F0",borderAccent:"rgba(15,76,129,0.28)",accent:"#0F4C81",accentDim:"rgba(15,76,129,0.08)",iconA:"#0F4C81",iconBgA:"rgba(15,76,129,0.08)",iconBorderA:"rgba(15,76,129,0.18)",iconB:"#2563EB",iconBgB:"rgba(37,99,235,0.07)",iconBorderB:"rgba(37,99,235,0.16)",textPrimary:"#0F172A",textMuted:"#64748B",textDim:"#94A3B8",shadowCard:"0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",trackBg:"#E2E8F0",green:"#059669",greenDim:"rgba(5,150,105,0.08)",greenBorder:"rgba(5,150,105,0.18)",red:"#EF4444",redDim:"rgba(239,68,68,0.08)",redBorder:"rgba(239,68,68,0.18)",yellow:"#D97706",yellowDim:"rgba(217,119,6,0.08)",yellowBorder:"rgba(217,119,6,0.18)",headerBg:"rgba(248,250,252,0.90)"};}
const _c=(T,x)=>({background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"16px",boxShadow:T.shadowCard,...x});
const _t={transition:"all 0.25s ease"};
const _iw=(bg,bd,sz="40px",r="10px")=>({..._t,width:sz,height:sz,borderRadius:r,background:bg,border:`1px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0});

const QuizResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const T = buildTheme(isDark);
  const savedRef = useRef(false);

  const stateData = location.state || (() => {
    try {
      const saved = sessionStorage.getItem('lastQuizResults');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })();

  const { score, total, questions, userAnswers, lesson, subjectId, teacherId, lessonId, subjectName, quizId } = stateData || {};
  const resolvedLessonTeacherId = teacherId ?? lesson?.teacher_id ?? lesson?.teacherId ?? null;


  const percentage = stateData ? Math.round((score / total) * 100) : 0;

  // حفظ الثغرات في localStorage (النتيجة الفعلية محفوظة بالفعل في الـ backend من Quiz.jsx)
  useEffect(() => {
    if (!stateData || savedRef.current) return;
    savedRef.current = true;

    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = String(storedUser.id || '');
      if (!userId) return;

      // لو النتيجة أقل من 50% — أضف ثغرة في localStorage
      if (percentage < 50 && lesson) {
        const gapLabel = `${subjectName || ''} - ${lesson.title || ''}`;
        const gaps = JSON.parse(localStorage.getItem('remediationGaps') || '[]');
        if (!gaps.some(g => g.gap === gapLabel && g.userId === userId)) {
          gaps.push({
            userId,
            gap:        gapLabel,
            subject:    subjectName || '',
            subjectId:  subjectId || '',
            lessonId:   lesson.id || '',
            lessonTitle: lesson.title || '',
            difficulty: percentage < 30 ? 'hard' : 'medium',
            completed:  false,
            date:       new Date().toISOString().split('T')[0],
          });
          localStorage.setItem('remediationGaps', JSON.stringify(gaps));
        }
      }
    } catch (err) {
      console.error('Save quiz result error:', err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect if no data (e.g., direct access)
  if (!stateData) {
    return (
      <div dir={lang==='ar'?'rtl':'ltr'} style={{..._t,background:T.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Cairo',sans-serif"}}>
        <div style={{..._t,..._c(T),borderColor:T.yellowBorder,padding:"32px",textAlign:"center",maxWidth:"440px"}}>
          <AlertCircle style={{width:"48px",height:"48px",color:T.yellow,margin:"0 auto 16px"}} />
          <p style={{color:T.yellow,marginBottom:"16px",fontWeight:600}}>{t('no_results')}</p>
          <button onClick={() => navigate('/dashboard')} style={{..._t,background:"transparent",border:"none",color:T.accent,cursor:"pointer",fontWeight:700}}>{t('back_home')}</button>
        </div>
      </div>
    );
  }

  let feedbackMessage = "";
  let feedbackColor = T.green;
  
  if (percentage >= 90) {
    feedbackMessage = t('excellent');
    feedbackColor = T.green;
  } else if (percentage >= 75) {
    feedbackMessage = t('very_good');
    feedbackColor = T.accent;
  } else if (percentage >= 50) {
    feedbackMessage = t('good');
    feedbackColor = T.yellow;
  } else {
    feedbackMessage = t('needs_work');
    feedbackColor = T.red;
  }

  return (
    <div dir={lang==='ar'?'rtl':'ltr'} style={{..._t,background:T.bg,minHeight:"100vh",padding:"32px 16px",fontFamily:"'Cairo',sans-serif"}}>
      <div style={{maxWidth:"800px",margin:"0 auto",display:"flex",flexDirection:"column",gap:"24px"}}>
        
        {/* Score Card */}
        <div style={{..._t,..._c(T),padding:"40px",textAlign:"center",position:"relative",overflow:"hidden"}}>
            {/* Thin top accent bar */}
            <div style={{position:"absolute",top:0,right:0,width:"100%",height:"3px",background:percentage>=50?T.green:T.red,borderRadius:"3px"}} />
            
            <div style={{position:"relative",width:"128px",height:"128px",margin:"0 auto 24px"}}>
                <svg style={{width:"100%",height:"100%",transform:"rotate(-90deg)"}} viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="60" stroke={T.trackBg} strokeWidth="8" fill="transparent" />
                    <circle cx="64" cy="64" r="60" stroke={percentage>=50?T.green:T.red} strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377-(377*percentage)/100} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s ease"}} />
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:"2rem",fontWeight:900,color:T.accent}}>{percentage}%</span>
                </div>
            </div>

            <h1 style={{..._t,fontSize:"1.4rem",fontWeight:800,color:T.textPrimary,marginBottom:"8px"}}>{t('quiz_result')}</h1>
            <p style={{fontSize:"1rem",fontWeight:700,color:feedbackColor,marginBottom:"4px"}}>{feedbackMessage}</p>
            <p style={{color:T.textMuted,fontSize:"0.85rem"}}>
                {t('correct_of_prefix')} <span style={{fontWeight:700,color:T.accent}}>{score}</span> {t('correct_of_middle')} <span style={{fontWeight:700,color:T.accent}}>{total}</span> {t('correct_of_suffix')}
            </p>
        </div>

        {/* Action Buttons */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
            <button
                onClick={() => navigate(`/quiz/${quizId}`)}
                style={{..._t,background:T.accent,color:"#FFF",padding:"14px",borderRadius:"12px",fontWeight:700,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",fontSize:"0.9rem"}}
            >
                <RefreshCcw style={{width:"20px",height:"20px"}} /> {t('retake_quiz')}
            </button>
            <button 
                onClick={() => {
                    if (lesson && subjectId && resolvedLessonTeacherId != null) {
                        const courseDetailsPath = `/course-details?lessonId=${encodeURIComponent(String(lesson.id ?? lessonId ?? ''))}&teacherId=${encodeURIComponent(String(resolvedLessonTeacherId))}&subjectId=${encodeURIComponent(String(subjectId))}`;
                        navigate(courseDetailsPath, {
                            state: { lesson, subjectId, subjectName, teacherId: resolvedLessonTeacherId },
                        });
                    } else {
                        navigate('/dashboard');
                    }
                }}
                style={{..._t,background:"transparent",border:`1px solid ${T.border}`,color:T.textMuted,padding:"14px",borderRadius:"12px",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",fontSize:"0.9rem"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderAccent}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border}}
            >
                <ArrowRight style={{width:"20px",height:"20px",...(lang==='en'?{transform:"rotate(180deg)"}:{})}} /> {t('back_to_lesson')}
            </button>
        </div>

        {/* Smart Contextual CTA */}
        {percentage >= 90 ? (
          <button
              onClick={() => {
                  if (lesson && subjectId && resolvedLessonTeacherId != null) {
                      const courseDetailsPath = `/course-details?lessonId=${encodeURIComponent(String(lesson.id ?? lessonId ?? ''))}&teacherId=${encodeURIComponent(String(resolvedLessonTeacherId))}&subjectId=${encodeURIComponent(String(subjectId))}`;
                      navigate(courseDetailsPath, {
                          state: { lesson, subjectId, subjectName, teacherId: resolvedLessonTeacherId },
                      });
                  } else {
                      navigate('/dashboard');
                  }
              }}
              style={{..._t,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"14px",borderRadius:"12px",fontWeight:700,border:`1px solid ${T.greenBorder}`,background:T.greenDim,color:T.green,cursor:"pointer",fontSize:"0.9rem"}}
              onMouseEnter={e=>{e.currentTarget.style.background=T.green;e.currentTarget.style.color="#FFF"}}
              onMouseLeave={e=>{e.currentTarget.style.background=T.greenDim;e.currentTarget.style.color=T.green}}
          >
              <Award style={{width:"20px",height:"20px"}} />
              {lang === 'ar' ? 'إتقان تام! المتابعة للدرس التالي' : 'Mastery Achieved! Continue to Next Lesson'}
          </button>
        ) : (
          <button
              onClick={() =>
                  navigate('/weakness-report', {
                      state: { score, total, questions, userAnswers, lesson, subjectId },
                  })
              }
              style={{..._t,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"14px",borderRadius:"12px",fontWeight:700,border:`1px solid ${T.borderAccent}`,background:T.accentDim,color:T.accent,cursor:"pointer",fontSize:"0.9rem"}}
              onMouseEnter={e=>{e.currentTarget.style.background=T.accent;e.currentTarget.style.color="#FFF"}}
              onMouseLeave={e=>{e.currentTarget.style.background=T.accentDim;e.currentTarget.style.color=T.accent}}
          >
              <Brain style={{width:"20px",height:"20px"}} />
              {t('view_weakness_report')}
          </button>
        )}

        {/* Answer Review Section */}
        <div style={{..._t,..._c(T),padding:"32px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"24px"}}>
              <div style={_iw(T.iconBgA,T.iconBorderA,"36px","10px")}>
                <Award style={{color:T.iconA,width:"18px",height:"18px"}} strokeWidth={2} />
              </div>
              <h2 style={{..._t,color:T.textPrimary,fontSize:"1.2rem",fontWeight:800}}>{t('review_answers')}</h2>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
                {questions.map((q, index) => {
                    const userAnswerIndex = userAnswers[index];
                    const isCorrect = userAnswerIndex === q.correct;
                    const isSkipped = userAnswerIndex === null || userAnswerIndex === undefined;

                    return (
                        <div key={index} style={{..._t,padding:"16px 20px",borderRadius:"12px",border:`1px solid ${isCorrect?T.greenBorder:T.redBorder}`,background:isCorrect?T.greenDim:T.redDim}}>
                            <div style={{display:"flex",alignItems:"flex-start",gap:"12px"}}>
                                <div style={{..._t,marginTop:"2px",minWidth:"24px",height:"24px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",fontSize:"0.7rem",fontWeight:700,background:isCorrect?T.green:T.red}}>
                                    {index + 1}
                                </div>
                                <div style={{flex:1}}>
                                    <h3 style={{..._t,fontWeight:700,color:T.textPrimary,marginBottom:"12px",fontSize:"0.9rem"}}>{q.question}</h3>
                                    
                                    <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                                        <div style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"0.82rem"}}>
                                            <span style={{color:T.textDim}}>{t('your_answer')}:</span>
                                            {isSkipped ? (
                                                <span style={{color:T.yellow,fontWeight:600,display:"flex",alignItems:"center",gap:"4px"}}>
                                                    <AlertCircle style={{width:"16px",height:"16px"}} /> {t('not_answered')}
                                                </span>
                                            ) : (
                                                <span style={{fontWeight:700,display:"flex",alignItems:"center",gap:"4px",color:isCorrect?T.green:T.red}}>
                                                    {isCorrect ? <CheckCircle2 style={{width:"16px",height:"16px"}} /> : <XCircle style={{width:"16px",height:"16px"}} />}
                                                    {q.options[userAnswerIndex]}
                                                </span>
                                            )}
                                        </div>

                                        {!isCorrect && (
                                            <div style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"0.82rem",background:T.greenDim,border:`1px solid ${T.greenBorder}`,padding:"8px 12px",borderRadius:"8px"}}>
                                                <span style={{color:T.textDim}}>{t('correct_answer')}:</span>
                                                <span style={{fontWeight:700,color:T.green,display:"flex",alignItems:"center",gap:"4px"}}>
                                                    <CheckCircle2 style={{width:"16px",height:"16px"}} />
                                                    {q.options[q.correct]}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

      </div>
    </div>
  );
};

export default QuizResults;
