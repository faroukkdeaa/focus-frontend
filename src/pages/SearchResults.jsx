import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, User, BookOpen, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/api';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [currentPage, setCurrentPage] = useState(1);
  
  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isRtl = lang === 'ar';
  
  useEffect(() => {
    setCurrentPage(1); // Reset page when query changes
  }, [query]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    let isMounted = true;
    const fetchResults = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/search', { params: { statement: query, page: currentPage } });
        if (isMounted) {
          const data = response.data?.data || response.data || [];
          const meta = response.data?.meta || response.data;
          
          setResults(Array.isArray(data) ? data : (data.data || []));
          setTotalPages(meta?.last_page || data?.last_page || 1);
        }
      } catch (err) {
        console.error('Search error:', err);
        if (isMounted) setError(t('error_fetching_search_results') || 'حدث خطأ أثناء جلب النتائج.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchResults();
    return () => { isMounted = false; };
  }, [query, currentPage, t]);

  // theme styling
  const tr = { transition: "all 0.3s ease" };
  const T = {
    bg: isDark ? "#0B1120" : "#F8FAFC",
    cardBg: isDark ? "rgba(30,41,59,0.5)" : "#FFFFFF",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    textPrimary: isDark ? "#F1F5F9" : "#1E293B",
    textMuted: isDark ? "#94A3B8" : "#64748B",
    accent: isDark ? "#3B82F6" : "#103B66",
    accentHover: isDark ? "#2563EB" : "#0c2d4d",
  };

  const handleResultClick = (result) => {
    const isLessonOrSubtopic = result.search_type === 'lesson' || result.search_type === 'subtopic';
    if (isLessonOrSubtopic) {
      // Navigate to LessonInterface
      const lessonId = result.lesson_id || result.id;
      const teacherId = result.teacher_id;
      const subjectId = result.subject_id;
      
      const courseDetailsPath = `/course-details?lessonId=${encodeURIComponent(String(lessonId))}&teacherId=${encodeURIComponent(String(teacherId))}&subjectId=${encodeURIComponent(String(subjectId))}`;
      
      // Ensure 'lesson' and other needed payload properties are attached to 'state' based on what LessonInterface needs
      navigate(courseDetailsPath, {
        state: {
          lessonId: lessonId,
          teacherId: teacherId,
          subjectId: subjectId,
          subjectName: result.subject_name,
        }
      });
    } else if (result.search_type === 'teacher') {
      // Navigate to Subject/Teacher page
      if (result.subject_id) {
        navigate(`/subject/${result.subject_id}`);
      }
    }
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ ...tr, background: T.bg, minHeight: "100vh", fontFamily: "'Cairo', sans-serif" }} className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 style={{ color: T.textPrimary }} className="text-2xl md:text-3xl font-bold mb-6">
          نتائج البحث عن: <span style={{ color: T.accent }}>"{query}"</span>
        </h1>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 style={{ color: T.accent }} className="w-10 h-10 animate-spin mb-4" />
            <p style={{ color: T.textMuted }}>{t('searching') || 'جاري البحث...'}</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl text-center">
            <p>{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div style={{ background: T.cardBg, borderColor: T.border }} className="border rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <div style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} className="w-20 h-20 rounded-full flex items-center justify-center mb-4">
              <Search style={{ color: T.textMuted }} className="w-10 h-10" />
            </div>
            <h2 style={{ color: T.textPrimary }} className="text-xl font-bold mb-2">لا توجد نتائج بحث عن: "{query}"</h2>
            <p style={{ color: T.textMuted }}>يرجى التأكد من كتابة الكلمة بشكل صحيح أو تجربة كلمات أخرى.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {results.map((result, idx) => {
                const isLessonOrSubtopic = result.search_type === 'lesson' || result.search_type === 'subtopic';
                const isTeacher = result.search_type === 'teacher';
                
                let mainTitle = '';
                let subTitle = '';
                
                if (isLessonOrSubtopic) {
                  mainTitle = result.title || result.name || result.lesson_title || 'بدون عنوان';
                  subTitle = result.teacher_name || 'مدرس غير محدد';
                } else if (isTeacher) {
                  mainTitle = result.teacher_name || 'مدرس غير محدد';
                  subTitle = result.subject_name || 'مادة غير محددة';
                } else {
                  mainTitle = result.title || result.name || result.teacher_name || 'نتيجة';
                  subTitle = result.subject_name || 'مادة غير محددة';
                }

                const typeLabels = {
                  teacher: 'مدرس',
                  lesson: 'درس',
                  subtopic: 'موضوع فرعي'
                };
                const displayType = typeLabels[result.search_type] || result.search_type;

                return (
                <div 
                  key={idx} 
                  onClick={() => handleResultClick(result)}
                  style={{ background: T.cardBg, borderColor: T.border, backdropFilter: "blur(10px)", cursor: "pointer" }} 
                  className="border rounded-2xl p-5 hover:shadow-lg transition-transform hover:-translate-y-1 hover:bg-opacity-80"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 border-2" style={{ borderColor: T.border }}>
                      {result.teacher_profile_picture ? (
                        <img 
                          src={result.teacher_profile_picture.startsWith('http') ? result.teacher_profile_picture : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000'}/storage/${result.teacher_profile_picture.replace(/^\/+/, '')}`} 
                          alt={mainTitle} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(mainTitle || 'User')}&background=1e293b&color=fff&size=128`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xl">
                          {(mainTitle || 'T')[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 style={{ color: T.textPrimary }} className="font-bold text-lg truncate mb-1">{mainTitle}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <User style={{ color: T.textMuted }} className="w-4 h-4" />
                        <span style={{ color: T.textMuted }} className="text-sm truncate">{displayType}</span>
                      </div>
                      {subTitle && (
                        <div className="flex items-center gap-2">
                          <BookOpen style={{ color: T.accent }} className="w-4 h-4" />
                          <span style={{ color: T.accent }} className="text-sm font-semibold truncate">{subTitle}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ 
                    background: currentPage === 1 ? 'transparent' : T.cardBg, 
                    color: currentPage === 1 ? T.textMuted : T.textPrimary,
                    borderColor: T.border
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 rtl:-scale-x-100" />
                  السابق
                </button>
                <div style={{ color: T.textMuted }}>
                  صفحة <span style={{ color: T.textPrimary }} className="font-bold mx-1">{currentPage}</span> من {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ 
                    background: currentPage === totalPages ? 'transparent' : T.cardBg, 
                    color: currentPage === totalPages ? T.textMuted : T.textPrimary,
                    borderColor: T.border
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border disabled:opacity-50 transition-colors"
                >
                  التالي
                  <ChevronLeft className="w-5 h-5 rtl:-scale-x-100" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
