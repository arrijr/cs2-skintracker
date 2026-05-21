import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="dashboard-bg flex items-center justify-center">
      <div className="w-full max-w-md relative z-10">
        <SignIn
          appearance={{
            variables: {
              colorPrimary: '#a855f7',
              colorText: '#f1f5f9',
              colorTextSecondary: '#94a3b8',
              colorBackground: 'rgb(15 23 42 / 0.5)',
              colorInputBackground: 'rgb(15 23 42 / 0.7)',
              colorInputText: '#f1f5f9',
            },
            elements: {
              card: 'bg-slate-900/50 border border-slate-800 rounded-2xl shadow-xl',
              formButtonPrimary: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-sm normal-case',
              headerTitle: 'text-white',
              headerSubtitle: 'text-slate-400',
              socialButtonsBlockButton: 'bg-slate-800/50 border-slate-700 hover:bg-slate-700',
              formFieldInput: 'bg-slate-900/70 border-slate-700 text-white',
              footerActionLink: 'text-fuchsia-400 hover:text-fuchsia-300',
            },
          }}
        />
      </div>
    </div>
  );
}
