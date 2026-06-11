import {
  FOOTER_COPYRIGHT_APP,
  FOOTER_COPYRIGHT_LOGIN,
  FOOTER_LINKS_APP,
  FOOTER_LINKS_LOGIN,
} from '../constants';

function FooterLinks({ links, linkClassName }) {
  return (
    <>
      {links.map((link) => (
        <a key={link.href} href={link.href} className={linkClassName}>
          {link.label}
        </a>
      ))}
    </>
  );
}

/** @param {{ variant: 'login' | 'app' }} props */
function AppFooter({ variant = 'app' }) {
  if (variant === 'login') {
    return (
      <footer className="app-footer app-footer--login footer-shared w-full px-margin-mobile md:px-margin-desktop py-12 flex flex-col md:flex-row justify-between items-center gap-gutter bg-primary dark:bg-primary-container">
        <div className="flex flex-col gap-2">
          <h2 className="font-headline-lg text-headline-lg text-on-primary">BU</h2>
          <p className="font-body-md text-body-md text-on-primary/80 dark:text-on-primary-container/80">
            {FOOTER_COPYRIGHT_LOGIN}
          </p>
        </div>
        <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4">
          <FooterLinks
            links={FOOTER_LINKS_LOGIN}
            linkClassName="font-label-md text-label-md text-on-primary/80 dark:text-on-primary-container/80 hover:text-on-tertiary-container transition-colors"
          />
        </div>
      </footer>
    );
  }

  return (
    <footer className="app-footer app-footer--app footer-shared border-t border-primary-container flex flex-col md:flex-row justify-between items-center py-12 px-margin-mobile md:px-margin-desktop w-full mt-20 z-10 relative">
      <div className="container-shared flex flex-col md:flex-row justify-between w-full items-center">
        <div className="font-display-lg text-2xl mb-6 md:mb-0" style={{ fontFamily: 'var(--font-primary)' }}>
          Baekseok University
        </div>
        <nav className="flex flex-wrap gap-6 justify-center md:justify-end mb-6 md:mb-0 font-body-md text-base">
          <FooterLinks
            links={FOOTER_LINKS_APP}
            linkClassName="text-secondary-container hover:text-accent-gold transition-colors"
          />
        </nav>
        <div className="font-label-md text-sm text-secondary-container text-center md:text-right font-semibold">
          {FOOTER_COPYRIGHT_APP}
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;
