import { createBrowserRouter } from "react-router-dom";

export const appRouter = createBrowserRouter([
    {
        path: "/",
        element: <h1>Home</h1>,
        children: [
            {
                index: true,
                element: <h1>Home</h1>
            }
        ]
    }
])