import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  usePageTitle(t('pageNotFound') || '404');

  return (
    <div className="not-found-page">
      <div className="not-found-bg-animation">
        <div className="not-found-circle not-found-circle-1"></div>
        <div className="not-found-circle not-found-circle-2"></div>
        <div className="not-found-circle not-found-circle-3"></div>
      </div>

      <div className="not-found-content">
        <div className="not-found-illustration">
          <div className="not-found-icon-wrapper">
            <Search size={64} className="not-found-search-icon" />
          </div>
          <div className="not-found-floating-elements">
            <div className="floating-element floating-element-1">?</div>
            <div className="floating-element floating-element-2">404</div>
            <div className="floating-element floating-element-3">!</div>
          </div>
        </div>

        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">
          {t('pageNotFound') || 'Page Not Found'}
        </h2>
        <p className="not-found-message">
          {t('notFoundMessage') || 'The page you\'re looking for doesn\'t exist or has been moved.'}
        </p>

        <div className="not-found-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/')}
          >
            <Home size={20} />
            {t('goHome') || 'Go Home'}
          </button>
          <button
            className="btn btn-outline btn-lg"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
            {t('goBack') || 'Go Back'}
          </button>
        </div>
      </div>
    </div>
  );
}
