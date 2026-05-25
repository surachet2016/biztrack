import { createFileRoute, Link } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth.js';
import { PACKAGES } from '@biztrack/shared/constants';
import { formatBaht } from '@biztrack/shared/utils';
import { CheckCircle, MessageCircle, BarChart2, Star, Zap } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-green-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-green-700">BizTrack</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                เข้าสู่แดชบอร์ด
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-green-700 text-sm font-medium hover:underline">เข้าสู่ระบบ</Link>
                <Link to="/register" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                  สมัครสมาชิก
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm px-4 py-2 rounded-full mb-6 font-medium">
          <Star className="w-4 h-4" /> ผู้ช่วยธุรกิจ AI สำหรับคนไทย
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          จัดการธุรกิจ<br />
          <span className="text-green-600">ด้วย AI</span> ง่ายกว่าที่เคย
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
          วิเคราะห์รายรับ-รายจ่ายจากใบเสร็จ เสียงพูด หรือข้อความ
          พร้อมแจ้งเตือนสินค้าขายไม่ออกและคำนวณ Zakat โดย AI
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/register" className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition text-lg">
            เริ่มต้นฟรี →
          </Link>
          <a href="#pricing" className="border border-green-200 text-green-700 px-6 py-3 rounded-xl font-medium hover:bg-green-50 transition text-lg">
            ดูราคา
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="bg-green-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">ฟีเจอร์ครบครัน</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: MessageCircle, title: 'AI Chat วิเคราะห์', desc: 'พิมพ์ พูด หรืออัปโหลดใบเสร็จ — AI วิเคราะห์รายรับ-รายจ่ายให้ทันที' },
              { icon: BarChart2, title: 'รายงานธุรกิจ', desc: 'ดูสรุปรายรับ-รายจ่าย แจ้งเตือนสินค้าขายไม่ออก และคำแนะนำการขาย' },
              { icon: Star, title: 'คำนวณ Zakat', desc: 'คำนวณ Zakat จากรายได้ประจำปีอัตโนมัติ พร้อมบันทึกการจ่าย' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">แพ็กเกจราคา</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {Object.values(PACKAGES).map((pkg) => (
            <div key={pkg.id} className={`rounded-2xl p-6 border-2 relative ${pkg.popular ? 'border-green-600 shadow-lg' : 'border-green-100'}`}>
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  แนะนำ
                </div>
              )}
              <h3 className="font-bold text-xl text-gray-800 mb-1">{pkg.nameTh}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-green-600">{formatBaht(pkg.price)}</span>
                <span className="text-gray-400 text-sm">/{pkg.periodTh}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`block text-center py-2 rounded-xl font-medium text-sm transition ${pkg.popular ? 'bg-green-600 text-white hover:bg-green-700' : 'border border-green-200 text-green-700 hover:bg-green-50'}`}
              >
                เริ่มใช้งาน
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-100 py-8 text-center text-sm text-gray-400">
        © 2025 BizTrack — ผู้ช่วยธุรกิจอัจฉริยะสำหรับคนไทย
      </footer>
    </div>
  );
}
