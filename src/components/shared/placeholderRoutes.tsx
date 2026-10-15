import { Route } from 'react-router-dom';
import type { NavItem } from '../../lib/portals';
import { ScreenPlaceholder } from './ScreenPlaceholder';

/** Rotas provisórias para as telas da navegação que ainda não foram construídas (ignora a inicial). */
export function placeholderRoutes(items: NavItem[], eyebrow?: string) {
  return items
    .filter((item) => item.path !== '')
    .map((item) => (
      <Route
        key={item.path}
        path={item.path}
        element={<ScreenPlaceholder title={item.label} eyebrow={eyebrow} summary={item.summary} />}
      />
    ));
}
