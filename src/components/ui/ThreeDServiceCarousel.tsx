'use client'
import { ArrowLeftCircle, ArrowRightCircle, Clock } from 'lucide-react'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import type { Service } from '../../types/service'

interface ThreeDServiceCarouselProps {
    services: Service[]
    itemCount?: 3 | 5
    autoplay?: boolean
    delay?: number
    pauseOnHover?: boolean
    className?: string
    getServiceIcon: (name: string) => React.ComponentType<{ className?: string }>
}

const EMBEDDED_CSS = `
.cascade-slider_container {
    position: relative;
    max-width: 1000px;
    margin: 0 auto;
    z-index: 20; 
    user-select: none;
    -webkit-user-select: none; 
    touch-action: pan-y;
    height: 360px;
    overflow: visible;
}

.cascade-slider_slides {
    position: relative;
    height: 100%;
    width: 100%;
}

.cascade-slider_item {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%) scale(0.3); 
    transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1); 
    opacity: 0;
    z-index: 1; 
    cursor: grab; 
    width: 280px;
    height: 290px;
}
.cascade-slider_item.now {
    cursor: default;
}
.cascade-slider_item:active {
    cursor: grabbing;
}

.cascade-slider_item.next {
    left: 50%;
    transform: translateY(-50%) translateX(-120%) scale(0.65);
    opacity: 0.85;
    z-index: 4; 
}
.cascade-slider_item.prev {
    left: 50%;
    transform: translateY(-50%) translateX(20%) scale(0.65);
    opacity: 0.85;
    z-index: 4; 
}
.cascade-slider_item.now {
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%) scale(1);
    opacity: 1;
    z-index: 5; 
}

.cascade-slider_arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 50%;
    cursor: pointer;
    z-index: 6; 
    transform: translate(0, -50%);
    width: 40px; 
    height: 40px; 
    transition: all 0.3s ease;
}

@media screen and (max-width: 575px) {
    .cascade-slider_arrow-left { 
        left: -10px; 
    }
    .cascade-slider_arrow-right { 
        right: -10px; 
    }
    .cascade-slider_item.next {
        transform: translateY(-50%) translateX(-110%) scale(0.6);
    }
    .cascade-slider_item.prev {
        transform: translateY(-50%) translateX(10%) scale(0.6);
    }
}
@media screen and (min-width: 576px) {
    .cascade-slider_arrow-left { left: -6%; }
    .cascade-slider_arrow-right { right: -6%; }
    .cascade-slider_item {
        width: 320px;
        height: 290px;
    }
}

.cascade-slider_item:not(.now) {
    filter: grayscale(0.4) opacity(0.7);
    cursor: pointer;
}
.cascade-slider_item:not(.now) .bg-white {
    pointer-events: none;
}

@media screen and (min-width: 768px) {
    .cascade-slider_item.next { transform: translateY(-50%) translateX(-125%) scale(0.7); }
    .cascade-slider_item.prev { transform: translateY(-50%) translateX(25%) scale(0.7); }
}
@media screen and (min-width: 991px) {
    .cascade-slider_item.next { transform: translateY(-50%) translateX(-120%) scale(0.7); z-index: 4; }
    .cascade-slider_item.prev { transform: translateY(-50%) translateX(20%) scale(0.7); z-index: 4; }
    .cascade-slider_item.next2 { transform: translateY(-50%) translateX(-160%) scale(0.45); z-index: 1; opacity: 0.45; }
    .cascade-slider_item.prev2 { transform: translateY(-50%) translateX(60%) scale(0.45); z-index: 2; opacity: 0.45; }
}
@media screen and (min-width: 1100px) {
    .cascade-slider_item.next { transform: translateY(-50%) translateX(-125%) scale(0.72); }
    .cascade-slider_item.prev { transform: translateY(-50%) translateX(25%) scale(0.72); }
    .cascade-slider_item.next2 { transform: translateY(-50%) translateX(-175%) scale(0.48); }
    .cascade-slider_item.prev2 { transform: translateY(-50%) translateX(75%) scale(0.48); }
}
`

const getSlideClasses = (index: number, activeIndex: number, total: number, visibleCount: 3 | 5): string => {
    const diff = index - activeIndex
    if (diff === 0) return 'now'
    if (diff === 1 || diff === -total + 1) return 'next'
    if (visibleCount === 5 && (diff === 2 || diff === -total + 2)) return 'next2'
    if (diff === -1 || diff === total - 1) return 'prev'
    if (visibleCount === 5 && (diff === -2 || diff === total - 2)) return 'prev2'
    return ''
}

export const ThreeDServiceCarousel: React.FC<ThreeDServiceCarouselProps> = ({
    services,
    itemCount = 5,
    autoplay = false,
    delay = 3,
    pauseOnHover = true,
    className = '',
    getServiceIcon,
}) => {
    const [activeIndex, setActiveIndex] = useState(0)
    const autoplayIntervalRef = useRef<number | null>(null)
    const total = services.length

    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const swipeThreshold = 50

    const navigate = useCallback((direction: 'next' | 'prev') => {
        setActiveIndex(current => {
            if (direction === 'next') {
                return (current + 1) % total
            } else {
                return (current - 1 + total) % total
            }
        })
    }, [total])

    const startAutoplay = useCallback(() => {
        if (autoplay && total > 1) {
            if (autoplayIntervalRef.current) {
                clearInterval(autoplayIntervalRef.current)
            }
            autoplayIntervalRef.current = window.setInterval(() => {
                navigate('next')
            }, delay * 1000)
        }
    }, [autoplay, delay, navigate, total])

    const stopAutoplay = useCallback(() => {
        if (autoplayIntervalRef.current) {
            clearInterval(autoplayIntervalRef.current)
            autoplayIntervalRef.current = null
        }
    }, [])

    useEffect(() => {
        startAutoplay()
        return () => { stopAutoplay() }
    }, [startAutoplay, stopAutoplay])

    const handleMouseEnter = () => {
        if (autoplay && pauseOnHover) {
            stopAutoplay()
        }
    }

    const handleExit = (e: React.MouseEvent) => {
        if (autoplay && pauseOnHover) {
            startAutoplay()
        }
        if (isDragging) {
            handleEnd(e.clientX)
        }
    }

    const handleStart = (clientX: number) => {
        setIsDragging(true)
        setStartX(clientX)
        stopAutoplay()
    }

    const handleEnd = (clientX: number) => {
        if (!isDragging) return

        const distance = clientX - startX

        if (Math.abs(distance) > swipeThreshold) {
            if (distance < 0) {
                navigate('next')
            } else {
                navigate('prev')
            }
        }

        setIsDragging(false)
        setStartX(0)
    }

    const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX)
    const onMouseUp = (e: React.MouseEvent) => {
        handleEnd(e.clientX)
        startAutoplay()
    }

    const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX)
    const onTouchEnd = (e: React.TouchEvent) => {
        handleEnd(e.changedTouches[0].clientX)
        startAutoplay()
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: EMBEDDED_CSS }} />

            <div
                className={`cascade-slider_container ${className} bg-transparent mt-10`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleExit}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                <div className="cascade-slider_slides">
                    {services.map((svc, index) => {
                        const IconComponent = getServiceIcon(svc.service_name)
                        return (
                            <div
                                key={svc.id || svc._id}
                                className={`cascade-slider_item ${getSlideClasses(index, activeIndex, total, itemCount)}`}
                                data-slide-number={index}
                                onClick={() => {
                                    if (index !== activeIndex) {
                                        setActiveIndex(index)
                                    }
                                }}
                            >
                                <div className="w-full h-full bg-white rounded-2xl p-6 ring-1 ring-gray-200/80 shadow-sm hover:shadow-md hover:ring-cyan-500/50 flex flex-col justify-between group">
                                    {/* Icon & Title */}
                                    <div>
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="p-3 bg-cyan-50 text-[#0ea5b7] rounded-xl group-hover:bg-[#0ea5b7] group-hover:text-white transition-colors duration-200 shrink-0">
                                                <IconComponent className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-bold text-slate-900 line-clamp-2 min-h-[44px]">
                                                    {svc.service_name}
                                                </h3>
                                                <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>{svc.duration_minutes} phút</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-xs text-slate-500 line-clamp-3 mb-4">
                                            {svc.description || 'Dịch vụ chăm sóc chuyên nghiệp theo tiêu chuẩn chất lượng cao của AutoWash.'}
                                        </p>
                                    </div>

                                    {/* Price and Action */}
                                    <div className="border-t border-gray-100 pt-4 flex items-center justify-between gap-4">
                                        <div>
                                            <span className="text-[10px] text-slate-400 block">Đơn giá từ</span>
                                            <span className="text-base font-bold tracking-tight text-[#0ea5b7]">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(svc.service_price)}
                                            </span>
                                        </div>
                                        <Link
                                            to="/bookings/new"
                                            className="rounded-lg bg-cyan-50 hover:bg-[#0ea5b7] hover:text-white px-3 py-2 text-center text-xs font-semibold text-[#0ea5b7] transition-colors duration-200"
                                        >
                                            Đặt lịch
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {total > 1 && (
                    <>
                        <span
                            className="cascade-slider_arrow cascade-slider_arrow-left rounded-full bg-slate-100 text-slate-600 p-2 hover:bg-cyan-500 hover:text-white hover:shadow-md transition-all duration-300 shadow-sm border border-slate-200/50"
                            onClick={(e) => { e.stopPropagation(); navigate('prev'); }}
                            data-action="prev"
                        >
                            <ArrowLeftCircle size={24} />
                        </span>
                        <span
                            className="cascade-slider_arrow cascade-slider_arrow-right rounded-full bg-slate-100 text-slate-600 p-2 hover:bg-cyan-500 hover:text-white hover:shadow-md transition-all duration-300 shadow-sm border border-slate-200/50"
                            onClick={(e) => { e.stopPropagation(); navigate('next'); }}
                            data-action="next"
                        >
                            <ArrowRightCircle size={24} />
                        </span>
                    </>
                )}
            </div>
        </>
    )
}

export default ThreeDServiceCarousel
