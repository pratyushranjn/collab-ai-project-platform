import { Link } from "react-router-dom"

function Page404() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-red-500 px-6 text-center">
            <h4 className="text-2xl md:text-3xl font-semibold mb-3">404 - Page Not Found</h4>
            <Link
                to="/projects"
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
                Go to Home
            </Link>
        </div>
    )
}

export default Page404