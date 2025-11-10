import { useLocation } from 'react-router-dom';

export default function ErrorPage({ err: propErr }) {
  const location = useLocation();
  
  // 优先使用路由传递的 state，否则使用 props
  const err = location.state?.err || propErr;


  if (!err) {
    return (
      <div className="row">
        <div className="col-6 offset-3">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Unknown Error</h4>
            <p>No error message was provided.</p>
          </div>
        </div>
      </div>
    );
  }

  const isProduction = import.meta.env.MODE === "production";

  return (
    <div className="row">
      <div className="col-6 offset-3">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">{err.message}</h4>
          {!isProduction && err.stack && (
            <p style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {err.stack}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}