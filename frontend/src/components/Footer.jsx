import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-surface border-t border-borderLight py-8 mt-auto">
      <div className="container mx-auto px-6 text-center text-textMuted">
        <p>&copy; {new Date().getFullYear()} BCT_MP Crowdfunding. All rights reserved.</p>
        <p className="text-sm mt-2">Decentralized, Transparent & Secure.</p>
      </div>
    </footer>
  );
};

export default Footer;
