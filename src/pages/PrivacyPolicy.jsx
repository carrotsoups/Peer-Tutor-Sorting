import React from 'react';
import '../css/App.css'; // Using existing App.css for consistent styling

export function PrivacyPolicy() {
  return (
    <div className="container">
      <div className="content">
        <h1>Privacy Policy</h1>

        <h2>Information We Collect</h2>
        <p>
          We collect information you provide directly to us, such as when you create an account,
          use our services, or contact us for support. This may include your name, email address,
          and any data you upload to our application.
        </p>

        <h2>How We Use Your Information</h2>
        <p>
          We use the information we collect to provide, maintain, and improve our services,
          process transactions, send you technical notices and support messages, and respond
          to your comments and questions.
        </p>

        <h2>Information Sharing</h2>
        <p>
          We do not sell, trade, or otherwise transfer your personal information to third parties
          without your consent, except as described in this policy. We may share your information
          in the following circumstances:
        </p>
        <ul>
          <li>With service providers who help us operate our application</li>
          <li>To comply with legal obligations</li>
          <li>To protect our rights and prevent fraud</li>
        </ul>

        <h2>Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal information against
          unauthorized access, alteration, disclosure, or destruction. However, no method of
          transmission over the internet is 100% secure.
        </p>

        <h2>Google Integration</h2>
        <p>
          Our application integrates with Google services including Google OAuth for authentication
          and Google Drive for file access. When you use these features, Google's privacy policy
          also applies to the handling of your data by Google.
        </p>

        <h2>Data Retention</h2>
        <p>
          We retain your personal information for as long as necessary to provide our services
          and fulfill the purposes outlined in this privacy policy, unless a longer retention
          period is required by law.
        </p>

        <h2>Your Rights</h2>
        <p>
          You have the right to access, update, or delete your personal information. You may
          also request that we limit the processing of your information in certain circumstances.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. We will notify you of any changes
          by posting the new policy on this page and updating the "Last updated" date.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions about this privacy policy, please contact us at:
          privacy@peertutorsorting.com
        </p>

        <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>
      </div>
    </div>
  );
}