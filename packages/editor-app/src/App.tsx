import { createBrowserRouter } from 'react-router-dom';
import AuthRedirectPage from './components/AuthRedirectPage';
import MainEditor from './components/MainEditor';
import { RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainEditor />,
    },
    {
        path: "/auth-redirect",
        element: <AuthRedirectPage />,
    },
]);

const App = () => (
    <RouterProvider router={router} />
);

export default App;


