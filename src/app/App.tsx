import { HashRouter, Route, Routes } from 'react-router-dom';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { I18nProvider } from '../i18n';
import { Home } from '../pages/Home/Home';
import { NotFound } from '../pages/NotFound/NotFound';
import { NumberSequenceGrid } from '../pages/projects/number-sequence-grid';

export function App() {
  return (
    <I18nProvider>
      <HashRouter>
        <LanguageSwitcher />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects/number-sequence-grid" element={<NumberSequenceGrid />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </I18nProvider>
  );
}
