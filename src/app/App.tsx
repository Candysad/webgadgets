import { HashRouter, Route, Routes } from 'react-router-dom';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { I18nProvider } from '../i18n';
import { Home } from '../pages/Home/Home';
import { NotFound } from '../pages/NotFound/NotFound';
import { ColorDifference } from '../pages/projects/Color-Difference';
import { EatTonight } from '../pages/projects/Eat-Tonight';
import { MagicConch } from '../pages/projects/Magic-Conch';
import { JpExchange } from '../pages/projects/jp-exchange';
import { ReactionTime } from '../pages/projects/Reaction-Time';
import { NumberSequenceGrid } from '../pages/projects/Schulte-Grid';
import { Casino } from '../pages/projects/casino';

export function App() {
  return (
    <I18nProvider>
      <HashRouter>
        <LanguageSwitcher />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Schulte-Grid" element={<NumberSequenceGrid />} />
          <Route path="/Color-Difference" element={<ColorDifference />} />
          <Route path="/Reaction-Time" element={<ReactionTime />} />
          <Route path="/Eat-Tonight" element={<EatTonight />} />
          <Route path="/Magic-Conch" element={<MagicConch />} />
          <Route path="/jp-exchange" element={<JpExchange />} />
          <Route path="/Casino/*" element={<Casino />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </I18nProvider>
  );
}
