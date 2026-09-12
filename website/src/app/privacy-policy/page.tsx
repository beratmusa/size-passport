import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Privacy Policy | Size Passport",
  description: "Privacy Policy for the Size Passport Shopify App.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FDFDFD] dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 font-poppins selection:bg-brand-lime selection:text-black pb-24">
      
      {/* Liquid Glass Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-[150vw] h-[150vh] bg-gradient-radial from-brand-blue/20 dark:from-brand-blue/30 via-transparent to-transparent opacity-60 blur-3xl" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-brand-lime/20 dark:bg-brand-lime/10 rounded-full blur-[100px]" />
      </div>

      {/* Centered Floating Navbar (Like Homepage) */}
      <nav className="fixed top-4 md:top-8 left-1/2 -translate-x-1/2 z-50 glass-panel rounded-full px-4 md:px-6 py-3 w-[95%] max-w-5xl flex items-center justify-between shadow-2xl transition-all">
        <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity">
          <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
            <Image 
              src="/logo.jpg" 
              alt="Size Passport Logo" 
              fill
              className="rounded-full shadow-md object-cover border border-black/10 dark:border-white/20" 
            />
          </div>
          <span className="font-heading font-bold text-xl md:text-2xl tracking-tight hidden sm:flex">
            Size Passport
          </span>
        </Link>
        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/" className="text-sm font-medium hover:underline text-slate-600 dark:text-slate-300">
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 pt-40 px-6 md:px-12 max-w-4xl mx-auto">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-sm md:text-base leading-relaxed font-sans">
          <p><strong>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></p>
          
          <p>
            This Privacy Policy describes how Size Passport ("we", "us", or "our") collects, uses, and shares your personal information when you install or use the Size Passport app (the "App") in connection with your Shopify-supported store.
          </p>

          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">1. Personal Information the App Collects</h2>
          <p>When you install the App, we are automatically able to access certain types of information from your Shopify account:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Store Information:</strong> We collect your shop URL, email address, store name, and basic configuration details to provide our service.</li>
            <li><strong>Product Information:</strong> We access your product data (titles, variants, IDs, images, and metafields) to allow you to configure size charts and AI recommendations.</li>
            <li><strong>Theme Information:</strong> We interact with your theme to display the Size Passport widget to your customers on the storefront.</li>
          </ul>

          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">2. Customer Data</h2>
          <p>
            When a customer interacts with the Size Passport widget on your storefront, we process the anonymous physical inputs they provide (such as height, weight, age, and fit preferences) strictly for the purpose of generating a size recommendation. 
            We do not collect or store Personally Identifiable Information (PII) such as customer names, email addresses, or payment details.
          </p>

          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">3. How Do We Use Your Personal Information?</h2>
          <p>We use the personal information we collect from you and your customers in order to provide the App's core functionality. This includes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Providing accurate size recommendations to your store visitors.</li>
            <li>Displaying size charts on your product pages.</li>
            <li>Providing you with analytics regarding the widget's usage and return prevention metrics.</li>
            <li>Communicating with you about the App, including customer support and updates.</li>
          </ul>

          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">4. Sharing Your Personal Information</h2>
          <p>
            We do not sell your data or your customers' data. We may share your Personal Information to comply with applicable laws and regulations, to respond to a subpoena, search warrant or other lawful request for information we receive, or to otherwise protect our rights.
          </p>
          <p>
            We use secure third-party hosting providers and databases to operate the App, all of which are compliant with standard data protection regulations.
          </p>

          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">5. Data Retention</h2>
          <p>
            When you install the App, we will maintain your Store Information and configuration settings for our records. If you uninstall the App, we will securely delete your data within 48 hours in compliance with Shopify's data retention requirements. 
          </p>

          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">6. Changes</h2>
          <p>
            We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons.
          </p>

          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">7. Contact Us</h2>
          <p>
            For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at 
            <a href="mailto:sizepassportai@gmail.com" className="text-emerald-600 dark:text-brand-lime ml-1 hover:underline">sizepassportai@gmail.com</a>.
          </p>
        </div>
      </main>

    </div>
  );
}
