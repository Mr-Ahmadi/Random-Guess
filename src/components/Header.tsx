import { Logo } from './Logo';
import './Header.css';

export function Header() {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-logo-section">
          <Logo size="sm" />
          <h1 className="header-title">Word Guess</h1>
        </div>
      </div>
    </header>
  );
}
