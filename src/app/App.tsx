import { HashRouter, Route, Routes } from 'react-router-dom';
import { Home } from '../pages/Home/Home';
import { NotFound } from '../pages/NotFound/NotFound';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}
