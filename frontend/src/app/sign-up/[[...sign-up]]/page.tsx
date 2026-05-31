import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="dashboard-bg flex items-center justify-center">
      <div className="w-full max-w-md relative z-10">
        <SignUp
          appearance={{
            variables: {
              colorPrimary: '#a855f7',
              colorText: '#f1f5f9',
              colorTextSecondary: '#94a3b8',
              colorBackground: 'rgb(15 23 42 / 0.5)',
              // Brighter input background — was rgb(15 23 42 / 0.7), now slate-700/40-ish
              // so fields stand out clearly against the slate-900/50 card.
              colorInputBackground: 'rgb(51 65 85 / 0.4)',
              colorInputText: '#f1f5f9',
            },
            elements: {
              card: 'bg-slate-900/50 border border-slate-800 rounded-2xl shadow-xl',
              formButtonPrimary: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-sm normal-case',
              headerTitle: 'text-white',
              headerSubtitle: 'text-slate-400',
              // Brighter Google/social buttons — was bg-slate-800/50, now bg-slate-800/80.
              socialButtonsBlockButton: 'bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-white',
              // Brighter email/password input — was bg-slate-900/70, now bg-slate-800/60.
              formFieldInput: 'bg-slate-800/60 border border-slate-700/50 text-white placeholder:text-slate-400',
              footerActionLink: 'text-purple-400 hover:text-purple-300',
            },
          }}
        />
      </div>
    </div>
  );
}
