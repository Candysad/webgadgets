import { HashRouter, Route, Routes } from 'react-router-dom';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { I18nProvider } from '../i18n';
import { Home } from '../pages/Home/Home';
import { NotFound } from '../pages/NotFound/NotFound';
import { NumberSequenceGrid } from '../pages/projects/Schulte-Grid';

export function App() {
  return (
    <I18nProvider>
      <HashRouter>
        <LanguageSwitcher />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Schulte-Grid" element={<NumberSequenceGrid />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </I18nProvider>
  );
}
