import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Size Passport",
  description: "Privacy Policy for the Size Passport Shopify App.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 font-poppins selection:bg-brand-lime selection:text-black pb-24">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between glass-panel !rounded-none !border-x-0 !border-t-0">
        <Link href="/" className="font-syne font-bold text-xl tracking-tight flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <span className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-brand-lime flex items-center justify-center text-white dark:text-black">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>
          Size Passport
        </Link>
      </header>

      {/* Content */}
      <main className="pt-32 px-6 md:px-12 max-w-4xl mx-auto">
        <h1 className="font-syne text-4xl md:text-5xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-sm md:text-base leading-relaxed">
          <p><strong>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></p>
          
          <p>
            This Privacy Policy describes how Size Passport ("we", "us", or "our") collects, uses, and shares your personal information when you install or use the Size Passport app (the "App") in connection with your Shopify-supported store.
          </p>

          <h2 className="text-2xl font-syne font-semibold mt-8 mb-4">1. Personal Information the App Collects</h2>
          <p>When you install the App, we are automatically able to access certain types of information from your Shopify account:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Store Information:</strong> We collect your shop URL, email address, store name, and basic configuration details to provide our service.</li>
            <li><strong>Product Information:</strong> We access your product data (titles, variants, IDs, images, and metafields) to allow you to configure size charts and AI recommendations.</li>
            <li><strong>Theme Information:</strong> We interact with your theme to display the Size Passport widget to your customers on the storefront.</li>
          </ul>

          <h2 className="text-2xl font-syne font-semibold mt-8 mb-4">2. Customer Data</h2>
          <p>
            When a customer interacts with the Size Passport widget on your storefront, we process the anonymous physical inputs they provide (such as height, weight, age, and fit preferences) strictly for the purpose of generating a size recommendation. 
            We do not collect or store Personally Identifiable Information (PII) such as customer names, email addresses, or payment details.
          </p>

          <h2 className="text-2xl font-syne font-semibold mt-8 mb-4">3. How Do We Use Your Personal Information?</h2>
          <p>We use the personal information we collect from you and your customers in order to provide the App's core functionality. This includes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Providing accurate size recommendations to your store visitors.</li>
            <li>Displaying size charts on your product pages.</li>
            <li>Providing you with analytics regarding the widget's usage and return prevention metrics.</li>
            <li>Communicating with you about the App, including customer support and updates.</li>
          </ul>

          <h2 className="text-2xl font-syne font-semibold mt-8 mb-4">4. Sharing Your Personal Information</h2>
          <p>
            We do not sell your data or your customers' data. We may share your Personal Information to comply with applicable laws and regulations, to respond to a subpoena, search warrant or other lawful request for information we receive, or to otherwise protect our rights.
          </p>
          <p>
            We use secure third-party hosting providers and databases to operate the App, all of which are compliant with standard data protection regulations.
          </p>

          <h2 className="text-2xl font-syne font-semibold mt-8 mb-4">5. Data Retention</h2>
          <p>
            When you install the App, we will maintain your Store Information and configuration settings for our records. If you uninstall the App, we will securely delete your data within 48 hours in compliance with Shopify's data retention requirements. 
          </p>

          <h2 className="text-2xl font-syne font-semibold mt-8 mb-4">6. Changes</h2>
          <p>
            We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons.
          </p>

          <h2 className="text-2xl font-syne font-semibold mt-8 mb-4">7. Contact Us</h2>
          <p>
            For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at 
            <a href="mailto:sizepassportai@gmail.com" className="text-emerald-600 dark:text-brand-lime ml-1 hover:underline">sizepassportai@gmail.com</a>.
          </p>
        </div>
      </main>

    </div>
  );
}
