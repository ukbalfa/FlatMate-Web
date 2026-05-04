'use client';
import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  TrendingUp,
  Receipt,
  Sparkles,
  CheckSquare,
  Users,
  ArrowRight,
  DollarSign,
  ChevronRight,
  Star,
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';

const FEATURES = [
  {
    icon: DollarSign,
    titleKey: 'landing.feature.rentTracking.title',
    descriptionKey: 'landing.feature.rentTracking.description',
    color: 'text-[#F97316]',
  },
  {
    icon: Receipt,
    titleKey: 'landing.feature.expenseSplitting.title',
    descriptionKey: 'landing.feature.expenseSplitting.description',
    color: 'text-[#F97316]',
  },
  {
    icon: Sparkles,
    titleKey: 'landing.feature.cleaningSchedule.title',
    descriptionKey: 'landing.feature.cleaningSchedule.description',
    color: 'text-[#F97316]',
  },
  {
    icon: TrendingUp,
    titleKey: 'landing.feature.exchangeRates.title',
    descriptionKey: 'landing.feature.exchangeRates.description',
    color: 'text-[#F97316]',
  },
  {
    icon: CheckSquare,
    titleKey: 'landing.feature.taskManager.title',
    descriptionKey: 'landing.feature.taskManager.description',
    color: 'text-[#F97316]',
  },
  {
    icon: Users,
    titleKey: 'landing.feature.roommateProfiles.title',
    descriptionKey: 'landing.feature.roommateProfiles.description',
    color: 'text-[#F97316]',
  },
];

const TESTIMONIALS = [
  {
    quoteKey: 'landing.testimonials.quote1',
    authorKey: 'landing.testimonials.author1',
    roleKey: 'landing.testimonials.role1',
    avatar: 'U',
  },
  {
    quoteKey: 'landing.testimonials.quote2',
    authorKey: 'landing.testimonials.author2',
    roleKey: 'landing.testimonials.role2',
    avatar: 'J',
  },
  {
    quoteKey: 'landing.testimonials.quote3',
    authorKey: 'landing.testimonials.author3',
    roleKey: 'landing.testimonials.role3',
    avatar: 'D',
  },
];

const TRUSTED_BY = ['TASHMI', 'INHA', 'WIUT', 'TUIT', 'Webster'];

function FeatureCard({ feature, index, t }: { feature: typeof FEATURES[0]; index: number; t: (key: string) => string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] as const }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative bg-white border border-[#F0D89A] rounded-3xl p-7 hover:border-[#F97316] hover:shadow-[0_0_32px_rgba(249,115,22,0.15)] transition-all duration-300 cursor-pointer"
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
        className="mb-5"
      >
        <div className="w-14 h-14 rounded-2xl gradient-citrus flex items-center justify-center">
          <feature.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
        </div>
      </motion.div>
      <h3 className="text-lg font-bold text-[#1C1400] mb-2" style={{ fontFamily: 'var(--font-sora)' }}>{t(feature.titleKey)}</h3>
      <p className="text-sm text-[#7C6A3A] leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>{t(feature.descriptionKey)}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const { t } = useI18n();
  const { scrollY } = useScroll();
  const heroRef = useRef<HTMLDivElement>(null);

  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] text-[#1C1400] overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[rgba(255,251,240,0.85)] backdrop-blur-md border-b border-[#F0D89A]"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700 }} className="text-lg text-[#1C1400]">🏠 FlatMate</span>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={scrollToFeatures}
                className="text-sm transition-colors hidden sm:block" style={{ fontFamily: 'var(--font-dm-sans)', color: '#9A7C4A' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#F97316'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9A7C4A'}
              >
                Features
              </button>
              <Link
                href="/login"
                className="gradient-citrus text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                style={{ fontFamily: 'var(--font-sora)' }}
              >
                {t('landing.nav.signIn')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background gradient */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#FFFBF0] via-[#FFF5DC] to-[#FFF0C0]" />

        {/* Decorative blobs */}
        <div className="citrus-blob w-[400px] h-[400px] bg-[#F97316] opacity-12 blur-[80px] top-[-100px] right-[5%]" />
        <div className="citrus-blob w-[300px] h-[300px] bg-[#FBBF24] opacity-15 blur-[60px] bottom-[5%] left-[10%]" />

        {/* Floating UI Elements with Parallax */}
        <motion.div
          style={{ y: y1, opacity }}
          className="absolute top-[22%] left-[8%] hidden lg:block z-20"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white border border-[#F0D89A] rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FFF0CC] flex items-center justify-center">
                <span className="text-lg">💰</span>
              </div>
              <div>
                <div className="text-xs font-medium" style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 500, color: '#9A7C4A' }}>{t('landing.hero.rentDue')}</div>
                <div className="text-base font-bold text-[#1C1400]" style={{ fontFamily: 'var(--font-sora)' }}>250,000 UZS</div>
              </div>
              <span className="ml-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ fontFamily: 'var(--font-sora)', background: '#84CC16' }}>{t('landing.hero.paid')}</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          style={{ y: y2, opacity }}
          className="absolute top-[28%] right-[10%] hidden lg:block z-20"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white border border-[#F0D89A] rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FFF0CC] flex items-center justify-center">
                <span className="text-lg">🧹</span>
              </div>
              <div>
                <div className="text-xs font-medium" style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 500, color: '#9A7C4A' }}>{t('landing.hero.kitchenMonday')}</div>
                 <div className="text-base font-bold text-[#1C1400]" style={{ fontFamily: 'var(--font-sora)' }}>{t('landing.hero.jasursTurn')}</div>
              </div>
              <span className="ml-2 relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#F97316]"></span>
              </span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          style={{ y: y1, opacity }}
          className="absolute bottom-[25%] left-[12%] hidden lg:block z-20"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white border border-[#F0D89A] rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FFF0CC] flex items-center justify-center">
                <span className="text-lg">📈</span>
              </div>
              <div>
                <div className="text-xs font-medium" style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 500, color: '#9A7C4A' }}>{t('landing.hero.usdUzs')}</div>
                <div className="text-base font-bold text-[#1C1400]" style={{ fontFamily: 'var(--font-sora)' }}>12,850</div>
              </div>
              <span className="ml-2 text-[10px] font-bold gradient-lime-text px-2 py-0.5 rounded-full" style={{ fontFamily: 'var(--font-sora)' }}>{t('landing.hero.plusPercent')}</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-30 max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#FFF0CC] border border-[#F0D89A] rounded-full px-4 py-1.5 mb-8">
              <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: '12px', color: '#B45309' }}>{t('landing.badge')}</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl sm:text-6xl lg:text-7xl mb-6 leading-tight text-[#1C1400]"
            style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, lineHeight: 1.1 }}
          >
            {t('landing.hero.titlePart1')}
            <br />
            <span className="gradient-citrus-text">{t('landing.hero.titlePart2')}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 400, color: '#7C6A3A', fontSize: '20px' }}
          >
            {t('landing.hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link
              href="/login"
              className="group gradient-citrus text-white px-8 py-4 text-base font-bold rounded-2xl flex items-center gap-2 hover:shadow-[0_0_32px_rgba(249,115,22,0.25)] hover:scale-105 transition-all"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              {t('landing.hero.getStarted')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={scrollToFeatures}
              className="bg-white border border-[#F0D89A] text-[#1C1400] px-8 py-4 text-base font-semibold rounded-2xl flex items-center gap-2 hover:border-[#F97316] transition-all"
              style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}
            >
              {t('landing.hero.seeFeatures')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-sm"
            style={{ fontFamily: 'var(--font-dm-mono)', fontWeight: 500, color: '#9A7C4A', fontSize: '12px' }}
          >
            {t('landing.hero.location')}
          </motion.div>
        </div>
      </section>

      {/* Marquee Strip */}
      <section className="relative py-3 bg-[#FFF0CC] border-y border-[#F0D89A] overflow-hidden">
        <div className="animate-marquee flex whitespace-nowrap">
          <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: '14px', color: '#B45309' }}>
            \u2726 {t('landing.marquee.sharedExpenses')} &nbsp;&nbsp;&nbsp; \u2726 {t('landing.marquee.cleaningSchedules')} &nbsp;&nbsp;&nbsp; \u2726 {t('landing.marquee.liveExchangeRates')} &nbsp;&nbsp;&nbsp; \u2726 {t('landing.marquee.taskManager')} &nbsp;&nbsp;&nbsp; \u2726 {t('landing.marquee.realtimeSync')} &nbsp;&nbsp;&nbsp; \u2726 {t('landing.marquee.roommateProfiles')} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </span>
          <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: '14px', color: '#B45309' }}>
            \u2726 {t('landing.marquee.sharedExpenses')} &nbsp;&nbsp;&nbsp; \u2726 {t('landing.marquee.cleaningSchedules')} &nbsp;&nbsp;&nbsp; \u2726 {t('landing.marquee.liveExchangeRates')} &nbsp;&nbsp;&nbsp; \u2726 {t('landing.marquee.taskManager')} &nbsp;&nbsp;&nbsp; \u2726 {t('landing.marquee.realtimeSync')} &nbsp;&nbsp;&nbsp; \u2726 {t('landing.marquee.roommateProfiles')} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </span>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-6 lg:px-8 bg-[#FFFBF0]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: '12px', color: '#F97316', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('landing.features.sectionLabel')}</span>
            <h2 className="text-4xl sm:text-5xl mt-4 mb-4 text-[#1C1400]" style={{ fontFamily: 'var(--font-sora)', fontWeight: 800 }}>
              {t('landing.features.title')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.titleKey} feature={feature} index={index} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-24 px-6 lg:px-8 bg-gradient-to-br from-[#FFF5DC] to-[#FFF0C0]">
        <div className="max-w-5xl mx-auto">
          {/* Main Quote Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-3xl border border-[#F0D89A] p-10 mb-12 relative overflow-hidden"
            style={{ boxShadow: '0 8px 40px rgba(249,115,22,0.12)' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#F97316] to-[#FBBF24]" />
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-[#F97316] text-[#F97316]" />
              ))}
            </div>
            <blockquote className="text-2xl sm:text-3xl mb-6 leading-relaxed italic" style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, color: '#1C1400' }}>
              &ldquo;{t('landing.testimonials.quote1')}&rdquo;
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <Image
                  src={`https://ui-avatars.com/api/?name=Ulugbek&background=F97316&color=fff`}
                  alt={t('landing.testimonials.author1')}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full"
                />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600, color: '#1C1400' }}>{t('landing.testimonials.author1')}</div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 400, color: '#9A7C4A', fontSize: '14px' }}>{t('landing.testimonials.role1')}</div>
              </div>
            </div>
          </motion.div>

          {/* Additional Testimonials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
            {TESTIMONIALS.slice(1).map((testimonial, index) => (
              <motion.div
                key={testimonial.authorKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="bg-white border border-[#F0D89A] rounded-2xl p-6"
              >
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-[#F97316] text-[#F97316]" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)', color: '#7C6A3A' }}>{t(testimonial.quoteKey)}</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={`https://ui-avatars.com/api/?name=${t(testimonial.authorKey)}&background=F97316&color=fff`}
                      alt={t(testimonial.authorKey)}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600, color: '#1C1400' }}>{t(testimonial.authorKey)}</div>
                    <div className="text-xs" style={{ fontFamily: 'var(--font-dm-sans)', color: '#9A7C4A' }}>{t(testimonial.roleKey)}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trusted By */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center"
          >
            <p className="mb-6 font-medium" style={{ fontFamily: 'var(--font-dm-sans)', color: '#9A7C4A', fontSize: '14px' }}>{t('landing.trustedBy')}</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {TRUSTED_BY.map((institution) => (
                <div
                  key={institution}
                  className="px-6 py-3 rounded-full bg-[#FFF0CC] border border-[#F0D89A] font-semibold text-sm transition-all hover:bg-[#F97316] hover:text-white cursor-pointer"
                  style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, color: '#B45309' }}
                >
                  {institution}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 lg:px-8 bg-[#1C1400]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold mb-4 text-sm text-white" style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>{t('landing.footer.product')}</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/dashboard" className="text-sm transition-colors hover:text-[#FBBF24]" style={{ fontFamily: 'var(--font-dm-sans)', color: '#9A7C4A' }}>
                    {t('landing.footer.dashboard')}
                  </Link>
                </li>
                <li>
                  <button onClick={scrollToFeatures} className="text-sm transition-colors hover:text-[#FBBF24]" style={{ fontFamily: 'var(--font-dm-sans)', color: '#9A7C4A' }}>
                    {t('landing.footer.features')}
                  </button>
                </li>
                <li>
                  <Link href="#" className="text-sm transition-colors hover:text-[#FBBF24]" style={{ fontFamily: 'var(--font-dm-sans)', color: '#9A7C4A' }}>
                    {t('landing.footer.pricing')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm text-white" style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>{t('landing.footer.resources')}</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-sm transition-colors hover:text-[#FBBF24]" style={{ fontFamily: 'var(--font-dm-sans)', color: '#9A7C4A' }}>
                    {t('landing.footer.blog')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm transition-colors hover:text-[#FBBF24]" style={{ fontFamily: 'var(--font-dm-sans)', color: '#9A7C4A' }}>
                    {t('landing.footer.support')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm text-white" style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>{t('landing.footer.community')}</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-sm transition-colors hover:text-[#FBBF24]" style={{ fontFamily: 'var(--font-dm-sans)', color: '#9A7C4A' }}>
                    {t('landing.footer.telegram')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm text-white" style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>{t('landing.footer.about')}</h4>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></span>
                <span className="font-bold text-base text-white" style={{ fontFamily: 'var(--font-sora)' }}>FlatMate</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)', color: '#9A7C4A' }}>
                {t('landing.footer.tagline')}
              </p>
            </div>
          </div>
          <div className="pt-8 border-t border-[#3D2E00] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm" style={{ fontFamily: 'var(--font-dm-mono)', fontWeight: 500, fontSize: '12px', color: '#5A4A2A' }}>
              {t('landing.footer.copyright')}
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-xs transition-colors hover:text-[#FBBF24]" style={{ fontFamily: 'var(--font-dm-sans)', color: '#9A7C4A' }}>
                {t('landing.footer.privacy')}
              </Link>
              <Link href="#" className="text-xs transition-colors hover:text-[#FBBF24]" style={{ fontFamily: 'var(--font-dm-sans)', color: '#9A7C4A' }}>
                {t('landing.footer.terms')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}