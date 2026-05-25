import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { signUp, signInWithGoogle } from '@/lib/auth-store.js';
import { Zap, CheckCircle2, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
});

const FREE_FEATURES = [
  'AI Chat พิมพ์ข้อความถามได้ไม่จำกัด',
  'แดชบอร์ดภาพรวมธุรกิจ',
  'จัดการสินค้าและสต็อก',
  'คำนวณ Zakat',
];

function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('รหัสผ่านไม่ตรงกัน');
    if (form.password.length < 6) return setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');

    setLoading(true);
    try {
      await signUp(form.email, form.password, form.name);
      setSuccess(true);
      setTimeout(() => navigate({ to: '/dashboard' }), 2000);
    } catch (err) {
      const msgs = {
        'User already registered': 'Email นี้ถูกใช้งานแล้ว',
        'Password should be at least 6 characters': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
      };
      setError(msgs[err.message] || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - free features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-white/5 rounded-full" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-xl">BizTrack</span>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            เริ่มต้นฟรี<br />ไม่ต้องใช้<br />บัตรเครดิต
          </h2>
          <p className="text-green-100 text-lg">สมัครวันนี้ รับแพ็กเกจฟรีทันที</p>
        </div>

        <div className="relative">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-5 mb-4">
            <p className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</span>
              แพ็กเกจฟรี ได้รับ:
            </p>
            <ul className="space-y-2.5">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-300 flex-shrink-0" />
                  <span className="text-white/90 text-sm">{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-green-200/70 text-xs">อัปเกรดได้ทุกเวลาเพื่อใช้ฟีเจอร์เพิ่มเติม</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-800 text-xl">BizTrack</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">สมัครสมาชิก</h1>
            <p className="text-gray-400 text-sm mt-1">สร้างบัญชีฟรีของคุณ</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {success && (
              <div className="bg-green-50 border border-green-100 text-green-700 text-sm p-4 rounded-xl mb-5 text-center">
                <div className="text-2xl mb-1">🎉</div>
                <p className="font-semibold">สมัครสำเร็จ!</p>
                <p className="text-green-500 text-xs mt-0.5">กำลังพาไปแดชบอร์ด...</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl mb-5">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 text-sm transition"
                  placeholder="กรอกชื่อ-นามสกุล"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 text-sm transition"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสผ่าน</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 text-sm transition"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ยืนยันรหัสผ่าน</label>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 text-sm transition"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                />
              </div>
              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-600 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-green-200 mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังสมัคร...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    สมัครสมาชิกฟรี <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>
            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">หรือ</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Google button */}
            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              สมัครด้วย Google
            </button>

            <p className="text-center text-sm text-gray-400 mt-4">
              มีบัญชีแล้ว?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">เข้าสู่ระบบ</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
