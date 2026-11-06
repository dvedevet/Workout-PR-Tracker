import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ZoomIn, ZoomOut } from "lucide-react"

const VIEW = 240 
const OUT = 256 

function PhotoEditor({ file, isSaving, error, onCancel, onSave }) {
    const [img, setImg] = useState(null)
    const [loadError, setLoadError] = useState(null)
    const [zoom, setZoom] = useState(1)
    const [pos, setPos] = useState({ x: 0, y: 0 })
    const drag = useRef(null)

    useEffect(() => {
        let cancelled = false
        const url = URL.createObjectURL(file)
        const image = new Image()

        image.onload = () => {
            if (cancelled) return
            const base = VIEW / Math.min(image.naturalWidth, image.naturalHeight)
            setImg(image)
            setZoom(1)
            setPos({
                x: (VIEW - image.naturalWidth * base) / 2,
                y: (VIEW - image.naturalHeight * base) / 2,
            })
        }
        image.onerror = () => {
            if (!cancelled)
                setLoadError("Тази снимка не може да се отвори. Опитай JPEG, PNG или WebP.")
        }
        image.src = url

        return () => {
            cancelled = true
            URL.revokeObjectURL(url)
        }
    }, [file])

    const nw = img ? img.naturalWidth : 1
    const nh = img ? img.naturalHeight : 1
    const base = VIEW / Math.min(nw, nh)
    const scale = base * zoom 
    const zoomPercent = ((zoom - 1) / 2) * 100 

    function clamp(p, sc) {
        return {
            x: Math.min(0, Math.max(VIEW - nw * sc, p.x)),
            y: Math.min(0, Math.max(VIEW - nh * sc, p.y)),
        }
    }

    function handlePointerDown(e) {
        if (!img) return
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = { startX: e.clientX, startY: e.clientY, origin: pos }
    }

    function handlePointerMove(e) {
        if (!drag.current) return
        const { startX, startY, origin } = drag.current
        setPos(
            clamp(
                { x: origin.x + e.clientX - startX, y: origin.y + e.clientY - startY },
                scale
            )
        )
    }

    function handlePointerUp() {
        drag.current = null
    }

    function handleZoom(e) {
        const next = Number(e.target.value)
        const newScale = base * next
        const cx = (VIEW / 2 - pos.x) / scale
        const cy = (VIEW / 2 - pos.y) / scale
        setZoom(next)
        setPos(clamp({ x: VIEW / 2 - cx * newScale, y: VIEW / 2 - cy * newScale }, newScale))
    }

    function handleSave() {
        if (!img || isSaving) return

        const canvas = document.createElement("canvas")
        canvas.width = OUT
        canvas.height = OUT
        const ctx = canvas.getContext("2d")
        ctx.fillStyle = "#ffffff" 
        ctx.fillRect(0, 0, OUT, OUT)
        ctx.drawImage(img, -pos.x / scale, -pos.y / scale, VIEW / scale, VIEW / scale, 0, 0, OUT, OUT)

        onSave(canvas.toDataURL("image/jpeg", 0.85))
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
                <h3 className="mb-5 text-center text-lg font-bold text-sky-900">
                    Нагласи снимката
                </h3>

                {loadError ? (
                    <p className="py-10 text-center text-sm text-red-500">{loadError}</p>
                ) : (
                    <>
                        <div
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerUp}
                            className="relative mx-auto cursor-grab touch-none overflow-hidden rounded-full bg-slate-200 ring-4 ring-sky-100 active:cursor-grabbing"
                            style={{ width: VIEW, height: VIEW }}
                        >
                            {img && (
                                <img
                                    src={img.src}
                                    alt=""
                                    draggable={false}
                                    className="pointer-events-none absolute max-w-none select-none"
                                    style={{
                                        width: nw * scale,
                                        height: nh * scale,
                                        left: pos.x,
                                        top: pos.y,
                                    }}
                                />
                            )}
                        </div>

                        <div className="mt-6 flex items-center gap-3 px-1">
                            <ZoomOut size={18} className="shrink-0 text-sky-400" />
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="0.01"
                                value={zoom}
                                onChange={handleZoom}
                                disabled={!img}
                                aria-label="Увеличение"
                                style={{
                                    background: `linear-gradient(to right, #0ea5e9 ${zoomPercent}%, #e0f2fe ${zoomPercent}%)`,
                                }}
                                className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none disabled:opacity-50 [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-sky-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-sky-500 [&::-moz-range-thumb]:shadow-md"
                            />
                            <ZoomIn size={18} className="shrink-0 text-sky-400" />
                        </div>
                    </>
                )}

                {error && <p className="mt-3 text-center text-sm text-red-500">{error}</p>}

                <div className="mt-5 flex justify-center gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
                    >
                        Отказ
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!img || isSaving}
                        className="rounded-xl bg-sky-500 px-5 py-2 text-sm font-medium text-white shadow transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSaving ? "Записване..." : "Запази снимката"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default PhotoEditor