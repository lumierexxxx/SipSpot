// ============================================
// SipSpot Frontend - SubmitSuccessPage
// 提交成功页面
// ============================================

import { useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Coffee, CheckCircle, Clock, Eye, Star, ArrowRight, Sparkles, MapPin, Plus, Home } from 'lucide-react';
import { motion } from 'motion/react';

const STEPS = [
  { icon: CheckCircle, title: '提交成功', desc: '您的咖啡店信息已安全保存。', color: 'text-emerald-500', bg: 'bg-emerald-50', done: true },
  { icon: Eye, title: '等待审核', desc: '我们的团队正在核实信息和图片。', color: 'text-amber-600', bg: 'bg-amber-50', done: false },
  { icon: Star, title: '正式上线', desc: '数千名咖啡爱好者将能发现您的店铺。', color: 'text-violet-500', bg: 'bg-violet-50', done: false },
];

const TIPS = [
  { icon: Star, title: '鼓励评价', desc: '店铺上线后，邀请您的常客在 SipSpot 上留下评价。' },
  { icon: MapPin, title: '保持更新', desc: '随时登录更新营业时间、图片或菜单详情。' },
  { icon: Sparkles, title: '添加更多图片', desc: '拥有5张以上图片的店铺，点击量是图片较少店铺的3倍。' },
];

function Particle({ x, delay }) {
  return (
    <motion.div
      className="absolute text-amber-200 select-none pointer-events-none"
      style={{ left: `${x}%`, fontSize: '1.1rem' }}
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: -120, opacity: [0, 0.7, 0] }}
      transition={{ duration: 3.5, delay, repeat: Infinity, repeatDelay: 2 }}
    >
      ☕
    </motion.div>
  );
}

export default function SubmitSuccessPage() {
  const location = useLocation();
  const state = location.state;
  const cafeName = state?.cafeName || '您的咖啡店';
  const city = state?.city || '';

  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowTips(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 pb-24 flex flex-col">
      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 relative overflow-hidden flex-shrink-0">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-amber-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-48 bg-amber-800/10 rounded-full blur-3xl" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[12, 28, 45, 62, 78].map((x, i) => (
            <Particle key={i} x={x} delay={i * 0.7} />
          ))}
        </div>

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          {/* Animated check ring */}
          <motion.div
            className="relative w-28 h-28 mx-auto mb-8"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
          >
            <div className="absolute inset-0 rounded-full border-2 border-amber-600/30" />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-amber-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            />
            <div className="absolute inset-3 bg-amber-700 rounded-full flex items-center justify-center shadow-lg shadow-amber-900/40">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.4 }}
              >
                <CheckCircle className="w-9 h-9 text-white" />
              </motion.div>
            </div>
            {/* Sparkle dots */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
              <motion.div
                key={deg}
                className="absolute w-2 h-2 bg-amber-400 rounded-full"
                style={{
                  top: '50%', left: '50%',
                  transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-52px)`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.05 }}
              />
            ))}
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 bg-amber-700/20 border border-amber-600/30 text-amber-300 rounded-full px-4 py-1.5 mb-5" style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>
              <Sparkles className="w-3.5 h-3.5" />
              提交成功
            </span>
            <h1 className="text-white mb-3" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              {cafeName} 正在路上！
            </h1>
            <p className="text-stone-400 max-w-lg mx-auto" style={{ fontSize: '0.95rem', lineHeight: 1.65 }}>
              {city && <span className="text-stone-300">{city} · </span>}
              您的咖啡店已提交成功，经过团队审核通过后将正式在 SipSpot 上展示。
            </p>
          </motion.div>

          <motion.div
            className="flex items-center justify-center gap-2 mt-6 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 max-w-xs mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-stone-300" style={{ fontSize: '0.88rem' }}>
              预计审核时间：<strong className="text-white">24–48小时</strong>
            </span>
          </motion.div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full py-12 flex flex-col gap-8">
        {/* Review Timeline */}
        <motion.div
          className="bg-white rounded-3xl border border-stone-100 shadow-sm p-7"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-stone-900 mb-6" style={{ fontSize: '1.05rem', fontWeight: 700 }}>接下来会发生什么？</h2>
          <div className="flex flex-col gap-0">
            {STEPS.map(({ icon: Icon, title, desc, color, bg, done }, i) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${done ? bg : 'bg-stone-100'}`}>
                    <Icon className={`w-5 h-5 ${done ? color : 'text-stone-400'}`} />
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-0.5 h-8 mt-1 ${done ? 'bg-emerald-200' : 'bg-stone-100'}`} />
                  )}
                </div>
                <div className="pb-7 pt-1.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={done ? 'text-stone-900' : 'text-stone-500'} style={{ fontSize: '0.9rem', fontWeight: done ? 700 : 500 }}>
                      {title}
                    </span>
                    {done && (
                      <span className="bg-emerald-100 text-emerald-600 rounded-full px-2 py-0.5" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                        完成 ✓
                      </span>
                    )}
                    {i === 1 && (
                      <span className="bg-amber-100 text-amber-600 rounded-full px-2 py-0.5" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                        排队中
                      </span>
                    )}
                  </div>
                  <p className="text-stone-400" style={{ fontSize: '0.83rem', lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tips while you wait */}
        {showTips && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-stone-700 mb-4 px-1" style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              等待期间…
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {TIPS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-stone-800 mb-1" style={{ fontSize: '0.88rem', fontWeight: 600 }}>{title}</p>
                    <p className="text-stone-400" style={{ fontSize: '0.8rem', lineHeight: 1.55 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2.5 bg-amber-700 hover:bg-amber-800 text-white py-3.5 rounded-2xl transition-all shadow-sm hover:shadow-md"
            style={{ fontSize: '0.9rem', fontWeight: 600 }}
          >
            <Home className="w-4 h-4" />
            返回首页
          </Link>
          <Link
            to="/cafes"
            className="flex-1 flex items-center justify-center gap-2.5 bg-white hover:bg-stone-50 border border-stone-200 hover:border-amber-300 text-stone-700 py-3.5 rounded-2xl transition-all"
            style={{ fontSize: '0.9rem', fontWeight: 600 }}
          >
            <Coffee className="w-4 h-4" />
            探索其他咖啡店
          </Link>
          <Link
            to="/cafes/new"
            className="sm:w-auto flex items-center justify-center gap-2 border border-stone-200 bg-stone-50 hover:bg-white text-stone-600 hover:text-stone-900 py-3.5 px-5 rounded-2xl transition-all"
            style={{ fontSize: '0.9rem' }}
          >
            <Plus className="w-4 h-4" />
            再添加一家
          </Link>
        </motion.div>

        {/* Friendly note */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-3">
          <Coffee className="text-amber-600 mt-0.5 flex-shrink-0" style={{ width: '1.1rem', height: '1.1rem' }} />
          <div>
            <p className="text-amber-800" style={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.4 }}>
              对提交有疑问？
            </p>
            <p className="text-amber-700 mt-0.5" style={{ fontSize: '0.82rem', lineHeight: 1.55 }}>
              联系我们时请注明咖啡店名称，我们是一支热爱咖啡的小团队，很乐意帮助您。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
