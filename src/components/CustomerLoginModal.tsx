import React from 'react';
import { X, Send, ShieldCheck, Phone, User, AtSign } from 'lucide-react';
import { CustomerAuthProfile } from '../lib/firebaseClient';
import { Language } from '../data/storeData';

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onGoogleLogin: () => Promise<void>;
  onTelegramLogin: (profile: CustomerAuthProfile) => void;
}

export const CustomerLoginModal: React.FC<CustomerLoginModalProps> = ({
  isOpen,
  onClose,
  lang,
  onGoogleLogin,
  onTelegramLogin,
}) => {
  const [tab, setTab] = React.useState<'google' | 'telegram'>('google');
  const [isLoadingGoogle, setIsLoadingGoogle] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  // Telegram Login fields
  const [tgName, setTgName] = React.useState('');
  const [tgPhone, setTgPhone] = React.useState('');
  const [tgUsername, setTgUsername] = React.useState('');

  if (!isOpen) return null;

  const handleGoogleClick = async () => {
    setErrorMsg('');
    setIsLoadingGoogle(true);
    try {
      await onGoogleLogin();
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'មិនអាចចូលគណនី Google បានទេ សូមព្យាយាមម្ដងទៀត។';
      if (!msg.includes('popup-closed-by-user')) {
        setErrorMsg(
          lang === 'km'
            ? 'មិនអាចចូលគណនី Google បានទេ សូមពិនិត្យការអនុញ្ញាតផ្ទាំង Popup។'
            : 'Could not sign in with Google. Please allow popups and try again.'
        );
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleTelegramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanPhone = tgPhone.trim();
    const cleanUsername = tgUsername.trim().replace(/^@/, '');
    const cleanName = tgName.trim();

    if (!cleanPhone && !cleanUsername) {
      setErrorMsg(
        lang === 'km'
          ? 'សូមបញ្ចូលលេខទូរស័ព្ទ Telegram ឬ Username Telegram របស់អ្នក។'
          : 'Please enter your Telegram Phone Number or @Username.'
      );
      return;
    }

    const displayName =
      cleanName ||
      (cleanUsername ? `@${cleanUsername}` : `Telegram (${cleanPhone})`);

    const safeId = (cleanPhone || cleanUsername).replace(/[^a-zA-Z0-9_-]/g, '');
    const profile: CustomerAuthProfile = {
      uid: `tg-${safeId || Date.now()}`,
      provider: 'telegram',
      displayName: displayName.slice(0, 120),
      phone: cleanPhone.slice(0, 40),
      telegramUsername: cleanUsername ? `@${cleanUsername.slice(0, 75)}` : undefined,
    };

    onTelegramLogin(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-neutral-200 font-khmer animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-neutral-200 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#5B21D6]">
              SN STORE CUSTOMER ACCOUNT
            </span>
            <h3 className="text-lg font-bold text-[#111111] mt-0.5">
              {lang === 'km'
                ? 'ចូលគណនីភ្ញៀវ (Customer Login)'
                : 'Customer Sign In'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {lang === 'km'
                ? 'ចូលជាមួយ Google Account ឬគណនី Telegram របស់អ្នកដើម្បីកម្មង់ទំនិញកាន់តែរហ័ស'
                : 'Sign in with your Google Account or Telegram for faster checkout & order tracking'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-[#111111] hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Switch Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F7F7F8] border border-neutral-200">
          <button
            type="button"
            onClick={() => {
              setTab('google');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              tab === 'google'
                ? 'bg-white text-[#111111] shadow-xs border border-neutral-200/80'
                : 'text-neutral-600 hover:text-[#111111]'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>Google Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('telegram');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              tab === 'telegram'
                ? 'bg-[#0088cc] text-white shadow-xs'
                : 'text-neutral-600 hover:text-[#111111]'
            }`}
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span>Telegram គាត់</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC2626]">
            {errorMsg}
          </div>
        )}

        {tab === 'google' ? (
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-xl bg-[#F7F7F8] border border-neutral-200/80 space-y-2 text-xs text-neutral-600">
              <div className="font-semibold text-[#111111] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                <span>
                  {lang === 'km'
                    ? 'ចូលដោយសុវត្ថិភាពជាមួយគណនី Google ផ្លូវការ'
                    : 'Secure Official Google Account Sign-In'}
                </span>
              </div>
              <p className="leading-relaxed">
                {lang === 'km'
                  ? 'ប្រព័ន្ធនឹងបំពេញឈ្មោះ និងអ៊ីមែលរបស់អ្នកដោយស្វ័យប្រវត្តិនៅក្នុងទម្រង់កម្មង់ទំនិញ និងរក្សាទុកប្រវត្តិវិក្កយបត្ររបស់អ្នក។'
                  : 'Automatically fills your name and email during checkout and links your order invoices.'}
              </p>
            </div>

            <button
              type="button"
              disabled={isLoadingGoogle}
              onClick={handleGoogleClick}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-neutral-50 text-[#111111] border border-neutral-300 hover:border-[#5B21D6] font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-2xs disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>
                {isLoadingGoogle
                  ? lang === 'km'
                    ? 'កំពុងភ្ជាប់ទៅ Google...'
                    : 'Connecting to Google...'
                  : lang === 'km'
                  ? 'បន្តជាមួយ Google Account'
                  : 'Continue with Google Account'}
              </span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleTelegramSubmit} className="space-y-3.5 pt-1 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                {lang === 'km' ? 'ឈ្មោះរបស់អ្នក (Customer Name)' : 'Your Name'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tgName}
                  onChange={(e) => setTgName(e.target.value)}
                  placeholder={lang === 'km' ? 'ឧ. សុខា ដារ៉ា' : 'e.g. Sokha Dara'}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#0088cc]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                {lang === 'km'
                  ? 'លេខទូរស័ព្ទ Telegram (Telegram Phone Number) *'
                  : 'Telegram Phone Number *'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required={!tgUsername.trim()}
                  value={tgPhone}
                  onChange={(e) => setTgPhone(e.target.value)}
                  placeholder="012 888 990 / 096 441 902"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 font-mono-num focus:outline-none focus:border-[#0088cc]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                {lang === 'km'
                  ? 'Telegram Username (មិនบังคับ បើមាន)'
                  : 'Telegram @Username (Optional)'}
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tgUsername}
                  onChange={(e) => setTgUsername(e.target.value)}
                  placeholder="username"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 font-mono-num focus:outline-none focus:border-[#0088cc]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <Send className="w-4 h-4" />
              <span>
                {lang === 'km'
                  ? 'ចូលគណនីជាមួយ Telegram'
                  : 'Sign In with Telegram'}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
