"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CheckCircle2, Ruler, BarChart3, Settings, Moon, Sun, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Testimonials3D } from "@/components/testimonials";
import { DotPattern } from "@/components/ui/dot-pattern";
import { HeroHumanBody } from "@/components/hero-human-body";
import { ROIDashboard } from "@/components/roi-dashboard";
import { cn } from "@/lib/utils";

export default function Home() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const yBackground = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const yHeroElements = useTransform(scrollYProgress, [0, 1], ["0%", "200px"]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <div className="min-h-screen relative overflow-hidden" ref={containerRef}>
      {/* Liquid Glass Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          style={{ y: yBackground }}
          className="absolute -top-1/4 -left-1/4 w-[150vw] h-[150vh] bg-gradient-radial from-brand-blue/20 dark:from-brand-blue/30 via-transparent to-transparent opacity-60 blur-3xl transition-colors duration-500"
        />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-brand-lime/20 dark:bg-brand-lime/10 rounded-full blur-[100px] transition-colors duration-500" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-[120px] transition-colors duration-500" />
      </div>

      {/* Full-width Dot Pattern for Hero */}
      <DotPattern
        width={24}
        height={24}
        cx={1}
        cy={1}
        cr={1.5}
        className={cn(
          "[mask-image:linear-gradient(to_bottom,white_40%,transparent_100%)]",
          "absolute inset-x-0 top-0 h-[110vh] opacity-40 dark:opacity-60 z-0"
        )}
      />

      {/* Centered Floating Navbar */}
      <nav className="fixed top-4 md:top-8 left-1/2 -translate-x-1/2 z-50 glass-panel rounded-full px-4 md:px-6 py-3 w-[95%] max-w-5xl flex items-center justify-between shadow-2xl transition-all">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
            <Image 
              src="/logo.jpg" 
              alt="Size Passport Logo" 
              fill
              className="rounded-full shadow-md object-cover border border-black/10 dark:border-white/20" 
            />
          </div>
          <motion.span 
            className="font-heading font-bold text-xl md:text-2xl tracking-tight hidden sm:flex"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 1 },
              visible: {
                opacity: 1,
                transition: {
                  delayChildren: 0.2,
                  staggerChildren: 0.04,
                },
              },
            }}
          >
            {"Size Passport".split("").map((char, index) => (
              <motion.span
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
                  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </motion.span>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <ShoppingBag className="w-3.5 h-3.5" />
            Built for Shopify
          </div>
          
          {mounted && (
            <button 
              onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle Theme"
            >
              {currentTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}

          <button className="bg-brand-lime text-slate-900 font-bold px-5 py-2 md:px-6 md:py-2.5 rounded-full hover:bg-brand-lime/90 transition-all flex items-center gap-2 text-sm md:text-base shadow-[0_0_15px_rgba(178,230,56,0.3)] hover:scale-105">
            <span className="hidden sm:inline">Get the App</span>
            <span className="sm:hidden">Get</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <main className="relative z-10 pt-28 md:pt-32 pb-24 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="min-h-[80vh] flex flex-col lg:flex-row items-center justify-between gap-12 relative">
          
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 relative z-10 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full glass-card border-brand-lime/30 text-emerald-700 dark:text-brand-lime font-bold text-xs md:text-sm shadow-sm">
              ✨ AI Fit Engine Live
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] mb-6 md:mb-8 text-slate-900 dark:text-white">
              CUT RETURNS <br className="hidden lg:block" />
              <span className="text-slate-600 dark:text-white/70 text-3xl sm:text-4xl md:text-6xl font-normal">by Up to</span>{" "}
              <span className="text-emerald-600 dark:text-brand-lime">28%</span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-300 font-light max-w-xl mx-auto lg:mx-0 mb-10 md:mb-12">
              Real-time analytics, higher cart conversions, and proven return prevention—all in one smart Shopify app.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 md:gap-4">
              <button className="w-full sm:w-auto bg-brand-lime text-slate-900 font-bold px-6 py-3.5 md:px-8 md:py-4 rounded-full text-base md:text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(178,230,56,0.3)] cursor-pointer">
                Start Free Trial
              </button>
              <button className="w-full sm:w-auto glass-panel px-6 py-3.5 md:px-8 md:py-4 rounded-full text-base md:text-lg font-bold text-slate-700 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer">
                View Live Demo
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="flex-1 relative w-full h-[400px] sm:h-[500px] lg:h-[600px] w-full"
            style={{ y: yHeroElements }}
          >
            {/* Animated Human Body Model */}
            <div className="relative mt-8 lg:mt-0 flex items-center justify-center min-h-[450px] lg:min-h-[550px] w-full max-w-[600px] mx-auto lg:max-w-none">
              <HeroHumanBody />
            </div>
            
            {/* Floating Highlight Card */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute -bottom-4 md:-bottom-8 -left-4 md:-left-12 glass-panel p-4 md:p-6 rounded-2xl w-56 md:w-64 shadow-2xl z-20 hidden sm:block"
            >
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1 font-semibold">Fit Match Confidence</p>
              <p className="text-3xl md:text-4xl font-bold text-emerald-600 dark:text-brand-lime mb-2">96.4%</p>
              <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 dark:bg-brand-lime w-[96.4%] h-full rounded-full" />
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">Seamless Integration. <br/>Intelligent Sizing.</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-base md:text-lg">Everything you need to give your customers the confidence to click "Add to Cart".</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: <Ruler className="w-7 h-7 md:w-8 md:h-8 text-emerald-600 dark:text-brand-lime" />,
                title: "Smart Fit Profiler",
                desc: "Interactive widget that collects shopper body measurements intuitively and normalizes sizes automatically."
              },
              {
                icon: <Settings className="w-7 h-7 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />,
                title: "Dynamic Theme Blocks",
                desc: "Deeply integrated storefront block. Customize alignment, scale, and colors right from Shopify Theme Editor."
              },
              {
                icon: <BarChart3 className="w-7 h-7 md:w-8 md:h-8 text-emerald-600 dark:text-emerald-400" />,
                title: "Return Analytics",
                desc: "Track AI Recommendations Shown, Assisted Cart Adds, and Estimated Returns Saved on a beautiful dashboard."
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
                whileHover={{ y: -5 }}
                className="glass-panel p-6 md:p-8 group hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl glass-card flex items-center justify-center mb-5 md:mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className="py-20 md:py-24 relative">
          <div className="absolute inset-0 bg-brand-blue/5 blur-3xl rounded-[100px] pointer-events-none" />
          
          <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="order-2 lg:order-1 text-center lg:text-left"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight text-slate-900 dark:text-white">
                Understand Your <br className="hidden lg:block"/><span className="text-gradient">Impact & ROI</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Our intuitive dashboard shows exactly how much money you're saving by preventing returns before they happen.
              </p>
              
              <ul className="space-y-4 md:space-y-5 mb-8 text-left max-w-md mx-auto lg:mx-0">
                {[
                  "One-click product synchronization via GraphQL",
                  "Automated size chart sorting & rules",
                  "Real-time event tracking across all Shopify themes"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 md:gap-4 text-slate-700 dark:text-slate-300 text-base md:text-lg font-medium">
                    <CheckCircle2 className="text-emerald-600 dark:text-brand-lime w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, rotateY: 5 }}
              whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative perspective-1000 order-1 lg:order-2"
            >
              <div className="glass-panel p-2 md:p-3 rounded-[24px] md:rounded-[32px] border-black/10 dark:border-white/20 shadow-2xl relative z-20 group">
                <div className="relative rounded-[16px] md:rounded-[20px] overflow-hidden border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-slate-900">
                  <ROIDashboard />
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 md:w-32 md:h-32 bg-emerald-500/20 dark:bg-brand-lime/20 blur-2xl rounded-full" />
              <div className="absolute -top-6 -left-6 w-32 h-32 md:w-40 md:h-40 bg-brand-blue/20 dark:bg-brand-blue/30 blur-2xl rounded-full" />
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="text-center mb-4 md:mb-8"
          >
            <div className="relative inline-block">
              {/* Hand-drawn Animated Heart */}
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                className="absolute -top-6 -left-2 md:-left-4 w-10 h-10 md:w-12 md:h-12 text-brand-lime -rotate-12 pointer-events-none z-20"
              >
                <motion.path
                  d="M50 80 C 10 50, 10 20, 30 10 C 45 5, 50 20, 50 20 C 50 20, 55 5, 70 10 C 90 20, 90 50, 50 80 Z"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                />
              </motion.svg>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white relative z-10">
                Loved by Merchants
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-base md:text-lg">Don't just take our word for it. See what others are saying.</p>
          </motion.div>

          <Testimonials3D />
        </section>

        {/* Pricing Section */}
        <section className="py-20 md:py-32 relative">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Left Column: Text */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="text-center lg:text-left"
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-900 dark:text-white leading-tight">
                Simple, <br className="hidden lg:block"/>Transparent <span className="text-gradient">Pricing</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0">
                One flat rate for complete access. No hidden fees, no usage limits, and no surprises. Start predicting the perfect fit for your shoppers today.
              </p>
            </motion.div>

            {/* Right Column: Pricing Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full max-w-md mx-auto lg:mr-0 lg:ml-auto relative perspective-1000"
            >
              {/* Enhanced Glow Effects behind pricing */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-brand-lime/40 to-emerald-400/40 dark:from-brand-lime/30 dark:to-emerald-500/30 blur-2xl md:blur-3xl rounded-[40px] transform rotate-6 scale-105 opacity-70 dark:opacity-100" />
              <div className="absolute inset-0 bg-brand-blue/20 dark:bg-brand-blue/40 blur-2xl rounded-[40px] transform -rotate-3 scale-110 opacity-60 dark:opacity-100" />
              
              <div className="glass-panel p-8 md:p-10 relative overflow-hidden text-center border-white/40 dark:border-white/20 z-10 bg-white/90 dark:bg-slate-900/60 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                <div className="absolute top-0 right-0 px-3 py-1.5 bg-emerald-500/10 dark:bg-brand-lime/10 rounded-bl-xl text-emerald-700 dark:text-brand-lime font-bold text-[10px] md:text-xs uppercase tracking-wider backdrop-blur-md border-b border-l border-white/20 dark:border-white/10">
                  Everything Included
                </div>
                
                <h3 className="text-xl md:text-2xl font-bold mb-2 text-slate-900 dark:text-white mt-2">Pro Plan</h3>
                <div className="flex items-center justify-center gap-1 mb-6 text-slate-900 dark:text-white">
                  <span className="text-2xl font-semibold mt-[-8px]">$</span>
                  <span className="text-5xl md:text-6xl font-bold tracking-tight">14.99</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium ml-1 text-sm md:text-base">/ month</span>
                </div>
                
                <ul className="space-y-4 mb-8 text-left">
                  {[
                    "Unlimited AI Size Recommendations",
                    "Smart Fit Profiler Widget",
                    "Advanced Return Analytics",
                    "Automated Product Sync",
                    "Premium Priority Support"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm md:text-base">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-brand-lime flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className="w-full bg-brand-lime text-slate-900 font-bold px-6 py-4 rounded-full text-base hover:scale-105 transition-transform shadow-[0_0_20px_rgba(178,230,56,0.4)]">
                  Start Free Trial
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-panel p-8 md:p-16 lg:p-24 text-center relative overflow-hidden rounded-[32px] md:rounded-[40px]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/10 to-emerald-500/10 dark:from-brand-blue/30 dark:to-brand-lime/10 pointer-events-none" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-slate-900 dark:text-white">Ready to stop losing sales to wrong sizes?</h2>
              <p className="text-base md:text-xl text-slate-600 dark:text-slate-300 mb-8 md:mb-10 leading-relaxed">
                Join modern Shopify merchants using AI to solve the apparel sizing problem once and for all. Setup takes less than 5 minutes.
              </p>
              <button className="w-full sm:w-auto bg-brand-lime text-slate-900 font-bold px-6 py-3.5 md:px-10 md:py-5 rounded-full text-base md:text-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(178,230,56,0.4)] cursor-pointer">
                Install on Shopify Now
              </button>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-black/10 dark:border-white/10 py-8 md:py-12 flex flex-col items-center justify-center text-center text-slate-500 text-xs md:text-sm glass-panel !rounded-none !border-x-0 !border-b-0 relative z-10 gap-3">
        <p>© {new Date().getFullYear()} Size Passport. All rights reserved. Built for Shopify.</p>
        <p className="font-medium">
          Contact us: <a href="mailto:sizepassportai@gmail.com" className="text-emerald-600 dark:text-brand-lime hover:underline cursor-pointer">sizepassportai@gmail.com</a>
        </p>
      </footer>
    </div>
  );
}
