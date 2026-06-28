import { useEffect, useRef } from 'react'

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => { })
    }
  }, [])

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black text-white">
      <video
        ref={videoRef}
        className="absolute inset-0 z-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        src="https://cdn.pixabay.com/video/2023/10/12/184734-873923034_large.mp4"
      />

      <div className="absolute inset-0 z-[1] bg-black/45" />
      <div className="absolute inset-0 z-[2] bg-[radial-gradient(circle_at_24%_26%,rgba(170, 161, 161, 0.08),transparent_28%),radial-gradient(circle_at_74%_18%,rgba(214, 207, 207, 0.06),transparent_24%),linear-gradient(to_bottom,rgba(0,0,0,0.12),rgba(0,0,0,0.72))]" />

      <div className="relative z-10 h-full w-full">
        <h1
          className="absolute left-[clamp(16px,2.5vw,40px)] top-[18%] text-[clamp(45px,8.7vw,120px)] font-sans font-extrabold three-d-heading leading-[0.9] tracking-[-0.05em] text-white opacity-0 animate-fadeUp [animation-delay:0.1s]"
        >
          RỬA XE
        </h1>

        <h1
          className="absolute right-[clamp(16px,2.5vw,40px)] top-[38%] text-right text-[clamp(48px,8.7vw,120px)] font-sans font-extrabold three-d-heading leading-[0.9] tracking-[-0.05em] text-white opacity-0 animate-fadeUp [animation-delay:0.28s]"
        >
          TÍCH ĐIỂM
        </h1>

        <h1
          className="absolute left-[clamp(16px,5vw,28%)] top-[58%] text-[clamp(48px,8.7vw,120px)] font-sans font-extrabold three-d-heading leading-[0.9] tracking-[-0.05em] text-white opacity-0 animate-fadeUp [animation-delay:0.46s]"
        >
          NHẬN ƯU ĐÃI
        </h1>

        <p
          className="absolute left-[clamp(24px,2.5vw,40px)] top-[46%] max-w-[240px] font-sans text-[15px] leading-[1.4] text-white/90 opacity-0 animate-fadeUp [animation-delay:0.38s]"
        >
          Đặt lịch, theo dõi điểm thưởng và nhận ưu đãi độc quyền theo hạng thành viên trong một ứng dụng duy nhất.
        </p>

        <div
          className="absolute right-[clamp(24px,6vw,96px)] top-[14%] opacity-0 animate-fadeUp [animation-delay:0.55s]"
        >
          <div className="flex items-center justify-end gap-3">
            <div
              className="hidden h-px w-24 rotate-[20deg] bg-white/40 md:block"
            />
            <span className="text-[clamp(36px,4.5vw,56px)] font-sans font-semibold tracking-[-0.03em] text-white">+65k</span>
          </div>
          <p className="mt-1 text-right text-[clamp(11px,1.1vw,14px)] text-white/70">khách hàng đang sử dụng</p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-black" />

        <div
          className="absolute left-[clamp(24px,5vw,80px)] bottom-[clamp(80px,6vw,96px)] opacity-0 animate-fadeUp [animation-delay:0.65s]"
        >
          <div className="flex items-center gap-3">
            <span className="text-[clamp(36px,4.5vw,56px)] font-sans font-semibold tracking-[-0.03em] text-white">+1.5b</span>
            <div
              className="hidden h-px w-24 rotate-[-20deg] bg-white/40 md:block"
            />
          </div>
          <p className="mt-1 text-[clamp(11px,1.1vw,14px)] text-white/70">lít nước được tiết kiệm</p>
        </div>

        <div
          className="absolute right-[clamp(24px,5vw,80px)] bottom-[clamp(64px,5vw,80px)] opacity-0 animate-fadeUp [animation-delay:0.72s]"
        >
          <div className="flex items-center justify-end gap-3">
            <div
              className="hidden h-px w-24 rotate-[-20deg] bg-white/40 md:block"
            />
            <span className="text-[clamp(36px,4.5vw,56px)] font-sans font-semibold tracking-[-0.03em] text-white">+300k</span>
          </div>
          <p className="mt-1 text-right text-[clamp(11px,1.1vw,14px)] text-white/70">lượt đặt lịch</p>
        </div>
      </div>
    </section>
  )
}
