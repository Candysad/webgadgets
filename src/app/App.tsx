import { HashRouter, Route, Routes } from 'react-router-dom';
import { Home } from '../pages/Home/Home';
import { NotFound } from '../pages/NotFound/NotFound';
import { NumberSequenceGrid } from '../pages/projects/number-sequence-grid';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects/number-sequence-grid" element={<NumberSequenceGrid />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}
