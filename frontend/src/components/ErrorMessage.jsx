function ErrorMessage({ children, className = "" }) {
    if (!children) return null

    return (
        <p
            role="alert"
            className={`rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600 ${className}`}
        >
            {children}
        </p>
    )
}

export default ErrorMessage