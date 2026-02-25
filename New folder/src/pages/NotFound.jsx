import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const NotFound = () => {
    const navigate = useNavigate();
    const { t, lang } = useLanguage();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="max-w-md w-full px-6 py-12 bg-white dark:bg-gray-800 shadow-lg rounded-2xl text-center border border-gray-100 dark:border-gray-700">
                <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                </div>

                <h1 className="text-6xl font-black text-[#103B66] mb-4">404</h1>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('not_found_msg')}</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                    {t('not_found_desc')}
                </p>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-[#103B66] text-white py-3 rounded-xl font-bold hover:bg-[#0c2d4d] transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10"
                >
                    <Home className="w-5 h-5" />
                    {t('back_to_home')}
                </button>
            </div>
        </div>
    );
};

export default NotFound;
