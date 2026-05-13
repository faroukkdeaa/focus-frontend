import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Mail, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LangToggle from '../components/LangToggle';
import Logo from '../components/FullLogo';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((r) => setTimeout(r, 1500));
      setSuccess(true);
    } catch {
      setError('حدث خطأ. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Language Toggle */}
      <div className="absolute top-4 end-4">
        <LangToggle />
      </div>

      {/* Logo & title */}
      <div className="text-center mb-8">
        <Logo className="justify-center mb-6 scale-110" />
        <p className="text-gray-500 text-lg">{t('tagline')}</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">{t('forgot_title')}</h2>
        <p className="text-center text-gray-400 mb-6 text-sm">{t('forgot_subtitle')}</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm text-center">
            {t('success_sent')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-600 text-sm font-bold mb-2">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="ahmed@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg ps-4 pe-11 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] disabled:opacity-60"
                  dir="ltr"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#103B66] hover:bg-[#0c2d4d] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition duration-300 shadow-lg mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('sending')}
                </>
              ) : (
                t('send_reset')
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-[#103B66] font-bold hover:underline text-sm"
          >
            <ArrowRight className="w-4 h-4" />
            {t('back_to_login')}
          </Link>
        </div>
      </div>

      {/* Back to home */}
      <div className="mt-8" onClick={() => navigate('/')}>
        <button
          type="button"
          className="text-gray-500 flex items-center gap-2 hover:text-[#103B66] transition"
        >
          <ArrowRight className="w-4 h-4" />
          {t('back_to_home')}
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
