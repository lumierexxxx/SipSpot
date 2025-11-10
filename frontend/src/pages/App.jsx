import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';

// 页面组件
import ErrorPage from './ErrorPage';
import HomePage from './HomePage';
import Register from './Register';
import Login from './Login';
import Index from './cafes/Index';
import ShowCafe from './cafes/ShowCafe';
import NewCafe from './cafes/NewCafe';
import EditCafe from './cafes/EditCafe';

// ✅ 导航栏和页脚
import Navbar from './Navbar';

// ✅ Layout：统一布局 + 导航栏
function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 全局导航栏（玻璃态，固定顶部） */}
      <Navbar />

      {/* 主体内容：padding 让页面不被 Navbar 覆盖 */}
      <main className="flex-1 pt-20 animate-fade-in">
        <Outlet />
      </main>

      {/* ✅ 可选：全局页脚 */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8 mt-auto">
        <div className="container-custom text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">☕</span>
            </div>
            <span className="text-xl font-bold">SipSpot</span>
          </div>
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} SipSpot. Discover amazing coffee spots.
          </p>
        </div>
      </footer>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { 
        index: true, 
        element: <HomePage /> 
      },
      { 
        path: 'register', 
        element: <Register /> 
      },
      { 
        path: 'login', 
        element: <Login /> 
      },
      
      // ✅ Cafes 路由
      { 
        path: 'cafes', 
        element: <Index /> 
      },
      { 
        path: 'cafes/new', 
        element: <NewCafe /> 
      },
      { 
        path: 'cafes/:id', 
        element: <ShowCafe /> 
      },
      { 
        path: 'cafes/:id/edit', 
        element: <EditCafe /> 
      },
    ]
  },
  
  // ✅ 404 兜底路由
  {
    path: '*',
    element: <ErrorPage />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}