'use client'
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the Teacher Dashboard
          </p>
        </div>

        {/* Sign In Component */}
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-lg border border-gray-200 rounded-lg",
              formButtonPrimary:
                "bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm normal-case shadow-sm transition-colors w-full",
              footerActionLink:
                "text-blue-600 hover:text-blue-700 font-medium",
              formFieldInput:
                "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
              socialButtonsBlockButton:
                "border border-gray-300 hover:bg-gray-50",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  )
}