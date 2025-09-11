'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Github, ExternalLink } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Documentation', href: '/docs' },
  { name: 'Examples', href: '/examples' },
  { name: 'Best Practices', href: '/best-practices' },
  { name: 'Templates', href: '/templates' },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-secondary-200 bg-white/80 backdrop-blur-md dark:border-secondary-800 dark:bg-secondary-950/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link
            href="/"
            className="group -m-1.5 flex items-center p-1.5 transition-transform hover:scale-105"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
              <span className="text-sm font-bold text-white">PA</span>
            </div>
            <span className="ml-2 text-xl font-bold text-secondary-900 dark:text-white">
              QA Showcase
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <ThemeToggle className="mr-2" />
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-secondary-700 dark:text-secondary-200"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'text-sm font-semibold leading-6 transition-colors hover:text-primary-600 dark:hover:text-primary-400',
                pathname === item.href
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-secondary-900 dark:text-secondary-100'
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-3">
          <a
            href="https://github.com/pa-qa/testing-showcase"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-200 dark:hover:bg-secondary-700"
          >
            <Github className="h-4 w-4" />
            GitHub
            <ExternalLink className="h-3 w-3" />
          </a>
          <ThemeToggle />
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={cn(
        'lg:hidden',
        mobileMenuOpen ? 'fixed inset-0 z-50' : 'hidden'
      )}>
        <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-secondary-900/10 dark:bg-secondary-950">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="-m-1.5 flex items-center p-1.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
                <span className="text-sm font-bold text-white">PA</span>
              </div>
              <span className="ml-2 text-xl font-bold text-secondary-900 dark:text-white">
                QA Showcase
              </span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-secondary-700 dark:text-secondary-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-secondary-500/10 dark:divide-secondary-500/20">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      '-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 transition-colors hover:bg-secondary-50 dark:hover:bg-secondary-800',
                      pathname === item.href
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-secondary-900 dark:text-secondary-100'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6">
                <a
                  href="https://github.com/pa-qa/testing-showcase"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="-mx-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-secondary-900 hover:bg-secondary-50 dark:text-secondary-100 dark:hover:bg-secondary-800"
                >
                  <Github className="h-5 w-5" />
                  View on GitHub
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}