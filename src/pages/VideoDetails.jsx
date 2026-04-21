import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Loader2, AlertTriangle, Trash2, Video } from 'lucide-react';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';

const VideoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [videoInfo, setVideoInfo] = useState({
    title: '',
    lessonTitle: '',
    videoUrl: '',
  });

  const fetchVideo = useCallback(async () => {
    if (!id) {
      setError('معرّف الفيديو غير متوفر.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/videos/${id}`);
      const payload = data?.video || data?.data?.video || data?.data || data || {};

      setVideoInfo({
        title: payload.video_title || payload.title || payload.lesson_title || `فيديو #${id}`,
        lessonTitle: payload.lesson_title || payload.lesson?.title || '—',
        videoUrl: payload.video_url || payload.url || '',
      });
    } catch (err) {
      console.error('Failed to load video details:', err);
      setError('تعذّر تحميل بيانات الفيديو.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const handleDelete = async () => {
    if (!id) {
      alert('معرّف الفيديو غير متوفر.');
      return;
    }

    const confirmed = window.confirm('هل أنت متأكد من حذف هذا العنصر نهائياً؟');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await api.delete(`/videos/${id}`);
      alert('تم حذف الفيديو بنجاح.');
      navigate('/teacher-analytics', { replace: true });
    } catch (err) {
      console.error('Delete video error:', err);
      alert('تعذّر حذف الفيديو. حاول مرة أخرى.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate('/teacher-analytics')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-[#103B66] dark:hover:text-white transition shrink-0"
            >
              <ArrowRight className={`w-4 h-4 ${lang === 'en' ? 'rotate-180' : ''}`} />
              العودة للتحليلات
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-[#103B66] dark:text-blue-400 truncate">
              {videoInfo.title || 'تفاصيل الفيديو'}
            </h1>
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting || loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'جاري الحذف...' : 'حذف الفيديو'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#103B66] dark:text-blue-400 mb-3" />
            <p className="text-sm font-medium">جارٍ تحميل بيانات الفيديو...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={fetchVideo}
              className="text-sm font-bold text-[#103B66] dark:text-blue-300 hover:underline"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center gap-2 text-gray-800 dark:text-white font-bold">
              <Video className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
              {videoInfo.title || 'فيديو بدون عنوان'}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              الدرس: {videoInfo.lessonTitle || '—'}
            </p>
            {videoInfo.videoUrl ? (
              <a
                href={videoInfo.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-bold text-[#103B66] dark:text-blue-300 hover:underline"
              >
                فتح رابط الفيديو
              </a>
            ) : (
              <p className="text-sm text-gray-400">لا يوجد رابط فيديو متاح.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default VideoDetails;
