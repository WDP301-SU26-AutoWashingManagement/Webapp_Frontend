export default function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950">
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400"
        aria-label="Đang tải"
      />
    </div>
  )
}
