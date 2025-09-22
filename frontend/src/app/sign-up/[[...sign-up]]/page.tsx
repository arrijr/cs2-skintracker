import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="dashboard-bg flex items-center justify-center">
      <div className="w-full max-w-md relative z-10">
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
              card: 'bg-gray-900 border border-gray-700',
              headerTitle: 'text-white',
              headerSubtitle: 'text-gray-400',
              socialButtonsBlockButton: 'bg-gray-800 border-gray-600 hover:bg-gray-700',
              formFieldInput: 'bg-gray-800 border-gray-600 text-white',
              footerActionLink: 'text-blue-400 hover:text-blue-300',
            },
          }}
        />
      </div>
    </div>
  );
}
