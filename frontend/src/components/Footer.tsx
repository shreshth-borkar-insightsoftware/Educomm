export default function Footer() {
  const links = [
    { name: "About", href: "#" },
    { name: "Contact", href: "#" },
    { name: "FAQ", href: "#" },
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
  ];

  return (
    <footer className="border-t border-gray-800 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-sm text-gray-400">
            © 2026 EDUCOMM
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
